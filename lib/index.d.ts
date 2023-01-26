export {};

interface rpc
{
    [key: string]: Function;

    native: any;
}

declare type Header = { [key: string]: string }

interface RequestOptions
{
    method?: string;
    headers?: Header[];
    data?: any;
}

declare global
{
    const I: any;

    const rpc: rpc;

    function httpRequest(url: string, req?: RequestOptions);

    function httpRequestJson(url: string, req?: RequestOptions);
}
