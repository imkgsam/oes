package com.oes.pda.scanner

/** Plays native operator feedback for a successful camera scan without blocking the scan event. */
class CameraScanSuccessFeedback(
    private val beep: () -> Unit,
    private val vibrate: (Int) -> Unit,
) {
    /** Emits one short sound and tactile confirmation while swallowing device-specific failures. */
    fun play() {
        runCatching { beep() }
        runCatching { vibrate(SUCCESS_VIBRATION_MS) }
    }

    companion object {
        private const val SUCCESS_VIBRATION_MS = 90
    }
}
