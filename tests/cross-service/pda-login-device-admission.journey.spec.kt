package com.oes.pda.journey

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.oes.pda.bridge.BridgeResult
import com.oes.pda.bridge.OesPdaBridge
import com.oes.pda.device.DeviceInfoProvider
import com.oes.pda.feedback.NativeFeedbackController
import com.oes.pda.network.NetworkStatusProvider
import java.net.HttpURLConnection
import java.net.URI
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Prerequisites: the runner builds the packaged PDA Web assets and starts an isolated JVM backend child.
 * Boundaries: Robolectric Android -> native JS bridge/device identity -> HTTP Gateway -> Auth/Terminal Device.
 * Success: an admitted device receives a PDA session and the native bridge persists the token pair.
 * Critical failure: an invalid device credential is denied and never becomes a native session.
 * Reproduce: pnpm test:run -- --type journey (or the risk-selected change plan).
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class PdaLoginDeviceAdmissionJourneySpec {
    @Test
    fun admittedNativeDeviceCreatesSessionAndInvalidCredentialFailsClosed() {
        val root = requireNotNull(System.getenv("OES_REPOSITORY_ROOT"))
        val process = ProcessBuilder("node", "$root/tests/cross-service/support/pda-admission-server.cjs")
            .directory(java.io.File(root))
            .redirectError(ProcessBuilder.Redirect.INHERIT)
            .start()
        try {
            val configuration = JSONObject(requireNotNull(process.inputStream.bufferedReader().readLine()))
            val context = ApplicationProvider.getApplicationContext<Context>()
            val bridge = OesPdaBridge(
                context,
                DeviceInfoProvider(context),
                NetworkStatusProvider(context),
                NativeFeedbackController(context),
                { BridgeResult.failure("CAMERA_UNUSED", "camera is outside this journey") },
                { BridgeResult.failure("SCANNER_UNUSED", "scanner is outside this journey") },
            )
            val deviceEnvelope = JSONObject(bridge.getDeviceInfo())
            assertTrue(deviceEnvelope.getBoolean("ok"))
            val nativeDeviceId = deviceEnvelope.getJSONObject("data").getString("deviceId")
            assertTrue(nativeDeviceId.isNotBlank())

            val valid = postLogin(configuration, configuration.getString("credential"), nativeDeviceId)
            assertEquals("SUCCESS", valid.getString("status"))
            val session = valid.getJSONObject("session")
            assertEquals("PDA", session.getString("terminal"))
            assertEquals(configuration.getString("terminalDeviceId"), session.getString("terminalDeviceId"))
            assertTrue(
                JSONObject(
                    bridge.saveSessionTokens(
                        JSONObject()
                            .put("accessToken", session.getString("accessToken"))
                            .put("refreshToken", session.getString("refreshToken"))
                            .put("expiresAt", "2026-09-04T01:15:00.000Z")
                            .toString(),
                    ),
                ).getBoolean("ok"),
            )
            val stored = JSONObject(bridge.getSessionTokens()).getJSONObject("data")
            assertEquals("pda-access-token", stored.getString("accessToken"))

            assertTrue(JSONObject(bridge.clearSessionTokens()).getBoolean("ok"))
            val denied = postLogin(configuration, "invalid-device-credential", nativeDeviceId)
            assertEquals("DENIED", denied.getString("status"))
            assertEquals("TERMINAL_DEVICE_CREDENTIAL_INVALID", denied.getString("message"))
            assertFalse(
                JSONObject(bridge.getSessionTokens()).getJSONObject("data").getString("accessToken").isNotBlank(),
            )
        } finally {
            process.destroy()
            process.waitFor()
        }
    }

    private fun postLogin(configuration: JSONObject, credential: String, nativeDeviceId: String): JSONObject {
        val connection = URI.create("${configuration.getString("origin")}/api/v1/pda/auth/login")
            .toURL()
            .openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.doOutput = true
        connection.connectTimeout = 10_000
        connection.readTimeout = 10_000
        connection.setRequestProperty("content-type", "application/json")
        connection.setRequestProperty("x-oes-device-credential", credential)
        val payload = JSONObject()
            .put("method", "EMAIL_PASSWORD")
            .put("identifier", "operator@example.test")
            .put("credential", "journey-password")
            .put(
                "device",
                JSONObject()
                    .put("deviceId", configuration.getString("terminalDeviceId"))
                    .put("deviceName", "Robolectric PDA")
                    .put(
                        "identity",
                        JSONObject()
                            .put("manufacturerSerial", nativeDeviceId)
                            .put("appInstallationId", configuration.getString("appInstallationId")),
                    ),
            )
        connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
        assertEquals(200, connection.responseCode)
        return JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
    }
}
