declare module 'qrcode' {
  export type QrCodeToDataUrlOptions = {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    margin?: number
    scale?: number
    type?: 'image/png'
  }

  const QRCode: {
    toDataURL(content: string, options?: QrCodeToDataUrlOptions): Promise<string>
  }

  export default QRCode
}
