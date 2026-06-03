package com.oes.pda.scanner

import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.common.Barcode

/** Defines the camera scanner barcode formats and stable symbology names exposed to PDA Web. */
object CameraBarcodeFormats {
    val supportedFormats = listOf(
        Barcode.FORMAT_QR_CODE,
        Barcode.FORMAT_CODE_128,
        Barcode.FORMAT_CODE_39,
        Barcode.FORMAT_CODE_93,
        Barcode.FORMAT_EAN_13,
        Barcode.FORMAT_EAN_8,
        Barcode.FORMAT_UPC_A,
        Barcode.FORMAT_UPC_E,
        Barcode.FORMAT_CODABAR,
        Barcode.FORMAT_ITF,
    )

    val scannerOptions: BarcodeScannerOptions = BarcodeScannerOptions.Builder()
        .setBarcodeFormats(supportedFormats.first(), *supportedFormats.drop(1).toIntArray())
        .build()

    /** Converts ML Kit barcode format constants into stable PDA symbology labels. */
    fun formatName(format: Int): String {
        return when (format) {
            Barcode.FORMAT_QR_CODE -> "QR_CODE"
            Barcode.FORMAT_CODE_128 -> "CODE128"
            Barcode.FORMAT_CODE_39 -> "CODE39"
            Barcode.FORMAT_CODE_93 -> "CODE93"
            Barcode.FORMAT_EAN_13 -> "EAN13"
            Barcode.FORMAT_EAN_8 -> "EAN8"
            Barcode.FORMAT_UPC_A -> "UPCA"
            Barcode.FORMAT_UPC_E -> "UPCE"
            Barcode.FORMAT_CODABAR -> "CODABAR"
            Barcode.FORMAT_ITF -> "ITF"
            else -> "UNKNOWN"
        }
    }
}
