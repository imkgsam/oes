import { User } from "src/domain/entities/user.entity";
import { IAuthProvider } from "./interfaces/auth-provider.interface";
export declare class EmailOtpProvider implements IAuthProvider {
    authenticate(dto: any): Promise<User>;
}
export declare class PhoneOtpProvider implements IAuthProvider {
    authenticate(dto: any): Promise<User>;
}
