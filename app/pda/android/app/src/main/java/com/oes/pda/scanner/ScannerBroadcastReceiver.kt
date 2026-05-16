package com.oes.pda.scanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Receives manufacturer scanner broadcasts and forwards normalized results to Android Shell. */
class ScannerBroadcastReceiver(
    private val onScanResult: (NormalizedScanResult) -> Unit,
) : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val extras = intent.extras
        val values = extras?.keySet()?.associateWith { key -> extras.get(key) } ?: emptyMap()
        ScannerIntentNormalizer.normalize(intent.action, values)?.let(onScanResult)
    }
}
