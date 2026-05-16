package com.oes.pda.feedback

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import kotlin.math.max
import kotlin.math.min

/** Executes simple native operator feedback such as beep and vibration. */
class NativeFeedbackController(private val context: Context) {
    /** Plays a short notification beep through Android's native tone generator. */
    fun beep() {
        val toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
        try {
            toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 120)
        } finally {
            toneGenerator.release()
        }
    }

    /** Vibrates for a bounded duration to avoid accidental long-running tactile feedback. */
    fun vibrate(durationMs: Int) {
        val safeDuration = min(max(durationMs, 40), 1_000).toLong()
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(safeDuration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(safeDuration)
        }
    }
}
