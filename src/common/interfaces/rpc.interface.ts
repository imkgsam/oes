export interface RpcRequest<T=unknown>{
    payload:T,
    traceId:string,
    spanId:string,
    timestamp:string,
}

export interface RpcResponse<T=unknown>{
    code:string,
    message:string,
    messageKey:string,
    details:T,
    data:T,
    traceId:string,
    spanId:string,
    timestamp:string,
    callStack:string[],
    metadata:Record<string,string>,
}





// export interface RpcExceptionPayload {
//     code: string      // 全局唯一错误码，如 SYS2011001
//     message: string
//     messageKey: string
//     httpStatus: number
//     details?: any
//   }