import { registerAs } from '@nestjs/config'

export const AuthKeyConfigName = 'authkey'

export interface IAuthKeyConfig {
  privateKeyPath: string
  publicKeyPath: string
}

export default registerAs(AuthKeyConfigName, () => ({
  publicKeyPath: process.env.AUTH_PUBLIC_KEY_PATH,
  privateKeyPath: process.env.AUTH_PRIVATE_KEY_PATH,
}))
