import { User } from 'src/domain/entities/credential.entity'
import { IAuthProvider } from './interfaces/auth-provider.interface'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EmailOtpProvider implements IAuthProvider {
  authenticate(dto: any): Promise<User> {
    throw new Error('Method not implemented.')
  }
}
@Injectable()
export class PhoneOtpProvider implements IAuthProvider {
  authenticate(dto: any): Promise<User> {
    throw new Error('Method not implemented.')
  }
}
