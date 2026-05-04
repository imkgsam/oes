import { CommandBus, ICommand } from '@nestjs/cqrs';
export declare class ValidatingCommandBus {
    private readonly commandBus;
    constructor(commandBus: CommandBus);
    execute<T extends ICommand, R = any>(command: T): Promise<R>;
    private validateCommand;
    private formatErrors;
    private extractConstraints;
}
