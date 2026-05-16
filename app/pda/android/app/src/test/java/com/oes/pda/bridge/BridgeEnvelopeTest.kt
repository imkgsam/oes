package com.oes.pda.bridge

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BridgeEnvelopeTest {
    @Test
    fun successWrapsBridgePayloadWithOkFlag() {
        val result = BridgeResult.success(mapOf("deviceId" to "pda-001"))

        assertTrue(result.ok)
        assertEquals("pda-001", result.data?.get("deviceId"))
        assertEquals(null, result.error)
    }

    @Test
    fun failureWrapsBridgeErrorWithCodeAndMessage() {
        val result = BridgeResult.failure("DEVICE_UNAVAILABLE", "Device info is unavailable")

        assertFalse(result.ok)
        assertEquals(null, result.data)
        assertEquals("DEVICE_UNAVAILABLE", result.error?.code)
        assertEquals("Device info is unavailable", result.error?.message)
    }

    @Test
    fun successSerializesToBridgeJsonEnvelope() {
        val result = BridgeResult.success(
            mapOf(
                "deviceId" to "C80221204985",
                "connected" to true,
                "batteryLevel" to 87,
            ),
        )

        assertEquals(
            """{"ok":true,"data":{"deviceId":"C80221204985","connected":true,"batteryLevel":87}}""",
            result.toJson(),
        )
    }

    @Test
    fun successSerializesNestedBridgePayloads() {
        val result = BridgeResult.success(
            mapOf(
                "requestId" to "camera_001",
                "photo" to mapOf(
                    "fileName" to "photo_001.jpg",
                    "sizeBytes" to 1024,
                ),
            ),
        )

        assertEquals(
            """{"ok":true,"data":{"requestId":"camera_001","photo":{"fileName":"photo_001.jpg","sizeBytes":1024}}}""",
            result.toJson(),
        )
    }

    @Test
    fun failureSerializesToBridgeJsonEnvelope() {
        val result = BridgeResult.failure("NETWORK_UNAVAILABLE", "Network is unavailable")

        assertEquals(
            """{"ok":false,"error":{"code":"NETWORK_UNAVAILABLE","message":"Network is unavailable"}}""",
            result.toJson(),
        )
    }
}
