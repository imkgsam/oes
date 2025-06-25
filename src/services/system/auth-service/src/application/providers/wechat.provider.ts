import { Injectable } from "@nestjs/common";
import { IAuthProvider } from "./interfaces/auth-provider.interface";
import { User } from "src/domain/entities/user.entity";


@Injectable()
export class WechatAuthProvider implements IAuthProvider {
  authenticate(dto: any): Promise<User> {
    throw new Error("Method not implemented.");
  }
}