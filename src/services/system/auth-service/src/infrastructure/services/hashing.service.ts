// infra/hashing/bcrypt-hashing.service.ts
import * as bcrypt from 'bcrypt'
import { Injectable } from '@nestjs/common'
import { HashingPort } from '../../domain/ports/hashing.port'

@Injectable()
export class BcryptHashingService implements HashingPort {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10)
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed)
  }
}
