package com.oes.pda.network

import android.content.Context
import android.os.BatteryManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

/** Reads Android connectivity state for PDA Web diagnostics and heartbeat context. */
class NetworkStatusProvider(private val context: Context) {
    /** Returns a compact network status payload for the PDA JS Bridge. */
    fun getNetworkStatus(): Map<String, Any?> {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork
        val capabilities = activeNetwork?.let(connectivityManager::getNetworkCapabilities)
        val connected = capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)

        return mapOf(
            "connected" to connected,
            "metered" to connectivityManager.isActiveNetworkMetered,
            "type" to resolveNetworkType(capabilities),
            "batteryLevel" to readBatteryLevel(),
        )
    }

    /** Reads current battery percentage for heartbeat diagnostics when Android exposes it. */
    private fun readBatteryLevel(): Int? {
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val capacity = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        return capacity.takeIf { it in 0..100 }
    }

    private fun resolveNetworkType(capabilities: NetworkCapabilities?): String {
        return when {
            capabilities == null -> "NONE"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WIFI"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "CELLULAR"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ETHERNET"
            else -> "UNKNOWN"
        }
    }
}
