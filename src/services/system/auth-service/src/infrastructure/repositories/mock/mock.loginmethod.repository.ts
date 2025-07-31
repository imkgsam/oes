import { Injectable } from '@nestjs/common'
import { Credential, LoginMethod } from 'src/domain/entities/loginmethod.entity'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaUserRepository implements ILoginMethodRepository {
  private loginMethods = [
    {
      id: '1',
      userId: 'user_1',
      type: 'EMAIL',
      identifier: 'imkgsam@163.com',
      verified: true,
      enabled: true,
      createdAt: new Date('2025.07.20'),
      updatedAt: new Date('2025.07.20'),
    },
    {
      id: '2',
      userId: 'user_1',
      type: 'PHONE',
      identifier: '086 13827316628',
      verified: true,
      enabled: true,
      createdAt: new Date('2025.07.10'),
      updatedAt: new Date('2025.07.11'),
    },
  ]

  private credentials = [
    {
      
    }
  ]
  constructor() { }


  findById(id: string): Promise<LoginMethod | null> {
    throw new Error('Method not implemented.')
  }
  findAll(): Promise<LoginMethod[]> {
    throw new Error('Method not implemented.')
  }
  save(newOne: Partial<LoginMethod>): Promise<LoginMethod> {
    throw new Error('Method not implemented.')
  }
  delete(id: string): Promise<LoginMethod | null> {
    throw new Error('Method not implemented.')
  }
  _Credential: { findAll(): Promise<Credential>; delete(id: string): Promise<Credential | null>; findById(id: string): Promise<Credential | null> }

}
