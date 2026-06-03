package com.oes.pda.bridge

import android.content.Context
import android.webkit.JavascriptInterface
import com.oes.pda.device.DeviceInfoProvider
import com.oes.pda.feedback.NativeFeedbackController
import com.oes.pda.network.NetworkStatusProvider
import org.json.JSONObject

/** Exposes native PDA device capabilities to the packaged Vue app through Android WebView. */
class OesPdaBridge(
    context: Context,
    private val deviceInfoProvider: DeviceInfoProvider,
    private val networkStatusProvider: NetworkStatusProvider,
    private val feedbackController: NativeFeedbackController,
    private val openCameraCapture: (String) -> BridgeResult,
    private val openCameraScanner: () -> BridgeResult,
) {
    private val sessionPreferences = context.getSharedPreferences("oes_pda_session", Context.MODE_PRIVATE)

    /** Returns stable device identity and runtime information for PDA bootstrap diagnostics. */
    @JavascriptInterface
    fun getDeviceInfo(): String {
        return runCatching {
            BridgeResult.success(deviceInfoProvider.getDeviceInfo()).toJson()
        }.getOrElse { error ->
            BridgeResult.failure("DEVICE_INFO_UNAVAILABLE", error.message ?: "Device info is unavailable").toJson()
        }
    }

    /** Returns the current network status as seen by the Android Shell. */
    @JavascriptInterface
    fun getNetworkStatus(): String {
        return runCatching {
            BridgeResult.success(networkStatusProvider.getNetworkStatus()).toJson()
        }.getOrElse { error ->
            BridgeResult.failure("NETWORK_STATUS_UNAVAILABLE", error.message ?: "Network status is unavailable").toJson()
        }
    }

    /** Starts an async system-camera capture and completes it through a bridge event. */
    @JavascriptInterface
    fun openCamera(requestJson: String): String {
        return runCatching {
            val requestId = JSONObject(requestJson).optString("requestId")
            if (requestId.isBlank()) {
                BridgeResult.failure("CAMERA_CAPTURE_FAILED", "Camera request id is required").toJson()
            } else {
                openCameraCapture(requestId).toJson()
            }
        }.getOrElse { error ->
            BridgeResult.failure("CAMERA_CAPTURE_FAILED", error.message ?: "Camera capture failed").toJson()
        }
    }

    /** Starts native camera scanning and completes successful decodes through the normal scanResult event. */
    @JavascriptInterface
    fun openCameraScanner(requestJson: String): String {
        return runCatching {
            openCameraScanner().toJson()
        }.getOrElse { error ->
            BridgeResult.failure("CAMERA_SCANNER_FAILED", error.message ?: "Camera scanner failed").toJson()
        }
    }

    /** Returns the stored PDA token pair so WebView reloads can rotate and restore the session. */
    @JavascriptInterface
    fun getSessionTokens(): String {
        return runCatching {
            BridgeResult.success(
                mapOf(
                    "accessToken" to sessionPreferences.getString(KEY_ACCESS_TOKEN, ""),
                    "refreshToken" to sessionPreferences.getString(KEY_REFRESH_TOKEN, ""),
                    "expiresAt" to sessionPreferences.getString(KEY_EXPIRES_AT, ""),
                ),
            ).toJson()
        }.getOrElse { error ->
            BridgeResult.failure("SESSION_TOKEN_LOAD_FAILED", error.message ?: "Session tokens cannot be loaded").toJson()
        }
    }

    /** Stores the latest rotated PDA token pair in app-private Android storage. */
    @JavascriptInterface
    fun saveSessionTokens(tokensJson: String): String {
        return runCatching {
            val tokens = JSONObject(tokensJson)
            sessionPreferences.edit()
                .putString(KEY_ACCESS_TOKEN, tokens.optString("accessToken"))
                .putString(KEY_REFRESH_TOKEN, tokens.optString("refreshToken"))
                .putString(KEY_EXPIRES_AT, tokens.optString("expiresAt"))
                .apply()
            BridgeResult.success(mapOf("saved" to true)).toJson()
        }.getOrElse { error ->
            BridgeResult.failure("SESSION_TOKEN_SAVE_FAILED", error.message ?: "Session tokens cannot be saved").toJson()
        }
    }

    /** Clears app-private PDA token material after logout or rejected refresh. */
    @JavascriptInterface
    fun clearSessionTokens(): String {
        return runCatching {
            sessionPreferences.edit().clear().apply()
            BridgeResult.success(mapOf("cleared" to true)).toJson()
        }.getOrElse { error ->
            BridgeResult.failure("SESSION_TOKEN_CLEAR_FAILED", error.message ?: "Session tokens cannot be cleared").toJson()
        }
    }

    /** Plays a short native beep so operators can verify hardware feedback. */
    @JavascriptInterface
    fun beep(): String {
        return runCatching {
            feedbackController.beep()
            BridgeResult.success(mapOf("played" to true)).toJson()
        }.getOrElse { error ->
            BridgeResult.failure("BEEP_FAILED", error.message ?: "Beep failed").toJson()
        }
    }

    /** Vibrates the device for the requested duration so operators can verify tactile feedback. */
    @JavascriptInterface
    fun vibrate(durationMs: Int): String {
        return runCatching {
            feedbackController.vibrate(durationMs)
            BridgeResult.success(mapOf("vibrated" to true)).toJson()
        }.getOrElse { error ->
            BridgeResult.failure("VIBRATE_FAILED", error.message ?: "Vibration failed").toJson()
        }
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_EXPIRES_AT = "expires_at"
    }
}
