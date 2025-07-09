export declare class Permission {
    readonly id: string;
    code: string;
    module: string;
    description?: string | undefined;
    constructor(id: string, code: string, module: string, description?: string | undefined);
}
