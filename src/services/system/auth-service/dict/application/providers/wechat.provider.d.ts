import { IAuthProvider } from "./interfaces/auth-provider.interface";
import { User } from "src/domain/entities/user.entity";
export declare class WechatAuthProvider implements IAuthProvider {
    authenticate(dto: any): Promise<User>;
}
