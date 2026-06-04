package com.apads.voicesos

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * MainActivity
 *
 * Minimal UI to start/stop the SOS Foreground Service and
 * handle runtime permissions. The actual SOS logic runs
 * entirely in the SOSForegroundService — this activity is
 * only needed for initial setup and user control.
 *
 * Layout is programmatic (no XML) to keep the mobile module
 * self-contained without requiring Android Studio resource compilation.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val PERMISSION_REQUEST_CODE = 100
    }

    private var isServiceRunning = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // ── Programmatic Layout ──────────────────────────────────────
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(64, 120, 64, 64)
            setBackgroundColor(0xFF0A0E1A.toInt())
            gravity = android.view.Gravity.CENTER_HORIZONTAL
        }

        // Title
        val title = TextView(this).apply {
            text = "🛡️ APADS Voice SOS"
            textSize = 28f
            setTextColor(0xFFFFFFFF.toInt())
            gravity = android.view.Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
        layout.addView(title, marginParams(bottom = 16))

        // Subtitle
        val subtitle = TextView(this).apply {
            text = "Hands-Free Emergency Protection"
            textSize = 14f
            setTextColor(0xFF9CA3AF.toInt())
            gravity = android.view.Gravity.CENTER
        }
        layout.addView(subtitle, marginParams(bottom = 48))

        // Load persistent service running state
        val prefs = getSharedPreferences("apads_sos_prefs", MODE_PRIVATE)
        isServiceRunning = prefs.getBoolean("sos_enabled", false)

        // Status Card
        val statusCard = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(40, 32, 40, 32)
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xFF111827.toInt())
                cornerRadius = 24f
                setStroke(2, 0xFF1F2937.toInt())
            }
        }

        val statusLabel = TextView(this).apply {
            text = "SERVICE STATUS"
            textSize = 10f
            setTextColor(0xFF6B7280.toInt())
            letterSpacing = 0.15f
        }
        statusCard.addView(statusLabel, marginParams(bottom = 8))

        val statusText = TextView(this).apply {
            text = if (isServiceRunning) "● ACTIVE — LISTENING" else "● INACTIVE"
            textSize = 18f
            setTextColor(if (isServiceRunning) 0xFF10B981.toInt() else 0xFFEF4444.toInt())
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
        statusCard.addView(statusText, marginParams(bottom = 8))

        val wakeWordInfo = TextView(this).apply {
            text = "Wake word: \"Porcupine\"\nSay the wake word, then describe your emergency."
            textSize = 12f
            setTextColor(0xFF9CA3AF.toInt())
            setLineSpacing(4f, 1f)
        }
        statusCard.addView(wakeWordInfo)

        layout.addView(statusCard, fullWidthParams(bottom = 32))

        // Start/Stop Button
        val toggleBtn = Button(this).apply {
            text = if (isServiceRunning) "⬛  STOP SOS PROTECTION" else "▶  START SOS PROTECTION"
            textSize = 16f
            setTextColor(0xFFFFFFFF.toInt())
            isAllCaps = false
            setPadding(0, 36, 0, 36)
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(if (isServiceRunning) 0xFFEF4444.toInt() else 0xFF10B981.toInt())
                cornerRadius = 16f
            }
        }

        toggleBtn.setOnClickListener {
            if (!isServiceRunning) {
                if (checkAndRequestPermissions()) {
                    startSOSService()
                    isServiceRunning = true
                    toggleBtn.text = "⬛  STOP SOS PROTECTION"
                    toggleBtn.background = android.graphics.drawable.GradientDrawable().apply {
                        setColor(0xFFEF4444.toInt())
                        cornerRadius = 16f
                    }
                    statusText.text = "● ACTIVE — LISTENING"
                    statusText.setTextColor(0xFF10B981.toInt())
                }
            } else {
                stopSOSService()
                isServiceRunning = false
                toggleBtn.text = "▶  START SOS PROTECTION"
                toggleBtn.background = android.graphics.drawable.GradientDrawable().apply {
                    setColor(0xFF10B981.toInt())
                    cornerRadius = 16f
                }
                statusText.text = "● INACTIVE"
                statusText.setTextColor(0xFFEF4444.toInt())
            }
        }

        layout.addView(toggleBtn, fullWidthParams(bottom = 24))

        // Test SOS Button (Debug)
        val testBtn = Button(this).apply {
            text = "🧪  Send Test SOS"
            textSize = 14f
            setTextColor(0xFFFFFFFF.toInt())
            isAllCaps = false
            setPadding(0, 28, 0, 28)
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(0x33FFFFFF.toInt())
                cornerRadius = 16f
                setStroke(1, 0x44FFFFFF.toInt())
            }
        }

        testBtn.setOnClickListener {
            val dispatcher = SOSNetworkDispatcher(this)
            dispatcher.dispatchSOS(
                domain = "Medical",
                transcript = "Test SOS from APADS mobile app",
                confidence = 0.95f
            )
            Toast.makeText(this, "✅ Test SOS dispatched!", Toast.LENGTH_SHORT).show()
        }

        layout.addView(testBtn, fullWidthParams(bottom = 32))

        // Info Section
        val infoText = TextView(this).apply {
            text = """
                How it works:
                1. Tap "Start SOS Protection"
                2. Lock your phone and put it in your pocket
                3. In an emergency, say "Porcupine"
                4. Describe your emergency (e.g., "I need an ambulance")
                5. After 3 seconds, SOS is dispatched automatically
                
                Domains detected: 🚑 Medical  🔥 Fire  🚔 Police
                
                ⚡ Battery usage: ~2% per 24 hours
                🔒 All audio processed on-device (offline)
            """.trimIndent()
            textSize = 12f
            setTextColor(0xFF6B7280.toInt())
            setLineSpacing(6f, 1f)
        }
        layout.addView(infoText)

        // Wrap in scroll view
        val scrollView = android.widget.ScrollView(this).apply {
            addView(layout)
            setBackgroundColor(0xFF0A0E1A.toInt())
        }

        setContentView(scrollView)
    }

    // ── Service Control ──────────────────────────────────────────────

    private fun startSOSService() {
        val prefs = getSharedPreferences("apads_sos_prefs", MODE_PRIVATE)
        prefs.edit().putBoolean("sos_enabled", true).apply()

        val intent = Intent(this, SOSForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        Toast.makeText(this, "🛡️ SOS Protection activated", Toast.LENGTH_SHORT).show()
    }

    private fun stopSOSService() {
        val prefs = getSharedPreferences("apads_sos_prefs", MODE_PRIVATE)
        prefs.edit().putBoolean("sos_enabled", false).apply()

        val intent = Intent(this, SOSForegroundService::class.java)
        stopService(intent)
        Toast.makeText(this, "SOS Protection deactivated", Toast.LENGTH_SHORT).show()
    }

    // ── Permissions ──────────────────────────────────────────────────

    private fun checkAndRequestPermissions(): Boolean {
        val permissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val notGranted = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (notGranted.isNotEmpty()) {
            // Show rationale dialog
            AlertDialog.Builder(this)
                .setTitle("Permissions Required")
                .setMessage(
                    "APADS Voice SOS needs:\n\n" +
                    "🎤 Microphone — to listen for your voice command\n" +
                    "📍 Location — to send GPS with your SOS\n" +
                    "🔔 Notifications — to show the protection status\n\n" +
                    "All audio is processed on-device. Nothing is uploaded."
                )
                .setPositiveButton("Grant Permissions") { _, _ ->
                    ActivityCompat.requestPermissions(
                        this,
                        notGranted.toTypedArray(),
                        PERMISSION_REQUEST_CODE
                    )
                }
                .setNegativeButton("Cancel", null)
                .show()
            return false
        }

        return true
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                startSOSService()
            } else {
                Toast.makeText(
                    this,
                    "⚠️ Permissions denied. SOS protection requires all permissions.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    // ── Layout Helpers ───────────────────────────────────────────────

    private fun marginParams(
        top: Int = 0, bottom: Int = 0, left: Int = 0, right: Int = 0
    ): android.widget.LinearLayout.LayoutParams {
        return android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(dpToPx(left), dpToPx(top), dpToPx(right), dpToPx(bottom))
        }
    }

    private fun fullWidthParams(bottom: Int = 0): android.widget.LinearLayout.LayoutParams {
        return android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(0, 0, 0, dpToPx(bottom))
        }
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
