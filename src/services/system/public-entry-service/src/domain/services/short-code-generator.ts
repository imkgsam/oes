const BASE58_LIKE_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// ShortCodeGenerator creates collision-resistant Base58-like short codes without ambiguous characters.
export class ShortCodeGenerator {
  private sequence = 0

  constructor(private readonly random: () => number = Math.random) {}

  generate(length = 7): string {
    let code = ''
    this.sequence += 1
    for (let index = 0; index < length; index += 1) {
      const randomOffset = Math.floor(this.random() * BASE58_LIKE_ALPHABET.length)
      const charIndex = (randomOffset + this.sequence + index * 17) % BASE58_LIKE_ALPHABET.length
      code += BASE58_LIKE_ALPHABET[charIndex]
    }
    return code
  }
}
