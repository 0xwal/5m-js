// noinspection JSUnresolvedFunction

/*

todo:
methods: post,get
options: headers,body
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
function handleHttpResponse(token, statusCode, body, headers) {
  // handle response
  const handler = g_responseDescriptor[token];
  if (!handler) {
    throw new Error("Invalid token");
  }

  /**
   * @type HttpResponse
   */
  const response = {
    statusCode,
    body,
    headers
  };

  handler(response);
}

on("__cfx_internal:httpResponse", handleHttpResponse);


function httpRequest(url, requestOptions) {

  const request = {
    method: requestOptions?.method ?? "GET",
    headers: requestOptions?.headers ?? {},
    data: requestOptions?.data ?? "",
    url
  };

  const id = PerformHttpRequestInternalEx(request);

  return new Promise((r) => {
    g_responseDescriptor[id] = r;
  });
}

function httpRequestJson(url, requestOptions) {
  requestOptions.data = JSON.stringify(requestOptions.data ?? {});
  if (!requestOptions.headers) {
    requestOptions.headers = {};
  }

  requestOptions.headers["Content-Type"] = "application/json";

  return httpRequest(url, requestOptions);
}
