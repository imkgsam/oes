/**
 * 环境变量辅助工具
 * 提供统一的环境判断和配置管理
 */
/**
 * 判断是否为开发环境
 * 包括 development 和 test 环境
 */
export declare const isDevelopment: () => boolean;
/**
 * 判断是否为生产环境
 */
export declare const isProduction: () => boolean;
/**
 * 判断是否为测试环境
 */
export declare const isTest: () => boolean;
/**
 * 获取当前环境名称
 */
export declare const getCurrentEnv: () => string;
/**
 * 环境配置对象
 * 根据环境返回不同的配置
 * 支持通过环境变量进行细粒度控制
 */
export declare const envConfig: {
    /**
     * 是否显示调试信息
     * 可通过 DEBUG_INFO=true/false 覆盖
     * 默认在开发环境中显示
     */
    readonly showDebugInfo: boolean;
    /**
     * 是否显示 RPC 调用模式
     * 可通过 SHOW_RPC_PATTERN=true/false 覆盖
     * 默认在开发环境中显示
     */
    readonly showRpcPattern: boolean;
    /**
     * 是否显示详细的错误堆栈
     * 可通过 SHOW_ERROR_STACK=true/false 覆盖
     */
    readonly showErrorStack: boolean;
    /**
     * 是否启用性能监控
     * 可通过 ENABLE_PERFORMANCE_MONITORING=true/false 覆盖
     */
    readonly enablePerformanceMonitoring: boolean;
    /**
     * 日志级别
     * 可通过 LOG_LEVEL 环境变量覆盖
     */
    readonly logLevel: string;
};
/**
 * 根据环境条件执行不同的逻辑
 * @param devFn 开发环境执行的函数
 * @param prodFn 生产环境执行的函数（可选）
 * @returns 执行结果
 */
export declare function envConditional<T>(devFn: () => T, prodFn?: () => T): T | undefined;
/**
 * 根据环境条件返回不同的值
 * @param devValue 开发环境的值
 * @param prodValue 生产环境的值
 * @returns 对应的值
 */
export declare function envValue<T>(devValue: T, prodValue: T): T;
