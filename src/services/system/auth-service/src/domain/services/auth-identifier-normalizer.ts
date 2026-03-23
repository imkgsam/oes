import { LoginMethodType } from 'src/common/constants'

export class AuthIdentifierNormalizer {
  static normalize(type: LoginMethodType, identifier: string): string {
    const trimmed = identifier.trim()

    switch (type) {
      case LoginMethodType.EMAIL:
        return trimmed.toLowerCase()
      case LoginMethodType.PHONE:
        return this.normalizePhone(trimmed)
      default:
        return trimmed
    }
  }

  private static normalizePhone(input: string): string {
    const hasLeadingPlus = input.startsWith('+')
    const digits = input.replace(/\D/g, '')

    if (!digits) {
      return input.trim()
    }

    return hasLeadingPlus ? `+${digits}` : digits
  }
}
