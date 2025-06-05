type RPCHandler<T> = (serverId: number | string, ...args: any) => Promise<T> | T;
export declare const MAX_TIMEOUT: number;
export declare function localResourceName(name: string): string;
export declare function invoke(method: string, serverId: string | number, ...args: any[]): Promise<unknown>;
export declare function register<T>(method: string, handler: RPCHandler<T>): void;
export declare function rejectAllPendingClientRpcInvocationsForPlayer(serverId: number, reason: string): void;
export declare const rpc: any;
export {};
