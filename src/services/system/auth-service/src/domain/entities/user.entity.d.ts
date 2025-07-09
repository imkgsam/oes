import { User as PrismaUser } from '../../../prisma/generated/prisma';
export declare class User {
    readonly id: string;
    readonly email: string | null;
    readonly phone: string | null;
    readonly passwordHash: string | null;
    readonly googleId: string | null;
    readonly wechatOpenId: string | null;
    constructor(id: string, email: string | null, phone: string | null, passwordHash: string | null, googleId: string | null, wechatOpenId: string | null);
    static fromPrisma(prismaUser: PrismaUser): User;
    validatePassword(password: string): Promise<boolean>;
    hasPassword(): boolean;
}
