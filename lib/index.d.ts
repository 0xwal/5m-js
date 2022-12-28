export {};

interface rpc
{
    [key: string]: Function;
    native: any;
}

declare global
{
    const I: any;

    const rpc: rpc;
}
