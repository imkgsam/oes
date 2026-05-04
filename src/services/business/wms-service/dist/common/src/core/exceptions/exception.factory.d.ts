import { DomainException, ApplicationException, InfrastructureException } from './oes.exception';
import { ExceptionDefinition } from './exception.interface';
export declare class ExceptionFactory {
    static domain(definition: ExceptionDefinition, internalDetails?: any): DomainException;
    static application(definition: ExceptionDefinition, internalDetails?: any): ApplicationException;
    static infrastructure(definition: ExceptionDefinition, internalDetails?: any): InfrastructureException;
}
