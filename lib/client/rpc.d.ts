type RPCHandler<T> = (...args: any) => Promise<T> | T;
export declare const MAX_TIMEOUT: number;
export declare function invoke(method: string, ...args: any[]): Promise<unknown>;
export declare function register<T>(method: string, handler: RPCHandler<T>): void;
export declare const rpc: any;
export {};
