export declare class Permission {
    readonly id: string;
    code: string;
    module: string;
    description?: string;
    constructor(id: string, code: string, module: string, description?: string);
}
