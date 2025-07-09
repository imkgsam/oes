import { EmailPasswordLoginDto } from "src/application/dtos/login.dto";
import { AuthService } from "src/application/services/auth-service";
export declare class TcpAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginWithEmailPassword(dto: EmailPasswordLoginDto): Promise<any>;
}
