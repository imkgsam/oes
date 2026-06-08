import QRCode from 'qrcode'

// QrCodeService dynamically encodes a ShortLink public URL into a basic PNG image.
export class QrCodeService {
  async generatePngBase64(content: string): Promise<string> {
    const dataUrl = await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
      type: 'image/png'
    })
    return dataUrl.replace(/^data:image\/png;base64,/, '')
  }
}
