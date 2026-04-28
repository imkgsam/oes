import { CanActivate, ExecutionContext } from '@nestjs/common';
import { InternalServiceAuthenticator, OperatorContextVerifier } from '@oes/common/authorization';
/** ItemMasterRpcContextGuard enforces the frozen item-master internal, operator, and trace context contract. */
export declare class ItemMasterRpcContextGuard implements CanActivate {
    private readonly internalServiceAuthenticator;
    private readonly operatorContextVerifier;
    constructor(internalServiceAuthenticator: InternalServiceAuthenticator, operatorContextVerifier: OperatorContextVerifier);
    canActivate(context: ExecutionContext): boolean;
}
