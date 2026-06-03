package com.oes.pda.scanner

import java.time.Instant

data class NormalizedScanResult(
    val scanValue: String,
    val scanSource: String,
    val scannerProvider: String,
    val symbology: String?,
    val rawLength: Int,
    val occurredAt: String,
)

/** Normalizes vendor-specific scanner broadcasts into the stable PDA scanResult payload. */
object ScannerIntentNormalizer {
    val supportedActions = listOf(
        "com.android.server.scannerservice.broadcast",
        "com.android.server.scannerservice.seuic.scan",
        "com.scan.onDecodeComplete",
    )

    private val valueKeys = listOf(
        "scannerdata",
        "ScannerData",
        "scan_result",
        "barcode",
        "data",
        "m3scannerdata",
        "m3scannerdata_raw",
    )

    private val symbologyKeys = listOf(
        "codetype",
        "codeType",
        "barcodeType",
        "m3scanner_code_type",
    )

    fun normalize(action: String?, extras: Map<String, Any?>, occurredAt: Instant = Instant.now()): NormalizedScanResult? {
        if (action !in supportedActions) {
            return null
        }

        val scanValue = valueKeys
            .asSequence()
            .mapNotNull { extras[it]?.toString()?.trim() }
            .firstOrNull { it.isNotBlank() }
            ?: return null

        val symbology = symbologyKeys
            .asSequence()
            .mapNotNull { extras[it]?.toString()?.trim() }
            .firstOrNull { it.isNotBlank() }

        return NormalizedScanResult(
            scanValue = scanValue,
            scanSource = "BROADCAST",
            scannerProvider = "MANUFACTURER_BROADCAST",
            symbology = symbology,
            rawLength = scanValue.length,
            occurredAt = occurredAt.toString(),
        )
    }

    /** Creates the stable scanResult payload for decoded camera QR Code or Code128 values. */
    fun cameraScan(scanValue: String, symbology: String?, occurredAt: Instant = Instant.now()): NormalizedScanResult {
        val normalizedValue = scanValue.trim()
        return NormalizedScanResult(
            scanValue = normalizedValue,
            scanSource = "CAMERA",
            scannerProvider = "ANDROID_CAMERA",
            symbology = symbology,
            rawLength = normalizedValue.length,
            occurredAt = occurredAt.toString(),
        )
    }
}
