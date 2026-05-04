"use strict";
/**
 * 环境变量辅助工具
 * 提供统一的环境判断和配置管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = exports.getCurrentEnv = exports.isTest = exports.isProduction = exports.isDevelopment = void 0;
exports.envConditional = envConditional;
exports.envValue = envValue;
/**
 * 判断是否为开发环境
 * 包括 development 和 test 环境
 */
const isDevelopment = () => {
    const nodeEnv = process.env.NODE_ENV;
    return nodeEnv === 'development' || nodeEnv === 'test';
};
exports.isDevelopment = isDevelopment;
/**
 * 判断是否为生产环境
 */
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
/**
 * 判断是否为测试环境
 */
const isTest = () => {
    return process.env.NODE_ENV === 'test';
};
exports.isTest = isTest;
/**
 * 获取当前环境名称
 */
const getCurrentEnv = () => {
    return process.env.NODE_ENV || 'development';
};
exports.getCurrentEnv = getCurrentEnv;
/**
 * 环境配置对象
 * 根据环境返回不同的配置
 * 支持通过环境变量进行细粒度控制
 */
exports.envConfig = {
    /**
     * 是否显示调试信息
     * 可通过 DEBUG_INFO=true/false 覆盖
     * 默认在开发环境中显示
     */
    showDebugInfo: process.env.DEBUG_INFO === 'true' ||
        (process.env.DEBUG_INFO !== 'false' && ((0, exports.isDevelopment)() || !process.env.NODE_ENV)),
    /**
     * 是否显示 RPC 调用模式
     * 可通过 SHOW_RPC_PATTERN=true/false 覆盖
     * 默认在开发环境中显示
     */
    showRpcPattern: process.env.SHOW_RPC_PATTERN === 'true' ||
        (process.env.SHOW_RPC_PATTERN !== 'false' && ((0, exports.isDevelopment)() || !process.env.NODE_ENV)),
    /**
     * 是否显示详细的错误堆栈
     * 可通过 SHOW_ERROR_STACK=true/false 覆盖
     */
    showErrorStack: process.env.SHOW_ERROR_STACK === 'true' ||
        (process.env.SHOW_ERROR_STACK !== 'false' && (0, exports.isDevelopment)()),
    /**
     * 是否启用性能监控
     * 可通过 ENABLE_PERFORMANCE_MONITORING=true/false 覆盖
     */
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true' ||
        (process.env.ENABLE_PERFORMANCE_MONITORING !== 'false' && (0, exports.isDevelopment)()),
    /**
     * 日志级别
     * 可通过 LOG_LEVEL 环境变量覆盖
     */
    logLevel: process.env.LOG_LEVEL || ((0, exports.isDevelopment)() ? 'debug' : 'info')
};
// 调试信息：在模块加载时打印环境配置
console.log('🔧 Environment Config:', {
    NODE_ENV: process.env.NODE_ENV,
    isDevelopment: (0, exports.isDevelopment)(),
    showDebugInfo: exports.envConfig.showDebugInfo,
    showRpcPattern: exports.envConfig.showRpcPattern,
    SHOW_RPC_PATTERN: process.env.SHOW_RPC_PATTERN
});
/**
 * 根据环境条件执行不同的逻辑
 * @param devFn 开发环境执行的函数
 * @param prodFn 生产环境执行的函数（可选）
 * @returns 执行结果
 */
function envConditional(devFn, prodFn) {
    if ((0, exports.isDevelopment)()) {
        return devFn();
    }
    return prodFn?.();
}
/**
 * 根据环境条件返回不同的值
 * @param devValue 开发环境的值
 * @param prodValue 生产环境的值
 * @returns 对应的值
 */
function envValue(devValue, prodValue) {
    return (0, exports.isDevelopment)() ? devValue : prodValue;
}
//# sourceMappingURL=env.helper.js.map