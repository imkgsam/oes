package com.oes.pda.scanner

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage

/** Runs a native camera preview and decodes supported QR and barcode formats into one scan result. */
class CameraScannerActivity : ComponentActivity() {
    private lateinit var previewView: PreviewView
    private val scanner = BarcodeScanning.getClient(CameraBarcodeFormats.scannerOptions)
    private var completed = false
    private var analyzing = false

    /** Builds the scanner UI and starts camera preview after permission is granted. */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        previewView = PreviewView(this)
        setContentView(createContentView())

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA_PERMISSION)
        }
    }

    /** Starts scanning when the user grants camera access, otherwise returns cancellation. */
    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CAMERA_PERMISSION && grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
            startCamera()
            return
        }

        setResult(Activity.RESULT_CANCELED)
        finish()
    }

    /** Releases the ML Kit scanner when the activity is no longer needed. */
    override fun onDestroy() {
        scanner.close()
        super.onDestroy()
    }

    private fun createContentView(): FrameLayout {
        val root = FrameLayout(this)
        root.addView(previewView, FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

        val hint = TextView(this).apply {
            text = "对准二维码或一维条码"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 18f
            gravity = Gravity.CENTER
            setBackgroundColor(0x66000000)
            setPadding(24, 18, 24, 18)
        }
        val params = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM,
        ).apply {
            setMargins(24, 24, 24, 48)
        }
        root.addView(hint, params)
        return root
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener(
            {
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
                val analysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also {
                        it.setAnalyzer(ContextCompat.getMainExecutor(this), ::analyzeImage)
                    }

                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
            },
            ContextCompat.getMainExecutor(this),
        )
    }

    private fun analyzeImage(imageProxy: ImageProxy) {
        if (completed || analyzing) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        analyzing = true
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                val barcode = barcodes.firstOrNull { it.rawValue?.isNotBlank() == true }
                if (barcode != null) {
                    completeScan(barcode.rawValue.orEmpty(), CameraBarcodeFormats.formatName(barcode.format))
                }
            }
            .addOnCompleteListener {
                analyzing = false
                imageProxy.close()
            }
    }

    private fun completeScan(scanValue: String, symbology: String?) {
        if (completed) {
            return
        }

        completed = true
        setResult(
            Activity.RESULT_OK,
            Intent()
                .putExtra(EXTRA_SCAN_VALUE, scanValue)
                .putExtra(EXTRA_SYMBOLOGY, symbology),
        )
        finish()
    }

    companion object {
        const val EXTRA_SCAN_VALUE = "scanValue"
        const val EXTRA_SYMBOLOGY = "symbology"
        private const val REQUEST_CAMERA_PERMISSION = 7107
    }
}
