package com.oes.pda.bridge

/** Describes a command failure returned through the PDA JS Bridge. */
data class BridgeError(
    val code: String,
    val message: String,
)

/** Represents the common result envelope shared by Android native bridge commands. */
data class BridgeResult(
    val ok: Boolean,
    val data: Map<String, Any?>?,
    val error: BridgeError?,
) {
    /** Serializes the bridge result into the stable JSON envelope consumed by PDA Web. */
    fun toJson(): String {
        return if (ok) {
            """{"ok":true,"data":${mapToJson(data ?: emptyMap())}}"""
        } else {
            val code = error?.code ?: "UNKNOWN"
            val message = error?.message ?: "Unknown bridge error"
            """{"ok":false,"error":{"code":${jsonString(code)},"message":${jsonString(message)}}}"""
        }
    }

    companion object {
        /** Creates the common success/failure envelopes returned by native bridge commands. */
        fun success(data: Map<String, Any?>): BridgeResult = BridgeResult(
            ok = true,
            data = data,
            error = null,
        )

        fun failure(code: String, message: String): BridgeResult = BridgeResult(
            ok = false,
            data = null,
            error = BridgeError(code = code, message = message),
        )

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
