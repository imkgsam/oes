package com.oes.pda.camera

import android.app.Activity
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.oes.pda.bridge.BridgeResult
import java.io.File
import java.time.Instant

/** Coordinates one system-camera capture and converts the result into PDA photo metadata. */
class CameraCaptureCoordinator(
    private val activity: Activity,
    private val fileProviderAuthority: String,
) {
    private var pendingCapture: PendingCapture? = null

    /** Starts Android system camera capture for a Web request id. */
    fun openCamera(requestId: String): BridgeResult {
        if (pendingCapture != null) {
            return BridgeResult.failure("CAMERA_CAPTURE_BUSY", "Another camera capture is already in progress")
        }

        val photoFile = createPhotoFile()
        val photoUri = FileProvider.getUriForFile(activity, fileProviderAuthority, photoFile)
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
            putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        }

        if (intent.resolveActivity(activity.packageManager) == null) {
            return BridgeResult.failure("CAMERA_CAPTURE_FAILED", "No camera application is available")
        }

        pendingCapture = PendingCapture(
            requestId = requestId,
            file = photoFile,
            uri = photoUri,
        )
        activity.startActivityForResult(intent, REQUEST_CODE)

        return BridgeResult.success(mapOf("accepted" to true, "requestId" to requestId))
    }

    /** Converts Android activity result into the async bridge completion payload. */
    fun handleActivityResult(requestCode: Int, resultCode: Int): CameraCompletion? {
        if (requestCode != REQUEST_CODE) {
            return null
        }

        val capture = pendingCapture ?: return null
        pendingCapture = null

        if (resultCode != Activity.RESULT_OK) {
            capture.file.delete()
            return CameraCompletion(
                requestId = capture.requestId,
                result = BridgeResult.failure("CAMERA_CAPTURE_CANCELLED", "Camera capture was cancelled"),
            )
        }

        if (!capture.file.exists() || capture.file.length() <= 0) {
            return CameraCompletion(
                requestId = capture.requestId,
                result = BridgeResult.failure("CAMERA_CAPTURE_FAILED", "Camera did not return a photo file"),
            )
        }

        return CameraCompletion(
            requestId = capture.requestId,
            result = BridgeResult.success(photoMetadata(capture)),
        )
    }

    private fun createPhotoFile(): File {
        val directory = File(activity.cacheDir, "oes-pda-camera").apply { mkdirs() }
        return File(directory, "photo_${Instant.now().toEpochMilli()}.jpg")
    }

    private fun photoMetadata(capture: PendingCapture): Map<String, Any?> {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(capture.file.absolutePath, bounds)

        return mapOf(
            "localUri" to capture.uri.toString(),
            "fileName" to capture.file.name,
            "mimeType" to "image/jpeg",
            "sizeBytes" to capture.file.length(),
            "width" to bounds.outWidth.takeIf { it > 0 },
            "height" to bounds.outHeight.takeIf { it > 0 },
        )
    }

    private data class PendingCapture(
        val requestId: String,
        val file: File,
        val uri: Uri,
    )

    data class CameraCompletion(
        val requestId: String,
        val result: BridgeResult,
    )

    companion object {
        const val REQUEST_CODE = 6107
    }
}
