import { QueryBus, IQuery } from '@nestjs/cqrs';
export declare class ValidatingQueryBus {
    private readonly queryBus;
    constructor(queryBus: QueryBus);
    execute<T extends IQuery, R = any>(query: T): Promise<R>;
    private validateQuery;
    private formatErrors;
    private extractConstraints;
}
