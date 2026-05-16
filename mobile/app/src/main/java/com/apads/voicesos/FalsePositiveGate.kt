package com.apads.voicesos

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log

/**
 * FalsePositiveGate
 *
 * Prevents accidental SOS dispatches by implementing a 3-second
 * confirmation window. When a potential SOS is detected:
 *
 *   1. Device vibrates with a distinct pattern (buzz-pause-buzz-pause-buzz)
 *   2. A 3-second timer starts
 *   3. If the user does NOT cancel within 3 seconds → SOS is dispatched
 *   4. If the user cancels (via notification action) → SOS is suppressed
 *
 * Additionally applies confidence thresholds:
 *   - confidence < 0.2 → Auto-reject (too noisy)
 *   - confidence < 0.5 → Extend confirmation window to 5 seconds
 *   - confidence >= 0.5 → Standard 3-second window
 */
class FalsePositiveGate(private val context: Context) {

    companion object {
        const val TAG = "FalsePositiveGate"
        const val STANDARD_DELAY_MS = 3000L
        const val EXTENDED_DELAY_MS = 5000L
        const val MIN_CONFIDENCE_THRESHOLD = 0.2f
    }

    private val handler = Handler(Looper.getMainLooper())
    private var pendingDispatch: Runnable? = null

    @Volatile
    var isCancelled = false
        private set

    /**
     * Evaluate a classification result. If confidence passes the threshold,
     * start the confirmation countdown. Calls [onConfirmed] if not cancelled.
     */
    fun evaluate(
        result: IntentClassifier.ClassificationResult,
        transcript: String,
        onConfirmed: (IntentClassifier.ClassificationResult) -> Unit
    ) {
        // ── Auto-reject very low confidence ──────────────────────────
        if (result.confidence < MIN_CONFIDENCE_THRESHOLD) {
            Log.w(TAG, "❌ Auto-rejected: confidence ${result.confidence} < threshold $MIN_CONFIDENCE_THRESHOLD")
            Log.w(TAG, "   Transcript was: \"$transcript\"")
            return
        }

        isCancelled = false

        // ── Determine confirmation delay ─────────────────────────────
        val delay = if (result.confidence < 0.5f) EXTENDED_DELAY_MS else STANDARD_DELAY_MS
        Log.i(TAG, "⏳ SOS confirmation window: ${delay / 1000}s (confidence: ${result.confidence})")
        Log.i(TAG, "   Domain: ${result.domain} | Keywords: ${result.matchedKeywords}")

        // ── Vibrate to alert user ────────────────────────────────────
        vibrateConfirmation()

        // ── Schedule dispatch after delay ────────────────────────────
        pendingDispatch = Runnable {
            if (!isCancelled) {
                Log.w(TAG, "✅ Confirmation window expired — DISPATCHING SOS")
                onConfirmed(result)
            } else {
                Log.i(TAG, "🚫 SOS was cancelled during confirmation window")
            }
        }
        handler.postDelayed(pendingDispatch!!, delay)
    }

    /**
     * Cancel a pending SOS dispatch. Can be triggered from the notification
     * action or from the MainActivity UI.
     */
    fun cancel() {
        isCancelled = true
        pendingDispatch?.let { handler.removeCallbacks(it) }
        pendingDispatch = null
        Log.i(TAG, "🚫 SOS cancelled by user")
    }

    // ── Haptic Feedback ──────────────────────────────────────────────

    private fun vibrateConfirmation() {
        try {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            // Pattern: buzz 200ms, pause 100ms, buzz 200ms, pause 100ms, buzz 400ms
            val pattern = longArrayOf(0, 200, 100, 200, 100, 400)

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(
                    VibrationEffect.createWaveform(pattern, -1) // -1 = don't repeat
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(pattern, -1)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Vibration error: ${e.message}")
        }
    }
}
