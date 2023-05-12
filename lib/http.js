// noinspection JSUnresolvedFunction

/*

todo: methods: post,get
todo: options: headers,body

todo: add polyfill for fetch function
*/

const g_responseDescriptor = {};

/**
 * @typedef {Object} HttpResponse
 * @property {string} body
 * @property {number} statusCode
 * @property {Object} headers
 */


/**
 * @param {number} token
 * @param {number} statusCode
 * @param {string} body
 * @param {object} headers
 */
function handleHttpResponse(token, statusCode, body, headers, errorData) {
  // handle response
  const handler = g_responseDescriptor[token];

  delete g_responseDescriptor[token];

  if (!handler) {
    throw new Error(`Invalid token ${token}`);
  }

  /**
   * @type HttpResponse
   */
  const response = {
    statusCode,
    body,
    headers,
    errorData
  };

  handler(response);
}

removeEventListener("__cfx_internal:httpResponse", handleHttpResponse);
addEventListener("__cfx_internal:httpResponse", handleHttpResponse);

function httpRequest(url, requestOptions) {
  const request = {
    method: requestOptions?.method ?? "GET",
    headers: requestOptions?.headers ?? {},
    data: requestOptions?.data ?? "",
    url
  };

  return new Promise((r) => {
    const id = PerformHttpRequestInternalEx(request);
    g_responseDescriptor[id] = r;
  });
}

function httpRequestJson(url, requestOptions) {
  requestOptions.data = JSON.stringify(requestOptions?.data ?? {});
  if (!requestOptions.headers) {
    requestOptions.headers = {};
  }

  requestOptions.headers["Content-Type"] = "application/json";

  return httpRequest(url, requestOptions);
}

global.httpRequest = httpRequest;
global.httpRequestJson = httpRequestJson;

