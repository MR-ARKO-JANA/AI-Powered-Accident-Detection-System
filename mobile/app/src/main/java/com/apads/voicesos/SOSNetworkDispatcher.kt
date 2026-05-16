package com.apads.voicesos

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Log
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/**
 * SOSNetworkDispatcher
 *
 * Handles SOS payload delivery to the APADS backend.
 *
 * Pipeline:
 *   1. Get GPS coordinates via FusedLocationProvider
 *   2. Build JSON payload (domain, transcript, confidence, coordinates, deviceId)
 *   3. POST to /api/sos
 *   4. If network is down → enqueue in SQLite via OfflineQueueDB
 *   5. Recovery daemon checks every 5 seconds and flushes queued alerts
 *
 * This is the mobile equivalent of the Python AI service's
 * report_accident_to_backend() + recovery_daemon() functions.
 */
class SOSNetworkDispatcher(private val context: Context) {

    companion object {
        const val TAG = "SOSNetworkDispatcher"
        val BACKEND_URL = BuildConfig.BACKEND_URL + "/api/sos"
        val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .writeTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    private val offlineQueue = OfflineQueueDB(context)
    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)
    private val deviceId: String = android.provider.Settings.Secure.getString(
        context.contentResolver,
        android.provider.Settings.Secure.ANDROID_ID
    ) ?: "unknown_device"

    // ── Recovery Daemon ──────────────────────────────────────────────
    private val recoveryExecutor: ScheduledExecutorService = Executors.newSingleThreadScheduledExecutor()

    init {
        // Start the recovery daemon — flushes offline queue every 5 seconds
        recoveryExecutor.scheduleWithFixedDelay({
            flushOfflineQueue()
        }, 10, 5, TimeUnit.SECONDS)

        Log.i(TAG, "✅ Network Dispatcher initialized. Recovery daemon started.")
    }

    /**
     * Dispatch an SOS alert. Gets GPS, builds payload, sends to backend.
     * Falls back to offline queue on network failure.
     */
    fun dispatchSOS(domain: String, transcript: String, confidence: Float) {
        Log.i(TAG, "🆘 Dispatching SOS: domain=$domain, confidence=$confidence")

        // Get current GPS location (with fallback)
        getLastKnownLocation { location ->
            val lat = location?.latitude ?: 0.0
            val lng = location?.longitude ?: 0.0

            val payload = JSONObject().apply {
                put("domain", domain)
                put("transcript", transcript)
                put("confidence", confidence.toDouble())
                put("coordinates", JSONObject().apply {
                    put("lat", lat)
                    put("lng", lng)
                })
                put("location", if (lat != 0.0) "GPS: $lat, $lng" else "Location unavailable")
                put("deviceId", deviceId)
            }

            sendToBackend(payload)
        }
    }

    // ── GPS ──────────────────────────────────────────────────────────

    private fun getLastKnownLocation(callback: (Location?) -> Unit) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Log.w(TAG, "Location permission not granted. Sending SOS without GPS.")
            callback(null)
            return
        }

        try {
            val cancellation = CancellationTokenSource()
            fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                cancellation.token
            ).addOnSuccessListener { location ->
                if (location != null) {
                    Log.i(TAG, "📍 GPS: ${location.latitude}, ${location.longitude}")
                } else {
                    Log.w(TAG, "GPS returned null — using fallback")
                }
                callback(location)
            }.addOnFailureListener { e ->
                Log.e(TAG, "GPS error: ${e.message}")
                callback(null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Location service error: ${e.message}")
            callback(null)
        }
    }

    // ── HTTP Dispatch ────────────────────────────────────────────────

    private fun sendToBackend(payload: JSONObject) {
        if (!isNetworkAvailable()) {
            Log.w(TAG, "⚠️ No network — queuing SOS offline")
            offlineQueue.enqueue(payload.toString())
            return
        }

        val body = payload.toString().toRequestBody(JSON_MEDIA_TYPE)
        val request = Request.Builder()
            .url(BACKEND_URL)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("X-SOS-Source", "voice_sos_android")
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (it.isSuccessful) {
                        Log.i(TAG, "✅ SOS delivered to backend! Status: ${it.code}")
                    } else {
                        Log.e(TAG, "❌ Backend rejected SOS: ${it.code} — ${it.body?.string()}")
                        // Queue for retry on server errors (5xx)
                        if (it.code >= 500) {
                            offlineQueue.enqueue(payload.toString())
                        }
                    }
                }
            }

            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "⚠️ Network error sending SOS: ${e.message}")
                Log.i(TAG, "💾 Queuing SOS to offline database...")
                offlineQueue.enqueue(payload.toString())
            }
        })
    }

    // ── Recovery Daemon (Flush Offline Queue) ────────────────────────

    private fun flushOfflineQueue() {
        if (!isNetworkAvailable()) return

        val pending = offlineQueue.getPending()
        if (pending.isEmpty()) return

        Log.i(TAG, "🔄 Recovery daemon: flushing ${pending.size} offline SOS alerts...")

        for ((id, payloadStr) in pending) {
            try {
                val body = payloadStr.toRequestBody(JSON_MEDIA_TYPE)
                val request = Request.Builder()
                    .url(BACKEND_URL)
                    .post(body)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("X-SOS-Source", "voice_sos_android_recovery")
                    .build()

                // Synchronous call for sequential processing
                val response = httpClient.newCall(request).execute()
                response.use {
                    if (it.isSuccessful) {
                        offlineQueue.dequeue(id)
                        Log.i(TAG, "✅ Offline SOS $id flushed successfully")
                    } else {
                        offlineQueue.incrementRetry(id)
                        Log.w(TAG, "❌ Failed to flush SOS $id: ${it.code}")
                    }
                }
            } catch (e: Exception) {
                offlineQueue.incrementRetry(id)
                Log.e(TAG, "⚠️ Recovery flush error for $id: ${e.message}")
                break // Still offline, stop trying
            }
        }
    }

    // ── Network Check ────────────────────────────────────────────────

    private fun isNetworkAvailable(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /**
     * Shut down the recovery daemon executor.
     */
    fun shutdown() {
        recoveryExecutor.shutdown()
        Log.i(TAG, "Recovery daemon shut down")
    }
}
