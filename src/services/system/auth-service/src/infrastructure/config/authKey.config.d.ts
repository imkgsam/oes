export declare const AuthKeyConfigName = "authkey";
export interface IAuthKeyConfig {
    privateKeyPath: string;
    publicKeyPath: string;
}
declare const _default: (() => {
    publicKeyPath: string | undefined;
    privateKeyPath: string | undefined;
}) & import("node_modules/@nestjs/config").ConfigFactoryKeyHost<{
    publicKeyPath: string | undefined;
    privateKeyPath: string | undefined;
}>;
export default _default;
