package com.oes.pda

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import com.oes.pda.bridge.OesPdaBridge
import com.oes.pda.bridge.BridgeEventEnvelope
import com.oes.pda.camera.CameraCaptureCoordinator
import com.oes.pda.device.DeviceInfoProvider
import com.oes.pda.feedback.NativeFeedbackController
import com.oes.pda.network.NetworkStatusProvider
import com.oes.pda.scanner.NormalizedScanResult
import com.oes.pda.scanner.ScannerBroadcastReceiver
import com.oes.pda.scanner.ScannerIntentNormalizer

/** Hosts the packaged PDA Web app in a controlled Android WebView shell. */
class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var cameraCaptureCoordinator: CameraCaptureCoordinator
    private val scannerReceiver = ScannerBroadcastReceiver(::pushScanResult)

    /** Creates the WebView container and loads the static PDA Web assets packaged in the APK. */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        cameraCaptureCoordinator = CameraCaptureCoordinator(
            this,
            "$packageName.fileprovider",
        )
        webView = WebView(this).apply {
                webViewClient = object : WebViewClient() {
                    /** Serves packaged WebView assets with explicit MIME types for older Android WebView engines. */
                    override fun shouldInterceptRequest(
                        view: WebView,
                        request: WebResourceRequest,
                    ): WebResourceResponse? {
                        return openPackagedAsset(request.url.toString())
                            ?: super.shouldInterceptRequest(view, request)
                    }

                    /** Logs rendered DOM state so real PDA WebView failures can be diagnosed from logcat. */
                    override fun onPageFinished(view: WebView, url: String) {
                        super.onPageFinished(view, url)
                        if (!BuildConfig.DEBUG) {
                            return
                        }

                        view.evaluateJavascript(
                            """
                            JSON.stringify({
                              readyState: document.readyState,
                              bodyText: document.body ? document.body.innerText.slice(0, 120) : null,
                              bodyBg: document.body ? getComputedStyle(document.body).backgroundColor : null,
                              appHtmlLength: document.getElementById('app') ? document.getElementById('app').innerHTML.length : -1
                            })
                            """.trimIndent(),
                        ) { result -> Log.i(TAG, "PDA WebView DOM diagnostic: $result") }
                    }
                }
                webChromeClient = object : WebChromeClient() {
                    /** Mirrors WebView console messages into logcat for PDA device debugging. */
                    override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                        if (BuildConfig.DEBUG) {
                            Log.i(
                                TAG,
                                "PDA Web console: ${consoleMessage.message()} " +
                                    "(${consoleMessage.sourceId()}:${consoleMessage.lineNumber()})",
                            )
                        }
                        return true
                    }
                }
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }
                WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
                addJavascriptInterface(
                    OesPdaBridge(
                        this@MainActivity,
                        DeviceInfoProvider(this@MainActivity),
                        NetworkStatusProvider(this@MainActivity),
                        NativeFeedbackController(this@MainActivity),
                        cameraCaptureCoordinator::openCamera,
                    ),
                    "OesPdaBridge",
                )
                setBackgroundColor(Color.WHITE)
                loadDataWithBaseURL(
                    PDA_ASSET_BASE_URL,
                    loadPackagedIndex(),
                    "text/html",
                    "UTF-8",
                    null,
                )
        }
        setContentView(webView)
    }

    /** Receives system-camera completion and resolves the matching PDA Web bridge request. */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        val completion = cameraCaptureCoordinator.handleActivityResult(requestCode, resultCode) ?: return
        pushCameraCaptureCompletion(completion)
    }

    /** Registers scanner broadcast receiver while the PDA shell is in the foreground. */
    override fun onResume() {
        super.onResume()
        registerScannerReceiver()
    }

    /** Unregisters scanner broadcast receiver to avoid leaking foreground-only diagnostics. */
    override fun onPause() {
        runCatching { unregisterReceiver(scannerReceiver) }
        super.onPause()
    }

    /** Opens static PDA Web assets from the APK with headers that WebView module loading requires. */
    private fun openPackagedAsset(url: String): WebResourceResponse? {
        val prefix = PDA_ASSET_BASE_URL
        if (!url.startsWith(prefix)) {
            return null
        }

        val assetPath = url.removePrefix(prefix).ifBlank { "index.html" }
        val mimeType = when {
            assetPath.endsWith(".html") -> "text/html"
            assetPath.endsWith(".js") -> "text/javascript"
            assetPath.endsWith(".css") -> "text/css"
            assetPath.endsWith(".json") -> "application/json"
            assetPath.endsWith(".svg") -> "image/svg+xml"
            assetPath.endsWith(".png") -> "image/png"
            assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg") -> "image/jpeg"
            assetPath.endsWith(".woff2") -> "font/woff2"
            else -> "application/octet-stream"
        }

        return runCatching {
            if (BuildConfig.DEBUG) {
                Log.i(TAG, "Serving PDA asset: $assetPath as $mimeType")
            }
            WebResourceResponse(
                mimeType,
                "UTF-8",
                200,
                "OK",
                mapOf("Access-Control-Allow-Origin" to "*"),
                assets.open(assetPath),
            )
        }.getOrNull()
    }

    /** Reads the generated PDA Web entry document from APK assets. */
    private fun loadPackagedIndex(): String {
        val indexHtml = assets.open("index.html").bufferedReader().use { it.readText() }
        val configScript = """
            <script>
              window.__OES_PDA_CONFIG__ = {
                bffBaseUrl: ${jsonString(BuildConfig.PDA_BFF_BASE_URL)}
              };
              ${if (BuildConfig.DEBUG) "window.__OES_PDA_DEBUG__ = true;" else ""}
            </script>
        """.trimIndent()
        return indexHtml.replace(
            "<head>",
            "<head>$configScript",
        )
    }

    /** Pushes a normalized scan event into the PDA Web event sink. */
    private fun pushScanResult(scanResult: NormalizedScanResult) {
        val eventJson = BridgeEventEnvelope.scanResult(scanResult).toJson()
        if (BuildConfig.DEBUG) {
            Log.i(TAG, "Pushing PDA scan event length=${scanResult.rawLength} source=${scanResult.scanSource}")
        }
        webView.post {
            webView.evaluateJavascript(
                "window.OesPdaBridgeEvents && window.OesPdaBridgeEvents.emit(${jsonString(eventJson)})",
                null,
            )
        }
    }

    /** Pushes async camera completion into the PDA Web bridge event sink. */
    private fun pushCameraCaptureCompletion(completion: CameraCaptureCoordinator.CameraCompletion) {
        val eventJson = BridgeEventEnvelope.cameraCaptureCompleted(completion.requestId, completion.result).toJson()
        if (BuildConfig.DEBUG) {
            Log.i(TAG, "Pushing PDA camera completion requestId=${completion.requestId}")
        }
        webView.post {
            webView.evaluateJavascript(
                "window.OesPdaBridgeEvents && window.OesPdaBridgeEvents.emit(${jsonString(eventJson)})",
                null,
            )
        }
    }

    /** Subscribes to known manufacturer scanner broadcast actions. */
    private fun registerScannerReceiver() {
        val filter = IntentFilter().apply {
            ScannerIntentNormalizer.supportedActions.forEach(::addAction)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(scannerReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(scannerReceiver, filter)
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

    companion object {
        private const val TAG = "OesPda"
        private const val PDA_ASSET_BASE_URL = "https://oes-pda.local/"
    }
}
