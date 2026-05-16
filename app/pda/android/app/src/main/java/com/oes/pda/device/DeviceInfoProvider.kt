package com.oes.pda.device

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.webkit.WebView
import java.util.UUID

/** Reads cross-device identity and runtime metadata without depending on a single PDA vendor. */
class DeviceInfoProvider(private val context: Context) {
    /** Produces the Phase 1 PDA device info payload returned through JS Bridge. */
    fun getDeviceInfo(): Map<String, Any?> {
        val identity = resolveDeviceIdentity()
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        val webViewPackage = WebView.getCurrentWebViewPackage()

        return mapOf(
            "appVersion" to packageInfo.versionName,
            "deviceId" to identity.value,
            "idSource" to identity.source,
            "manufacturer" to Build.MANUFACTURER.orEmpty(),
            "model" to Build.MODEL.orEmpty(),
            "osVersion" to Build.VERSION.RELEASE.orEmpty(),
            "sdkInt" to Build.VERSION.SDK_INT,
            "webViewPackage" to webViewPackage?.packageName.orEmpty(),
            "webViewVersion" to webViewPackage?.versionName.orEmpty(),
        )
    }

    /** Resolves manufacturer serial first and falls back to Android ID or app-generated identity. */
    private fun resolveDeviceIdentity(): DeviceIdentity {
        val manufacturerSerial = runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Build.getSerial() else Build.SERIAL
        }.getOrNull()

        if (manufacturerSerial.isUsableDeviceId()) {
            return DeviceIdentity(manufacturerSerial!!, "MANUFACTURER_SERIAL")
        }

        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        if (androidId.isUsableDeviceId()) {
            return DeviceIdentity(androidId!!, "ANDROID_ID")
        }

        val preferences = context.getSharedPreferences("oes_pda_device", Context.MODE_PRIVATE)
        val generated = preferences.getString("generated_device_id", null)
            ?: "oes-pda-${UUID.randomUUID()}".also {
                preferences.edit().putString("generated_device_id", it).apply()
            }
        return DeviceIdentity(generated, "APP_GENERATED")
    }

    private fun String?.isUsableDeviceId(): Boolean {
        return !isNullOrBlank() && this != Build.UNKNOWN && !equals("unknown", ignoreCase = true)
    }

    private data class DeviceIdentity(val value: String, val source: String)
}
