package com.oes.pda.scanner

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.Instant

class ScannerIntentNormalizerTest {
    @Test
    fun normalizesSeuicDefaultBroadcastScannerData() {
        val result = ScannerIntentNormalizer.normalize(
            action = "com.android.server.scannerservice.broadcast",
            extras = mapOf("scannerdata" to "PB202605130001", "codetype" to "CODE128"),
            occurredAt = Instant.parse("2026-05-13T10:20:00Z"),
        )

        assertEquals("PB202605130001", result?.scanValue)
        assertEquals("BROADCAST", result?.scanSource)
        assertEquals("MANUFACTURER_BROADCAST", result?.scannerProvider)
        assertEquals("CODE128", result?.symbology)
        assertEquals(14, result?.rawLength)
        assertEquals("2026-05-13T10:20:00Z", result?.occurredAt)
    }

    @Test
    fun ignoresUnknownScannerBroadcasts() {
        val result = ScannerIntentNormalizer.normalize(
            action = "unknown.action",
            extras = mapOf("scannerdata" to "PB202605130001"),
        )

        assertNull(result)
    }
}
