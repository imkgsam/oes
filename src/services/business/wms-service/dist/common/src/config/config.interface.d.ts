export interface ConfigService {
    get<T = any>(key: string): T;
    getAll(): Record<string, any>;
}
