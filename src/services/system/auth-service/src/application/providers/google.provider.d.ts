import { IAuthProvider } from "./interfaces/auth-provider.interface";
import { User } from "src/domain/entities/user.entity";
export declare class GoogleAuthProvider implements IAuthProvider {
    authenticate(dto: any): Promise<User>;
}
