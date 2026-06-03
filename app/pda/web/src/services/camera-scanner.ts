import { DEFAULT_CAMERA_SCANNER_FORMATS, getBridgeClient } from '@/bridge/bridge-client';

/** Opens the native camera scanner for supported QR and one-dimensional barcode formats without interpreting the value. */
export async function openCameraScanner(): Promise<void> {
  const result = await getBridgeClient().openCameraScanner({ formats: DEFAULT_CAMERA_SCANNER_FORMATS });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
}
