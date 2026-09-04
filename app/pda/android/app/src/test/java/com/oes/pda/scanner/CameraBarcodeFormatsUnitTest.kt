package com.oes.pda.scanner

import com.google.mlkit.vision.barcode.common.Barcode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CameraBarcodeFormatsUnitTest {
    @Test
    fun supportsCommonWarehouseAndRetailBarcodeFormats() {
        val supportedFormats = CameraBarcodeFormats.supportedFormats

        assertTrue(supportedFormats.contains(Barcode.FORMAT_QR_CODE))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_CODE_128))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_CODE_39))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_CODE_93))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_EAN_13))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_EAN_8))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_UPC_A))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_UPC_E))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_CODABAR))
        assertTrue(supportedFormats.contains(Barcode.FORMAT_ITF))
    }

    @Test
    fun mapsMlKitFormatsToStableSymbologyNames() {
        assertEquals("QR_CODE", CameraBarcodeFormats.formatName(Barcode.FORMAT_QR_CODE))
        assertEquals("CODE128", CameraBarcodeFormats.formatName(Barcode.FORMAT_CODE_128))
        assertEquals("CODE39", CameraBarcodeFormats.formatName(Barcode.FORMAT_CODE_39))
        assertEquals("CODE93", CameraBarcodeFormats.formatName(Barcode.FORMAT_CODE_93))
        assertEquals("EAN13", CameraBarcodeFormats.formatName(Barcode.FORMAT_EAN_13))
        assertEquals("EAN8", CameraBarcodeFormats.formatName(Barcode.FORMAT_EAN_8))
        assertEquals("UPCA", CameraBarcodeFormats.formatName(Barcode.FORMAT_UPC_A))
        assertEquals("UPCE", CameraBarcodeFormats.formatName(Barcode.FORMAT_UPC_E))
        assertEquals("CODABAR", CameraBarcodeFormats.formatName(Barcode.FORMAT_CODABAR))
        assertEquals("ITF", CameraBarcodeFormats.formatName(Barcode.FORMAT_ITF))
        assertEquals("UNKNOWN", CameraBarcodeFormats.formatName(Barcode.FORMAT_UNKNOWN))
    }
}
