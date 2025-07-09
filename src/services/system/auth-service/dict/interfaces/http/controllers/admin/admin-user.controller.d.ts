import { AdminCreateUserDto } from '../../../../application/dtos/admin-create-user.dto';
import { AdminCreateUserUseCase } from '../../../../application/user-cases/admin/admin-create-user.use-case';
export declare class AdminUsersController {
    private readonly adminCreateUserUseCase;
    constructor(adminCreateUserUseCase: AdminCreateUserUseCase);
    listAllUsers(): Promise<void>;
    createNewUser(dto: AdminCreateUserDto): Promise<import("../../../../domain/entities/user.entity").User>;
}
