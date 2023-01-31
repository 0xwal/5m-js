export {};

interface rpc
{
    [key: string]: Function;

    native: any;
}

declare type Headers = { [key: string]: string }

interface RequestOptions
{
    method?: string;
    headers?: Headers;
    data?: any;
}

declare global
{
    const I: any;

    const rpc: rpc;

    function httpRequest(url: string, req?: RequestOptions);

    function httpRequestJson(url: string, req?: RequestOptions);
}
