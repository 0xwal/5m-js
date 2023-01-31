export {};

declare type Headers = { [key: string]: string }

interface rpc
{
    [key: string]: Function;

    native: any;
}

interface Response
{
    statusCode: number;
    body: string;
    headers: Headers;
    errorData: string;
}


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

    function httpRequest(url: string, req?: RequestOptions): Response;

    function httpRequestJson(url: string, req?: RequestOptions): Response;
}
