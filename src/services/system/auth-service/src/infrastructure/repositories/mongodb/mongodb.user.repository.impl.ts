import { Injectable } from "@nestjs/common";
import { IUserRepository } from '../../../domain/repositories/user.repository'
import { User } from "src/domain/entities/user.entity";

@Injectable()

export class UserRepositoryMongo implements IUserRepository {
  findByEmail(email: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  findByPhone(phone: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  findByGoogleId(googleId: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  findByWechatOpenId(wechatOpenId: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  create(user: Partial<User>): Promise<User> {
    throw new Error("Method not implemented.");
  }

}