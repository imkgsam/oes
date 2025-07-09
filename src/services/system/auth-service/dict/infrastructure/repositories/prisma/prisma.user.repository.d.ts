import { User } from "src/domain/entities/user.entity";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { PrismaService } from "src/infrastructure/prisma/prisma.service";
export declare class PrismaUserRepository implements IUserRepository {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    findByFields(fields: Partial<User>): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    findByWechatOpenId(wechatOpenId: string): Promise<User | null>;
    create(user: Partial<User>): Promise<User>;
}
