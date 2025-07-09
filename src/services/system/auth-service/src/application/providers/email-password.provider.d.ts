import { IAuthProvider } from "./interfaces/auth-provider.interface";
import { EmailPasswordLoginDto } from "../dtos/login.dto";
import { User } from "src/domain/entities/user.entity";
import { IUserRepository } from "src/domain/repositories/user.repository";
export declare class EmailPasswordAuthProvider implements IAuthProvider<EmailPasswordLoginDto> {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    authenticate(dto: EmailPasswordLoginDto): Promise<User>;
}
