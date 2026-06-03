package com.oes.pda.scanner

import org.junit.Assert.assertEquals
import org.junit.Test

class CameraScanSuccessFeedbackTest {
    @Test
    fun playsBeepAndShortVibrationWhenCameraScanSucceeds() {
        val events = mutableListOf<String>()
        val feedback = CameraScanSuccessFeedback(
            beep = { events.add("beep") },
            vibrate = { durationMs -> events.add("vibrate:$durationMs") },
        )

        feedback.play()

        assertEquals(listOf("beep", "vibrate:90"), events)
    }

    @Test
    fun keepsScanSuccessFlowAliveWhenNativeFeedbackFails() {
        val events = mutableListOf<String>()
        val feedback = CameraScanSuccessFeedback(
            beep = { throw IllegalStateException("speaker unavailable") },
            vibrate = { durationMs -> events.add("vibrate:$durationMs") },
        )

        feedback.play()

        assertEquals(listOf("vibrate:90"), events)
    }
}
