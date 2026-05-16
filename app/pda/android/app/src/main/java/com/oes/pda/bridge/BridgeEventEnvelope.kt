package com.oes.pda.bridge

import com.oes.pda.scanner.NormalizedScanResult
import java.util.UUID

data class BridgeEventEnvelope(
    val eventId: String,
    val eventType: String,
    val occurredAt: String,
    val payload: Map<String, Any?>,
) {
    /** Serializes the event into the stable JSON envelope consumed by PDA Web event sink. */
    fun toJson(): String {
        return """{"eventId":${jsonString(eventId)},"eventType":${jsonString(eventType)},"occurredAt":${jsonString(occurredAt)},"payload":${mapToJson(payload)}}"""
    }

    companion object {
        fun scanResult(scanResult: NormalizedScanResult): BridgeEventEnvelope {
            return BridgeEventEnvelope(
                eventId = "evt_${UUID.randomUUID()}",
                eventType = "scanResult",
                occurredAt = scanResult.occurredAt,
                payload = mapOf(
                    "scanValue" to scanResult.scanValue,
                    "scanSource" to scanResult.scanSource,
                    "scannerProvider" to scanResult.scannerProvider,
                    "symbology" to scanResult.symbology,
                    "rawLength" to scanResult.rawLength,
                    "occurredAt" to scanResult.occurredAt,
                ),
            )
        }

        /** Creates the async camera completion event consumed by PDA Web openCamera promises. */
        fun cameraCaptureCompleted(requestId: String, result: BridgeResult): BridgeEventEnvelope {
            return BridgeEventEnvelope(
                eventId = "evt_${UUID.randomUUID()}",
                eventType = "cameraCaptureCompleted",
                occurredAt = java.time.Instant.now().toString(),
                payload = mapOf(
                    "requestId" to requestId,
                    "result" to if (result.ok) {
                        mapOf("ok" to true, "data" to result.data)
                    } else {
                        mapOf(
                            "ok" to false,
                            "error" to mapOf(
                                "code" to result.error?.code,
                                "message" to result.error?.message,
                            ),
                        )
                    },
                ),
            )
        }

        private fun mapToJson(values: Map<String, Any?>): String {
            return values.entries.joinToString(separator = ",", prefix = "{", postfix = "}") { (key, value) ->
                "${jsonString(key)}:${jsonValue(value)}"
            }
        }

        private fun jsonValue(value: Any?): String {
            return when (value) {
                null -> "null"
                is Boolean -> value.toString()
                is Number -> value.toString()
                is Map<*, *> -> mapToJson(
                    value.entries.associate { (entryKey, entryValue) ->
                        entryKey.toString() to entryValue
                    },
                )
                else -> jsonString(value.toString())
            }
        }

        private fun jsonString(value: String): String {
            val escaped = buildString {
                value.forEach { character ->
                    when (character) {
                        '\\' -> append("\\\\")
                        '"' -> append("\\\"")
                        '\n' -> append("\\n")
                        '\r' -> append("\\r")
                        '\t' -> append("\\t")
                        else -> append(character)
                    }
                }
            }
            return "\"$escaped\""
        }
    }
}
