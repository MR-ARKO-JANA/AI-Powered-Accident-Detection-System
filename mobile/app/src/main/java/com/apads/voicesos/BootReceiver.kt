package com.apads.voicesos

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * BootReceiver
 *
 * Automatically restarts the SOS Foreground Service after device reboot.
 * Ensures continuous protection without requiring the user to manually
 * re-open the app after a restart.
 *
 * Registered in AndroidManifest.xml with BOOT_COMPLETED intent filter.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.i(TAG, "📱 Device booted — restarting SOS Foreground Service")

            // Check if the user had SOS enabled before reboot
            val prefs = context.getSharedPreferences("apads_sos_prefs", Context.MODE_PRIVATE)
            val wasEnabled = prefs.getBoolean("sos_enabled", false)

            if (wasEnabled) {
                val serviceIntent = Intent(context, SOSForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                Log.i(TAG, "✅ SOS service restarted after boot")
            } else {
                Log.i(TAG, "SOS was not enabled before reboot — skipping auto-start")
            }
        }
    }
}
