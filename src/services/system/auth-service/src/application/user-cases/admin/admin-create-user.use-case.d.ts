import { AdminCreateUserDto } from "src/application/dtos/admin-create-user.dto";
import { AdminService } from "src/application/services/account.service";
import { User } from "src/domain/entities/user.entity";
export declare class AdminCreateUserUseCase {
    private readonly adminService;
    constructor(adminService: AdminService);
    execute(dto: AdminCreateUserDto): Promise<User>;
}
