package com.oes.pda.scanner

import android.app.Activity
import android.content.Intent
import com.oes.pda.bridge.BridgeResult
import java.time.Instant

/** Starts native camera scanning and translates decoded results into normalized PDA scan events. */
class CameraScannerCoordinator(
    private val activity: Activity,
    private val successFeedback: CameraScanSuccessFeedback,
) {
    private var scanning = false

    /** Opens the camera scanner activity if another scan is not already active. */
    fun openCameraScanner(): BridgeResult {
        if (scanning) {
            return BridgeResult.failure("CAMERA_SCANNER_BUSY", "Another camera scan is already in progress")
        }

        scanning = true
        activity.startActivityForResult(Intent(activity, CameraScannerActivity::class.java), REQUEST_CODE)
        return BridgeResult.success(mapOf("accepted" to true))
    }

    /** Converts the native camera scanner activity result into a stable scanResult payload. */
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?): NormalizedScanResult? {
        if (requestCode != REQUEST_CODE) {
            return null
        }

        scanning = false
        if (resultCode != Activity.RESULT_OK) {
            return null
        }

        val scanValue = data?.getStringExtra(CameraScannerActivity.EXTRA_SCAN_VALUE)?.trim().orEmpty()
        if (scanValue.isBlank()) {
            return null
        }

        successFeedback.play()

        return ScannerIntentNormalizer.cameraScan(
            scanValue = scanValue,
            symbology = data?.getStringExtra(CameraScannerActivity.EXTRA_SYMBOLOGY),
            occurredAt = Instant.now(),
        )
    }

    companion object {
        const val REQUEST_CODE = 7108
    }
}
