import { AdminCreateUserDto } from "../dtos/admin-create-user.dto";
import { IUserRepository } from "src/domain/repositories/user.repository";
export declare class AdminService {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    existsByEmailOrPhone(email: string, phone: string): Promise<boolean>;
    createUser(dto: AdminCreateUserDto): Promise<any>;
}
