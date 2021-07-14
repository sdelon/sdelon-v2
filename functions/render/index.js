var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, Readable, wm, Blob, fetchBlob, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new fetchBlob([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/node-fetch/lib/index.js
var require_lib = __commonJS({
  "node_modules/node-fetch/lib/index.js"(exports, module2) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var Stream2 = _interopDefault(require("stream"));
    var http2 = _interopDefault(require("http"));
    var Url = _interopDefault(require("url"));
    var https2 = _interopDefault(require("https"));
    var zlib2 = _interopDefault(require("zlib"));
    var Readable2 = Stream2.Readable;
    var BUFFER = Symbol("buffer");
    var TYPE = Symbol("type");
    var Blob2 = class {
      constructor() {
        this[TYPE] = "";
        const blobParts = arguments[0];
        const options2 = arguments[1];
        const buffers = [];
        let size = 0;
        if (blobParts) {
          const a = blobParts;
          const length = Number(a.length);
          for (let i = 0; i < length; i++) {
            const element = a[i];
            let buffer;
            if (element instanceof Buffer) {
              buffer = element;
            } else if (ArrayBuffer.isView(element)) {
              buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
            } else if (element instanceof ArrayBuffer) {
              buffer = Buffer.from(element);
            } else if (element instanceof Blob2) {
              buffer = element[BUFFER];
            } else {
              buffer = Buffer.from(typeof element === "string" ? element : String(element));
            }
            size += buffer.length;
            buffers.push(buffer);
          }
        }
        this[BUFFER] = Buffer.concat(buffers);
        let type = options2 && options2.type !== void 0 && String(options2.type).toLowerCase();
        if (type && !/[^\u0020-\u007E]/.test(type)) {
          this[TYPE] = type;
        }
      }
      get size() {
        return this[BUFFER].length;
      }
      get type() {
        return this[TYPE];
      }
      text() {
        return Promise.resolve(this[BUFFER].toString());
      }
      arrayBuffer() {
        const buf = this[BUFFER];
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        return Promise.resolve(ab);
      }
      stream() {
        const readable = new Readable2();
        readable._read = function() {
        };
        readable.push(this[BUFFER]);
        readable.push(null);
        return readable;
      }
      toString() {
        return "[object Blob]";
      }
      slice() {
        const size = this.size;
        const start = arguments[0];
        const end = arguments[1];
        let relativeStart, relativeEnd;
        if (start === void 0) {
          relativeStart = 0;
        } else if (start < 0) {
          relativeStart = Math.max(size + start, 0);
        } else {
          relativeStart = Math.min(start, size);
        }
        if (end === void 0) {
          relativeEnd = size;
        } else if (end < 0) {
          relativeEnd = Math.max(size + end, 0);
        } else {
          relativeEnd = Math.min(end, size);
        }
        const span = Math.max(relativeEnd - relativeStart, 0);
        const buffer = this[BUFFER];
        const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
        const blob = new Blob2([], { type: arguments[2] });
        blob[BUFFER] = slicedBuffer;
        return blob;
      }
    };
    Object.defineProperties(Blob2.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Object.defineProperty(Blob2.prototype, Symbol.toStringTag, {
      value: "Blob",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function FetchError2(message, type, systemError) {
      Error.call(this, message);
      this.message = message;
      this.type = type;
      if (systemError) {
        this.code = this.errno = systemError.code;
      }
      Error.captureStackTrace(this, this.constructor);
    }
    FetchError2.prototype = Object.create(Error.prototype);
    FetchError2.prototype.constructor = FetchError2;
    FetchError2.prototype.name = "FetchError";
    var convert;
    try {
      convert = require("encoding").convert;
    } catch (e) {
    }
    var INTERNALS2 = Symbol("Body internals");
    var PassThrough2 = Stream2.PassThrough;
    function Body2(body) {
      var _this = this;
      var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$size = _ref.size;
      let size = _ref$size === void 0 ? 0 : _ref$size;
      var _ref$timeout = _ref.timeout;
      let timeout = _ref$timeout === void 0 ? 0 : _ref$timeout;
      if (body == null) {
        body = null;
      } else if (isURLSearchParams(body)) {
        body = Buffer.from(body.toString());
      } else if (isBlob2(body))
        ;
      else if (Buffer.isBuffer(body))
        ;
      else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        body = Buffer.from(body);
      } else if (ArrayBuffer.isView(body)) {
        body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
      } else if (body instanceof Stream2)
        ;
      else {
        body = Buffer.from(String(body));
      }
      this[INTERNALS2] = {
        body,
        disturbed: false,
        error: null
      };
      this.size = size;
      this.timeout = timeout;
      if (body instanceof Stream2) {
        body.on("error", function(err) {
          const error3 = err.name === "AbortError" ? err : new FetchError2(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, "system", err);
          _this[INTERNALS2].error = error3;
        });
      }
    }
    Body2.prototype = {
      get body() {
        return this[INTERNALS2].body;
      },
      get bodyUsed() {
        return this[INTERNALS2].disturbed;
      },
      arrayBuffer() {
        return consumeBody2.call(this).then(function(buf) {
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        });
      },
      blob() {
        let ct = this.headers && this.headers.get("content-type") || "";
        return consumeBody2.call(this).then(function(buf) {
          return Object.assign(new Blob2([], {
            type: ct.toLowerCase()
          }), {
            [BUFFER]: buf
          });
        });
      },
      json() {
        var _this2 = this;
        return consumeBody2.call(this).then(function(buffer) {
          try {
            return JSON.parse(buffer.toString());
          } catch (err) {
            return Body2.Promise.reject(new FetchError2(`invalid json response body at ${_this2.url} reason: ${err.message}`, "invalid-json"));
          }
        });
      },
      text() {
        return consumeBody2.call(this).then(function(buffer) {
          return buffer.toString();
        });
      },
      buffer() {
        return consumeBody2.call(this);
      },
      textConverted() {
        var _this3 = this;
        return consumeBody2.call(this).then(function(buffer) {
          return convertBody(buffer, _this3.headers);
        });
      }
    };
    Object.defineProperties(Body2.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    Body2.mixIn = function(proto) {
      for (const name of Object.getOwnPropertyNames(Body2.prototype)) {
        if (!(name in proto)) {
          const desc = Object.getOwnPropertyDescriptor(Body2.prototype, name);
          Object.defineProperty(proto, name, desc);
        }
      }
    };
    function consumeBody2() {
      var _this4 = this;
      if (this[INTERNALS2].disturbed) {
        return Body2.Promise.reject(new TypeError(`body used already for: ${this.url}`));
      }
      this[INTERNALS2].disturbed = true;
      if (this[INTERNALS2].error) {
        return Body2.Promise.reject(this[INTERNALS2].error);
      }
      let body = this.body;
      if (body === null) {
        return Body2.Promise.resolve(Buffer.alloc(0));
      }
      if (isBlob2(body)) {
        body = body.stream();
      }
      if (Buffer.isBuffer(body)) {
        return Body2.Promise.resolve(body);
      }
      if (!(body instanceof Stream2)) {
        return Body2.Promise.resolve(Buffer.alloc(0));
      }
      let accum = [];
      let accumBytes = 0;
      let abort = false;
      return new Body2.Promise(function(resolve2, reject) {
        let resTimeout;
        if (_this4.timeout) {
          resTimeout = setTimeout(function() {
            abort = true;
            reject(new FetchError2(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, "body-timeout"));
          }, _this4.timeout);
        }
        body.on("error", function(err) {
          if (err.name === "AbortError") {
            abort = true;
            reject(err);
          } else {
            reject(new FetchError2(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, "system", err));
          }
        });
        body.on("data", function(chunk) {
          if (abort || chunk === null) {
            return;
          }
          if (_this4.size && accumBytes + chunk.length > _this4.size) {
            abort = true;
            reject(new FetchError2(`content size at ${_this4.url} over limit: ${_this4.size}`, "max-size"));
            return;
          }
          accumBytes += chunk.length;
          accum.push(chunk);
        });
        body.on("end", function() {
          if (abort) {
            return;
          }
          clearTimeout(resTimeout);
          try {
            resolve2(Buffer.concat(accum, accumBytes));
          } catch (err) {
            reject(new FetchError2(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, "system", err));
          }
        });
      });
    }
    function convertBody(buffer, headers) {
      if (typeof convert !== "function") {
        throw new Error("The package `encoding` must be installed to use the textConverted() function");
      }
      const ct = headers.get("content-type");
      let charset = "utf-8";
      let res, str;
      if (ct) {
        res = /charset=([^;]*)/i.exec(ct);
      }
      str = buffer.slice(0, 1024).toString();
      if (!res && str) {
        res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
      }
      if (!res && str) {
        res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
        if (!res) {
          res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
          if (res) {
            res.pop();
          }
        }
        if (res) {
          res = /charset=(.*)/i.exec(res.pop());
        }
      }
      if (!res && str) {
        res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
      }
      if (res) {
        charset = res.pop();
        if (charset === "gb2312" || charset === "gbk") {
          charset = "gb18030";
        }
      }
      return convert(buffer, "UTF-8", charset).toString();
    }
    function isURLSearchParams(obj) {
      if (typeof obj !== "object" || typeof obj.append !== "function" || typeof obj.delete !== "function" || typeof obj.get !== "function" || typeof obj.getAll !== "function" || typeof obj.has !== "function" || typeof obj.set !== "function") {
        return false;
      }
      return obj.constructor.name === "URLSearchParams" || Object.prototype.toString.call(obj) === "[object URLSearchParams]" || typeof obj.sort === "function";
    }
    function isBlob2(obj) {
      return typeof obj === "object" && typeof obj.arrayBuffer === "function" && typeof obj.type === "string" && typeof obj.stream === "function" && typeof obj.constructor === "function" && typeof obj.constructor.name === "string" && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
    }
    function clone2(instance) {
      let p1, p2;
      let body = instance.body;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof Stream2 && typeof body.getBoundary !== "function") {
        p1 = new PassThrough2();
        p2 = new PassThrough2();
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS2].body = p1;
        body = p2;
      }
      return body;
    }
    function extractContentType2(body) {
      if (body === null) {
        return null;
      } else if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      } else if (isURLSearchParams(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      } else if (isBlob2(body)) {
        return body.type || null;
      } else if (Buffer.isBuffer(body)) {
        return null;
      } else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        return null;
      } else if (ArrayBuffer.isView(body)) {
        return null;
      } else if (typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      } else if (body instanceof Stream2) {
        return null;
      } else {
        return "text/plain;charset=UTF-8";
      }
    }
    function getTotalBytes2(instance) {
      const body = instance.body;
      if (body === null) {
        return 0;
      } else if (isBlob2(body)) {
        return body.size;
      } else if (Buffer.isBuffer(body)) {
        return body.length;
      } else if (body && typeof body.getLengthSync === "function") {
        if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || body.hasKnownLength && body.hasKnownLength()) {
          return body.getLengthSync();
        }
        return null;
      } else {
        return null;
      }
    }
    function writeToStream2(dest, instance) {
      const body = instance.body;
      if (body === null) {
        dest.end();
      } else if (isBlob2(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    }
    Body2.Promise = global.Promise;
    var invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
    var invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
    function validateName(name) {
      name = `${name}`;
      if (invalidTokenRegex.test(name) || name === "") {
        throw new TypeError(`${name} is not a legal HTTP header name`);
      }
    }
    function validateValue(value) {
      value = `${value}`;
      if (invalidHeaderCharRegex.test(value)) {
        throw new TypeError(`${value} is not a legal HTTP header value`);
      }
    }
    function find(map, name) {
      name = name.toLowerCase();
      for (const key in map) {
        if (key.toLowerCase() === name) {
          return key;
        }
      }
      return void 0;
    }
    var MAP = Symbol("map");
    var Headers2 = class {
      constructor() {
        let init2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        this[MAP] = Object.create(null);
        if (init2 instanceof Headers2) {
          const rawHeaders = init2.raw();
          const headerNames = Object.keys(rawHeaders);
          for (const headerName of headerNames) {
            for (const value of rawHeaders[headerName]) {
              this.append(headerName, value);
            }
          }
          return;
        }
        if (init2 == null)
          ;
        else if (typeof init2 === "object") {
          const method = init2[Symbol.iterator];
          if (method != null) {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            const pairs = [];
            for (const pair of init2) {
              if (typeof pair !== "object" || typeof pair[Symbol.iterator] !== "function") {
                throw new TypeError("Each header pair must be iterable");
              }
              pairs.push(Array.from(pair));
            }
            for (const pair of pairs) {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              this.append(pair[0], pair[1]);
            }
          } else {
            for (const key of Object.keys(init2)) {
              const value = init2[key];
              this.append(key, value);
            }
          }
        } else {
          throw new TypeError("Provided initializer must be an object");
        }
      }
      get(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key === void 0) {
          return null;
        }
        return this[MAP][key].join(", ");
      }
      forEach(callback) {
        let thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
        let pairs = getHeaders(this);
        let i = 0;
        while (i < pairs.length) {
          var _pairs$i = pairs[i];
          const name = _pairs$i[0], value = _pairs$i[1];
          callback.call(thisArg, value, name, this);
          pairs = getHeaders(this);
          i++;
        }
      }
      set(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        this[MAP][key !== void 0 ? key : name] = [value];
      }
      append(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          this[MAP][key].push(value);
        } else {
          this[MAP][name] = [value];
        }
      }
      has(name) {
        name = `${name}`;
        validateName(name);
        return find(this[MAP], name) !== void 0;
      }
      delete(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          delete this[MAP][key];
        }
      }
      raw() {
        return this[MAP];
      }
      keys() {
        return createHeadersIterator(this, "key");
      }
      values() {
        return createHeadersIterator(this, "value");
      }
      [Symbol.iterator]() {
        return createHeadersIterator(this, "key+value");
      }
    };
    Headers2.prototype.entries = Headers2.prototype[Symbol.iterator];
    Object.defineProperty(Headers2.prototype, Symbol.toStringTag, {
      value: "Headers",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Headers2.prototype, {
      get: { enumerable: true },
      forEach: { enumerable: true },
      set: { enumerable: true },
      append: { enumerable: true },
      has: { enumerable: true },
      delete: { enumerable: true },
      keys: { enumerable: true },
      values: { enumerable: true },
      entries: { enumerable: true }
    });
    function getHeaders(headers) {
      let kind = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key+value";
      const keys = Object.keys(headers[MAP]).sort();
      return keys.map(kind === "key" ? function(k) {
        return k.toLowerCase();
      } : kind === "value" ? function(k) {
        return headers[MAP][k].join(", ");
      } : function(k) {
        return [k.toLowerCase(), headers[MAP][k].join(", ")];
      });
    }
    var INTERNAL = Symbol("internal");
    function createHeadersIterator(target, kind) {
      const iterator = Object.create(HeadersIteratorPrototype);
      iterator[INTERNAL] = {
        target,
        kind,
        index: 0
      };
      return iterator;
    }
    var HeadersIteratorPrototype = Object.setPrototypeOf({
      next() {
        if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
          throw new TypeError("Value of `this` is not a HeadersIterator");
        }
        var _INTERNAL = this[INTERNAL];
        const target = _INTERNAL.target, kind = _INTERNAL.kind, index2 = _INTERNAL.index;
        const values = getHeaders(target, kind);
        const len = values.length;
        if (index2 >= len) {
          return {
            value: void 0,
            done: true
          };
        }
        this[INTERNAL].index = index2 + 1;
        return {
          value: values[index2],
          done: false
        };
      }
    }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
    Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
      value: "HeadersIterator",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function exportNodeCompatibleHeaders(headers) {
      const obj = Object.assign({ __proto__: null }, headers[MAP]);
      const hostHeaderKey = find(headers[MAP], "Host");
      if (hostHeaderKey !== void 0) {
        obj[hostHeaderKey] = obj[hostHeaderKey][0];
      }
      return obj;
    }
    function createHeadersLenient(obj) {
      const headers = new Headers2();
      for (const name of Object.keys(obj)) {
        if (invalidTokenRegex.test(name)) {
          continue;
        }
        if (Array.isArray(obj[name])) {
          for (const val of obj[name]) {
            if (invalidHeaderCharRegex.test(val)) {
              continue;
            }
            if (headers[MAP][name] === void 0) {
              headers[MAP][name] = [val];
            } else {
              headers[MAP][name].push(val);
            }
          }
        } else if (!invalidHeaderCharRegex.test(obj[name])) {
          headers[MAP][name] = [obj[name]];
        }
      }
      return headers;
    }
    var INTERNALS$12 = Symbol("Response internals");
    var STATUS_CODES = http2.STATUS_CODES;
    var Response2 = class {
      constructor() {
        let body = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        let opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        Body2.call(this, body, opts);
        const status = opts.status || 200;
        const headers = new Headers2(opts.headers);
        if (body != null && !headers.has("Content-Type")) {
          const contentType = extractContentType2(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$12] = {
          url: opts.url,
          status,
          statusText: opts.statusText || STATUS_CODES[status],
          headers,
          counter: opts.counter
        };
      }
      get url() {
        return this[INTERNALS$12].url || "";
      }
      get status() {
        return this[INTERNALS$12].status;
      }
      get ok() {
        return this[INTERNALS$12].status >= 200 && this[INTERNALS$12].status < 300;
      }
      get redirected() {
        return this[INTERNALS$12].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$12].statusText;
      }
      get headers() {
        return this[INTERNALS$12].headers;
      }
      clone() {
        return new Response2(clone2(this), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected
        });
      }
    };
    Body2.mixIn(Response2.prototype);
    Object.defineProperties(Response2.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    Object.defineProperty(Response2.prototype, Symbol.toStringTag, {
      value: "Response",
      writable: false,
      enumerable: false,
      configurable: true
    });
    var INTERNALS$22 = Symbol("Request internals");
    var parse_url = Url.parse;
    var format_url = Url.format;
    var streamDestructionSupported = "destroy" in Stream2.Readable.prototype;
    function isRequest2(input) {
      return typeof input === "object" && typeof input[INTERNALS$22] === "object";
    }
    function isAbortSignal2(signal) {
      const proto = signal && typeof signal === "object" && Object.getPrototypeOf(signal);
      return !!(proto && proto.constructor.name === "AbortSignal");
    }
    var Request2 = class {
      constructor(input) {
        let init2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        let parsedURL;
        if (!isRequest2(input)) {
          if (input && input.href) {
            parsedURL = parse_url(input.href);
          } else {
            parsedURL = parse_url(`${input}`);
          }
          input = {};
        } else {
          parsedURL = parse_url(input.url);
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest2(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        let inputBody = init2.body != null ? init2.body : isRequest2(input) && input.body !== null ? clone2(input) : null;
        Body2.call(this, inputBody, {
          timeout: init2.timeout || input.timeout || 0,
          size: init2.size || input.size || 0
        });
        const headers = new Headers2(init2.headers || input.headers || {});
        if (inputBody != null && !headers.has("Content-Type")) {
          const contentType = extractContentType2(inputBody);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest2(input) ? input.signal : null;
        if ("signal" in init2)
          signal = init2.signal;
        if (signal != null && !isAbortSignal2(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS$22] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow !== void 0 ? init2.follow : input.follow !== void 0 ? input.follow : 20;
        this.compress = init2.compress !== void 0 ? init2.compress : input.compress !== void 0 ? input.compress : true;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
      }
      get method() {
        return this[INTERNALS$22].method;
      }
      get url() {
        return format_url(this[INTERNALS$22].parsedURL);
      }
      get headers() {
        return this[INTERNALS$22].headers;
      }
      get redirect() {
        return this[INTERNALS$22].redirect;
      }
      get signal() {
        return this[INTERNALS$22].signal;
      }
      clone() {
        return new Request2(this);
      }
    };
    Body2.mixIn(Request2.prototype);
    Object.defineProperty(Request2.prototype, Symbol.toStringTag, {
      value: "Request",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Request2.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    function getNodeRequestOptions2(request) {
      const parsedURL = request[INTERNALS$22].parsedURL;
      const headers = new Headers2(request[INTERNALS$22].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      if (!parsedURL.protocol || !parsedURL.hostname) {
        throw new TypeError("Only absolute URLs are supported");
      }
      if (!/^https?:$/.test(parsedURL.protocol)) {
        throw new TypeError("Only HTTP(S) protocols are supported");
      }
      if (request.signal && request.body instanceof Stream2.Readable && !streamDestructionSupported) {
        throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");
      }
      let contentLengthValue = null;
      if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body != null) {
        const totalBytes = getTotalBytes2(request);
        if (typeof totalBytes === "number") {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate");
      }
      let agent = request.agent;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      return Object.assign({}, parsedURL, {
        method: request.method,
        headers: exportNodeCompatibleHeaders(headers),
        agent
      });
    }
    function AbortError2(message) {
      Error.call(this, message);
      this.type = "aborted";
      this.message = message;
      Error.captureStackTrace(this, this.constructor);
    }
    AbortError2.prototype = Object.create(Error.prototype);
    AbortError2.prototype.constructor = AbortError2;
    AbortError2.prototype.name = "AbortError";
    var PassThrough$1 = Stream2.PassThrough;
    var resolve_url = Url.resolve;
    function fetch2(url, opts) {
      if (!fetch2.Promise) {
        throw new Error("native promise missing, set fetch.Promise to your favorite alternative");
      }
      Body2.Promise = fetch2.Promise;
      return new fetch2.Promise(function(resolve2, reject) {
        const request = new Request2(url, opts);
        const options2 = getNodeRequestOptions2(request);
        const send = (options2.protocol === "https:" ? https2 : http2).request;
        const signal = request.signal;
        let response = null;
        const abort = function abort2() {
          let error3 = new AbortError2("The user aborted a request.");
          reject(error3);
          if (request.body && request.body instanceof Stream2.Readable) {
            request.body.destroy(error3);
          }
          if (!response || !response.body)
            return;
          response.body.emit("error", error3);
        };
        if (signal && signal.aborted) {
          abort();
          return;
        }
        const abortAndFinalize = function abortAndFinalize2() {
          abort();
          finalize();
        };
        const req = send(options2);
        let reqTimeout;
        if (signal) {
          signal.addEventListener("abort", abortAndFinalize);
        }
        function finalize() {
          req.abort();
          if (signal)
            signal.removeEventListener("abort", abortAndFinalize);
          clearTimeout(reqTimeout);
        }
        if (request.timeout) {
          req.once("socket", function(socket) {
            reqTimeout = setTimeout(function() {
              reject(new FetchError2(`network timeout at: ${request.url}`, "request-timeout"));
              finalize();
            }, request.timeout);
          });
        }
        req.on("error", function(err) {
          reject(new FetchError2(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
          finalize();
        });
        req.on("response", function(res) {
          clearTimeout(reqTimeout);
          const headers = createHeadersLenient(res.headers);
          if (fetch2.isRedirect(res.statusCode)) {
            const location = headers.get("Location");
            const locationURL = location === null ? null : resolve_url(request.url, location);
            switch (request.redirect) {
              case "error":
                reject(new FetchError2(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
                finalize();
                return;
              case "manual":
                if (locationURL !== null) {
                  try {
                    headers.set("Location", locationURL);
                  } catch (err) {
                    reject(err);
                  }
                }
                break;
              case "follow":
                if (locationURL === null) {
                  break;
                }
                if (request.counter >= request.follow) {
                  reject(new FetchError2(`maximum redirect reached at: ${request.url}`, "max-redirect"));
                  finalize();
                  return;
                }
                const requestOpts = {
                  headers: new Headers2(request.headers),
                  follow: request.follow,
                  counter: request.counter + 1,
                  agent: request.agent,
                  compress: request.compress,
                  method: request.method,
                  body: request.body,
                  signal: request.signal,
                  timeout: request.timeout,
                  size: request.size
                };
                if (res.statusCode !== 303 && request.body && getTotalBytes2(request) === null) {
                  reject(new FetchError2("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
                  finalize();
                  return;
                }
                if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === "POST") {
                  requestOpts.method = "GET";
                  requestOpts.body = void 0;
                  requestOpts.headers.delete("content-length");
                }
                resolve2(fetch2(new Request2(locationURL, requestOpts)));
                finalize();
                return;
            }
          }
          res.once("end", function() {
            if (signal)
              signal.removeEventListener("abort", abortAndFinalize);
          });
          let body = res.pipe(new PassThrough$1());
          const response_options = {
            url: request.url,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers,
            size: request.size,
            timeout: request.timeout,
            counter: request.counter
          };
          const codings = headers.get("Content-Encoding");
          if (!request.compress || request.method === "HEAD" || codings === null || res.statusCode === 204 || res.statusCode === 304) {
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          const zlibOptions = {
            flush: zlib2.Z_SYNC_FLUSH,
            finishFlush: zlib2.Z_SYNC_FLUSH
          };
          if (codings == "gzip" || codings == "x-gzip") {
            body = body.pipe(zlib2.createGunzip(zlibOptions));
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          if (codings == "deflate" || codings == "x-deflate") {
            const raw = res.pipe(new PassThrough$1());
            raw.once("data", function(chunk) {
              if ((chunk[0] & 15) === 8) {
                body = body.pipe(zlib2.createInflate());
              } else {
                body = body.pipe(zlib2.createInflateRaw());
              }
              response = new Response2(body, response_options);
              resolve2(response);
            });
            return;
          }
          if (codings == "br" && typeof zlib2.createBrotliDecompress === "function") {
            body = body.pipe(zlib2.createBrotliDecompress());
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          response = new Response2(body, response_options);
          resolve2(response);
        });
        writeToStream2(req, request);
      });
    }
    fetch2.isRedirect = function(code) {
      return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
    };
    fetch2.Promise = global.Promise;
    module2.exports = exports = fetch2;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = exports;
    exports.Headers = Headers2;
    exports.Request = Request2;
    exports.Response = Response2;
    exports.FetchError = FetchError2;
  }
});

// node_modules/cross-fetch/dist/node-ponyfill.js
var require_node_ponyfill = __commonJS({
  "node_modules/cross-fetch/dist/node-ponyfill.js"(exports, module2) {
    init_shims();
    var nodeFetch = require_lib();
    var realFetch = nodeFetch.default || nodeFetch;
    var fetch2 = function(url, options2) {
      if (/^\/\//.test(url)) {
        url = "https:" + url;
      }
      return realFetch.call(this, url, options2);
    };
    fetch2.ponyfill = true;
    module2.exports = exports = fetch2;
    exports.fetch = fetch2;
    exports.Headers = nodeFetch.Headers;
    exports.Request = nodeFetch.Request;
    exports.Response = nodeFetch.Response;
    exports.default = fetch2;
  }
});

// node_modules/@prismicio/client/cjs/@prismicio/client.js
var require_client = __commonJS({
  "node_modules/@prismicio/client/cjs/@prismicio/client.js"(exports, module2) {
    init_shims();
    "use strict";
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var crossFetch = _interopDefault(require_node_ponyfill());
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function() {
      __assign = Object.assign || function __assign2(t) {
        for (var s2, i = 1, n = arguments.length; i < n; i++) {
          s2 = arguments[i];
          for (var p in s2)
            if (Object.prototype.hasOwnProperty.call(s2, p))
              t[p] = s2[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var Variation = function() {
      function Variation2(data) {
        this.data = {};
        this.data = data;
      }
      Variation2.prototype.id = function() {
        return this.data.id;
      };
      Variation2.prototype.ref = function() {
        return this.data.ref;
      };
      Variation2.prototype.label = function() {
        return this.data.label;
      };
      return Variation2;
    }();
    var Experiment = function() {
      function Experiment2(data) {
        this.data = {};
        this.data = data;
        this.variations = (data.variations || []).map(function(v) {
          return new Variation(v);
        });
      }
      Experiment2.prototype.id = function() {
        return this.data.id;
      };
      Experiment2.prototype.googleId = function() {
        return this.data.googleId;
      };
      Experiment2.prototype.name = function() {
        return this.data.name;
      };
      return Experiment2;
    }();
    var Experiments = function() {
      function Experiments2(data) {
        if (data) {
          this.drafts = (data.drafts || []).map(function(exp) {
            return new Experiment(exp);
          });
          this.running = (data.running || []).map(function(exp) {
            return new Experiment(exp);
          });
        }
      }
      Experiments2.prototype.current = function() {
        if (this.running.length > 0) {
          return this.running[0];
        } else {
          return null;
        }
      };
      Experiments2.prototype.refFromCookie = function(cookie) {
        if (!cookie || cookie.trim() === "")
          return null;
        var splitted = cookie.trim().split(" ");
        if (splitted.length < 2)
          return null;
        var expId = splitted[0];
        var varIndex = parseInt(splitted[1], 10);
        var exp = this.running.filter(function(exp2) {
          return exp2.googleId() === expId && exp2.variations.length > varIndex;
        })[0];
        return exp ? exp.variations[varIndex].ref() : null;
      };
      return Experiments2;
    }();
    var Form = function() {
      function Form2(form, httpClient) {
        this.httpClient = httpClient;
        this.form = form;
        this.data = {};
        for (var field in form.fields) {
          if (form.fields[field]["default"]) {
            this.data[field] = [form.fields[field]["default"]];
          }
        }
      }
      Form2.prototype.set = function(field, value) {
        var fieldDesc = this.form.fields[field];
        if (!fieldDesc)
          throw new Error("Unknown field " + field);
        var checkedValue = value === "" || value === void 0 ? null : value;
        var values = this.data[field] || [];
        if (fieldDesc.multiple) {
          values = checkedValue ? values.concat([checkedValue]) : values;
        } else {
          values = checkedValue ? [checkedValue] : values;
        }
        this.data[field] = values;
      };
      Form2.prototype.url = function() {
        var url = this.form.action;
        if (this.data) {
          var sep = url.indexOf("?") > -1 ? "&" : "?";
          for (var key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
              var values = this.data[key];
              if (values) {
                for (var i = 0; i < values.length; i++) {
                  url += sep + key + "=" + encodeURIComponent(values[i]);
                  sep = "&";
                }
              }
            }
          }
        }
        return url;
      };
      Form2.prototype.submit = function(cb) {
        return this.httpClient.cachedRequest(this.url()).then(function(response) {
          cb && cb(null, response);
          return response;
        }).catch(function(error3) {
          cb && cb(error3);
          throw error3;
        });
      };
      return Form2;
    }();
    var SearchForm = function(_super) {
      __extends(SearchForm2, _super);
      function SearchForm2(form, httpClient) {
        return _super.call(this, form, httpClient) || this;
      }
      SearchForm2.prototype.set = function(field, value) {
        _super.prototype.set.call(this, field, value);
        return this;
      };
      SearchForm2.prototype.ref = function(ref) {
        return this.set("ref", ref);
      };
      SearchForm2.prototype.query = function(query) {
        if (typeof query === "string") {
          return this.query([query]);
        } else if (Array.isArray(query)) {
          return this.set("q", "[" + query.join("") + "]");
        } else {
          throw new Error("Invalid query : " + query);
        }
      };
      SearchForm2.prototype.pageSize = function(size) {
        return this.set("pageSize", size);
      };
      SearchForm2.prototype.graphQuery = function(query) {
        return this.set("graphQuery", query);
      };
      SearchForm2.prototype.lang = function(langCode) {
        return this.set("lang", langCode);
      };
      SearchForm2.prototype.page = function(p) {
        return this.set("page", p);
      };
      SearchForm2.prototype.after = function(documentId) {
        return this.set("after", documentId);
      };
      SearchForm2.prototype.orderings = function(orderings) {
        if (!orderings) {
          return this;
        } else {
          return this.set("orderings", "[" + orderings.join(",") + "]");
        }
      };
      return SearchForm2;
    }(Form);
    var TagsForm = function(_super) {
      __extends(TagsForm2, _super);
      function TagsForm2(form, httpClient) {
        return _super.call(this, form, httpClient) || this;
      }
      return TagsForm2;
    }(Form);
    var OPERATOR = {
      at: "at",
      not: "not",
      missing: "missing",
      has: "has",
      any: "any",
      in: "in",
      fulltext: "fulltext",
      similar: "similar",
      numberGt: "number.gt",
      numberLt: "number.lt",
      numberInRange: "number.inRange",
      dateBefore: "date.before",
      dateAfter: "date.after",
      dateBetween: "date.between",
      dateDayOfMonth: "date.day-of-month",
      dateDayOfMonthAfter: "date.day-of-month-after",
      dateDayOfMonthBefore: "date.day-of-month-before",
      dateDayOfWeek: "date.day-of-week",
      dateDayOfWeekAfter: "date.day-of-week-after",
      dateDayOfWeekBefore: "date.day-of-week-before",
      dateMonth: "date.month",
      dateMonthBefore: "date.month-before",
      dateMonthAfter: "date.month-after",
      dateYear: "date.year",
      dateHour: "date.hour",
      dateHourBefore: "date.hour-before",
      dateHourAfter: "date.hour-after",
      GeopointNear: "geopoint.near"
    };
    function encode(value) {
      if (typeof value === "string") {
        return '"' + value + '"';
      } else if (typeof value === "number") {
        return value.toString();
      } else if (value instanceof Date) {
        return value.getTime().toString();
      } else if (Array.isArray(value)) {
        return "[" + value.map(function(v) {
          return encode(v);
        }).join(",") + "]";
      } else if (typeof value === "boolean") {
        return value.toString();
      } else {
        throw new Error("Unable to encode " + value + " of type " + typeof value);
      }
    }
    var geopoint = {
      near: function(fragment, latitude, longitude, radius) {
        return "[" + OPERATOR.GeopointNear + "(" + fragment + ", " + latitude + ", " + longitude + ", " + radius + ")]";
      }
    };
    var date = {
      before: function(fragment, before) {
        return "[" + OPERATOR.dateBefore + "(" + fragment + ", " + encode(before) + ")]";
      },
      after: function(fragment, after) {
        return "[" + OPERATOR.dateAfter + "(" + fragment + ", " + encode(after) + ")]";
      },
      between: function(fragment, before, after) {
        return "[" + OPERATOR.dateBetween + "(" + fragment + ", " + encode(before) + ", " + encode(after) + ")]";
      },
      dayOfMonth: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfMonth + "(" + fragment + ", " + day + ")]";
      },
      dayOfMonthAfter: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfMonthAfter + "(" + fragment + ", " + day + ")]";
      },
      dayOfMonthBefore: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfMonthBefore + "(" + fragment + ", " + day + ")]";
      },
      dayOfWeek: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfWeek + "(" + fragment + ", " + encode(day) + ")]";
      },
      dayOfWeekAfter: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfWeekAfter + "(" + fragment + ", " + encode(day) + ")]";
      },
      dayOfWeekBefore: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfWeekBefore + "(" + fragment + ", " + encode(day) + ")]";
      },
      month: function(fragment, month) {
        return "[" + OPERATOR.dateMonth + "(" + fragment + ", " + encode(month) + ")]";
      },
      monthBefore: function(fragment, month) {
        return "[" + OPERATOR.dateMonthBefore + "(" + fragment + ", " + encode(month) + ")]";
      },
      monthAfter: function(fragment, month) {
        return "[" + OPERATOR.dateMonthAfter + "(" + fragment + ", " + encode(month) + ")]";
      },
      year: function(fragment, year) {
        return "[" + OPERATOR.dateYear + "(" + fragment + ", " + year + ")]";
      },
      hour: function(fragment, hour) {
        return "[" + OPERATOR.dateHour + "(" + fragment + ", " + hour + ")]";
      },
      hourBefore: function(fragment, hour) {
        return "[" + OPERATOR.dateHourBefore + "(" + fragment + ", " + hour + ")]";
      },
      hourAfter: function(fragment, hour) {
        return "[" + OPERATOR.dateHourAfter + "(" + fragment + ", " + hour + ")]";
      }
    };
    var number = {
      gt: function(fragment, value) {
        return "[" + OPERATOR.numberGt + "(" + fragment + ", " + value + ")]";
      },
      lt: function(fragment, value) {
        return "[" + OPERATOR.numberLt + "(" + fragment + ", " + value + ")]";
      },
      inRange: function(fragment, before, after) {
        return "[" + OPERATOR.numberInRange + "(" + fragment + ", " + before + ", " + after + ")]";
      }
    };
    var Predicates = {
      at: function(fragment, value) {
        return "[" + OPERATOR.at + "(" + fragment + ", " + encode(value) + ")]";
      },
      not: function(fragment, value) {
        return "[" + OPERATOR.not + "(" + fragment + ", " + encode(value) + ")]";
      },
      missing: function(fragment) {
        return "[" + OPERATOR.missing + "(" + fragment + ")]";
      },
      has: function(fragment) {
        return "[" + OPERATOR.has + "(" + fragment + ")]";
      },
      any: function(fragment, values) {
        return "[" + OPERATOR.any + "(" + fragment + ", " + encode(values) + ")]";
      },
      in: function(fragment, values) {
        return "[" + OPERATOR.in + "(" + fragment + ", " + encode(values) + ")]";
      },
      fulltext: function(fragment, value) {
        return "[" + OPERATOR.fulltext + "(" + fragment + ", " + encode(value) + ")]";
      },
      similar: function(documentId, maxResults) {
        return "[" + OPERATOR.similar + '("' + documentId + '", ' + maxResults + ")]";
      },
      date,
      dateBefore: date.before,
      dateAfter: date.after,
      dateBetween: date.between,
      dayOfMonth: date.dayOfMonth,
      dayOfMonthAfter: date.dayOfMonthAfter,
      dayOfMonthBefore: date.dayOfMonthBefore,
      dayOfWeek: date.dayOfWeek,
      dayOfWeekAfter: date.dayOfWeekAfter,
      dayOfWeekBefore: date.dayOfWeekBefore,
      month: date.month,
      monthBefore: date.monthBefore,
      monthAfter: date.monthAfter,
      year: date.year,
      hour: date.hour,
      hourBefore: date.hourBefore,
      hourAfter: date.hourAfter,
      number,
      gt: number.gt,
      lt: number.lt,
      inRange: number.inRange,
      near: geopoint.near,
      geopoint
    };
    var decode2 = decodeURIComponent;
    function tryDecode(str, decode3) {
      try {
        return decode3(str);
      } catch (e) {
        return str;
      }
    }
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(/; */);
      var dec = opt.decode || decode2;
      pairs.forEach(function(pair) {
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          return;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      });
      return obj;
    }
    var Cookies = { parse };
    function createPreviewResolver(token2, documentId, getDocByID) {
      var resolve2 = function(linkResolver, defaultUrl, cb) {
        if (documentId && getDocByID) {
          return getDocByID(documentId, { ref: token2 }).then(function(document2) {
            if (!document2) {
              cb && cb(null, defaultUrl);
              return defaultUrl;
            } else {
              var url = linkResolver && linkResolver(document2) || document2.url || defaultUrl;
              cb && cb(null, url);
              return url;
            }
          });
        } else {
          return Promise.resolve(defaultUrl);
        }
      };
      return { token: token2, documentId, resolve: resolve2 };
    }
    var PREVIEW_COOKIE = "io.prismic.preview";
    var EXPERIMENT_COOKIE = "io.prismic.experiment";
    var ResolvedApi = function() {
      function ResolvedApi2(data, httpClient, options2) {
        this.data = data;
        this.masterRef = data.refs.filter(function(ref) {
          return ref.isMasterRef;
        })[0];
        this.experiments = new Experiments(data.experiments);
        this.bookmarks = data.bookmarks;
        this.httpClient = httpClient;
        this.options = options2;
        this.refs = data.refs;
        this.tags = data.tags;
        this.types = data.types;
        this.languages = data.languages;
      }
      ResolvedApi2.prototype.form = function(formId) {
        var form = this.data.forms[formId];
        if (!form) {
          return null;
        }
        if (formId === "tags") {
          return new TagsForm(form, this.httpClient);
        }
        return new SearchForm(form, this.httpClient);
      };
      ResolvedApi2.prototype.searchForm = function(formId) {
        var f = this.form(formId);
        if (f instanceof SearchForm) {
          return f;
        }
        return null;
      };
      ResolvedApi2.prototype.tagsForm = function() {
        var f = this.form("tags");
        if (!f) {
          throw new Error("Missing tags form");
        }
        if (f instanceof TagsForm) {
          return f;
        }
        throw new Error("Unexpected error: tags form is not TagsForm");
      };
      ResolvedApi2.prototype.everything = function() {
        var f = this.searchForm("everything");
        if (!f)
          throw new Error("Missing everything form");
        return f;
      };
      ResolvedApi2.prototype.master = function() {
        return this.masterRef.ref;
      };
      ResolvedApi2.prototype.ref = function(label) {
        var ref = this.data.refs.filter(function(ref2) {
          return ref2.label === label;
        })[0];
        return ref ? ref.ref : null;
      };
      ResolvedApi2.prototype.currentExperiment = function() {
        return this.experiments.current();
      };
      ResolvedApi2.prototype.query = function(q, optionsOrCallback, cb) {
        if (cb === void 0) {
          cb = function() {
          };
        }
        var _a = typeof optionsOrCallback === "function" ? { options: {}, callback: optionsOrCallback } : { options: optionsOrCallback || {}, callback: cb }, options2 = _a.options, callback = _a.callback;
        var form = this.everything();
        for (var key in options2) {
          form = form.set(key, options2[key]);
        }
        if (!options2.ref) {
          var cookieString = "";
          if (this.options.req) {
            cookieString = this.options.req.headers["cookie"] || "";
          } else if (typeof window !== "undefined" && window.document) {
            cookieString = window.document.cookie || "";
          }
          var cookies = Cookies.parse(cookieString);
          var previewRef = cookies[PREVIEW_COOKIE];
          var experimentRef = this.experiments.refFromCookie(cookies[EXPERIMENT_COOKIE]);
          form = form.ref(previewRef || experimentRef || this.masterRef.ref);
        }
        if (q) {
          form.query(q);
        }
        return form.submit(callback);
      };
      ResolvedApi2.prototype.queryFirst = function(q, optionsOrCallback, cb) {
        var _a = typeof optionsOrCallback === "function" ? { options: {}, callback: optionsOrCallback } : { options: optionsOrCallback || {}, callback: cb || function() {
        } }, options2 = _a.options, callback = _a.callback;
        options2.page = 1;
        options2.pageSize = 1;
        return this.query(q, options2).then(function(response) {
          var document2 = response && response.results && response.results[0];
          callback(null, document2);
          return document2;
        }).catch(function(error3) {
          callback(error3);
          throw error3;
        });
      };
      ResolvedApi2.prototype.getByID = function(id, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        if (!options2.lang)
          options2.lang = "*";
        return this.queryFirst(Predicates.at("document.id", id), options2, cb);
      };
      ResolvedApi2.prototype.getByIDs = function(ids, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        if (!options2.lang)
          options2.lang = "*";
        return this.query(Predicates.in("document.id", ids), options2, cb);
      };
      ResolvedApi2.prototype.getByUID = function(type, uid, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        if (options2.lang === "*")
          throw new Error("FORBIDDEN. You can't use getByUID with *, use the predicates instead.");
        if (!options2.page)
          options2.page = 1;
        return this.queryFirst(Predicates.at("my." + type + ".uid", uid), options2, cb);
      };
      ResolvedApi2.prototype.getSingle = function(type, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        return this.queryFirst(Predicates.at("document.type", type), options2, cb);
      };
      ResolvedApi2.prototype.getBookmark = function(bookmark, maybeOptions, cb) {
        var id = this.data.bookmarks[bookmark];
        if (id) {
          return this.getByID(id, maybeOptions, cb);
        } else {
          return Promise.reject("Error retrieving bookmarked id");
        }
      };
      ResolvedApi2.prototype.getTags = function(cb) {
        return this.tagsForm().submit(cb);
      };
      ResolvedApi2.prototype.getPreviewResolver = function(token2, documentId) {
        return createPreviewResolver(token2, documentId, this.getByID.bind(this));
      };
      return ResolvedApi2;
    }();
    function MakeLRUCache(limit) {
      return new LRUCache(limit);
    }
    function LRUCache(limit) {
      this.size = 0;
      this.limit = limit;
      this._keymap = {};
    }
    LRUCache.prototype.put = function(key, value) {
      var entry = { key, value };
      this._keymap[key] = entry;
      if (this.tail) {
        this.tail.newer = entry;
        entry.older = this.tail;
      } else {
        this.head = entry;
      }
      this.tail = entry;
      if (this.size === this.limit) {
        return this.shift();
      } else {
        this.size++;
      }
    };
    LRUCache.prototype.shift = function() {
      var entry = this.head;
      if (entry) {
        if (this.head.newer) {
          this.head = this.head.newer;
          this.head.older = void 0;
        } else {
          this.head = void 0;
        }
        entry.newer = entry.older = void 0;
        delete this._keymap[entry.key];
      }
      console.log("purging ", entry.key);
      return entry;
    };
    LRUCache.prototype.get = function(key, returnEntry) {
      var entry = this._keymap[key];
      if (entry === void 0)
        return;
      if (entry === this.tail) {
        return returnEntry ? entry : entry.value;
      }
      if (entry.newer) {
        if (entry === this.head)
          this.head = entry.newer;
        entry.newer.older = entry.older;
      }
      if (entry.older)
        entry.older.newer = entry.newer;
      entry.newer = void 0;
      entry.older = this.tail;
      if (this.tail)
        this.tail.newer = entry;
      this.tail = entry;
      return returnEntry ? entry : entry.value;
    };
    LRUCache.prototype.find = function(key) {
      return this._keymap[key];
    };
    LRUCache.prototype.set = function(key, value) {
      var oldvalue;
      var entry = this.get(key, true);
      if (entry) {
        oldvalue = entry.value;
        entry.value = value;
      } else {
        oldvalue = this.put(key, value);
        if (oldvalue)
          oldvalue = oldvalue.value;
      }
      return oldvalue;
    };
    LRUCache.prototype.remove = function(key) {
      var entry = this._keymap[key];
      if (!entry)
        return;
      delete this._keymap[entry.key];
      if (entry.newer && entry.older) {
        entry.older.newer = entry.newer;
        entry.newer.older = entry.older;
      } else if (entry.newer) {
        entry.newer.older = void 0;
        this.head = entry.newer;
      } else if (entry.older) {
        entry.older.newer = void 0;
        this.tail = entry.older;
      } else {
        this.head = this.tail = void 0;
      }
      this.size--;
      return entry.value;
    };
    LRUCache.prototype.removeAll = function() {
      this.head = this.tail = void 0;
      this.size = 0;
      this._keymap = {};
    };
    if (typeof Object.keys === "function") {
      LRUCache.prototype.keys = function() {
        return Object.keys(this._keymap);
      };
    } else {
      LRUCache.prototype.keys = function() {
        var keys = [];
        for (var k in this._keymap)
          keys.push(k);
        return keys;
      };
    }
    LRUCache.prototype.forEach = function(fun, context, desc) {
      var entry;
      if (context === true) {
        desc = true;
        context = void 0;
      } else if (typeof context !== "object")
        context = this;
      if (desc) {
        entry = this.tail;
        while (entry) {
          fun.call(context, entry.key, entry.value, this);
          entry = entry.older;
        }
      } else {
        entry = this.head;
        while (entry) {
          fun.call(context, entry.key, entry.value, this);
          entry = entry.newer;
        }
      }
    };
    LRUCache.prototype.toString = function() {
      var s2 = "", entry = this.head;
      while (entry) {
        s2 += String(entry.key) + ":" + entry.value;
        entry = entry.newer;
        if (entry)
          s2 += " < ";
      }
      return s2;
    };
    var DefaultApiCache = function() {
      function DefaultApiCache2(limit) {
        if (limit === void 0) {
          limit = 1e3;
        }
        this.lru = MakeLRUCache(limit);
      }
      DefaultApiCache2.prototype.isExpired = function(key) {
        var value = this.lru.get(key, false);
        if (value) {
          return value.expiredIn !== 0 && value.expiredIn < Date.now();
        } else {
          return false;
        }
      };
      DefaultApiCache2.prototype.get = function(key, cb) {
        var value = this.lru.get(key, false);
        if (value && !this.isExpired(key)) {
          cb(null, value.data);
        } else {
          cb && cb(null);
        }
      };
      DefaultApiCache2.prototype.set = function(key, value, ttl, cb) {
        this.lru.remove(key);
        this.lru.put(key, {
          data: value,
          expiredIn: ttl ? Date.now() + ttl * 1e3 : 0
        });
        cb && cb(null);
      };
      DefaultApiCache2.prototype.remove = function(key, cb) {
        this.lru.remove(key);
        cb && cb(null);
      };
      DefaultApiCache2.prototype.clear = function(cb) {
        this.lru.removeAll();
        cb && cb(null);
      };
      return DefaultApiCache2;
    }();
    function fetchRequest(url, options2, callback) {
      var fetchOptions = {
        headers: {
          Accept: "application/json"
        }
      };
      if (options2 && options2.proxyAgent) {
        fetchOptions.agent = options2.proxyAgent;
      }
      var timeoutId;
      var fetchPromise = crossFetch(url, fetchOptions);
      var promise = options2.timeoutInMs ? Promise.race([
        fetchPromise,
        new Promise(function(_, reject) {
          timeoutId = setTimeout(function() {
            return reject(new Error(url + " response timeout"));
          }, options2.timeoutInMs);
        })
      ]) : fetchPromise;
      promise.then(function(resp) {
        clearTimeout(timeoutId);
        if (~~(resp.status / 100 !== 2)) {
          return resp.text().then(function() {
            var e = new Error("Unexpected status code [" + resp.status + "] on URL " + url);
            e.status = resp.status;
            throw e;
          });
        }
        return resp.json().then(function(result) {
          var cacheControl = resp.headers.get("cache-control");
          var parsedCacheControl = cacheControl ? /max-age=(\d+)/.exec(cacheControl) : null;
          var ttl = parsedCacheControl ? parseInt(parsedCacheControl[1], 10) : void 0;
          callback(null, result, resp, ttl);
        });
      }).catch(function(err) {
        clearTimeout(timeoutId);
        callback(err);
      });
    }
    var DefaultRequestHandler = function() {
      function DefaultRequestHandler2(options2) {
        this.options = options2 || {};
      }
      DefaultRequestHandler2.prototype.request = function(url, callback) {
        fetchRequest(url, this.options, callback);
      };
      return DefaultRequestHandler2;
    }();
    var HttpClient = function() {
      function HttpClient2(requestHandler, cache, proxyAgent, timeoutInMs) {
        this.requestHandler = requestHandler || new DefaultRequestHandler({ proxyAgent, timeoutInMs });
        this.cache = cache || new DefaultApiCache();
      }
      HttpClient2.prototype.request = function(url, callback) {
        this.requestHandler.request(url, function(err, result, xhr, ttl) {
          if (err) {
            callback && callback(err, null, xhr, ttl);
          } else if (result) {
            callback && callback(null, result, xhr, ttl);
          }
        });
      };
      HttpClient2.prototype.cachedRequest = function(url, maybeOptions) {
        var _this = this;
        var options2 = maybeOptions || {};
        var run2 = function(cb) {
          var cacheKey = options2.cacheKey || url;
          _this.cache.get(cacheKey, function(cacheGetError, cacheGetValue) {
            if (cacheGetError || cacheGetValue) {
              cb(cacheGetError, cacheGetValue);
            } else {
              _this.request(url, function(fetchError, fetchValue, _, ttlReq) {
                if (fetchError) {
                  cb(fetchError, null);
                } else {
                  var ttl = ttlReq || options2.ttl;
                  if (ttl) {
                    _this.cache.set(cacheKey, fetchValue, ttl, cb);
                  }
                  cb(null, fetchValue);
                }
              });
            }
          });
        };
        return new Promise(function(resolve2, reject) {
          run2(function(err, value) {
            if (err)
              reject(err);
            if (value)
              resolve2(value);
          });
        });
      };
      return HttpClient2;
    }();
    function separator(url) {
      return url.indexOf("?") > -1 ? "&" : "?";
    }
    var Api = function() {
      function Api2(url, options2) {
        this.options = options2 || {};
        this.url = url;
        var queryStrings = [
          this.options.accessToken && "access_token=" + this.options.accessToken,
          this.options.routes && "routes=" + encodeURIComponent(JSON.stringify(this.options.routes))
        ].filter(Boolean);
        if (queryStrings.length > 0) {
          this.url += separator(url) + queryStrings.join("&");
        }
        this.apiDataTTL = this.options.apiDataTTL || 5;
        this.httpClient = new HttpClient(this.options.requestHandler, this.options.apiCache, this.options.proxyAgent, this.options.timeoutInMs);
      }
      Api2.prototype.get = function(cb) {
        var _this = this;
        return this.httpClient.cachedRequest(this.url, { ttl: this.apiDataTTL }).then(function(data) {
          var resolvedApi = new ResolvedApi(data, _this.httpClient, _this.options);
          cb && cb(null, resolvedApi);
          return resolvedApi;
        }).catch(function(error3) {
          cb && cb(error3);
          throw error3;
        });
      };
      return Api2;
    }();
    var LazySearchForm = function() {
      function LazySearchForm2(id, api2) {
        this.id = id;
        this.api = api2;
        this.fields = {};
      }
      LazySearchForm2.prototype.set = function(key, value) {
        this.fields[key] = value;
        return this;
      };
      LazySearchForm2.prototype.ref = function(ref) {
        return this.set("ref", ref);
      };
      LazySearchForm2.prototype.query = function(query) {
        return this.set("q", query);
      };
      LazySearchForm2.prototype.pageSize = function(size) {
        return this.set("pageSize", size);
      };
      LazySearchForm2.prototype.graphQuery = function(query) {
        return this.set("graphQuery", query);
      };
      LazySearchForm2.prototype.lang = function(langCode) {
        return this.set("lang", langCode);
      };
      LazySearchForm2.prototype.page = function(p) {
        return this.set("page", p);
      };
      LazySearchForm2.prototype.after = function(documentId) {
        return this.set("after", documentId);
      };
      LazySearchForm2.prototype.orderings = function(orderings) {
        return this.set("orderings", orderings);
      };
      LazySearchForm2.prototype.url = function() {
        var _this = this;
        return this.api.get().then(function(api2) {
          return LazySearchForm2.toSearchForm(_this, api2).url();
        });
      };
      LazySearchForm2.prototype.submit = function(cb) {
        var _this = this;
        return this.api.get().then(function(api2) {
          return LazySearchForm2.toSearchForm(_this, api2).submit(cb);
        });
      };
      LazySearchForm2.toSearchForm = function(lazyForm, api2) {
        var form = api2.searchForm(lazyForm.id);
        if (form) {
          return Object.keys(lazyForm.fields).reduce(function(form2, fieldKey) {
            var fieldValue = lazyForm.fields[fieldKey];
            if (fieldKey === "q") {
              return form2.query(fieldValue);
            } else if (fieldKey === "pageSize") {
              return form2.pageSize(fieldValue);
            } else if (fieldKey === "graphQuery") {
              return form2.graphQuery(fieldValue);
            } else if (fieldKey === "lang") {
              return form2.lang(fieldValue);
            } else if (fieldKey === "page") {
              return form2.page(fieldValue);
            } else if (fieldKey === "after") {
              return form2.after(fieldValue);
            } else if (fieldKey === "orderings") {
              return form2.orderings(fieldValue);
            } else {
              return form2.set(fieldKey, fieldValue);
            }
          }, form);
        } else {
          throw new Error("Unable to access to form " + lazyForm.id);
        }
      };
      return LazySearchForm2;
    }();
    var DefaultClient = function() {
      function DefaultClient2(url, options2) {
        this.api = new Api(url, options2);
      }
      DefaultClient2.prototype.getApi = function() {
        return this.api.get();
      };
      DefaultClient2.prototype.everything = function() {
        return this.form("everything");
      };
      DefaultClient2.prototype.form = function(formId) {
        return new LazySearchForm(formId, this.api);
      };
      DefaultClient2.prototype.query = function(q, optionsOrCallback, cb) {
        return this.getApi().then(function(api2) {
          return api2.query(q, optionsOrCallback, cb);
        });
      };
      DefaultClient2.prototype.queryFirst = function(q, optionsOrCallback, cb) {
        return this.getApi().then(function(api2) {
          return api2.queryFirst(q, optionsOrCallback, cb);
        });
      };
      DefaultClient2.prototype.getByID = function(id, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getByID(id, options2, cb);
        });
      };
      DefaultClient2.prototype.getByIDs = function(ids, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getByIDs(ids, options2, cb);
        });
      };
      DefaultClient2.prototype.getByUID = function(type, uid, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getByUID(type, uid, options2, cb);
        });
      };
      DefaultClient2.prototype.getSingle = function(type, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getSingle(type, options2, cb);
        });
      };
      DefaultClient2.prototype.getBookmark = function(bookmark, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getBookmark(bookmark, options2, cb);
        });
      };
      DefaultClient2.prototype.getTags = function() {
        return this.getApi().then(function(api2) {
          return api2.getTags();
        });
      };
      DefaultClient2.prototype.getPreviewResolver = function(token2, documentId) {
        var _this = this;
        var getDocById = function(documentId2, maybeOptions) {
          return _this.getApi().then(function(api2) {
            return api2.getByID(documentId2, maybeOptions);
          });
        };
        return createPreviewResolver(token2, documentId, getDocById);
      };
      DefaultClient2.getApi = function(url, options2) {
        var api2 = new Api(url, options2);
        return api2.get();
      };
      return DefaultClient2;
    }();
    var index2 = {
      experimentCookie: EXPERIMENT_COOKIE,
      previewCookie: PREVIEW_COOKIE,
      Predicates,
      predicates: Predicates,
      Experiments,
      Api,
      client,
      getApi,
      api
    };
    function client(url, options2) {
      return new DefaultClient(url, options2);
    }
    function getApi(url, options2) {
      return DefaultClient.getApi(url, options2);
    }
    function api(url, options2) {
      return getApi(url, options2);
    }
    module2.exports = index2;
  }
});

// node_modules/prismic-dom/dist/prismic-dom.min.js
var require_prismic_dom_min = __commonJS({
  "node_modules/prismic-dom/dist/prismic-dom.min.js"(exports, module2) {
    init_shims();
    !function(e, t) {
      typeof exports == "object" && typeof module2 == "object" ? module2.exports = t() : typeof define == "function" && define.amd ? define("PrismicDOM", [], t) : typeof exports == "object" ? exports.PrismicDOM = t() : e.PrismicDOM = t();
    }(typeof self != "undefined" ? self : exports, function() {
      return function(e) {
        var t = {};
        function n(r) {
          if (t[r])
            return t[r].exports;
          var o = t[r] = { i: r, l: false, exports: {} };
          return e[r].call(o.exports, o, o.exports, n), o.l = true, o.exports;
        }
        return n.m = e, n.c = t, n.d = function(e2, t2, r) {
          n.o(e2, t2) || Object.defineProperty(e2, t2, { enumerable: true, get: r });
        }, n.r = function(e2) {
          typeof Symbol != "undefined" && Symbol.toStringTag && Object.defineProperty(e2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e2, "__esModule", { value: true });
        }, n.t = function(e2, t2) {
          if (1 & t2 && (e2 = n(e2)), 8 & t2)
            return e2;
          if (4 & t2 && typeof e2 == "object" && e2 && e2.__esModule)
            return e2;
          var r = Object.create(null);
          if (n.r(r), Object.defineProperty(r, "default", { enumerable: true, value: e2 }), 2 & t2 && typeof e2 != "string")
            for (var o in e2)
              n.d(r, o, function(t3) {
                return e2[t3];
              }.bind(null, o));
          return r;
        }, n.n = function(e2) {
          var t2 = e2 && e2.__esModule ? function() {
            return e2.default;
          } : function() {
            return e2;
          };
          return n.d(t2, "a", t2), t2;
        }, n.o = function(e2, t2) {
          return Object.prototype.hasOwnProperty.call(e2, t2);
        }, n.p = "", n(n.s = 1);
      }([function(e, t, n) {
        typeof self != "undefined" && self, e.exports = function(e2) {
          var t2 = {};
          function n2(r) {
            if (t2[r])
              return t2[r].exports;
            var o = t2[r] = { i: r, l: false, exports: {} };
            return e2[r].call(o.exports, o, o.exports, n2), o.l = true, o.exports;
          }
          return n2.m = e2, n2.c = t2, n2.d = function(e3, t3, r) {
            n2.o(e3, t3) || Object.defineProperty(e3, t3, { enumerable: true, get: r });
          }, n2.r = function(e3) {
            typeof Symbol != "undefined" && Symbol.toStringTag && Object.defineProperty(e3, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e3, "__esModule", { value: true });
          }, n2.t = function(e3, t3) {
            if (1 & t3 && (e3 = n2(e3)), 8 & t3)
              return e3;
            if (4 & t3 && typeof e3 == "object" && e3 && e3.__esModule)
              return e3;
            var r = Object.create(null);
            if (n2.r(r), Object.defineProperty(r, "default", { enumerable: true, value: e3 }), 2 & t3 && typeof e3 != "string")
              for (var o in e3)
                n2.d(r, o, function(t4) {
                  return e3[t4];
                }.bind(null, o));
            return r;
          }, n2.n = function(e3) {
            var t3 = e3 && e3.__esModule ? function() {
              return e3.default;
            } : function() {
              return e3;
            };
            return n2.d(t3, "a", t3), t3;
          }, n2.o = function(e3, t3) {
            return Object.prototype.hasOwnProperty.call(e3, t3);
          }, n2.p = "", n2(n2.s = 0);
        }([function(e2, t2, n2) {
          e2.exports = n2(1);
        }, function(e2, t2, n2) {
          var r = n2(2), o = n2(3);
          e2.exports = { Link: r, Date: o };
        }, function(e2, t2, n2) {
          e2.exports = { url: function(e3, t3) {
            var n3 = e3 && e3.value ? e3.value.document : e3;
            if (e3 && [e3.type, e3.link_type, e3._linkType, e3.linkType].some(function(e4) {
              return e4 && ["Document", "Link.Document", "Link.document"].includes(e4);
            }) && t3 && typeof t3 == "function") {
              var r = t3(n3);
              if (r)
                return r;
            }
            return n3 && n3.url ? n3.url : "";
          } };
        }, function(e2, t2) {
          e2.exports = function(e3) {
            if (!e3)
              return null;
            var t3 = e3.length == 24 ? "".concat(e3.substring(0, 22), ":").concat(e3.substring(22, 24)) : e3;
            return new Date(t3);
          };
        }]);
      }, function(e, t, n) {
        e.exports = n(2);
      }, function(e, t, n) {
        var r = n(0), o = n(3), i = r.Date, u = r.Link;
        e.exports = { Date: i, Link: u, RichText: o };
      }, function(e, t, n) {
        var r = n(4), o = n(0).Link, i = n(5), u = r.Elements;
        function c(e2, t2, n2, r2, c2) {
          switch (t2) {
            case u.heading1:
              return l("h1", n2, c2);
            case u.heading2:
              return l("h2", n2, c2);
            case u.heading3:
              return l("h3", n2, c2);
            case u.heading4:
              return l("h4", n2, c2);
            case u.heading5:
              return l("h5", n2, c2);
            case u.heading6:
              return l("h6", n2, c2);
            case u.paragraph:
              return l("p", n2, c2);
            case u.preformatted:
              return function(e3) {
                return "<pre".concat(a(e3), ">").concat(i(e3.text), "</pre>");
              }(n2);
            case u.strong:
              return l("strong", n2, c2);
            case u.em:
              return l("em", n2, c2);
            case u.listItem:
            case u.oListItem:
              return l("li", n2, c2);
            case u.list:
              return l("ul", n2, c2);
            case u.oList:
              return l("ol", n2, c2);
            case u.image:
              return function(e3, t3) {
                var n3 = t3.linkTo ? o.url(t3.linkTo, e3) : null, r3 = t3.linkTo && t3.linkTo.target ? 'target="'.concat(t3.linkTo.target, '" rel="noopener"') : "", i2 = [t3.label || "", "block-img"], u2 = '<img src="'.concat(t3.url, '" alt="').concat(t3.alt || "", '" copyright="').concat(t3.copyright || "", '">');
                return '\n    <p class="'.concat(i2.join(" "), '">\n      ').concat(n3 ? "<a ".concat(r3, ' href="').concat(n3, '">').concat(u2, "</a>") : u2, "\n    </p>\n  ");
              }(e2, n2);
            case u.embed:
              return function(e3) {
                return '\n    <div data-oembed="'.concat(e3.oembed.embed_url, '"\n      data-oembed-type="').concat(e3.oembed.type, '"\n      data-oembed-provider="').concat(e3.oembed.provider_name, '"\n      ').concat(a(e3), ">\n\n      ").concat(e3.oembed.html, "\n    </div>\n  ");
              }(n2);
            case u.hyperlink:
              return function(e3, t3, n3) {
                var r3 = t3.data.target ? 'target="'.concat(t3.data.target, '" rel="noopener"') : "", u2 = i(o.url(t3.data, e3));
                return "<a ".concat(r3, ' href="').concat(u2, '">').concat(n3.join(""), "</a>");
              }(e2, n2, c2);
            case u.label:
              return function(e3, t3) {
                return "<span ".concat(a(e3.data), ">").concat(t3.join(""), "</span>");
              }(n2, c2);
            case u.span:
              return function(e3) {
                return e3 ? i(e3).replace(/\n/g, "<br />") : "";
              }(r2);
            default:
              return "";
          }
        }
        function a(e2) {
          return e2.label ? ' class="'.concat(e2.label, '"') : "";
        }
        function l(e2, t2, n2) {
          return "<".concat(e2).concat(a(t2), ">").concat(n2.join(""), "</").concat(e2, ">");
        }
        e.exports = { asText: function(e2, t2) {
          return r.asText(e2, t2);
        }, asHtml: function(e2, t2, n2) {
          return r.serialize(e2, c.bind(null, t2), n2).join("");
        }, Elements: u };
      }, function(e, t, n) {
        typeof self != "undefined" && self, e.exports = function(e2) {
          var t2 = {};
          function n2(r) {
            if (t2[r])
              return t2[r].exports;
            var o = t2[r] = { i: r, l: false, exports: {} };
            return e2[r].call(o.exports, o, o.exports, n2), o.l = true, o.exports;
          }
          return n2.m = e2, n2.c = t2, n2.d = function(e3, t3, r) {
            n2.o(e3, t3) || Object.defineProperty(e3, t3, { enumerable: true, get: r });
          }, n2.r = function(e3) {
            typeof Symbol != "undefined" && Symbol.toStringTag && Object.defineProperty(e3, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e3, "__esModule", { value: true });
          }, n2.t = function(e3, t3) {
            if (1 & t3 && (e3 = n2(e3)), 8 & t3)
              return e3;
            if (4 & t3 && typeof e3 == "object" && e3 && e3.__esModule)
              return e3;
            var r = Object.create(null);
            if (n2.r(r), Object.defineProperty(r, "default", { enumerable: true, value: e3 }), 2 & t3 && typeof e3 != "string")
              for (var o in e3)
                n2.d(r, o, function(t4) {
                  return e3[t4];
                }.bind(null, o));
            return r;
          }, n2.n = function(e3) {
            var t3 = e3 && e3.__esModule ? function() {
              return e3.default;
            } : function() {
              return e3;
            };
            return n2.d(t3, "a", t3), t3;
          }, n2.o = function(e3, t3) {
            return Object.prototype.hasOwnProperty.call(e3, t3);
          }, n2.p = "", n2(n2.s = 4);
        }([function(e2, t2, n2) {
          "use strict";
          var r;
          function o(e3, t3, n3) {
            return t3 in e3 ? Object.defineProperty(e3, t3, { value: n3, enumerable: true, configurable: true, writable: true }) : e3[t3] = n3, e3;
          }
          Object.defineProperty(t2, "__esModule", { value: true }), t2.PRIORITIES = t2.NODE_TYPES = void 0;
          var i = { heading1: "heading1", heading2: "heading2", heading3: "heading3", heading4: "heading4", heading5: "heading5", heading6: "heading6", paragraph: "paragraph", preformatted: "preformatted", strong: "strong", em: "em", listItem: "list-item", oListItem: "o-list-item", list: "group-list-item", oList: "group-o-list-item", image: "image", embed: "embed", hyperlink: "hyperlink", label: "label", span: "span" };
          t2.NODE_TYPES = i;
          var u = (o(r = {}, i.heading1, 4), o(r, i.heading2, 4), o(r, i.heading3, 4), o(r, i.heading4, 4), o(r, i.heading5, 4), o(r, i.heading6, 4), o(r, i.paragraph, 3), o(r, i.preformatted, 5), o(r, i.strong, 6), o(r, i.em, 6), o(r, i.oList, 1), o(r, i.list, 1), o(r, i.listItem, 1), o(r, i.oListItem, 1), o(r, i.image, 1), o(r, i.embed, 1), o(r, i.hyperlink, 3), o(r, i.label, 4), o(r, i.span, 7), r);
          t2.PRIORITIES = u;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = void 0;
          var r, o = n2(7), i = n2(2), u = n2(8), c = n2(0), a = (r = n2(3)) && r.__esModule ? r : { default: r };
          function l(e3, t3) {
            for (var n3 = 0; n3 < t3.length; n3++) {
              var r2 = t3[n3];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          function s2(e3) {
            if (e3.length === 0)
              throw new Error("Unable to elect node on empty list");
            var t3 = function(e4) {
              return function(e5) {
                if (Array.isArray(e5))
                  return e5;
              }(e4) || function(e5) {
                if (Symbol.iterator in Object(e5) || Object.prototype.toString.call(e5) === "[object Arguments]")
                  return Array.from(e5);
              }(e4) || function() {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
              }();
            }(e3.sort(function(e4, t4) {
              if (e4.isParentOf(t4))
                return -1;
              if (t4.isParentOf(e4))
                return 1;
              var n3 = c.PRIORITIES[e4.type] - c.PRIORITIES[t4.type];
              return n3 === 0 ? e4.text.length - t4.text.length : n3;
            }));
            return { elected: t3[0], others: t3.slice(1) };
          }
          function f(e3, t3, n3) {
            if (t3.length > 0)
              return function(e4, t4, n4) {
                return t4.reduce(function(r3, o2, u2) {
                  var c2 = [], a2 = u2 === 0 && o2.start > n4.lower, l2 = u2 === t4.length - 1 && n4.upper > o2.end;
                  if (a2) {
                    var s3 = new i.TextNode(n4.lower, o2.start, e4.slice(n4.lower, o2.start));
                    c2 = c2.concat(s3);
                  } else {
                    var f2 = t4[u2 - 1];
                    if (f2 && o2.start > f2.end) {
                      var d2 = e4.slice(f2.end, o2.start), p2 = new i.TextNode(f2.end, o2.start, d2);
                      c2 = c2.concat(p2);
                    }
                  }
                  if (c2 = c2.concat(o2), l2) {
                    var y = new i.TextNode(o2.end, n4.upper, e4.slice(o2.end, n4.upper));
                    c2 = c2.concat(y);
                  }
                  return r3.concat(c2);
                }, []);
              }(e3, d(e3, t3), n3);
            var r2 = e3.slice(n3.lower, n3.upper);
            return [new i.TextNode(n3.lower, n3.upper, r2)];
          }
          function d(e3, t3) {
            var n3 = function(e4) {
              return function(e5, t4) {
                return t4.reduce(function(e6, t5) {
                  var n4 = (0, o.last)(e6);
                  if (n4) {
                    if (n4.some(function(e7) {
                      return e7.isParentOf(t5);
                    }))
                      return (0, o.init)(e6).concat([n4.concat(t5)]);
                    var r3 = (0, o.last)(n4);
                    return r3 && function(e7, t6) {
                      return e7.end >= t6.start;
                    }(r3, t5) ? (0, o.init)(e6).concat([n4.concat(t5)]) : e6.concat([[t5]]);
                  }
                  return [[t5]];
                }, []);
              }(0, (0, o.sort)(e4, function(e5, t4) {
                return n4 = t4, e5.start - n4.start || function(e6, t5) {
                  return e6.end - t5.end;
                }(e5, t4);
                var n4;
              }));
            }((0, o.sort)(t3, function(e4, t4) {
              return e4.start - t4.start;
            })).map(s2), r2 = (0, o.flatten)(n3.map(function(t4) {
              return function(e4, t5) {
                var n4 = t5.others.reduce(function(n5, r4) {
                  var o3 = n5.inner, u2 = n5.outer, c2 = function(e5, t6, n6) {
                    return n6.start < t6.start ? { inner: i.SpanNode.slice(n6, t6.start, n6.end, e5), outer: i.SpanNode.slice(n6, n6.start, t6.start, e5) } : n6.end > t6.end ? { inner: i.SpanNode.slice(n6, n6.start, t6.end, e5), outer: i.SpanNode.slice(n6, t6.end, n6.end, e5) } : { inner: n6 };
                  }(e4, t5.elected, r4);
                  return { inner: o3.concat(c2.inner), outer: c2.outer ? u2.concat(c2.outer) : u2 };
                }, { inner: [], outer: [] }), r3 = n4.inner, o2 = n4.outer;
                return [t5.elected.setChildren(f(e4, r3, t5.elected.boundaries()))].concat(d(e4, o2));
              }(e3, t4);
            }));
            return (0, o.sort)(r2, function(e4, t4) {
              return e4.start - t4.start;
            });
          }
          var p = function() {
            function e3() {
              !function(e4, t4) {
                if (!(e4 instanceof t4))
                  throw new TypeError("Cannot call a class as a function");
              }(this, e3);
            }
            var t3, n3;
            return t3 = e3, (n3 = [{ key: "fromRichText", value: function(e4) {
              return { key: (0, a.default)(), children: e4.reduce(function(e5, t4, n4) {
                if (u.RichTextBlock.isEmbedBlock(t4.type) || u.RichTextBlock.isImageBlock(t4.type))
                  return e5.concat(new i.BlockNode(t4.type, t4));
                var r2 = function(e6) {
                  var t5 = (e6.spans || []).map(function(t6) {
                    var n6 = e6.text.slice(t6.start, t6.end);
                    return new i.SpanNode(t6.start, t6.end, t6.type, n6, [], t6);
                  }), n5 = { lower: 0, upper: e6.text.length };
                  return f(e6.text, t5, n5);
                }(t4), c2 = e5[e5.length - 1];
                if (u.RichTextBlock.isListItem(t4.type) && c2 && c2 instanceof i.ListBlockNode) {
                  var a2 = new i.ListItemBlockNode(t4, r2), l2 = c2.addChild(a2);
                  return (0, o.init)(e5).concat(l2);
                }
                if (u.RichTextBlock.isOrderedListItem(t4.type) && c2 && c2 instanceof i.OrderedListBlockNode) {
                  var s3 = new i.OrderedListItemBlockNode(t4, r2), d2 = c2.addChild(s3);
                  return (0, o.init)(e5).concat(d2);
                }
                if (u.RichTextBlock.isListItem(t4.type)) {
                  var p2 = new i.ListItemBlockNode(t4, r2), y = new i.ListBlockNode(u.RichTextBlock.emptyList(), [p2]);
                  return e5.concat(y);
                }
                if (u.RichTextBlock.isOrderedListItem(t4.type)) {
                  var h = new i.OrderedListItemBlockNode(t4, r2), v = new i.OrderedListBlockNode(u.RichTextBlock.emptyOrderedList(), [h]);
                  return e5.concat(v);
                }
                return e5.concat(new i.BlockNode(t4.type, t4, r2));
              }, []) };
            } }]) && l(t3, n3), e3;
          }();
          t2.default = p;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.ListBlockNode = t2.OrderedListBlockNode = t2.OrderedListItemBlockNode = t2.ListItemBlockNode = t2.BlockNode = t2.TextNode = t2.SpanNode = t2.Node = void 0;
          var r, o = (r = n2(3)) && r.__esModule ? r : { default: r }, i = n2(0);
          function u(e3) {
            return (u = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e4) {
              return typeof e4;
            } : function(e4) {
              return e4 && typeof Symbol == "function" && e4.constructor === Symbol && e4 !== Symbol.prototype ? "symbol" : typeof e4;
            })(e3);
          }
          function c(e3, t3) {
            for (var n3 = 0; n3 < t3.length; n3++) {
              var r2 = t3[n3];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          function a(e3, t3, n3) {
            return t3 && c(e3.prototype, t3), n3 && c(e3, n3), e3;
          }
          function l(e3, t3) {
            if (typeof t3 != "function" && t3 !== null)
              throw new TypeError("Super expression must either be null or a function");
            e3.prototype = Object.create(t3 && t3.prototype, { constructor: { value: e3, writable: true, configurable: true } }), t3 && function(e4, t4) {
              (Object.setPrototypeOf || function(e5, t5) {
                return e5.__proto__ = t5, e5;
              })(e4, t4);
            }(e3, t3);
          }
          function s2(e3) {
            return function() {
              var t3, n3 = f(e3);
              if (function() {
                if (typeof Reflect == "undefined" || !Reflect.construct)
                  return false;
                if (Reflect.construct.sham)
                  return false;
                if (typeof Proxy == "function")
                  return true;
                try {
                  return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
                  })), true;
                } catch (e4) {
                  return false;
                }
              }()) {
                var r2 = f(this).constructor;
                t3 = Reflect.construct(n3, arguments, r2);
              } else
                t3 = n3.apply(this, arguments);
              return function(e4, t4) {
                return !t4 || u(t4) !== "object" && typeof t4 != "function" ? function(e5) {
                  if (e5 === void 0)
                    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                  return e5;
                }(e4) : t4;
              }(this, t3);
            };
          }
          function f(e3) {
            return (f = Object.setPrototypeOf ? Object.getPrototypeOf : function(e4) {
              return e4.__proto__ || Object.getPrototypeOf(e4);
            })(e3);
          }
          function d(e3, t3) {
            if (!(e3 instanceof t3))
              throw new TypeError("Cannot call a class as a function");
          }
          var p = function e3(t3, n3, r2) {
            d(this, e3), this.key = (0, o.default)(), this.type = t3, this.element = n3, this.children = r2;
          };
          t2.Node = p;
          var y = function(e3) {
            l(n3, p);
            var t3 = s2(n3);
            function n3(e4, r2, o2, i2, u2, c2) {
              var a2;
              return d(this, n3), (a2 = t3.call(this, o2, c2, u2)).start = e4, a2.end = r2, a2.text = i2, a2.children = u2, a2;
            }
            return a(n3, [{ key: "boundaries", value: function() {
              return { lower: this.start, upper: this.end };
            } }, { key: "isParentOf", value: function(e4) {
              return this.start <= e4.start && this.end >= e4.end;
            } }, { key: "setChildren", value: function(e4) {
              return new n3(this.start, this.end, this.type, this.text, e4, this.element);
            } }], [{ key: "slice", value: function(e4, t4, r2, o2) {
              return new n3(t4, r2, e4.type, o2.slice(t4, r2), e4.children, e4.element);
            } }]), n3;
          }();
          t2.SpanNode = y;
          var h = function(e3) {
            l(n3, y);
            var t3 = s2(n3);
            function n3(e4, r2, o2) {
              d(this, n3);
              var u2 = { type: i.NODE_TYPES.span, start: e4, end: r2, text: o2 };
              return t3.call(this, e4, r2, i.NODE_TYPES.span, o2, [], u2);
            }
            return n3;
          }();
          t2.TextNode = h;
          var v = function(e3) {
            l(n3, p);
            var t3 = s2(n3);
            function n3(e4, r2) {
              var o2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
              return d(this, n3), t3.call(this, e4, r2, o2);
            }
            return n3;
          }();
          t2.BlockNode = v;
          var m = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d(this, n3), t3.call(this, i.NODE_TYPES.listItem, e4, r2);
            }
            return n3;
          }();
          t2.ListItemBlockNode = m;
          var b = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d(this, n3), t3.call(this, i.NODE_TYPES.oListItem, e4, r2);
            }
            return n3;
          }();
          t2.OrderedListItemBlockNode = b;
          var g = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d(this, n3), t3.call(this, i.NODE_TYPES.oList, e4, r2);
            }
            return a(n3, [{ key: "addChild", value: function(e4) {
              var t4 = this.children.concat(e4);
              return new n3(this.element, t4);
            } }]), n3;
          }();
          t2.OrderedListBlockNode = g;
          var x = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d(this, n3), t3.call(this, i.NODE_TYPES.list, e4, r2);
            }
            return a(n3, [{ key: "addChild", value: function(e4) {
              var t4 = this.children.concat(e4);
              return new n3(this.element, t4);
            } }]), n3;
          }();
          t2.ListBlockNode = x;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = function() {
            var e3 = new Date().getTime();
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(t3) {
              var n3 = (e3 + 16 * Math.random()) % 16 | 0;
              return e3 = Math.floor(e3 / 16), (t3 == "x" ? n3 : 3 & n3 | 8).toString(16);
            });
          };
        }, function(e2, t2, n2) {
          e2.exports = n2(5);
        }, function(e2, t2, n2) {
          "use strict";
          var r = c(n2(6)), o = c(n2(1)), i = c(n2(9)), u = n2(0);
          function c(e3) {
            return e3 && e3.__esModule ? e3 : { default: e3 };
          }
          e2.exports = { asText: r.default, asTree: o.default.fromRichText, serialize: i.default, Elements: u.NODE_TYPES };
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = void 0, t2.default = function(e3, t3) {
            var n3 = typeof t3 == "string" ? t3 : " ";
            return e3.map(function(e4) {
              return e4.text;
            }).join(n3);
          };
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.init = function(e3) {
            return e3.slice(0, -1);
          }, t2.last = function(e3) {
            return e3[e3.length - 1];
          }, t2.flatten = function(e3) {
            var t3 = [], n3 = true, r = false, o = void 0;
            try {
              for (var i, u = e3[Symbol.iterator](); !(n3 = (i = u.next()).done); n3 = true) {
                var c = i.value;
                Array.isArray(c) ? t3.push.apply(t3, c) : t3.push(c);
              }
            } catch (e4) {
              r = true, o = e4;
            } finally {
              try {
                n3 || u.return == null || u.return();
              } finally {
                if (r)
                  throw o;
              }
            }
            return t3;
          }, t2.sort = function(e3, t3) {
            return function(e4) {
              return function(e5) {
                if (Array.isArray(e5)) {
                  for (var t4 = 0, n3 = new Array(e5.length); t4 < e5.length; t4++)
                    n3[t4] = e5[t4];
                  return n3;
                }
              }(e4) || function(e5) {
                if (Symbol.iterator in Object(e5) || Object.prototype.toString.call(e5) === "[object Arguments]")
                  return Array.from(e5);
              }(e4) || function() {
                throw new TypeError("Invalid attempt to spread non-iterable instance");
              }();
            }(e3).sort(t3);
          };
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.RichTextBlock = void 0;
          var r = n2(0);
          function o(e3, t3) {
            for (var n3 = 0; n3 < t3.length; n3++) {
              var r2 = t3[n3];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          var i = function() {
            function e3(t4, n4, r2) {
              !function(e4, t5) {
                if (!(e4 instanceof t5))
                  throw new TypeError("Cannot call a class as a function");
              }(this, e3), this.type = t4, this.text = n4, this.spans = r2;
            }
            var t3, n3;
            return t3 = e3, (n3 = [{ key: "isEmbedBlock", value: function(e4) {
              return e4 === r.NODE_TYPES.embed;
            } }, { key: "isImageBlock", value: function(e4) {
              return e4 === r.NODE_TYPES.image;
            } }, { key: "isList", value: function(e4) {
              return e4 === r.NODE_TYPES.list;
            } }, { key: "isOrderedList", value: function(e4) {
              return e4 === r.NODE_TYPES.oList;
            } }, { key: "isListItem", value: function(e4) {
              return e4 === r.NODE_TYPES.listItem;
            } }, { key: "isOrderedListItem", value: function(e4) {
              return e4 === r.NODE_TYPES.oListItem;
            } }, { key: "emptyList", value: function() {
              return { type: r.NODE_TYPES.list, spans: [], text: "" };
            } }, { key: "emptyOrderedList", value: function() {
              return { type: r.NODE_TYPES.oList, spans: [], text: "" };
            } }]) && o(t3, n3), e3;
          }();
          t2.RichTextBlock = i;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = void 0;
          var r, o = (r = n2(1)) && r.__esModule ? r : { default: r }, i = n2(2);
          t2.default = function(e3, t3, n3) {
            return o.default.fromRichText(e3).children.map(function(e4, r2) {
              return function(e5, t4, n4, r3) {
                return function e6(n5, o2) {
                  var u = n5 instanceof i.SpanNode ? n5.text : null, c = n5.children.reduce(function(t5, n6, r4) {
                    return t5.concat([e6(n6, r4)]);
                  }, []);
                  return r3 && r3(n5.type, n5.element, u, c, o2) || t4(n5.type, n5.element, u, c, o2);
                }(e5, n4);
              }(e4, t3, r2, n3);
            });
          };
        }]);
      }, function(e, t, n) {
        "use strict";
        var r = /["'&<>]/;
        e.exports = function(e2) {
          var t2, n2 = "" + e2, o = r.exec(n2);
          if (!o)
            return n2;
          var i = "", u = 0, c = 0;
          for (u = o.index; u < n2.length; u++) {
            switch (n2.charCodeAt(u)) {
              case 34:
                t2 = "&quot;";
                break;
              case 38:
                t2 = "&amp;";
                break;
              case 39:
                t2 = "&#39;";
                break;
              case 60:
                t2 = "&lt;";
                break;
              case 62:
                t2 = "&gt;";
                break;
              default:
                continue;
            }
            c !== u && (i += n2.substring(c, u)), c = u + 1, i += t2;
          }
          return c !== u ? i + n2.substring(c, u) : i;
        };
      }]);
    });
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/ssr.js
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page: page2
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page: page2,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${branch.map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page2.path)},
						query: new URLSearchParams(${s$1(page2.query.toString())}),
						params: ${s$1(page2.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ ...error3, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
function resolve(base, path) {
  const baseparts = path[0] === "/" ? [] : base.slice(1).split("/");
  const pathparts = path[0] === "/" ? path.slice(1).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  return `/${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page: page2,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          const request2 = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, request2);
        } else {
          const [path, search] = url.split("?");
          const resolved = resolve(request.path, path);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new Response(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await fetch(`http://${page2.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = { ...opts.headers };
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            if (opts.body && typeof opts.body !== "string") {
              throw new Error("Request body must be a string");
            }
            const rendered = await respond({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new Response(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page: page2,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page: page2,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page: page2
    });
  } catch (error4) {
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page: page2,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page: page2,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page: page2
    });
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (state.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${state.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler2) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler2({ ...request, params });
    const preface = `Invalid response from route ${request.path}`;
    if (response) {
      if (typeof response !== "object") {
        return error(`${preface}: expected an object, got ${typeof response}`);
      }
      let { status = 200, body, headers = {} } = response;
      headers = lowercase_keys(headers);
      const type = headers["content-type"];
      const is_type_textual = isContentTypeTextual(type);
      if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
        return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
      }
      let normalized_body;
      if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
        headers = { ...headers, "content-type": "application/json; charset=utf-8" };
        normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
      } else {
        normalized_body = body;
      }
      return { status, body: normalized_body, headers };
    }
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const [type, ...directives] = headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !incoming.path.split("/").pop().includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: null,
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            error: null,
            branch: [],
            page: null
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_client = __toModule(require_client());
var import_prismic_dom = __toModule(require_prismic_dom_min());

// node_modules/svelte-imgix/dist/index.mjs
init_shims();
var queryString = {};
var strictUriEncode = (str) => encodeURIComponent(str).replace(/[!'()*]/g, (x) => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);
var token = "%[a-f0-9]{2}";
var singleMatcher = new RegExp(token, "gi");
var multiMatcher = new RegExp("(" + token + ")+", "gi");
function decodeComponents(components, split) {
  try {
    return decodeURIComponent(components.join(""));
  } catch (err) {
  }
  if (components.length === 1) {
    return components;
  }
  split = split || 1;
  var left = components.slice(0, split);
  var right = components.slice(split);
  return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}
function decode(input) {
  try {
    return decodeURIComponent(input);
  } catch (err) {
    var tokens = input.match(singleMatcher);
    for (var i = 1; i < tokens.length; i++) {
      input = decodeComponents(tokens, i).join("");
      tokens = input.match(singleMatcher);
    }
    return input;
  }
}
function customDecodeURIComponent(input) {
  var replaceMap = {
    "%FE%FF": "\uFFFD\uFFFD",
    "%FF%FE": "\uFFFD\uFFFD"
  };
  var match = multiMatcher.exec(input);
  while (match) {
    try {
      replaceMap[match[0]] = decodeURIComponent(match[0]);
    } catch (err) {
      var result = decode(match[0]);
      if (result !== match[0]) {
        replaceMap[match[0]] = result;
      }
    }
    match = multiMatcher.exec(input);
  }
  replaceMap["%C2"] = "\uFFFD";
  var entries = Object.keys(replaceMap);
  for (var i = 0; i < entries.length; i++) {
    var key = entries[i];
    input = input.replace(new RegExp(key, "g"), replaceMap[key]);
  }
  return input;
}
var decodeUriComponent = function(encodedURI) {
  if (typeof encodedURI !== "string") {
    throw new TypeError("Expected `encodedURI` to be of type `string`, got `" + typeof encodedURI + "`");
  }
  try {
    encodedURI = encodedURI.replace(/\+/g, " ");
    return decodeURIComponent(encodedURI);
  } catch (err) {
    return customDecodeURIComponent(encodedURI);
  }
};
var splitOnFirst = (string, separator) => {
  if (!(typeof string === "string" && typeof separator === "string")) {
    throw new TypeError("Expected the arguments to be of type `string`");
  }
  if (separator === "") {
    return [string];
  }
  const separatorIndex = string.indexOf(separator);
  if (separatorIndex === -1) {
    return [string];
  }
  return [
    string.slice(0, separatorIndex),
    string.slice(separatorIndex + separator.length)
  ];
};
var filterObj = function(obj, predicate) {
  var ret = {};
  var keys = Object.keys(obj);
  var isArr = Array.isArray(predicate);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = obj[key];
    if (isArr ? predicate.indexOf(key) !== -1 : predicate(key, val, obj)) {
      ret[key] = val;
    }
  }
  return ret;
};
(function(exports) {
  const strictUriEncode$1 = strictUriEncode;
  const decodeComponent = decodeUriComponent;
  const splitOnFirst$1 = splitOnFirst;
  const filterObject = filterObj;
  const isNullOrUndefined = (value) => value === null || value === void 0;
  function encoderForArrayFormat(options2) {
    switch (options2.arrayFormat) {
      case "index":
        return (key) => (result, value) => {
          const index2 = result.length;
          if (value === void 0 || options2.skipNull && value === null || options2.skipEmptyString && value === "") {
            return result;
          }
          if (value === null) {
            return [...result, [encode(key, options2), "[", index2, "]"].join("")];
          }
          return [
            ...result,
            [encode(key, options2), "[", encode(index2, options2), "]=", encode(value, options2)].join("")
          ];
        };
      case "bracket":
        return (key) => (result, value) => {
          if (value === void 0 || options2.skipNull && value === null || options2.skipEmptyString && value === "") {
            return result;
          }
          if (value === null) {
            return [...result, [encode(key, options2), "[]"].join("")];
          }
          return [...result, [encode(key, options2), "[]=", encode(value, options2)].join("")];
        };
      case "comma":
      case "separator":
      case "bracket-separator": {
        const keyValueSep = options2.arrayFormat === "bracket-separator" ? "[]=" : "=";
        return (key) => (result, value) => {
          if (value === void 0 || options2.skipNull && value === null || options2.skipEmptyString && value === "") {
            return result;
          }
          value = value === null ? "" : value;
          if (result.length === 0) {
            return [[encode(key, options2), keyValueSep, encode(value, options2)].join("")];
          }
          return [[result, encode(value, options2)].join(options2.arrayFormatSeparator)];
        };
      }
      default:
        return (key) => (result, value) => {
          if (value === void 0 || options2.skipNull && value === null || options2.skipEmptyString && value === "") {
            return result;
          }
          if (value === null) {
            return [...result, encode(key, options2)];
          }
          return [...result, [encode(key, options2), "=", encode(value, options2)].join("")];
        };
    }
  }
  function parserForArrayFormat(options2) {
    let result;
    switch (options2.arrayFormat) {
      case "index":
        return (key, value, accumulator) => {
          result = /\[(\d*)\]$/.exec(key);
          key = key.replace(/\[\d*\]$/, "");
          if (!result) {
            accumulator[key] = value;
            return;
          }
          if (accumulator[key] === void 0) {
            accumulator[key] = {};
          }
          accumulator[key][result[1]] = value;
        };
      case "bracket":
        return (key, value, accumulator) => {
          result = /(\[\])$/.exec(key);
          key = key.replace(/\[\]$/, "");
          if (!result) {
            accumulator[key] = value;
            return;
          }
          if (accumulator[key] === void 0) {
            accumulator[key] = [value];
            return;
          }
          accumulator[key] = [].concat(accumulator[key], value);
        };
      case "comma":
      case "separator":
        return (key, value, accumulator) => {
          const isArray = typeof value === "string" && value.includes(options2.arrayFormatSeparator);
          const isEncodedArray = typeof value === "string" && !isArray && decode2(value, options2).includes(options2.arrayFormatSeparator);
          value = isEncodedArray ? decode2(value, options2) : value;
          const newValue = isArray || isEncodedArray ? value.split(options2.arrayFormatSeparator).map((item) => decode2(item, options2)) : value === null ? value : decode2(value, options2);
          accumulator[key] = newValue;
        };
      case "bracket-separator":
        return (key, value, accumulator) => {
          const isArray = /(\[\])$/.test(key);
          key = key.replace(/\[\]$/, "");
          if (!isArray) {
            accumulator[key] = value ? decode2(value, options2) : value;
            return;
          }
          const arrayValue = value === null ? [] : value.split(options2.arrayFormatSeparator).map((item) => decode2(item, options2));
          if (accumulator[key] === void 0) {
            accumulator[key] = arrayValue;
            return;
          }
          accumulator[key] = [].concat(accumulator[key], arrayValue);
        };
      default:
        return (key, value, accumulator) => {
          if (accumulator[key] === void 0) {
            accumulator[key] = value;
            return;
          }
          accumulator[key] = [].concat(accumulator[key], value);
        };
    }
  }
  function validateArrayFormatSeparator(value) {
    if (typeof value !== "string" || value.length !== 1) {
      throw new TypeError("arrayFormatSeparator must be single character string");
    }
  }
  function encode(value, options2) {
    if (options2.encode) {
      return options2.strict ? strictUriEncode$1(value) : encodeURIComponent(value);
    }
    return value;
  }
  function decode2(value, options2) {
    if (options2.decode) {
      return decodeComponent(value);
    }
    return value;
  }
  function keysSorter(input) {
    if (Array.isArray(input)) {
      return input.sort();
    }
    if (typeof input === "object") {
      return keysSorter(Object.keys(input)).sort((a, b) => Number(a) - Number(b)).map((key) => input[key]);
    }
    return input;
  }
  function removeHash(input) {
    const hashStart = input.indexOf("#");
    if (hashStart !== -1) {
      input = input.slice(0, hashStart);
    }
    return input;
  }
  function getHash(url) {
    let hash2 = "";
    const hashStart = url.indexOf("#");
    if (hashStart !== -1) {
      hash2 = url.slice(hashStart);
    }
    return hash2;
  }
  function extract(input) {
    input = removeHash(input);
    const queryStart = input.indexOf("?");
    if (queryStart === -1) {
      return "";
    }
    return input.slice(queryStart + 1);
  }
  function parseValue(value, options2) {
    if (options2.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === "string" && value.trim() !== "")) {
      value = Number(value);
    } else if (options2.parseBooleans && value !== null && (value.toLowerCase() === "true" || value.toLowerCase() === "false")) {
      value = value.toLowerCase() === "true";
    }
    return value;
  }
  function parse(query, options2) {
    options2 = Object.assign({
      decode: true,
      sort: true,
      arrayFormat: "none",
      arrayFormatSeparator: ",",
      parseNumbers: false,
      parseBooleans: false
    }, options2);
    validateArrayFormatSeparator(options2.arrayFormatSeparator);
    const formatter = parserForArrayFormat(options2);
    const ret = Object.create(null);
    if (typeof query !== "string") {
      return ret;
    }
    query = query.trim().replace(/^[?#&]/, "");
    if (!query) {
      return ret;
    }
    for (const param of query.split("&")) {
      if (param === "") {
        continue;
      }
      let [key, value] = splitOnFirst$1(options2.decode ? param.replace(/\+/g, " ") : param, "=");
      value = value === void 0 ? null : ["comma", "separator", "bracket-separator"].includes(options2.arrayFormat) ? value : decode2(value, options2);
      formatter(decode2(key, options2), value, ret);
    }
    for (const key of Object.keys(ret)) {
      const value = ret[key];
      if (typeof value === "object" && value !== null) {
        for (const k of Object.keys(value)) {
          value[k] = parseValue(value[k], options2);
        }
      } else {
        ret[key] = parseValue(value, options2);
      }
    }
    if (options2.sort === false) {
      return ret;
    }
    return (options2.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options2.sort)).reduce((result, key) => {
      const value = ret[key];
      if (Boolean(value) && typeof value === "object" && !Array.isArray(value)) {
        result[key] = keysSorter(value);
      } else {
        result[key] = value;
      }
      return result;
    }, Object.create(null));
  }
  exports.extract = extract;
  exports.parse = parse;
  exports.stringify = (object, options2) => {
    if (!object) {
      return "";
    }
    options2 = Object.assign({
      encode: true,
      strict: true,
      arrayFormat: "none",
      arrayFormatSeparator: ","
    }, options2);
    validateArrayFormatSeparator(options2.arrayFormatSeparator);
    const shouldFilter = (key) => options2.skipNull && isNullOrUndefined(object[key]) || options2.skipEmptyString && object[key] === "";
    const formatter = encoderForArrayFormat(options2);
    const objectCopy = {};
    for (const key of Object.keys(object)) {
      if (!shouldFilter(key)) {
        objectCopy[key] = object[key];
      }
    }
    const keys = Object.keys(objectCopy);
    if (options2.sort !== false) {
      keys.sort(options2.sort);
    }
    return keys.map((key) => {
      const value = object[key];
      if (value === void 0) {
        return "";
      }
      if (value === null) {
        return encode(key, options2);
      }
      if (Array.isArray(value)) {
        if (value.length === 0 && options2.arrayFormat === "bracket-separator") {
          return encode(key, options2) + "[]";
        }
        return value.reduce(formatter(key), []).join("&");
      }
      return encode(key, options2) + "=" + encode(value, options2);
    }).filter((x) => x.length > 0).join("&");
  };
  exports.parseUrl = (url, options2) => {
    options2 = Object.assign({
      decode: true
    }, options2);
    const [url_, hash2] = splitOnFirst$1(url, "#");
    return Object.assign({
      url: url_.split("?")[0] || "",
      query: parse(extract(url), options2)
    }, options2 && options2.parseFragmentIdentifier && hash2 ? { fragmentIdentifier: decode2(hash2, options2) } : {});
  };
  exports.stringifyUrl = (object, options2) => {
    options2 = Object.assign({
      encode: true,
      strict: true
    }, options2);
    const url = removeHash(object.url).split("?")[0] || "";
    const queryFromUrl = exports.extract(object.url);
    const parsedQueryFromUrl = exports.parse(queryFromUrl, { sort: false });
    const query = Object.assign(parsedQueryFromUrl, object.query);
    let queryString2 = exports.stringify(query, options2);
    if (queryString2) {
      queryString2 = `?${queryString2}`;
    }
    let hash2 = getHash(object.url);
    if (object.fragmentIdentifier) {
      hash2 = `#${encode(object.fragmentIdentifier, options2)}`;
    }
    return `${url}${queryString2}${hash2}`;
  };
  exports.pick = (input, filter, options2) => {
    options2 = Object.assign({
      parseFragmentIdentifier: true
    }, options2);
    const { url, query, fragmentIdentifier } = exports.parseUrl(input, options2);
    return exports.stringifyUrl({
      url,
      query: filterObject(query, filter),
      fragmentIdentifier
    }, options2);
  };
  exports.exclude = (input, filter, options2) => {
    const exclusionFilter = Array.isArray(filter) ? (key) => !filter.includes(key) : (key, value) => !filter(key, value);
    return exports.pick(input, exclusionFilter, options2);
  };
})(queryString);
function trimSrc(src2) {
  return src2.split(/[?#]/)[0];
}
function placeholder(src2) {
  return `${trimSrc(src2)}?w=0.5&blur=200&px=16&auto=format&colorquant=150`;
}

// .svelte-kit/output/server/app.js
function noop2() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
Promise.resolve();
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
var css$7 = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page: page2 } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$7);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1pdgbjn"}">${navigated ? `${escape2(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "/." } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-644f0f06.js",
      css: ["/./_app/assets/start-0826e215.css"],
      js: ["/./_app/start-644f0f06.js", "/./_app/chunks/vendor-d08828a3.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      if (error22.frame) {
        console.error(error22.frame);
      }
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    service_worker: "/service-worker.js",
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "assets/Hello.svg", "size": 1158766, "type": "image/svg+xml" }, { "file": "assets/icon-library.svg", "size": 1480, "type": "image/svg+xml" }, { "file": "assets/logo-sd-bleu.png", "size": 184297, "type": "image/png" }, { "file": "assets/vector-email.svg", "size": 23398, "type": "image/svg+xml" }, { "file": "assets/vector-enLigne.svg", "size": 283, "type": "image/svg+xml" }, { "file": "assets/vector-header.svg", "size": 239, "type": "image/svg+xml" }, { "file": "assets/vector-hero.svg", "size": 662, "type": "image/svg+xml" }, { "file": "assets/vector-link.svg", "size": 951, "type": "image/svg+xml" }, { "file": "assets/vector-projets.svg", "size": 216, "type": "image/svg+xml" }, { "file": "assets/vector-quote.svg", "size": 1087, "type": "image/svg+xml" }, { "file": "assets/vector-services.svg", "size": 228, "type": "image/svg+xml" }, { "file": "favicon.png", "size": 184297, "type": "image/png" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/mentions-legales\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/mentions-legales.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/photographies\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/photographies.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/sitemap\.xml$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return sitemap_xml;
      })
    },
    {
      type: "page",
      pattern: /^\/contact\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/contact.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/merci\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/merci.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/api\/?$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return index$1;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/api\/photographies\/?$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return photographies$1;
      })
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/mentions-legales.svelte": () => Promise.resolve().then(function() {
    return mentionsLegales;
  }),
  "src/routes/photographies.svelte": () => Promise.resolve().then(function() {
    return photographies;
  }),
  "src/routes/contact.svelte": () => Promise.resolve().then(function() {
    return contact;
  }),
  "src/routes/merci.svelte": () => Promise.resolve().then(function() {
    return merci;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-5197162c.js", "css": ["/./_app/assets/pages/__layout.svelte-943cb1c3.css"], "js": ["/./_app/pages/__layout.svelte-5197162c.js", "/./_app/chunks/vendor-d08828a3.js", "/./_app/chunks/stores-8d68bb63.js", "/./_app/chunks/CTALink-7202d5f8.js"], "styles": null }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-2bcb66eb.js", "css": [], "js": ["/./_app/error.svelte-2bcb66eb.js", "/./_app/chunks/vendor-d08828a3.js"], "styles": null }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-86b0c122.js", "css": ["/./_app/assets/pages/index.svelte-36617fb8.css", "/./_app/assets/CTA-b9c08687.css"], "js": ["/./_app/pages/index.svelte-86b0c122.js", "/./_app/chunks/vendor-d08828a3.js", "/./_app/chunks/SEOHead-aaa0cf6c.js", "/./_app/chunks/stores-8d68bb63.js", "/./_app/chunks/CTALink-7202d5f8.js", "/./_app/chunks/CTA-2423345f.js"], "styles": null }, "src/routes/mentions-legales.svelte": { "entry": "/./_app/pages/mentions-legales.svelte-0ca80d2e.js", "css": ["/./_app/assets/pages/mentions-legales.svelte-b8078c70.css", "/./_app/assets/CTA-b9c08687.css"], "js": ["/./_app/pages/mentions-legales.svelte-0ca80d2e.js", "/./_app/chunks/vendor-d08828a3.js", "/./_app/chunks/CTA-2423345f.js", "/./_app/chunks/CTALink-7202d5f8.js"], "styles": null }, "src/routes/photographies.svelte": { "entry": "/./_app/pages/photographies.svelte-9103d4c6.js", "css": ["/./_app/assets/CTA-b9c08687.css"], "js": ["/./_app/pages/photographies.svelte-9103d4c6.js", "/./_app/chunks/vendor-d08828a3.js", "/./_app/chunks/SEOHead-aaa0cf6c.js", "/./_app/chunks/stores-8d68bb63.js", "/./_app/chunks/CTA-2423345f.js", "/./_app/chunks/CTALink-7202d5f8.js"], "styles": null }, "src/routes/contact.svelte": { "entry": "/./_app/pages/contact.svelte-09ff954d.js", "css": ["/./_app/assets/pages/contact.svelte-f93e2525.css"], "js": ["/./_app/pages/contact.svelte-09ff954d.js", "/./_app/chunks/vendor-d08828a3.js", "/./_app/chunks/SEOHead-aaa0cf6c.js", "/./_app/chunks/stores-8d68bb63.js"], "styles": null }, "src/routes/merci.svelte": { "entry": "/./_app/pages/merci.svelte-3a9203f1.js", "css": ["/./_app/assets/pages/merci.svelte-eceab4cd.css"], "js": ["/./_app/pages/merci.svelte-3a9203f1.js", "/./_app/chunks/vendor-d08828a3.js"], "styles": null } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
async function get$2() {
  const date = new Date().toISOString().split("T")[0];
  const pages = Object.keys({ "/src/routes/contact.svelte": () => Promise.resolve().then(function() {
    return contact;
  }), "/src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }), "/src/routes/mentions-legales.svelte": () => Promise.resolve().then(function() {
    return mentionsLegales;
  }), "/src/routes/merci.svelte": () => Promise.resolve().then(function() {
    return merci;
  }), "/src/routes/photographies.svelte": () => Promise.resolve().then(function() {
    return photographies;
  }) }).filter((page2) => {
    const filters = ["_", "private"];
    return !filters.find((filter) => page2.includes(filter));
  }).map((page2) => {
    return page2.replace("/src/routes", "https://sdelon.com").replace("/index.svelte", "").replace(".svelte", "");
  });
  const allSiteURL = pages.flat().reduce((newArr, currItem) => {
    let node = {};
    switch (currItem) {
      case "https://sdelon.com/mentions-legales":
        node = {
          loc: `${currItem}`,
          priority: "0.5",
          changefreq: "never",
          date
        };
        break;
      case "https://sdelon.com/contact":
        node = {
          loc: `${currItem}`,
          priority: "1",
          changefreq: "yearly",
          date
        };
        break;
      case "https://sdelon.com":
      case "https://sdelon.com/photographies":
        node = {
          loc: `${currItem}`,
          priority: "1",
          changefreq: "monthly",
          date
        };
        break;
    }
    newArr.push(node);
    return newArr;
  }, []);
  const urlNodes = allSiteURL.map((page2) => {
    return `
            <url>
                <loc>${page2.loc}</loc>
                <priority>${page2.priority}</priority>
                <changefreq>${page2.changefreq}</changefreq>
                <lastmod>${page2.date}</lastmod>
            </url>
        `;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    ${urlNodes}
    </urlset>`;
  return {
    body: xml,
    headers: {
      "Content-Type": "application/xml"
    }
  };
}
var sitemap_xml = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$2
});
var apiEndpoint = "https://sdelon-portfolio.cdn.prismic.io/api/v2";
var Client = import_client.default.client(apiEndpoint);
async function get$1() {
  const accueil = await Client.query([import_client.default.Predicates.at("document.type", "accueil")]);
  return {
    body: {
      accueil: accueil.results
    }
  };
}
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$1
});
async function get() {
  const photographies2 = await Client.query([import_client.default.Predicates.at("document.type", "photographies")]);
  return {
    body: {
      photographies: photographies2.results
    }
  };
}
var photographies$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get
});
var logoSD = "/_app/assets/logo-sd-bleu.a10bb81c.png";
var getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session
  };
};
var page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
var css$6 = {
  code: ".main-nav.svelte-oe2f16>li.svelte-oe2f16>a.svelte-oe2f16{--tw-text-opacity:1;color:rgba(12,62,59,var(--tw-text-opacity));font-size:1rem;font-weight:500;line-height:1.5rem}.main-nav.svelte-oe2f16>li.svelte-oe2f16>a.svelte-oe2f16:hover{--tw-text-opacity:1;color:rgba(15,111,106,var(--tw-text-opacity))}",
  map: `{"version":3,"file":"NavList.svelte","sources":["NavList.svelte"],"sourcesContent":["<script>\\r\\n    import { page } from '$app/stores'\\r\\n    // import { gsap } from 'gsap'\\r\\n    // import { ScrollToPlugin } from '../../../node_modules/gsap/dist/ScrollToPlugin'\\r\\n\\r\\n    export let styles, item_styles = \\"\\", link_styles = \\"\\", isMobile = false\\r\\n\\r\\n    // gsap.registerPlugin(ScrollToPlugin)\\r\\n\\r\\n    // const scrollToAnchor = (node, params) => {\\r\\n\\r\\n    // function goToAnchor(e) {\\r\\n    //     if(e) e.preventDefault()\\r\\n    //         gsap.to(window, { duration: 1, scrollTo: \`#\${params}\`})\\r\\n    //     }\\r\\n\\r\\n    //     node.addEventListener('click', goToAnchor)\\r\\n\\r\\n    //     return {\\r\\n    //         onDestroy() {\\r\\n    //             node.removeEventListener('click', goToAnchor)\\r\\n    //         }\\r\\n    //     }\\r\\n    // }\\r\\n<\/script>\\r\\n\\r\\n<style>.main-nav>li>a{--tw-text-opacity:1;color:rgba(12,62,59,var(--tw-text-opacity));font-size:1rem;font-weight:500;line-height:1.5rem}.main-nav>li>a:hover{--tw-text-opacity:1;color:rgba(15,111,106,var(--tw-text-opacity))}</style>\\r\\n\\r\\n\\r\\n<ul class=\\"{styles}\\">\\r\\n    <li class=\\"list-none {item_styles}\\">\\r\\n        {#if isMobile}<slot name=\\"accueil\\"></slot>{/if}\\r\\n        <a class=\\"{link_styles}\\" sveltekit:prefetch href=\\"/\\">Accueil</a>\\r\\n    </li>\\r\\n    <li class=\\"list-none {item_styles}\\">\\r\\n        {#if $page.path === '/'}\\r\\n        {#if isMobile}<slot name=\\"services\\"></slot>{/if}\\r\\n        <!-- <a use:scrollToAnchor={'services'} class=\\"{link_styles}\\" href=\\"/#services\\">Services</a> -->\\r\\n        <a class=\\"{link_styles}\\" href=\\"/#services\\">Services</a>\\r\\n        {:else}\\r\\n        {#if isMobile}<slot name=\\"services\\"></slot>{/if}\\r\\n        <a class=\\"{link_styles}\\" href=\\"/#services\\">Services</a>\\r\\n        {/if}\\r\\n    </li>\\r\\n    <li class=\\"list-none {item_styles}\\">\\r\\n        {#if $page.path === '/'}\\r\\n        {#if isMobile}<slot name=\\"projets\\"></slot>{/if}\\r\\n        <!-- <a use:scrollToAnchor={'projets'} class=\\"{link_styles}\\" href=\\"/#projets\\">Projets</a> -->\\r\\n        <a class=\\"{link_styles}\\" href=\\"/#projets\\">Projets</a>\\r\\n        {:else}\\r\\n        {#if isMobile}<slot name=\\"projets\\"></slot>{/if}\\r\\n        <a class=\\"{link_styles}\\" href=\\"/#projets\\">Projets</a>\\r\\n        {/if}\\r\\n    </li>\\r\\n    <li class=\\"list-none {item_styles}\\">\\r\\n        {#if isMobile}<slot name=\\"photographies\\" ></slot>{/if}\\r\\n        <a class=\\"{link_styles}\\" sveltekit:prefetch href=\\"/photographies\\">Photographies</a>\\r\\n    </li>\\r\\n</ul>"],"names":[],"mappings":"AA0BO,uBAAS,CAAC,gBAAE,CAAC,eAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,EAAE,CAAC,EAAE,CAAC,EAAE,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,UAAU,IAAI,CAAC,YAAY,GAAG,CAAC,YAAY,MAAM,CAAC,uBAAS,CAAC,gBAAE,CAAC,eAAC,MAAM,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,EAAE,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC"}`
};
var NavList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { styles } = $$props, { item_styles = "" } = $$props, { link_styles = "" } = $$props, { isMobile = false } = $$props;
  if ($$props.styles === void 0 && $$bindings.styles && styles !== void 0)
    $$bindings.styles(styles);
  if ($$props.item_styles === void 0 && $$bindings.item_styles && item_styles !== void 0)
    $$bindings.item_styles(item_styles);
  if ($$props.link_styles === void 0 && $$bindings.link_styles && link_styles !== void 0)
    $$bindings.link_styles(link_styles);
  if ($$props.isMobile === void 0 && $$bindings.isMobile && isMobile !== void 0)
    $$bindings.isMobile(isMobile);
  $$result.css.add(css$6);
  $$unsubscribe_page();
  return `<ul class="${escape2(null_to_empty(styles)) + " svelte-oe2f16"}"><li class="${"list-none " + escape2(item_styles) + " svelte-oe2f16"}">${isMobile ? `${slots.accueil ? slots.accueil({}) : ``}` : ``}
        <a class="${escape2(null_to_empty(link_styles)) + " svelte-oe2f16"}" sveltekit:prefetch href="${"/"}">Accueil</a></li>
    <li class="${"list-none " + escape2(item_styles) + " svelte-oe2f16"}">${$page.path === "/" ? `${isMobile ? `${slots.services ? slots.services({}) : ``}` : ``}
        
        <a class="${escape2(null_to_empty(link_styles)) + " svelte-oe2f16"}" href="${"/#services"}">Services</a>` : `${isMobile ? `${slots.services ? slots.services({}) : ``}` : ``}
        <a class="${escape2(null_to_empty(link_styles)) + " svelte-oe2f16"}" href="${"/#services"}">Services</a>`}</li>
    <li class="${"list-none " + escape2(item_styles) + " svelte-oe2f16"}">${$page.path === "/" ? `${isMobile ? `${slots.projets ? slots.projets({}) : ``}` : ``}
        
        <a class="${escape2(null_to_empty(link_styles)) + " svelte-oe2f16"}" href="${"/#projets"}">Projets</a>` : `${isMobile ? `${slots.projets ? slots.projets({}) : ``}` : ``}
        <a class="${escape2(null_to_empty(link_styles)) + " svelte-oe2f16"}" href="${"/#projets"}">Projets</a>`}</li>
    <li class="${"list-none " + escape2(item_styles) + " svelte-oe2f16"}">${isMobile ? `${slots.photographies ? slots.photographies({}) : ``}` : ``}
        <a class="${escape2(null_to_empty(link_styles)) + " svelte-oe2f16"}" sveltekit:prefetch href="${"/photographies"}">Photographies</a></li></ul>`;
});
var CTALink = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { texte } = $$props, { anchor } = $$props, { link } = $$props, { isLink = false } = $$props, { spacing } = $$props;
  if ($$props.texte === void 0 && $$bindings.texte && texte !== void 0)
    $$bindings.texte(texte);
  if ($$props.anchor === void 0 && $$bindings.anchor && anchor !== void 0)
    $$bindings.anchor(anchor);
  if ($$props.link === void 0 && $$bindings.link && link !== void 0)
    $$bindings.link(link);
  if ($$props.isLink === void 0 && $$bindings.isLink && isLink !== void 0)
    $$bindings.isLink(isLink);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0)
    $$bindings.spacing(spacing);
  return `<a sveltekit:prefetch${add_attribute("href", isLink ? `/${link}` : `/#${anchor}`, 0)} class="${escape2(spacing) + " text-lg font-medium hover:bg-bleu-lighter inline-block bg-bleu-dark px-10 py-2 rounded-lg text-gray-bg transition duration-300"}">${escape2(texte)}</a>`;
});
var Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<header class="${"bg-gray-bg"}"><div class="${"container relative z-20"}"><nav aria-label="${"navigation principale"}" class="${"flex justify-between items-center py-6 md:justify-start md:space-x-10"}"><div class="${"flex justify-start lg:w-0 lg:flex-1"}"><a href="${"/"}"><span class="${"sr-only"}">St\xE9phanie Delon</span>
            <img class="${"h-8 w-auto sm:h-10"}"${add_attribute("src", logoSD, 0)} alt="${"SDelon accueil"}"></a></div>
        ${`<div class="${"-mr-2 -my-2 md:hidden"}"><button type="${"button"}" class="${"bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"}" aria-expanded="${"false"}"><span class="${"sr-only"}">Open menu</span>
            
            <svg class="${"h-6 w-6"}" xmlns="${"http://www.w3.org/2000/svg"}" fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}" aria-hidden="${"true"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" stroke-width="${"2"}" d="${"M4 6h16M4 12h16M4 18h16"}"></path></svg></button></div>`}
        ${validate_component(NavList, "NavList").$$render($$result, {
    styles: "hidden md:flex space-x-10 main-nav"
  }, {}, {})}
        <div class="${"hidden md:flex items-center justify-end md:flex-1 lg:w-0"}">${validate_component(CTALink, "CTALink").$$render($$result, {
    isLink: true,
    link: "contact",
    texte: "contact"
  }, {}, {})}</div></nav></div>
  
    
    ${``}</header>`;
});
var urlFb = "/_app/assets/icon-library.f3b3d867.svg#icon-facebook";
var urlTwitter = "/_app/assets/icon-library.f3b3d867.svg#icon-twitter";
var urlLinkedIn = "/_app/assets/icon-library.f3b3d867.svg#icon-linkedin";
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let year;
  year = new Date().getFullYear();
  return `<footer class="${"bg-gray-bg py-20"}"><div class="${"container px-4 mx-auto text-center"}"><a class="${"inline-block mx-auto text-gray-600 text-2xl leading-none"}" href="${"/"}"><img class="${"h-12"}"${add_attribute("src", logoSD, 0)} alt="${"SDelon accueil"}" width="${"auto"}"></a>
      <nav aria-label="${"navigation pied de page"}">${validate_component(NavList, "NavList").$$render($$result, {
    styles: "my-6 flex flex-wrap gap-4 lg:gap-8 items-center justify-center",
    item_styles: "mb-2 md:mb-0",
    link_styles: "font-medium text-bleu-dark hover:text-bleu-lighter"
  }, {}, {})}</nav>
      <div aria-label="${"liens r\xE9seaux sociaux"}"><a class="${"inline-block mr-2 lg:mr-10"}" href="${"https://www.facebook.com/stephanie.delon"}" aria-label="${"Facebook de St\xE9phanie Delon"}"><svg title="${"lien Facebook pour la page Chrysalide"}" class="${"text-bleu-dark hover:text-bleu-lighter cursor-pointer"}" fill="${"currentColor"}" role="${"img"}" width="${"18"}" height="${"18"}"><use xmlns:xlink="${"http://www.w3.org/1999/xlink"}"${add_attribute("xlink:href", urlFb, 0)}></use></svg></a>
        <a class="${"inline-block mr-2 lg:mr-10"}" href="${"https://twitter.com/delon_stephanie"}" aria-label="${"Twitter de St\xE9phanie Delon"}"><svg title="${"lien Facebook pour la page Chrysalide"}" class="${"text-bleu-dark hover:text-bleu-lighter cursor-pointer"}" fill="${"currentColor"}" role="${"img"}" width="${"18"}" height="${"18"}"><use xmlns:xlink="${"http://www.w3.org/1999/xlink"}"${add_attribute("xlink:href", urlTwitter, 0)}></use></svg></a>
        <a class="${"inline-block"}" href="${"https://www.linkedin.com/in/st%C3%A9phanie-delon-5764371b7"}" aria-label="${"LinkedIn de St\xE9phanie Delon"}"><svg title="${"lien Facebook pour la page Chrysalide"}" class="${"text-bleu-dark hover:text-bleu-lighter cursor-pointer"}" fill="${"currentColor"}" role="${"img"}" width="${"18"}" height="${"18"}"><use xmlns:xlink="${"http://www.w3.org/1999/xlink"}"${add_attribute("xlink:href", urlLinkedIn, 0)}></use></svg></a></div></div>
    <div class="${"container my-8 border-b border-gray-200"}"></div>
    <div class="${"container px-4 mx-auto"}"><p class="${"text-center text-sm text-gray-light"}">\xA9 St\xE9phanie Delon ${escape2(year)} - Tous droits r\xE9serv\xE9s | <a href="${"/mentions-legales"}">Mentions L\xE9gales</a></p></div></footer>`;
});
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<script async src="${"https://cdn.volument.com/v1/volument.js"}" onload="${"volument('74eeb974fd')"}" data-svelte="svelte-rhwipv"><\/script>`, ""}

${validate_component(Nav, "Nav").$$render($$result, {}, {}, {})}
<main class="${"bg-gray-bg min-h-screen"}">${slots.default ? slots.default({}) : ``}</main>
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load$3({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load: load$3
});
var extractMotUnderline = (str, mot) => {
  let newStr = str.split(" ").filter((word) => word !== mot).join(" ");
  return newStr;
};
var SEOHead = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let url;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { title } = $$props, { description } = $$props, { image } = $$props, { alt } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.description === void 0 && $$bindings.description && description !== void 0)
    $$bindings.description(description);
  if ($$props.image === void 0 && $$bindings.image && image !== void 0)
    $$bindings.image(image);
  if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0)
    $$bindings.alt(alt);
  url = `https://${$page.host}${$page.path}`;
  $$unsubscribe_page();
  return `${$$result.head += `${$$result.title = `<title>${escape2(title)}</title>`, ""}<meta name="${"description"}"${add_attribute("content", description, 0)} data-svelte="svelte-cfgn1p"><meta name="${"robots"}" content="${"index,follow"}" data-svelte="svelte-cfgn1p"><link rel="${"canonical"}"${add_attribute("href", url, 0)} data-svelte="svelte-cfgn1p"><meta property="${"og:url"}"${add_attribute("content", url, 0)} data-svelte="svelte-cfgn1p"><meta property="${"og:type"}" content="${"website"}" data-svelte="svelte-cfgn1p"><meta property="${"og:title"}"${add_attribute("content", title, 0)} data-svelte="svelte-cfgn1p"><meta property="${"og:image"}"${add_attribute("content", image, 0)} data-svelte="svelte-cfgn1p"><meta property="${"og:image:alt"}"${add_attribute("content", alt, 0)} data-svelte="svelte-cfgn1p"><meta property="${"og:description"}"${add_attribute("content", description, 0)} data-svelte="svelte-cfgn1p"><meta property="${"og:site_name"}" content="${"D\xE9veloppeuse web et graphiste bas\xE9e dans le Cap Sizun en Finist\xE8re et disponible o\xF9 que vous soyez | St\xE9phanie Delon"}" data-svelte="svelte-cfgn1p"><meta property="${"og:locale"}" content="${"fr_FR"}" data-svelte="svelte-cfgn1p"><meta name="${"twitter:card"}" content="${"summary_large_image"}" data-svelte="svelte-cfgn1p"><meta name="${"twitter:url"}"${add_attribute("content", url, 0)} data-svelte="svelte-cfgn1p"><meta name="${"twitter:title"}"${add_attribute("content", title, 0)} data-svelte="svelte-cfgn1p"><meta name="${"twitter:description"}"${add_attribute("content", description, 0)} data-svelte="svelte-cfgn1p"><meta name="${"twitter:image"}"${add_attribute("content", image, 0)} data-svelte="svelte-cfgn1p"><meta name="${"twitter:image:alt"}"${add_attribute("content", alt, 0)} data-svelte="svelte-cfgn1p">`, ""}`;
});
var Hero = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { accueil } = $$props;
  if ($$props.accueil === void 0 && $$bindings.accueil && accueil !== void 0)
    $$bindings.accueil(accueil);
  return `<div class="${"relative flex flex-wrap items-center justify-center text-center -mx-2"}"><div class="${"absolute -top-20 left-0 z-10 opacity-30"}"><img src="${"assets/vector-hero.svg"}" alt="${""}"></div>
    <div class="${"lg:w-2/3 px-2 lg:pr-10 mt-20 order-1 lg:order-none relative z-20"}"><p class="${"text-gray-light uppercase text-sm tracking-wide pb-3"}">${escape2(import_prismic_dom.default.RichText.asText(accueil.data.sous_titre))}</p>
      <div class="${"relative"}"><h1 class="${"text-3xl sm:text-5xl font-black text-gray-800 max-w-3xl mx-auto"}">${escape2(extractMotUnderline(accueil.data.titre_principal[0].text, accueil.data.mot_underline))} <span class="${"relative"}">${escape2(accueil.data.mot_underline)}
              <div class="${"absolute -bottom-9 sm:-bottom-7 right-3 sm:right-0 -mr-10"}"><svg class="${"svg-shadow"}" width="${"176"}" height="${"78"}" viewBox="${"0 0 176 78"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M4.16866 49.7734C49.6249 56.8271 214.397 64.3995 159.471 26.2365"}" stroke="${"#F9F871"}" stroke-width="${"6"}" stroke-linecap="${"round"}"></path></svg></div></span></h1></div>
      <div class="${"lg:w-2/3 mx-auto mt-8 text-gray-light leading-relaxed"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(accueil.data.description)}<!-- HTML_TAG_END --></div>
      <div>${validate_component(CTALink, "CTALink").$$render($$result, {
    texte: accueil.data.texte_lien_cta,
    isLink: true,
    link: "contact",
    spacing: "my-12"
  }, {}, {})}</div></div></div>`;
});
var Service = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { service } = $$props;
  if ($$props.service === void 0 && $$bindings.service && service !== void 0)
    $$bindings.service(service);
  return `<div><img${add_attribute("src", service.icon.url, 0)}${add_attribute("alt", service.icon.alt, 0)}${add_attribute("width", service.icon.dimensions.width, 0)}${add_attribute("height", service.icon.dimensions.height, 0)}>
    <h3 class="${"text-lg font-black text-gray-800 tracking-wide pb-2"}">${escape2(import_prismic_dom.default.RichText.asText(service.titre_service))}</h3>
    <p class="${"text-gray-700 w-11/12"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(service.description_service)}<!-- HTML_TAG_END --></p></div>`;
});
var Img = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { src: src2 } = $$props, { alt } = $$props, { styles } = $$props, { width } = $$props, { height } = $$props;
  if ($$props.src === void 0 && $$bindings.src && src2 !== void 0)
    $$bindings.src(src2);
  if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0)
    $$bindings.alt(alt);
  if ($$props.styles === void 0 && $$bindings.styles && styles !== void 0)
    $$bindings.styles(styles);
  if ($$props.width === void 0 && $$bindings.width && width !== void 0)
    $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0)
    $$bindings.height(height);
  return `<img${add_attribute("src", placeholder(src2), 0)} loading="${"lazy"}"${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("alt", alt, 0)}${add_attribute("class", styles, 0)}>`;
});
var Modal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { titre_projet } = $$props, { styles } = $$props;
  if ($$props.titre_projet === void 0 && $$bindings.titre_projet && titre_projet !== void 0)
    $$bindings.titre_projet(titre_projet);
  if ($$props.styles === void 0 && $$bindings.styles && styles !== void 0)
    $$bindings.styles(styles);
  return `<section${add_attribute("class", styles, 0)} aria-label="${"description du projet " + escape2(titre_projet)}">${slots.default ? slots.default({}) : ``}</section>`;
});
var Projet = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { slice } = $$props, { isImgRight = false } = $$props;
  if ($$props.slice === void 0 && $$bindings.slice && slice !== void 0)
    $$bindings.slice(slice);
  if ($$props.isImgRight === void 0 && $$bindings.isImgRight && isImgRight !== void 0)
    $$bindings.isImgRight(isImgRight);
  return `${`${validate_component(Modal, "Modal").$$render($$result, {
    styles: "grid grid-cols-1 md:grid-cols-2 shadow-xl",
    titre_projet: import_prismic_dom.default.RichText.asText(slice.titre_projet)
  }, {}, {
    default: () => `<div${add_attribute("class", isImgRight ? "md:order-last" : "order-first", 0)}>${validate_component(Img, "Img").$$render($$result, {
      src: slice.image.url,
      alt: slice.image.alt,
      width: slice.image.dimensions.width,
      height: slice.image.dimensions.height,
      styles: "w-full h-full object-cover"
    }, {}, {})}</div>
    <div class="${"bg-gray-200 p-5 sm:p-20 relative"}"><button class="${"absolute top-5 right-5 rounded-full border-2 border-gray-800 w-16 h-16 uppercase font-light text-sm text-gray-800 tracking-wide hover:bg-opacity-25"}">${`<span>Voir</span>`}</button>
        <div class="${"leading-loose h-full flex justify-center items-center mt-8 sm:mt-0"}"><div><h3 class="${"font-black text-gray-800 sm:text-6xl pb-1"}">${escape2(import_prismic_dom.default.RichText.asText(slice.titre_projet))}</h3>
                <h4 class="${"uppercase font-light text-gray-600 tracking-wide pb-6"}">${escape2(import_prismic_dom.default.RichText.asText(slice.categories_projet))}</h4>
                <div class="${"text-gray-800"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(slice.description_projet)}<!-- HTML_TAG_END --></div>
                <a class="${"relative uppercase font-bold hover:font-black text-gray-600 tracking-widest text-sm inline-block mt-10 mb-8 sm:mb-0"}"${add_attribute("href", slice.lien_projet.url, 0)} target="${"blank"}">D\xE9couvrir le projet en ligne
                    <svg class="${"absolute top-3 right-2 sm:-right-3 drop-shadow-lg"}" width="${"84"}" height="${"29"}" viewBox="${"0 0 84 29"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M3.66653 17.8419C10.2741 20.164 28.0441 24.0206 46.2638 20.8697C69.0385 16.9312 75.1828 12.1579 80.507 8.71565"}" stroke="${"#F9F871"}" stroke-width="${"6"}" stroke-linecap="${"round"}"></path></svg></a></div></div></div>`
  })}`}`;
});
var css$5 = {
  code: `.bg-testimonials.svelte-1chll13{background-color:#ecefef;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cpath fill='%23f7f7f8' d='M600 325.1v-1.17c-6.5 3.83-13.06 7.64-14.68 8.64-10.6 6.56-18.57 12.56-24.68 19.09-5.58 5.95-12.44 10.06-22.42 14.15-1.45.6-2.96 1.2-4.83 1.9l-4.75 1.82c-9.78 3.75-14.8 6.27-18.98 10.1-4.23 3.88-9.65 6.6-16.77 8.84-1.95.6-3.99 1.17-6.47 1.8l-6.14 1.53c-5.29 1.35-8.3 2.37-10.54 3.78-3.08 1.92-6.63 3.26-12.74 5.03a384.1 384.1 0 0 1-4.82 1.36c-2.04.58-3.6 1.04-5.17 1.52a110.03 110.03 0 0 0-11.2 4.05c-2.7 1.15-5.5 3.93-8.78 8.4a157.68 157.68 0 0 0-6.15 9.2c-5.75 9.07-7.58 11.74-10.24 14.51a50.97 50.97 0 0 1-4.6 4.22c-2.33 1.9-10.39 7.54-11.81 8.74a14.68 14.68 0 0 0-3.67 4.15c-1.24 2.3-1.9 4.57-2.78 8.87-2.17 10.61-3.52 14.81-8.2 22.1-4.07 6.33-6.8 9.88-9.83 12.99-.47.48-.95.96-1.5 1.48l-3.75 3.56c-1.67 1.6-3.18 3.12-4.86 4.9a42.44 42.44 0 0 0-9.89 16.94c-2.5 8.13-2.72 15.47-1.76 27.22.47 5.82.51 6.36.51 8.18 0 10.51.12 17.53.63 25.78.24 4.05.56 7.8.97 11.22h.9c-1.13-9.58-1.5-21.83-1.5-37 0-1.86-.04-2.4-.52-8.26-.94-11.63-.72-18.87 1.73-26.85a41.44 41.44 0 0 1 9.65-16.55c1.67-1.76 3.18-3.27 4.83-4.85.63-.6 3.13-2.96 3.75-3.57a71.6 71.6 0 0 0 1.52-1.5c3.09-3.16 5.86-6.76 9.96-13.15 4.77-7.42 6.15-11.71 8.34-22.44.86-4.21 1.5-6.4 2.68-8.6.68-1.25 1.79-2.48 3.43-3.86 1.38-1.15 9.43-6.8 11.8-8.72 1.71-1.4 3.26-2.81 4.7-4.3 2.72-2.85 4.56-5.54 10.36-14.67a156.9 156.9 0 0 1 6.1-9.15c3.2-4.33 5.9-7.01 8.37-8.07 3.5-1.5 7.06-2.77 11.1-4.02a233.84 233.84 0 0 1 7.6-2.2l2.38-.67c6.19-1.79 9.81-3.16 12.98-5.15 2.14-1.33 5.08-2.33 10.27-3.65l6.14-1.53c2.5-.63 4.55-1.2 6.52-1.82 7.24-2.27 12.79-5.06 17.15-9.05 4.05-3.72 9-6.2 18.66-9.9l4.75-1.82c1.87-.72 3.39-1.31 4.85-1.91 10.1-4.15 17.07-8.32 22.76-14.4 6.05-6.45 13.95-12.4 24.49-18.92 1.56-.96 7.82-4.6 14.15-8.33v-64.58c-4 8.15-8.52 14.85-12.7 17.9-2.51 1.82-5.38 4.02-9.04 6.92a1063.87 1063.87 0 0 0-6.23 4.98l-1.27 1.02a2309.25 2309.25 0 0 1-4.87 3.9c-7.55 6-12.9 10.05-17.61 13.19-3.1 2.06-3.86 2.78-8.06 7.13-5.84 6.07-11.72 8.62-29.15 10.95-11.3 1.5-20.04 4.91-30.75 11.07-1.65.94-7.27 4.27-6.97 4.1-2.7 1.58-4.69 2.69-6.64 3.66-5.63 2.8-10.47 4.17-15.71 4.17-17.13 0-41.44 11.51-51.63 22.83-12.05 13.4-31.42 27.7-45.25 31.16-7.4 1.85-11.85 7.05-14.04 14.69-1.26 4.4-1.58 8.28-1.58 13.82 0 .82.01.98.24 3.63.45 5.18.35 8.72-.77 13.26-1.53 6.2-4.89 12.6-10.59 19.43-13.87 16.65-22.88 46.58-22.88 71.68 0 2.39.02 4.26.06 8.75.12 10.8.1 15.8-.22 21.95-.56 11.18-2.09 20.73-5 29.3h-1.05c2.94-8.56 4.49-18.12 5.05-29.35.31-6.13.34-11.1.22-21.9-.04-4.48-.06-6.36-.06-8.75 0-25.32 9.07-55.47 23.12-72.32 5.6-6.72 8.88-12.99 10.38-19.03 1.09-4.4 1.18-7.85.74-12.93-.23-2.7-.24-2.86-.24-3.72 0-5.62.32-9.57 1.62-14.1 2.28-7.95 6.97-13.44 14.76-15.39 13.6-3.4 32.82-17.59 44.75-30.84C409 360.14 433.58 348.5 451 348.5c5.07 0 9.77-1.33 15.26-4.07 1.93-.96 3.9-2.05 6.58-3.62-.3.18 5.33-3.16 6.98-4.11 10.82-6.21 19.66-9.67 31.11-11.2 17.23-2.3 22.9-4.75 28.57-10.64 4.25-4.41 5.04-5.16 8.22-7.28 4.68-3.11 10.01-7.14 17.55-13.14a1113.33 1113.33 0 0 0 4.86-3.89l1.28-1.02a4668.54 4668.54 0 0 1 6.23-4.98c3.67-2.9 6.55-5.12 9.07-6.95 4.37-3.19 9.16-10.56 13.29-19.4v66.9zm0-116.23c-.62.01-1.27.06-1.95.13-6.13.63-13.83 3.45-21.83 7.45-3.64 1.82-8.46 2.67-14.17 2.71-4.7.04-9.72-.47-14.73-1.33-1.7-.3-3.26-.61-4.67-.93a31.55 31.55 0 0 0-3.55-.57 273.4 273.4 0 0 0-16.66-.88c-10.42-.16-17.2.74-17.97 2.73-.38.97.6 2.55 3.03 4.87 1.01.97 2.22 2.03 4.04 3.55a1746.07 1746.07 0 0 0 4.79 4.02c1.39 1.2 3.1 1.92 5.5 2.5.7.16.86.2 2.64.54 3.53.7 5.03 1.25 6.15 2.63 1.41 1.76 1.4 4.54-.15 8.88-2.44 6.83-5.72 10.05-10.19 10.33-3.63.23-7.6-1.29-14.52-5.06-4.53-2.47-6.82-7.3-8.32-15.26-.17-.87-.32-1.78-.5-2.86l-.43-2.76c-1.05-6.58-1.9-9.2-3.73-10.11-.81-.4-1.59-.74-2.36-1-2.27-.77-4.6-1.02-8.1-.92-2.29.07-14.7 1-13.77.93-20.55 1.37-28.8 5.05-37.09 14.99a133.07 133.07 0 0 0-4.25 5.44l-2.3 3.09-2.51 3.32c-4.1 5.36-7.06 8.48-10.39 11.12-.65.52-1.33 1.04-2.13 1.62l-4.11 2.94a106.8 106.8 0 0 0-5.16 3.99c-4.55 3.74-9.74 8.6-16.25 15.38-8.25 8.58-11.78 13.54-11.7 15.95.07 1.65 1.64 2.11 6.79 2.38 1.61.09 2.15.12 2.98.2 2.95.24 5.09.73 6.81 1.68 7.48 4.15 11.63 7.26 13.95 11.58 3.3 6.15.8 12.88-8.89 20.26-8.28 6.3-11.1 10.37-11.31 14.96-.06 1.17 0 1.93.26 4.43.69 6.47.25 10.65-2.8 17.42a44.23 44.23 0 0 1-4.16 7.53c-2.82 3.97-5.47 5.74-10.6 7.69-.43.16-3.34 1.23-4.27 1.59-1.8.68-3.38 1.36-5.01 2.14-4.18 2-8.4 4.6-13.1 8.24-8.44 6.51-13.23 14.56-15.98 25.06-1.1 4.2-1.55 6.81-2.8 15.21-1.26 8.6-2.17 12.64-4.08 16.55-2.1 4.28-11.93 26.59-12.97 28.88a382.7 382.7 0 0 1-6.37 13.41c-4.07 8.11-7.61 14.07-10.73 17.81-5.38 6.46-8.98 14.37-13.77 28.42a810.14 810.14 0 0 0-1.89 5.6c-1.8 5.35-2.96 8.6-4.26 11.85-6.13 15.32-25.43 26.31-46.46 26.31-11.2 0-20.58-2.74-31.02-8.55-5.6-3.13-4.55-2.42-22.26-14.54-14.33-9.8-17.7-10.73-20.47-6.9-.37.5-1.81 2.74-1.83 2.77a52.24 52.24 0 0 1-4.94 5.9c-.73.79-5.52 5.87-6.97 7.45-2.38 2.6-4.3 4.81-5.98 6.93a45.6 45.6 0 0 0-5.08 7.66c-1.29 2.57-1.9 5.25-2.66 10.6a997.6 997.6 0 0 1-.46 3.18h-1l.47-3.32c.77-5.45 1.4-8.2 2.75-10.9a46.54 46.54 0 0 1 5.2-7.84c1.7-2.14 3.63-4.38 6.03-6.98 1.45-1.59 6.24-6.68 6.96-7.46a51.58 51.58 0 0 0 4.84-5.78s1.47-2.26 1.86-2.8c3.25-4.5 7.08-3.44 21.84 6.67 17.67 12.08 16.62 11.38 22.19 14.48 10.3 5.73 19.5 8.43 30.53 8.43 20.65 0 39.57-10.77 45.54-25.69a219.7 219.7 0 0 0 4.24-11.8 6752.32 6752.32 0 0 0 1.88-5.6c4.83-14.16 8.47-22.14 13.96-28.73 3.05-3.66 6.56-9.57 10.6-17.61 1.97-3.93 4.04-8.31 6.35-13.38 1.03-2.28 10.88-24.61 12.98-28.91 1.85-3.79 2.75-7.76 4-16.25 1.24-8.44 1.7-11.07 2.81-15.32 2.8-10.7 7.71-18.94 16.33-25.6a73.18 73.18 0 0 1 13.29-8.35c1.66-.8 3.27-1.48 5.08-2.18.94-.36 3.86-1.43 4.28-1.59 4.95-1.88 7.44-3.55 10.14-7.33 1.35-1.9 2.68-4.3 4.06-7.37 2.97-6.58 3.39-10.59 2.72-16.9a27.13 27.13 0 0 1-.27-4.58c.22-4.94 3.21-9.24 11.7-15.7 9.33-7.11 11.66-13.34 8.62-19-2.2-4.09-6.25-7.12-13.55-11.17-1.57-.88-3.6-1.33-6.42-1.57-.8-.07-1.34-.1-2.95-.19-5.77-.3-7.63-.85-7.72-3.34-.1-2.81 3.5-7.87 11.97-16.69 6.53-6.8 11.75-11.69 16.33-15.45 1.79-1.47 3.42-2.72 5.2-4.03l4.12-2.94c.79-.58 1.46-1.08 2.1-1.59 3.26-2.6 6.16-5.65 10.21-10.94a383.2 383.2 0 0 0 2.5-3.32l2.31-3.09c1.8-2.39 3.04-4 4.29-5.48 8.47-10.17 16.98-13.96 37.27-15.3-.44.02 12-.9 14.32-.98 3.62-.1 6.05.16 8.46.98.8.27 1.62.62 2.47 1.04 2.27 1.14 3.17 3.87 4.27 10.85l.44 2.76c.17 1.07.33 1.97.5 2.83 1.44 7.69 3.62 12.29 7.8 14.57 6.76 3.68 10.6 5.15 13.99 4.94 4-.25 6.99-3.17 9.3-9.67 1.45-4.04 1.46-6.49.32-7.92-.9-1.12-2.28-1.62-5.57-2.27a55.8 55.8 0 0 1-2.67-.55c-2.54-.6-4.39-1.4-5.93-2.71a252.63 252.63 0 0 0-4.78-4.01 84.35 84.35 0 0 1-4.08-3.6c-2.73-2.6-3.86-4.43-3.28-5.95 1.02-2.64 7.82-3.54 18.93-3.37a230.56 230.56 0 0 1 16.73.88c2.76.39 3.2.49 3.68.6 1.4.3 2.95.62 4.62.91a82.9 82.9 0 0 0 14.56 1.32c5.56-.04 10.24-.86 13.73-2.6 8.1-4.05 15.89-6.9 22.17-7.56.7-.07 1.4-.11 2.05-.13v1zm0-100.94v1.5c-8.62 16.05-17.27 29.55-23.65 35.92-3.19 3.2-7.62 4.9-13.54 5.56-4.45.48-8.28.4-19.18-.2-9.91-.55-15.32-.44-20.52.78a84.05 84.05 0 0 1-15 2.11l-2.25.14c-12.49.75-19.37 1.78-32.72 5.74-4.5 1.33-9.27 2.49-14.3 3.48a246.27 246.27 0 0 1-32.6 3.97c-7.56.45-13.21.57-20.24.57-5.4 0-11.9 1.61-18 5.18-8.3 4.87-15.06 12.87-19.53 24.5a68.57 68.57 0 0 1-4.56 9.8c-3.6 6.2-6.92 8.99-13.38 12.18l-4.03 1.96a64.48 64.48 0 0 0-15.16 10.25c-8.2 7.33-13.72 16.63-22.54 35.6l-2.08 4.49c-7.3 15.7-11.5 23.3-17.35 29.87-7.7 8.66-20.25 14.42-40.31 20.08-4.37 1.23-19.04 5.08-19.24 5.13-6.92 1.87-11.68 3.34-15.63 4.92-10.55 4.22-18.71 10.52-36.38 26.52l-1.7 1.54c-8.58 7.76-13.41 11.9-18.81 15.88-3.95 2.9-8 5.67-12.97 8.91-2.06 1.34-10.3 6.6-12.33 7.94-11.52 7.5-18.53 13.04-24.62 20.08a62.01 62.01 0 0 0-6.44 8.85c-4.13 6.91-6.27 13.15-9.2 25.11l-1.54 6.26c-.6 2.45-1.15 4.54-1.72 6.58-2.97 10.7-6.9 17.36-14.78 26.91L69.6 491a148.51 148.51 0 0 0-4.19 5.3 23.9 23.9 0 0 0-3.44 6.28c-1.16 3.23-1.52 5.9-1.87 11.94-.58 10.05-1.42 15.04-4.63 22.67-1.57 3.72-5.66 14.02-6.41 15.8a73.46 73.46 0 0 1-3.57 7.4c-2.88 5.14-6.71 10.12-13.12 16.95-5.96 6.36-8.87 10.9-10.61 16a56.88 56.88 0 0 0-1.38 4.82l-.46 1.84h-1.03l.52-2.08c.52-2.09.92-3.49 1.4-4.9 1.8-5.25 4.78-9.9 10.84-16.36 6.35-6.78 10.13-11.7 12.97-16.77a72.5 72.5 0 0 0 3.52-7.29c.75-1.76 4.84-12.06 6.4-15.8 3.17-7.5 3.99-12.4 4.56-22.33.35-6.14.72-8.88 1.93-12.23a24.9 24.9 0 0 1 3.58-6.54c1.27-1.7 2.6-3.37 4.22-5.34l4.11-4.95c7.8-9.46 11.66-16 14.59-26.54.56-2.04 1.1-4.12 1.71-6.56l1.53-6.26c2.96-12.04 5.13-18.36 9.32-25.39 1.84-3.08 4-6.05 6.54-8.99 6.17-7.12 13.24-12.7 24.83-20.26 2.05-1.33 10.28-6.6 12.33-7.94 4.96-3.22 9-5.98 12.92-8.87 5.37-3.95 10.19-8.08 18.74-15.82l1.7-1.54c17.76-16.09 25.98-22.43 36.67-26.7 4-1.6 8.8-3.09 15.75-4.96.21-.06 14.87-3.9 19.22-5.13 19.9-5.61 32.32-11.31 39.85-19.78 5.76-6.48 9.93-14.02 17.18-29.64l2.09-4.5c8.87-19.07 14.44-28.46 22.77-35.9a65.48 65.48 0 0 1 15.38-10.4l4.04-1.97c6.3-3.1 9.47-5.77 12.96-11.77a67.6 67.6 0 0 0 4.48-9.67c4.56-11.84 11.47-20.02 19.97-25 6.25-3.66 12.93-5.32 18.5-5.32 7.01 0 12.65-.12 20.17-.57a245.3 245.3 0 0 0 32.47-3.96c5-.98 9.75-2.13 14.22-3.45 13.43-3.98 20.38-5.02 32.94-5.78l2.24-.14c5.76-.37 9.8-.9 14.85-2.09 5.31-1.25 10.79-1.35 22.6-.7 9.04.5 12.84.58 17.21.1 5.71-.62 9.94-2.26 12.95-5.26 6.44-6.45 15.3-20.37 24.35-36.72zm0 450.21c-1.28-4.6-2.2-10.55-3.33-20.25l-.24-2.04-.23-2.03c-1.82-15.7-3.07-21.98-5.55-24.47-2.46-2.46-3.04-5.03-2.52-8.64.1-.6.18-1.1.39-2.15.69-3.54.77-5.04.08-6.84-.91-2.38-3.31-4.41-7.79-6.26-5.08-2.09-6.52-4.84-4.89-8.44.66-1.45 1.79-3.02 3.52-5.01 1.04-1.2 5.48-5.96 5.08-5.53 6.15-6.7 8.98-11.34 8.98-16.48a15.2 15.2 0 0 1 6.5-12.89v1.26a14.17 14.17 0 0 0-5.5 11.63c0 5.47-2.93 10.29-9.24 17.16.38-.42-4.04 4.33-5.07 5.5-1.67 1.93-2.75 3.43-3.36 4.77-1.37 3.04-.23 5.22 4.36 7.1 4.71 1.95 7.32 4.16 8.34 6.83.78 2.04.7 3.67-.03 7.4-.2 1.03-.3 1.51-.38 2.09-.48 3.33.03 5.59 2.23 7.8 2.74 2.74 3.98 8.96 5.84 25.06l.24 2.03.23 2.04c.82 7.01 1.53 12.06 2.34 16.03v4.33zm0-62.16c-1.4-3.13-4.43-9.9-4.95-11.17-1.02-2.53-1.25-3.8-.91-5.18.2-.84 2.05-4.68 2.32-5.33a70.79 70.79 0 0 0 3.54-11.2v3.99a62.82 62.82 0 0 1-2.62 7.6c-.31.75-2.09 4.46-2.27 5.18-.28 1.12-.08 2.22.87 4.57.41 1.02 2.5 5.7 4.02 9.09v2.45zm0-85.09c-1.65 1.66-3.66 2.9-6.4 4.13-.25.1-13.97 5.47-20.4 8.43-9.35 4.32-16.7 5.9-23.03 5.25-5.08-.53-9.02-2.25-14.77-5.92l-3.2-2.07a77.4 77.4 0 0 0-5.44-3.27c-4.05-2.18-3.25-5.8 1.47-10.47 3.71-3.68 9.6-7.93 18.73-13.8l4.46-2.82c17.95-11.33 18.22-11.5 22.27-14.74 11.25-9 19.69-14.02 26.31-15.1v1.02c-6.37 1.1-14.62 6-25.69 14.86-4.1 3.28-4.34 3.44-22.36 14.8a652.4 652.4 0 0 0-4.45 2.83c-9.07 5.83-14.92 10.05-18.57 13.66-4.31 4.28-4.95 7.13-1.7 8.88 1.7.91 3.29 1.88 5.5 3.3l3.2 2.08c5.64 3.59 9.45 5.25 14.34 5.76 6.13.64 13.32-.9 22.52-5.15 6.46-2.98 20.18-8.35 20.4-8.44 3.04-1.37 5.1-2.71 6.81-4.69v1.47zm0-41.37v1c-6.56.26-12.11 3.13-19.71 9.08l-4.63 3.68a51.87 51.87 0 0 1-4.4 3.14c-.82.52-5.51 3.33-6.22 3.76-3.31 2-6.15 3.8-8.87 5.6a112.61 112.61 0 0 0-8.16 5.92c-4.61 3.72-7.4 6.9-7.97 9.35-.63 2.67 1.48 4.53 7.05 5.46 10.7 1.78 20.92-.05 30.45-4.65a61.96 61.96 0 0 0 17.1-12.2 41.8 41.8 0 0 0 5.36-7.42v1.92a38.94 38.94 0 0 1-4.64 6.19 62.95 62.95 0 0 1-17.39 12.41c-9.7 4.68-20.13 6.55-31.05 4.73-6.06-1-8.65-3.29-7.85-6.67.64-2.74 3.53-6.05 8.31-9.9 2.35-1.9 5.1-3.88 8.24-5.97 2.73-1.82 5.58-3.61 8.9-5.62.72-.44 5.4-3.24 6.22-3.75 1.26-.8 2.6-1.76 4.3-3.09.8-.62 3.9-3.1 4.63-3.67 7.77-6.1 13.49-9.04 20.33-9.3zm0-154.6v1c-1.75-.24-4.3.23-7.82 1.55-10.01 3.75-13.8 5.07-19.15 6.76-1.78.56-2.63.83-3.87 1.24-1.48.5-3.16.76-6.74 1.16a1550.34 1550.34 0 0 0-2.64.3c-7.8.94-11.28 2.47-11.28 6.07 0 4.45 2.89 13.18 7.96 25.81a57.34 57.34 0 0 1 2.33 7.6 258.32 258.32 0 0 1 .84 3.46c1.86 7.62 3.17 10.71 5.56 11.67 2.21.88 4.7.6 7.47-.72 3.48-1.69 7.22-4.94 11.2-9.47 1.52-1.7 2.97-3.49 4.59-5.57l3.16-4.1c2.59-3.23 6.07-12.21 8.39-20.23v3.45c-2.29 7.2-5.27 14.5-7.61 17.41-.44.55-2.67 3.46-3.15 4.09-1.63 2.1-3.1 3.9-4.62 5.62-4.08 4.61-7.9 7.94-11.53 9.7-2.99 1.44-5.77 1.75-8.28.74-2.84-1.13-4.2-4.34-6.15-12.35a2097.48 2097.48 0 0 1-.84-3.46c-.8-3.2-1.47-5.45-2.28-7.46-5.14-12.8-8.04-21.55-8.04-26.19 0-4.37 3.84-6.06 12.16-7.07a160.9 160.9 0 0 1 2.65-.3c3.5-.39 5.15-.64 6.53-1.1 1.26-.42 2.1-.7 3.88-1.26 5.34-1.68 9.11-3 19.1-6.74 3.53-1.32 6.22-1.84 8.18-1.61zM0 292c10.13-11.31 18.13-23.2 23.07-35.39 3.3-8.14 6.09-16.12 10.81-30.55l1.59-4.84c6.53-19.94 10.11-29.82 14.77-39.56 6.07-12.72 12.55-21.18 20.27-25.54 6.66-3.76 10.2-7.86 12.22-13.15a46.6 46.6 0 0 0 1.86-6.58c1.23-5.2 2.05-7.59 3.93-10.36 2.45-3.62 6.27-6.53 12.1-8.96 15.78-6.58 16.73-7.04 18.05-9.01.65-.98.83-2.15.74-4.51-.03-.73-.23-3.82-.24-4A93.8 93.8 0 0 1 119 94c0-10.04.18-11.37 2.37-13.15.52-.42 1.13-.8 2.07-1.3.27-.14 2.18-1.12 2.84-1.48a68.4 68.4 0 0 0 9.12-5.87c2.06-1.54 2.64-2.14 8.01-7.93 3.78-4.09 6.21-6.36 8.96-8.12 3.64-2.33 7.2-3.12 10.9-2.11 4.4 1.2 10.81 2 18.78 2.46 6.9.4 12.9.5 21.95.5 4.87 0 8.97.47 15.4 1.57 7.77 1.33 9.3 1.54 12.38 1.54 4.05 0 7.43-.88 10.68-2.95 5.06-3.22 8.11-4.67 11.2-5.2 3.62-.64 4.77-.46 16.55 2.06 17.26 3.7 30.85 1.36 41.06-9.7 5.1-5.53 5.48-8.9 3.48-14.8-.83-2.42-1.03-3.1-1.17-4.3-.29-2.52.5-4.71 2.71-6.93 2.65-2.65 4.72-9.17 6.22-18.29h2.03c-1.56 9.71-3.77 16.65-6.83 19.7-1.79 1.8-2.36 3.39-2.14 5.28.11 1 .3 1.63 1.07 3.9 2.22 6.53 1.76 10.66-3.9 16.8-10.77 11.66-25.07 14.13-42.95 10.3-11.42-2.45-12.55-2.62-15.78-2.06-2.77.48-5.62 1.84-10.47 4.92a20.93 20.93 0 0 1-11.76 3.27c-3.25 0-4.81-.22-12.73-1.57C212.74 59.46 208.73 59 204 59c-9.1 0-15.11-.1-22.07-.5-8.09-.47-14.62-1.29-19.2-2.54-5.62-1.53-10.17 1.38-17.85 9.66-5.5 5.94-6.08 6.53-8.28 8.18a70.38 70.38 0 0 1-9.38 6.03c-.68.37-2.58 1.35-2.84 1.49-.84.44-1.35.76-1.75 1.08-1.47 1.2-1.63 2.4-1.63 11.6 0 1.85.06 3.54.17 5.44 0 .17.2 3.28.24 4.03.1 2.75-.13 4.29-1.08 5.71-1.67 2.5-2.27 2.8-18.95 9.74-5.48 2.29-8.99 4.96-11.2 8.24-1.71 2.51-2.47 4.73-3.64 9.7-.83 3.5-1.21 4.92-1.94 6.83-2.18 5.73-6.05 10.19-13.1 14.18-7.3 4.12-13.55 12.28-19.46 24.66-4.6 9.64-8.17 19.46-14.67 39.32l-1.58 4.84c-4.75 14.47-7.54 22.48-10.86 30.69-5.28 13.01-13.95 25.65-24.93 37.6v-2.97zm0 78v-.5l1-.01c6.32 0 7.47 5.2 4.6 13.36a60.36 60.36 0 0 1-5.6 11.3v-1.92a57.76 57.76 0 0 0 4.65-9.72c2.69-7.6 1.71-12.02-3.65-12.02-.34 0-.67 0-1 .02v-46.59a340.96 340.96 0 0 0 13.71-8.34c13.66-9.46 29.79-37.6 29.79-53.59 0-18.1 21.57-72.64 32.23-79.42 12.71-8.09 32.24-27.96 35.8-37.75 1.93-5.3 5.5-7.27 14.42-9.37 6.15-1.44 8.64-2.42 10.67-4.79 1.5-1.74 2.72-4.79 4.33-10.3.23-.78 1.9-6.68 2.43-8.46 3.62-12.08 7.3-18.49 13.47-20.39 2.5-.76 3.03-.98 9.74-3.7 7.49-3.03 11.97-4.43 17.12-4.92 6.75-.65 13.13.75 19.55 4.67 5.43 3.32 12.19 4.72 20.17 4.56 6.03-.12 12.2-1.07 19.83-2.8 1.82-.4 7.38-1.74 8.26-1.94 2.69-.6 4.34-.89 5.48-.89 4.97 0 8.93-.05 14.2-.27 7.9-.32 15.56-.92 22.75-1.88 8.5-1.14 15.9-2.73 21.88-4.82 18.9-6.62 32.64-18.3 33.67-27.59.29-2.56.4-2.96 2.79-11.11 2.33-7.95 3.21-12.93 2.72-18.23-.2-2.24-.69-4.38-1.48-6.42-1.5-3.92-2.63-9.4-3.43-16.18h.9c.77 6.47 1.89 11.72 3.47 15.82a24.93 24.93 0 0 1 1.54 6.69c.5 5.46-.4 10.54-2.77 18.6-2.36 8.06-2.47 8.47-2.74 10.95-1.09 9.75-15.1 21.68-34.33 28.41-6.06 2.12-13.52 3.72-22.09 4.87-7.22.96-14.92 1.57-22.83 1.89-5.3.21-9.27.27-14.25.27-1.04 0-2.64.27-5.26.87-.87.2-6.43 1.53-8.26 1.94-7.68 1.73-13.92 2.7-20.03 2.82-8.15.17-15.1-1.27-20.71-4.7-6.23-3.81-12.4-5.16-18.93-4.54-5.04.48-9.44 1.86-16.84 4.86-6.75 2.74-7.29 2.95-9.82 3.73-5.73 1.76-9.28 7.96-12.81 19.72-.53 1.77-2.2 7.66-2.43 8.46-1.66 5.65-2.91 8.78-4.53 10.67-2.22 2.58-4.84 3.62-12.01 5.3-7.8 1.83-11.13 3.66-12.9 8.54-3.65 10.04-23.32 30.06-36.2 38.25C65.94 190 44.5 244.2 44.5 262c0 16.34-16.3 44.78-30.22 54.41-2.14 1.48-8.24 5.12-14.28 8.68v-1.16 46.09zm0-173.7v-1.11c7.42-3.82 14.55-10.23 21.84-18.98 3.8-4.56 14.21-18.78 15.79-20.55 1.8-2.04 4.06-3.96 7.42-6.45 1.08-.8 4.92-3.57 5.49-3.99 9.36-6.85 14-11.96 15.98-19.36.8-2.98 1.54-6.78 2.46-12.3.23-1.44 2-12.46 2.56-15.79 2.87-16.77 5.73-26.79 10.07-32.1C92.46 52.43 101.5 38.13 101.5 33c0-2.54.34-3.35 6.05-15.71.68-1.49 1.25-2.74 1.77-3.93 2.5-5.75 3.9-10.04 4.14-13.36h1c-.23 3.48-1.66 7.87-4.23 13.76-.52 1.2-1.09 2.45-1.78 3.95-5.54 12.01-5.95 12.99-5.95 15.29 0 5.47-9.09 19.84-20.11 33.31-4.2 5.12-7.03 15.06-9.86 31.64-.57 3.33-2.33 14.33-2.57 15.78-.92 5.56-1.67 9.38-2.48 12.4-2.05 7.68-6.82 12.93-16.35 19.91l-5.49 3.98c-3.3 2.45-5.51 4.34-7.27 6.31-1.53 1.73-11.94 15.93-15.76 20.53-7.52 9.02-14.88 15.6-22.61 19.46zm0 361.83v-4.33c.48 2.36 1 4.35 1.6 6.15 2 6.03 4.6 8.26 8.19 6.59C28.76 557.69 43.5 542.4 43.5 527c0-16.2 6.37-31.99 17.1-46.3 1.88-2.5 3.66-4.4 5.53-6 .73-.62 1.45-1.18 2.3-1.8l2-1.43c3.68-2.68 5.32-5.28 7.08-12.59.75-3.07 1.38-5.02 4.2-13.26l.63-1.88c3.24-9.58 4.56-14.97 4.17-18.65-.48-4.43-3.8-5.23-11.3-1.64a81.12 81.12 0 0 1-9.15 3.7c-13.89 4.67-26.96 5.8-42.66 5.42l-1.95-.05-1.45-.02a39.8 39.8 0 0 0-15.05 2.96A21.81 21.81 0 0 0 0 438.37v-1.26a23.55 23.55 0 0 1 4.55-2.57 40.77 40.77 0 0 1 16.92-3.02l1.95.05c15.6.38 28.57-.75 42.32-5.37a80.12 80.12 0 0 0 9.04-3.65c8.04-3.84 12.16-2.85 12.72 2.43.42 3.89-.92 9.34-4.21 19.08l-.64 1.88c-2.8 8.2-3.43 10.15-4.16 13.18-1.82 7.52-3.59 10.34-7.47 13.16l-2 1.43c-.84.6-1.54 1.15-2.25 1.75a35.45 35.45 0 0 0-5.37 5.84c-10.61 14.15-16.9 29.74-16.9 45.7 0 15.88-15 31.45-34.29 40.45-4.3 2.01-7.39-.66-9.56-7.18-.23-.68-.44-1.39-.65-2.13zm0-62.16v-2.45l1.46 3.27c2.1 4.8 3.46 10.33 4.26 16.77.66 5.3.84 9.3 1.04 18.5.2 9.32.5 12.75 1.63 15.05 1.28 2.6 3.67 2.35 8.29-1.5 17.14-14.3 21.82-22.9 21.82-38.62 0-7.17 1.1-12.39 3.7-17.68 2.27-4.67 3.65-6.62 13.4-19.62a69.8 69.8 0 0 1 7.6-8.79 44.76 44.76 0 0 1 3.54-3.06c.38-.3.64-.52.89-.74a10.47 10.47 0 0 0 2.63-3.32 35.78 35.78 0 0 0 2.26-5.94l.37-1.2.36-1.15c.29-.91.48-1.55.66-2.16.45-1.53.74-2.68.91-3.66.38-2.2.12-3.49-.85-4.15-2.35-1.61-9.28-.24-23.8 4.94-9.54 3.4-16.12 4.17-27.85 4.26-7.71.06-10.43.4-13.25 2.12-3.48 2.12-5.84 6.4-7.58 14.26-.5 2.2-.99 4.19-1.49 5.98v-3.98l.51-2.22c1.8-8.1 4.28-12.6 8.04-14.9 3.04-1.85 5.86-2.2 13.77-2.26 11.61-.09 18.1-.84 27.51-4.2 14.93-5.32 21.95-6.71 24.7-4.83 1.38.94 1.71 2.6 1.28 5.15a33.69 33.69 0 0 1-.94 3.78l-.66 2.17-.36 1.15-.37 1.2a36.64 36.64 0 0 1-2.33 6.1c-.8 1.53-1.61 2.52-2.86 3.61l-.92.77-1.02.83c-.9.74-1.65 1.4-2.47 2.18a68.84 68.84 0 0 0-7.48 8.66c-9.7 12.93-11.07 14.87-13.31 19.46-2.52 5.15-3.59 10.22-3.59 17.24 0 16.04-4.82 24.91-22.18 39.38-5.04 4.2-8.18 4.55-9.83 1.18-1.22-2.5-1.52-5.94-1.73-15.47-.2-9.16-.38-13.15-1.03-18.4-.79-6.34-2.12-11.8-4.19-16.49L0 495.98zM379.27 0h1.04l1.5 5.26c3.28 11.56 4.89 19.33 5.26 27.8.49 11.01-1.52 21.26-6.63 31.17-7.8 15.13-20.47 26.5-36.22 34.1-12.38 5.96-26.12 9.17-36.22 9.17-6.84 0-17.24 1.38-37.27 4.62l-2.27.37c-24.5 3.99-31.65 5-37.46 5-3.49 0-4.08-.08-19.54-2.8-3.56-.64-6.32-1.1-9-1.5-20.23-2.96-31-1.2-31.96 7.86-.1.85-.18 1.72-.29 2.81l-.27 2.73c-1.1 10.9-2.02 15.73-4.31 19.96-2.9 5.34-7.77 7.95-15.63 7.95-10.2 0-12.92.6-15.5 3.17.52-.51-5.03 5.85-8.16 8.7-2.75 2.5-14.32 12.55-15.77 13.83a341.27 341.27 0 0 0-6.54 5.92c-6.97 6.49-11.81 11.76-14.6 16.15-5.92 9.3-10.48 18.04-11.69 24.08-1.66 8.3 3.67 9.54 19.02 1.21a626.23 626.23 0 0 1 44.54-21.9c3.5-1.56 14.04-6.2 15.68-6.95 5.05-2.25 8.3-3.8 10.78-5.15l1.95-1.07 2.18-1.18c1.76-.94 3.38-1.76 5-2.55 18.1-8.72 34.48-10.46 50.33-1.2 22.89 13.34 38.28 37.02 38.28 56.44 0 19.12-.73 25.13-5.18 33.2a45.32 45.32 0 0 1-4.94 7.12c-6.47 7.77-11.81 16.2-12.76 21.27-1.2 6.34 4.69 7.03 20.17-.05 13.31-6.08 22.4-14.95 28.5-26.32a80.51 80.51 0 0 0 6.1-15.13c.9-2.98 3.17-11.65 3.41-12.48a29.02 29.02 0 0 1 1.75-4.83c7.47-14.93 21.09-30.5 36.25-37.24 7.61-3.38 13-9.65 19.4-20.79.84-1.48 4.26-7.64 5.14-9.17 3.52-6.1 6.22-9.7 9.37-11.98 10.15-7.4 28.7-11.1 50.29-11.1 7.52 0 16.54-1.24 27.51-3.58a420.1 420.1 0 0 0 14.96-3.52c-1.3.33 15.54-3.98 19.42-4.89 14.15-3.33 41.07-5.01 64.11-5.01 17.36 0 27.82-9.23 38.53-38.67 6.62-18.21 6.62-26.37 2.69-34.35l-1.18-2.37A13.36 13.36 0 0 1 587.5 58c0-4.03 0-4.01 2.5-24.56.46-3.73.8-6.74 1.12-9.64.9-8.45 1.38-15.2 1.38-20.8 0-.94-.02-1.94-.04-3h1c.03 1.06.04 2.06.04 3 0 5.65-.48 12.43-1.39 20.9-.3 2.91-.66 5.93-1.11 9.66-2.5 20.45-2.5 20.47-2.5 24.44 0 1.97.45 3.57 1.45 5.68.24.51 1.16 2.35 1.17 2.36 4.06 8.24 4.06 16.68-2.65 35.13-10.84 29.8-21.63 39.33-39.47 39.33-22.96 0-49.83 1.68-63.89 4.99-3.86.9-20.69 5.2-19.4 4.88a421.05 421.05 0 0 1-14.99 3.53c-11.04 2.35-20.11 3.6-27.72 3.6-21.4 0-39.76 3.67-49.7 10.9-3 2.19-5.64 5.7-9.1 11.68-.87 1.52-4.29 7.68-5.14 9.17-6.49 11.3-12 17.71-19.86 21.2-14.9 6.63-28.38 22.03-35.75 36.77a28.17 28.17 0 0 0-1.69 4.67c-.23.8-2.5 9.49-3.4 12.5a81.48 81.48 0 0 1-6.19 15.3c-6.2 11.56-15.44 20.58-28.96 26.76-16.1 7.36-23 6.55-21.58-1.04 1-5.29 6.4-13.83 12.99-21.73a44.33 44.33 0 0 0 4.82-6.96c4.35-7.88 5.06-13.77 5.06-32.72 0-19.04-15.19-42.4-37.72-55.55-15.57-9.08-31.62-7.38-49.45 1.21a132.9 132.9 0 0 0-7.14 3.71l-1.95 1.07a158.83 158.83 0 0 1-10.85 5.19c-1.65.74-12.18 5.38-15.69 6.95a625.25 625.25 0 0 0-44.46 21.86c-15.95 8.66-22.37 7.16-20.48-2.29 1.24-6.2 5.83-15.02 11.82-24.42 2.85-4.48 7.74-9.8 14.77-16.34 1.98-1.85 4.12-3.79 6.56-5.94 1.46-1.29 13.02-11.33 15.75-13.82 3.09-2.8 8.6-9.14 8.14-8.67 2.82-2.82 5.75-3.46 16.2-3.46 7.5 0 12.04-2.43 14.75-7.42 2.2-4.07 3.11-8.84 4.2-19.59l.26-2.73.3-2.81c.56-5.42 4.47-8.5 11.23-9.6 5.44-.88 12.51-.51 21.86.86 2.7.4 5.47.86 9.04 1.49 15.33 2.7 15.96 2.8 19.36 2.8 5.73 0 12.9-1.03 37.3-5l2.27-.36c20.1-3.26 30.52-4.64 37.43-4.64 9.95 0 23.54-3.18 35.78-9.08 15.57-7.5 28.09-18.73 35.78-33.65 5.02-9.75 7-19.82 6.51-30.67-.37-8.37-1.96-16.08-5.23-27.57L379.27 0zm13.68 0h1.02c.78 3.9 1.92 8.7 3.51 14.88 3.63 14.05 3.06 27.03-.75 38.77a61 61 0 0 1-11.35 20.68 138.36 138.36 0 0 1-19.32 18.77c-11.32 9.02-23.36 15.49-35.95 18.39a258.63 258.63 0 0 1-22.57 4.07c-3.17.44-6.36.85-10.3 1.32l-9.39 1.12c-11.53 1.41-17.45 2.55-21.64 4.46-9.28 4.21-28.35 6.04-49.21 6.04-1.37 0-2.8-.12-4.3-.35-2.62-.41-5-1.03-9.14-2.29-7.34-2.21-9.63-2.75-12.63-2.56-3.9.23-6.63 2.29-8.47 6.89-1.86 4.66-2.42 7.53-3.34 14.98-1.1 8.98-2.87 12.12-9.97 14.3a40.12 40.12 0 0 0-6.8 2.66c-.63.33-1.16.64-1.76 1.02l-1.34.86c-1.9 1.14-3.86 1.49-9.25 1.49-3.2 0-8.83-.55-9.51-.39-1.22.28-.75-.14-7.14 6.24-1.5 1.5-3.49 3.18-6.32 5.37-1.52 1.18-7.16 5.43-7.94 6.03-4.96 3.78-8.33 6.6-11.06 9.38-4.88 4.98-6.85 9.15-5.56 12.7 1.34 3.67 4.07 4.42 8.9 2.82a55.72 55.72 0 0 0 7.77-3.48c1.5-.77 7.78-4.13 9.37-4.96a116.8 116.8 0 0 1 12.31-5.68 162.2 162.2 0 0 0 11.04-4.84c2.04-.97 10.74-5.16 13-6.22 4.41-2.1 8.1-3.78 11.65-5.29 17.14-7.3 29.32-9.9 37.67-6.65l5.43 2.1c2.3.88 4.17 1.62 6.02 2.38a150.9 150.9 0 0 1 13.07 6c18.34 9.63 30.35 22.13 34.79 39.87 6.96 27.85 3.6 45.53-8.08 62.4-3.97 5.75-3.52 9.2.06 8.97 4.14-.28 10.21-4.95 15.11-12.52 3.1-4.8 5.1-10.45 8.05-21.53l1.69-6.35c.66-2.47 1.24-4.52 1.83-6.5 4.93-16.56 11-27.28 21.56-34.76 7.15-5.06 23.73-15.5 25.48-16.75 6.74-4.81 10.53-9.44 14.34-18 7.74-17.44 21.09-24.34 44.47-24.34 9.36 0 17.91-1.13 29.53-3.49a624.86 624.86 0 0 0 6.2-1.28c2.4-.5 4.07-.84 5.66-1.13 4.03-.74 7.04-1.1 9.61-1.1 4.44 0 9.39-1 31.39-5.99l2.95-.66c16.34-3.67 25.64-5.35 31.66-5.35 1.54 0 2.4.01 6.4.1 7.8.15 12.27.13 17.33-.2 16.41-1.06 26.73-5.36 29.8-14.56a87.1 87.1 0 0 1 3.55-8.83c-.15.31 2.29-4.96 2.9-6.38 5.38-12.3 5.57-21.92-1.44-39.44a86.4 86.4 0 0 1-5.26-20.72c-1.61-11.98-1.38-23.14.1-40.35l.2-2.12h1l-.2 2.2c-1.48 17.15-1.7 28.24-.11 40.14a85.4 85.4 0 0 0 5.2 20.47c7.1 17.78 6.91 27.67 1.43 40.22-.62 1.43-3.06 6.72-2.91 6.4a86.17 86.17 0 0 0-3.52 8.73c-3.23 9.72-13.9 14.15-30.68 15.24-5.1.33-9.58.35-17.42.2-3.98-.09-4.84-.1-6.37-.1-5.91 0-15.18 1.67-31.44 5.32l-2.95.67c-22.16 5.02-27.05 6.01-31.61 6.01-2.5 0-5.45.36-9.43 1.09-1.58.29-3.25.62-5.64 1.11a4894.21 4894.21 0 0 0-6.2 1.29c-11.68 2.37-20.3 3.51-29.73 3.51-23.02 0-36 6.71-43.53 23.66-3.9 8.8-7.82 13.58-14.7 18.5-1.78 1.27-18.36 11.7-25.48 16.75-10.34 7.32-16.3 17.87-21.19 34.23-.58 1.96-1.15 4-1.82 6.47l-1.69 6.35c-2.98 11.18-5 16.9-8.17 21.81-5.05 7.81-11.37 12.68-15.89 12.98-4.7.31-5.3-4.23-.94-10.53 11.52-16.64 14.82-34.03 7.92-61.6-4.35-17.42-16.16-29.72-34.27-39.22-4-2.1-8.2-4-12.99-5.97-1.84-.75-3.7-1.49-6-2.38l-5.43-2.08c-8.03-3.12-20.02-.58-36.92 6.63-3.52 1.5-7.21 3.19-11.61 5.27l-13 6.22c-4.71 2.22-8.16 3.75-11.11 4.88a115.87 115.87 0 0 0-12.21 5.63c-1.58.83-7.86 4.18-9.37 4.96a56.55 56.55 0 0 1-7.9 3.54c-5.3 1.75-8.62.85-10.17-3.43-1.46-4.02.66-8.5 5.8-13.74 2.75-2.82 6.16-5.66 11.15-9.48.79-.6 6.43-4.85 7.94-6.02a66.96 66.96 0 0 0 6.23-5.28c6.74-6.74 6.1-6.16 7.61-6.51.87-.2 6.69.36 9.74.36 5.22 0 7.03-.32 8.74-1.35l1.31-.84c.62-.4 1.18-.72 1.84-1.07a41.07 41.07 0 0 1 6.96-2.72c6.64-2.04 8.22-4.84 9.28-13.47.93-7.53 1.5-10.47 3.4-15.24 1.99-4.95 5.04-7.26 9.34-7.51 3.17-.2 5.5.35 12.97 2.6a63.54 63.54 0 0 0 9.02 2.26c1.45.22 2.83.34 4.14.34 20.71 0 39.7-1.82 48.8-5.96 4.32-1.96 10.29-3.1 21.93-4.53l9.4-1.12c3.92-.48 7.11-.88 10.27-1.32 8.16-1.14 15.4-2.43 22.49-4.06 12.42-2.86 24.33-9.26 35.55-18.2a137.4 137.4 0 0 0 19.18-18.64 60.02 60.02 0 0 0 11.15-20.32c3.76-11.57 4.32-24.36.75-38.23A284.86 284.86 0 0 1 392.95 0zM506.7 0h1.26c-.5.66-.9 1.18-1.17 1.51-3.95 4.96-6.9 7.92-9.82 9.57A10.02 10.02 0 0 1 492 12.5c-2.38 0-4.24.67-6.71 2.21l-2.65 1.71c-4.38 2.8-8.01 4.08-13.64 4.08-5.6 0-9.99-1.26-16.08-4.05a202.63 202.63 0 0 1-2.3-1.06l-2.18-.98c-1.6-.7-2.92-1.17-4.17-1.48a13.42 13.42 0 0 0-3.27-.43c-2.3 0-4.3-.68-11-3.37l-1.56-.62c-5-1.97-8.1-2.82-10.52-2.66-2.93.2-4.42 2.03-4.42 6.15 0 20.76-5.21 50.42-12.15 57.35-7.58 7.59-26.55 23.7-34.06 29.06-13.16 9.4-31.17 20.2-44.11 25.06a106.87 106.87 0 0 1-13.32 4.03c-3.28.78-6.6 1.43-11.25 2.24-.53.1-8.8 1.5-11.5 1.99-4.86.87-9.3 1.74-14 2.76-20.62 4.48-25.07 5.01-38.11 5.01-2.49 0-2.9-.07-14.05-2-2.42-.42-4.31-.73-6.15-1-8.11-1.19-13.83-1.36-17.64-.2-4.54 1.4-5.93 4.65-3.7 10.52 2.02 5.28 4.84 8.61 8.84 10.74 3.26 1.74 6.75 2.6 13.82 3.71 9.42 1.48 10.94 1.75 15.5 2.92a78.2 78.2 0 0 1 18.62 7.37c8.3 4.58 14.58 11.5 19.98 20.89 2.73 4.73 9.46 19.33 10.54 21.19 3.4 5.85 6.26 6.63 10.89 2 4.95-4.94 10.35-8.37 21.13-14.06.47-.25 2.06-1.1 2.12-1.12 7.98-4.21 11.92-6.51 15.87-9.54 5.11-3.9 8.66-8.1 10.77-13.11 8.52-20.24 20.75-33.31 32.46-33.31l5.5.03c10.53.08 17.35.02 24.9-.31 13.66-.62 23.78-2.09 29.39-4.67 5.85-2.7 13.42-5.49 24.18-9.02 3.46-1.14 6.29-2.05 12.7-4.1 7.7-2.45 11.08-3.54 15.17-4.9a1059.43 1059.43 0 0 1 11.33-3.72c3.67-1.2 5.96-2 8.03-2.78a59.88 59.88 0 0 0 6.66-2.94c1.87-.98 3.76-2.1 5.86-3.5 3.48-2.33 6.15-3.13 12.04-4.13l1.15-.2c5.71-1.01 9-2.3 12.76-5.63 7.82-6.96 8.58-23.18 3.84-44.52-1.7-7.67-2.1-19.28-1.57-35.47A837.22 837.22 0 0 1 546.76 0h1l-.15 3.06c-.32 6.42-.53 11.02-.68 15.62-.51 16.1-.12 27.65 1.56 35.21 4.82 21.68 4.04 38.2-4.16 45.48-3.91 3.48-7.37 4.84-13.24 5.87l-1.16.2c-5.76.99-8.32 1.75-11.65 3.98a63.73 63.73 0 0 1-5.96 3.56 60.86 60.86 0 0 1-6.77 2.99c-2.09.79-4.39 1.58-8.07 2.79a5398.31 5398.31 0 0 1-11.32 3.71c-4.1 1.37-7.48 2.46-15.18 4.92-6.42 2.04-9.24 2.95-12.7 4.08-10.73 3.53-18.27 6.3-24.07 8.98-5.76 2.66-15.97 4.14-29.77 4.77-7.56.33-14.4.39-24.95.31l-5.49-.03c-11.19 0-23.16 12.79-31.54 32.7-2.19 5.19-5.84 9.52-11.08 13.52-4.02 3.07-7.99 5.39-16.01 9.62l-2.12 1.12c-10.7 5.65-16.04 9.04-20.9 13.9-5.14 5.14-8.75 4.15-12.45-2.22-1.12-1.92-7.85-16.5-10.54-21.2-5.33-9.24-11.48-16.02-19.6-20.5a77.2 77.2 0 0 0-18.4-7.28c-4.5-1.17-6.02-1.43-15.4-2.9-7.17-1.12-10.74-2-14.13-3.81-4.22-2.25-7.2-5.77-9.3-11.27-2.43-6.39-.78-10.26 4.34-11.83 4-1.22 9.82-1.05 18.08.17 1.84.27 3.74.58 6.17 1 11.02 1.9 11.48 1.98 13.88 1.98 12.96 0 17.35-.52 37.9-4.99 4.71-1.02 9.16-1.9 14.03-2.77 2.71-.48 10.98-1.9 11.5-1.98 4.64-.81 7.95-1.46 11.2-2.23 4.55-1.07 8.76-2.34 13.2-4 12.83-4.81 30.79-15.59 43.88-24.94 7.47-5.33 26.4-21.4 33.94-28.94C407.3 61.98 412.5 32.49 412.5 12c0-4.61 1.86-6.9 5.35-7.15 2.63-.18 5.8.7 10.96 2.73l1.56.62c6.53 2.62 8.53 3.3 10.63 3.3 1.14 0 2.3.16 3.5.46 1.32.33 2.68.82 4.34 1.53a90.97 90.97 0 0 1 3.34 1.52l1.15.54c5.98 2.73 10.23 3.95 15.67 3.95 5.41 0 8.87-1.21 13.1-3.92.2-.13 2.1-1.38 2.66-1.72 2.62-1.63 4.64-2.36 7.24-2.36 1.47 0 2.94-.43 4.47-1.3 2.78-1.56 5.67-4.45 9.54-9.31l.7-.89zM324.54 600h-2.03c.49-2.96.91-6.2 1.28-9.66.44-4.1.76-8.25.98-12.21.08-1.39.14-2.65-.35-7.29-.47-1.94-.93-4.14-1.36-6.54-2.01-11.26-2.66-22.9-1.14-33.78a60.76 60.76 0 0 1 5.18-17.95 70.78 70.78 0 0 1 12.6-18.22c3.38-3.6 5.53-5.5 11.83-10.79 4.5-3.78 6.35-5.56 7.52-7.5.64-1.07.95-2.06.95-3.06 0-1.75 0-1.74-.75-9.23-.36-3.7-.57-6.3-.68-8.96-.5-12.1 1.62-19.6 8.11-21.76 15.9-5.3 25.89-12.1 33.45-25.54C409.6 390.65 425.85 376 436 376c12.36 0 20-1.96 29.41-8.8 6.76-4.92 9.5-6.6 12.47-7.46 2.22-.64 3.8-.74 9.12-.74 1.86 0 3.53-.83 5.57-2.62 1.08-.96 5.11-5.12 5.6-5.6 6.04-5.85 11.98-8.78 20.83-8.78 2.45 0 4.54.04 7.32.12 7.51.23 8.87.17 11.27-.7 3.03-1.1 5.53-3.03 14.75-11.17 8-7.06 10.72-8.92 22.87-16.47 1.44-.9 2.59-1.63 3.69-2.37a69.45 69.45 0 0 0 9.46-7.5c4.12-3.88 8.02-7.85 11.64-11.9v2.98a201.58 201.58 0 0 1-10.27 10.38c-3.18 3-6.2 5.35-9.72 7.7-1.12.76-2.28 1.5-3.75 2.4-12.05 7.5-14.71 9.32-22.6 16.28-9.46 8.35-12.01 10.32-15.39 11.55-2.74 1-4.19 1.06-12.01.82-2.76-.08-4.83-.12-7.26-.12-8.27 0-13.75 2.7-19.43 8.22-.44.43-4.52 4.64-5.68 5.66-2.37 2.09-4.46 3.12-6.89 3.12-5.1 0-6.6.1-8.56.66-2.67.78-5.29 2.37-11.85 7.15-9.8 7.13-17.85 9.19-30.59 9.19-9.22 0-24.96 14.2-34.13 30.49-7.84 13.94-18.24 21.02-34.55 26.46-5.31 1.77-7.21 8.51-6.75 19.78.1 2.6.31 5.19.68 8.84.75 7.62.75 7.58.75 9.43 0 1.38-.42 2.73-1.24 4.09-1.33 2.2-3.26 4.07-7.94 8-6.25 5.24-8.36 7.12-11.67 10.63a68.8 68.8 0 0 0-12.25 17.71 58.8 58.8 0 0 0-5 17.36c-1.49 10.66-.85 22.09 1.13 33.15.43 2.37.88 4.53 1.33 6.44.16.66.3 1.25.6 4.06a249.3 249.3 0 0 1-1.17 16.12c-.37 3.37-.78 6.53-1.25 9.44zm-13.4 0h-1.05l.12-.28c3.07-7.16 4.29-11.83 4.29-18.72 0-3.57-.07-4.93-.76-15.65-.77-12.04-1-19.64-.55-28.3.58-11.5 2.4-22.1 5.81-32.16 1.3-3.8 2.8-7.5 4.55-11.1 3.46-7.14 6.83-12.39 10.42-16.6a59.02 59.02 0 0 1 4.35-4.56c.43-.4 3-2.8 3.67-3.45 5.72-5.6 7.51-11.52 7.51-29.18 0-18.84 2.9-23.77 15.82-28.24 1.09-.37 1.92-.67 2.77-.98a51.3 51.3 0 0 0 6.1-2.7c4.95-2.6 9.64-6.22 14.44-11.42 25.5-27.63 37.15-35.16 56.37-35.16 8.28 0 14.54-1.95 22-6.3 1.78-1.03 13.82-8.82 18.16-11.27 2.83-1.59 5.66-3.03 8.63-4.39 7.92-3.6 13.97-4.45 26.6-4.8 7.53-.2 10.7-.49 14.26-1.58 4.55-1.4 8.06-4 10.93-8.43 2.2-3.41 6.85-7.08 14.66-12.06 1.61-1.03 3.27-2.05 5.65-3.5 9.53-5.85 11.56-7.13 14.81-9.57 5.34-4 9.3-8.37 13.68-14.77a204.2 204.2 0 0 0 5.62-8.75v1.9c-1.97 3.17-3.4 5.38-4.8 7.42-4.42 6.48-8.46 10.92-13.9 15-3.29 2.46-5.32 3.75-14.89 9.61a375.06 375.06 0 0 0-5.63 3.5c-7.7 4.9-12.26 8.52-14.36 11.76-3 4.63-6.7 7.39-11.48 8.85-3.68 1.12-6.9 1.42-14.53 1.63-12.5.34-18.44 1.18-26.2 4.7a111.08 111.08 0 0 0-8.56 4.35c-4.3 2.43-16.34 10.22-18.15 11.27-7.6 4.43-14.03 6.43-22.5 6.43-18.87 0-30.3 7.4-55.63 34.84-4.88 5.28-9.67 8.97-14.7 11.62-2 1.05-4 1.92-6.23 2.75-.86.32-1.7.62-5.37 1.87-5.08 1.76-7.44 3.25-9.28 6.37-2.23 3.78-3.29 9.94-3.29 20.05 0 17.9-1.87 24.07-7.8 29.89-.69.67-3.27 3.06-3.69 3.46a58.04 58.04 0 0 0-4.28 4.49c-3.53 4.14-6.86 9.32-10.28 16.38a95.19 95.19 0 0 0-4.5 10.99c-3.38 9.97-5.18 20.48-5.76 31.9-.44 8.6-.22 16.17.55 28.17.69 10.76.76 12.12.76 15.72 0 6.35-1.02 10.87-4.35 19zm25.08 0h-1c-.04-4.73.06-9.39.28-15.02.26-6.41-.4-11.79-2.53-24.37l-.31-1.86c-2.12-12.55-2.76-19.35-1.97-26.47 1.03-9.25 4.75-16.68 12-22.67 22.04-18.2 29.81-30.18 29.81-44.61 0-2.6-.3-4.81-.98-8.17-.97-4.79-1.1-5.68-.97-7.57.2-2.56 1.27-4.7 3.56-6.72 2.67-2.35 7.05-4.6 13.72-7.01 9.72-3.5 15.52-9.18 24.3-21.57l1.78-2.5c4.48-6.33 7.1-9.63 10.43-12.78 4.31-4.07 8.98-6.77 14.54-8.17 13.3-3.32 20.37-5.47 25.34-7.64a49.5 49.5 0 0 0 5.28-2.7c1.1-.65 1.75-1.04 4.24-2.6 2.7-1.68 5.22-2.08 11.38-2.28 5.44-.18 7.9-.43 10.97-1.41a21.47 21.47 0 0 0 9.54-6.22c4.87-5.3 10.03-7.61 17.79-8.9 1.07-.18 1.88-.3 3.86-.58 6.9-.97 9.94-1.69 13.48-3.62 4.5-2.45 6.79-4.44 23.46-19.68l3.14-2.85c9.65-8.71 16.12-13.83 21.42-16.48 4.25-2.12 7.6-4.69 11.22-8.6v1.45c-3.42 3.57-6.69 6-10.78 8.05-5.18 2.59-11.61 7.67-21.2 16.32l-3.12 2.85c-16.8 15.35-19.05 17.3-23.66 19.82-3.68 2-6.8 2.75-13.82 3.73-1.97.28-2.78.4-3.84.57-7.56 1.26-12.52 3.48-17.21 8.6a22.47 22.47 0 0 1-9.97 6.5c-3.2 1-5.72 1.27-11.25 1.45-5.98.2-8.39.57-10.89 2.13a144 144 0 0 1-4.25 2.61 50.48 50.48 0 0 1-5.39 2.75c-5.04 2.2-12.15 4.37-25.5 7.7-9.74 2.44-15.26 7.65-24.4 20.56l-1.77 2.5c-8.9 12.54-14.82 18.34-24.78 21.93-6.57 2.36-10.85 4.57-13.4 6.82-2.1 1.86-3.05 3.74-3.22 6.04-.13 1.76 0 2.63.95 7.3.7 3.42 1 5.7 1 8.37 0 14.79-7.93 27-30.18 45.39-7.03 5.8-10.64 13-11.64 22-.78 7-.14 13.73 1.96 26.2l.32 1.85c2.15 12.65 2.8 18.07 2.54 24.58-.22 5.57-.32 10.2-.28 14.98zM95.9 600h-2.04c.68-3.82 1.14-8.8 1.61-15.98.2-3.11.27-4.06.39-5.6 1.3-17.54 4.04-27.14 11.5-33.2 4.65-3.77 7.22-8.92 8.67-16 .51-2.52.7-3.87 1.33-9.17.66-5.5 1.16-8.06 2.24-10.36 1.45-3.09 3.82-4.69 7.39-4.69 14.28 0 38.48 9.12 53.6 20.2 8.66 6.35 21.26 13.32 31.74 17.11 13.03 4.71 21.89 4.41 24.75-1.73 1.7-3.64 1.92-4.11 2.65-5.77 2.93-6.67 4.69-12.2 5.25-17.5.23-2.17.24-4.23.02-6.2-.32-2.75-1.42-4.55-4.08-7.35l-1.32-1.37a30.59 30.59 0 0 1-2.41-2.79 30.37 30.37 0 0 1-2.5-4.07l-1.13-2.14c-1.62-3.1-2.68-4.6-4.12-5.56-5.26-3.5-14.8-5.5-28.55-6.83a272.42 272.42 0 0 0-9.04-.71l-2.18-.17c-9.57-.73-15.12-1.56-19.06-3.2C156.57 471.07 136 450.5 136 440c0-5.34 1.74-9.53 5.47-14.13 1.98-2.44 11.12-11.71 12.79-13.54 4.52-4.97 10.16-9.54 17.68-14.66 2.8-1.9 14.78-9.6 17.49-11.49a50.54 50.54 0 0 0 6.34-5.43c1.53-1.5 6.96-7.13 7.12-7.3 7.18-7.3 12.7-11.56 19.74-14.38 3.36-1.34 8.13-2.79 17.45-5.38a9577.18 9577.18 0 0 1 11.78-3.28 602.6 602.6 0 0 0 12.67-3.7c20.4-6.24 34-12.08 40.79-18.44 8.74-8.2 11.78-13.84 15.73-26.02 2.02-6.22 3.09-9.04 5.07-12.72 9.54-17.71 28.71-39.37 43.5-45.45C383.77 238.25 389 232.34 389 226c0-2.89 2.73-8.4 6.83-13.73 4.76-6.2 10.65-11.36 16.75-14.18 12.5-5.77 33.5-10.09 47.42-10.09 5.32 0 9.83-1.5 16.42-4.89 9.2-4.71 10.1-5.11 13.58-5.11 10.42 0 32.06-2.55 45.76-5.97l3.88-.98 3.47-.89c2.6-.66 4.33-1.08 5.93-1.43 3.9-.86 6.76-1.23 9.58-1.17 2.74.06 5.47.52 8.67 1.48 4.56 1.37 13.71-.9 22.87-5.68a68.07 68.07 0 0 0 9.84-6.2v2.4c-11.09 8.14-25.76 13.66-33.29 11.4a29.72 29.72 0 0 0-8.13-1.4c-2.63-.05-5.36.3-9.11 1.12a238 238 0 0 0-9.33 2.3l-3.9.99C522.38 177.43 500.58 180 490 180c-2.99 0-3.91.4-12.67 4.89-6.85 3.51-11.61 5.11-17.33 5.11-13.65 0-34.35 4.26-46.58 9.9-5.78 2.67-11.42 7.62-16 13.58-3.85 5.02-6.42 10.2-6.42 12.52 0 7.27-5.8 13.82-20.62 19.92-14.27 5.88-33.16 27.21-42.5 44.55-1.9 3.55-2.95 6.28-4.93 12.4-4.05 12.47-7.23 18.39-16.27 26.86-7.08 6.64-20.87 12.57-41.57 18.89a604.52 604.52 0 0 1-12.7 3.71 1495.1 1495.1 0 0 1-11.8 3.28c-9.24 2.58-13.97 4.01-17.24 5.32-6.73 2.69-12.05 6.8-19.05 13.92-.15.15-5.6 5.8-7.15 7.32a52.4 52.4 0 0 1-6.6 5.65c-2.74 1.92-14.75 9.63-17.5 11.5-7.4 5.04-12.94 9.52-17.33 14.35-1.72 1.9-10.8 11.11-12.71 13.46-3.47 4.26-5.03 8.03-5.03 12.87 0 9.5 20 29.5 33.38 35.08 3.67 1.53 9.1 2.34 18.45 3.05a586.23 586.23 0 0 0 4.34.32c3.24.23 5.07.37 6.93.55 14.08 1.37 23.82 3.4 29.45 7.17 1.82 1.2 3.02 2.91 4.8 6.29l1.11 2.13a28.55 28.55 0 0 0 2.34 3.81c.62.83 1.3 1.6 2.26 2.61.23.24 1.1 1.16 1.32 1.37 2.93 3.09 4.24 5.23 4.61 8.5.24 2.12.23 4.33-.01 6.64-.59 5.55-2.4 11.25-5.41 18.1-.74 1.67-.96 2.15-2.66 5.8-3.49 7.47-13.33 7.8-27.25 2.77-10.67-3.86-23.43-10.92-32.25-17.38C164.62 515.96 140.82 507 127 507c-5 0-6.4 3.02-7.64 13.29a99.03 99.03 0 0 1-1.36 9.33c-1.53 7.5-4.3 13.04-9.37 17.16-6.87 5.58-9.5 14.78-10.77 31.8-.11 1.52-.18 2.47-.38 5.57-.46 7.01-.91 11.99-1.57 15.85zm8.05 0h-1.02c.29-1.41.58-2.94.9-4.59l1.05-5.62c2.5-13.3 4.2-19.92 6.68-24.05 1.7-2.84 3.68-5.5 8.05-11.03 8.21-10.36 10.88-14.55 10.88-18.71l-.02-1.69c-.02-1.78-.02-2.7.02-3.77.21-5.05 1.47-8.2 4.64-9.4 3.92-1.5 10.39.44 20.12 6.43 9.56 5.88 17.53 10.7 25.91 15.66 1.31.78 14.27 8.41 17.67 10.45a714.21 714.21 0 0 1 6.42 3.9c13.82 8.5 38.94 5.05 46.3-7.83 3.6-6.28 4.54-8.52 7.78-17.32a82.3 82.3 0 0 1 1.18-3.07 42.27 42.27 0 0 1 4.06-7.64c9.33-13.98 14.92-26.1 14.92-36.72 0-3.66.75-6.62 3.36-14.85.52-1.64.83-2.66 1.15-3.73 3.64-12.23 3.04-19.12-4.29-24a23.1 23.1 0 0 0-9.98-3.78c-7.2-.93-14.49 1.17-23.91 5.88-1.55.78-6.64 3.44-7.6 3.93a62.6 62.6 0 0 0-4.14 2.3l-4.4 2.66c-11.62 6.92-20.4 9.18-32.81 6.08-3.32-.84-6.24-1.4-13.1-2.64-13.25-2.39-18.7-3.75-23.33-6.46-6.23-3.67-7.46-9.02-2.88-16.65A93.1 93.1 0 0 1 172 415.42a157 157 0 0 1 8.32-7.66c-.07.05 6.16-5.3 7.82-6.77a85.12 85.12 0 0 0 6.5-6.33c7.7-8.46 12.78-13.36 20.08-18.57 9.94-7.1 21.4-12.36 35.18-15.58 37.03-8.64 51-12.7 58.83-17.93 8.6-5.73 21.3-24.77 36.84-54.81 5.22-10.1 12.27-18.4 21.13-25.71 5.13-4.24 9.56-7.25 17.55-12.23 7.42-4.62 9.62-6.14 11.38-8.16a21.15 21.15 0 0 0 2.95-4.87c.61-1.3 2.87-6.47 3-6.77 1.36-3 2.56-5.4 3.95-7.73 6.53-10.97 16.03-18 31.4-20.8 12.73-2.3 19.85-2.7 29.68-2.3 3.25.13 4.13.16 5.6.14 5.15-.07 9.71-1.04 16.61-3.8 20.74-8.3 38.75-12.04 59.19-12.04 3.05 0 6.03.15 10.48.48l2.09.16c12.45.96 18.08.96 25.34-.63a49.65 49.65 0 0 0 14.09-5.45v1.15a50.52 50.52 0 0 1-13.88 5.28c-7.38 1.61-13.08 1.61-25.63.65l-2.08-.16c-4.43-.33-7.39-.48-10.41-.48-20.3 0-38.2 3.72-58.81 11.96-7.01 2.8-11.7 3.8-16.97 3.88-1.5.02-2.39-.01-5.66-.14-9.76-.4-16.8-.01-29.47 2.3-15.06 2.73-24.32 9.58-30.71 20.31a72.8 72.8 0 0 0-3.9 7.63c-.12.28-2.39 5.47-3.01 6.79a22 22 0 0 1-3.1 5.1c-1.86 2.13-4.07 3.66-11.6 8.35-7.95 4.96-12.35 7.95-17.44 12.15-8.76 7.23-15.73 15.43-20.89 25.4-15.61 30.2-28.36 49.32-37.16 55.19-7.98 5.32-21.97 9.39-59.17 18.07-13.65 3.18-24.98 8.39-34.82 15.42-7.22 5.16-12.27 10.01-19.92 18.43a86.07 86.07 0 0 1-6.57 6.4c-1.67 1.48-7.91 6.83-7.84 6.77-3.27 2.84-5.8 5.16-8.26 7.62a92.1 92.1 0 0 0-14.27 18.13c-4.3 7.16-3.22 11.89 2.53 15.26 4.47 2.63 9.88 3.99 23.24 6.39a185.7 185.7 0 0 1 12.92 2.6c12.11 3.03 20.64.84 32.06-5.96l4.4-2.65c1.66-1 2.96-1.73 4.2-2.35.95-.48 6.04-3.14 7.6-3.92 9.59-4.8 17.04-6.94 24.49-5.98a24.1 24.1 0 0 1 10.4 3.93c7.82 5.21 8.45 12.52 4.7 25.13-.32 1.07-.64 2.1-1.16 3.74-2.57 8.12-3.31 11.04-3.31 14.55 0 10.88-5.66 23.14-15.08 37.28a41.28 41.28 0 0 0-3.97 7.46c-.37.9-.73 1.82-1.18 3.04-3.25 8.85-4.21 11.13-7.84 17.47-7.67 13.42-33.43 16.95-47.7 8.18a578.4 578.4 0 0 0-6.4-3.89c-3.4-2.04-16.36-9.67-17.67-10.45-8.38-4.97-16.36-9.78-25.92-15.66-9.5-5.85-15.7-7.7-19.24-6.36-2.68 1.02-3.8 3.82-4 8.51a61.12 61.12 0 0 0-.02 3.72l.02 1.7c0 4.5-2.69 8.73-11.52 19.87-3.92 4.95-5.87 7.59-7.55 10.39-2.39 3.97-4.08 10.56-6.56 23.72l-1.05 5.62-.86 4.4zm10.5 0h-1c.03-.34.04-.68.04-1 0-12.39 8.48-33.57 19.16-43.37a26.18 26.18 0 0 0 3.67-4.17 35.8 35.8 0 0 0 2.88-4.9c.36-.72 1.75-3.66 2.1-4.36 3.22-6.29 6.84-6.54 16.97.39 1.34.9 6.07 4.16 6.4 4.38 2.62 1.8 4.67 3.2 6.7 4.56 5.03 3.39 9.37 6.2 13.51 8.7 14.33 8.67 25.49 13.27 34.11 13.27 16.86 0 32.71-5.95 39.6-14.8 1.59-2.04 3.2-5.17 5.06-9.63.8-1.92 1.64-4.06 2.67-6.8l2.74-7.33c4.66-12.44 7.76-19.06 11.56-23.27 7.9-8.79 14.87-36 14.87-52.67 0-1.9.17-3.11 1.02-8.27.37-2.2.58-3.6.74-5.07.63-5.51.21-9.46-1.68-12.39-4.6-7.1-19.7-9.23-38.46-4.78a100.57 100.57 0 0 0-18.94 6.3c-5.17 2.37-17.11 9.74-16.5 9.4-6.72 3.64-12.97 4.15-24.8 1.3-29.55-7.14-30.43-8.62-15.26-26.81 17.44-20.93 47.12-46.18 56.38-46.18 9.92 0 53.84-11.98 65.78-17.95 9.46-4.73 24.32-21.18 36.82-37.85.71-.95 13.5-21.6 19.2-29.6 9.35-13.13 18.22-22.55 26.95-27.53 7.29-4.17 13.16-10.28 18.8-18.73 1.93-2.9 10.52-17.65 12.73-20.41 1.54-1.93 3-3.21 4.52-3.89 14.07-6.25 24.22-9.04 39.2-9.04h29c4.05 0 7.36-.4 22.93-2.5l4.3-.57c9.92-1.3 16.57-1.93 21.77-1.93 1.66 0 2.95.01 6.03.04 18.61.19 28.55-.48 44.86-4.03 3.1-.67 6.13-1.78 9.11-3.31v1.12a37.96 37.96 0 0 1-8.9 3.17c-16.4 3.56-26.4 4.24-45.08 4.05-3.08-.03-4.36-.04-6.02-.04-5.15 0-11.76.63-21.64 1.92l-4.3.58c-15.64 2.11-18.94 2.5-23.06 2.5h-29c-14.81 0-24.84 2.75-38.8 8.96-1.34.6-2.69 1.78-4.14 3.6-2.16 2.68-10.72 17.39-12.68 20.33-5.72 8.57-11.7 14.8-19.13 19.04-8.57 4.9-17.36 14.23-26.63 27.24-5.68 7.97-18.47 28.64-19.22 29.63-12.6 16.8-27.52 33.32-37.18 38.15-12.06 6.03-56.14 18.05-66.22 18.05-8.82 0-38.39 25.15-55.62 45.82-14.6 17.52-14.19 18.21 14.74 25.2 11.6 2.8 17.6 2.3 24.09-1.2-.67.35 11.31-7.03 16.56-9.44 5.41-2.48 11.6-4.59 19.11-6.37 19.13-4.53 34.65-2.35 39.54 5.22 2.05 3.17 2.48 7.32 1.84 13.04a96.34 96.34 0 0 1-.75 5.13c-.84 5.08-1.01 6.29-1.01 8.1 0 16.9-7.03 44.33-15.13 53.33-3.68 4.09-6.76 10.65-11.37 22.96-.35.93-2.2 5.94-2.73 7.33-1.04 2.76-1.88 4.9-2.68 6.84-1.9 4.53-3.55 7.73-5.2 9.85-7.1 9.13-23.25 15.19-40.39 15.19-8.86 0-20.15-4.65-34.63-13.42-4.15-2.51-8.5-5.32-13.55-8.72a861.54 861.54 0 0 1-6.71-4.56l-6.4-4.39c-9.68-6.63-12.61-6.42-15.5-.75-.35.68-1.74 3.62-2.1 4.35a36.77 36.77 0 0 1-2.96 5.03c-1.12 1.57-2.37 3-3.81 4.33-10.47 9.6-18.84 30.51-18.84 42.63l-.03 1zm-29.65 0h-1.1c1.17-2.52 1.79-5.2 1.79-8 0-20 4.83-42.04 12.15-49.35 5.17-5.18 7.77-8.38 9.9-12.74 2.64-5.41 3.95-12 3.95-20.91 0-6.82 1.14-11.59 3.37-15.07 1.74-2.7 3.6-4.21 8.91-7.52a31.64 31.64 0 0 0 3.9-2.79c4.61-3.96 6.58-6.2 7.72-9.41 1.43-4.02.93-9.04-1.86-16.02a68.98 68.98 0 0 0-3.99-8.07l-.93-1.7a75.47 75.47 0 0 1-2.64-5c-5.16-10.71-3.77-18.9 7.68-29.78a204 204 0 0 1 26.81-21.55c3.96-2.69 16.8-10.8 19.24-12.5 1.99-1.4 4.33-3.3 7.77-6.3-.02 0 7.23-6.39 9.47-8.3 4.97-4.26 9.09-7.5 13.05-10.15 4.72-3.15 8.97-5.28 12.87-6.32 12.78-3.41 15.6-4.18 21.77-5.97 12.55-3.64 21.96-6.9 28.14-10a45.47 45.47 0 0 1 7.47-2.79c8.66-2.66 12.02-4.1 16.97-8.1 6.78-5.46 13.07-14.25 19.33-27.87 15.97-34.77 19.08-39.39 32.15-49.19 3.14-2.36 6.37-4.1 11.43-6.4l2.33-1.04c11.93-5.35 16.87-8.93 21.1-17.38 1.88-3.77 2.48-6.29 3.37-12.27.78-5.19 1.48-7.56 3.53-10.25 2.57-3.4 7.03-6.27 14.36-9.01 3.37-1.26 7.36-2.5 12.05-3.73 16.33-4.3 25.28-5.36 39.6-5.81 6.9-.22 9.5-.56 12.66-2 1.19-.54 2.36-1.23 3.58-2.11 3.7-2.7 8.14-4.54 13.24-5.67 5.71-1.27 10.69-1.54 18.7-1.45l2.35.02c2.82 0 6.8-1 19.7-4.69 10.83-3.08 15.95-4.31 19.3-4.31.82 0 1.9.13 3.55.41l5.01.9c9.82 1.68 17.44 1.89 25.15-.21 7.98-2.18 14.8-6.77 20.29-14.24V147c-5.47 7.04-12.21 11.42-20.03 13.55-7.88 2.15-15.63 1.94-25.58.23l-5-.9c-1.6-.26-2.64-.39-3.39-.39-3.2 0-8.32 1.22-19.74 4.48-12.35 3.53-16.3 4.52-19.26 4.52l-2.36-.02c-7.94-.1-12.85.17-18.47 1.42-4.97 1.11-9.3 2.9-12.88 5.5a21.4 21.4 0 0 1-3.75 2.22c-3.32 1.5-6 1.87-13.04 2.09-14.25.44-23.13 1.5-39.37 5.77a125.56 125.56 0 0 0-11.95 3.7c-7.17 2.7-11.49 5.46-13.93 8.68-1.9 2.52-2.58 4.76-3.33 9.8-.9 6.08-1.53 8.68-3.47 12.56a30.6 30.6 0 0 1-9.66 11.45c-3.12 2.26-5.95 3.73-11.93 6.4l-2.31 1.04c-5.01 2.27-8.18 3.99-11.25 6.29-12.9 9.68-15.93 14.17-31.85 48.8-6.31 13.76-12.7 22.68-19.6 28.25-5.08 4.1-8.53 5.57-17.3 8.27a44.64 44.64 0 0 0-7.33 2.73c-6.24 3.12-15.7 6.4-28.3 10.06a867.4 867.4 0 0 1-21.8 5.97c-3.77 1.01-7.93 3.1-12.56 6.19a137.35 137.35 0 0 0-12.95 10.07c-2.24 1.92-9.48 8.3-9.48 8.3a98.2 98.2 0 0 1-7.84 6.37c-2.46 1.72-15.32 9.83-19.26 12.5a203 203 0 0 0-26.69 21.45c-11.13 10.58-12.43 18.3-7.47 28.63a74.52 74.52 0 0 0 2.62 4.95l.94 1.7a69.84 69.84 0 0 1 4.03 8.17c2.88 7.2 3.4 12.46 1.89 16.73-1.22 3.43-3.28 5.77-8.02 9.84-1.14.97-2.32 1.8-5.3 3.67-3.92 2.45-5.69 3.89-7.31 6.42-2.13 3.3-3.22 7.89-3.22 14.53 0 9.05-1.34 15.79-4.05 21.34-2.19 4.49-4.85 7.77-10.1 13.01-7.07 7.07-11.85 28.9-11.85 48.65 0 2.8-.58 5.48-1.7 8zm282.54 0h-1.01l-1.1-5.8c-3.08-16.26-4.05-26.2-2.74-37.26.7-5.8.77-9.68.55-15.3-.18-4.45-.17-5.68.19-7.63.78-4.3 3.44-8.53 10.39-16.34 9.07-10.2 12.26-15.41 19.8-30.15 1.35-2.64 2.33-4.47 3.38-6.3.9-1.58 1.82-3.06 2.77-4.5 3.14-4.7 7.03-8.42 16.84-16.81 11.22-9.6 15.5-13.86 18.13-19.13.7-1.4 1.3-2.8 1.93-4.4a206 206 0 0 0 1.49-4.05c3.63-9.94 8.01-13.93 22.9-17.81 4.99-1.3 20.55-5.13 21.38-5.34 16.19-4.1 25.33-7.36 33.48-12.6 5.86-3.77 5.84-3.76 27.66-16.53l2.6-1.52c10.23-6 17.1-10.2 22.73-13.95a149.3 149.3 0 0 0 8.8-6.3 723.7 723.7 0 0 0 6.37-5.08A87.74 87.74 0 0 1 600 342.95v1.12a85.76 85.76 0 0 0-15.49 9.9c.18-.14-4.76 3.84-6.38 5.1a150.3 150.3 0 0 1-8.85 6.35c-5.65 3.76-12.53 7.96-22.78 13.97l-2.6 1.53c-21.8 12.75-21.78 12.74-27.63 16.5-8.27 5.32-17.49 8.61-33.78 12.73-.83.21-16.39 4.04-21.36 5.33-8.03 2.1-13.15 4.5-16.45 7.5-2.66 2.42-4 4.86-5.77 9.7l-1.5 4.07a51.12 51.12 0 0 1-1.96 4.47c-2.72 5.45-7.04 9.75-18.38 19.45-9.73 8.32-13.6 12.02-16.65 16.6a77.18 77.18 0 0 0-2.74 4.45c-1.05 1.81-2.01 3.63-3.35 6.25-7.58 14.81-10.82 20.08-19.96 30.36-6.83 7.7-9.4 11.78-10.15 15.86-.34 1.85-.34 3.04-.17 7.4.22 5.68.14 9.6-.55 15.47-1.3 10.92-.34 20.79 2.73 36.95l1.12 5.99zm-76.59 0h-2.1l1.39-4.3c1.04-3.3 1.93-6.78 2.68-10.4 2.65-12.73 3.27-23.63 3.27-41.3 0-5.71-1.86-9.75-4.13-9.75-2.94 0-6.96 5.61-10.93 17.08C271.14 579.68 258.3 593 238 593c-22.42 0-29.26-1.35-48.42-10.09a87.69 87.69 0 0 1-9.42-5.04c-2.95-1.8-12.78-8.57-14.84-9.72-4.2-2.36-7-2.71-9.72-.99-.63.4-1.26.91-1.9 1.55a57.69 57.69 0 0 1-4.31 3.86 147.88 147.88 0 0 1-3.06 2.44l-1 .8C137.01 582.43 134 587.18 134 597c0 1.02-.02 2.01-.07 3h-2c.05-.99.07-1.98.07-3 0-10.52 3.33-15.78 12.09-22.76a265.61 265.61 0 0 1 2-1.6c.83-.64 1.43-1.13 2.03-1.61a55.76 55.76 0 0 0 4.17-3.74c.74-.73 1.48-1.34 2.24-1.82 3.47-2.2 7-1.75 11.77.93 2.15 1.21 12.03 8 14.9 9.76a85.7 85.7 0 0 0 9.22 4.93C209.29 589.7 215.85 591 238 591c19.25 0 31.49-12.7 41.06-40.33 4.24-12.25 8.66-18.42 12.81-18.42 3.8 0 6.13 5.06 6.13 11.75 0 17.8-.63 28.8-3.3 41.7-.77 3.7-1.68 7.23-2.75 10.6-.4 1.3-.8 2.53-1.19 3.7zm-149.25 0 .5-.94a160.1 160.1 0 0 0 6.53-13.26c2.73-6.29 5.78-9.64 9.24-10.52 3.74-.95 7.15.74 12.56 5.13 5.43 4.4 6.07 4.86 7.73 5.1 1.6.22 4.28 1.14 8.86 2.95 1.3.5 10.78 4.35 13.85 5.55 3.07 1.2 5.85 2.25 8.49 3.18 3.1 1.1 5.98 2.04 8.65 2.81h-3.45c-1.76-.56-3.6-1.18-5.54-1.87a281.2 281.2 0 0 1-8.51-3.19c-3.08-1.2-12.57-5.04-13.86-5.55-4.5-1.78-7.15-2.68-8.63-2.9-1.94-.27-2.53-.7-8.22-5.3-5.17-4.2-8.36-5.78-11.69-4.94-3.1.78-5.94 3.92-8.56 9.95a161 161 0 0 1-6.82 13.8h-1.13zm112.89 0a30.34 30.34 0 0 0 11.27-6.27c1.55-1.36 3.32-3.46 5.34-6.29 1.05-1.46 2.15-3.1 3.41-5.04a349.73 349.73 0 0 0 2.5-3.9l.47-.75.93-1.47a89.17 89.17 0 0 1 3.25-4.86c1.05-1.43 1.82-2.23 2.44-2.46 1.02-.37 1.49.48 1.49 2.04l.01 2.11c.05 6.91-.08 11.32-.7 16.33a48.4 48.4 0 0 1-2.38 10.56h-1.07a46.47 46.47 0 0 0 2.45-10.68c.62-4.96.75-9.33.7-16.2l-.01-2.12c0-.97-.08-1.12-.15-1.1-.36.14-1.05.85-1.97 2.1a88.44 88.44 0 0 0-3.22 4.82l-.92 1.46-.48.75a1268.1 1268.1 0 0 1-2.5 3.92c-1.26 1.95-2.38 3.6-3.44 5.08-2.06 2.88-3.87 5.04-5.5 6.45a30.87 30.87 0 0 1-8.94 5.52h-2.98zm-183.72 0H69.3c3.37-3.43 5.19-8.33 5.19-15 0-18.6-.04-17.35 1.02-20.77.6-1.93 1.5-3.74 3.27-6.63.42-.7 4.92-7.8 6.78-10.86 3.04-4.97 11.04-16.5 12.21-18.56 3.48-6.08 4.72-12.06 4.72-24.18 0-7.85 2.5-14.2 8.1-23.44l2.84-4.63a72.67 72.67 0 0 0 2.49-4.4c1.62-3.15 2.48-5.78 2.62-8.28.2-3.78-1.3-7.29-4.9-10.9-5.13-5.12-8.6-5.43-11.2-1.85-2.12 2.92-3.48 7.74-5.06 16.47-.2 1.03-.82 4.6-.82 4.57-.83 4.67-1.4 7.33-2.1 9.6-1.35 4.42-3.7 7.61-8.36 12.26l-3.26 3.2c-6.38 6.39-9.68 11.51-11.36 19.5l-1.16 5.52c-.87 4.1-1.56 7.04-2.33 9.94-3.67 13.74-9.65 25.97-22.59 44.72-7.68 11.14-11.05 18.87-10.92 23.72h-1c-.12-5.16 3.35-13.05 11.1-24.28 12.87-18.67 18.8-30.8 22.44-44.42.77-2.88 1.45-5.8 2.32-9.89l1.16-5.51c1.73-8.22 5.13-13.5 11.64-20 .63-.64 2.84-2.8 3.25-3.21 4.57-4.54 6.82-7.62 8.12-11.84a81.58 81.58 0 0 0 2.07-9.48l.81-4.57c1.62-8.9 3-13.8 5.24-16.89 3-4.15 7.2-3.78 12.71 1.74 3.8 3.8 5.42 7.58 5.2 11.66-.15 2.66-1.05 5.41-2.73 8.68a73.6 73.6 0 0 1-2.52 4.46l-2.84 4.63c-5.52 9.1-7.96 15.3-7.96 22.92 0 12.28-1.28 18.43-4.85 24.68-1.2 2.1-9.21 13.65-12.22 18.58-1.87 3.06-6.37 10.18-6.78 10.86-1.73 2.82-2.6 4.57-3.17 6.4-1.02 3.28-.98 2.1-.98 20.48 0 6.52-1.7 11.44-4.82 15zM310.09 0h1.06c-.37.9-.77 1.83-1.2 2.82-3.9 9.06-5.45 15.15-5.45 25.18 0 7.64-2.1 11.6-6.64 13.05-3.46 1.1-5.72.98-17.57-.43-11.55-1.36-19.17-1.58-28.16-.14-6.24 2.49-25.91 7.02-32.13 7.02-11.15 0-36.76-2.88-54.12-7.01a22.08 22.08 0 0 0-16.95 2.48c-4.05 2.33-7.09 5.03-13.9 11.97-6.28 6.39-9.53 9.23-13.8 11.5-7.09 3.79-11.22 7.65-13.4 12.27-1.82 3.85-2.33 7.84-2.33 15.29 0 4.4-2.65 6.69-9.45 9.74.1-.05-2.97 1.31-3.84 1.71-8.78 4.06-12.71 8.29-12.71 16.55 0 12.52-4.86 19.22-17.34 27.96l-4.56 3.14c-1.9 1.3-3.3 2.3-4.67 3.3-.92.68-1.79 1.34-2.62 2-7.16 5.62-11 14.54-15.56 33.28-.63 2.57-3.3 14-4.07 17.14a350.44 350.44 0 0 1-5.2 19.33c-1.37 4.5-4.5 15.07-4.96 16.53-1.05 3.4-1.64 4.94-2.46 6.32-.82 1.4-6.85 9.08-12.64 18.27L0 277.98v-1.9l4.58-7.35a270.8 270.8 0 0 1 12.61-18.23c-.3.5 1.35-2.8 2.38-6.12.45-1.44 3.58-12.01 4.95-16.53 1.83-6.03 3.44-12.09 5.19-19.27.76-3.13 3.44-14.56 4.06-17.14 4.62-18.95 8.52-28.02 15.92-33.83.84-.67 1.72-1.33 2.65-2.01 1.38-1.02 2.8-2.01 4.7-3.32l4.54-3.14C73.83 140.57 78.5 134.13 78.5 122c0-8.74 4.2-13.26 13.29-17.45.88-.41 3.96-1.77 3.85-1.73 6.46-2.9 8.86-4.97 8.86-8.82 0-7.6.53-11.7 2.42-15.71 2.29-4.84 6.57-8.85 13.84-12.73 4.15-2.21 7.35-5 14.15-11.93 6.28-6.4 9.36-9.13 13.52-11.53a23.07 23.07 0 0 1 17.69-2.59c17.27 4.12 42.8 6.99 53.88 6.99 6.1 0 25.73-4.53 31.92-7 9.12-1.46 16.83-1.25 28.49.13 11.63 1.38 13.9 1.5 17.15.47 4.06-1.3 5.94-4.85 5.94-12.1 0-10.1 1.56-16.3 6.6-28zm25.12 0h1c.05 5.62.26 11.48.65 19.4.47 9.7.64 14.57.64 21.6 0 9.81-4.68 17.46-13.1 23.16-6.53 4.43-14.94 7.46-24.33 9.33-3.74.54-9.42.56-22.68.23-6.74-.17-9.35-.22-12.39-.22-2.77 0-4.97.43-7.63 1.36-.88.3-4.55 1.74-5.58 2.11-6.55 2.35-13.59 3.53-24.79 3.53-8.1 0-13.58-1.38-22.46-4.9l-3.18-1.25c-12.55-4.87-21.27-5.15-37.18 1.12-11.15 4.39-18.13 9.2-22.28 14.81-3.15 4.26-4.33 7.8-5.94 15.8-1.22 6.09-1.93 8.74-3.5 12.13-1.65 3.53-3.97 5.81-7.07 7.22-2.33 1.07-4.35 1.5-9.32 2.19-9.04 1.27-12.77 3.09-15.61 9.58-3.71 8.48-7.72 13.87-14.22 19.76-2.4 2.18-13.14 11.02-15.91 13.42-8.2 7.1-13.85 17.37-18.7 31.97a258.81 258.81 0 0 0-3.27 10.7c-.01.05-2.26 7.97-2.88 10.1-8.49 28.85-17.88 52.95-26.13 61.2-2.8 2.8-5.06 5.64-10.4 12.96-3.4 4.68-6.23 8.25-8.95 11.1v-1.55c2.74-2.98 5.73-6.82 9.48-11.97 4.03-5.52 6.32-8.4 9.17-11.24 8.07-8.08 17.44-32.14 25.87-60.8.62-2.1 2.86-10.03 2.88-10.08 1.21-4.24 2.21-7.53 3.28-10.74 4.9-14.75 10.63-25.16 19-32.4 2.78-2.42 13.5-11.25 15.89-13.4 6.4-5.8 10.32-11.09 13.97-19.43 1.68-3.83 4.05-6.31 7.2-7.86 2.4-1.17 4.64-1.67 9.53-2.36 4.54-.63 6.5-1.05 8.7-2.06 2.89-1.31 5.03-3.42 6.58-6.73 1.53-3.3 2.23-5.9 3.43-11.9 1.64-8.14 2.85-11.79 6.11-16.2 4.28-5.79 11.41-10.7 22.73-15.16 16.15-6.36 25.13-6.07 37.9-1.11l3.19 1.26c8.77 3.47 14.13 4.82 22.09 4.82 11.09 0 18.02-1.16 24.46-3.47 1-.36 4.68-1.8 5.58-2.11A22.5 22.5 0 0 1 265 72.5c3.05 0 5.67.05 14.07.26 11.53.29 17.2.27 20.83-.25 9.25-1.85 17.54-4.83 23.94-9.17C332 57.8 336.5 50.46 336.5 41c0-7-.17-11.86-.7-22.7-.35-7.26-.55-12.83-.59-18.3zM93.87 0h2.04c-.7 4-1.61 6.82-3.03 9.47-2.33 4.38-2.85 5.75-5.26 13.03a40.46 40.46 0 0 1-1.94 5.03c-2.24 4.66-5.92 8.8-13.07 14.26-8.01 6.13-14.27 16.55-20.03 31.55-2.4 6.23-8.75 25.63-9.64 28.01-2.69 7.16-6.56 12.7-15.63 23.68l-2.68 3.24c-6.02 7.34-9.35 12.07-11.72 17.15-2.3 4.94-7.12 9.9-12.91 14.15v-2.4c5.14-3.94 9.1-8.3 11.1-12.6 2.46-5.27 5.87-10.1 11.98-17.56l2.68-3.26c8.94-10.8 12.72-16.22 15.3-23.1.88-2.33 7.24-21.74 9.65-28.03 5.89-15.31 12.3-26 20.68-32.41 6.92-5.3 10.4-9.2 12.48-13.55.65-1.35 1.16-2.7 1.85-4.79 2.45-7.4 3-8.83 5.4-13.34A27.68 27.68 0 0 0 93.87 0zm9.07 0h1.02c-1.66 8.3-2.91 12.67-4.54 15.26a59.14 59.14 0 0 0-4.1 8.21c-1.27 3-2.44 6.2-3.5 9.4-.38 1.12-.7 2.16-2.41 5.39a251.48 251.48 0 0 0-12.81 13.3c-3.48 3.96-5.95 7.27-7.15 9.66-.95 1.9-2.06 5.99-3.61 12.97-.64 2.9-3.65 17.15-4.51 21.07-3.63 16.45-6.63 26.69-9.9 32-7.66 12.45-10.64 15.71-37.08 41.1A69.78 69.78 0 0 1 0 179.21v-1.15a69.39 69.39 0 0 0 13.65-10.42c26.4-25.33 29.32-28.55 36.92-40.9 3.2-5.18 6.18-15.37 9.78-31.7.86-3.91 3.87-18.16 4.51-21.06 1.57-7.09 2.7-11.2 3.7-13.2 1.24-2.5 3.76-5.86 7.29-9.89.9-1.03 1.86-2.1 2.86-3.18 2.4-2.6 4.96-5.22 7.53-7.76.9-.88 1.73-1.7 3.37-3.4a129.02 129.02 0 0 1 4.78-13.46 60.07 60.07 0 0 1 4.19-8.35c1.52-2.44 2.74-6.71 4.36-14.74zM83.71 0h1.1c-2.09 4.74-6.03 8.92-11.42 12.3-7.2 4.52-16.5 7.2-24.39 7.2-8.9 0-11.8 7-11.74 21.52 0 1.7.04 3.17.12 5.99.1 3.3.12 4.45.12 5.99 0 5.73-.76 11.3-2.01 16.5a66.67 66.67 0 0 1-2.15 6.97 2597.76 2597.76 0 0 1-7 15.86 4270.8 4270.8 0 0 1-19.9 43.87A54.64 54.64 0 0 1 0 147v-1.65a54.87 54.87 0 0 0 5.55-9.57A4269.82 4269.82 0 0 0 30.7 79.97c.53-1.2.99-2.23 2.44-5.9A69.23 69.23 0 0 0 36.5 53c0-1.52-.03-2.66-.12-5.95-.08-2.83-.12-4.31-.12-6.01-.03-6.79.53-11.62 2.07-15.34 1.94-4.68 5.39-7.19 10.67-7.19 7.7 0 16.81-2.63 23.86-7.05C77.93 8.27 81.66 4.38 83.7 0zm282.63 0h1.01c1.86 10.02 2.18 12.67 2.32 18.3a123.43 123.43 0 0 1 .37 27.83c-.96 8.78-3.1 16.01-6.63 21.15-11.34 16.5-39.8 29.22-66.41 29.22-5.09 0-10.47.28-16.31.83a413.8 413.8 0 0 0-24.37 3.16c-21.56 3.26-27.66 4.01-36.32 4.01-6.92 0-12.2-1.05-21.69-3.9l-2.78-.83c-1.39-.41-2.54-.74-3.65-1.02-8-2.05-14.22-2.04-21.7.72a16.32 16.32 0 0 0-9.17 8.18c-1.6 3.05-2.5 6.06-4.02 12.83-1.5 6.64-2.34 9.52-3.99 12.64a16.16 16.16 0 0 1-9.85 8.36 104.8 104.8 0 0 0-9.5 3.42c-6.55 2.8-10.1 5.57-13.8 10.47-1.33 1.75-1.03 1.3-5.43 7.9-1.98 2.97-4.66 5.8-8.48 9.14-2.01 1.76-10.71 8.83-12.88 10.7-7.37 6.35-12.58 12.14-16.63 19.14-4.22 7.3-7.8 18.3-11.28 33.26-.87 3.73-1.72 7.64-2.64 12.14l-1.18 5.8-1.09 5.45c-1.8 8.96-2.77 13.28-3.77 16.26-6.8 20.44-17.26 42.16-27.13 51.2-5.11 4.7-8.1 7.07-11.1 8.86-.9.54-1.84 1.04-2.92 1.57-.44.22-9.6 4.4-14.1 6.66l-1.22.62v-1.13l.78-.39c4.52-2.26 13.67-6.44 14.1-6.65a41.19 41.19 0 0 0 2.84-1.54c2.94-1.75 5.88-4.09 10.94-8.73 9.71-8.9 20.1-30.51 26.87-50.79.97-2.92 1.94-7.22 3.73-16.13l1.1-5.46a490.5 490.5 0 0 1 3.82-17.96c3.5-15.06 7.1-26.14 11.39-33.54 4.11-7.11 9.4-12.98 16.83-19.4 2.19-1.88 10.88-8.95 12.88-10.7 3.77-3.28 6.39-6.05 8.3-8.93 4.43-6.64 4.12-6.18 5.47-7.96 3.8-5.03 7.5-7.91 14.21-10.78 2.61-1.12 5.74-2.24 9.59-3.46a15.17 15.17 0 0 0 9.27-7.86c1.59-3.02 2.42-5.85 4.03-12.99 1.41-6.27 2.32-9.33 3.98-12.48a17.31 17.31 0 0 1 9.7-8.66c7.7-2.83 14.1-2.84 22.3-.75 1.12.29 2.28.61 3.68 1.03l3.73 1.11c8.47 2.54 13.66 3.58 20.46 3.58 8.59 0 14.67-.75 36.18-4a414.64 414.64 0 0 1 24.41-3.17c5.88-.54 11.29-.83 16.41-.83 26.3 0 54.45-12.58 65.59-28.78 3.42-4.98 5.5-12.06 6.46-20.7.84-7.74.73-16.02.02-23.9a136.2 136.2 0 0 0-.57-5.12c0-4.47-.3-6.94-2.16-17zM18.88 0h1.03C18 7.57 17.15 10.18 14.46 16.2c-1.95 4.37-2.67 9.19-2.42 14.89.2 4.33.71 7.7 2.28 16.13 1.09 5.88 1.57 8.77 1.94 12.2.96 8.9.24 16.08-2.8 22.79A463.4 463.4 0 0 1 0 109.43v-2.12a465 465 0 0 0 12.54-25.52c2.97-6.52 3.67-13.53 2.72-22.27-.36-3.4-.84-6.26-1.93-12.12-1.57-8.47-2.1-11.88-2.29-16.27-.26-5.84.48-10.81 2.5-15.33 2.64-5.9 3.48-8.47 5.34-15.8zm280.47 0a70.78 70.78 0 0 1-4.91 11.24c-2.56 4.7-4.01 8.45-4.86 11.98l-.4 1.8-.28 1.45a5.28 5.28 0 0 1-.74 2.07c-.74 1.03-1.93 1.28-5.13 1.25.92 0-9.85-.29-15.03-.29-10.2 0-18.45.82-29.46 2.56-16.87 2.66-17.73 2.77-23.66 2.52a42.57 42.57 0 0 1-8-1.09c-17.7-4.16-46.18-5.86-54.72-3.01-2.72.9-5.88 2.8-9.52 5.59a112.37 112.37 0 0 0-6.54 5.48c-1.4 1.25-9.17 8.5-10.78 9.84-1.45 1.2-8.18 7.42-8.85 8.02a114.65 114.65 0 0 1-4.55 3.9c-4.99 4.03-8.9 6.2-11.92 6.2-3.52.05-4.32 0-5.14-.4-1.13-.56-1.5-1.72-1.13-3.57.74-3.63 4.47-10.84 12.84-24.8 5.69-9.48 9.42-18 11.78-26.2 1.45-5.04 1.94-7.4 2.97-14.54h1.01c-1.05 7.3-1.54 9.7-3.01 14.82-2.39 8.28-6.16 16.89-11.9 26.44-8.3 13.84-12 21.01-12.7 24.48-.3 1.45-.08 2.14.59 2.47.6.3 1.35.35 3.48.3 3.92 0 7.69-2.1 12.5-5.98a114.6 114.6 0 0 0 4.51-3.86c.66-.59 7.41-6.83 8.88-8.05 1.59-1.33 9.34-8.55 10.75-9.82 2.4-2.15 4.55-3.96 6.6-5.53 3.72-2.85 6.97-4.8 9.81-5.74 8.76-2.92 37.41-1.22 55.27 2.99 2.57.6 5.14.95 7.81 1.06 5.84.25 6.7.14 23.47-2.51 11.05-1.75 19.36-2.57 29.6-2.57 5.2 0 15.99.3 15.05.29 2.87.03 3.84-.17 4.3-.83.23-.32.4-.8.58-1.7l.28-1.43.4-1.85c.88-3.6 2.36-7.44 4.96-12.22A69.5 69.5 0 0 0 298.29 0h1.06zm-8.59 0c-5.91 17.94-9.55 22-19.76 22-4.5 0-10.22.32-28.69 1.5l-1.53.1c-15.6.99-23.47 1.4-28.78 1.4-5.35 0-13.24-.96-28.86-3.28l-1.54-.23C163.18 18.75 157.47 18 153 18c-4.45 0-7.3 1.01-10.96 3.34-.1.06-1.8 1.17-2.3 1.47-2.43 1.5-4.32 2.19-6.74 2.19-2.8 0-4.11-1.46-4.11-4.22 0-1.04.16-2.29.5-4.1.16-.82.9-4.4 1.07-5.32.8-4.11 1.3-7.68 1.47-11.36h2c-.17 3.82-.68 7.5-1.5 11.75-.19.94-.92 4.5-1.07 5.31a21.04 21.04 0 0 0-.47 3.72c0 1.7.46 2.22 2.11 2.22 1.99 0 3.55-.57 5.7-1.9.47-.28 2.15-1.37 2.26-1.44C144.92 17.14 148.12 16 153 16c4.62 0 10.3.74 28.9 3.51l1.53.23C198.93 22.04 206.8 23 212 23c5.25 0 13.11-.41 28.65-1.4l1.54-.1C260.73 20.32 266.43 20 271 20c8.95 0 12.15-3.4 17.66-20h2.1zM141.51 0h1.13c-2.06 3.86-2.63 5.1-2.77 6.19-.15 1.12.42 1.64 2.32 1.96 1.8.3 3.85.35 10.81.35 6.02 0 13 .56 21.35 1.62 3.95.5 8.03 1.1 13.13 1.89 24 3.7 22.5 3.49 26.83 3.49 24.02 0 51.83-2.24 60.45-6.94 2.88-1.57 5.05-4.49 6.6-8.56h1.07c-1.64 4.47-3.98 7.69-7.2 9.44-8.83 4.82-36.67 7.06-60.92 7.06-4.41 0-2.84.22-26.98-3.5-5.1-.8-9.17-1.38-13.1-1.88-8.31-1.06-15.26-1.62-21.23-1.62-7.04 0-9.1-.05-10.97-.37-2.38-.4-3.38-1.32-3.15-3.07.16-1.22.69-2.41 2.63-6.06zm76.4 0c5.69 1.64 10.37 2.5 14.09 2.5 9.59 0 16.7-.71 22.4-2.5h2.98C251.12 2.53 243.2 3.5 232 3.5c-4.5 0-10.32-1.21-17.53-3.5h3.45zM70.69 0c-2.87 3.27-6.95 5.39-12.02 6.53-3.98.89-7.5 1.08-12.92 1A97.24 97.24 0 0 0 44 7.5c-5.37 0-8.86-1.24-10.1-4.97A8.6 8.6 0 0 1 33.5 0h.99c.02.82.14 1.56.36 2.22C35.91 5.39 39.02 6.5 44 6.5l1.76.02c5.35.09 8.8-.1 12.69-.97C62.95 4.54 66.63 2.74 69.3 0h1.37zM0 207.87c7.31-.16 11.5 3.33 11.5 11.13 0 11.41-5.05 28.35-11.5 41.5v-2.3c5.93-12.72 10.5-28.47 10.5-39.2 0-7.18-3.7-10.3-10.5-10.13v-1zm0 7.05c1.23.14 2.18.58 2.87 1.31 1.4 1.48 1.6 3.72 1.16 7.58l-.16 1.3A28.93 28.93 0 0 0 3.5 229c0 3.2-1.48 9.52-3.5 15.9v-3.45c1.49-5.13 2.5-9.87 2.5-12.45 0-.98.08-1.75.37-4.02l.16-1.29c.42-3.56.24-5.59-.88-6.77-.5-.53-1.21-.87-2.15-1v-1zM0 410.9v-1.47a21.67 21.67 0 0 0 2.97-4.7c1.32-2.7 2.68-6.28 4.56-11.89 7.85-23.55 7.83-26.6.25-30.4-2.25-1.12-4.8-1.43-7.78-.91v-1.02a13.1 13.1 0 0 1 8.22 1.04c8.24 4.12 8.26 7.6.25 31.6-1.88 5.66-3.25 9.27-4.6 12.02A20.82 20.82 0 0 1 0 410.9zM33.64 452c1.68 0 3.04-.23 8.34-1.31l2.38-.47c8.26-1.57 12.72-1.3 14.53 2.33 1.38 2.75-.47 5.86-4.75 9.68a75.6 75.6 0 0 1-5.08 4.07c-.94.7-4.89 3.59-5.79 4.27-1.86 1.4-2.97 2.37-3.47 3.03a19.08 19.08 0 0 0-2.89 5.5c.07-.2-4.02 13.65-6.96 22.22-2.7 7.85-5.56 10.72-8.82 8.59-2.11-1.4-3.66-4.24-6.6-11.03-1.98-4.62-2.5-5.76-3.4-7.4-4.55-8.18-3.9-23.9-.05-32.87a9.6 9.6 0 0 1 6.98-5.96c2.59-.66 4.86-.75 11.78-.67l3.8.02zm0 2c-1.13 0-2.09 0-3.82-.02-12.07-.13-14.83.57-16.9 5.41-3.63 8.47-4.26 23.55-.05 31.12.96 1.73 1.48 2.88 3.5 7.58 2.72 6.3 4.24 9.08 5.86 10.14 1.64 1.08 3.5-.8 5.82-7.55a682.9 682.9 0 0 0 6.97-22.24 21.03 21.03 0 0 1 3.18-6.04c.65-.87 1.85-1.9 3.86-3.43.92-.7 4.87-3.57 5.8-4.27 2.02-1.5 3.6-2.77 4.95-3.97 3.63-3.23 5.09-5.7 4.3-7.28-1.21-2.42-5.07-2.65-12.38-1.27l-2.35.47c-5.49 1.11-6.86 1.35-8.74 1.35zm345.63 146c-3.45-12.26-3.77-14.13-3.77-19 0-3.33-.13-6.27-.43-11.34-.63-10.33-.65-13.5.26-17.07 1.21-4.74 4.21-7.1 9.67-7.1h26c4.08 0 5.19 1.85 5.93 7.11.1.79.13.97.19 1.32.84 5.35 2.8 7.58 8.88 7.58 3.64 0 5.54.4 6.43 1.37.76.83.76 1.44.36 3.93-.85 5.26.5 8.85 7.5 13.8 6.32 4.45 11.63 5.36 16.55 3.37 3.8-1.54 6.73-4.16 11.92-10l1.1-1.23 1.09-1.23a75.6 75.6 0 0 1 2.7-2.86 35.81 35.81 0 0 1 9.57-6.73c1.52-.76 1.72-.86 5.66-2.63 6.1-2.73 9.01-4.5 11.74-7.62 2.63-3 4.67-4.85 6.7-6.04 3.18-1.85 5.46-2.13 13.68-2.13 5.98 0 10.56-4.32 18-14.99l2.82-4.03c1.06-1.5 1.94-2.7 2.79-3.79 7.87-10.12 19.38-10.4 30.74.96 5.54 5.53 10.17 19.43 13.64 38.51 2.5 13.75 4.18 29.46 4.47 39.84h-1c-.3-10.32-1.96-25.97-4.45-39.66-3.43-18.87-8.02-32.65-13.36-37.99-10.95-10.95-21.76-10.68-29.26-1.04-.83 1.07-1.7 2.26-2.75 3.75l-2.81 4.02c-7.65 10.95-12.38 15.42-18.83 15.42-8.04 0-10.21.26-13.17 2-1.92 1.12-3.9 2.9-6.45 5.83-2.86 3.26-5.87 5.09-12.09 7.88a103.35 103.35 0 0 0-5.62 2.6 34.84 34.84 0 0 0-9.32 6.54 74.67 74.67 0 0 0-3.75 4.05l-1.1 1.24c-5.28 5.95-8.29 8.64-12.28 10.25-5.26 2.13-10.92 1.17-17.5-3.48-7.33-5.17-8.82-9.15-7.92-14.77.34-2.12.34-2.6-.1-3.1-.64-.69-2.34-1.04-5.7-1.04-6.63 0-8.96-2.63-9.87-8.42l-.2-1.34c-.67-4.82-1.53-6.24-4.93-6.24h-26c-5 0-7.6 2.04-8.7 6.34-.88 3.43-.85 6.57-.23 16.76a177 177 0 0 1 .43 11.4c0 4.78.32 6.63 3.81 19h-1.04zm13.68 0c-1.31-6.58-1.61-10.71-1.36-14.84.04-.7.1-1.44.18-2.38l.23-2.56c.34-3.81.5-6.97.5-11.22 0-4.94 1.46-7.76 4.21-8.42 2.38-.58 5.56.54 9.2 3 6.64 4.52 13.99 13.07 16.55 19.23 4.77 11.44 14.12 15.69 33.54 15.69 8.6 0 14.32-2.35 20.67-7.88 1.45-1.26 15.06-15 21-20 7.21-6.07 11.77-7.59 20.62-8.32 5.52-.45 7.98-.9 11.44-2.36 4.58-1.95 9.36-5.48 14.9-11.29 7.43-7.76 13.25-8.92 17.47-4.3 3.32 3.63 5.46 10.58 6.82 20.24.73 5.17.94 7.74 1.58 17.38.25 3.75.17 5.32-.92 18.03h-1c1.09-12.7 1.17-14.28.92-17.97-.64-9.6-.85-12.16-1.57-17.3-1.33-9.47-3.43-16.27-6.56-19.7-3.76-4.11-8.93-3.08-16 4.32-5.65 5.9-10.54 9.5-15.25 11.5-3.58 1.53-6.13 1.99-11.6 2.44-8.8.72-13.17 2.18-20.2 8.1-5.9 4.96-19.5 18.7-21 19.99-6.52 5.68-12.47 8.12-21.32 8.12-19.78 0-29.5-4.42-34.46-16.3-2.49-5.97-9.71-14.38-16.2-18.79-3.42-2.32-6.36-3.35-8.4-2.86-2.2.53-3.44 2.92-3.44 7.45 0 4.28-.16 7.47-.5 11.31l-.23 2.56c-.09.93-.14 1.65-.19 2.35-.24 4.08.06 8.18 1.39 14.78h-1.02zm113.75 0c2.52-3.26 8.93-11.79 10.9-14.3 5.48-6.98 13.05-12.38 19.4-13.94 7.01-1.71 11.5 1.45 11.5 9.24 0 4.02-.04 5.16-.74 19h-1c.7-13.85.74-15 .74-19 0-7.12-3.86-9.83-10.26-8.26-6.11 1.5-13.5 6.77-18.85 13.57-1.86 2.36-7.65 10.07-10.43 13.69h-1.26zm-9.86-338.96c3.44 2.71 7 5.1 11.44 7.75 1.06.64 8.42 4.9 10.35 6.1 11.27 7 15 13.35 12.35 25.33-1.45 6.52-4.53 11.1-9.39 14.44-3.83 2.63-8.07 4.26-16.08 6.56-11.97 3.45-13.68 3.99-18.82 6.28a60.18 60.18 0 0 0-7.81 4.18c-11.11 7.07-19.1 7.7-27.96 3.28-3.56-1.77-17.2-11-17.2-11.01a101.77 101.77 0 0 0-5.2-3.07c-16.04-8.83-34.27-24.16-34.52-31.85-.11-3.46 1.99-6.57 6.28-10.26 1.03-.9 2.18-1.81 3.68-2.95.72-.55 3.38-2.56 3.94-3 4.47-3.4 7.18-5.79 9.32-8.45 11.12-13.82 26.55-28.68 34.36-32.28 12.06-5.54 19.84-5.77 27.37.12 3.25 2.54 5.65 6.54 8.58 13.35.29.65 2.3 5.45 2.88 6.74 1.62 3.65 2.9 5.8 4.24 6.94.72.6 1.45 1.2 2.2 1.8zm-3.49-.28c-1.63-1.39-3.03-3.74-4.77-7.65-.58-1.3-2.6-6.12-2.88-6.76-2.81-6.5-5.08-10.3-7.98-12.56-6.83-5.35-13.85-5.15-25.3.12-7.45 3.42-22.7 18.12-33.64 31.72-2.27 2.82-5.08 5.3-9.67 8.79l-3.94 2.98a79.98 79.98 0 0 0-3.59 2.88c-3.87 3.33-5.67 6-5.58 8.69.21 6.64 18.14 21.72 33.48 30.15 1.76.97 3.5 2 5.3 3.13.12.08 13.61 9.22 17.03 10.92 8.22 4.1 15.46 3.52 26-3.18a62.17 62.17 0 0 1 8.07-4.31c5.25-2.35 7-2.9 19.08-6.38 7.8-2.24 11.9-3.82 15.5-6.3 4.44-3.04 7.23-7.18 8.56-13.22 2.44-11.02-.83-16.6-11.45-23.2-1.9-1.18-9.23-5.42-10.32-6.08-4.5-2.69-8.13-5.12-11.64-7.9-.77-.6-1.52-1.21-2.26-1.84zM87.72 241.6c4.3-2.98 7.88-5 12.14-6.95.84-.4 1.73-.78 2.78-1.24l4.37-1.88a164.3 164.3 0 0 0 17.74-8.96 320.67 320.67 0 0 1 27.87-14.5c4.22-1.95 21.89-9.84 21.17-9.52 19.17-8.62 28.1-6.93 49.5 8.05 7.91 5.54 13.24 13.25 16.45 22.66 3.02 8.83 3.76 16.51 3.76 27.75 0 8.32-.66 12.95-3.68 18.97-4.18 8.36-12.3 16.14-25.58 23.47-24.45 13.49-38.83 27.55-52.83 47.84-8.83 12.8-47.76 44.21-65.16 54.15C75.04 413.55 48.89 423.5 31 423.5c-10.05 0-14.67-4.78-14.76-13.37-.07-6.32 2.06-13.73 6.3-24.32 2.95-7.37 2.02-12.9-2.16-22.29-3.19-7.17-3.88-9.14-3.88-12.52 0-3.35 1.87-6.9 5.52-11.07 2.61-3 3.5-3.83 11.9-11.5 5.09-4.66 8.08-7.6 10.7-10.75 9.46-11.36 12.62-19.47 17.9-44.78 3.12-15.05 6.63-20.28 15.12-25.25.8-.47 3.95-2.25 4.7-2.68a76.66 76.66 0 0 0 5.38-3.38zm.56.82a77.63 77.63 0 0 1-5.44 3.43l-4.7 2.67c-8.23 4.82-11.57 9.81-14.65 24.6-5.3 25.45-8.51 33.7-18.1 45.21-2.66 3.19-5.68 6.16-10.8 10.84-8.36 7.64-9.24 8.48-11.82 11.42-3.5 4.01-5.27 7.36-5.27 10.42 0 3.18.68 5.1 3.8 12.12 4.27 9.6 5.24 15.37 2.16 23.07-4.18 10.47-6.29 17.78-6.22 23.93.08 8.06 4.26 12.38 13.76 12.38 17.67 0 43.68-9.9 64.75-21.93 17.28-9.88 56.1-41.2 64.84-53.85 14.08-20.42 28.57-34.59 53.17-48.16 13.12-7.23 21.09-14.87 25.17-23.03 2.92-5.86 3.57-10.35 3.57-18.53 0-11.13-.74-18.73-3.7-27.43-3.15-9.22-8.36-16.75-16.09-22.16-21.13-14.8-29.7-16.42-48.5-7.95.7-.32-16.96 7.56-21.17 9.5-1.7.8-3.3 1.55-4.86 2.3a319.68 319.68 0 0 0-22.93 12.17 165.3 165.3 0 0 1-17.85 9.01l-4.37 1.88c-1.04.45-1.92.84-2.76 1.23a74.56 74.56 0 0 0-11.99 6.86zm-7.6 12.2c7.7-6.25 12.3-8.17 23.68-11.27 6.12-1.67 9.12-2.95 12.31-5.72 3.8-3.3 7.47-4.52 15.86-6.1 2.75-.52 3.67-.7 5.06-1.02 5.48-1.24 9.48-2.93 13.1-5.89 10.42-8.53 25.4-14.11 36.31-14.11 5.33 0 16.77 7.58 25.74 17.16 10.73 11.46 15.96 23.27 12.73 32.5-3.18 9.1-11.39 18.57-23.03 27.86-8.44 6.73-18.36 13-25.22 16.43-3.72 1.86-6.59 4.88-9.77 9.99-.69 1.1-11.1 20.25-16.03 27.83-5.62 8.65-15.4 17.36-30.23 27.96a552.58 552.58 0 0 1-9.2 6.42c-.13.09-6.81 4.65-8.6 5.89-6.47 4.46-10.35 7.35-13.05 9.83-11.64 10.67-37.14 15.54-43.7 8.98-1.96-1.96-2.2-4.06-1.95-10.52.37-9.42-.5-14.5-4.95-20.51a34.09 34.09 0 0 0-7.04-6.92c-3.93-2.95-6.07-6.11-6.56-9.49-.97-6.61 3.87-13.06 14.17-21.69 1.58-1.32 6.67-5.44 7.09-5.78a48.03 48.03 0 0 0 5.23-4.77c4.1-4.63 5.85-9.55 7.8-20.07a501.52 501.52 0 0 0 .8-4.37c.33-1.87.6-3.3.88-4.73.74-3.78 1.5-7.18 2.4-10.63 1-3.78 1.38-5.5 2.36-10.37.6-3.02.93-4.21 1.56-5.47 1.22-2.45 1.27-2.5 12.25-11.42zm.64.78c-10.77 8.74-10.88 8.84-12 11.08-.58 1.16-.88 2.3-1.47 5.22-.98 4.89-1.36 6.63-2.37 10.44-.9 3.43-1.65 6.8-2.39 10.56a339.79 339.79 0 0 0-1.29 6.95l-.39 2.15c-1.98 10.68-3.77 15.74-8.04 20.54a48.77 48.77 0 0 1-5.34 4.88c-.42.34-5.5 4.47-7.07 5.78-10.04 8.4-14.72 14.65-13.83 20.78.45 3.1 2.44 6.03 6.17 8.83 3 2.25 5.39 4.62 7.24 7.12 4.63 6.24 5.52 11.52 5.15 21.15-.25 6.14-.01 8.1 1.66 9.78 6.1 6.1 31.02 1.33 42.31-9.02 2.75-2.52 6.66-5.43 13.16-9.92l8.6-5.89c3.63-2.48 6.45-4.44 9.19-6.4 14.73-10.54 24.44-19.18 29.97-27.7 4.9-7.54 15.31-26.68 16.02-27.8 3.27-5.26 6.26-8.41 10.18-10.37 6.79-3.4 16.65-9.63 25.03-16.32 11.52-9.18 19.61-18.53 22.72-27.4 3.07-8.78-2.02-20.27-12.52-31.49-8.8-9.4-20.04-16.84-25.01-16.84-10.67 0-25.43 5.5-35.68 13.89-3.76 3.07-7.9 4.81-13.5 6.09-1.41.32-2.35.5-5.11 1.02-8.21 1.55-11.76 2.73-15.38 5.88-3.34 2.9-6.45 4.22-12.7 5.92-11.26 3.07-15.75 4.94-23.31 11.09zM212 251.85c0 7.56-.6 10.92-2.6 14.3-1.1 1.84-7.66 10.05-8.6 11.3-5.96 7.94-9.33 10.28-17.26 13.76-1.34.58-2.2 1-3.03 1.5-.55.33-1.2.66-2 1.02-.71.33-4.46 1.9-5.52 2.39-6.05 2.78-8.99 5.8-8.99 10.73 0 10.97-18.95 36.12-34.51 44.87-8.18 4.6-21.3 9.36-32.78 11.86-13.33 2.9-22.49 2.48-24.62-2.32-1.32-2.97-4.4-4.26-11.98-5.81l-.6-.12c-4.84-.99-6.94-1.55-9.03-2.64-2.92-1.5-4.48-3.7-4.48-6.84 0-2.74 1.08-5.77 3.25-9.67.85-1.53 1.82-3.13 3.23-5.35-.16.25 2.83-4.4 3.67-5.76 6.69-10.7 9.85-18.5 9.85-27.22 0-18.41 11.22-33.37 27.5-42.86 5.22-3.05 9.23-3.31 15.2-2.12 5.04 1 6.05.9 7.43-1.52 4.5-7.85 7.04-9.5 15.87-9.5 3.93 0 6.97-.98 10.47-3.16 1.56-.97 8.67-6.17 10.99-7.68 9.2-5.98 11.34-7 25.2-11.95 6.95-2.48 15.18 1.28 22.33 9.12 6.55 7.19 11.01 16.61 11.01 23.67zm-2 0c0-6.5-4.25-15.48-10.49-22.32-6.67-7.32-14.16-10.74-20.17-8.59-13.73 4.9-15.73 5.85-24.8 11.75-2.24 1.46-9.37 6.68-11.01 7.7-3.8 2.36-7.2 3.46-11.53 3.46-8.08 0-9.98 1.23-14.13 8.5-1.1 1.91-2.51 2.88-4.35 3.09-1.3.14-1.9.05-5.22-.61-5.53-1.1-9.07-.88-13.8 1.88-15.72 9.17-26.5 23.55-26.5 41.14 0 9.2-3.28 17.29-10.15 28.28l-3.68 5.77c-1.39 2.19-2.35 3.77-3.17 5.25-2.02 3.63-3 6.38-3 8.7 0 4.19 2.87 5.67 11.9 7.52l.61.12c8.27 1.7 11.7 3.13 13.4 6.95 3.17 7.14 36 0 54.6-10.46 14.98-8.43 33.49-32.99 33.49-43.13 0-5.9 3.47-9.48 10.16-12.55 1.1-.5 4.85-2.08 5.52-2.38.74-.34 1.32-.64 1.8-.93.92-.55 1.85-1 3.25-1.62 7.65-3.35 10.75-5.5 16.47-13.12 1.02-1.36 7.47-9.42 8.47-11.11 1.79-3.01 2.33-6.06 2.33-13.3zm-37.18-22.4c.15-.1 2.4-1.51 2.95-1.84.96-.57 1.7-.94 2.43-1.17 2.57-.83 5.06-.1 11.04 3.12 14.86 8 19.43 22.87 9.18 38.71-4.04 6.24-9.37 9-18.72 11.11-.85.2-1.2.27-3.13.68-6.04 1.29-8.78 2.08-11.6 3.65-3.63 2.02-6.09 4.98-7.5 9.44-7.87 24.93-19.72 43.34-36.28 50.31-16.45 6.93-21.13 8.53-27.98 8.89-4.94.25-9.8-.65-15.4-2.89a44.45 44.45 0 0 1-5.64-2.6c-4.02-2.33-5.14-4.74-4.5-9.31.3-2.13 3.77-15.53 4.84-20.65.63-3.05 1.19-6.14 1.75-9.69a464.04 464.04 0 0 0 1.35-8.9c1.42-9.41 2.5-14.27 4.49-18.65 2.46-5.43 6.13-9.03 11.72-11.13 6.59-2.47 10.54-3.1 18.03-3.53 4.75-.27 6.68-.64 9-2.05.61-.37 1.22-.81 1.82-1.33a30.61 30.61 0 0 0 3.37-3.4c.59-.69 2.38-2.9 2.63-3.19 3.36-4 6.3-5.53 12.33-5.53 3.94 0 5.9-.92 8.18-3.36-.17.18 2.75-3.14 3.85-4.22a30.95 30.95 0 0 1 6.79-5c1.5-.83 3.15-1.62 4.99-2.38a64.92 64.92 0 0 0 10.01-5.1zm-14.52 8.34a29.95 29.95 0 0 0-6.57 4.84 116.68 116.68 0 0 0-3.82 4.2c-2.46 2.63-4.68 3.67-8.91 3.67-5.72 0-8.39 1.39-11.57 5.17-.23.28-2.03 2.5-2.63 3.2a31.6 31.6 0 0 1-3.47 3.51c-.65.55-1.3 1.03-1.96 1.43-2.5 1.51-4.55 1.9-9.47 2.19-7.39.42-11.25 1.04-17.72 3.47-5.34 2-8.82 5.4-11.17 10.6-1.93 4.27-3 9.07-4.41 18.39l-.65 4.34-.7 4.57c-.57 3.56-1.12 6.67-1.76 9.73-1.08 5.18-4.54 18.53-4.83 20.59-.59 4.17.35 6.18 4.01 8.3 1.35.77 3.1 1.58 5.52 2.55 5.46 2.18 10.18 3.05 14.97 2.8 6.69-.34 11.32-1.93 27.65-8.8 16.21-6.83 27.92-25.01 35.71-49.7 1.49-4.7 4.12-7.86 7.97-10 2.93-1.63 5.74-2.45 11.87-3.76 1.92-.4 2.28-.49 3.12-.68 9.12-2.06 14.24-4.7 18.1-10.67 9.92-15.34 5.55-29.55-8.82-37.29-5.75-3.1-8.03-3.76-10.25-3.05-.65.2-1.33.54-2.23 1.08-.55.32-2.77 1.72-2.93 1.82a65.91 65.91 0 0 1-10.16 5.17c-1.8.75-3.42 1.52-4.89 2.33zm-42.39 32.72c16.15-2.87 26.36-.97 32.47 6.16 5.08 5.93 1.13 21.42-5.93 35.55-4.79 9.58-10.6 16.21-23.16 25.19-14.15 10.1-35.5 12.2-40.71 3.85-1.86-2.97-2.1-8.14-1.06-15.73.78-5.68 1.86-10.71 4.73-22.98l.12-.51c1.59-6.8 2.37-10.31 3.14-14.14 1.45-7.25 3.74-11.47 7.26-13.74 2.81-1.8 5.53-2.28 12.33-2.62 5.33-.27 7.56-.46 10.81-1.03zm.18.98c-3.3.59-5.56.78-10.94 1.05-6.62.33-9.23.78-11.84 2.46-3.25 2.1-5.42 6.09-6.82 13.1-.77 3.84-1.56 7.35-3.15 14.17l-.12.5c-2.86 12.24-3.93 17.26-4.7 22.9-1.03 7.36-.79 12.36.9 15.07 4.82 7.7 25.54 5.67 39.29-4.15 12.43-8.88 18.13-15.39 22.84-24.81 6.86-13.72 10.75-29 6.07-34.45-5.84-6.81-15.7-8.65-31.53-5.84zM132 276.5c7.12 0 10.66 3.08 11.25 8.7.42 4.02-.43 8.14-2.77 15.94-2.56 8.52-18.36 25.38-27.2 31.28-7.01 4.67-20.02 5.67-26.57.99-3.99-2.85-3.53-12.08.02-26.46.68-2.75 1.47-5.65 2.37-8.76a412.6 412.6 0 0 1 3.05-10.14l.37-1.2c1.48-4.8 5.1-7.75 10.73-9.27 4.4-1.2 9.54-1.5 17.48-1.33l3.89.1c3.87.11 5.42.15 7.38.15zm0 1c-1.97 0-3.53-.04-7.41-.15l-3.88-.1c-7.85-.17-12.92.13-17.2 1.3-5.32 1.43-8.67 4.16-10.03 8.6a1277.83 1277.83 0 0 1-1.6 5.21c-.68 2.2-1.27 4.17-1.82 6.1-.9 3.1-1.68 5.99-2.36 8.73-3.43 13.88-3.87 22.93-.4 25.4 6.17 4.42 18.73 3.45 25.42-1 8.66-5.78 24.33-22.49 26.8-30.73 2.3-7.67 3.14-11.71 2.73-15.56-.53-5.1-3.64-7.8-10.25-7.8zm-17.79 7a31.3 31.3 0 0 1 8.57 1.4c5.42 1.78 8.72 5.03 8.72 10.1 0 9.59-9.51 17.2-22.34 21.47-9.82 3.28-13.62-1.79-11.66-16.54.84-6.28 3.82-10.67 8.24-13.46a20.38 20.38 0 0 1 8.47-2.97zm-.6 1.08a19.39 19.39 0 0 0-7.34 2.73c-4.18 2.64-6.98 6.78-7.77 12.76-1.89 14.11 1.36 18.45 10.34 15.46C121.3 312.37 130.5 305 130.5 296c0-4.56-2.98-7.5-8.03-9.15a28.05 28.05 0 0 0-8.2-1.35c-.13 0-.35.03-.66.08zm80.87-23.45c-2.72 9.8-14.93 9.86-26.72 3.3-10.17-5.64-13.8-17.98-5-22.87a66.53 66.53 0 0 0 4.48-2.7l2.03-1.3a50.15 50.15 0 0 1 3.92-2.3c4.73-2.43 8.82-2.8 14-.72 9.16 3.66 10.98 13.33 7.3 26.6zm-20.83-24.98a49.26 49.26 0 0 0-3.84 2.25l-2.03 1.3c-.84.53-1.5.95-2.16 1.35-.82.5-1.6.96-2.38 1.39-7.94 4.4-4.59 15.8 5 21.12 11.31 6.29 22.8 6.23 25.28-2.7 3.57-12.83 1.85-21.97-6.7-25.4-4.9-1.95-8.69-1.62-13.17.7zm17.85 12.15c0 5.7-2.44 9-6.64 9.96-3.3.76-7.56-.05-11.08-1.81l-1.89-.94c-.67-.34-1.18-.62-1.63-.88-4.07-2.38-4.13-4.97.34-10.93 6.8-9.06 20.9-7.16 20.9 4.6zm-1 0c0-5.3-2.87-8.55-7.32-9.16-4.23-.57-8.99 1.44-11.78 5.16-4.15 5.54-4.1 7.44-.64 9.47.44.25.93.51 1.59.85l1.87.93c3.34 1.67 7.36 2.44 10.42 1.74 3.73-.86 5.86-3.74 5.86-9zm196.5 281c0-12.8 2.44-16.74 18.48-29.77a56.8 56.8 0 0 1 7.61-5.2c2.6-1.5 5.33-2.82 8.5-4.18 1.24-.53 2.48-1.05 4.1-1.7l3.92-1.57c9.4-3.83 13.74-6.7 16.62-12.05 1.2-2.22 2.21-4.4 3.23-6.83a148.57 148.57 0 0 0 1.54-3.84l.3-.74.56-1.44c3.2-8.02 6.05-12.08 12.7-16.5a35.26 35.26 0 0 0 4.96-4 46.36 46.36 0 0 0 3.88-4.29c.27-.34 2.55-3.2 3.2-3.98 3.48-4.15 6.51-5.9 11.51-5.9 3.08 0 5.62-.63 9.57-2.1 5.42-2.02 6.53-2.34 8.96-2.2 2.53.13 4.85 1.26 7.18 3.59 1.3 1.3 5.55 5.83 6.52 6.78 5.06 5 9.44 6.92 17.77 6.92a197.5 197.5 0 0 1 12.08.45c15.93.87 21.94.57 25.28-2.21 6.91-5.77 11.64-2.73 11.64 7.76 0 10.73-8.6 20-19 20-4.8 0-8.32 1.43-9.34 3.67-1.12 2.48.68 6.15 5.98 10.57 13.6 11.33 11.24 20.76-7.64 20.76a21.91 21.91 0 0 0-14.6 5.24c-3.28 2.71-5.8 5.86-9.85 11.82l-1.52 2.25c-3.1 4.57-5.01 7.1-7.32 9.4-6.21 6.21-9.3 7.64-13.05 6.89l-1-.23a10.82 10.82 0 0 0-2.66-.37c-1.6 0-2.41.67-8.18 6.22-4.85 4.67-8.07 6.78-11.82 6.78-1.33 0-3.46 1.15-6.45 3.45-1.27.98-2.68 2.14-4.5 3.7l-4.92 4.29a181.11 181.11 0 0 1-4.54 3.82c-9.33 7.56-15.63 10.2-20.21 6.52-2.7-2.15-4.14-4.51-4.63-7.26-.37-2.04-.26-3.63.29-7.3.87-5.85.65-8.42-1.83-11.6-2.32-2.98-2.96-3.22-3.77-2.39-.25.26-1.35 1.63-1.61 1.94-2.21 2.5-4.85 3.57-9 2.82-4.6-.84-5.57-4.11-4.72-10.09l.24-1.56c.6-3.66.68-4.93.25-5.8-.44-.86-1.9-.94-5.23.4l-.74.29c-13.78 5.54-15.26 6.09-19.43 6.67-6.03.84-9.31-1.6-9.31-7.9zm2 0c0 5 2.14 6.6 7.04 5.92 3.91-.55 5.43-1.1 18.95-6.55l.75-.3c4.17-1.66 6.7-1.54 7.76.58.71 1.43.62 2.76-.06 7l-.24 1.53c-.72 5.04-.06 7.27 3.09 7.84 3.43.62 5.38-.17 7.15-2.18.2-.23 1.34-1.66 1.68-2 1.9-1.96 3.82-1.25 6.78 2.55 2.9 3.74 3.17 6.77 2.22 13.12-1 6.75-.52 9.4 3.62 12.71 3.49 2.8 9.1.45 17.7-6.51 1.35-1.1 2.75-2.28 4.49-3.78l4.93-4.3c1.84-1.58 3.27-2.76 4.58-3.77 3.34-2.56 5.74-3.86 7.67-3.86 3.04 0 5.95-1.9 10.43-6.22l2.46-2.39c.94-.89 1.67-1.56 2.37-2.13 1.81-1.49 3.3-2.26 4.74-2.26 1.03 0 1.81.13 3.1.42.7.16.71.17.96.21 2.96.6 5.45-.55 11.23-6.33 2.2-2.2 4.06-4.65 7.09-9.11l1.52-2.25c4.15-6.11 6.76-9.37 10.22-12.24a23.9 23.9 0 0 1 15.88-5.7c16.87 0 18.62-7.01 6.36-17.23-5.9-4.92-8.12-9.41-6.52-12.93 1.42-3.12 5.67-4.84 11.16-4.84 9.25 0 17-8.34 17-18 0-8.94-2.88-10.79-8.36-6.23-3.94 3.28-9.98 3.59-26.67 2.68l-1.02-.06c-5.09-.27-7.99-.39-10.95-.39-8.88 0-13.76-2.14-19.18-7.5-1-.98-5.26-5.53-6.53-6.79-1.99-1.99-3.86-2.9-5.87-3-2.03-.12-3.06.18-8.15 2.07-4.15 1.55-6.9 2.22-10.27 2.22-4.33 0-6.84 1.46-9.98 5.2-.63.74-2.89 3.6-3.18 3.95a48.29 48.29 0 0 1-4.04 4.46 37.26 37.26 0 0 1-5.24 4.23c-6.26 4.17-8.9 7.91-11.95 15.58l-.57 1.43-.28.74a531.5 531.5 0 0 1-1.56 3.88 77.49 77.49 0 0 1-3.32 7c-3.16 5.88-7.82 8.97-17.63 12.96l-3.92 1.58c-1.6.64-2.84 1.15-4.05 1.67a79.2 79.2 0 0 0-8.3 4.08 54.8 54.8 0 0 0-7.35 5.02c-15.62 12.7-17.74 16.13-17.74 28.23zm133.22-79.76c3.06 1.53 6.54 2.02 10.68 1.7 2.53-.2 4.91-.62 8.8-1.49 5.36-1.19 6.33-1.38 8.33-1.54 2.78-.23 4.82.17 6.29 1.4 1.58 1.31 1.96 2.72 1.26 4.22-.66 1.38-1.05 1.74-5.05 5.07-3.53 2.93-5.03 4.83-5.03 7.09 0 7.3 1.29 10.02 7.83 15.62 3.86 3.3 5.93 6.84 5.28 9.62-.75 3.25-4.96 5.02-12.61 5.02-7.18 0-12.7 4.61-20.03 14.68-.5.7-3.96 5.57-4.94 6.87a38.89 38.89 0 0 1-4.72 5.5c-1.06.98-2.09 1.7-3.1 2.15-2.85 1.26-5.05 1.57-9.83 1.74-7.66.27-10.87 1.45-14.98 7.1-1.58 2.17-3.11 4-4.68 5.6a42.87 42.87 0 0 1-8.65 6.69c-.15.08-10.69 6.19-14.8 8.83-3.76 2.42-6.45 2.04-8.22-.77-1.28-2.03-1.9-4.54-2.87-10.35-.84-5.08-1.27-7.08-2.06-8.93-.97-2.3-2.21-3.24-4.02-2.88-6.2 1.24-8.95 1.39-10.98.2-2.37-1.4-3.13-4.62-2.62-10.73.16-1.96-1.04-2.87-3.76-3.04-2.24-.13-4.9.2-9.94 1.12l-.69.12c-7.97 1.45-10.72 1.72-12.72.73-2.91-1.43-1.6-5.27 4.23-12.21 5.48-6.53 10.6-10.81 15.76-13.53 3.74-1.97 5.94-2.65 12.16-4.1 7.29-1.72 10.4-3.51 14.04-9.31 2.96-4.75 10.74-18.62 12.14-20.84 3.59-5.67 6.8-9.1 11.05-11.34 2.6-1.38 4.72-2.82 9.17-6.07l1.38-1.01c7.85-5.72 12.3-7.98 17.68-7.98 4.22 0 6.49 1.36 9.13 4.77.34.43 1.67 2.22 2 2.67.85 1.09 1.6 1.98 2.45 2.83a24.29 24.29 0 0 0 6.64 4.78zm-.44.9c-2.8-1.4-5-3.03-6.92-4.97-.87-.9-1.65-1.81-2.51-2.93-.35-.46-1.68-2.25-2.01-2.67-2.47-3.18-4.46-4.38-8.34-4.38-5.09 0-9.4 2.2-17.09 7.78l-1.38 1.01c-4.49 3.29-6.63 4.74-9.3 6.15-4.06 2.15-7.16 5.45-10.66 11-1.39 2.19-9.16 16.05-12.15 20.82-3.79 6.07-7.13 7.98-14.66 9.75-6.13 1.45-8.27 2.1-11.92 4.02-5.04 2.66-10.05 6.86-15.46 13.3-5.43 6.46-6.53 9.69-4.55 10.66 1.7.84 4.48.57 12.1-.81l.7-.13c5.12-.93 7.82-1.27 10.17-1.12 3.21.2 4.92 1.48 4.7 4.11-.48 5.76.2 8.64 2.13 9.78 1.73 1.02 4.34.88 10.27-.31 2.35-.47 4 .78 5.14 3.47.83 1.95 1.27 4 2.07 8.8l.06.36c.94 5.65 1.55 8.11 2.72 9.98 1.46 2.3 3.52 2.6 6.84.46 4.14-2.66 14.69-8.77 14.81-8.85a41.9 41.9 0 0 0 8.46-6.54 47.89 47.89 0 0 0 4.6-5.48c4.32-5.95 7.81-7.23 15.74-7.5 4.66-.17 6.76-.47 9.46-1.67.9-.4 1.85-1.06 2.84-1.96a38.03 38.03 0 0 0 4.6-5.36c.96-1.3 4.4-6.16 4.93-6.87 7.5-10.31 13.22-15.09 20.83-15.09 7.24 0 11.02-1.6 11.64-4.24.54-2.32-1.36-5.55-4.97-8.64-6.75-5.79-8.17-8.79-8.17-16.38 0-2.67 1.64-4.74 5.39-7.86 3.8-3.17 4.23-3.56 4.78-4.73.5-1.06.25-1.99-.99-3.03-2.23-1.85-4.72-1.65-13.76.36-3.93.87-6.35 1.3-8.94 1.5-4.3.34-7.97-.18-11.2-1.8zm-28-3.9c5.65-2.82 8.96-2.2 12.9 1.37.56.5 2.6 2.47 3.02 2.87 4.2 3.89 8.07 5.71 14.3 5.71 11.37 0 14 1.41 16.1 8.09.26.83 1.35 4.6 1.66 5.62.8 2.63 1.64 5.03 2.7 7.6 2.13 5.17 2.64 8.32 1.72 10.24-.77 1.61-2.1 2.18-5.37 2.79-2.32.43-2.8.53-3.85.85-1.85.58-3.35 1.4-4.6 2.66-1 1-2.02 2.13-3.31 3.66-.6.71-2.91 3.5-3.46 4.14-7.2 8.54-12.43 12.35-19.59 12.35-3.76 0-6.95 1.28-10.59 4-1.84 1.37-11.62 10.31-15.22 13.06a73.09 73.09 0 0 1-8.95 5.88c-4.58 2.54-7.35 3.22-8.98 2.23-1.32-.8-1.65-2.07-1.94-5.5a52.53 52.53 0 0 0-.16-1.81c-.54-4.73-2.24-6.86-7.16-6.86-7.11 0-8.85-1.23-9.73-5.41-.96-4.61-2.1-6.7-6.55-9.67-3.97-2.65-4.31-5.42-1.52-8.22 2-2 4.63-3.5 11.35-6.87 6.61-3.3 9.2-4.8 11.1-6.68a39.09 39.09 0 0 0 5.3-6.48c.98-1.5 1.83-3.04 2.88-5.13l2.12-4.3c.91-1.83 1.72-3.37 2.61-4.98 5.74-10.32 10.37-14.78 23.22-21.2zm-22.34 21.7c-.89 1.59-1.69 3.12-2.6 4.94l-2.11 4.3a52.9 52.9 0 0 1-2.94 5.23 40.08 40.08 0 0 1-5.44 6.63c-2 2-4.62 3.51-11.35 6.87-6.6 3.3-9.2 4.8-11.1 6.69-2.33 2.34-2.08 4.37 1.38 6.67 4.7 3.14 5.96 5.46 6.97 10.3.78 3.7 2.09 4.62 8.75 4.62 5.5 0 7.57 2.57 8.15 7.75.06.5.09.82.17 1.84.25 3.06.55 4.17 1.46 4.72 1.2.74 3.69.13 7.98-2.25a72.09 72.09 0 0 0 8.82-5.8c3.55-2.7 13.34-11.65 15.24-13.07 3.79-2.83 7.18-4.19 11.18-4.19 6.77 0 11.8-3.67 18.83-12l3.45-4.13a60.07 60.07 0 0 1 3.37-3.72 11.72 11.72 0 0 1 5.01-2.91c1.1-.34 1.6-.45 3.97-.89 2.95-.55 4.07-1.02 4.65-2.23.76-1.59.28-4.5-1.74-9.43a84.46 84.46 0 0 1-2.74-7.69c-.31-1.03-1.4-4.8-1.66-5.61-1.95-6.2-4.16-7.39-15.14-7.39-6.5 0-10.61-1.93-14.98-5.98-.44-.4-2.46-2.37-3.01-2.86-3.65-3.3-6.52-3.85-11.79-1.21-12.67 6.33-17.15 10.65-22.78 20.8zm55.86 11.93c-2.98 6.45-16.78 15.26-26.74 15.26-5.33 0-7.56-2.98-7.11-7.86.32-3.48 2.1-7.91 3.93-10.61l1.52-2.32a44.95 44.95 0 0 1 1.88-2.7c3.66-4.8 7.85-7.45 13.62-7.45 9.06 0 15.75 9.52 12.9 15.68zm-.9-.42c2.52-5.47-3.65-14.26-12-14.26-5.4 0-9.33 2.48-12.82 7.06-.6.8-1.17 1.6-1.85 2.64 0 0-1.2 1.87-1.52 2.33-1.74 2.57-3.46 6.85-3.77 10.14-.4 4.33 1.43 6.77 6.12 6.77 9.57 0 23.02-8.58 25.83-14.68zm-69.67 20.74c2.08.18 4.44.81 5.88 1.8 2.12 1.47 2.2 3.6-.26 6.05-5.14 5.15-12.85 4.34-12.85-1.35 0-4.66 3.14-6.84 7.23-6.5zm-.09 1c-3.56-.3-6.14 1.5-6.14 5.5 0 4.58 6.53 5.26 11.15.65 2.03-2.04 1.98-3.43.4-4.52-1.27-.88-3.48-1.47-5.4-1.63zm29.59-225.95c4.64 2.35 17.27 8.24 19.39 9.43a24.14 24.14 0 0 1 7.05 5.64 45.03 45.03 0 0 1 3.75 5.2c2.4 3.78.04 7.66-6.2 11.63-4.97 3.16-12.18 6.3-21.95 9.82-4.84 1.74-19.63 6.68-21.1 7.2-6.59 2.33-14.85.1-25.14-5.86-3.93-2.27-8-5-12.94-8.54-2.23-1.61-9.5-6.99-10.7-7.85a81.21 81.21 0 0 0-8.63-5.7c-4.82-2.6-4.45-6.64.17-12.13 3.27-3.88 4.17-4.67 18.1-16.33a230.2 230.2 0 0 0 8.89-7.74 95.2 95.2 0 0 0 4.72-4.66c5.08-5.43 9.8-6.49 14.97-3.92 2.24 1.1 4.53 2.85 7.43 5.52 1.48 1.37 6.94 6.72 7.98 7.7 5.2 4.91 9.46 8.2 14.2 10.6zm-.46.9c-4.85-2.45-9.18-5.79-14.44-10.76-1.05-1-6.5-6.34-7.97-7.69-2.83-2.61-5.06-4.3-7.2-5.37-4.75-2.36-9-1.4-13.8 3.71a96.18 96.18 0 0 1-4.76 4.71c-2.48 2.3-5.16 4.62-8.92 7.77-13.86 11.6-14.77 12.4-17.98 16.21-4.28 5.08-4.58 8.4-.46 10.61 2.23 1.2 4.9 2.99 8.74 5.77 1.2.87 8.47 6.24 10.7 7.85a154.8 154.8 0 0 0 12.85 8.49c10.06 5.82 18.07 7.98 24.3 5.78 1.48-.52 16.27-5.47 21.1-7.2 9.7-3.5 16.86-6.61 21.75-9.72 5.84-3.71 7.9-7.1 5.9-10.26a44.09 44.09 0 0 0-3.67-5.08 23.16 23.16 0 0 0-6.78-5.42c-2.08-1.16-14.68-7.05-19.36-9.4zm-38.83 8.05c3.11-.37 5.7-.13 8.4.7 2.15.66 2.74.93 8.64 3.77 4.75 2.29 8.39 3.86 13.19 5.56 8.38 2.97 11.32 6.23 8.83 9.76-2.08 2.94-8.04 5.92-17.84 9.18-8.45 2.82-15.48 2.35-21.43-.9-4.65-2.55-8.33-6.5-12.15-12.3-2.9-4.41-2.73-8.2.16-11.06 2.48-2.45 6.87-4.07 12.2-4.7zm.12 1c-5.13.6-9.33 2.16-11.62 4.42-2.53 2.5-2.68 5.77-.02 9.8 3.73 5.68 7.3 9.51 11.8 11.97 5.7 3.11 12.43 3.57 20.62.84 9.59-3.2 15.44-6.12 17.34-8.82 1.94-2.75-.5-5.45-8.35-8.24-4.84-1.72-8.5-3.3-13.28-5.6-5.84-2.81-6.42-3.07-8.5-3.71a18.42 18.42 0 0 0-8-.66zM202.5 500.38c0 4.78-1.45 7.56-4.43 8.93-2.29 1.05-4.55 1.23-10.79 1.2l-1.78-.01c-9.19 0-17-7.65-17-15.5 0-7.59 10.6-10.51 19.74-5.44 2.78 1.55 4.21 1.94 8.57 2.75 4.44.83 5.69 2.27 5.69 8.07zm-1 0c0-5.3-.9-6.34-4.88-7.08-4.45-.83-5.96-1.25-8.86-2.86-8.57-4.76-18.26-2.1-18.26 4.56 0 7.3 7.36 14.5 16 14.5h1.79c6.06.04 8.26-.14 10.36-1.1 2.6-1.2 3.85-3.6 3.85-8.02zm33.33-117.85c3.71-1.31 8.7-2.7 16.1-4.55 2.58-.65 16.53-4.04 20.56-5.05 19.59-4.93 31.55-8.9 38.23-13.35 14.93-9.95 36.87-33.88 43.83-47.8 2.25-4.5 4.65-6.38 7.68-6.25 1.26.06 2.61.45 4.32 1.2a50.81 50.81 0 0 1 3.54 1.7l1.26.63c4.78 2.34 8.38 3.44 12.65 3.44 7.2 0 10.01 3.07 8.35 7.91-1.4 4.06-5.92 8.91-11.1 12.02-8.3 4.98-11.75 17.3-11.75 33.57 0 3.59-1.37 6.28-3.98 8.36-1.98 1.58-4.2 2.6-8.47 4.16l-1.02.37c-4.85 1.75-6.98 2.77-8.68 4.46-5.09 5.1-12.54 7.15-20.35 7.15-1.38 0-2.47.92-3.99 3.1-.29.41-1.32 1.95-1.47 2.18-2.68 3.92-4.93 5.72-8.54 5.72-7.84 0-10.74.93-21.76 6.94-5.18 2.82-8.8 3.58-14.66 3.68-.26 0-.47 0-.92.02-4.82.06-7.12.3-10.51 1.34a73.43 73.43 0 0 0-8.89 3.56c-2.17 1-10.53 5.01-10.23 4.87-7.79 3.7-13.32 5.98-18.9 7.57-12.41 3.55-18.58 2.24-27.42-4.07-2.58-1.85-2.72-4.43-.83-7.62 1.45-2.45 3.9-5.09 8.08-8.97l1.78-1.64c3.92-3.6 4.48-4.11 5.9-5.53 2.32-2.32 3.12-3.5 5.48-7.63 1.93-3.36 3.37-5.11 6.27-7.06 2.3-1.54 5.34-2.98 9.44-4.43zm.34.94c-4.03 1.42-7 2.83-9.22 4.32-2.75 1.85-4.1 3.49-5.96 6.73-2.4 4.2-3.24 5.44-5.64 7.83-1.43 1.44-2 1.96-5.94 5.57l-1.77 1.63c-4.1 3.82-6.52 6.41-7.9 8.75-1.65 2.79-1.54 4.8.55 6.3 8.6 6.14 14.46 7.38 26.57 3.92 5.5-1.57 11-3.84 18.74-7.51-.3.14 8.06-3.88 10.24-4.88a74.3 74.3 0 0 1 9.01-3.6c3.51-1.09 5.89-1.33 10.8-1.4h.91c5.72-.1 9.18-.83 14.2-3.57 11.16-6.08 14.2-7.06 22.24-7.06 3.19 0 5.2-1.6 7.71-5.28l1.48-2.2c1.7-2.43 3-3.52 4.81-3.52 7.57 0 14.78-2 19.65-6.85 1.83-1.84 4.04-2.9 9.04-4.7l1.02-.37c8.6-3.13 11.79-5.67 11.79-11.58 0-16.6 3.53-29.2 12.24-34.43 5-3 9.35-7.67 10.66-11.48 1.42-4.13-.83-6.59-7.4-6.59-4.45 0-8.19-1.14-13.09-3.54-7.52-3.67-6.78-3.34-8.72-3.43-2.58-.1-4.65 1.52-6.74 5.7-7.04 14.07-29.1 38.14-44.17 48.19-6.81 4.54-18.84 8.52-38.55 13.48-4.03 1.02-17.98 4.4-20.56 5.05-7.37 1.84-12.33 3.23-16 4.52zM252 387.5c2.08 0 4-.2 7.25-.69 5.22-.77 6.64-.9 8.46-.5 2.52.56 3.79 2.35 3.79 5.69 0 4.05-2.27 7.29-6.62 10.11-3.24 2.1-6.53 3.53-14.15 6.4l-.27.1-2.28.86c-3.04 1.16-5.27 2.52-9.33 5.43l-.8.57c-8.19 5.88-13.35 8.03-23.05 8.03-4.98 0-6.88-2.03-5.75-5.62.87-2.81 3.58-6.56 7.8-11.13 1.26-1.37 2.64-2.8 4.15-4.3 3.17-3.14 11.25-10.61 11.45-10.8.46-.47.93-.89 1.4-1.26 3.38-2.71 5.77-3.08 14.18-2.93 1.65.03 2.63.04 3.77.04zm0 1c-1.15 0-2.13-.01-3.79-.04-8.18-.14-10.4.2-13.54 2.71-.44.35-.88.74-1.32 1.18-.2.21-8.3 7.69-11.45 10.82a134.6 134.6 0 0 0-4.12 4.26c-4.12 4.47-6.76 8.12-7.58 10.75-.9 2.88.45 4.32 4.8 4.32 9.46 0 14.44-2.07 22.46-7.84l.8-.57c4.13-2.96 6.42-4.36 9.56-5.56l2.3-.86.25-.1c7.55-2.84 10.8-4.25 13.97-6.3 4.08-2.65 6.16-5.6 6.16-9.27 0-2.89-.97-4.26-3-4.7-1.65-.37-3.05-.25-8.1.5-3.3.5-5.26.7-7.4.7zm112.47-45.34c-1.88 5.44-1.98 6.76-.98 12.76 1.18 7.06-1.38 16.58-5.49 16.58a16.89 16.89 0 0 0-1.51.07l-.64.04c-2.86.18-4.83.17-6.94-.17-6.55-1.06-10.41-5.14-10.41-13.44 0-13.9 2.14-19.69 8.13-26.33a21.9 21.9 0 0 0 2.52-3.75c.59-1.03 2.78-5.13 2.72-5.01 4.44-8.14 7.71-11.53 12.25-10.4 1.17.3 2.2.77 3.58 1.59l1.39.84a20 20 0 0 0 3.1 1.6c.7.27 1.8.32 4.75.26l.72-.01c3.16-.05 4.78.08 5.83.66 1.61.89 1.2 2.56-1.14 4.9a215.9 215.9 0 0 1-3.86 3.76c-10.6 10.1-12.75 12.4-14.02 16.05zm-.94-.32c1.34-3.9 3.46-6.17 14.27-16.46 1.55-1.47 2.73-2.62 3.85-3.73 1.94-1.95 2.17-2.88 1.35-3.33-.82-.45-2.37-.58-5.32-.53l-.72.01c-3.14.06-4.26.02-5.14-.34-1.06-.41-1.97-.9-3.25-1.67l-1.38-.83a12.1 12.1 0 0 0-3.31-1.47c-3.88-.97-6.92 2.17-11.13 9.9.07-.13-2.14 3.98-2.73 5.02a22.71 22.71 0 0 1-2.65 3.92c-5.81 6.47-7.87 12-7.87 25.67 0 7.79 3.48 11.47 9.57 12.45 2.01.33 3.92.34 6.71.16a371.33 371.33 0 0 0 1.23-.07c.42-.03.73-.04.99-.04 3.2 0 5.6-8.9 4.5-15.42-1.02-6.16-.91-7.64 1.03-13.24zm-9.26 12.42c.58.52 2.5 1.9 2.55 1.93 1.96 1.57 2.04 3.31.01 6.36-3.74 5.64-8.83 3.09-8.83-4.55 0-3.81.51-5.67 2.07-6.02 1.18-.26 2 .3 4.2 2.28zm-1.34 1.48c-1.5-1.35-2.23-1.85-2.43-1.8-.17.03-.5 1.23-.5 4.06 0 5.87 2.67 7.21 5.17 3.45 1.5-2.26 1.47-2.84.4-3.7.03.03-1.95-1.4-2.64-2zm222.9-130.19c2.2-1.1 3.67-1.66 5.88-2.36l.28-.09a48.92 48.92 0 0 0 8.79-3.55c4.17-2.08 6.35-1.88 6.96.84.44 2 .2 4.01-1.25 12.7-2.27 13.62-9.16 26.14-21.17 36.3-4.3 3.63-7.41 4.39-9.75 2.44-1.88-1.57-3.1-4.57-4.61-10.48-.3-1.15-1.43-5.83-1.72-6.96a114.18 114.18 0 0 0-2.71-9.22c-2.4-6.82-3.03-10.78-2.1-12.94.77-1.83 2.08-2.24 5.6-2.45 1.49-.09 2.09-.14 2.97-.28l1.95-.33c.72-.12 1.22-.2 1.68-.29 1.1-.2 1.92-.38 2.71-.6 1.7-.49 3.42-1.2 6.49-2.73zm.44.9c-3.11 1.54-4.88 2.29-6.65 2.79-.84.23-1.69.42-2.81.63a108.77 108.77 0 0 1-3.81.63c-.77.13-1.39.19-2.92.28-3.13.18-4.17.51-4.74 1.85-.78 1.84-.2 5.62 2.13 12.2a115.12 115.12 0 0 1 2.74 9.31l1.72 6.96c1.46 5.7 2.62 8.58 4.28 9.96 1.87 1.56 4.49.93 8.47-2.44 11.82-10 18.6-22.3 20.83-35.7 1.4-8.45 1.65-10.51 1.25-12.31-.41-1.87-1.86-2-5.54-.16a49.87 49.87 0 0 1-8.93 3.6l-.28.1a35.4 35.4 0 0 0-5.74 2.3zm-4.5 6.58c1.37-.32 2.5-.75 3.9-1.42.35-.18 2.57-1.31 3.32-1.67 1.5-.71 2.97-1.31 4.7-1.89 2.7-.9 4.64-.77 5.88.4.98.94 1.34 2.26 1.41 4.18.02.4.02.7.02 1.37 0 5.63-4.63 16.88-11.34 22.75-4.34 3.8-7.31 4.67-9.92 2.52-2.06-1.7-3.5-4.65-6.67-12.91-1.86-4.83-2.05-8.1-.68-10.2 1.12-1.7 2.9-2.36 5.83-2.7l1.26-.12c1.19-.12 1.75-.19 2.3-.31zm-2.1 2.3-1.22.12c-2.4.27-3.7.76-4.39 1.81-.93 1.43-.78 4.1.87 8.38 3.02 7.84 4.41 10.71 6.08 12.09 1.63 1.34 3.64.75 7.33-2.48C584.6 250.77 589 240.08 589 235c0-.64 0-.93-.02-1.29-.05-1.44-.3-2.33-.79-2.8-.6-.57-1.8-.65-3.87.04a37.95 37.95 0 0 0-4.47 1.8c-.72.34-2.93 1.47-3.32 1.66a19.54 19.54 0 0 1-4.3 1.56c-.66.16-1.28.24-2.56.36zm-227.73-88.98c-1.59 4.3-3.54 7.25-7.14 11.4l-2.6 2.97a67.02 67.02 0 0 0-2.63 3.23 46.4 46.4 0 0 0-4.68 7.5c-2.85 5.7-7.14 10.18-12.85 13.89-4.25 2.76-8.25 4.62-15.67 7.59-11.01 4.4-16.43 1.26-27.22-16.4-2.86-4.69-8.8-8.63-17.98-12.66-3-1.33-12.88-5.24-14.43-5.92-4.96-2.18-7.04-3.72-6.42-5.85.67-2.32 5.3-4.05 15.48-6.08 16.63-3.32 26.93-3.82 39.93-3.02 7.9.49 9.67.5 12.74-.26 1.99-.48 3.92-1.3 6-2.6l2.79-1.71c9.86-6.14 12.94-7.96 17.3-9.9 6.03-2.71 10.57-3.32 13.94-1.4 7.2 4.12 7.68 7.7 3.44 19.22zm-1.88-.7c3.95-10.7 3.6-13.26-2.56-16.78-2.66-1.52-6.62-.99-12.12 1.48-4.24 1.9-7.3 3.7-17.07 9.77l-2.79 1.73a22.6 22.6 0 0 1-6.57 2.84c-3.36.81-5.22.8-13.34.3-12.84-.78-22.97-.29-39.41 3-4.9.97-8.45 1.88-10.79 2.75-2.03.76-3.04 1.45-3.17 1.91-.16.57 1.48 1.79 5.3 3.46 1.5.67 11.39 4.58 14.44 5.93 9.52 4.19 15.74 8.3 18.87 13.44 10.35 16.93 14.87 19.56 24.78 15.6 7.3-2.93 11.21-4.75 15.33-7.42 5.42-3.53 9.47-7.75 12.15-13.1 1.44-2.9 3.02-5.4 4.86-7.82a68.95 68.95 0 0 1 2.72-3.33l2.6-2.97c3.46-3.99 5.28-6.75 6.77-10.79zm-6.64-.39c-7.94 12.8-18.53 21.75-33.3 25.23-7.82 1.83-12.47-.79-13.12-5.93-.55-4.45 2.29-9.06 6-9.06 3.02 0 5.6-1.68 15.38-9.16 1.47-1.12 2.57-1.96 3.66-2.74 4.4-3.2 7.77-5.17 10.82-6.08 5.57-1.67 9.33-2.15 11.35-1.22 2.5 1.14 2.22 4.13-.79 8.96zm-.84-.52c2.72-4.4 2.94-6.74 1.21-7.53-1.71-.79-5.32-.33-10.65 1.27-2.9.87-6.2 2.79-10.51 5.92-1.08.79-2.18 1.62-3.65 2.74-10.08 7.72-12.62 9.36-15.98 9.36-3.02 0-5.5 4.02-5 7.94.56 4.5 4.62 6.78 11.89 5.07 14.48-3.4 24.86-12.18 32.69-24.77zM461.17 33.53c13.88 4.96 20.75 4.96 31.62.01 3.02-1.37 5.47-2.94 11-6.82 5.57-3.92 8.05-5.51 11.14-6.92 4.14-1.88 7.78-2.38 11.22-1.28 3.92 1.26 6.2 12.3 6.78 28.45.5 14.2-.52 28.93-2.46 34.2-1.82 4.93-5.86 8.17-11.51 10.02A41.7 41.7 0 0 1 506 93.01c-5.79 0-9 2.4-12.2 7.64-.37.59-1.55 2.6-1.71 2.87-1.75 2.9-3.05 4.33-4.93 4.95-.94.32-2.07.83-3.87 1.74l-2.43 1.23c-1.03.53-1.87.94-2.7 1.34-6.43 3.1-11.73 4.72-17.16 4.72-5.71 0-10.04 2.09-14.02 5.92-1.16 1.11-4.2 4.53-4.63 4.94-2.54 2.44-5.93 4.24-10.85 6.1-1.4.52-5.98 2.13-6.25 2.22l-2.06.78c-.89.36-1.78.63-2.7.81-5.55 1.14-11.14-.54-17.98-4.42-1.27-.73-5.13-3.06-5.76-3.42-2.05-1.16-4.12-1.53-9.09-1.9l-1.73-.15c-4.78-.4-7.68-1.14-10.22-2.97-5-3.61-6.77-7.76-5.65-12.33 1.33-5.42 6.5-11.02 14.85-17.28a169.2 169.2 0 0 1 6.5-4.61c-.33.23 4.33-2.92 5.3-3.6 2.73-1.91 4.8-3.9 12.75-12.04l1.09-1.1c3.49-3.56 5.89-5.89 8.12-7.83 2.9-2.5 4.72-5.95 7.5-13.05l.63-1.61c2.7-6.92 4.28-10 6.87-12.33 1.42-1.28 6.68-6.54 7.93-7.5 3.98-3 8.01-2.73 19.57 1.4zm-.34.94c-11.26-4.02-15-4.28-18.62-1.53-1.19.9-6.4 6.11-7.88 7.43-2.42 2.18-3.96 5.19-6.6 11.95l-.63 1.61c-2.83 7.26-4.72 10.8-7.77 13.45a141.85 141.85 0 0 0-9.16 8.87c-8.02 8.2-10.08 10.2-12.88 12.16-.99.69-5.65 3.84-5.31 3.6-2.5 1.71-4.52 3.13-6.47 4.59-8.17 6.13-13.23 11.6-14.48 16.72-1.02 4.15.58 7.9 5.26 11.27 2.36 1.7 5.11 2.4 9.72 2.8l1.73.13c5.12.4 7.28.78 9.5 2.05.65.36 4.5 2.7 5.76 3.4 6.66 3.78 12.04 5.4 17.29 4.32.86-.17 1.7-.42 2.52-.75a67 67 0 0 1 2.1-.8c.28-.1 4.86-1.7 6.24-2.22 4.8-1.8 8.08-3.56 10.5-5.88.4-.38 3.44-3.8 4.63-4.94 4.16-4 8.72-6.2 14.72-6.2 5.25 0 10.42-1.59 16.73-4.62.82-.4 1.65-.8 2.68-1.33.12-.06 1.93-.99 2.43-1.23 1.84-.93 3-1.46 4-1.8 1.6-.52 2.76-1.82 4.39-4.52l1.7-2.88c3.39-5.5 6.87-8.11 13.07-8.11 4.45 0 8.73-.49 12.64-1.77 5.4-1.76 9.2-4.8 10.9-9.41 1.87-5.11 2.9-19.75 2.39-33.83-.56-15.53-2.81-26.48-6.08-27.52-3.18-1.02-6.57-.55-10.5 1.23-3.02 1.37-5.47 2.94-11 6.83-5.57 3.92-8.05 5.5-11.14 6.92-11.13 5.05-18.26 5.05-32.38.01zM475 55c5.38 0 7.55-.21 9.72-.96 1.26-.43 9.95-4.8 14.88-6.96 1.9-.82 3.56-2.44 6.6-6.04 2.56-3.04 3.19-3.75 4.4-4.84 3.7-3.35 7.07-3.28 10.22 1.23 6.23 8.9 5.61 15.94.07 27.02a71.26 71.26 0 0 0-2.5 5.48c-.32.8-1 2.7-1.09 2.9-.17.45-.34.81-.54 1.17-.63 1.14-1.56 2.21-4.05 4.7-2.4 2.4-5.16 3.27-11.68 4.33-1.81.3-2.2.36-3 .51-6.02 1.1-9.6 2.69-12.24 6.07-3.57 4.59-7.9 7.48-14.98 10.74-.55.24-1.1.5-1.8.8l-1.78.8a60.08 60.08 0 0 0-7.7 3.9c-2.57 1.6-4.79 2.35-9.42 3.46-8.58 2.06-12.28 3.76-17.37 9.36-5.12 5.64-10.17 7.64-16.63 6.7-5.36-.79-10.63-3.01-23.56-9.48-6.3-3.15-6.43-7.78-1.5-13.56 3.38-3.94 3.52-4.06 19.4-16.44 8.12-6.33 12.97-10.57 16.63-14.88 2.53-2.98 4.2-5.73 4.96-8.3 5.5-18.3 12.5-21.98 22.78-15.56 1.95 1.22 6.61 4.55 7.18 4.9 3.36 2.15 6.52 2.95 13 2.95zm0 2c-6.84 0-10.37-.89-14.08-3.26-.63-.4-5.27-3.71-7.16-4.9-9.05-5.65-14.66-2.7-19.8 14.45-.86 2.87-2.67 5.85-5.35 9.01-3.78 4.45-8.7 8.75-16.94 15.17-15.66 12.21-15.86 12.38-19.1 16.16-4.17 4.9-4.09 8 .88 10.48 12.71 6.35 17.89 8.54 22.94 9.28 5.78.84 10.18-.9 14.87-6.06 5.42-5.96 9.45-7.82 18.38-9.96 4.43-1.07 6.5-1.76 8.83-3.22a61.7 61.7 0 0 1 7.94-4.02l1.78-.8 1.78-.8c6.82-3.13 10.91-5.87 14.24-10.14 3-3.87 7-5.64 13.46-6.82.83-.15 1.21-.21 3.04-.51 6.1-1 8.6-1.78 10.58-3.77 2.36-2.36 3.21-3.34 3.72-4.26.15-.27.29-.56.44-.94.06-.15.75-2.06 1.09-2.9.64-1.6 1.45-3.4 2.57-5.64 5.24-10.49 5.8-16.8.07-24.98-2.4-3.44-4.37-3.48-7.24-.89-1.11 1-1.73 1.7-4.22 4.65-3.24 3.85-5.04 5.59-7.32 6.59-4.82 2.1-13.62 6.53-15.03 7.01-2.44.84-4.79 1.07-10.37 1.07zm-12.7 8.6c5.47 3.9 10.34 3.72 18.23.88 5.39-1.94 5.92-2.1 7.7-2.1 2.5-.01 4.21 1.36 5.24 4.46 1.66 4.98-2.32 8.52-12.3 12.68-2.7 1.13-16.25 6.18-20 7.73-7.86 3.24-13.93 6.42-18.87 10.15-13.02 9.84-18.36 11.93-23.71 9.68a24.67 24.67 0 0 1-3.62-1.98l-1.99-1.28a90.4 90.4 0 0 0-2.24-1.4c-3.33-2-2.82-4.28.85-7.34 1.35-1.13 10.66-7.61 13.53-9.91 7.1-5.69 11.91-11.47 14.41-18.34 3.07-8.45 4.89-12.1 6.8-13.39 1.73-1.16 3.36-.53 6.18 1.9.63.56 3.4 3.08 4.11 3.7 1.93 1.7 3.71 3.15 5.67 4.55zm-.6.8c-1.98-1.42-3.79-2.88-5.74-4.6-.73-.64-3.48-3.16-4.1-3.7-2.5-2.16-3.75-2.65-4.97-1.83-1.66 1.11-3.44 4.7-6.42 12.9-2.57 7.07-7.5 12.99-14.72 18.78-2.91 2.33-12.21 8.8-13.52 9.9-3.22 2.68-3.56 4.17-.97 5.72l2.26 1.4 1.99 1.28c1.47.93 2.48 1.5 3.47 1.91 4.9 2.07 9.96.07 22.72-9.56 5.02-3.79 11.15-7 19.1-10.28 3.76-1.55 17.3-6.6 20-7.72 9.5-3.97 13.14-7.2 11.73-11.44-.9-2.71-2.25-3.8-4.3-3.79-1.6 0-2.15.17-7.36 2.05-8.17 2.94-13.34 3.14-19.16-1.01z'/%3E%3C/svg%3E")}`,
  map: `{"version":3,"file":"Testimonials.svelte","sources":["Testimonials.svelte"],"sourcesContent":["<script>\\r\\n    import PrismicDom from 'prismic-dom'\\r\\n    export let slice\\r\\n<\/script>\\r\\n\\r\\n<style>.bg-testimonials{background-color:#ecefef;background-image:url(\\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cpath fill='%23f7f7f8' d='M600 325.1v-1.17c-6.5 3.83-13.06 7.64-14.68 8.64-10.6 6.56-18.57 12.56-24.68 19.09-5.58 5.95-12.44 10.06-22.42 14.15-1.45.6-2.96 1.2-4.83 1.9l-4.75 1.82c-9.78 3.75-14.8 6.27-18.98 10.1-4.23 3.88-9.65 6.6-16.77 8.84-1.95.6-3.99 1.17-6.47 1.8l-6.14 1.53c-5.29 1.35-8.3 2.37-10.54 3.78-3.08 1.92-6.63 3.26-12.74 5.03a384.1 384.1 0 0 1-4.82 1.36c-2.04.58-3.6 1.04-5.17 1.52a110.03 110.03 0 0 0-11.2 4.05c-2.7 1.15-5.5 3.93-8.78 8.4a157.68 157.68 0 0 0-6.15 9.2c-5.75 9.07-7.58 11.74-10.24 14.51a50.97 50.97 0 0 1-4.6 4.22c-2.33 1.9-10.39 7.54-11.81 8.74a14.68 14.68 0 0 0-3.67 4.15c-1.24 2.3-1.9 4.57-2.78 8.87-2.17 10.61-3.52 14.81-8.2 22.1-4.07 6.33-6.8 9.88-9.83 12.99-.47.48-.95.96-1.5 1.48l-3.75 3.56c-1.67 1.6-3.18 3.12-4.86 4.9a42.44 42.44 0 0 0-9.89 16.94c-2.5 8.13-2.72 15.47-1.76 27.22.47 5.82.51 6.36.51 8.18 0 10.51.12 17.53.63 25.78.24 4.05.56 7.8.97 11.22h.9c-1.13-9.58-1.5-21.83-1.5-37 0-1.86-.04-2.4-.52-8.26-.94-11.63-.72-18.87 1.73-26.85a41.44 41.44 0 0 1 9.65-16.55c1.67-1.76 3.18-3.27 4.83-4.85.63-.6 3.13-2.96 3.75-3.57a71.6 71.6 0 0 0 1.52-1.5c3.09-3.16 5.86-6.76 9.96-13.15 4.77-7.42 6.15-11.71 8.34-22.44.86-4.21 1.5-6.4 2.68-8.6.68-1.25 1.79-2.48 3.43-3.86 1.38-1.15 9.43-6.8 11.8-8.72 1.71-1.4 3.26-2.81 4.7-4.3 2.72-2.85 4.56-5.54 10.36-14.67a156.9 156.9 0 0 1 6.1-9.15c3.2-4.33 5.9-7.01 8.37-8.07 3.5-1.5 7.06-2.77 11.1-4.02a233.84 233.84 0 0 1 7.6-2.2l2.38-.67c6.19-1.79 9.81-3.16 12.98-5.15 2.14-1.33 5.08-2.33 10.27-3.65l6.14-1.53c2.5-.63 4.55-1.2 6.52-1.82 7.24-2.27 12.79-5.06 17.15-9.05 4.05-3.72 9-6.2 18.66-9.9l4.75-1.82c1.87-.72 3.39-1.31 4.85-1.91 10.1-4.15 17.07-8.32 22.76-14.4 6.05-6.45 13.95-12.4 24.49-18.92 1.56-.96 7.82-4.6 14.15-8.33v-64.58c-4 8.15-8.52 14.85-12.7 17.9-2.51 1.82-5.38 4.02-9.04 6.92a1063.87 1063.87 0 0 0-6.23 4.98l-1.27 1.02a2309.25 2309.25 0 0 1-4.87 3.9c-7.55 6-12.9 10.05-17.61 13.19-3.1 2.06-3.86 2.78-8.06 7.13-5.84 6.07-11.72 8.62-29.15 10.95-11.3 1.5-20.04 4.91-30.75 11.07-1.65.94-7.27 4.27-6.97 4.1-2.7 1.58-4.69 2.69-6.64 3.66-5.63 2.8-10.47 4.17-15.71 4.17-17.13 0-41.44 11.51-51.63 22.83-12.05 13.4-31.42 27.7-45.25 31.16-7.4 1.85-11.85 7.05-14.04 14.69-1.26 4.4-1.58 8.28-1.58 13.82 0 .82.01.98.24 3.63.45 5.18.35 8.72-.77 13.26-1.53 6.2-4.89 12.6-10.59 19.43-13.87 16.65-22.88 46.58-22.88 71.68 0 2.39.02 4.26.06 8.75.12 10.8.1 15.8-.22 21.95-.56 11.18-2.09 20.73-5 29.3h-1.05c2.94-8.56 4.49-18.12 5.05-29.35.31-6.13.34-11.1.22-21.9-.04-4.48-.06-6.36-.06-8.75 0-25.32 9.07-55.47 23.12-72.32 5.6-6.72 8.88-12.99 10.38-19.03 1.09-4.4 1.18-7.85.74-12.93-.23-2.7-.24-2.86-.24-3.72 0-5.62.32-9.57 1.62-14.1 2.28-7.95 6.97-13.44 14.76-15.39 13.6-3.4 32.82-17.59 44.75-30.84C409 360.14 433.58 348.5 451 348.5c5.07 0 9.77-1.33 15.26-4.07 1.93-.96 3.9-2.05 6.58-3.62-.3.18 5.33-3.16 6.98-4.11 10.82-6.21 19.66-9.67 31.11-11.2 17.23-2.3 22.9-4.75 28.57-10.64 4.25-4.41 5.04-5.16 8.22-7.28 4.68-3.11 10.01-7.14 17.55-13.14a1113.33 1113.33 0 0 0 4.86-3.89l1.28-1.02a4668.54 4668.54 0 0 1 6.23-4.98c3.67-2.9 6.55-5.12 9.07-6.95 4.37-3.19 9.16-10.56 13.29-19.4v66.9zm0-116.23c-.62.01-1.27.06-1.95.13-6.13.63-13.83 3.45-21.83 7.45-3.64 1.82-8.46 2.67-14.17 2.71-4.7.04-9.72-.47-14.73-1.33-1.7-.3-3.26-.61-4.67-.93a31.55 31.55 0 0 0-3.55-.57 273.4 273.4 0 0 0-16.66-.88c-10.42-.16-17.2.74-17.97 2.73-.38.97.6 2.55 3.03 4.87 1.01.97 2.22 2.03 4.04 3.55a1746.07 1746.07 0 0 0 4.79 4.02c1.39 1.2 3.1 1.92 5.5 2.5.7.16.86.2 2.64.54 3.53.7 5.03 1.25 6.15 2.63 1.41 1.76 1.4 4.54-.15 8.88-2.44 6.83-5.72 10.05-10.19 10.33-3.63.23-7.6-1.29-14.52-5.06-4.53-2.47-6.82-7.3-8.32-15.26-.17-.87-.32-1.78-.5-2.86l-.43-2.76c-1.05-6.58-1.9-9.2-3.73-10.11-.81-.4-1.59-.74-2.36-1-2.27-.77-4.6-1.02-8.1-.92-2.29.07-14.7 1-13.77.93-20.55 1.37-28.8 5.05-37.09 14.99a133.07 133.07 0 0 0-4.25 5.44l-2.3 3.09-2.51 3.32c-4.1 5.36-7.06 8.48-10.39 11.12-.65.52-1.33 1.04-2.13 1.62l-4.11 2.94a106.8 106.8 0 0 0-5.16 3.99c-4.55 3.74-9.74 8.6-16.25 15.38-8.25 8.58-11.78 13.54-11.7 15.95.07 1.65 1.64 2.11 6.79 2.38 1.61.09 2.15.12 2.98.2 2.95.24 5.09.73 6.81 1.68 7.48 4.15 11.63 7.26 13.95 11.58 3.3 6.15.8 12.88-8.89 20.26-8.28 6.3-11.1 10.37-11.31 14.96-.06 1.17 0 1.93.26 4.43.69 6.47.25 10.65-2.8 17.42a44.23 44.23 0 0 1-4.16 7.53c-2.82 3.97-5.47 5.74-10.6 7.69-.43.16-3.34 1.23-4.27 1.59-1.8.68-3.38 1.36-5.01 2.14-4.18 2-8.4 4.6-13.1 8.24-8.44 6.51-13.23 14.56-15.98 25.06-1.1 4.2-1.55 6.81-2.8 15.21-1.26 8.6-2.17 12.64-4.08 16.55-2.1 4.28-11.93 26.59-12.97 28.88a382.7 382.7 0 0 1-6.37 13.41c-4.07 8.11-7.61 14.07-10.73 17.81-5.38 6.46-8.98 14.37-13.77 28.42a810.14 810.14 0 0 0-1.89 5.6c-1.8 5.35-2.96 8.6-4.26 11.85-6.13 15.32-25.43 26.31-46.46 26.31-11.2 0-20.58-2.74-31.02-8.55-5.6-3.13-4.55-2.42-22.26-14.54-14.33-9.8-17.7-10.73-20.47-6.9-.37.5-1.81 2.74-1.83 2.77a52.24 52.24 0 0 1-4.94 5.9c-.73.79-5.52 5.87-6.97 7.45-2.38 2.6-4.3 4.81-5.98 6.93a45.6 45.6 0 0 0-5.08 7.66c-1.29 2.57-1.9 5.25-2.66 10.6a997.6 997.6 0 0 1-.46 3.18h-1l.47-3.32c.77-5.45 1.4-8.2 2.75-10.9a46.54 46.54 0 0 1 5.2-7.84c1.7-2.14 3.63-4.38 6.03-6.98 1.45-1.59 6.24-6.68 6.96-7.46a51.58 51.58 0 0 0 4.84-5.78s1.47-2.26 1.86-2.8c3.25-4.5 7.08-3.44 21.84 6.67 17.67 12.08 16.62 11.38 22.19 14.48 10.3 5.73 19.5 8.43 30.53 8.43 20.65 0 39.57-10.77 45.54-25.69a219.7 219.7 0 0 0 4.24-11.8 6752.32 6752.32 0 0 0 1.88-5.6c4.83-14.16 8.47-22.14 13.96-28.73 3.05-3.66 6.56-9.57 10.6-17.61 1.97-3.93 4.04-8.31 6.35-13.38 1.03-2.28 10.88-24.61 12.98-28.91 1.85-3.79 2.75-7.76 4-16.25 1.24-8.44 1.7-11.07 2.81-15.32 2.8-10.7 7.71-18.94 16.33-25.6a73.18 73.18 0 0 1 13.29-8.35c1.66-.8 3.27-1.48 5.08-2.18.94-.36 3.86-1.43 4.28-1.59 4.95-1.88 7.44-3.55 10.14-7.33 1.35-1.9 2.68-4.3 4.06-7.37 2.97-6.58 3.39-10.59 2.72-16.9a27.13 27.13 0 0 1-.27-4.58c.22-4.94 3.21-9.24 11.7-15.7 9.33-7.11 11.66-13.34 8.62-19-2.2-4.09-6.25-7.12-13.55-11.17-1.57-.88-3.6-1.33-6.42-1.57-.8-.07-1.34-.1-2.95-.19-5.77-.3-7.63-.85-7.72-3.34-.1-2.81 3.5-7.87 11.97-16.69 6.53-6.8 11.75-11.69 16.33-15.45 1.79-1.47 3.42-2.72 5.2-4.03l4.12-2.94c.79-.58 1.46-1.08 2.1-1.59 3.26-2.6 6.16-5.65 10.21-10.94a383.2 383.2 0 0 0 2.5-3.32l2.31-3.09c1.8-2.39 3.04-4 4.29-5.48 8.47-10.17 16.98-13.96 37.27-15.3-.44.02 12-.9 14.32-.98 3.62-.1 6.05.16 8.46.98.8.27 1.62.62 2.47 1.04 2.27 1.14 3.17 3.87 4.27 10.85l.44 2.76c.17 1.07.33 1.97.5 2.83 1.44 7.69 3.62 12.29 7.8 14.57 6.76 3.68 10.6 5.15 13.99 4.94 4-.25 6.99-3.17 9.3-9.67 1.45-4.04 1.46-6.49.32-7.92-.9-1.12-2.28-1.62-5.57-2.27a55.8 55.8 0 0 1-2.67-.55c-2.54-.6-4.39-1.4-5.93-2.71a252.63 252.63 0 0 0-4.78-4.01 84.35 84.35 0 0 1-4.08-3.6c-2.73-2.6-3.86-4.43-3.28-5.95 1.02-2.64 7.82-3.54 18.93-3.37a230.56 230.56 0 0 1 16.73.88c2.76.39 3.2.49 3.68.6 1.4.3 2.95.62 4.62.91a82.9 82.9 0 0 0 14.56 1.32c5.56-.04 10.24-.86 13.73-2.6 8.1-4.05 15.89-6.9 22.17-7.56.7-.07 1.4-.11 2.05-.13v1zm0-100.94v1.5c-8.62 16.05-17.27 29.55-23.65 35.92-3.19 3.2-7.62 4.9-13.54 5.56-4.45.48-8.28.4-19.18-.2-9.91-.55-15.32-.44-20.52.78a84.05 84.05 0 0 1-15 2.11l-2.25.14c-12.49.75-19.37 1.78-32.72 5.74-4.5 1.33-9.27 2.49-14.3 3.48a246.27 246.27 0 0 1-32.6 3.97c-7.56.45-13.21.57-20.24.57-5.4 0-11.9 1.61-18 5.18-8.3 4.87-15.06 12.87-19.53 24.5a68.57 68.57 0 0 1-4.56 9.8c-3.6 6.2-6.92 8.99-13.38 12.18l-4.03 1.96a64.48 64.48 0 0 0-15.16 10.25c-8.2 7.33-13.72 16.63-22.54 35.6l-2.08 4.49c-7.3 15.7-11.5 23.3-17.35 29.87-7.7 8.66-20.25 14.42-40.31 20.08-4.37 1.23-19.04 5.08-19.24 5.13-6.92 1.87-11.68 3.34-15.63 4.92-10.55 4.22-18.71 10.52-36.38 26.52l-1.7 1.54c-8.58 7.76-13.41 11.9-18.81 15.88-3.95 2.9-8 5.67-12.97 8.91-2.06 1.34-10.3 6.6-12.33 7.94-11.52 7.5-18.53 13.04-24.62 20.08a62.01 62.01 0 0 0-6.44 8.85c-4.13 6.91-6.27 13.15-9.2 25.11l-1.54 6.26c-.6 2.45-1.15 4.54-1.72 6.58-2.97 10.7-6.9 17.36-14.78 26.91L69.6 491a148.51 148.51 0 0 0-4.19 5.3 23.9 23.9 0 0 0-3.44 6.28c-1.16 3.23-1.52 5.9-1.87 11.94-.58 10.05-1.42 15.04-4.63 22.67-1.57 3.72-5.66 14.02-6.41 15.8a73.46 73.46 0 0 1-3.57 7.4c-2.88 5.14-6.71 10.12-13.12 16.95-5.96 6.36-8.87 10.9-10.61 16a56.88 56.88 0 0 0-1.38 4.82l-.46 1.84h-1.03l.52-2.08c.52-2.09.92-3.49 1.4-4.9 1.8-5.25 4.78-9.9 10.84-16.36 6.35-6.78 10.13-11.7 12.97-16.77a72.5 72.5 0 0 0 3.52-7.29c.75-1.76 4.84-12.06 6.4-15.8 3.17-7.5 3.99-12.4 4.56-22.33.35-6.14.72-8.88 1.93-12.23a24.9 24.9 0 0 1 3.58-6.54c1.27-1.7 2.6-3.37 4.22-5.34l4.11-4.95c7.8-9.46 11.66-16 14.59-26.54.56-2.04 1.1-4.12 1.71-6.56l1.53-6.26c2.96-12.04 5.13-18.36 9.32-25.39 1.84-3.08 4-6.05 6.54-8.99 6.17-7.12 13.24-12.7 24.83-20.26 2.05-1.33 10.28-6.6 12.33-7.94 4.96-3.22 9-5.98 12.92-8.87 5.37-3.95 10.19-8.08 18.74-15.82l1.7-1.54c17.76-16.09 25.98-22.43 36.67-26.7 4-1.6 8.8-3.09 15.75-4.96.21-.06 14.87-3.9 19.22-5.13 19.9-5.61 32.32-11.31 39.85-19.78 5.76-6.48 9.93-14.02 17.18-29.64l2.09-4.5c8.87-19.07 14.44-28.46 22.77-35.9a65.48 65.48 0 0 1 15.38-10.4l4.04-1.97c6.3-3.1 9.47-5.77 12.96-11.77a67.6 67.6 0 0 0 4.48-9.67c4.56-11.84 11.47-20.02 19.97-25 6.25-3.66 12.93-5.32 18.5-5.32 7.01 0 12.65-.12 20.17-.57a245.3 245.3 0 0 0 32.47-3.96c5-.98 9.75-2.13 14.22-3.45 13.43-3.98 20.38-5.02 32.94-5.78l2.24-.14c5.76-.37 9.8-.9 14.85-2.09 5.31-1.25 10.79-1.35 22.6-.7 9.04.5 12.84.58 17.21.1 5.71-.62 9.94-2.26 12.95-5.26 6.44-6.45 15.3-20.37 24.35-36.72zm0 450.21c-1.28-4.6-2.2-10.55-3.33-20.25l-.24-2.04-.23-2.03c-1.82-15.7-3.07-21.98-5.55-24.47-2.46-2.46-3.04-5.03-2.52-8.64.1-.6.18-1.1.39-2.15.69-3.54.77-5.04.08-6.84-.91-2.38-3.31-4.41-7.79-6.26-5.08-2.09-6.52-4.84-4.89-8.44.66-1.45 1.79-3.02 3.52-5.01 1.04-1.2 5.48-5.96 5.08-5.53 6.15-6.7 8.98-11.34 8.98-16.48a15.2 15.2 0 0 1 6.5-12.89v1.26a14.17 14.17 0 0 0-5.5 11.63c0 5.47-2.93 10.29-9.24 17.16.38-.42-4.04 4.33-5.07 5.5-1.67 1.93-2.75 3.43-3.36 4.77-1.37 3.04-.23 5.22 4.36 7.1 4.71 1.95 7.32 4.16 8.34 6.83.78 2.04.7 3.67-.03 7.4-.2 1.03-.3 1.51-.38 2.09-.48 3.33.03 5.59 2.23 7.8 2.74 2.74 3.98 8.96 5.84 25.06l.24 2.03.23 2.04c.82 7.01 1.53 12.06 2.34 16.03v4.33zm0-62.16c-1.4-3.13-4.43-9.9-4.95-11.17-1.02-2.53-1.25-3.8-.91-5.18.2-.84 2.05-4.68 2.32-5.33a70.79 70.79 0 0 0 3.54-11.2v3.99a62.82 62.82 0 0 1-2.62 7.6c-.31.75-2.09 4.46-2.27 5.18-.28 1.12-.08 2.22.87 4.57.41 1.02 2.5 5.7 4.02 9.09v2.45zm0-85.09c-1.65 1.66-3.66 2.9-6.4 4.13-.25.1-13.97 5.47-20.4 8.43-9.35 4.32-16.7 5.9-23.03 5.25-5.08-.53-9.02-2.25-14.77-5.92l-3.2-2.07a77.4 77.4 0 0 0-5.44-3.27c-4.05-2.18-3.25-5.8 1.47-10.47 3.71-3.68 9.6-7.93 18.73-13.8l4.46-2.82c17.95-11.33 18.22-11.5 22.27-14.74 11.25-9 19.69-14.02 26.31-15.1v1.02c-6.37 1.1-14.62 6-25.69 14.86-4.1 3.28-4.34 3.44-22.36 14.8a652.4 652.4 0 0 0-4.45 2.83c-9.07 5.83-14.92 10.05-18.57 13.66-4.31 4.28-4.95 7.13-1.7 8.88 1.7.91 3.29 1.88 5.5 3.3l3.2 2.08c5.64 3.59 9.45 5.25 14.34 5.76 6.13.64 13.32-.9 22.52-5.15 6.46-2.98 20.18-8.35 20.4-8.44 3.04-1.37 5.1-2.71 6.81-4.69v1.47zm0-41.37v1c-6.56.26-12.11 3.13-19.71 9.08l-4.63 3.68a51.87 51.87 0 0 1-4.4 3.14c-.82.52-5.51 3.33-6.22 3.76-3.31 2-6.15 3.8-8.87 5.6a112.61 112.61 0 0 0-8.16 5.92c-4.61 3.72-7.4 6.9-7.97 9.35-.63 2.67 1.48 4.53 7.05 5.46 10.7 1.78 20.92-.05 30.45-4.65a61.96 61.96 0 0 0 17.1-12.2 41.8 41.8 0 0 0 5.36-7.42v1.92a38.94 38.94 0 0 1-4.64 6.19 62.95 62.95 0 0 1-17.39 12.41c-9.7 4.68-20.13 6.55-31.05 4.73-6.06-1-8.65-3.29-7.85-6.67.64-2.74 3.53-6.05 8.31-9.9 2.35-1.9 5.1-3.88 8.24-5.97 2.73-1.82 5.58-3.61 8.9-5.62.72-.44 5.4-3.24 6.22-3.75 1.26-.8 2.6-1.76 4.3-3.09.8-.62 3.9-3.1 4.63-3.67 7.77-6.1 13.49-9.04 20.33-9.3zm0-154.6v1c-1.75-.24-4.3.23-7.82 1.55-10.01 3.75-13.8 5.07-19.15 6.76-1.78.56-2.63.83-3.87 1.24-1.48.5-3.16.76-6.74 1.16a1550.34 1550.34 0 0 0-2.64.3c-7.8.94-11.28 2.47-11.28 6.07 0 4.45 2.89 13.18 7.96 25.81a57.34 57.34 0 0 1 2.33 7.6 258.32 258.32 0 0 1 .84 3.46c1.86 7.62 3.17 10.71 5.56 11.67 2.21.88 4.7.6 7.47-.72 3.48-1.69 7.22-4.94 11.2-9.47 1.52-1.7 2.97-3.49 4.59-5.57l3.16-4.1c2.59-3.23 6.07-12.21 8.39-20.23v3.45c-2.29 7.2-5.27 14.5-7.61 17.41-.44.55-2.67 3.46-3.15 4.09-1.63 2.1-3.1 3.9-4.62 5.62-4.08 4.61-7.9 7.94-11.53 9.7-2.99 1.44-5.77 1.75-8.28.74-2.84-1.13-4.2-4.34-6.15-12.35a2097.48 2097.48 0 0 1-.84-3.46c-.8-3.2-1.47-5.45-2.28-7.46-5.14-12.8-8.04-21.55-8.04-26.19 0-4.37 3.84-6.06 12.16-7.07a160.9 160.9 0 0 1 2.65-.3c3.5-.39 5.15-.64 6.53-1.1 1.26-.42 2.1-.7 3.88-1.26 5.34-1.68 9.11-3 19.1-6.74 3.53-1.32 6.22-1.84 8.18-1.61zM0 292c10.13-11.31 18.13-23.2 23.07-35.39 3.3-8.14 6.09-16.12 10.81-30.55l1.59-4.84c6.53-19.94 10.11-29.82 14.77-39.56 6.07-12.72 12.55-21.18 20.27-25.54 6.66-3.76 10.2-7.86 12.22-13.15a46.6 46.6 0 0 0 1.86-6.58c1.23-5.2 2.05-7.59 3.93-10.36 2.45-3.62 6.27-6.53 12.1-8.96 15.78-6.58 16.73-7.04 18.05-9.01.65-.98.83-2.15.74-4.51-.03-.73-.23-3.82-.24-4A93.8 93.8 0 0 1 119 94c0-10.04.18-11.37 2.37-13.15.52-.42 1.13-.8 2.07-1.3.27-.14 2.18-1.12 2.84-1.48a68.4 68.4 0 0 0 9.12-5.87c2.06-1.54 2.64-2.14 8.01-7.93 3.78-4.09 6.21-6.36 8.96-8.12 3.64-2.33 7.2-3.12 10.9-2.11 4.4 1.2 10.81 2 18.78 2.46 6.9.4 12.9.5 21.95.5 4.87 0 8.97.47 15.4 1.57 7.77 1.33 9.3 1.54 12.38 1.54 4.05 0 7.43-.88 10.68-2.95 5.06-3.22 8.11-4.67 11.2-5.2 3.62-.64 4.77-.46 16.55 2.06 17.26 3.7 30.85 1.36 41.06-9.7 5.1-5.53 5.48-8.9 3.48-14.8-.83-2.42-1.03-3.1-1.17-4.3-.29-2.52.5-4.71 2.71-6.93 2.65-2.65 4.72-9.17 6.22-18.29h2.03c-1.56 9.71-3.77 16.65-6.83 19.7-1.79 1.8-2.36 3.39-2.14 5.28.11 1 .3 1.63 1.07 3.9 2.22 6.53 1.76 10.66-3.9 16.8-10.77 11.66-25.07 14.13-42.95 10.3-11.42-2.45-12.55-2.62-15.78-2.06-2.77.48-5.62 1.84-10.47 4.92a20.93 20.93 0 0 1-11.76 3.27c-3.25 0-4.81-.22-12.73-1.57C212.74 59.46 208.73 59 204 59c-9.1 0-15.11-.1-22.07-.5-8.09-.47-14.62-1.29-19.2-2.54-5.62-1.53-10.17 1.38-17.85 9.66-5.5 5.94-6.08 6.53-8.28 8.18a70.38 70.38 0 0 1-9.38 6.03c-.68.37-2.58 1.35-2.84 1.49-.84.44-1.35.76-1.75 1.08-1.47 1.2-1.63 2.4-1.63 11.6 0 1.85.06 3.54.17 5.44 0 .17.2 3.28.24 4.03.1 2.75-.13 4.29-1.08 5.71-1.67 2.5-2.27 2.8-18.95 9.74-5.48 2.29-8.99 4.96-11.2 8.24-1.71 2.51-2.47 4.73-3.64 9.7-.83 3.5-1.21 4.92-1.94 6.83-2.18 5.73-6.05 10.19-13.1 14.18-7.3 4.12-13.55 12.28-19.46 24.66-4.6 9.64-8.17 19.46-14.67 39.32l-1.58 4.84c-4.75 14.47-7.54 22.48-10.86 30.69-5.28 13.01-13.95 25.65-24.93 37.6v-2.97zm0 78v-.5l1-.01c6.32 0 7.47 5.2 4.6 13.36a60.36 60.36 0 0 1-5.6 11.3v-1.92a57.76 57.76 0 0 0 4.65-9.72c2.69-7.6 1.71-12.02-3.65-12.02-.34 0-.67 0-1 .02v-46.59a340.96 340.96 0 0 0 13.71-8.34c13.66-9.46 29.79-37.6 29.79-53.59 0-18.1 21.57-72.64 32.23-79.42 12.71-8.09 32.24-27.96 35.8-37.75 1.93-5.3 5.5-7.27 14.42-9.37 6.15-1.44 8.64-2.42 10.67-4.79 1.5-1.74 2.72-4.79 4.33-10.3.23-.78 1.9-6.68 2.43-8.46 3.62-12.08 7.3-18.49 13.47-20.39 2.5-.76 3.03-.98 9.74-3.7 7.49-3.03 11.97-4.43 17.12-4.92 6.75-.65 13.13.75 19.55 4.67 5.43 3.32 12.19 4.72 20.17 4.56 6.03-.12 12.2-1.07 19.83-2.8 1.82-.4 7.38-1.74 8.26-1.94 2.69-.6 4.34-.89 5.48-.89 4.97 0 8.93-.05 14.2-.27 7.9-.32 15.56-.92 22.75-1.88 8.5-1.14 15.9-2.73 21.88-4.82 18.9-6.62 32.64-18.3 33.67-27.59.29-2.56.4-2.96 2.79-11.11 2.33-7.95 3.21-12.93 2.72-18.23-.2-2.24-.69-4.38-1.48-6.42-1.5-3.92-2.63-9.4-3.43-16.18h.9c.77 6.47 1.89 11.72 3.47 15.82a24.93 24.93 0 0 1 1.54 6.69c.5 5.46-.4 10.54-2.77 18.6-2.36 8.06-2.47 8.47-2.74 10.95-1.09 9.75-15.1 21.68-34.33 28.41-6.06 2.12-13.52 3.72-22.09 4.87-7.22.96-14.92 1.57-22.83 1.89-5.3.21-9.27.27-14.25.27-1.04 0-2.64.27-5.26.87-.87.2-6.43 1.53-8.26 1.94-7.68 1.73-13.92 2.7-20.03 2.82-8.15.17-15.1-1.27-20.71-4.7-6.23-3.81-12.4-5.16-18.93-4.54-5.04.48-9.44 1.86-16.84 4.86-6.75 2.74-7.29 2.95-9.82 3.73-5.73 1.76-9.28 7.96-12.81 19.72-.53 1.77-2.2 7.66-2.43 8.46-1.66 5.65-2.91 8.78-4.53 10.67-2.22 2.58-4.84 3.62-12.01 5.3-7.8 1.83-11.13 3.66-12.9 8.54-3.65 10.04-23.32 30.06-36.2 38.25C65.94 190 44.5 244.2 44.5 262c0 16.34-16.3 44.78-30.22 54.41-2.14 1.48-8.24 5.12-14.28 8.68v-1.16 46.09zm0-173.7v-1.11c7.42-3.82 14.55-10.23 21.84-18.98 3.8-4.56 14.21-18.78 15.79-20.55 1.8-2.04 4.06-3.96 7.42-6.45 1.08-.8 4.92-3.57 5.49-3.99 9.36-6.85 14-11.96 15.98-19.36.8-2.98 1.54-6.78 2.46-12.3.23-1.44 2-12.46 2.56-15.79 2.87-16.77 5.73-26.79 10.07-32.1C92.46 52.43 101.5 38.13 101.5 33c0-2.54.34-3.35 6.05-15.71.68-1.49 1.25-2.74 1.77-3.93 2.5-5.75 3.9-10.04 4.14-13.36h1c-.23 3.48-1.66 7.87-4.23 13.76-.52 1.2-1.09 2.45-1.78 3.95-5.54 12.01-5.95 12.99-5.95 15.29 0 5.47-9.09 19.84-20.11 33.31-4.2 5.12-7.03 15.06-9.86 31.64-.57 3.33-2.33 14.33-2.57 15.78-.92 5.56-1.67 9.38-2.48 12.4-2.05 7.68-6.82 12.93-16.35 19.91l-5.49 3.98c-3.3 2.45-5.51 4.34-7.27 6.31-1.53 1.73-11.94 15.93-15.76 20.53-7.52 9.02-14.88 15.6-22.61 19.46zm0 361.83v-4.33c.48 2.36 1 4.35 1.6 6.15 2 6.03 4.6 8.26 8.19 6.59C28.76 557.69 43.5 542.4 43.5 527c0-16.2 6.37-31.99 17.1-46.3 1.88-2.5 3.66-4.4 5.53-6 .73-.62 1.45-1.18 2.3-1.8l2-1.43c3.68-2.68 5.32-5.28 7.08-12.59.75-3.07 1.38-5.02 4.2-13.26l.63-1.88c3.24-9.58 4.56-14.97 4.17-18.65-.48-4.43-3.8-5.23-11.3-1.64a81.12 81.12 0 0 1-9.15 3.7c-13.89 4.67-26.96 5.8-42.66 5.42l-1.95-.05-1.45-.02a39.8 39.8 0 0 0-15.05 2.96A21.81 21.81 0 0 0 0 438.37v-1.26a23.55 23.55 0 0 1 4.55-2.57 40.77 40.77 0 0 1 16.92-3.02l1.95.05c15.6.38 28.57-.75 42.32-5.37a80.12 80.12 0 0 0 9.04-3.65c8.04-3.84 12.16-2.85 12.72 2.43.42 3.89-.92 9.34-4.21 19.08l-.64 1.88c-2.8 8.2-3.43 10.15-4.16 13.18-1.82 7.52-3.59 10.34-7.47 13.16l-2 1.43c-.84.6-1.54 1.15-2.25 1.75a35.45 35.45 0 0 0-5.37 5.84c-10.61 14.15-16.9 29.74-16.9 45.7 0 15.88-15 31.45-34.29 40.45-4.3 2.01-7.39-.66-9.56-7.18-.23-.68-.44-1.39-.65-2.13zm0-62.16v-2.45l1.46 3.27c2.1 4.8 3.46 10.33 4.26 16.77.66 5.3.84 9.3 1.04 18.5.2 9.32.5 12.75 1.63 15.05 1.28 2.6 3.67 2.35 8.29-1.5 17.14-14.3 21.82-22.9 21.82-38.62 0-7.17 1.1-12.39 3.7-17.68 2.27-4.67 3.65-6.62 13.4-19.62a69.8 69.8 0 0 1 7.6-8.79 44.76 44.76 0 0 1 3.54-3.06c.38-.3.64-.52.89-.74a10.47 10.47 0 0 0 2.63-3.32 35.78 35.78 0 0 0 2.26-5.94l.37-1.2.36-1.15c.29-.91.48-1.55.66-2.16.45-1.53.74-2.68.91-3.66.38-2.2.12-3.49-.85-4.15-2.35-1.61-9.28-.24-23.8 4.94-9.54 3.4-16.12 4.17-27.85 4.26-7.71.06-10.43.4-13.25 2.12-3.48 2.12-5.84 6.4-7.58 14.26-.5 2.2-.99 4.19-1.49 5.98v-3.98l.51-2.22c1.8-8.1 4.28-12.6 8.04-14.9 3.04-1.85 5.86-2.2 13.77-2.26 11.61-.09 18.1-.84 27.51-4.2 14.93-5.32 21.95-6.71 24.7-4.83 1.38.94 1.71 2.6 1.28 5.15a33.69 33.69 0 0 1-.94 3.78l-.66 2.17-.36 1.15-.37 1.2a36.64 36.64 0 0 1-2.33 6.1c-.8 1.53-1.61 2.52-2.86 3.61l-.92.77-1.02.83c-.9.74-1.65 1.4-2.47 2.18a68.84 68.84 0 0 0-7.48 8.66c-9.7 12.93-11.07 14.87-13.31 19.46-2.52 5.15-3.59 10.22-3.59 17.24 0 16.04-4.82 24.91-22.18 39.38-5.04 4.2-8.18 4.55-9.83 1.18-1.22-2.5-1.52-5.94-1.73-15.47-.2-9.16-.38-13.15-1.03-18.4-.79-6.34-2.12-11.8-4.19-16.49L0 495.98zM379.27 0h1.04l1.5 5.26c3.28 11.56 4.89 19.33 5.26 27.8.49 11.01-1.52 21.26-6.63 31.17-7.8 15.13-20.47 26.5-36.22 34.1-12.38 5.96-26.12 9.17-36.22 9.17-6.84 0-17.24 1.38-37.27 4.62l-2.27.37c-24.5 3.99-31.65 5-37.46 5-3.49 0-4.08-.08-19.54-2.8-3.56-.64-6.32-1.1-9-1.5-20.23-2.96-31-1.2-31.96 7.86-.1.85-.18 1.72-.29 2.81l-.27 2.73c-1.1 10.9-2.02 15.73-4.31 19.96-2.9 5.34-7.77 7.95-15.63 7.95-10.2 0-12.92.6-15.5 3.17.52-.51-5.03 5.85-8.16 8.7-2.75 2.5-14.32 12.55-15.77 13.83a341.27 341.27 0 0 0-6.54 5.92c-6.97 6.49-11.81 11.76-14.6 16.15-5.92 9.3-10.48 18.04-11.69 24.08-1.66 8.3 3.67 9.54 19.02 1.21a626.23 626.23 0 0 1 44.54-21.9c3.5-1.56 14.04-6.2 15.68-6.95 5.05-2.25 8.3-3.8 10.78-5.15l1.95-1.07 2.18-1.18c1.76-.94 3.38-1.76 5-2.55 18.1-8.72 34.48-10.46 50.33-1.2 22.89 13.34 38.28 37.02 38.28 56.44 0 19.12-.73 25.13-5.18 33.2a45.32 45.32 0 0 1-4.94 7.12c-6.47 7.77-11.81 16.2-12.76 21.27-1.2 6.34 4.69 7.03 20.17-.05 13.31-6.08 22.4-14.95 28.5-26.32a80.51 80.51 0 0 0 6.1-15.13c.9-2.98 3.17-11.65 3.41-12.48a29.02 29.02 0 0 1 1.75-4.83c7.47-14.93 21.09-30.5 36.25-37.24 7.61-3.38 13-9.65 19.4-20.79.84-1.48 4.26-7.64 5.14-9.17 3.52-6.1 6.22-9.7 9.37-11.98 10.15-7.4 28.7-11.1 50.29-11.1 7.52 0 16.54-1.24 27.51-3.58a420.1 420.1 0 0 0 14.96-3.52c-1.3.33 15.54-3.98 19.42-4.89 14.15-3.33 41.07-5.01 64.11-5.01 17.36 0 27.82-9.23 38.53-38.67 6.62-18.21 6.62-26.37 2.69-34.35l-1.18-2.37A13.36 13.36 0 0 1 587.5 58c0-4.03 0-4.01 2.5-24.56.46-3.73.8-6.74 1.12-9.64.9-8.45 1.38-15.2 1.38-20.8 0-.94-.02-1.94-.04-3h1c.03 1.06.04 2.06.04 3 0 5.65-.48 12.43-1.39 20.9-.3 2.91-.66 5.93-1.11 9.66-2.5 20.45-2.5 20.47-2.5 24.44 0 1.97.45 3.57 1.45 5.68.24.51 1.16 2.35 1.17 2.36 4.06 8.24 4.06 16.68-2.65 35.13-10.84 29.8-21.63 39.33-39.47 39.33-22.96 0-49.83 1.68-63.89 4.99-3.86.9-20.69 5.2-19.4 4.88a421.05 421.05 0 0 1-14.99 3.53c-11.04 2.35-20.11 3.6-27.72 3.6-21.4 0-39.76 3.67-49.7 10.9-3 2.19-5.64 5.7-9.1 11.68-.87 1.52-4.29 7.68-5.14 9.17-6.49 11.3-12 17.71-19.86 21.2-14.9 6.63-28.38 22.03-35.75 36.77a28.17 28.17 0 0 0-1.69 4.67c-.23.8-2.5 9.49-3.4 12.5a81.48 81.48 0 0 1-6.19 15.3c-6.2 11.56-15.44 20.58-28.96 26.76-16.1 7.36-23 6.55-21.58-1.04 1-5.29 6.4-13.83 12.99-21.73a44.33 44.33 0 0 0 4.82-6.96c4.35-7.88 5.06-13.77 5.06-32.72 0-19.04-15.19-42.4-37.72-55.55-15.57-9.08-31.62-7.38-49.45 1.21a132.9 132.9 0 0 0-7.14 3.71l-1.95 1.07a158.83 158.83 0 0 1-10.85 5.19c-1.65.74-12.18 5.38-15.69 6.95a625.25 625.25 0 0 0-44.46 21.86c-15.95 8.66-22.37 7.16-20.48-2.29 1.24-6.2 5.83-15.02 11.82-24.42 2.85-4.48 7.74-9.8 14.77-16.34 1.98-1.85 4.12-3.79 6.56-5.94 1.46-1.29 13.02-11.33 15.75-13.82 3.09-2.8 8.6-9.14 8.14-8.67 2.82-2.82 5.75-3.46 16.2-3.46 7.5 0 12.04-2.43 14.75-7.42 2.2-4.07 3.11-8.84 4.2-19.59l.26-2.73.3-2.81c.56-5.42 4.47-8.5 11.23-9.6 5.44-.88 12.51-.51 21.86.86 2.7.4 5.47.86 9.04 1.49 15.33 2.7 15.96 2.8 19.36 2.8 5.73 0 12.9-1.03 37.3-5l2.27-.36c20.1-3.26 30.52-4.64 37.43-4.64 9.95 0 23.54-3.18 35.78-9.08 15.57-7.5 28.09-18.73 35.78-33.65 5.02-9.75 7-19.82 6.51-30.67-.37-8.37-1.96-16.08-5.23-27.57L379.27 0zm13.68 0h1.02c.78 3.9 1.92 8.7 3.51 14.88 3.63 14.05 3.06 27.03-.75 38.77a61 61 0 0 1-11.35 20.68 138.36 138.36 0 0 1-19.32 18.77c-11.32 9.02-23.36 15.49-35.95 18.39a258.63 258.63 0 0 1-22.57 4.07c-3.17.44-6.36.85-10.3 1.32l-9.39 1.12c-11.53 1.41-17.45 2.55-21.64 4.46-9.28 4.21-28.35 6.04-49.21 6.04-1.37 0-2.8-.12-4.3-.35-2.62-.41-5-1.03-9.14-2.29-7.34-2.21-9.63-2.75-12.63-2.56-3.9.23-6.63 2.29-8.47 6.89-1.86 4.66-2.42 7.53-3.34 14.98-1.1 8.98-2.87 12.12-9.97 14.3a40.12 40.12 0 0 0-6.8 2.66c-.63.33-1.16.64-1.76 1.02l-1.34.86c-1.9 1.14-3.86 1.49-9.25 1.49-3.2 0-8.83-.55-9.51-.39-1.22.28-.75-.14-7.14 6.24-1.5 1.5-3.49 3.18-6.32 5.37-1.52 1.18-7.16 5.43-7.94 6.03-4.96 3.78-8.33 6.6-11.06 9.38-4.88 4.98-6.85 9.15-5.56 12.7 1.34 3.67 4.07 4.42 8.9 2.82a55.72 55.72 0 0 0 7.77-3.48c1.5-.77 7.78-4.13 9.37-4.96a116.8 116.8 0 0 1 12.31-5.68 162.2 162.2 0 0 0 11.04-4.84c2.04-.97 10.74-5.16 13-6.22 4.41-2.1 8.1-3.78 11.65-5.29 17.14-7.3 29.32-9.9 37.67-6.65l5.43 2.1c2.3.88 4.17 1.62 6.02 2.38a150.9 150.9 0 0 1 13.07 6c18.34 9.63 30.35 22.13 34.79 39.87 6.96 27.85 3.6 45.53-8.08 62.4-3.97 5.75-3.52 9.2.06 8.97 4.14-.28 10.21-4.95 15.11-12.52 3.1-4.8 5.1-10.45 8.05-21.53l1.69-6.35c.66-2.47 1.24-4.52 1.83-6.5 4.93-16.56 11-27.28 21.56-34.76 7.15-5.06 23.73-15.5 25.48-16.75 6.74-4.81 10.53-9.44 14.34-18 7.74-17.44 21.09-24.34 44.47-24.34 9.36 0 17.91-1.13 29.53-3.49a624.86 624.86 0 0 0 6.2-1.28c2.4-.5 4.07-.84 5.66-1.13 4.03-.74 7.04-1.1 9.61-1.1 4.44 0 9.39-1 31.39-5.99l2.95-.66c16.34-3.67 25.64-5.35 31.66-5.35 1.54 0 2.4.01 6.4.1 7.8.15 12.27.13 17.33-.2 16.41-1.06 26.73-5.36 29.8-14.56a87.1 87.1 0 0 1 3.55-8.83c-.15.31 2.29-4.96 2.9-6.38 5.38-12.3 5.57-21.92-1.44-39.44a86.4 86.4 0 0 1-5.26-20.72c-1.61-11.98-1.38-23.14.1-40.35l.2-2.12h1l-.2 2.2c-1.48 17.15-1.7 28.24-.11 40.14a85.4 85.4 0 0 0 5.2 20.47c7.1 17.78 6.91 27.67 1.43 40.22-.62 1.43-3.06 6.72-2.91 6.4a86.17 86.17 0 0 0-3.52 8.73c-3.23 9.72-13.9 14.15-30.68 15.24-5.1.33-9.58.35-17.42.2-3.98-.09-4.84-.1-6.37-.1-5.91 0-15.18 1.67-31.44 5.32l-2.95.67c-22.16 5.02-27.05 6.01-31.61 6.01-2.5 0-5.45.36-9.43 1.09-1.58.29-3.25.62-5.64 1.11a4894.21 4894.21 0 0 0-6.2 1.29c-11.68 2.37-20.3 3.51-29.73 3.51-23.02 0-36 6.71-43.53 23.66-3.9 8.8-7.82 13.58-14.7 18.5-1.78 1.27-18.36 11.7-25.48 16.75-10.34 7.32-16.3 17.87-21.19 34.23-.58 1.96-1.15 4-1.82 6.47l-1.69 6.35c-2.98 11.18-5 16.9-8.17 21.81-5.05 7.81-11.37 12.68-15.89 12.98-4.7.31-5.3-4.23-.94-10.53 11.52-16.64 14.82-34.03 7.92-61.6-4.35-17.42-16.16-29.72-34.27-39.22-4-2.1-8.2-4-12.99-5.97-1.84-.75-3.7-1.49-6-2.38l-5.43-2.08c-8.03-3.12-20.02-.58-36.92 6.63-3.52 1.5-7.21 3.19-11.61 5.27l-13 6.22c-4.71 2.22-8.16 3.75-11.11 4.88a115.87 115.87 0 0 0-12.21 5.63c-1.58.83-7.86 4.18-9.37 4.96a56.55 56.55 0 0 1-7.9 3.54c-5.3 1.75-8.62.85-10.17-3.43-1.46-4.02.66-8.5 5.8-13.74 2.75-2.82 6.16-5.66 11.15-9.48.79-.6 6.43-4.85 7.94-6.02a66.96 66.96 0 0 0 6.23-5.28c6.74-6.74 6.1-6.16 7.61-6.51.87-.2 6.69.36 9.74.36 5.22 0 7.03-.32 8.74-1.35l1.31-.84c.62-.4 1.18-.72 1.84-1.07a41.07 41.07 0 0 1 6.96-2.72c6.64-2.04 8.22-4.84 9.28-13.47.93-7.53 1.5-10.47 3.4-15.24 1.99-4.95 5.04-7.26 9.34-7.51 3.17-.2 5.5.35 12.97 2.6a63.54 63.54 0 0 0 9.02 2.26c1.45.22 2.83.34 4.14.34 20.71 0 39.7-1.82 48.8-5.96 4.32-1.96 10.29-3.1 21.93-4.53l9.4-1.12c3.92-.48 7.11-.88 10.27-1.32 8.16-1.14 15.4-2.43 22.49-4.06 12.42-2.86 24.33-9.26 35.55-18.2a137.4 137.4 0 0 0 19.18-18.64 60.02 60.02 0 0 0 11.15-20.32c3.76-11.57 4.32-24.36.75-38.23A284.86 284.86 0 0 1 392.95 0zM506.7 0h1.26c-.5.66-.9 1.18-1.17 1.51-3.95 4.96-6.9 7.92-9.82 9.57A10.02 10.02 0 0 1 492 12.5c-2.38 0-4.24.67-6.71 2.21l-2.65 1.71c-4.38 2.8-8.01 4.08-13.64 4.08-5.6 0-9.99-1.26-16.08-4.05a202.63 202.63 0 0 1-2.3-1.06l-2.18-.98c-1.6-.7-2.92-1.17-4.17-1.48a13.42 13.42 0 0 0-3.27-.43c-2.3 0-4.3-.68-11-3.37l-1.56-.62c-5-1.97-8.1-2.82-10.52-2.66-2.93.2-4.42 2.03-4.42 6.15 0 20.76-5.21 50.42-12.15 57.35-7.58 7.59-26.55 23.7-34.06 29.06-13.16 9.4-31.17 20.2-44.11 25.06a106.87 106.87 0 0 1-13.32 4.03c-3.28.78-6.6 1.43-11.25 2.24-.53.1-8.8 1.5-11.5 1.99-4.86.87-9.3 1.74-14 2.76-20.62 4.48-25.07 5.01-38.11 5.01-2.49 0-2.9-.07-14.05-2-2.42-.42-4.31-.73-6.15-1-8.11-1.19-13.83-1.36-17.64-.2-4.54 1.4-5.93 4.65-3.7 10.52 2.02 5.28 4.84 8.61 8.84 10.74 3.26 1.74 6.75 2.6 13.82 3.71 9.42 1.48 10.94 1.75 15.5 2.92a78.2 78.2 0 0 1 18.62 7.37c8.3 4.58 14.58 11.5 19.98 20.89 2.73 4.73 9.46 19.33 10.54 21.19 3.4 5.85 6.26 6.63 10.89 2 4.95-4.94 10.35-8.37 21.13-14.06.47-.25 2.06-1.1 2.12-1.12 7.98-4.21 11.92-6.51 15.87-9.54 5.11-3.9 8.66-8.1 10.77-13.11 8.52-20.24 20.75-33.31 32.46-33.31l5.5.03c10.53.08 17.35.02 24.9-.31 13.66-.62 23.78-2.09 29.39-4.67 5.85-2.7 13.42-5.49 24.18-9.02 3.46-1.14 6.29-2.05 12.7-4.1 7.7-2.45 11.08-3.54 15.17-4.9a1059.43 1059.43 0 0 1 11.33-3.72c3.67-1.2 5.96-2 8.03-2.78a59.88 59.88 0 0 0 6.66-2.94c1.87-.98 3.76-2.1 5.86-3.5 3.48-2.33 6.15-3.13 12.04-4.13l1.15-.2c5.71-1.01 9-2.3 12.76-5.63 7.82-6.96 8.58-23.18 3.84-44.52-1.7-7.67-2.1-19.28-1.57-35.47A837.22 837.22 0 0 1 546.76 0h1l-.15 3.06c-.32 6.42-.53 11.02-.68 15.62-.51 16.1-.12 27.65 1.56 35.21 4.82 21.68 4.04 38.2-4.16 45.48-3.91 3.48-7.37 4.84-13.24 5.87l-1.16.2c-5.76.99-8.32 1.75-11.65 3.98a63.73 63.73 0 0 1-5.96 3.56 60.86 60.86 0 0 1-6.77 2.99c-2.09.79-4.39 1.58-8.07 2.79a5398.31 5398.31 0 0 1-11.32 3.71c-4.1 1.37-7.48 2.46-15.18 4.92-6.42 2.04-9.24 2.95-12.7 4.08-10.73 3.53-18.27 6.3-24.07 8.98-5.76 2.66-15.97 4.14-29.77 4.77-7.56.33-14.4.39-24.95.31l-5.49-.03c-11.19 0-23.16 12.79-31.54 32.7-2.19 5.19-5.84 9.52-11.08 13.52-4.02 3.07-7.99 5.39-16.01 9.62l-2.12 1.12c-10.7 5.65-16.04 9.04-20.9 13.9-5.14 5.14-8.75 4.15-12.45-2.22-1.12-1.92-7.85-16.5-10.54-21.2-5.33-9.24-11.48-16.02-19.6-20.5a77.2 77.2 0 0 0-18.4-7.28c-4.5-1.17-6.02-1.43-15.4-2.9-7.17-1.12-10.74-2-14.13-3.81-4.22-2.25-7.2-5.77-9.3-11.27-2.43-6.39-.78-10.26 4.34-11.83 4-1.22 9.82-1.05 18.08.17 1.84.27 3.74.58 6.17 1 11.02 1.9 11.48 1.98 13.88 1.98 12.96 0 17.35-.52 37.9-4.99 4.71-1.02 9.16-1.9 14.03-2.77 2.71-.48 10.98-1.9 11.5-1.98 4.64-.81 7.95-1.46 11.2-2.23 4.55-1.07 8.76-2.34 13.2-4 12.83-4.81 30.79-15.59 43.88-24.94 7.47-5.33 26.4-21.4 33.94-28.94C407.3 61.98 412.5 32.49 412.5 12c0-4.61 1.86-6.9 5.35-7.15 2.63-.18 5.8.7 10.96 2.73l1.56.62c6.53 2.62 8.53 3.3 10.63 3.3 1.14 0 2.3.16 3.5.46 1.32.33 2.68.82 4.34 1.53a90.97 90.97 0 0 1 3.34 1.52l1.15.54c5.98 2.73 10.23 3.95 15.67 3.95 5.41 0 8.87-1.21 13.1-3.92.2-.13 2.1-1.38 2.66-1.72 2.62-1.63 4.64-2.36 7.24-2.36 1.47 0 2.94-.43 4.47-1.3 2.78-1.56 5.67-4.45 9.54-9.31l.7-.89zM324.54 600h-2.03c.49-2.96.91-6.2 1.28-9.66.44-4.1.76-8.25.98-12.21.08-1.39.14-2.65-.35-7.29-.47-1.94-.93-4.14-1.36-6.54-2.01-11.26-2.66-22.9-1.14-33.78a60.76 60.76 0 0 1 5.18-17.95 70.78 70.78 0 0 1 12.6-18.22c3.38-3.6 5.53-5.5 11.83-10.79 4.5-3.78 6.35-5.56 7.52-7.5.64-1.07.95-2.06.95-3.06 0-1.75 0-1.74-.75-9.23-.36-3.7-.57-6.3-.68-8.96-.5-12.1 1.62-19.6 8.11-21.76 15.9-5.3 25.89-12.1 33.45-25.54C409.6 390.65 425.85 376 436 376c12.36 0 20-1.96 29.41-8.8 6.76-4.92 9.5-6.6 12.47-7.46 2.22-.64 3.8-.74 9.12-.74 1.86 0 3.53-.83 5.57-2.62 1.08-.96 5.11-5.12 5.6-5.6 6.04-5.85 11.98-8.78 20.83-8.78 2.45 0 4.54.04 7.32.12 7.51.23 8.87.17 11.27-.7 3.03-1.1 5.53-3.03 14.75-11.17 8-7.06 10.72-8.92 22.87-16.47 1.44-.9 2.59-1.63 3.69-2.37a69.45 69.45 0 0 0 9.46-7.5c4.12-3.88 8.02-7.85 11.64-11.9v2.98a201.58 201.58 0 0 1-10.27 10.38c-3.18 3-6.2 5.35-9.72 7.7-1.12.76-2.28 1.5-3.75 2.4-12.05 7.5-14.71 9.32-22.6 16.28-9.46 8.35-12.01 10.32-15.39 11.55-2.74 1-4.19 1.06-12.01.82-2.76-.08-4.83-.12-7.26-.12-8.27 0-13.75 2.7-19.43 8.22-.44.43-4.52 4.64-5.68 5.66-2.37 2.09-4.46 3.12-6.89 3.12-5.1 0-6.6.1-8.56.66-2.67.78-5.29 2.37-11.85 7.15-9.8 7.13-17.85 9.19-30.59 9.19-9.22 0-24.96 14.2-34.13 30.49-7.84 13.94-18.24 21.02-34.55 26.46-5.31 1.77-7.21 8.51-6.75 19.78.1 2.6.31 5.19.68 8.84.75 7.62.75 7.58.75 9.43 0 1.38-.42 2.73-1.24 4.09-1.33 2.2-3.26 4.07-7.94 8-6.25 5.24-8.36 7.12-11.67 10.63a68.8 68.8 0 0 0-12.25 17.71 58.8 58.8 0 0 0-5 17.36c-1.49 10.66-.85 22.09 1.13 33.15.43 2.37.88 4.53 1.33 6.44.16.66.3 1.25.6 4.06a249.3 249.3 0 0 1-1.17 16.12c-.37 3.37-.78 6.53-1.25 9.44zm-13.4 0h-1.05l.12-.28c3.07-7.16 4.29-11.83 4.29-18.72 0-3.57-.07-4.93-.76-15.65-.77-12.04-1-19.64-.55-28.3.58-11.5 2.4-22.1 5.81-32.16 1.3-3.8 2.8-7.5 4.55-11.1 3.46-7.14 6.83-12.39 10.42-16.6a59.02 59.02 0 0 1 4.35-4.56c.43-.4 3-2.8 3.67-3.45 5.72-5.6 7.51-11.52 7.51-29.18 0-18.84 2.9-23.77 15.82-28.24 1.09-.37 1.92-.67 2.77-.98a51.3 51.3 0 0 0 6.1-2.7c4.95-2.6 9.64-6.22 14.44-11.42 25.5-27.63 37.15-35.16 56.37-35.16 8.28 0 14.54-1.95 22-6.3 1.78-1.03 13.82-8.82 18.16-11.27 2.83-1.59 5.66-3.03 8.63-4.39 7.92-3.6 13.97-4.45 26.6-4.8 7.53-.2 10.7-.49 14.26-1.58 4.55-1.4 8.06-4 10.93-8.43 2.2-3.41 6.85-7.08 14.66-12.06 1.61-1.03 3.27-2.05 5.65-3.5 9.53-5.85 11.56-7.13 14.81-9.57 5.34-4 9.3-8.37 13.68-14.77a204.2 204.2 0 0 0 5.62-8.75v1.9c-1.97 3.17-3.4 5.38-4.8 7.42-4.42 6.48-8.46 10.92-13.9 15-3.29 2.46-5.32 3.75-14.89 9.61a375.06 375.06 0 0 0-5.63 3.5c-7.7 4.9-12.26 8.52-14.36 11.76-3 4.63-6.7 7.39-11.48 8.85-3.68 1.12-6.9 1.42-14.53 1.63-12.5.34-18.44 1.18-26.2 4.7a111.08 111.08 0 0 0-8.56 4.35c-4.3 2.43-16.34 10.22-18.15 11.27-7.6 4.43-14.03 6.43-22.5 6.43-18.87 0-30.3 7.4-55.63 34.84-4.88 5.28-9.67 8.97-14.7 11.62-2 1.05-4 1.92-6.23 2.75-.86.32-1.7.62-5.37 1.87-5.08 1.76-7.44 3.25-9.28 6.37-2.23 3.78-3.29 9.94-3.29 20.05 0 17.9-1.87 24.07-7.8 29.89-.69.67-3.27 3.06-3.69 3.46a58.04 58.04 0 0 0-4.28 4.49c-3.53 4.14-6.86 9.32-10.28 16.38a95.19 95.19 0 0 0-4.5 10.99c-3.38 9.97-5.18 20.48-5.76 31.9-.44 8.6-.22 16.17.55 28.17.69 10.76.76 12.12.76 15.72 0 6.35-1.02 10.87-4.35 19zm25.08 0h-1c-.04-4.73.06-9.39.28-15.02.26-6.41-.4-11.79-2.53-24.37l-.31-1.86c-2.12-12.55-2.76-19.35-1.97-26.47 1.03-9.25 4.75-16.68 12-22.67 22.04-18.2 29.81-30.18 29.81-44.61 0-2.6-.3-4.81-.98-8.17-.97-4.79-1.1-5.68-.97-7.57.2-2.56 1.27-4.7 3.56-6.72 2.67-2.35 7.05-4.6 13.72-7.01 9.72-3.5 15.52-9.18 24.3-21.57l1.78-2.5c4.48-6.33 7.1-9.63 10.43-12.78 4.31-4.07 8.98-6.77 14.54-8.17 13.3-3.32 20.37-5.47 25.34-7.64a49.5 49.5 0 0 0 5.28-2.7c1.1-.65 1.75-1.04 4.24-2.6 2.7-1.68 5.22-2.08 11.38-2.28 5.44-.18 7.9-.43 10.97-1.41a21.47 21.47 0 0 0 9.54-6.22c4.87-5.3 10.03-7.61 17.79-8.9 1.07-.18 1.88-.3 3.86-.58 6.9-.97 9.94-1.69 13.48-3.62 4.5-2.45 6.79-4.44 23.46-19.68l3.14-2.85c9.65-8.71 16.12-13.83 21.42-16.48 4.25-2.12 7.6-4.69 11.22-8.6v1.45c-3.42 3.57-6.69 6-10.78 8.05-5.18 2.59-11.61 7.67-21.2 16.32l-3.12 2.85c-16.8 15.35-19.05 17.3-23.66 19.82-3.68 2-6.8 2.75-13.82 3.73-1.97.28-2.78.4-3.84.57-7.56 1.26-12.52 3.48-17.21 8.6a22.47 22.47 0 0 1-9.97 6.5c-3.2 1-5.72 1.27-11.25 1.45-5.98.2-8.39.57-10.89 2.13a144 144 0 0 1-4.25 2.61 50.48 50.48 0 0 1-5.39 2.75c-5.04 2.2-12.15 4.37-25.5 7.7-9.74 2.44-15.26 7.65-24.4 20.56l-1.77 2.5c-8.9 12.54-14.82 18.34-24.78 21.93-6.57 2.36-10.85 4.57-13.4 6.82-2.1 1.86-3.05 3.74-3.22 6.04-.13 1.76 0 2.63.95 7.3.7 3.42 1 5.7 1 8.37 0 14.79-7.93 27-30.18 45.39-7.03 5.8-10.64 13-11.64 22-.78 7-.14 13.73 1.96 26.2l.32 1.85c2.15 12.65 2.8 18.07 2.54 24.58-.22 5.57-.32 10.2-.28 14.98zM95.9 600h-2.04c.68-3.82 1.14-8.8 1.61-15.98.2-3.11.27-4.06.39-5.6 1.3-17.54 4.04-27.14 11.5-33.2 4.65-3.77 7.22-8.92 8.67-16 .51-2.52.7-3.87 1.33-9.17.66-5.5 1.16-8.06 2.24-10.36 1.45-3.09 3.82-4.69 7.39-4.69 14.28 0 38.48 9.12 53.6 20.2 8.66 6.35 21.26 13.32 31.74 17.11 13.03 4.71 21.89 4.41 24.75-1.73 1.7-3.64 1.92-4.11 2.65-5.77 2.93-6.67 4.69-12.2 5.25-17.5.23-2.17.24-4.23.02-6.2-.32-2.75-1.42-4.55-4.08-7.35l-1.32-1.37a30.59 30.59 0 0 1-2.41-2.79 30.37 30.37 0 0 1-2.5-4.07l-1.13-2.14c-1.62-3.1-2.68-4.6-4.12-5.56-5.26-3.5-14.8-5.5-28.55-6.83a272.42 272.42 0 0 0-9.04-.71l-2.18-.17c-9.57-.73-15.12-1.56-19.06-3.2C156.57 471.07 136 450.5 136 440c0-5.34 1.74-9.53 5.47-14.13 1.98-2.44 11.12-11.71 12.79-13.54 4.52-4.97 10.16-9.54 17.68-14.66 2.8-1.9 14.78-9.6 17.49-11.49a50.54 50.54 0 0 0 6.34-5.43c1.53-1.5 6.96-7.13 7.12-7.3 7.18-7.3 12.7-11.56 19.74-14.38 3.36-1.34 8.13-2.79 17.45-5.38a9577.18 9577.18 0 0 1 11.78-3.28 602.6 602.6 0 0 0 12.67-3.7c20.4-6.24 34-12.08 40.79-18.44 8.74-8.2 11.78-13.84 15.73-26.02 2.02-6.22 3.09-9.04 5.07-12.72 9.54-17.71 28.71-39.37 43.5-45.45C383.77 238.25 389 232.34 389 226c0-2.89 2.73-8.4 6.83-13.73 4.76-6.2 10.65-11.36 16.75-14.18 12.5-5.77 33.5-10.09 47.42-10.09 5.32 0 9.83-1.5 16.42-4.89 9.2-4.71 10.1-5.11 13.58-5.11 10.42 0 32.06-2.55 45.76-5.97l3.88-.98 3.47-.89c2.6-.66 4.33-1.08 5.93-1.43 3.9-.86 6.76-1.23 9.58-1.17 2.74.06 5.47.52 8.67 1.48 4.56 1.37 13.71-.9 22.87-5.68a68.07 68.07 0 0 0 9.84-6.2v2.4c-11.09 8.14-25.76 13.66-33.29 11.4a29.72 29.72 0 0 0-8.13-1.4c-2.63-.05-5.36.3-9.11 1.12a238 238 0 0 0-9.33 2.3l-3.9.99C522.38 177.43 500.58 180 490 180c-2.99 0-3.91.4-12.67 4.89-6.85 3.51-11.61 5.11-17.33 5.11-13.65 0-34.35 4.26-46.58 9.9-5.78 2.67-11.42 7.62-16 13.58-3.85 5.02-6.42 10.2-6.42 12.52 0 7.27-5.8 13.82-20.62 19.92-14.27 5.88-33.16 27.21-42.5 44.55-1.9 3.55-2.95 6.28-4.93 12.4-4.05 12.47-7.23 18.39-16.27 26.86-7.08 6.64-20.87 12.57-41.57 18.89a604.52 604.52 0 0 1-12.7 3.71 1495.1 1495.1 0 0 1-11.8 3.28c-9.24 2.58-13.97 4.01-17.24 5.32-6.73 2.69-12.05 6.8-19.05 13.92-.15.15-5.6 5.8-7.15 7.32a52.4 52.4 0 0 1-6.6 5.65c-2.74 1.92-14.75 9.63-17.5 11.5-7.4 5.04-12.94 9.52-17.33 14.35-1.72 1.9-10.8 11.11-12.71 13.46-3.47 4.26-5.03 8.03-5.03 12.87 0 9.5 20 29.5 33.38 35.08 3.67 1.53 9.1 2.34 18.45 3.05a586.23 586.23 0 0 0 4.34.32c3.24.23 5.07.37 6.93.55 14.08 1.37 23.82 3.4 29.45 7.17 1.82 1.2 3.02 2.91 4.8 6.29l1.11 2.13a28.55 28.55 0 0 0 2.34 3.81c.62.83 1.3 1.6 2.26 2.61.23.24 1.1 1.16 1.32 1.37 2.93 3.09 4.24 5.23 4.61 8.5.24 2.12.23 4.33-.01 6.64-.59 5.55-2.4 11.25-5.41 18.1-.74 1.67-.96 2.15-2.66 5.8-3.49 7.47-13.33 7.8-27.25 2.77-10.67-3.86-23.43-10.92-32.25-17.38C164.62 515.96 140.82 507 127 507c-5 0-6.4 3.02-7.64 13.29a99.03 99.03 0 0 1-1.36 9.33c-1.53 7.5-4.3 13.04-9.37 17.16-6.87 5.58-9.5 14.78-10.77 31.8-.11 1.52-.18 2.47-.38 5.57-.46 7.01-.91 11.99-1.57 15.85zm8.05 0h-1.02c.29-1.41.58-2.94.9-4.59l1.05-5.62c2.5-13.3 4.2-19.92 6.68-24.05 1.7-2.84 3.68-5.5 8.05-11.03 8.21-10.36 10.88-14.55 10.88-18.71l-.02-1.69c-.02-1.78-.02-2.7.02-3.77.21-5.05 1.47-8.2 4.64-9.4 3.92-1.5 10.39.44 20.12 6.43 9.56 5.88 17.53 10.7 25.91 15.66 1.31.78 14.27 8.41 17.67 10.45a714.21 714.21 0 0 1 6.42 3.9c13.82 8.5 38.94 5.05 46.3-7.83 3.6-6.28 4.54-8.52 7.78-17.32a82.3 82.3 0 0 1 1.18-3.07 42.27 42.27 0 0 1 4.06-7.64c9.33-13.98 14.92-26.1 14.92-36.72 0-3.66.75-6.62 3.36-14.85.52-1.64.83-2.66 1.15-3.73 3.64-12.23 3.04-19.12-4.29-24a23.1 23.1 0 0 0-9.98-3.78c-7.2-.93-14.49 1.17-23.91 5.88-1.55.78-6.64 3.44-7.6 3.93a62.6 62.6 0 0 0-4.14 2.3l-4.4 2.66c-11.62 6.92-20.4 9.18-32.81 6.08-3.32-.84-6.24-1.4-13.1-2.64-13.25-2.39-18.7-3.75-23.33-6.46-6.23-3.67-7.46-9.02-2.88-16.65A93.1 93.1 0 0 1 172 415.42a157 157 0 0 1 8.32-7.66c-.07.05 6.16-5.3 7.82-6.77a85.12 85.12 0 0 0 6.5-6.33c7.7-8.46 12.78-13.36 20.08-18.57 9.94-7.1 21.4-12.36 35.18-15.58 37.03-8.64 51-12.7 58.83-17.93 8.6-5.73 21.3-24.77 36.84-54.81 5.22-10.1 12.27-18.4 21.13-25.71 5.13-4.24 9.56-7.25 17.55-12.23 7.42-4.62 9.62-6.14 11.38-8.16a21.15 21.15 0 0 0 2.95-4.87c.61-1.3 2.87-6.47 3-6.77 1.36-3 2.56-5.4 3.95-7.73 6.53-10.97 16.03-18 31.4-20.8 12.73-2.3 19.85-2.7 29.68-2.3 3.25.13 4.13.16 5.6.14 5.15-.07 9.71-1.04 16.61-3.8 20.74-8.3 38.75-12.04 59.19-12.04 3.05 0 6.03.15 10.48.48l2.09.16c12.45.96 18.08.96 25.34-.63a49.65 49.65 0 0 0 14.09-5.45v1.15a50.52 50.52 0 0 1-13.88 5.28c-7.38 1.61-13.08 1.61-25.63.65l-2.08-.16c-4.43-.33-7.39-.48-10.41-.48-20.3 0-38.2 3.72-58.81 11.96-7.01 2.8-11.7 3.8-16.97 3.88-1.5.02-2.39-.01-5.66-.14-9.76-.4-16.8-.01-29.47 2.3-15.06 2.73-24.32 9.58-30.71 20.31a72.8 72.8 0 0 0-3.9 7.63c-.12.28-2.39 5.47-3.01 6.79a22 22 0 0 1-3.1 5.1c-1.86 2.13-4.07 3.66-11.6 8.35-7.95 4.96-12.35 7.95-17.44 12.15-8.76 7.23-15.73 15.43-20.89 25.4-15.61 30.2-28.36 49.32-37.16 55.19-7.98 5.32-21.97 9.39-59.17 18.07-13.65 3.18-24.98 8.39-34.82 15.42-7.22 5.16-12.27 10.01-19.92 18.43a86.07 86.07 0 0 1-6.57 6.4c-1.67 1.48-7.91 6.83-7.84 6.77-3.27 2.84-5.8 5.16-8.26 7.62a92.1 92.1 0 0 0-14.27 18.13c-4.3 7.16-3.22 11.89 2.53 15.26 4.47 2.63 9.88 3.99 23.24 6.39a185.7 185.7 0 0 1 12.92 2.6c12.11 3.03 20.64.84 32.06-5.96l4.4-2.65c1.66-1 2.96-1.73 4.2-2.35.95-.48 6.04-3.14 7.6-3.92 9.59-4.8 17.04-6.94 24.49-5.98a24.1 24.1 0 0 1 10.4 3.93c7.82 5.21 8.45 12.52 4.7 25.13-.32 1.07-.64 2.1-1.16 3.74-2.57 8.12-3.31 11.04-3.31 14.55 0 10.88-5.66 23.14-15.08 37.28a41.28 41.28 0 0 0-3.97 7.46c-.37.9-.73 1.82-1.18 3.04-3.25 8.85-4.21 11.13-7.84 17.47-7.67 13.42-33.43 16.95-47.7 8.18a578.4 578.4 0 0 0-6.4-3.89c-3.4-2.04-16.36-9.67-17.67-10.45-8.38-4.97-16.36-9.78-25.92-15.66-9.5-5.85-15.7-7.7-19.24-6.36-2.68 1.02-3.8 3.82-4 8.51a61.12 61.12 0 0 0-.02 3.72l.02 1.7c0 4.5-2.69 8.73-11.52 19.87-3.92 4.95-5.87 7.59-7.55 10.39-2.39 3.97-4.08 10.56-6.56 23.72l-1.05 5.62-.86 4.4zm10.5 0h-1c.03-.34.04-.68.04-1 0-12.39 8.48-33.57 19.16-43.37a26.18 26.18 0 0 0 3.67-4.17 35.8 35.8 0 0 0 2.88-4.9c.36-.72 1.75-3.66 2.1-4.36 3.22-6.29 6.84-6.54 16.97.39 1.34.9 6.07 4.16 6.4 4.38 2.62 1.8 4.67 3.2 6.7 4.56 5.03 3.39 9.37 6.2 13.51 8.7 14.33 8.67 25.49 13.27 34.11 13.27 16.86 0 32.71-5.95 39.6-14.8 1.59-2.04 3.2-5.17 5.06-9.63.8-1.92 1.64-4.06 2.67-6.8l2.74-7.33c4.66-12.44 7.76-19.06 11.56-23.27 7.9-8.79 14.87-36 14.87-52.67 0-1.9.17-3.11 1.02-8.27.37-2.2.58-3.6.74-5.07.63-5.51.21-9.46-1.68-12.39-4.6-7.1-19.7-9.23-38.46-4.78a100.57 100.57 0 0 0-18.94 6.3c-5.17 2.37-17.11 9.74-16.5 9.4-6.72 3.64-12.97 4.15-24.8 1.3-29.55-7.14-30.43-8.62-15.26-26.81 17.44-20.93 47.12-46.18 56.38-46.18 9.92 0 53.84-11.98 65.78-17.95 9.46-4.73 24.32-21.18 36.82-37.85.71-.95 13.5-21.6 19.2-29.6 9.35-13.13 18.22-22.55 26.95-27.53 7.29-4.17 13.16-10.28 18.8-18.73 1.93-2.9 10.52-17.65 12.73-20.41 1.54-1.93 3-3.21 4.52-3.89 14.07-6.25 24.22-9.04 39.2-9.04h29c4.05 0 7.36-.4 22.93-2.5l4.3-.57c9.92-1.3 16.57-1.93 21.77-1.93 1.66 0 2.95.01 6.03.04 18.61.19 28.55-.48 44.86-4.03 3.1-.67 6.13-1.78 9.11-3.31v1.12a37.96 37.96 0 0 1-8.9 3.17c-16.4 3.56-26.4 4.24-45.08 4.05-3.08-.03-4.36-.04-6.02-.04-5.15 0-11.76.63-21.64 1.92l-4.3.58c-15.64 2.11-18.94 2.5-23.06 2.5h-29c-14.81 0-24.84 2.75-38.8 8.96-1.34.6-2.69 1.78-4.14 3.6-2.16 2.68-10.72 17.39-12.68 20.33-5.72 8.57-11.7 14.8-19.13 19.04-8.57 4.9-17.36 14.23-26.63 27.24-5.68 7.97-18.47 28.64-19.22 29.63-12.6 16.8-27.52 33.32-37.18 38.15-12.06 6.03-56.14 18.05-66.22 18.05-8.82 0-38.39 25.15-55.62 45.82-14.6 17.52-14.19 18.21 14.74 25.2 11.6 2.8 17.6 2.3 24.09-1.2-.67.35 11.31-7.03 16.56-9.44 5.41-2.48 11.6-4.59 19.11-6.37 19.13-4.53 34.65-2.35 39.54 5.22 2.05 3.17 2.48 7.32 1.84 13.04a96.34 96.34 0 0 1-.75 5.13c-.84 5.08-1.01 6.29-1.01 8.1 0 16.9-7.03 44.33-15.13 53.33-3.68 4.09-6.76 10.65-11.37 22.96-.35.93-2.2 5.94-2.73 7.33-1.04 2.76-1.88 4.9-2.68 6.84-1.9 4.53-3.55 7.73-5.2 9.85-7.1 9.13-23.25 15.19-40.39 15.19-8.86 0-20.15-4.65-34.63-13.42-4.15-2.51-8.5-5.32-13.55-8.72a861.54 861.54 0 0 1-6.71-4.56l-6.4-4.39c-9.68-6.63-12.61-6.42-15.5-.75-.35.68-1.74 3.62-2.1 4.35a36.77 36.77 0 0 1-2.96 5.03c-1.12 1.57-2.37 3-3.81 4.33-10.47 9.6-18.84 30.51-18.84 42.63l-.03 1zm-29.65 0h-1.1c1.17-2.52 1.79-5.2 1.79-8 0-20 4.83-42.04 12.15-49.35 5.17-5.18 7.77-8.38 9.9-12.74 2.64-5.41 3.95-12 3.95-20.91 0-6.82 1.14-11.59 3.37-15.07 1.74-2.7 3.6-4.21 8.91-7.52a31.64 31.64 0 0 0 3.9-2.79c4.61-3.96 6.58-6.2 7.72-9.41 1.43-4.02.93-9.04-1.86-16.02a68.98 68.98 0 0 0-3.99-8.07l-.93-1.7a75.47 75.47 0 0 1-2.64-5c-5.16-10.71-3.77-18.9 7.68-29.78a204 204 0 0 1 26.81-21.55c3.96-2.69 16.8-10.8 19.24-12.5 1.99-1.4 4.33-3.3 7.77-6.3-.02 0 7.23-6.39 9.47-8.3 4.97-4.26 9.09-7.5 13.05-10.15 4.72-3.15 8.97-5.28 12.87-6.32 12.78-3.41 15.6-4.18 21.77-5.97 12.55-3.64 21.96-6.9 28.14-10a45.47 45.47 0 0 1 7.47-2.79c8.66-2.66 12.02-4.1 16.97-8.1 6.78-5.46 13.07-14.25 19.33-27.87 15.97-34.77 19.08-39.39 32.15-49.19 3.14-2.36 6.37-4.1 11.43-6.4l2.33-1.04c11.93-5.35 16.87-8.93 21.1-17.38 1.88-3.77 2.48-6.29 3.37-12.27.78-5.19 1.48-7.56 3.53-10.25 2.57-3.4 7.03-6.27 14.36-9.01 3.37-1.26 7.36-2.5 12.05-3.73 16.33-4.3 25.28-5.36 39.6-5.81 6.9-.22 9.5-.56 12.66-2 1.19-.54 2.36-1.23 3.58-2.11 3.7-2.7 8.14-4.54 13.24-5.67 5.71-1.27 10.69-1.54 18.7-1.45l2.35.02c2.82 0 6.8-1 19.7-4.69 10.83-3.08 15.95-4.31 19.3-4.31.82 0 1.9.13 3.55.41l5.01.9c9.82 1.68 17.44 1.89 25.15-.21 7.98-2.18 14.8-6.77 20.29-14.24V147c-5.47 7.04-12.21 11.42-20.03 13.55-7.88 2.15-15.63 1.94-25.58.23l-5-.9c-1.6-.26-2.64-.39-3.39-.39-3.2 0-8.32 1.22-19.74 4.48-12.35 3.53-16.3 4.52-19.26 4.52l-2.36-.02c-7.94-.1-12.85.17-18.47 1.42-4.97 1.11-9.3 2.9-12.88 5.5a21.4 21.4 0 0 1-3.75 2.22c-3.32 1.5-6 1.87-13.04 2.09-14.25.44-23.13 1.5-39.37 5.77a125.56 125.56 0 0 0-11.95 3.7c-7.17 2.7-11.49 5.46-13.93 8.68-1.9 2.52-2.58 4.76-3.33 9.8-.9 6.08-1.53 8.68-3.47 12.56a30.6 30.6 0 0 1-9.66 11.45c-3.12 2.26-5.95 3.73-11.93 6.4l-2.31 1.04c-5.01 2.27-8.18 3.99-11.25 6.29-12.9 9.68-15.93 14.17-31.85 48.8-6.31 13.76-12.7 22.68-19.6 28.25-5.08 4.1-8.53 5.57-17.3 8.27a44.64 44.64 0 0 0-7.33 2.73c-6.24 3.12-15.7 6.4-28.3 10.06a867.4 867.4 0 0 1-21.8 5.97c-3.77 1.01-7.93 3.1-12.56 6.19a137.35 137.35 0 0 0-12.95 10.07c-2.24 1.92-9.48 8.3-9.48 8.3a98.2 98.2 0 0 1-7.84 6.37c-2.46 1.72-15.32 9.83-19.26 12.5a203 203 0 0 0-26.69 21.45c-11.13 10.58-12.43 18.3-7.47 28.63a74.52 74.52 0 0 0 2.62 4.95l.94 1.7a69.84 69.84 0 0 1 4.03 8.17c2.88 7.2 3.4 12.46 1.89 16.73-1.22 3.43-3.28 5.77-8.02 9.84-1.14.97-2.32 1.8-5.3 3.67-3.92 2.45-5.69 3.89-7.31 6.42-2.13 3.3-3.22 7.89-3.22 14.53 0 9.05-1.34 15.79-4.05 21.34-2.19 4.49-4.85 7.77-10.1 13.01-7.07 7.07-11.85 28.9-11.85 48.65 0 2.8-.58 5.48-1.7 8zm282.54 0h-1.01l-1.1-5.8c-3.08-16.26-4.05-26.2-2.74-37.26.7-5.8.77-9.68.55-15.3-.18-4.45-.17-5.68.19-7.63.78-4.3 3.44-8.53 10.39-16.34 9.07-10.2 12.26-15.41 19.8-30.15 1.35-2.64 2.33-4.47 3.38-6.3.9-1.58 1.82-3.06 2.77-4.5 3.14-4.7 7.03-8.42 16.84-16.81 11.22-9.6 15.5-13.86 18.13-19.13.7-1.4 1.3-2.8 1.93-4.4a206 206 0 0 0 1.49-4.05c3.63-9.94 8.01-13.93 22.9-17.81 4.99-1.3 20.55-5.13 21.38-5.34 16.19-4.1 25.33-7.36 33.48-12.6 5.86-3.77 5.84-3.76 27.66-16.53l2.6-1.52c10.23-6 17.1-10.2 22.73-13.95a149.3 149.3 0 0 0 8.8-6.3 723.7 723.7 0 0 0 6.37-5.08A87.74 87.74 0 0 1 600 342.95v1.12a85.76 85.76 0 0 0-15.49 9.9c.18-.14-4.76 3.84-6.38 5.1a150.3 150.3 0 0 1-8.85 6.35c-5.65 3.76-12.53 7.96-22.78 13.97l-2.6 1.53c-21.8 12.75-21.78 12.74-27.63 16.5-8.27 5.32-17.49 8.61-33.78 12.73-.83.21-16.39 4.04-21.36 5.33-8.03 2.1-13.15 4.5-16.45 7.5-2.66 2.42-4 4.86-5.77 9.7l-1.5 4.07a51.12 51.12 0 0 1-1.96 4.47c-2.72 5.45-7.04 9.75-18.38 19.45-9.73 8.32-13.6 12.02-16.65 16.6a77.18 77.18 0 0 0-2.74 4.45c-1.05 1.81-2.01 3.63-3.35 6.25-7.58 14.81-10.82 20.08-19.96 30.36-6.83 7.7-9.4 11.78-10.15 15.86-.34 1.85-.34 3.04-.17 7.4.22 5.68.14 9.6-.55 15.47-1.3 10.92-.34 20.79 2.73 36.95l1.12 5.99zm-76.59 0h-2.1l1.39-4.3c1.04-3.3 1.93-6.78 2.68-10.4 2.65-12.73 3.27-23.63 3.27-41.3 0-5.71-1.86-9.75-4.13-9.75-2.94 0-6.96 5.61-10.93 17.08C271.14 579.68 258.3 593 238 593c-22.42 0-29.26-1.35-48.42-10.09a87.69 87.69 0 0 1-9.42-5.04c-2.95-1.8-12.78-8.57-14.84-9.72-4.2-2.36-7-2.71-9.72-.99-.63.4-1.26.91-1.9 1.55a57.69 57.69 0 0 1-4.31 3.86 147.88 147.88 0 0 1-3.06 2.44l-1 .8C137.01 582.43 134 587.18 134 597c0 1.02-.02 2.01-.07 3h-2c.05-.99.07-1.98.07-3 0-10.52 3.33-15.78 12.09-22.76a265.61 265.61 0 0 1 2-1.6c.83-.64 1.43-1.13 2.03-1.61a55.76 55.76 0 0 0 4.17-3.74c.74-.73 1.48-1.34 2.24-1.82 3.47-2.2 7-1.75 11.77.93 2.15 1.21 12.03 8 14.9 9.76a85.7 85.7 0 0 0 9.22 4.93C209.29 589.7 215.85 591 238 591c19.25 0 31.49-12.7 41.06-40.33 4.24-12.25 8.66-18.42 12.81-18.42 3.8 0 6.13 5.06 6.13 11.75 0 17.8-.63 28.8-3.3 41.7-.77 3.7-1.68 7.23-2.75 10.6-.4 1.3-.8 2.53-1.19 3.7zm-149.25 0 .5-.94a160.1 160.1 0 0 0 6.53-13.26c2.73-6.29 5.78-9.64 9.24-10.52 3.74-.95 7.15.74 12.56 5.13 5.43 4.4 6.07 4.86 7.73 5.1 1.6.22 4.28 1.14 8.86 2.95 1.3.5 10.78 4.35 13.85 5.55 3.07 1.2 5.85 2.25 8.49 3.18 3.1 1.1 5.98 2.04 8.65 2.81h-3.45c-1.76-.56-3.6-1.18-5.54-1.87a281.2 281.2 0 0 1-8.51-3.19c-3.08-1.2-12.57-5.04-13.86-5.55-4.5-1.78-7.15-2.68-8.63-2.9-1.94-.27-2.53-.7-8.22-5.3-5.17-4.2-8.36-5.78-11.69-4.94-3.1.78-5.94 3.92-8.56 9.95a161 161 0 0 1-6.82 13.8h-1.13zm112.89 0a30.34 30.34 0 0 0 11.27-6.27c1.55-1.36 3.32-3.46 5.34-6.29 1.05-1.46 2.15-3.1 3.41-5.04a349.73 349.73 0 0 0 2.5-3.9l.47-.75.93-1.47a89.17 89.17 0 0 1 3.25-4.86c1.05-1.43 1.82-2.23 2.44-2.46 1.02-.37 1.49.48 1.49 2.04l.01 2.11c.05 6.91-.08 11.32-.7 16.33a48.4 48.4 0 0 1-2.38 10.56h-1.07a46.47 46.47 0 0 0 2.45-10.68c.62-4.96.75-9.33.7-16.2l-.01-2.12c0-.97-.08-1.12-.15-1.1-.36.14-1.05.85-1.97 2.1a88.44 88.44 0 0 0-3.22 4.82l-.92 1.46-.48.75a1268.1 1268.1 0 0 1-2.5 3.92c-1.26 1.95-2.38 3.6-3.44 5.08-2.06 2.88-3.87 5.04-5.5 6.45a30.87 30.87 0 0 1-8.94 5.52h-2.98zm-183.72 0H69.3c3.37-3.43 5.19-8.33 5.19-15 0-18.6-.04-17.35 1.02-20.77.6-1.93 1.5-3.74 3.27-6.63.42-.7 4.92-7.8 6.78-10.86 3.04-4.97 11.04-16.5 12.21-18.56 3.48-6.08 4.72-12.06 4.72-24.18 0-7.85 2.5-14.2 8.1-23.44l2.84-4.63a72.67 72.67 0 0 0 2.49-4.4c1.62-3.15 2.48-5.78 2.62-8.28.2-3.78-1.3-7.29-4.9-10.9-5.13-5.12-8.6-5.43-11.2-1.85-2.12 2.92-3.48 7.74-5.06 16.47-.2 1.03-.82 4.6-.82 4.57-.83 4.67-1.4 7.33-2.1 9.6-1.35 4.42-3.7 7.61-8.36 12.26l-3.26 3.2c-6.38 6.39-9.68 11.51-11.36 19.5l-1.16 5.52c-.87 4.1-1.56 7.04-2.33 9.94-3.67 13.74-9.65 25.97-22.59 44.72-7.68 11.14-11.05 18.87-10.92 23.72h-1c-.12-5.16 3.35-13.05 11.1-24.28 12.87-18.67 18.8-30.8 22.44-44.42.77-2.88 1.45-5.8 2.32-9.89l1.16-5.51c1.73-8.22 5.13-13.5 11.64-20 .63-.64 2.84-2.8 3.25-3.21 4.57-4.54 6.82-7.62 8.12-11.84a81.58 81.58 0 0 0 2.07-9.48l.81-4.57c1.62-8.9 3-13.8 5.24-16.89 3-4.15 7.2-3.78 12.71 1.74 3.8 3.8 5.42 7.58 5.2 11.66-.15 2.66-1.05 5.41-2.73 8.68a73.6 73.6 0 0 1-2.52 4.46l-2.84 4.63c-5.52 9.1-7.96 15.3-7.96 22.92 0 12.28-1.28 18.43-4.85 24.68-1.2 2.1-9.21 13.65-12.22 18.58-1.87 3.06-6.37 10.18-6.78 10.86-1.73 2.82-2.6 4.57-3.17 6.4-1.02 3.28-.98 2.1-.98 20.48 0 6.52-1.7 11.44-4.82 15zM310.09 0h1.06c-.37.9-.77 1.83-1.2 2.82-3.9 9.06-5.45 15.15-5.45 25.18 0 7.64-2.1 11.6-6.64 13.05-3.46 1.1-5.72.98-17.57-.43-11.55-1.36-19.17-1.58-28.16-.14-6.24 2.49-25.91 7.02-32.13 7.02-11.15 0-36.76-2.88-54.12-7.01a22.08 22.08 0 0 0-16.95 2.48c-4.05 2.33-7.09 5.03-13.9 11.97-6.28 6.39-9.53 9.23-13.8 11.5-7.09 3.79-11.22 7.65-13.4 12.27-1.82 3.85-2.33 7.84-2.33 15.29 0 4.4-2.65 6.69-9.45 9.74.1-.05-2.97 1.31-3.84 1.71-8.78 4.06-12.71 8.29-12.71 16.55 0 12.52-4.86 19.22-17.34 27.96l-4.56 3.14c-1.9 1.3-3.3 2.3-4.67 3.3-.92.68-1.79 1.34-2.62 2-7.16 5.62-11 14.54-15.56 33.28-.63 2.57-3.3 14-4.07 17.14a350.44 350.44 0 0 1-5.2 19.33c-1.37 4.5-4.5 15.07-4.96 16.53-1.05 3.4-1.64 4.94-2.46 6.32-.82 1.4-6.85 9.08-12.64 18.27L0 277.98v-1.9l4.58-7.35a270.8 270.8 0 0 1 12.61-18.23c-.3.5 1.35-2.8 2.38-6.12.45-1.44 3.58-12.01 4.95-16.53 1.83-6.03 3.44-12.09 5.19-19.27.76-3.13 3.44-14.56 4.06-17.14 4.62-18.95 8.52-28.02 15.92-33.83.84-.67 1.72-1.33 2.65-2.01 1.38-1.02 2.8-2.01 4.7-3.32l4.54-3.14C73.83 140.57 78.5 134.13 78.5 122c0-8.74 4.2-13.26 13.29-17.45.88-.41 3.96-1.77 3.85-1.73 6.46-2.9 8.86-4.97 8.86-8.82 0-7.6.53-11.7 2.42-15.71 2.29-4.84 6.57-8.85 13.84-12.73 4.15-2.21 7.35-5 14.15-11.93 6.28-6.4 9.36-9.13 13.52-11.53a23.07 23.07 0 0 1 17.69-2.59c17.27 4.12 42.8 6.99 53.88 6.99 6.1 0 25.73-4.53 31.92-7 9.12-1.46 16.83-1.25 28.49.13 11.63 1.38 13.9 1.5 17.15.47 4.06-1.3 5.94-4.85 5.94-12.1 0-10.1 1.56-16.3 6.6-28zm25.12 0h1c.05 5.62.26 11.48.65 19.4.47 9.7.64 14.57.64 21.6 0 9.81-4.68 17.46-13.1 23.16-6.53 4.43-14.94 7.46-24.33 9.33-3.74.54-9.42.56-22.68.23-6.74-.17-9.35-.22-12.39-.22-2.77 0-4.97.43-7.63 1.36-.88.3-4.55 1.74-5.58 2.11-6.55 2.35-13.59 3.53-24.79 3.53-8.1 0-13.58-1.38-22.46-4.9l-3.18-1.25c-12.55-4.87-21.27-5.15-37.18 1.12-11.15 4.39-18.13 9.2-22.28 14.81-3.15 4.26-4.33 7.8-5.94 15.8-1.22 6.09-1.93 8.74-3.5 12.13-1.65 3.53-3.97 5.81-7.07 7.22-2.33 1.07-4.35 1.5-9.32 2.19-9.04 1.27-12.77 3.09-15.61 9.58-3.71 8.48-7.72 13.87-14.22 19.76-2.4 2.18-13.14 11.02-15.91 13.42-8.2 7.1-13.85 17.37-18.7 31.97a258.81 258.81 0 0 0-3.27 10.7c-.01.05-2.26 7.97-2.88 10.1-8.49 28.85-17.88 52.95-26.13 61.2-2.8 2.8-5.06 5.64-10.4 12.96-3.4 4.68-6.23 8.25-8.95 11.1v-1.55c2.74-2.98 5.73-6.82 9.48-11.97 4.03-5.52 6.32-8.4 9.17-11.24 8.07-8.08 17.44-32.14 25.87-60.8.62-2.1 2.86-10.03 2.88-10.08 1.21-4.24 2.21-7.53 3.28-10.74 4.9-14.75 10.63-25.16 19-32.4 2.78-2.42 13.5-11.25 15.89-13.4 6.4-5.8 10.32-11.09 13.97-19.43 1.68-3.83 4.05-6.31 7.2-7.86 2.4-1.17 4.64-1.67 9.53-2.36 4.54-.63 6.5-1.05 8.7-2.06 2.89-1.31 5.03-3.42 6.58-6.73 1.53-3.3 2.23-5.9 3.43-11.9 1.64-8.14 2.85-11.79 6.11-16.2 4.28-5.79 11.41-10.7 22.73-15.16 16.15-6.36 25.13-6.07 37.9-1.11l3.19 1.26c8.77 3.47 14.13 4.82 22.09 4.82 11.09 0 18.02-1.16 24.46-3.47 1-.36 4.68-1.8 5.58-2.11A22.5 22.5 0 0 1 265 72.5c3.05 0 5.67.05 14.07.26 11.53.29 17.2.27 20.83-.25 9.25-1.85 17.54-4.83 23.94-9.17C332 57.8 336.5 50.46 336.5 41c0-7-.17-11.86-.7-22.7-.35-7.26-.55-12.83-.59-18.3zM93.87 0h2.04c-.7 4-1.61 6.82-3.03 9.47-2.33 4.38-2.85 5.75-5.26 13.03a40.46 40.46 0 0 1-1.94 5.03c-2.24 4.66-5.92 8.8-13.07 14.26-8.01 6.13-14.27 16.55-20.03 31.55-2.4 6.23-8.75 25.63-9.64 28.01-2.69 7.16-6.56 12.7-15.63 23.68l-2.68 3.24c-6.02 7.34-9.35 12.07-11.72 17.15-2.3 4.94-7.12 9.9-12.91 14.15v-2.4c5.14-3.94 9.1-8.3 11.1-12.6 2.46-5.27 5.87-10.1 11.98-17.56l2.68-3.26c8.94-10.8 12.72-16.22 15.3-23.1.88-2.33 7.24-21.74 9.65-28.03 5.89-15.31 12.3-26 20.68-32.41 6.92-5.3 10.4-9.2 12.48-13.55.65-1.35 1.16-2.7 1.85-4.79 2.45-7.4 3-8.83 5.4-13.34A27.68 27.68 0 0 0 93.87 0zm9.07 0h1.02c-1.66 8.3-2.91 12.67-4.54 15.26a59.14 59.14 0 0 0-4.1 8.21c-1.27 3-2.44 6.2-3.5 9.4-.38 1.12-.7 2.16-2.41 5.39a251.48 251.48 0 0 0-12.81 13.3c-3.48 3.96-5.95 7.27-7.15 9.66-.95 1.9-2.06 5.99-3.61 12.97-.64 2.9-3.65 17.15-4.51 21.07-3.63 16.45-6.63 26.69-9.9 32-7.66 12.45-10.64 15.71-37.08 41.1A69.78 69.78 0 0 1 0 179.21v-1.15a69.39 69.39 0 0 0 13.65-10.42c26.4-25.33 29.32-28.55 36.92-40.9 3.2-5.18 6.18-15.37 9.78-31.7.86-3.91 3.87-18.16 4.51-21.06 1.57-7.09 2.7-11.2 3.7-13.2 1.24-2.5 3.76-5.86 7.29-9.89.9-1.03 1.86-2.1 2.86-3.18 2.4-2.6 4.96-5.22 7.53-7.76.9-.88 1.73-1.7 3.37-3.4a129.02 129.02 0 0 1 4.78-13.46 60.07 60.07 0 0 1 4.19-8.35c1.52-2.44 2.74-6.71 4.36-14.74zM83.71 0h1.1c-2.09 4.74-6.03 8.92-11.42 12.3-7.2 4.52-16.5 7.2-24.39 7.2-8.9 0-11.8 7-11.74 21.52 0 1.7.04 3.17.12 5.99.1 3.3.12 4.45.12 5.99 0 5.73-.76 11.3-2.01 16.5a66.67 66.67 0 0 1-2.15 6.97 2597.76 2597.76 0 0 1-7 15.86 4270.8 4270.8 0 0 1-19.9 43.87A54.64 54.64 0 0 1 0 147v-1.65a54.87 54.87 0 0 0 5.55-9.57A4269.82 4269.82 0 0 0 30.7 79.97c.53-1.2.99-2.23 2.44-5.9A69.23 69.23 0 0 0 36.5 53c0-1.52-.03-2.66-.12-5.95-.08-2.83-.12-4.31-.12-6.01-.03-6.79.53-11.62 2.07-15.34 1.94-4.68 5.39-7.19 10.67-7.19 7.7 0 16.81-2.63 23.86-7.05C77.93 8.27 81.66 4.38 83.7 0zm282.63 0h1.01c1.86 10.02 2.18 12.67 2.32 18.3a123.43 123.43 0 0 1 .37 27.83c-.96 8.78-3.1 16.01-6.63 21.15-11.34 16.5-39.8 29.22-66.41 29.22-5.09 0-10.47.28-16.31.83a413.8 413.8 0 0 0-24.37 3.16c-21.56 3.26-27.66 4.01-36.32 4.01-6.92 0-12.2-1.05-21.69-3.9l-2.78-.83c-1.39-.41-2.54-.74-3.65-1.02-8-2.05-14.22-2.04-21.7.72a16.32 16.32 0 0 0-9.17 8.18c-1.6 3.05-2.5 6.06-4.02 12.83-1.5 6.64-2.34 9.52-3.99 12.64a16.16 16.16 0 0 1-9.85 8.36 104.8 104.8 0 0 0-9.5 3.42c-6.55 2.8-10.1 5.57-13.8 10.47-1.33 1.75-1.03 1.3-5.43 7.9-1.98 2.97-4.66 5.8-8.48 9.14-2.01 1.76-10.71 8.83-12.88 10.7-7.37 6.35-12.58 12.14-16.63 19.14-4.22 7.3-7.8 18.3-11.28 33.26-.87 3.73-1.72 7.64-2.64 12.14l-1.18 5.8-1.09 5.45c-1.8 8.96-2.77 13.28-3.77 16.26-6.8 20.44-17.26 42.16-27.13 51.2-5.11 4.7-8.1 7.07-11.1 8.86-.9.54-1.84 1.04-2.92 1.57-.44.22-9.6 4.4-14.1 6.66l-1.22.62v-1.13l.78-.39c4.52-2.26 13.67-6.44 14.1-6.65a41.19 41.19 0 0 0 2.84-1.54c2.94-1.75 5.88-4.09 10.94-8.73 9.71-8.9 20.1-30.51 26.87-50.79.97-2.92 1.94-7.22 3.73-16.13l1.1-5.46a490.5 490.5 0 0 1 3.82-17.96c3.5-15.06 7.1-26.14 11.39-33.54 4.11-7.11 9.4-12.98 16.83-19.4 2.19-1.88 10.88-8.95 12.88-10.7 3.77-3.28 6.39-6.05 8.3-8.93 4.43-6.64 4.12-6.18 5.47-7.96 3.8-5.03 7.5-7.91 14.21-10.78 2.61-1.12 5.74-2.24 9.59-3.46a15.17 15.17 0 0 0 9.27-7.86c1.59-3.02 2.42-5.85 4.03-12.99 1.41-6.27 2.32-9.33 3.98-12.48a17.31 17.31 0 0 1 9.7-8.66c7.7-2.83 14.1-2.84 22.3-.75 1.12.29 2.28.61 3.68 1.03l3.73 1.11c8.47 2.54 13.66 3.58 20.46 3.58 8.59 0 14.67-.75 36.18-4a414.64 414.64 0 0 1 24.41-3.17c5.88-.54 11.29-.83 16.41-.83 26.3 0 54.45-12.58 65.59-28.78 3.42-4.98 5.5-12.06 6.46-20.7.84-7.74.73-16.02.02-23.9a136.2 136.2 0 0 0-.57-5.12c0-4.47-.3-6.94-2.16-17zM18.88 0h1.03C18 7.57 17.15 10.18 14.46 16.2c-1.95 4.37-2.67 9.19-2.42 14.89.2 4.33.71 7.7 2.28 16.13 1.09 5.88 1.57 8.77 1.94 12.2.96 8.9.24 16.08-2.8 22.79A463.4 463.4 0 0 1 0 109.43v-2.12a465 465 0 0 0 12.54-25.52c2.97-6.52 3.67-13.53 2.72-22.27-.36-3.4-.84-6.26-1.93-12.12-1.57-8.47-2.1-11.88-2.29-16.27-.26-5.84.48-10.81 2.5-15.33 2.64-5.9 3.48-8.47 5.34-15.8zm280.47 0a70.78 70.78 0 0 1-4.91 11.24c-2.56 4.7-4.01 8.45-4.86 11.98l-.4 1.8-.28 1.45a5.28 5.28 0 0 1-.74 2.07c-.74 1.03-1.93 1.28-5.13 1.25.92 0-9.85-.29-15.03-.29-10.2 0-18.45.82-29.46 2.56-16.87 2.66-17.73 2.77-23.66 2.52a42.57 42.57 0 0 1-8-1.09c-17.7-4.16-46.18-5.86-54.72-3.01-2.72.9-5.88 2.8-9.52 5.59a112.37 112.37 0 0 0-6.54 5.48c-1.4 1.25-9.17 8.5-10.78 9.84-1.45 1.2-8.18 7.42-8.85 8.02a114.65 114.65 0 0 1-4.55 3.9c-4.99 4.03-8.9 6.2-11.92 6.2-3.52.05-4.32 0-5.14-.4-1.13-.56-1.5-1.72-1.13-3.57.74-3.63 4.47-10.84 12.84-24.8 5.69-9.48 9.42-18 11.78-26.2 1.45-5.04 1.94-7.4 2.97-14.54h1.01c-1.05 7.3-1.54 9.7-3.01 14.82-2.39 8.28-6.16 16.89-11.9 26.44-8.3 13.84-12 21.01-12.7 24.48-.3 1.45-.08 2.14.59 2.47.6.3 1.35.35 3.48.3 3.92 0 7.69-2.1 12.5-5.98a114.6 114.6 0 0 0 4.51-3.86c.66-.59 7.41-6.83 8.88-8.05 1.59-1.33 9.34-8.55 10.75-9.82 2.4-2.15 4.55-3.96 6.6-5.53 3.72-2.85 6.97-4.8 9.81-5.74 8.76-2.92 37.41-1.22 55.27 2.99 2.57.6 5.14.95 7.81 1.06 5.84.25 6.7.14 23.47-2.51 11.05-1.75 19.36-2.57 29.6-2.57 5.2 0 15.99.3 15.05.29 2.87.03 3.84-.17 4.3-.83.23-.32.4-.8.58-1.7l.28-1.43.4-1.85c.88-3.6 2.36-7.44 4.96-12.22A69.5 69.5 0 0 0 298.29 0h1.06zm-8.59 0c-5.91 17.94-9.55 22-19.76 22-4.5 0-10.22.32-28.69 1.5l-1.53.1c-15.6.99-23.47 1.4-28.78 1.4-5.35 0-13.24-.96-28.86-3.28l-1.54-.23C163.18 18.75 157.47 18 153 18c-4.45 0-7.3 1.01-10.96 3.34-.1.06-1.8 1.17-2.3 1.47-2.43 1.5-4.32 2.19-6.74 2.19-2.8 0-4.11-1.46-4.11-4.22 0-1.04.16-2.29.5-4.1.16-.82.9-4.4 1.07-5.32.8-4.11 1.3-7.68 1.47-11.36h2c-.17 3.82-.68 7.5-1.5 11.75-.19.94-.92 4.5-1.07 5.31a21.04 21.04 0 0 0-.47 3.72c0 1.7.46 2.22 2.11 2.22 1.99 0 3.55-.57 5.7-1.9.47-.28 2.15-1.37 2.26-1.44C144.92 17.14 148.12 16 153 16c4.62 0 10.3.74 28.9 3.51l1.53.23C198.93 22.04 206.8 23 212 23c5.25 0 13.11-.41 28.65-1.4l1.54-.1C260.73 20.32 266.43 20 271 20c8.95 0 12.15-3.4 17.66-20h2.1zM141.51 0h1.13c-2.06 3.86-2.63 5.1-2.77 6.19-.15 1.12.42 1.64 2.32 1.96 1.8.3 3.85.35 10.81.35 6.02 0 13 .56 21.35 1.62 3.95.5 8.03 1.1 13.13 1.89 24 3.7 22.5 3.49 26.83 3.49 24.02 0 51.83-2.24 60.45-6.94 2.88-1.57 5.05-4.49 6.6-8.56h1.07c-1.64 4.47-3.98 7.69-7.2 9.44-8.83 4.82-36.67 7.06-60.92 7.06-4.41 0-2.84.22-26.98-3.5-5.1-.8-9.17-1.38-13.1-1.88-8.31-1.06-15.26-1.62-21.23-1.62-7.04 0-9.1-.05-10.97-.37-2.38-.4-3.38-1.32-3.15-3.07.16-1.22.69-2.41 2.63-6.06zm76.4 0c5.69 1.64 10.37 2.5 14.09 2.5 9.59 0 16.7-.71 22.4-2.5h2.98C251.12 2.53 243.2 3.5 232 3.5c-4.5 0-10.32-1.21-17.53-3.5h3.45zM70.69 0c-2.87 3.27-6.95 5.39-12.02 6.53-3.98.89-7.5 1.08-12.92 1A97.24 97.24 0 0 0 44 7.5c-5.37 0-8.86-1.24-10.1-4.97A8.6 8.6 0 0 1 33.5 0h.99c.02.82.14 1.56.36 2.22C35.91 5.39 39.02 6.5 44 6.5l1.76.02c5.35.09 8.8-.1 12.69-.97C62.95 4.54 66.63 2.74 69.3 0h1.37zM0 207.87c7.31-.16 11.5 3.33 11.5 11.13 0 11.41-5.05 28.35-11.5 41.5v-2.3c5.93-12.72 10.5-28.47 10.5-39.2 0-7.18-3.7-10.3-10.5-10.13v-1zm0 7.05c1.23.14 2.18.58 2.87 1.31 1.4 1.48 1.6 3.72 1.16 7.58l-.16 1.3A28.93 28.93 0 0 0 3.5 229c0 3.2-1.48 9.52-3.5 15.9v-3.45c1.49-5.13 2.5-9.87 2.5-12.45 0-.98.08-1.75.37-4.02l.16-1.29c.42-3.56.24-5.59-.88-6.77-.5-.53-1.21-.87-2.15-1v-1zM0 410.9v-1.47a21.67 21.67 0 0 0 2.97-4.7c1.32-2.7 2.68-6.28 4.56-11.89 7.85-23.55 7.83-26.6.25-30.4-2.25-1.12-4.8-1.43-7.78-.91v-1.02a13.1 13.1 0 0 1 8.22 1.04c8.24 4.12 8.26 7.6.25 31.6-1.88 5.66-3.25 9.27-4.6 12.02A20.82 20.82 0 0 1 0 410.9zM33.64 452c1.68 0 3.04-.23 8.34-1.31l2.38-.47c8.26-1.57 12.72-1.3 14.53 2.33 1.38 2.75-.47 5.86-4.75 9.68a75.6 75.6 0 0 1-5.08 4.07c-.94.7-4.89 3.59-5.79 4.27-1.86 1.4-2.97 2.37-3.47 3.03a19.08 19.08 0 0 0-2.89 5.5c.07-.2-4.02 13.65-6.96 22.22-2.7 7.85-5.56 10.72-8.82 8.59-2.11-1.4-3.66-4.24-6.6-11.03-1.98-4.62-2.5-5.76-3.4-7.4-4.55-8.18-3.9-23.9-.05-32.87a9.6 9.6 0 0 1 6.98-5.96c2.59-.66 4.86-.75 11.78-.67l3.8.02zm0 2c-1.13 0-2.09 0-3.82-.02-12.07-.13-14.83.57-16.9 5.41-3.63 8.47-4.26 23.55-.05 31.12.96 1.73 1.48 2.88 3.5 7.58 2.72 6.3 4.24 9.08 5.86 10.14 1.64 1.08 3.5-.8 5.82-7.55a682.9 682.9 0 0 0 6.97-22.24 21.03 21.03 0 0 1 3.18-6.04c.65-.87 1.85-1.9 3.86-3.43.92-.7 4.87-3.57 5.8-4.27 2.02-1.5 3.6-2.77 4.95-3.97 3.63-3.23 5.09-5.7 4.3-7.28-1.21-2.42-5.07-2.65-12.38-1.27l-2.35.47c-5.49 1.11-6.86 1.35-8.74 1.35zm345.63 146c-3.45-12.26-3.77-14.13-3.77-19 0-3.33-.13-6.27-.43-11.34-.63-10.33-.65-13.5.26-17.07 1.21-4.74 4.21-7.1 9.67-7.1h26c4.08 0 5.19 1.85 5.93 7.11.1.79.13.97.19 1.32.84 5.35 2.8 7.58 8.88 7.58 3.64 0 5.54.4 6.43 1.37.76.83.76 1.44.36 3.93-.85 5.26.5 8.85 7.5 13.8 6.32 4.45 11.63 5.36 16.55 3.37 3.8-1.54 6.73-4.16 11.92-10l1.1-1.23 1.09-1.23a75.6 75.6 0 0 1 2.7-2.86 35.81 35.81 0 0 1 9.57-6.73c1.52-.76 1.72-.86 5.66-2.63 6.1-2.73 9.01-4.5 11.74-7.62 2.63-3 4.67-4.85 6.7-6.04 3.18-1.85 5.46-2.13 13.68-2.13 5.98 0 10.56-4.32 18-14.99l2.82-4.03c1.06-1.5 1.94-2.7 2.79-3.79 7.87-10.12 19.38-10.4 30.74.96 5.54 5.53 10.17 19.43 13.64 38.51 2.5 13.75 4.18 29.46 4.47 39.84h-1c-.3-10.32-1.96-25.97-4.45-39.66-3.43-18.87-8.02-32.65-13.36-37.99-10.95-10.95-21.76-10.68-29.26-1.04-.83 1.07-1.7 2.26-2.75 3.75l-2.81 4.02c-7.65 10.95-12.38 15.42-18.83 15.42-8.04 0-10.21.26-13.17 2-1.92 1.12-3.9 2.9-6.45 5.83-2.86 3.26-5.87 5.09-12.09 7.88a103.35 103.35 0 0 0-5.62 2.6 34.84 34.84 0 0 0-9.32 6.54 74.67 74.67 0 0 0-3.75 4.05l-1.1 1.24c-5.28 5.95-8.29 8.64-12.28 10.25-5.26 2.13-10.92 1.17-17.5-3.48-7.33-5.17-8.82-9.15-7.92-14.77.34-2.12.34-2.6-.1-3.1-.64-.69-2.34-1.04-5.7-1.04-6.63 0-8.96-2.63-9.87-8.42l-.2-1.34c-.67-4.82-1.53-6.24-4.93-6.24h-26c-5 0-7.6 2.04-8.7 6.34-.88 3.43-.85 6.57-.23 16.76a177 177 0 0 1 .43 11.4c0 4.78.32 6.63 3.81 19h-1.04zm13.68 0c-1.31-6.58-1.61-10.71-1.36-14.84.04-.7.1-1.44.18-2.38l.23-2.56c.34-3.81.5-6.97.5-11.22 0-4.94 1.46-7.76 4.21-8.42 2.38-.58 5.56.54 9.2 3 6.64 4.52 13.99 13.07 16.55 19.23 4.77 11.44 14.12 15.69 33.54 15.69 8.6 0 14.32-2.35 20.67-7.88 1.45-1.26 15.06-15 21-20 7.21-6.07 11.77-7.59 20.62-8.32 5.52-.45 7.98-.9 11.44-2.36 4.58-1.95 9.36-5.48 14.9-11.29 7.43-7.76 13.25-8.92 17.47-4.3 3.32 3.63 5.46 10.58 6.82 20.24.73 5.17.94 7.74 1.58 17.38.25 3.75.17 5.32-.92 18.03h-1c1.09-12.7 1.17-14.28.92-17.97-.64-9.6-.85-12.16-1.57-17.3-1.33-9.47-3.43-16.27-6.56-19.7-3.76-4.11-8.93-3.08-16 4.32-5.65 5.9-10.54 9.5-15.25 11.5-3.58 1.53-6.13 1.99-11.6 2.44-8.8.72-13.17 2.18-20.2 8.1-5.9 4.96-19.5 18.7-21 19.99-6.52 5.68-12.47 8.12-21.32 8.12-19.78 0-29.5-4.42-34.46-16.3-2.49-5.97-9.71-14.38-16.2-18.79-3.42-2.32-6.36-3.35-8.4-2.86-2.2.53-3.44 2.92-3.44 7.45 0 4.28-.16 7.47-.5 11.31l-.23 2.56c-.09.93-.14 1.65-.19 2.35-.24 4.08.06 8.18 1.39 14.78h-1.02zm113.75 0c2.52-3.26 8.93-11.79 10.9-14.3 5.48-6.98 13.05-12.38 19.4-13.94 7.01-1.71 11.5 1.45 11.5 9.24 0 4.02-.04 5.16-.74 19h-1c.7-13.85.74-15 .74-19 0-7.12-3.86-9.83-10.26-8.26-6.11 1.5-13.5 6.77-18.85 13.57-1.86 2.36-7.65 10.07-10.43 13.69h-1.26zm-9.86-338.96c3.44 2.71 7 5.1 11.44 7.75 1.06.64 8.42 4.9 10.35 6.1 11.27 7 15 13.35 12.35 25.33-1.45 6.52-4.53 11.1-9.39 14.44-3.83 2.63-8.07 4.26-16.08 6.56-11.97 3.45-13.68 3.99-18.82 6.28a60.18 60.18 0 0 0-7.81 4.18c-11.11 7.07-19.1 7.7-27.96 3.28-3.56-1.77-17.2-11-17.2-11.01a101.77 101.77 0 0 0-5.2-3.07c-16.04-8.83-34.27-24.16-34.52-31.85-.11-3.46 1.99-6.57 6.28-10.26 1.03-.9 2.18-1.81 3.68-2.95.72-.55 3.38-2.56 3.94-3 4.47-3.4 7.18-5.79 9.32-8.45 11.12-13.82 26.55-28.68 34.36-32.28 12.06-5.54 19.84-5.77 27.37.12 3.25 2.54 5.65 6.54 8.58 13.35.29.65 2.3 5.45 2.88 6.74 1.62 3.65 2.9 5.8 4.24 6.94.72.6 1.45 1.2 2.2 1.8zm-3.49-.28c-1.63-1.39-3.03-3.74-4.77-7.65-.58-1.3-2.6-6.12-2.88-6.76-2.81-6.5-5.08-10.3-7.98-12.56-6.83-5.35-13.85-5.15-25.3.12-7.45 3.42-22.7 18.12-33.64 31.72-2.27 2.82-5.08 5.3-9.67 8.79l-3.94 2.98a79.98 79.98 0 0 0-3.59 2.88c-3.87 3.33-5.67 6-5.58 8.69.21 6.64 18.14 21.72 33.48 30.15 1.76.97 3.5 2 5.3 3.13.12.08 13.61 9.22 17.03 10.92 8.22 4.1 15.46 3.52 26-3.18a62.17 62.17 0 0 1 8.07-4.31c5.25-2.35 7-2.9 19.08-6.38 7.8-2.24 11.9-3.82 15.5-6.3 4.44-3.04 7.23-7.18 8.56-13.22 2.44-11.02-.83-16.6-11.45-23.2-1.9-1.18-9.23-5.42-10.32-6.08-4.5-2.69-8.13-5.12-11.64-7.9-.77-.6-1.52-1.21-2.26-1.84zM87.72 241.6c4.3-2.98 7.88-5 12.14-6.95.84-.4 1.73-.78 2.78-1.24l4.37-1.88a164.3 164.3 0 0 0 17.74-8.96 320.67 320.67 0 0 1 27.87-14.5c4.22-1.95 21.89-9.84 21.17-9.52 19.17-8.62 28.1-6.93 49.5 8.05 7.91 5.54 13.24 13.25 16.45 22.66 3.02 8.83 3.76 16.51 3.76 27.75 0 8.32-.66 12.95-3.68 18.97-4.18 8.36-12.3 16.14-25.58 23.47-24.45 13.49-38.83 27.55-52.83 47.84-8.83 12.8-47.76 44.21-65.16 54.15C75.04 413.55 48.89 423.5 31 423.5c-10.05 0-14.67-4.78-14.76-13.37-.07-6.32 2.06-13.73 6.3-24.32 2.95-7.37 2.02-12.9-2.16-22.29-3.19-7.17-3.88-9.14-3.88-12.52 0-3.35 1.87-6.9 5.52-11.07 2.61-3 3.5-3.83 11.9-11.5 5.09-4.66 8.08-7.6 10.7-10.75 9.46-11.36 12.62-19.47 17.9-44.78 3.12-15.05 6.63-20.28 15.12-25.25.8-.47 3.95-2.25 4.7-2.68a76.66 76.66 0 0 0 5.38-3.38zm.56.82a77.63 77.63 0 0 1-5.44 3.43l-4.7 2.67c-8.23 4.82-11.57 9.81-14.65 24.6-5.3 25.45-8.51 33.7-18.1 45.21-2.66 3.19-5.68 6.16-10.8 10.84-8.36 7.64-9.24 8.48-11.82 11.42-3.5 4.01-5.27 7.36-5.27 10.42 0 3.18.68 5.1 3.8 12.12 4.27 9.6 5.24 15.37 2.16 23.07-4.18 10.47-6.29 17.78-6.22 23.93.08 8.06 4.26 12.38 13.76 12.38 17.67 0 43.68-9.9 64.75-21.93 17.28-9.88 56.1-41.2 64.84-53.85 14.08-20.42 28.57-34.59 53.17-48.16 13.12-7.23 21.09-14.87 25.17-23.03 2.92-5.86 3.57-10.35 3.57-18.53 0-11.13-.74-18.73-3.7-27.43-3.15-9.22-8.36-16.75-16.09-22.16-21.13-14.8-29.7-16.42-48.5-7.95.7-.32-16.96 7.56-21.17 9.5-1.7.8-3.3 1.55-4.86 2.3a319.68 319.68 0 0 0-22.93 12.17 165.3 165.3 0 0 1-17.85 9.01l-4.37 1.88c-1.04.45-1.92.84-2.76 1.23a74.56 74.56 0 0 0-11.99 6.86zm-7.6 12.2c7.7-6.25 12.3-8.17 23.68-11.27 6.12-1.67 9.12-2.95 12.31-5.72 3.8-3.3 7.47-4.52 15.86-6.1 2.75-.52 3.67-.7 5.06-1.02 5.48-1.24 9.48-2.93 13.1-5.89 10.42-8.53 25.4-14.11 36.31-14.11 5.33 0 16.77 7.58 25.74 17.16 10.73 11.46 15.96 23.27 12.73 32.5-3.18 9.1-11.39 18.57-23.03 27.86-8.44 6.73-18.36 13-25.22 16.43-3.72 1.86-6.59 4.88-9.77 9.99-.69 1.1-11.1 20.25-16.03 27.83-5.62 8.65-15.4 17.36-30.23 27.96a552.58 552.58 0 0 1-9.2 6.42c-.13.09-6.81 4.65-8.6 5.89-6.47 4.46-10.35 7.35-13.05 9.83-11.64 10.67-37.14 15.54-43.7 8.98-1.96-1.96-2.2-4.06-1.95-10.52.37-9.42-.5-14.5-4.95-20.51a34.09 34.09 0 0 0-7.04-6.92c-3.93-2.95-6.07-6.11-6.56-9.49-.97-6.61 3.87-13.06 14.17-21.69 1.58-1.32 6.67-5.44 7.09-5.78a48.03 48.03 0 0 0 5.23-4.77c4.1-4.63 5.85-9.55 7.8-20.07a501.52 501.52 0 0 0 .8-4.37c.33-1.87.6-3.3.88-4.73.74-3.78 1.5-7.18 2.4-10.63 1-3.78 1.38-5.5 2.36-10.37.6-3.02.93-4.21 1.56-5.47 1.22-2.45 1.27-2.5 12.25-11.42zm.64.78c-10.77 8.74-10.88 8.84-12 11.08-.58 1.16-.88 2.3-1.47 5.22-.98 4.89-1.36 6.63-2.37 10.44-.9 3.43-1.65 6.8-2.39 10.56a339.79 339.79 0 0 0-1.29 6.95l-.39 2.15c-1.98 10.68-3.77 15.74-8.04 20.54a48.77 48.77 0 0 1-5.34 4.88c-.42.34-5.5 4.47-7.07 5.78-10.04 8.4-14.72 14.65-13.83 20.78.45 3.1 2.44 6.03 6.17 8.83 3 2.25 5.39 4.62 7.24 7.12 4.63 6.24 5.52 11.52 5.15 21.15-.25 6.14-.01 8.1 1.66 9.78 6.1 6.1 31.02 1.33 42.31-9.02 2.75-2.52 6.66-5.43 13.16-9.92l8.6-5.89c3.63-2.48 6.45-4.44 9.19-6.4 14.73-10.54 24.44-19.18 29.97-27.7 4.9-7.54 15.31-26.68 16.02-27.8 3.27-5.26 6.26-8.41 10.18-10.37 6.79-3.4 16.65-9.63 25.03-16.32 11.52-9.18 19.61-18.53 22.72-27.4 3.07-8.78-2.02-20.27-12.52-31.49-8.8-9.4-20.04-16.84-25.01-16.84-10.67 0-25.43 5.5-35.68 13.89-3.76 3.07-7.9 4.81-13.5 6.09-1.41.32-2.35.5-5.11 1.02-8.21 1.55-11.76 2.73-15.38 5.88-3.34 2.9-6.45 4.22-12.7 5.92-11.26 3.07-15.75 4.94-23.31 11.09zM212 251.85c0 7.56-.6 10.92-2.6 14.3-1.1 1.84-7.66 10.05-8.6 11.3-5.96 7.94-9.33 10.28-17.26 13.76-1.34.58-2.2 1-3.03 1.5-.55.33-1.2.66-2 1.02-.71.33-4.46 1.9-5.52 2.39-6.05 2.78-8.99 5.8-8.99 10.73 0 10.97-18.95 36.12-34.51 44.87-8.18 4.6-21.3 9.36-32.78 11.86-13.33 2.9-22.49 2.48-24.62-2.32-1.32-2.97-4.4-4.26-11.98-5.81l-.6-.12c-4.84-.99-6.94-1.55-9.03-2.64-2.92-1.5-4.48-3.7-4.48-6.84 0-2.74 1.08-5.77 3.25-9.67.85-1.53 1.82-3.13 3.23-5.35-.16.25 2.83-4.4 3.67-5.76 6.69-10.7 9.85-18.5 9.85-27.22 0-18.41 11.22-33.37 27.5-42.86 5.22-3.05 9.23-3.31 15.2-2.12 5.04 1 6.05.9 7.43-1.52 4.5-7.85 7.04-9.5 15.87-9.5 3.93 0 6.97-.98 10.47-3.16 1.56-.97 8.67-6.17 10.99-7.68 9.2-5.98 11.34-7 25.2-11.95 6.95-2.48 15.18 1.28 22.33 9.12 6.55 7.19 11.01 16.61 11.01 23.67zm-2 0c0-6.5-4.25-15.48-10.49-22.32-6.67-7.32-14.16-10.74-20.17-8.59-13.73 4.9-15.73 5.85-24.8 11.75-2.24 1.46-9.37 6.68-11.01 7.7-3.8 2.36-7.2 3.46-11.53 3.46-8.08 0-9.98 1.23-14.13 8.5-1.1 1.91-2.51 2.88-4.35 3.09-1.3.14-1.9.05-5.22-.61-5.53-1.1-9.07-.88-13.8 1.88-15.72 9.17-26.5 23.55-26.5 41.14 0 9.2-3.28 17.29-10.15 28.28l-3.68 5.77c-1.39 2.19-2.35 3.77-3.17 5.25-2.02 3.63-3 6.38-3 8.7 0 4.19 2.87 5.67 11.9 7.52l.61.12c8.27 1.7 11.7 3.13 13.4 6.95 3.17 7.14 36 0 54.6-10.46 14.98-8.43 33.49-32.99 33.49-43.13 0-5.9 3.47-9.48 10.16-12.55 1.1-.5 4.85-2.08 5.52-2.38.74-.34 1.32-.64 1.8-.93.92-.55 1.85-1 3.25-1.62 7.65-3.35 10.75-5.5 16.47-13.12 1.02-1.36 7.47-9.42 8.47-11.11 1.79-3.01 2.33-6.06 2.33-13.3zm-37.18-22.4c.15-.1 2.4-1.51 2.95-1.84.96-.57 1.7-.94 2.43-1.17 2.57-.83 5.06-.1 11.04 3.12 14.86 8 19.43 22.87 9.18 38.71-4.04 6.24-9.37 9-18.72 11.11-.85.2-1.2.27-3.13.68-6.04 1.29-8.78 2.08-11.6 3.65-3.63 2.02-6.09 4.98-7.5 9.44-7.87 24.93-19.72 43.34-36.28 50.31-16.45 6.93-21.13 8.53-27.98 8.89-4.94.25-9.8-.65-15.4-2.89a44.45 44.45 0 0 1-5.64-2.6c-4.02-2.33-5.14-4.74-4.5-9.31.3-2.13 3.77-15.53 4.84-20.65.63-3.05 1.19-6.14 1.75-9.69a464.04 464.04 0 0 0 1.35-8.9c1.42-9.41 2.5-14.27 4.49-18.65 2.46-5.43 6.13-9.03 11.72-11.13 6.59-2.47 10.54-3.1 18.03-3.53 4.75-.27 6.68-.64 9-2.05.61-.37 1.22-.81 1.82-1.33a30.61 30.61 0 0 0 3.37-3.4c.59-.69 2.38-2.9 2.63-3.19 3.36-4 6.3-5.53 12.33-5.53 3.94 0 5.9-.92 8.18-3.36-.17.18 2.75-3.14 3.85-4.22a30.95 30.95 0 0 1 6.79-5c1.5-.83 3.15-1.62 4.99-2.38a64.92 64.92 0 0 0 10.01-5.1zm-14.52 8.34a29.95 29.95 0 0 0-6.57 4.84 116.68 116.68 0 0 0-3.82 4.2c-2.46 2.63-4.68 3.67-8.91 3.67-5.72 0-8.39 1.39-11.57 5.17-.23.28-2.03 2.5-2.63 3.2a31.6 31.6 0 0 1-3.47 3.51c-.65.55-1.3 1.03-1.96 1.43-2.5 1.51-4.55 1.9-9.47 2.19-7.39.42-11.25 1.04-17.72 3.47-5.34 2-8.82 5.4-11.17 10.6-1.93 4.27-3 9.07-4.41 18.39l-.65 4.34-.7 4.57c-.57 3.56-1.12 6.67-1.76 9.73-1.08 5.18-4.54 18.53-4.83 20.59-.59 4.17.35 6.18 4.01 8.3 1.35.77 3.1 1.58 5.52 2.55 5.46 2.18 10.18 3.05 14.97 2.8 6.69-.34 11.32-1.93 27.65-8.8 16.21-6.83 27.92-25.01 35.71-49.7 1.49-4.7 4.12-7.86 7.97-10 2.93-1.63 5.74-2.45 11.87-3.76 1.92-.4 2.28-.49 3.12-.68 9.12-2.06 14.24-4.7 18.1-10.67 9.92-15.34 5.55-29.55-8.82-37.29-5.75-3.1-8.03-3.76-10.25-3.05-.65.2-1.33.54-2.23 1.08-.55.32-2.77 1.72-2.93 1.82a65.91 65.91 0 0 1-10.16 5.17c-1.8.75-3.42 1.52-4.89 2.33zm-42.39 32.72c16.15-2.87 26.36-.97 32.47 6.16 5.08 5.93 1.13 21.42-5.93 35.55-4.79 9.58-10.6 16.21-23.16 25.19-14.15 10.1-35.5 12.2-40.71 3.85-1.86-2.97-2.1-8.14-1.06-15.73.78-5.68 1.86-10.71 4.73-22.98l.12-.51c1.59-6.8 2.37-10.31 3.14-14.14 1.45-7.25 3.74-11.47 7.26-13.74 2.81-1.8 5.53-2.28 12.33-2.62 5.33-.27 7.56-.46 10.81-1.03zm.18.98c-3.3.59-5.56.78-10.94 1.05-6.62.33-9.23.78-11.84 2.46-3.25 2.1-5.42 6.09-6.82 13.1-.77 3.84-1.56 7.35-3.15 14.17l-.12.5c-2.86 12.24-3.93 17.26-4.7 22.9-1.03 7.36-.79 12.36.9 15.07 4.82 7.7 25.54 5.67 39.29-4.15 12.43-8.88 18.13-15.39 22.84-24.81 6.86-13.72 10.75-29 6.07-34.45-5.84-6.81-15.7-8.65-31.53-5.84zM132 276.5c7.12 0 10.66 3.08 11.25 8.7.42 4.02-.43 8.14-2.77 15.94-2.56 8.52-18.36 25.38-27.2 31.28-7.01 4.67-20.02 5.67-26.57.99-3.99-2.85-3.53-12.08.02-26.46.68-2.75 1.47-5.65 2.37-8.76a412.6 412.6 0 0 1 3.05-10.14l.37-1.2c1.48-4.8 5.1-7.75 10.73-9.27 4.4-1.2 9.54-1.5 17.48-1.33l3.89.1c3.87.11 5.42.15 7.38.15zm0 1c-1.97 0-3.53-.04-7.41-.15l-3.88-.1c-7.85-.17-12.92.13-17.2 1.3-5.32 1.43-8.67 4.16-10.03 8.6a1277.83 1277.83 0 0 1-1.6 5.21c-.68 2.2-1.27 4.17-1.82 6.1-.9 3.1-1.68 5.99-2.36 8.73-3.43 13.88-3.87 22.93-.4 25.4 6.17 4.42 18.73 3.45 25.42-1 8.66-5.78 24.33-22.49 26.8-30.73 2.3-7.67 3.14-11.71 2.73-15.56-.53-5.1-3.64-7.8-10.25-7.8zm-17.79 7a31.3 31.3 0 0 1 8.57 1.4c5.42 1.78 8.72 5.03 8.72 10.1 0 9.59-9.51 17.2-22.34 21.47-9.82 3.28-13.62-1.79-11.66-16.54.84-6.28 3.82-10.67 8.24-13.46a20.38 20.38 0 0 1 8.47-2.97zm-.6 1.08a19.39 19.39 0 0 0-7.34 2.73c-4.18 2.64-6.98 6.78-7.77 12.76-1.89 14.11 1.36 18.45 10.34 15.46C121.3 312.37 130.5 305 130.5 296c0-4.56-2.98-7.5-8.03-9.15a28.05 28.05 0 0 0-8.2-1.35c-.13 0-.35.03-.66.08zm80.87-23.45c-2.72 9.8-14.93 9.86-26.72 3.3-10.17-5.64-13.8-17.98-5-22.87a66.53 66.53 0 0 0 4.48-2.7l2.03-1.3a50.15 50.15 0 0 1 3.92-2.3c4.73-2.43 8.82-2.8 14-.72 9.16 3.66 10.98 13.33 7.3 26.6zm-20.83-24.98a49.26 49.26 0 0 0-3.84 2.25l-2.03 1.3c-.84.53-1.5.95-2.16 1.35-.82.5-1.6.96-2.38 1.39-7.94 4.4-4.59 15.8 5 21.12 11.31 6.29 22.8 6.23 25.28-2.7 3.57-12.83 1.85-21.97-6.7-25.4-4.9-1.95-8.69-1.62-13.17.7zm17.85 12.15c0 5.7-2.44 9-6.64 9.96-3.3.76-7.56-.05-11.08-1.81l-1.89-.94c-.67-.34-1.18-.62-1.63-.88-4.07-2.38-4.13-4.97.34-10.93 6.8-9.06 20.9-7.16 20.9 4.6zm-1 0c0-5.3-2.87-8.55-7.32-9.16-4.23-.57-8.99 1.44-11.78 5.16-4.15 5.54-4.1 7.44-.64 9.47.44.25.93.51 1.59.85l1.87.93c3.34 1.67 7.36 2.44 10.42 1.74 3.73-.86 5.86-3.74 5.86-9zm196.5 281c0-12.8 2.44-16.74 18.48-29.77a56.8 56.8 0 0 1 7.61-5.2c2.6-1.5 5.33-2.82 8.5-4.18 1.24-.53 2.48-1.05 4.1-1.7l3.92-1.57c9.4-3.83 13.74-6.7 16.62-12.05 1.2-2.22 2.21-4.4 3.23-6.83a148.57 148.57 0 0 0 1.54-3.84l.3-.74.56-1.44c3.2-8.02 6.05-12.08 12.7-16.5a35.26 35.26 0 0 0 4.96-4 46.36 46.36 0 0 0 3.88-4.29c.27-.34 2.55-3.2 3.2-3.98 3.48-4.15 6.51-5.9 11.51-5.9 3.08 0 5.62-.63 9.57-2.1 5.42-2.02 6.53-2.34 8.96-2.2 2.53.13 4.85 1.26 7.18 3.59 1.3 1.3 5.55 5.83 6.52 6.78 5.06 5 9.44 6.92 17.77 6.92a197.5 197.5 0 0 1 12.08.45c15.93.87 21.94.57 25.28-2.21 6.91-5.77 11.64-2.73 11.64 7.76 0 10.73-8.6 20-19 20-4.8 0-8.32 1.43-9.34 3.67-1.12 2.48.68 6.15 5.98 10.57 13.6 11.33 11.24 20.76-7.64 20.76a21.91 21.91 0 0 0-14.6 5.24c-3.28 2.71-5.8 5.86-9.85 11.82l-1.52 2.25c-3.1 4.57-5.01 7.1-7.32 9.4-6.21 6.21-9.3 7.64-13.05 6.89l-1-.23a10.82 10.82 0 0 0-2.66-.37c-1.6 0-2.41.67-8.18 6.22-4.85 4.67-8.07 6.78-11.82 6.78-1.33 0-3.46 1.15-6.45 3.45-1.27.98-2.68 2.14-4.5 3.7l-4.92 4.29a181.11 181.11 0 0 1-4.54 3.82c-9.33 7.56-15.63 10.2-20.21 6.52-2.7-2.15-4.14-4.51-4.63-7.26-.37-2.04-.26-3.63.29-7.3.87-5.85.65-8.42-1.83-11.6-2.32-2.98-2.96-3.22-3.77-2.39-.25.26-1.35 1.63-1.61 1.94-2.21 2.5-4.85 3.57-9 2.82-4.6-.84-5.57-4.11-4.72-10.09l.24-1.56c.6-3.66.68-4.93.25-5.8-.44-.86-1.9-.94-5.23.4l-.74.29c-13.78 5.54-15.26 6.09-19.43 6.67-6.03.84-9.31-1.6-9.31-7.9zm2 0c0 5 2.14 6.6 7.04 5.92 3.91-.55 5.43-1.1 18.95-6.55l.75-.3c4.17-1.66 6.7-1.54 7.76.58.71 1.43.62 2.76-.06 7l-.24 1.53c-.72 5.04-.06 7.27 3.09 7.84 3.43.62 5.38-.17 7.15-2.18.2-.23 1.34-1.66 1.68-2 1.9-1.96 3.82-1.25 6.78 2.55 2.9 3.74 3.17 6.77 2.22 13.12-1 6.75-.52 9.4 3.62 12.71 3.49 2.8 9.1.45 17.7-6.51 1.35-1.1 2.75-2.28 4.49-3.78l4.93-4.3c1.84-1.58 3.27-2.76 4.58-3.77 3.34-2.56 5.74-3.86 7.67-3.86 3.04 0 5.95-1.9 10.43-6.22l2.46-2.39c.94-.89 1.67-1.56 2.37-2.13 1.81-1.49 3.3-2.26 4.74-2.26 1.03 0 1.81.13 3.1.42.7.16.71.17.96.21 2.96.6 5.45-.55 11.23-6.33 2.2-2.2 4.06-4.65 7.09-9.11l1.52-2.25c4.15-6.11 6.76-9.37 10.22-12.24a23.9 23.9 0 0 1 15.88-5.7c16.87 0 18.62-7.01 6.36-17.23-5.9-4.92-8.12-9.41-6.52-12.93 1.42-3.12 5.67-4.84 11.16-4.84 9.25 0 17-8.34 17-18 0-8.94-2.88-10.79-8.36-6.23-3.94 3.28-9.98 3.59-26.67 2.68l-1.02-.06c-5.09-.27-7.99-.39-10.95-.39-8.88 0-13.76-2.14-19.18-7.5-1-.98-5.26-5.53-6.53-6.79-1.99-1.99-3.86-2.9-5.87-3-2.03-.12-3.06.18-8.15 2.07-4.15 1.55-6.9 2.22-10.27 2.22-4.33 0-6.84 1.46-9.98 5.2-.63.74-2.89 3.6-3.18 3.95a48.29 48.29 0 0 1-4.04 4.46 37.26 37.26 0 0 1-5.24 4.23c-6.26 4.17-8.9 7.91-11.95 15.58l-.57 1.43-.28.74a531.5 531.5 0 0 1-1.56 3.88 77.49 77.49 0 0 1-3.32 7c-3.16 5.88-7.82 8.97-17.63 12.96l-3.92 1.58c-1.6.64-2.84 1.15-4.05 1.67a79.2 79.2 0 0 0-8.3 4.08 54.8 54.8 0 0 0-7.35 5.02c-15.62 12.7-17.74 16.13-17.74 28.23zm133.22-79.76c3.06 1.53 6.54 2.02 10.68 1.7 2.53-.2 4.91-.62 8.8-1.49 5.36-1.19 6.33-1.38 8.33-1.54 2.78-.23 4.82.17 6.29 1.4 1.58 1.31 1.96 2.72 1.26 4.22-.66 1.38-1.05 1.74-5.05 5.07-3.53 2.93-5.03 4.83-5.03 7.09 0 7.3 1.29 10.02 7.83 15.62 3.86 3.3 5.93 6.84 5.28 9.62-.75 3.25-4.96 5.02-12.61 5.02-7.18 0-12.7 4.61-20.03 14.68-.5.7-3.96 5.57-4.94 6.87a38.89 38.89 0 0 1-4.72 5.5c-1.06.98-2.09 1.7-3.1 2.15-2.85 1.26-5.05 1.57-9.83 1.74-7.66.27-10.87 1.45-14.98 7.1-1.58 2.17-3.11 4-4.68 5.6a42.87 42.87 0 0 1-8.65 6.69c-.15.08-10.69 6.19-14.8 8.83-3.76 2.42-6.45 2.04-8.22-.77-1.28-2.03-1.9-4.54-2.87-10.35-.84-5.08-1.27-7.08-2.06-8.93-.97-2.3-2.21-3.24-4.02-2.88-6.2 1.24-8.95 1.39-10.98.2-2.37-1.4-3.13-4.62-2.62-10.73.16-1.96-1.04-2.87-3.76-3.04-2.24-.13-4.9.2-9.94 1.12l-.69.12c-7.97 1.45-10.72 1.72-12.72.73-2.91-1.43-1.6-5.27 4.23-12.21 5.48-6.53 10.6-10.81 15.76-13.53 3.74-1.97 5.94-2.65 12.16-4.1 7.29-1.72 10.4-3.51 14.04-9.31 2.96-4.75 10.74-18.62 12.14-20.84 3.59-5.67 6.8-9.1 11.05-11.34 2.6-1.38 4.72-2.82 9.17-6.07l1.38-1.01c7.85-5.72 12.3-7.98 17.68-7.98 4.22 0 6.49 1.36 9.13 4.77.34.43 1.67 2.22 2 2.67.85 1.09 1.6 1.98 2.45 2.83a24.29 24.29 0 0 0 6.64 4.78zm-.44.9c-2.8-1.4-5-3.03-6.92-4.97-.87-.9-1.65-1.81-2.51-2.93-.35-.46-1.68-2.25-2.01-2.67-2.47-3.18-4.46-4.38-8.34-4.38-5.09 0-9.4 2.2-17.09 7.78l-1.38 1.01c-4.49 3.29-6.63 4.74-9.3 6.15-4.06 2.15-7.16 5.45-10.66 11-1.39 2.19-9.16 16.05-12.15 20.82-3.79 6.07-7.13 7.98-14.66 9.75-6.13 1.45-8.27 2.1-11.92 4.02-5.04 2.66-10.05 6.86-15.46 13.3-5.43 6.46-6.53 9.69-4.55 10.66 1.7.84 4.48.57 12.1-.81l.7-.13c5.12-.93 7.82-1.27 10.17-1.12 3.21.2 4.92 1.48 4.7 4.11-.48 5.76.2 8.64 2.13 9.78 1.73 1.02 4.34.88 10.27-.31 2.35-.47 4 .78 5.14 3.47.83 1.95 1.27 4 2.07 8.8l.06.36c.94 5.65 1.55 8.11 2.72 9.98 1.46 2.3 3.52 2.6 6.84.46 4.14-2.66 14.69-8.77 14.81-8.85a41.9 41.9 0 0 0 8.46-6.54 47.89 47.89 0 0 0 4.6-5.48c4.32-5.95 7.81-7.23 15.74-7.5 4.66-.17 6.76-.47 9.46-1.67.9-.4 1.85-1.06 2.84-1.96a38.03 38.03 0 0 0 4.6-5.36c.96-1.3 4.4-6.16 4.93-6.87 7.5-10.31 13.22-15.09 20.83-15.09 7.24 0 11.02-1.6 11.64-4.24.54-2.32-1.36-5.55-4.97-8.64-6.75-5.79-8.17-8.79-8.17-16.38 0-2.67 1.64-4.74 5.39-7.86 3.8-3.17 4.23-3.56 4.78-4.73.5-1.06.25-1.99-.99-3.03-2.23-1.85-4.72-1.65-13.76.36-3.93.87-6.35 1.3-8.94 1.5-4.3.34-7.97-.18-11.2-1.8zm-28-3.9c5.65-2.82 8.96-2.2 12.9 1.37.56.5 2.6 2.47 3.02 2.87 4.2 3.89 8.07 5.71 14.3 5.71 11.37 0 14 1.41 16.1 8.09.26.83 1.35 4.6 1.66 5.62.8 2.63 1.64 5.03 2.7 7.6 2.13 5.17 2.64 8.32 1.72 10.24-.77 1.61-2.1 2.18-5.37 2.79-2.32.43-2.8.53-3.85.85-1.85.58-3.35 1.4-4.6 2.66-1 1-2.02 2.13-3.31 3.66-.6.71-2.91 3.5-3.46 4.14-7.2 8.54-12.43 12.35-19.59 12.35-3.76 0-6.95 1.28-10.59 4-1.84 1.37-11.62 10.31-15.22 13.06a73.09 73.09 0 0 1-8.95 5.88c-4.58 2.54-7.35 3.22-8.98 2.23-1.32-.8-1.65-2.07-1.94-5.5a52.53 52.53 0 0 0-.16-1.81c-.54-4.73-2.24-6.86-7.16-6.86-7.11 0-8.85-1.23-9.73-5.41-.96-4.61-2.1-6.7-6.55-9.67-3.97-2.65-4.31-5.42-1.52-8.22 2-2 4.63-3.5 11.35-6.87 6.61-3.3 9.2-4.8 11.1-6.68a39.09 39.09 0 0 0 5.3-6.48c.98-1.5 1.83-3.04 2.88-5.13l2.12-4.3c.91-1.83 1.72-3.37 2.61-4.98 5.74-10.32 10.37-14.78 23.22-21.2zm-22.34 21.7c-.89 1.59-1.69 3.12-2.6 4.94l-2.11 4.3a52.9 52.9 0 0 1-2.94 5.23 40.08 40.08 0 0 1-5.44 6.63c-2 2-4.62 3.51-11.35 6.87-6.6 3.3-9.2 4.8-11.1 6.69-2.33 2.34-2.08 4.37 1.38 6.67 4.7 3.14 5.96 5.46 6.97 10.3.78 3.7 2.09 4.62 8.75 4.62 5.5 0 7.57 2.57 8.15 7.75.06.5.09.82.17 1.84.25 3.06.55 4.17 1.46 4.72 1.2.74 3.69.13 7.98-2.25a72.09 72.09 0 0 0 8.82-5.8c3.55-2.7 13.34-11.65 15.24-13.07 3.79-2.83 7.18-4.19 11.18-4.19 6.77 0 11.8-3.67 18.83-12l3.45-4.13a60.07 60.07 0 0 1 3.37-3.72 11.72 11.72 0 0 1 5.01-2.91c1.1-.34 1.6-.45 3.97-.89 2.95-.55 4.07-1.02 4.65-2.23.76-1.59.28-4.5-1.74-9.43a84.46 84.46 0 0 1-2.74-7.69c-.31-1.03-1.4-4.8-1.66-5.61-1.95-6.2-4.16-7.39-15.14-7.39-6.5 0-10.61-1.93-14.98-5.98-.44-.4-2.46-2.37-3.01-2.86-3.65-3.3-6.52-3.85-11.79-1.21-12.67 6.33-17.15 10.65-22.78 20.8zm55.86 11.93c-2.98 6.45-16.78 15.26-26.74 15.26-5.33 0-7.56-2.98-7.11-7.86.32-3.48 2.1-7.91 3.93-10.61l1.52-2.32a44.95 44.95 0 0 1 1.88-2.7c3.66-4.8 7.85-7.45 13.62-7.45 9.06 0 15.75 9.52 12.9 15.68zm-.9-.42c2.52-5.47-3.65-14.26-12-14.26-5.4 0-9.33 2.48-12.82 7.06-.6.8-1.17 1.6-1.85 2.64 0 0-1.2 1.87-1.52 2.33-1.74 2.57-3.46 6.85-3.77 10.14-.4 4.33 1.43 6.77 6.12 6.77 9.57 0 23.02-8.58 25.83-14.68zm-69.67 20.74c2.08.18 4.44.81 5.88 1.8 2.12 1.47 2.2 3.6-.26 6.05-5.14 5.15-12.85 4.34-12.85-1.35 0-4.66 3.14-6.84 7.23-6.5zm-.09 1c-3.56-.3-6.14 1.5-6.14 5.5 0 4.58 6.53 5.26 11.15.65 2.03-2.04 1.98-3.43.4-4.52-1.27-.88-3.48-1.47-5.4-1.63zm29.59-225.95c4.64 2.35 17.27 8.24 19.39 9.43a24.14 24.14 0 0 1 7.05 5.64 45.03 45.03 0 0 1 3.75 5.2c2.4 3.78.04 7.66-6.2 11.63-4.97 3.16-12.18 6.3-21.95 9.82-4.84 1.74-19.63 6.68-21.1 7.2-6.59 2.33-14.85.1-25.14-5.86-3.93-2.27-8-5-12.94-8.54-2.23-1.61-9.5-6.99-10.7-7.85a81.21 81.21 0 0 0-8.63-5.7c-4.82-2.6-4.45-6.64.17-12.13 3.27-3.88 4.17-4.67 18.1-16.33a230.2 230.2 0 0 0 8.89-7.74 95.2 95.2 0 0 0 4.72-4.66c5.08-5.43 9.8-6.49 14.97-3.92 2.24 1.1 4.53 2.85 7.43 5.52 1.48 1.37 6.94 6.72 7.98 7.7 5.2 4.91 9.46 8.2 14.2 10.6zm-.46.9c-4.85-2.45-9.18-5.79-14.44-10.76-1.05-1-6.5-6.34-7.97-7.69-2.83-2.61-5.06-4.3-7.2-5.37-4.75-2.36-9-1.4-13.8 3.71a96.18 96.18 0 0 1-4.76 4.71c-2.48 2.3-5.16 4.62-8.92 7.77-13.86 11.6-14.77 12.4-17.98 16.21-4.28 5.08-4.58 8.4-.46 10.61 2.23 1.2 4.9 2.99 8.74 5.77 1.2.87 8.47 6.24 10.7 7.85a154.8 154.8 0 0 0 12.85 8.49c10.06 5.82 18.07 7.98 24.3 5.78 1.48-.52 16.27-5.47 21.1-7.2 9.7-3.5 16.86-6.61 21.75-9.72 5.84-3.71 7.9-7.1 5.9-10.26a44.09 44.09 0 0 0-3.67-5.08 23.16 23.16 0 0 0-6.78-5.42c-2.08-1.16-14.68-7.05-19.36-9.4zm-38.83 8.05c3.11-.37 5.7-.13 8.4.7 2.15.66 2.74.93 8.64 3.77 4.75 2.29 8.39 3.86 13.19 5.56 8.38 2.97 11.32 6.23 8.83 9.76-2.08 2.94-8.04 5.92-17.84 9.18-8.45 2.82-15.48 2.35-21.43-.9-4.65-2.55-8.33-6.5-12.15-12.3-2.9-4.41-2.73-8.2.16-11.06 2.48-2.45 6.87-4.07 12.2-4.7zm.12 1c-5.13.6-9.33 2.16-11.62 4.42-2.53 2.5-2.68 5.77-.02 9.8 3.73 5.68 7.3 9.51 11.8 11.97 5.7 3.11 12.43 3.57 20.62.84 9.59-3.2 15.44-6.12 17.34-8.82 1.94-2.75-.5-5.45-8.35-8.24-4.84-1.72-8.5-3.3-13.28-5.6-5.84-2.81-6.42-3.07-8.5-3.71a18.42 18.42 0 0 0-8-.66zM202.5 500.38c0 4.78-1.45 7.56-4.43 8.93-2.29 1.05-4.55 1.23-10.79 1.2l-1.78-.01c-9.19 0-17-7.65-17-15.5 0-7.59 10.6-10.51 19.74-5.44 2.78 1.55 4.21 1.94 8.57 2.75 4.44.83 5.69 2.27 5.69 8.07zm-1 0c0-5.3-.9-6.34-4.88-7.08-4.45-.83-5.96-1.25-8.86-2.86-8.57-4.76-18.26-2.1-18.26 4.56 0 7.3 7.36 14.5 16 14.5h1.79c6.06.04 8.26-.14 10.36-1.1 2.6-1.2 3.85-3.6 3.85-8.02zm33.33-117.85c3.71-1.31 8.7-2.7 16.1-4.55 2.58-.65 16.53-4.04 20.56-5.05 19.59-4.93 31.55-8.9 38.23-13.35 14.93-9.95 36.87-33.88 43.83-47.8 2.25-4.5 4.65-6.38 7.68-6.25 1.26.06 2.61.45 4.32 1.2a50.81 50.81 0 0 1 3.54 1.7l1.26.63c4.78 2.34 8.38 3.44 12.65 3.44 7.2 0 10.01 3.07 8.35 7.91-1.4 4.06-5.92 8.91-11.1 12.02-8.3 4.98-11.75 17.3-11.75 33.57 0 3.59-1.37 6.28-3.98 8.36-1.98 1.58-4.2 2.6-8.47 4.16l-1.02.37c-4.85 1.75-6.98 2.77-8.68 4.46-5.09 5.1-12.54 7.15-20.35 7.15-1.38 0-2.47.92-3.99 3.1-.29.41-1.32 1.95-1.47 2.18-2.68 3.92-4.93 5.72-8.54 5.72-7.84 0-10.74.93-21.76 6.94-5.18 2.82-8.8 3.58-14.66 3.68-.26 0-.47 0-.92.02-4.82.06-7.12.3-10.51 1.34a73.43 73.43 0 0 0-8.89 3.56c-2.17 1-10.53 5.01-10.23 4.87-7.79 3.7-13.32 5.98-18.9 7.57-12.41 3.55-18.58 2.24-27.42-4.07-2.58-1.85-2.72-4.43-.83-7.62 1.45-2.45 3.9-5.09 8.08-8.97l1.78-1.64c3.92-3.6 4.48-4.11 5.9-5.53 2.32-2.32 3.12-3.5 5.48-7.63 1.93-3.36 3.37-5.11 6.27-7.06 2.3-1.54 5.34-2.98 9.44-4.43zm.34.94c-4.03 1.42-7 2.83-9.22 4.32-2.75 1.85-4.1 3.49-5.96 6.73-2.4 4.2-3.24 5.44-5.64 7.83-1.43 1.44-2 1.96-5.94 5.57l-1.77 1.63c-4.1 3.82-6.52 6.41-7.9 8.75-1.65 2.79-1.54 4.8.55 6.3 8.6 6.14 14.46 7.38 26.57 3.92 5.5-1.57 11-3.84 18.74-7.51-.3.14 8.06-3.88 10.24-4.88a74.3 74.3 0 0 1 9.01-3.6c3.51-1.09 5.89-1.33 10.8-1.4h.91c5.72-.1 9.18-.83 14.2-3.57 11.16-6.08 14.2-7.06 22.24-7.06 3.19 0 5.2-1.6 7.71-5.28l1.48-2.2c1.7-2.43 3-3.52 4.81-3.52 7.57 0 14.78-2 19.65-6.85 1.83-1.84 4.04-2.9 9.04-4.7l1.02-.37c8.6-3.13 11.79-5.67 11.79-11.58 0-16.6 3.53-29.2 12.24-34.43 5-3 9.35-7.67 10.66-11.48 1.42-4.13-.83-6.59-7.4-6.59-4.45 0-8.19-1.14-13.09-3.54-7.52-3.67-6.78-3.34-8.72-3.43-2.58-.1-4.65 1.52-6.74 5.7-7.04 14.07-29.1 38.14-44.17 48.19-6.81 4.54-18.84 8.52-38.55 13.48-4.03 1.02-17.98 4.4-20.56 5.05-7.37 1.84-12.33 3.23-16 4.52zM252 387.5c2.08 0 4-.2 7.25-.69 5.22-.77 6.64-.9 8.46-.5 2.52.56 3.79 2.35 3.79 5.69 0 4.05-2.27 7.29-6.62 10.11-3.24 2.1-6.53 3.53-14.15 6.4l-.27.1-2.28.86c-3.04 1.16-5.27 2.52-9.33 5.43l-.8.57c-8.19 5.88-13.35 8.03-23.05 8.03-4.98 0-6.88-2.03-5.75-5.62.87-2.81 3.58-6.56 7.8-11.13 1.26-1.37 2.64-2.8 4.15-4.3 3.17-3.14 11.25-10.61 11.45-10.8.46-.47.93-.89 1.4-1.26 3.38-2.71 5.77-3.08 14.18-2.93 1.65.03 2.63.04 3.77.04zm0 1c-1.15 0-2.13-.01-3.79-.04-8.18-.14-10.4.2-13.54 2.71-.44.35-.88.74-1.32 1.18-.2.21-8.3 7.69-11.45 10.82a134.6 134.6 0 0 0-4.12 4.26c-4.12 4.47-6.76 8.12-7.58 10.75-.9 2.88.45 4.32 4.8 4.32 9.46 0 14.44-2.07 22.46-7.84l.8-.57c4.13-2.96 6.42-4.36 9.56-5.56l2.3-.86.25-.1c7.55-2.84 10.8-4.25 13.97-6.3 4.08-2.65 6.16-5.6 6.16-9.27 0-2.89-.97-4.26-3-4.7-1.65-.37-3.05-.25-8.1.5-3.3.5-5.26.7-7.4.7zm112.47-45.34c-1.88 5.44-1.98 6.76-.98 12.76 1.18 7.06-1.38 16.58-5.49 16.58a16.89 16.89 0 0 0-1.51.07l-.64.04c-2.86.18-4.83.17-6.94-.17-6.55-1.06-10.41-5.14-10.41-13.44 0-13.9 2.14-19.69 8.13-26.33a21.9 21.9 0 0 0 2.52-3.75c.59-1.03 2.78-5.13 2.72-5.01 4.44-8.14 7.71-11.53 12.25-10.4 1.17.3 2.2.77 3.58 1.59l1.39.84a20 20 0 0 0 3.1 1.6c.7.27 1.8.32 4.75.26l.72-.01c3.16-.05 4.78.08 5.83.66 1.61.89 1.2 2.56-1.14 4.9a215.9 215.9 0 0 1-3.86 3.76c-10.6 10.1-12.75 12.4-14.02 16.05zm-.94-.32c1.34-3.9 3.46-6.17 14.27-16.46 1.55-1.47 2.73-2.62 3.85-3.73 1.94-1.95 2.17-2.88 1.35-3.33-.82-.45-2.37-.58-5.32-.53l-.72.01c-3.14.06-4.26.02-5.14-.34-1.06-.41-1.97-.9-3.25-1.67l-1.38-.83a12.1 12.1 0 0 0-3.31-1.47c-3.88-.97-6.92 2.17-11.13 9.9.07-.13-2.14 3.98-2.73 5.02a22.71 22.71 0 0 1-2.65 3.92c-5.81 6.47-7.87 12-7.87 25.67 0 7.79 3.48 11.47 9.57 12.45 2.01.33 3.92.34 6.71.16a371.33 371.33 0 0 0 1.23-.07c.42-.03.73-.04.99-.04 3.2 0 5.6-8.9 4.5-15.42-1.02-6.16-.91-7.64 1.03-13.24zm-9.26 12.42c.58.52 2.5 1.9 2.55 1.93 1.96 1.57 2.04 3.31.01 6.36-3.74 5.64-8.83 3.09-8.83-4.55 0-3.81.51-5.67 2.07-6.02 1.18-.26 2 .3 4.2 2.28zm-1.34 1.48c-1.5-1.35-2.23-1.85-2.43-1.8-.17.03-.5 1.23-.5 4.06 0 5.87 2.67 7.21 5.17 3.45 1.5-2.26 1.47-2.84.4-3.7.03.03-1.95-1.4-2.64-2zm222.9-130.19c2.2-1.1 3.67-1.66 5.88-2.36l.28-.09a48.92 48.92 0 0 0 8.79-3.55c4.17-2.08 6.35-1.88 6.96.84.44 2 .2 4.01-1.25 12.7-2.27 13.62-9.16 26.14-21.17 36.3-4.3 3.63-7.41 4.39-9.75 2.44-1.88-1.57-3.1-4.57-4.61-10.48-.3-1.15-1.43-5.83-1.72-6.96a114.18 114.18 0 0 0-2.71-9.22c-2.4-6.82-3.03-10.78-2.1-12.94.77-1.83 2.08-2.24 5.6-2.45 1.49-.09 2.09-.14 2.97-.28l1.95-.33c.72-.12 1.22-.2 1.68-.29 1.1-.2 1.92-.38 2.71-.6 1.7-.49 3.42-1.2 6.49-2.73zm.44.9c-3.11 1.54-4.88 2.29-6.65 2.79-.84.23-1.69.42-2.81.63a108.77 108.77 0 0 1-3.81.63c-.77.13-1.39.19-2.92.28-3.13.18-4.17.51-4.74 1.85-.78 1.84-.2 5.62 2.13 12.2a115.12 115.12 0 0 1 2.74 9.31l1.72 6.96c1.46 5.7 2.62 8.58 4.28 9.96 1.87 1.56 4.49.93 8.47-2.44 11.82-10 18.6-22.3 20.83-35.7 1.4-8.45 1.65-10.51 1.25-12.31-.41-1.87-1.86-2-5.54-.16a49.87 49.87 0 0 1-8.93 3.6l-.28.1a35.4 35.4 0 0 0-5.74 2.3zm-4.5 6.58c1.37-.32 2.5-.75 3.9-1.42.35-.18 2.57-1.31 3.32-1.67 1.5-.71 2.97-1.31 4.7-1.89 2.7-.9 4.64-.77 5.88.4.98.94 1.34 2.26 1.41 4.18.02.4.02.7.02 1.37 0 5.63-4.63 16.88-11.34 22.75-4.34 3.8-7.31 4.67-9.92 2.52-2.06-1.7-3.5-4.65-6.67-12.91-1.86-4.83-2.05-8.1-.68-10.2 1.12-1.7 2.9-2.36 5.83-2.7l1.26-.12c1.19-.12 1.75-.19 2.3-.31zm-2.1 2.3-1.22.12c-2.4.27-3.7.76-4.39 1.81-.93 1.43-.78 4.1.87 8.38 3.02 7.84 4.41 10.71 6.08 12.09 1.63 1.34 3.64.75 7.33-2.48C584.6 250.77 589 240.08 589 235c0-.64 0-.93-.02-1.29-.05-1.44-.3-2.33-.79-2.8-.6-.57-1.8-.65-3.87.04a37.95 37.95 0 0 0-4.47 1.8c-.72.34-2.93 1.47-3.32 1.66a19.54 19.54 0 0 1-4.3 1.56c-.66.16-1.28.24-2.56.36zm-227.73-88.98c-1.59 4.3-3.54 7.25-7.14 11.4l-2.6 2.97a67.02 67.02 0 0 0-2.63 3.23 46.4 46.4 0 0 0-4.68 7.5c-2.85 5.7-7.14 10.18-12.85 13.89-4.25 2.76-8.25 4.62-15.67 7.59-11.01 4.4-16.43 1.26-27.22-16.4-2.86-4.69-8.8-8.63-17.98-12.66-3-1.33-12.88-5.24-14.43-5.92-4.96-2.18-7.04-3.72-6.42-5.85.67-2.32 5.3-4.05 15.48-6.08 16.63-3.32 26.93-3.82 39.93-3.02 7.9.49 9.67.5 12.74-.26 1.99-.48 3.92-1.3 6-2.6l2.79-1.71c9.86-6.14 12.94-7.96 17.3-9.9 6.03-2.71 10.57-3.32 13.94-1.4 7.2 4.12 7.68 7.7 3.44 19.22zm-1.88-.7c3.95-10.7 3.6-13.26-2.56-16.78-2.66-1.52-6.62-.99-12.12 1.48-4.24 1.9-7.3 3.7-17.07 9.77l-2.79 1.73a22.6 22.6 0 0 1-6.57 2.84c-3.36.81-5.22.8-13.34.3-12.84-.78-22.97-.29-39.41 3-4.9.97-8.45 1.88-10.79 2.75-2.03.76-3.04 1.45-3.17 1.91-.16.57 1.48 1.79 5.3 3.46 1.5.67 11.39 4.58 14.44 5.93 9.52 4.19 15.74 8.3 18.87 13.44 10.35 16.93 14.87 19.56 24.78 15.6 7.3-2.93 11.21-4.75 15.33-7.42 5.42-3.53 9.47-7.75 12.15-13.1 1.44-2.9 3.02-5.4 4.86-7.82a68.95 68.95 0 0 1 2.72-3.33l2.6-2.97c3.46-3.99 5.28-6.75 6.77-10.79zm-6.64-.39c-7.94 12.8-18.53 21.75-33.3 25.23-7.82 1.83-12.47-.79-13.12-5.93-.55-4.45 2.29-9.06 6-9.06 3.02 0 5.6-1.68 15.38-9.16 1.47-1.12 2.57-1.96 3.66-2.74 4.4-3.2 7.77-5.17 10.82-6.08 5.57-1.67 9.33-2.15 11.35-1.22 2.5 1.14 2.22 4.13-.79 8.96zm-.84-.52c2.72-4.4 2.94-6.74 1.21-7.53-1.71-.79-5.32-.33-10.65 1.27-2.9.87-6.2 2.79-10.51 5.92-1.08.79-2.18 1.62-3.65 2.74-10.08 7.72-12.62 9.36-15.98 9.36-3.02 0-5.5 4.02-5 7.94.56 4.5 4.62 6.78 11.89 5.07 14.48-3.4 24.86-12.18 32.69-24.77zM461.17 33.53c13.88 4.96 20.75 4.96 31.62.01 3.02-1.37 5.47-2.94 11-6.82 5.57-3.92 8.05-5.51 11.14-6.92 4.14-1.88 7.78-2.38 11.22-1.28 3.92 1.26 6.2 12.3 6.78 28.45.5 14.2-.52 28.93-2.46 34.2-1.82 4.93-5.86 8.17-11.51 10.02A41.7 41.7 0 0 1 506 93.01c-5.79 0-9 2.4-12.2 7.64-.37.59-1.55 2.6-1.71 2.87-1.75 2.9-3.05 4.33-4.93 4.95-.94.32-2.07.83-3.87 1.74l-2.43 1.23c-1.03.53-1.87.94-2.7 1.34-6.43 3.1-11.73 4.72-17.16 4.72-5.71 0-10.04 2.09-14.02 5.92-1.16 1.11-4.2 4.53-4.63 4.94-2.54 2.44-5.93 4.24-10.85 6.1-1.4.52-5.98 2.13-6.25 2.22l-2.06.78c-.89.36-1.78.63-2.7.81-5.55 1.14-11.14-.54-17.98-4.42-1.27-.73-5.13-3.06-5.76-3.42-2.05-1.16-4.12-1.53-9.09-1.9l-1.73-.15c-4.78-.4-7.68-1.14-10.22-2.97-5-3.61-6.77-7.76-5.65-12.33 1.33-5.42 6.5-11.02 14.85-17.28a169.2 169.2 0 0 1 6.5-4.61c-.33.23 4.33-2.92 5.3-3.6 2.73-1.91 4.8-3.9 12.75-12.04l1.09-1.1c3.49-3.56 5.89-5.89 8.12-7.83 2.9-2.5 4.72-5.95 7.5-13.05l.63-1.61c2.7-6.92 4.28-10 6.87-12.33 1.42-1.28 6.68-6.54 7.93-7.5 3.98-3 8.01-2.73 19.57 1.4zm-.34.94c-11.26-4.02-15-4.28-18.62-1.53-1.19.9-6.4 6.11-7.88 7.43-2.42 2.18-3.96 5.19-6.6 11.95l-.63 1.61c-2.83 7.26-4.72 10.8-7.77 13.45a141.85 141.85 0 0 0-9.16 8.87c-8.02 8.2-10.08 10.2-12.88 12.16-.99.69-5.65 3.84-5.31 3.6-2.5 1.71-4.52 3.13-6.47 4.59-8.17 6.13-13.23 11.6-14.48 16.72-1.02 4.15.58 7.9 5.26 11.27 2.36 1.7 5.11 2.4 9.72 2.8l1.73.13c5.12.4 7.28.78 9.5 2.05.65.36 4.5 2.7 5.76 3.4 6.66 3.78 12.04 5.4 17.29 4.32.86-.17 1.7-.42 2.52-.75a67 67 0 0 1 2.1-.8c.28-.1 4.86-1.7 6.24-2.22 4.8-1.8 8.08-3.56 10.5-5.88.4-.38 3.44-3.8 4.63-4.94 4.16-4 8.72-6.2 14.72-6.2 5.25 0 10.42-1.59 16.73-4.62.82-.4 1.65-.8 2.68-1.33.12-.06 1.93-.99 2.43-1.23 1.84-.93 3-1.46 4-1.8 1.6-.52 2.76-1.82 4.39-4.52l1.7-2.88c3.39-5.5 6.87-8.11 13.07-8.11 4.45 0 8.73-.49 12.64-1.77 5.4-1.76 9.2-4.8 10.9-9.41 1.87-5.11 2.9-19.75 2.39-33.83-.56-15.53-2.81-26.48-6.08-27.52-3.18-1.02-6.57-.55-10.5 1.23-3.02 1.37-5.47 2.94-11 6.83-5.57 3.92-8.05 5.5-11.14 6.92-11.13 5.05-18.26 5.05-32.38.01zM475 55c5.38 0 7.55-.21 9.72-.96 1.26-.43 9.95-4.8 14.88-6.96 1.9-.82 3.56-2.44 6.6-6.04 2.56-3.04 3.19-3.75 4.4-4.84 3.7-3.35 7.07-3.28 10.22 1.23 6.23 8.9 5.61 15.94.07 27.02a71.26 71.26 0 0 0-2.5 5.48c-.32.8-1 2.7-1.09 2.9-.17.45-.34.81-.54 1.17-.63 1.14-1.56 2.21-4.05 4.7-2.4 2.4-5.16 3.27-11.68 4.33-1.81.3-2.2.36-3 .51-6.02 1.1-9.6 2.69-12.24 6.07-3.57 4.59-7.9 7.48-14.98 10.74-.55.24-1.1.5-1.8.8l-1.78.8a60.08 60.08 0 0 0-7.7 3.9c-2.57 1.6-4.79 2.35-9.42 3.46-8.58 2.06-12.28 3.76-17.37 9.36-5.12 5.64-10.17 7.64-16.63 6.7-5.36-.79-10.63-3.01-23.56-9.48-6.3-3.15-6.43-7.78-1.5-13.56 3.38-3.94 3.52-4.06 19.4-16.44 8.12-6.33 12.97-10.57 16.63-14.88 2.53-2.98 4.2-5.73 4.96-8.3 5.5-18.3 12.5-21.98 22.78-15.56 1.95 1.22 6.61 4.55 7.18 4.9 3.36 2.15 6.52 2.95 13 2.95zm0 2c-6.84 0-10.37-.89-14.08-3.26-.63-.4-5.27-3.71-7.16-4.9-9.05-5.65-14.66-2.7-19.8 14.45-.86 2.87-2.67 5.85-5.35 9.01-3.78 4.45-8.7 8.75-16.94 15.17-15.66 12.21-15.86 12.38-19.1 16.16-4.17 4.9-4.09 8 .88 10.48 12.71 6.35 17.89 8.54 22.94 9.28 5.78.84 10.18-.9 14.87-6.06 5.42-5.96 9.45-7.82 18.38-9.96 4.43-1.07 6.5-1.76 8.83-3.22a61.7 61.7 0 0 1 7.94-4.02l1.78-.8 1.78-.8c6.82-3.13 10.91-5.87 14.24-10.14 3-3.87 7-5.64 13.46-6.82.83-.15 1.21-.21 3.04-.51 6.1-1 8.6-1.78 10.58-3.77 2.36-2.36 3.21-3.34 3.72-4.26.15-.27.29-.56.44-.94.06-.15.75-2.06 1.09-2.9.64-1.6 1.45-3.4 2.57-5.64 5.24-10.49 5.8-16.8.07-24.98-2.4-3.44-4.37-3.48-7.24-.89-1.11 1-1.73 1.7-4.22 4.65-3.24 3.85-5.04 5.59-7.32 6.59-4.82 2.1-13.62 6.53-15.03 7.01-2.44.84-4.79 1.07-10.37 1.07zm-12.7 8.6c5.47 3.9 10.34 3.72 18.23.88 5.39-1.94 5.92-2.1 7.7-2.1 2.5-.01 4.21 1.36 5.24 4.46 1.66 4.98-2.32 8.52-12.3 12.68-2.7 1.13-16.25 6.18-20 7.73-7.86 3.24-13.93 6.42-18.87 10.15-13.02 9.84-18.36 11.93-23.71 9.68a24.67 24.67 0 0 1-3.62-1.98l-1.99-1.28a90.4 90.4 0 0 0-2.24-1.4c-3.33-2-2.82-4.28.85-7.34 1.35-1.13 10.66-7.61 13.53-9.91 7.1-5.69 11.91-11.47 14.41-18.34 3.07-8.45 4.89-12.1 6.8-13.39 1.73-1.16 3.36-.53 6.18 1.9.63.56 3.4 3.08 4.11 3.7 1.93 1.7 3.71 3.15 5.67 4.55zm-.6.8c-1.98-1.42-3.79-2.88-5.74-4.6-.73-.64-3.48-3.16-4.1-3.7-2.5-2.16-3.75-2.65-4.97-1.83-1.66 1.11-3.44 4.7-6.42 12.9-2.57 7.07-7.5 12.99-14.72 18.78-2.91 2.33-12.21 8.8-13.52 9.9-3.22 2.68-3.56 4.17-.97 5.72l2.26 1.4 1.99 1.28c1.47.93 2.48 1.5 3.47 1.91 4.9 2.07 9.96.07 22.72-9.56 5.02-3.79 11.15-7 19.1-10.28 3.76-1.55 17.3-6.6 20-7.72 9.5-3.97 13.14-7.2 11.73-11.44-.9-2.71-2.25-3.8-4.3-3.79-1.6 0-2.15.17-7.36 2.05-8.17 2.94-13.34 3.14-19.16-1.01z'/%3E%3C/svg%3E\\")}</style>\\r\\n\\r\\n<section aria-labelledby=\\"temoignages\\" class=\\"bg-testimonials my-16\\">\\r\\n    <div class=\\"container py-28 relative grid grid-cols-1 md:grid-cols-4 gap-8\\">\\r\\n        <svg class=\\"absolute top-5 left-5 md:left-0\\" width=\\"143\\" height=\\"120\\" viewBox=\\"0 0 143 120\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\r\\n            <g opacity=\\"0.8\\" clip-path=\\"url(#clip0)\\">\\r\\n            <path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z\\" fill=\\"#F9F871\\"/>\\r\\n            </g>\\r\\n            <defs>\\r\\n            <clipPath id=\\"clip0\\">\\r\\n            <rect width=\\"143\\" height=\\"120\\" fill=\\"white\\"/>\\r\\n            </clipPath>\\r\\n            </defs>\\r\\n        </svg>\\r\\n        <div class=\\"col-span-2\\">\\r\\n            <h2 class=\\"text-5xl lg:text-7xl font-black text-gray-700 relative z-10 pb-3\\">{PrismicDom.RichText.asText(slice.primary.titre_section)}</h2>\\r\\n            <p class=\\"text-gray-600\\">{@html PrismicDom.RichText.asHtml(slice.primary.intro)}</p>\\r\\n        </div>\\r\\n        <div class=\\"bg-gray-bg p-8 col-start-1 col-span-2 md:col-start-3 md:col-span-2 rounded-lg md:place-self-start shadow-lg relative\\">\\r\\n            <div class=\\"absolute -top-2 left-2\\">\\r\\n                <svg class=\\"absolute top-5 left-5 md:left-0\\" width=\\"20\\" height=\\"16\\" viewBox=\\"0 0 143 120\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\r\\n                    <g opacity=\\"1\\" clip-path=\\"url(#clip1)\\">\\r\\n                    <path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z\\" fill=\\"#ECEFEF\\"/>\\r\\n                    </g>\\r\\n                    <defs>\\r\\n                    <clipPath id=\\"clip1\\">\\r\\n                    <rect width=\\"143\\" height=\\"120\\" fill=\\"white\\"/>\\r\\n                    </clipPath>\\r\\n                    </defs>\\r\\n                </svg>\\r\\n            </div>\\r\\n            <div class=\\"pb-6\\">{@html PrismicDom.RichText.asHtml(slice.items[0].temoignage)}</div>\\r\\n            <p class=\\"font-bold text-lg\\">{slice.items[0].nom}</p>\\r\\n            <p class=\\"text-gray-light\\">{slice.items[0].intitule}</p>\\r\\n        </div>\\r\\n        <div class=\\"bg-gray-bg p-8 col-start-1 col-span-2 md:col-start-1 md:col-span-2 xl:col-start-2 xl:col-span-1 rounded-lg shadow-lg relative\\">\\r\\n            <div class=\\"absolute -top-2 left-2\\">\\r\\n                <svg class=\\"absolute top-5 left-5 md:left-0\\" width=\\"20\\" height=\\"16\\" viewBox=\\"0 0 143 120\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\r\\n                    <g opacity=\\"1\\" clip-path=\\"url(#clip2)\\">\\r\\n                    <path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z\\" fill=\\"#ECEFEF\\"/>\\r\\n                    </g>\\r\\n                    <defs>\\r\\n                    <clipPath id=\\"clip2\\">\\r\\n                    <rect width=\\"143\\" height=\\"120\\" fill=\\"white\\"/>\\r\\n                    </clipPath>\\r\\n                    </defs>\\r\\n                </svg>\\r\\n            </div>\\r\\n            <div class=\\"pb-6\\">{@html PrismicDom.RichText.asHtml(slice.items[1].temoignage)}</div>\\r\\n            <p class=\\"font-bold text-lg\\">{slice.items[1].nom}</p>\\r\\n            <p class=\\"text-gray-light\\">{slice.items[1].intitule}</p>\\r\\n        </div>\\r\\n        <div class=\\"bg-gray-bg p-8 col-start-1 col-span-2 md:row-start-2 md:col-start-3 rounded-lg md:place-self-start shadow-lg relative\\">\\r\\n            <div class=\\"absolute -top-2 left-2\\">\\r\\n                <svg class=\\"absolute top-5 left-5 md:left-0\\" width=\\"20\\" height=\\"16\\" viewBox=\\"0 0 143 120\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\r\\n                    <g opacity=\\"1\\" clip-path=\\"url(#clip3)\\">\\r\\n                    <path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z\\" fill=\\"#ECEFEF\\"/>\\r\\n                    </g>\\r\\n                    <defs>\\r\\n                    <clipPath id=\\"clip3\\">\\r\\n                    <rect width=\\"143\\" height=\\"120\\" fill=\\"white\\"/>\\r\\n                    </clipPath>\\r\\n                    </defs>\\r\\n                </svg>\\r\\n            </div>\\r\\n            <div class=\\"pb-6\\">{@html PrismicDom.RichText.asHtml(slice.items[2].temoignage)}</div>\\r\\n            <p class=\\"font-bold text-lg\\">{slice.items[2].nom}</p>\\r\\n            <p class=\\"text-gray-light\\">{slice.items[2].intitule}</p>\\r\\n        </div>\\r\\n    </div>\\r\\n</section>"],"names":[],"mappings":"AAKO,+BAAgB,CAAC,iBAAiB,OAAO,CAAC,iBAAiB,IAAI,m8yFAAm8yF,CAAC,CAAC"}`
};
var Testimonials = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { slice } = $$props;
  if ($$props.slice === void 0 && $$bindings.slice && slice !== void 0)
    $$bindings.slice(slice);
  $$result.css.add(css$5);
  return `<section aria-labelledby="${"temoignages"}" class="${"bg-testimonials my-16 svelte-1chll13"}"><div class="${"container py-28 relative grid grid-cols-1 md:grid-cols-4 gap-8"}"><svg class="${"absolute top-5 left-5 md:left-0"}" width="${"143"}" height="${"120"}" viewBox="${"0 0 143 120"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><g opacity="${"0.8"}" clip-path="${"url(#clip0)"}"><path fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z"}" fill="${"#F9F871"}"></path></g><defs><clipPath id="${"clip0"}"><rect width="${"143"}" height="${"120"}" fill="${"white"}"></rect></clipPath></defs></svg>
        <div class="${"col-span-2"}"><h2 class="${"text-5xl lg:text-7xl font-black text-gray-700 relative z-10 pb-3"}">${escape2(import_prismic_dom.default.RichText.asText(slice.primary.titre_section))}</h2>
            <p class="${"text-gray-600"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(slice.primary.intro)}<!-- HTML_TAG_END --></p></div>
        <div class="${"bg-gray-bg p-8 col-start-1 col-span-2 md:col-start-3 md:col-span-2 rounded-lg md:place-self-start shadow-lg relative"}"><div class="${"absolute -top-2 left-2"}"><svg class="${"absolute top-5 left-5 md:left-0"}" width="${"20"}" height="${"16"}" viewBox="${"0 0 143 120"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><g opacity="${"1"}" clip-path="${"url(#clip1)"}"><path fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z"}" fill="${"#ECEFEF"}"></path></g><defs><clipPath id="${"clip1"}"><rect width="${"143"}" height="${"120"}" fill="${"white"}"></rect></clipPath></defs></svg></div>
            <div class="${"pb-6"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(slice.items[0].temoignage)}<!-- HTML_TAG_END --></div>
            <p class="${"font-bold text-lg"}">${escape2(slice.items[0].nom)}</p>
            <p class="${"text-gray-light"}">${escape2(slice.items[0].intitule)}</p></div>
        <div class="${"bg-gray-bg p-8 col-start-1 col-span-2 md:col-start-1 md:col-span-2 xl:col-start-2 xl:col-span-1 rounded-lg shadow-lg relative"}"><div class="${"absolute -top-2 left-2"}"><svg class="${"absolute top-5 left-5 md:left-0"}" width="${"20"}" height="${"16"}" viewBox="${"0 0 143 120"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><g opacity="${"1"}" clip-path="${"url(#clip2)"}"><path fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z"}" fill="${"#ECEFEF"}"></path></g><defs><clipPath id="${"clip2"}"><rect width="${"143"}" height="${"120"}" fill="${"white"}"></rect></clipPath></defs></svg></div>
            <div class="${"pb-6"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(slice.items[1].temoignage)}<!-- HTML_TAG_END --></div>
            <p class="${"font-bold text-lg"}">${escape2(slice.items[1].nom)}</p>
            <p class="${"text-gray-light"}">${escape2(slice.items[1].intitule)}</p></div>
        <div class="${"bg-gray-bg p-8 col-start-1 col-span-2 md:row-start-2 md:col-start-3 rounded-lg md:place-self-start shadow-lg relative"}"><div class="${"absolute -top-2 left-2"}"><svg class="${"absolute top-5 left-5 md:left-0"}" width="${"20"}" height="${"16"}" viewBox="${"0 0 143 120"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><g opacity="${"1"}" clip-path="${"url(#clip3)"}"><path fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z"}" fill="${"#ECEFEF"}"></path></g><defs><clipPath id="${"clip3"}"><rect width="${"143"}" height="${"120"}" fill="${"white"}"></rect></clipPath></defs></svg></div>
            <div class="${"pb-6"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(slice.items[2].temoignage)}<!-- HTML_TAG_END --></div>
            <p class="${"font-bold text-lg"}">${escape2(slice.items[2].nom)}</p>
            <p class="${"text-gray-light"}">${escape2(slice.items[2].intitule)}</p></div></div></section>`;
});
var css$4 = {
  code: ".img-container.svelte-1okkftl{flex-grow:1;height:auto;width:auto}",
  map: `{"version":3,"file":"CTA.svelte","sources":["CTA.svelte"],"sourcesContent":["<script>\\r\\n    import PrismicDom from 'prismic-dom'\\r\\n    import Img from '$lib/UI/Img.svelte'\\r\\n    import CTALink from '$lib/UI/CTALink.svelte'\\r\\n    export let slice\\r\\n<\/script>\\r\\n\\r\\n<style>.img-container{flex-grow:1;height:auto;width:auto}</style>\\r\\n\\r\\n<section class=\\"py-8 px-4\\" aria-labelledby=\\"bandeau-contact\\">\\r\\n    <div class=\\"flex flex-wrap items-center max-w-7xl mx-auto\\">\\r\\n      <div class=\\"md:w-1/2 px-4 mb-8 md:mb-0\\">\\r\\n          <div class=\\"img-container\\">\\r\\n              <Img\\r\\n              src={slice.primary.image.url}\\r\\n              alt={slice.primary.image.alt}\\r\\n              width={slice.primary.image.dimensions.width}\\r\\n              height={slice.primary.image.dimensions.height}\\r\\n              styles=\\"rounded shadow\\" />\\r\\n          </div>\\r\\n      </div>\\r\\n      <div class=\\"md:w-1/2 px-4 md:pl-20\\">\\r\\n        <p class=\\"text-gray-600 uppercase tracking-wide text-sm font-semibold pb-8\\">{PrismicDom.RichText.asText(slice.primary.sous_titre1)}</p>\\r\\n        <h2 class=\\"text-4xl md:pl-8 md:border-l-8 md:border-bleu-dark font-black font-heading\\">{PrismicDom.RichText.asText(slice.primary.titre_section)}</h2>\\r\\n        <div class=\\"mt-6 mb-8 text-gray-light leading-relaxed\\">{@html PrismicDom.RichText.asHtml(slice.primary.description)}</div>\\r\\n        <CTALink isLink={true} link=\\"contact/#formulaire\\" texte={slice.primary.texte_lien_cta1} spacing=\\"my-2\\" />\\r\\n      </div>\\r\\n    </div>\\r\\n  </section>"],"names":[],"mappings":"AAOO,6BAAc,CAAC,UAAU,CAAC,CAAC,OAAO,IAAI,CAAC,MAAM,IAAI,CAAC"}`
};
var CTA = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { slice } = $$props;
  if ($$props.slice === void 0 && $$bindings.slice && slice !== void 0)
    $$bindings.slice(slice);
  $$result.css.add(css$4);
  return `<section class="${"py-8 px-4"}" aria-labelledby="${"bandeau-contact"}"><div class="${"flex flex-wrap items-center max-w-7xl mx-auto"}"><div class="${"md:w-1/2 px-4 mb-8 md:mb-0"}"><div class="${"img-container svelte-1okkftl"}">${validate_component(Img, "Img").$$render($$result, {
    src: slice.primary.image.url,
    alt: slice.primary.image.alt,
    width: slice.primary.image.dimensions.width,
    height: slice.primary.image.dimensions.height,
    styles: "rounded shadow"
  }, {}, {})}</div></div>
      <div class="${"md:w-1/2 px-4 md:pl-20"}"><p class="${"text-gray-600 uppercase tracking-wide text-sm font-semibold pb-8"}">${escape2(import_prismic_dom.default.RichText.asText(slice.primary.sous_titre1))}</p>
        <h2 class="${"text-4xl md:pl-8 md:border-l-8 md:border-bleu-dark font-black font-heading"}">${escape2(import_prismic_dom.default.RichText.asText(slice.primary.titre_section))}</h2>
        <div class="${"mt-6 mb-8 text-gray-light leading-relaxed"}"><!-- HTML_TAG_START -->${import_prismic_dom.default.RichText.asHtml(slice.primary.description)}<!-- HTML_TAG_END --></div>
        ${validate_component(CTALink, "CTALink").$$render($$result, {
    isLink: true,
    link: "contact/#formulaire",
    texte: slice.primary.texte_lien_cta1,
    spacing: "my-2"
  }, {}, {})}</div></div></section>`;
});
var css$3 = {
  code: ".projet-spacing.svelte-wxjv61{gap:8rem}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n    export async function load({ fetch }) {\\n        const { accueil } = await fetch('/api').then(res => res.json())\\n        \\n        return {\\n            props: {\\n                accueil: accueil[0]\\n            }\\n        }\\n    }\\n<\/script>\\n\\n<script>\\n    import { extractMotUnderline } from '../utils/helpers'\\n    import SEOHead from '$lib/SEOHead.svelte'\\n    import Hero from '$lib/Hero.svelte'\\n    import Service from '$lib/Service.svelte'\\n    import Projet from '$lib/Projet.svelte'\\n    import Testimonials from '$lib/Testimonials.svelte'\\n    import CTA from '$lib/CTA.svelte'\\n\\n    export let accueil\\n<\/script>\\n\\n<style>.projet-spacing{gap:8rem}</style>\\n\\n<SEOHead\\n\\ttitle=\\"Accueil | St\xE9phanie Delon\\"\\n\\tdescription=\\"D\xE9veloppeuse web et graphiste situ\xE9e dans le Cap Sizun en Finist\xE8re, d\xE9couvrez ici les services que je vous propose ainsi que mes plus r\xE9cents projets | St\xE9phanie Delon\\"\\n\\timage=\\"\\"\\n\\talt=\\"\\" />\\n\\n<section class=\\"container pb-8\\">\\n    <Hero {accueil} />\\n</section>\\n{#each accueil.data.body as slice}\\n    {#if slice.slice_type === 'services'}\\n<section id=\\"services\\" aria-labelledby=\\"services\\" class=\\"container py-16\\">\\n        <div>\\n            <h2 class=\\"text-4xl font-bold text-gray-800 max-w-2xl pb-20\\">{extractMotUnderline(slice.primary.titre_section[0].text, slice.primary.mot_underline1)} <span class=\\"relative\\">\\n                {slice.primary.mot_underline1}\\n                <div class=\\"absolute -bottom-5 right-0 -mr-10\\">\\n                    <svg class=\\"svg-shadow\\" width=\\"126\\" height=\\"21\\" viewBox=\\"0 0 126 21\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\n                        <path d=\\"M3.5 17.5C25.3333 10.1666 79.7 -2.30002 122.5 6.49998\\" stroke=\\"#F9F871\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\"/>\\n                    </svg>                  \\n                </div>\\n            </span>\\n            </h2>\\n        </div>\\n        <div class=\\"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6\\">\\n            {#each slice.items as service}\\n                <Service {service} />\\n            {/each}\\n        </div>\\n</section>\\n    {/if}\\n    {#if slice.slice_type === 'projets'}\\n<section id=\\"projets\\" aria-labelledby=\\"projets\\" class=\\"container py-16\\">\\n        <div>\\n            <h2 class=\\"text-4xl font-bold text-gray-800 max-w-2xl pb-20\\">Zoom sur les \\n                <span class=\\"relative\\">\\n                    projets\\n                    <div class=\\"hidden sm:block absolute -bottom-5 right-0\\">\\n                        <svg class=\\"svg-shadow\\" width=\\"176\\" height=\\"28\\" viewBox=\\"0 0 176 28\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\n                            <path d=\\"M3.5 24.5C61.3333 25.5 176.1 22.6 172.5 3\\" stroke=\\"#F9F871\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\"/>\\n                        </svg>                 \\n                    </div>\\n                </span> \\n            r\xE9cemment mis en ligne\\n            </h2>\\n        </div>\\n        <div class=\\"flex flex-col projet-spacing\\">\\n            {#each slice.items as slice, i}\\n                <Projet {slice} isImgRight={i % 2 === 0 ? false : true } />\\n            {/each}\\n        </div>\\n</section>\\n    {/if}\\n    {#if slice.slice_type === 'temoignages'}\\n<Testimonials {slice} />\\n    {/if}\\n    {#if slice.slice_type === 'cta'}\\n<CTA {slice} />\\n    {/if}\\n{/each}"],"names":[],"mappings":"AAwBO,6BAAe,CAAC,IAAI,IAAI,CAAC"}`
};
async function load$2({ fetch: fetch2 }) {
  const { accueil } = await fetch2("/api").then((res) => res.json());
  return { props: { accueil: accueil[0] } };
}
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { accueil } = $$props;
  if ($$props.accueil === void 0 && $$bindings.accueil && accueil !== void 0)
    $$bindings.accueil(accueil);
  $$result.css.add(css$3);
  return `${validate_component(SEOHead, "SEOHead").$$render($$result, {
    title: "Accueil | St\xE9phanie Delon",
    description: "D\xE9veloppeuse web et graphiste situ\xE9e dans le Cap Sizun en Finist\xE8re, d\xE9couvrez ici les services que je vous propose ainsi que mes plus r\xE9cents projets | St\xE9phanie Delon",
    image: "",
    alt: ""
  }, {}, {})}

<section class="${"container pb-8"}">${validate_component(Hero, "Hero").$$render($$result, { accueil }, {}, {})}</section>
${each(accueil.data.body, (slice) => `${slice.slice_type === "services" ? `<section id="${"services"}" aria-labelledby="${"services"}" class="${"container py-16"}"><div><h2 class="${"text-4xl font-bold text-gray-800 max-w-2xl pb-20"}">${escape2(extractMotUnderline(slice.primary.titre_section[0].text, slice.primary.mot_underline1))} <span class="${"relative"}">${escape2(slice.primary.mot_underline1)}
                <div class="${"absolute -bottom-5 right-0 -mr-10"}"><svg class="${"svg-shadow"}" width="${"126"}" height="${"21"}" viewBox="${"0 0 126 21"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M3.5 17.5C25.3333 10.1666 79.7 -2.30002 122.5 6.49998"}" stroke="${"#F9F871"}" stroke-width="${"6"}" stroke-linecap="${"round"}"></path></svg>                  
                </div></span>
            </h2></div>
        <div class="${"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"}">${each(slice.items, (service) => `${validate_component(Service, "Service").$$render($$result, { service }, {}, {})}`)}</div>
</section>` : ``}
    ${slice.slice_type === "projets" ? `<section id="${"projets"}" aria-labelledby="${"projets"}" class="${"container py-16"}"><div><h2 class="${"text-4xl font-bold text-gray-800 max-w-2xl pb-20"}">Zoom sur les 
                <span class="${"relative"}">projets
                    <div class="${"hidden sm:block absolute -bottom-5 right-0"}"><svg class="${"svg-shadow"}" width="${"176"}" height="${"28"}" viewBox="${"0 0 176 28"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M3.5 24.5C61.3333 25.5 176.1 22.6 172.5 3"}" stroke="${"#F9F871"}" stroke-width="${"6"}" stroke-linecap="${"round"}"></path></svg>                 
                    </div></span> 
            r\xE9cemment mis en ligne
            </h2></div>
        <div class="${"flex flex-col projet-spacing svelte-wxjv61"}">${each(slice.items, (slice2, i) => `${validate_component(Projet, "Projet").$$render($$result, {
    slice: slice2,
    isImgRight: i % 2 === 0 ? false : true
  }, {}, {})}`)}</div>
</section>` : ``}
    ${slice.slice_type === "temoignages" ? `${validate_component(Testimonials, "Testimonials").$$render($$result, { slice }, {}, {})}` : ``}
    ${slice.slice_type === "cta" ? `${validate_component(CTA, "CTA").$$render($$result, { slice }, {}, {})}` : ``}`)}`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  load: load$2
});
var css$2 = {
  code: ".width.svelte-12xs12b{width:100%}@media(min-width:768px){.width.svelte-12xs12b{width:66.666667%}}h1.svelte-12xs12b{font-size:1.875rem;line-height:2.25rem;margin-bottom:2rem}h1.svelte-12xs12b,h2.svelte-12xs12b{font-weight:700}h2.svelte-12xs12b{margin-bottom:.5rem}p.svelte-12xs12b{margin-bottom:2rem}a.svelte-12xs12b{--tw-text-opacity:1;color:rgba(15,111,106,var(--tw-text-opacity));text-decoration:underline}",
  map: `{"version":3,"file":"mentions-legales.svelte","sources":["mentions-legales.svelte"],"sourcesContent":["<script context=\\"module\\">\\r\\n    export async function load({ fetch }) {\\r\\n        const { accueil } = await fetch('/api').then(res => res.json())\\r\\n        let cta = accueil[0].data.body.filter(slice => slice.slice_type === \\"cta\\")\\r\\n\\r\\n        return {\\r\\n            props: {\\r\\n                slice: cta[0]\\r\\n            }\\r\\n        }\\r\\n    }\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n    import CTA from '$lib/CTA.svelte'\\r\\n\\r\\n    export let slice\\r\\n\\r\\n<\/script>\\r\\n\\r\\n<style>.width{width:100%}@media (min-width:768px){.width{width:66.666667%}}h1{font-size:1.875rem;line-height:2.25rem;margin-bottom:2rem}h1,h2{font-weight:700}h2{margin-bottom:.5rem}p{margin-bottom:2rem}a{--tw-text-opacity:1;color:rgba(15,111,106,var(--tw-text-opacity));text-decoration:underline}</style>\\r\\n\\r\\n<section class=\\"container py-16\\">\\r\\n    <div class=\\"width mx-auto\\">\\r\\n        <h1>Mentions l\xE9gales</h1>\\r\\n        <h2>Pr\xE9sentation du site</h2>\\r\\n        <p>En vertu de l'article 6 de la loi n\xB0 2004-575 du 21 juin 2004 pour la confiance dans l'\xE9conomie num\xE9rique, il est pr\xE9cis\xE9 aux utilisateurs (Internaute se connectant, utilisant le site susnomm\xE9) du site <a href=\\"https://sdelon.com/\\">sdelon.com</a> l'identit\xE9 des diff\xE9rents intervenants dans le cadre de sa r\xE9alisation et de son suivi : Propri\xE9taire : \u2013 SIRET \u2013 1 Interridi - 29770 Goulien\\r\\n        Responsable publication : \u2013 sdelon.webdesign@gmail.com\\r\\n        Le responsable publication est une personne physique ou une personne morale\\r\\n        H\xE9bergeur : Netlify \u2013 2325 3rd Street Suite 215, San Francisco 94107, USA\\r\\n        Cr\xE9dits : Le mod\xE8le de mentions l\xE9gales est offert par Subdelirium.com Mod\xE8le de mentions l\xE9gales</p>\\r\\n        <h2>Propri\xE9t\xE9 intellectuelle et contrefa\xE7ons</h2>\\r\\n        <p>St\xE9phanie Delon est propri\xE9taire des droits de propri\xE9t\xE9 intellectuelle ou d\xE9tient les droits d\u2019usage sur tous les \xE9l\xE9ments accessibles sur le site, notamment les textes, images, graphismes, logo, ic\xF4nes, sons, logiciels. Toute reproduction, repr\xE9sentation, modification, publication, adaptation de tout ou partie des \xE9l\xE9ments du site, quel que soit le moyen ou le proc\xE9d\xE9 utilis\xE9, est interdite, sauf autorisation \xE9crite pr\xE9alable. Toute exploitation non autoris\xE9e du site ou de l\u2019un quelconque des \xE9l\xE9ments qu\u2019il contient sera consid\xE9r\xE9e comme constitutive d\u2019une contrefa\xE7on et poursuivie conform\xE9ment aux dispositions des articles L.335-2 et suivants du Code de Propri\xE9t\xE9 Intellectuelle.</p>\\r\\n        <h2>Gestion des donn\xE9es personnelles</h2>\\r\\n        <p>En France, les donn\xE9es personnelles sont notamment prot\xE9g\xE9es par la loi n\xB0 78-87 du 6 janvier 1978, la loi n\xB0 2004-801 du 6 ao\xFBt 2004, l'article L. 226-13 du Code p\xE9nal et la Directive Europ\xE9enne du 24 octobre 1995. \xC0 l'occasion de l'utilisation du site <a href=\\"https://sdelon.com/\\">sdelon.com</a>, peuvent \xEAtres recueillies : l'URL des liens par l'interm\xE9diaire desquels l'utilisateur a acc\xE9d\xE9 au site <a href=\\"https://sdelon.com/\\">sdelon.com</a>, le fournisseur d'acc\xE8s de l'utilisateur, l'adresse de protocole Internet (IP) de l'utilisateur. En tout \xE9tat de cause ne collecte des informations personnelles relatives \xE0 l'utilisateur que pour le besoin de certains services propos\xE9s par le site <a href=\\"https://sdelon.com/\\">sdelon.com</a>. Conform\xE9ment aux dispositions des articles 38 et suivants de la loi 78-17 du 6 janvier 1978 relative \xE0 l\u2019informatique, aux fichiers et aux libert\xE9s, tout utilisateur dispose d\u2019un droit d\u2019acc\xE8s, de rectification et d\u2019opposition aux donn\xE9es personnelles le concernant, en effectuant sa demande \xE9crite et sign\xE9e, accompagn\xE9e d\u2019une copie du titre d\u2019identit\xE9 avec signature du titulaire de la pi\xE8ce, en pr\xE9cisant l\u2019adresse \xE0 laquelle la r\xE9ponse doit \xEAtre envoy\xE9e. Aucune information personnelle de l'utilisateur du site <a href=\\"https://sdelon.com/\\">sdelon.com</a> n'est publi\xE9e \xE0 l'insu de l'utilisateur, \xE9chang\xE9e, transf\xE9r\xE9e, c\xE9d\xE9e ou vendue sur un support quelconque \xE0 des tiers. Seule l'hypoth\xE8se du rachat de et de ses droits permettrait la transmission des dites informations \xE0 l'\xE9ventuel acqu\xE9reur qui serait \xE0 son tour tenu de la m\xEAme obligation de conservation et de modification des donn\xE9es vis \xE0 vis de l'utilisateur du site <a href=\\"https://sdelon.com/\\">sdelon.com</a>. Le site n'est pas d\xE9clar\xE9 \xE0 la CNIL car il ne recueille pas d'informations personnelles. Les bases de donn\xE9es sont prot\xE9g\xE9es par les dispositions de la loi du 1er juillet 1998 transposant la directive 96/9 du 11 mars 1996 relative \xE0 la protection juridique des bases de donn\xE9es.</p>\\r\\n        <h2>Liens hypertextes et cookies</h2>\\r\\n        <p>Le site <a href=\\"https://sdelon.com/\\">sdelon.com</a> contient un certain nombre de liens hypertextes vers d\u2019autres sites, mis en place avec l\u2019autorisation des directeurs de publication de ces sites. Cependant, st\xE9phanie Delon n\u2019a pas la possibilit\xE9 de v\xE9rifier le contenu des sites ainsi visit\xE9s, et n\u2019assumera en cons\xE9quence aucune responsabilit\xE9 de ce fait. La navigation sur le site <a href=\\"https://sdelon.com/\\">sdelon.com</a> est susceptible de provoquer l\u2019installation de cookie(s) d\u2019analyse sur l\u2019ordinateur de l\u2019utilisateur. Un cookie est un fichier de petite taille, qui ne permet pas l\u2019identification de l\u2019utilisateur, mais qui enregistre des informations relatives \xE0 la navigation d\u2019un ordinateur sur un site. Les donn\xE9es ainsi obtenues visent \xE0 faciliter la navigation ult\xE9rieure sur le site, et ont \xE9galement vocation \xE0 permettre diverses mesures de fr\xE9quentation. L\u2019utilisateur peut toutefois refuser ces cookies et configurer son ordinateur de la mani\xE8re suivante, pour refuser l\u2019installation des cookies : Sous Internet Explorer : onglet outil (pictogramme en forme de rouage en haut a droite) / options internet. Cliquez sur Confidentialit\xE9 et choisissez Bloquer tous les cookies. Validez sur Ok. Sous Firefox : en haut de la fen\xEAtre du navigateur, cliquez sur le bouton Firefox, puis aller dans l'onglet Options. Cliquer sur l'onglet Vie priv\xE9e. Param\xE9trez les R\xE8gles de conservation sur : utiliser les param\xE8tres personnalis\xE9s pour l'historique. Enfin d\xE9cochez-la pour d\xE9sactiver les cookies. Sous Safari : Cliquez en haut \xE0 droite du navigateur sur le pictogramme de menu (symbolis\xE9 par un rouage). S\xE9lectionnez Param\xE8tres. Cliquez sur Afficher les param\xE8tres avanc\xE9s. Dans la section \\"Confidentialit\xE9\\", cliquez sur Param\xE8tres de contenu. Dans la section \\"Cookies\\", vous pouvez bloquer les cookies. Sous Chrome : Cliquez en haut \xE0 droite du navigateur sur le pictogramme de menu (symbolis\xE9 par trois lignes horizontales). S\xE9lectionnez Param\xE8tres. Cliquez sur Afficher les param\xE8tres avanc\xE9s. Dans la section \\"Confidentialit\xE9\\", cliquez sur pr\xE9f\xE9rences. Dans l'onglet \\"Confidentialit\xE9\\", vous pouvez bloquer les cookies.</p>\\r\\n        <h2>Droit applicable et attribution de juridiction.</h2>\\r\\n        <p>Tout litige en relation avec l\u2019utilisation du site <a href=\\"https://sdelon.com/\\">sdelon.com</a> est soumis au droit fran\xE7ais. Il est fait attribution exclusive de juridiction aux tribunaux comp\xE9tents de Quimper.</p>\\r\\n        <h2>Les principales lois concern\xE9es.</h2>\\r\\n        <p>Loi n\xB0 78-17 du 6 janvier 1978, notamment modifi\xE9e par la loi n\xB0 2004-801 du 6 ao\xFBt 2004 relative \xE0 l'informatique, aux fichiers et aux libert\xE9s. Loi n\xB0 2004-575 du 21 juin 2004 pour la confiance dans l'\xE9conomie num\xE9rique.</p>\\r\\n    </div>\\r\\n</section>\\r\\n<CTA {slice} />\\r\\n"],"names":[],"mappings":"AAoBO,qBAAM,CAAC,MAAM,IAAI,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,qBAAM,CAAC,MAAM,UAAU,CAAC,CAAC,iBAAE,CAAC,UAAU,QAAQ,CAAC,YAAY,OAAO,CAAC,cAAc,IAAI,CAAC,iBAAE,CAAC,iBAAE,CAAC,YAAY,GAAG,CAAC,iBAAE,CAAC,cAAc,KAAK,CAAC,gBAAC,CAAC,cAAc,IAAI,CAAC,gBAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,EAAE,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,gBAAgB,SAAS,CAAC"}`
};
async function load$1({ fetch: fetch2 }) {
  const { accueil } = await fetch2("/api").then((res) => res.json());
  let cta = accueil[0].data.body.filter((slice) => slice.slice_type === "cta");
  return { props: { slice: cta[0] } };
}
var Mentions_legales = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { slice } = $$props;
  if ($$props.slice === void 0 && $$bindings.slice && slice !== void 0)
    $$bindings.slice(slice);
  $$result.css.add(css$2);
  return `<section class="${"container py-16"}"><div class="${"width mx-auto svelte-12xs12b"}"><h1 class="${"svelte-12xs12b"}">Mentions l\xE9gales</h1>
        <h2 class="${"svelte-12xs12b"}">Pr\xE9sentation du site</h2>
        <p class="${"svelte-12xs12b"}">En vertu de l&#39;article 6 de la loi n\xB0 2004-575 du 21 juin 2004 pour la confiance dans l&#39;\xE9conomie num\xE9rique, il est pr\xE9cis\xE9 aux utilisateurs (Internaute se connectant, utilisant le site susnomm\xE9) du site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a> l&#39;identit\xE9 des diff\xE9rents intervenants dans le cadre de sa r\xE9alisation et de son suivi : Propri\xE9taire : \u2013 SIRET \u2013 1 Interridi - 29770 Goulien
        Responsable publication : \u2013 sdelon.webdesign@gmail.com
        Le responsable publication est une personne physique ou une personne morale
        H\xE9bergeur : Netlify \u2013 2325 3rd Street Suite 215, San Francisco 94107, USA
        Cr\xE9dits : Le mod\xE8le de mentions l\xE9gales est offert par Subdelirium.com Mod\xE8le de mentions l\xE9gales</p>
        <h2 class="${"svelte-12xs12b"}">Propri\xE9t\xE9 intellectuelle et contrefa\xE7ons</h2>
        <p class="${"svelte-12xs12b"}">St\xE9phanie Delon est propri\xE9taire des droits de propri\xE9t\xE9 intellectuelle ou d\xE9tient les droits d\u2019usage sur tous les \xE9l\xE9ments accessibles sur le site, notamment les textes, images, graphismes, logo, ic\xF4nes, sons, logiciels. Toute reproduction, repr\xE9sentation, modification, publication, adaptation de tout ou partie des \xE9l\xE9ments du site, quel que soit le moyen ou le proc\xE9d\xE9 utilis\xE9, est interdite, sauf autorisation \xE9crite pr\xE9alable. Toute exploitation non autoris\xE9e du site ou de l\u2019un quelconque des \xE9l\xE9ments qu\u2019il contient sera consid\xE9r\xE9e comme constitutive d\u2019une contrefa\xE7on et poursuivie conform\xE9ment aux dispositions des articles L.335-2 et suivants du Code de Propri\xE9t\xE9 Intellectuelle.</p>
        <h2 class="${"svelte-12xs12b"}">Gestion des donn\xE9es personnelles</h2>
        <p class="${"svelte-12xs12b"}">En France, les donn\xE9es personnelles sont notamment prot\xE9g\xE9es par la loi n\xB0 78-87 du 6 janvier 1978, la loi n\xB0 2004-801 du 6 ao\xFBt 2004, l&#39;article L. 226-13 du Code p\xE9nal et la Directive Europ\xE9enne du 24 octobre 1995. \xC0 l&#39;occasion de l&#39;utilisation du site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a>, peuvent \xEAtres recueillies : l&#39;URL des liens par l&#39;interm\xE9diaire desquels l&#39;utilisateur a acc\xE9d\xE9 au site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a>, le fournisseur d&#39;acc\xE8s de l&#39;utilisateur, l&#39;adresse de protocole Internet (IP) de l&#39;utilisateur. En tout \xE9tat de cause ne collecte des informations personnelles relatives \xE0 l&#39;utilisateur que pour le besoin de certains services propos\xE9s par le site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a>. Conform\xE9ment aux dispositions des articles 38 et suivants de la loi 78-17 du 6 janvier 1978 relative \xE0 l\u2019informatique, aux fichiers et aux libert\xE9s, tout utilisateur dispose d\u2019un droit d\u2019acc\xE8s, de rectification et d\u2019opposition aux donn\xE9es personnelles le concernant, en effectuant sa demande \xE9crite et sign\xE9e, accompagn\xE9e d\u2019une copie du titre d\u2019identit\xE9 avec signature du titulaire de la pi\xE8ce, en pr\xE9cisant l\u2019adresse \xE0 laquelle la r\xE9ponse doit \xEAtre envoy\xE9e. Aucune information personnelle de l&#39;utilisateur du site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a> n&#39;est publi\xE9e \xE0 l&#39;insu de l&#39;utilisateur, \xE9chang\xE9e, transf\xE9r\xE9e, c\xE9d\xE9e ou vendue sur un support quelconque \xE0 des tiers. Seule l&#39;hypoth\xE8se du rachat de et de ses droits permettrait la transmission des dites informations \xE0 l&#39;\xE9ventuel acqu\xE9reur qui serait \xE0 son tour tenu de la m\xEAme obligation de conservation et de modification des donn\xE9es vis \xE0 vis de l&#39;utilisateur du site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a>. Le site n&#39;est pas d\xE9clar\xE9 \xE0 la CNIL car il ne recueille pas d&#39;informations personnelles. Les bases de donn\xE9es sont prot\xE9g\xE9es par les dispositions de la loi du 1er juillet 1998 transposant la directive 96/9 du 11 mars 1996 relative \xE0 la protection juridique des bases de donn\xE9es.</p>
        <h2 class="${"svelte-12xs12b"}">Liens hypertextes et cookies</h2>
        <p class="${"svelte-12xs12b"}">Le site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a> contient un certain nombre de liens hypertextes vers d\u2019autres sites, mis en place avec l\u2019autorisation des directeurs de publication de ces sites. Cependant, st\xE9phanie Delon n\u2019a pas la possibilit\xE9 de v\xE9rifier le contenu des sites ainsi visit\xE9s, et n\u2019assumera en cons\xE9quence aucune responsabilit\xE9 de ce fait. La navigation sur le site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a> est susceptible de provoquer l\u2019installation de cookie(s) d\u2019analyse sur l\u2019ordinateur de l\u2019utilisateur. Un cookie est un fichier de petite taille, qui ne permet pas l\u2019identification de l\u2019utilisateur, mais qui enregistre des informations relatives \xE0 la navigation d\u2019un ordinateur sur un site. Les donn\xE9es ainsi obtenues visent \xE0 faciliter la navigation ult\xE9rieure sur le site, et ont \xE9galement vocation \xE0 permettre diverses mesures de fr\xE9quentation. L\u2019utilisateur peut toutefois refuser ces cookies et configurer son ordinateur de la mani\xE8re suivante, pour refuser l\u2019installation des cookies : Sous Internet Explorer : onglet outil (pictogramme en forme de rouage en haut a droite) / options internet. Cliquez sur Confidentialit\xE9 et choisissez Bloquer tous les cookies. Validez sur Ok. Sous Firefox : en haut de la fen\xEAtre du navigateur, cliquez sur le bouton Firefox, puis aller dans l&#39;onglet Options. Cliquer sur l&#39;onglet Vie priv\xE9e. Param\xE9trez les R\xE8gles de conservation sur : utiliser les param\xE8tres personnalis\xE9s pour l&#39;historique. Enfin d\xE9cochez-la pour d\xE9sactiver les cookies. Sous Safari : Cliquez en haut \xE0 droite du navigateur sur le pictogramme de menu (symbolis\xE9 par un rouage). S\xE9lectionnez Param\xE8tres. Cliquez sur Afficher les param\xE8tres avanc\xE9s. Dans la section &quot;Confidentialit\xE9&quot;, cliquez sur Param\xE8tres de contenu. Dans la section &quot;Cookies&quot;, vous pouvez bloquer les cookies. Sous Chrome : Cliquez en haut \xE0 droite du navigateur sur le pictogramme de menu (symbolis\xE9 par trois lignes horizontales). S\xE9lectionnez Param\xE8tres. Cliquez sur Afficher les param\xE8tres avanc\xE9s. Dans la section &quot;Confidentialit\xE9&quot;, cliquez sur pr\xE9f\xE9rences. Dans l&#39;onglet &quot;Confidentialit\xE9&quot;, vous pouvez bloquer les cookies.</p>
        <h2 class="${"svelte-12xs12b"}">Droit applicable et attribution de juridiction.</h2>
        <p class="${"svelte-12xs12b"}">Tout litige en relation avec l\u2019utilisation du site <a href="${"https://sdelon.com/"}" class="${"svelte-12xs12b"}">sdelon.com</a> est soumis au droit fran\xE7ais. Il est fait attribution exclusive de juridiction aux tribunaux comp\xE9tents de Quimper.</p>
        <h2 class="${"svelte-12xs12b"}">Les principales lois concern\xE9es.</h2>
        <p class="${"svelte-12xs12b"}">Loi n\xB0 78-17 du 6 janvier 1978, notamment modifi\xE9e par la loi n\xB0 2004-801 du 6 ao\xFBt 2004 relative \xE0 l&#39;informatique, aux fichiers et aux libert\xE9s. Loi n\xB0 2004-575 du 21 juin 2004 pour la confiance dans l&#39;\xE9conomie num\xE9rique.</p></div></section>
${validate_component(CTA, "CTA").$$render($$result, { slice }, {}, {})}`;
});
var mentionsLegales = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Mentions_legales,
  load: load$1
});
async function load({ fetch: fetch2 }) {
  const { photographies: photographies2 } = await fetch2("/api/photographies").then((res) => res.json());
  return {
    props: { photographies: photographies2[0] }
  };
}
var Photographies = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { photographies: photographies2 } = $$props;
  if ($$props.photographies === void 0 && $$bindings.photographies && photographies2 !== void 0)
    $$bindings.photographies(photographies2);
  return `${validate_component(SEOHead, "SEOHead").$$render($$result, {
    title: "Photographies | St\xE9phanie Delon",
    description: "D\xE9veloppeuse web et graphiste situ\xE9e dans le Cap Sizun en Finist\xE8re, je suis \xE9galement passionn\xE9e par la photographie | St\xE9phanie Delon",
    image: "",
    alt: ""
  }, {}, {})}

<section class="${"pt-20"}" aria-labelledby="${"photographies-du-cap-sizun"}"><div class="${"container px-4 mx-auto"}"><div class="${"mb-12 flex flex-wrap items-end justify-between"}"><div class="${"w-full md:w-auto mb-4 md:mb-0"}"><h2 class="${"mt-2 text-4xl lg:text-5xl font-bold font-heading text-gray-800"}">Le Cap Sizun en 
          <span class="${"relative"}">photos
          <div class="${"svg-shadow absolute -bottom-7 -right-8"}"><svg width="${"176"}" height="${"78"}" viewBox="${"0 0 176 78"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M4.16866 49.7734C49.6249 56.8271 214.397 64.3995 159.471 26.2365"}" stroke="${"#F9F871"}" stroke-width="${"6"}" stroke-linecap="${"round"}"></path></svg></div></span></h2>
        <p class="${"text-gray-600 max-w-md pt-4"}">La photographie est une de mes passions depuis de nombreuses ann\xE9es et comment ne pas \xEAtre inspir\xE9e par la beaut\xE9 \xE9poustouflante et sauvage du Cap Sizun !</p></div></div>
    ${each(photographies2.data.body, (slice) => `<div class="${"flex flex-wrap -mx-4"}">${slice.slice_type === "gallerie" ? `<section class="${"container py-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"}"><div class="${"rounded-lg lg:col-span-3 row-span-2"}">${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[0].image.url,
    alt: slice.items[0].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[1].image.url,
    alt: slice.items[1].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[2].image.url,
    alt: slice.items[2].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[3].image.url,
    alt: slice.items[3].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[4].image.url,
    alt: slice.items[4].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[5].image.url,
    alt: slice.items[5].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[6].image.url,
    alt: slice.items[6].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[7].image.url,
    alt: slice.items[7].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[8].image.url,
    alt: slice.items[8].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[9].image.url,
    alt: slice.items[9].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div class="${"md:row-span-2"}">${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[10].image.url,
    alt: slice.items[10].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div class="${"md:col-span-2"}">${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[11].image.url,
    alt: slice.items[11].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div class="${"md:col-span-2"}">${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[12].image.url,
    alt: slice.items[12].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div>${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[13].image.url,
    alt: slice.items[13].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
        <div class="${"md:col-span-3 lg:col-span-2"}">${validate_component(Img, "Img").$$render($$result, {
    src: slice.items[14].image.url,
    alt: slice.items[14].image.alt,
    styles: "w-full h-full object-cover rounded-lg"
  }, {}, {})}</div>
      </section>` : ``}</div>
    ${slice.slice_type === "cta" ? `${validate_component(CTA, "CTA").$$render($$result, { slice }, {}, {})}` : ``}`)}</div></section>`;
});
var photographies = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Photographies,
  load
});
var css$1 = {
  code: `.bg-header.svelte-vw0wye{background-color:#ecefef;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cpath fill='%23f7f7f8' d='M600 325.1v-1.17c-6.5 3.83-13.06 7.64-14.68 8.64-10.6 6.56-18.57 12.56-24.68 19.09-5.58 5.95-12.44 10.06-22.42 14.15-1.45.6-2.96 1.2-4.83 1.9l-4.75 1.82c-9.78 3.75-14.8 6.27-18.98 10.1-4.23 3.88-9.65 6.6-16.77 8.84-1.95.6-3.99 1.17-6.47 1.8l-6.14 1.53c-5.29 1.35-8.3 2.37-10.54 3.78-3.08 1.92-6.63 3.26-12.74 5.03a384.1 384.1 0 0 1-4.82 1.36c-2.04.58-3.6 1.04-5.17 1.52a110.03 110.03 0 0 0-11.2 4.05c-2.7 1.15-5.5 3.93-8.78 8.4a157.68 157.68 0 0 0-6.15 9.2c-5.75 9.07-7.58 11.74-10.24 14.51a50.97 50.97 0 0 1-4.6 4.22c-2.33 1.9-10.39 7.54-11.81 8.74a14.68 14.68 0 0 0-3.67 4.15c-1.24 2.3-1.9 4.57-2.78 8.87-2.17 10.61-3.52 14.81-8.2 22.1-4.07 6.33-6.8 9.88-9.83 12.99-.47.48-.95.96-1.5 1.48l-3.75 3.56c-1.67 1.6-3.18 3.12-4.86 4.9a42.44 42.44 0 0 0-9.89 16.94c-2.5 8.13-2.72 15.47-1.76 27.22.47 5.82.51 6.36.51 8.18 0 10.51.12 17.53.63 25.78.24 4.05.56 7.8.97 11.22h.9c-1.13-9.58-1.5-21.83-1.5-37 0-1.86-.04-2.4-.52-8.26-.94-11.63-.72-18.87 1.73-26.85a41.44 41.44 0 0 1 9.65-16.55c1.67-1.76 3.18-3.27 4.83-4.85.63-.6 3.13-2.96 3.75-3.57a71.6 71.6 0 0 0 1.52-1.5c3.09-3.16 5.86-6.76 9.96-13.15 4.77-7.42 6.15-11.71 8.34-22.44.86-4.21 1.5-6.4 2.68-8.6.68-1.25 1.79-2.48 3.43-3.86 1.38-1.15 9.43-6.8 11.8-8.72 1.71-1.4 3.26-2.81 4.7-4.3 2.72-2.85 4.56-5.54 10.36-14.67a156.9 156.9 0 0 1 6.1-9.15c3.2-4.33 5.9-7.01 8.37-8.07 3.5-1.5 7.06-2.77 11.1-4.02a233.84 233.84 0 0 1 7.6-2.2l2.38-.67c6.19-1.79 9.81-3.16 12.98-5.15 2.14-1.33 5.08-2.33 10.27-3.65l6.14-1.53c2.5-.63 4.55-1.2 6.52-1.82 7.24-2.27 12.79-5.06 17.15-9.05 4.05-3.72 9-6.2 18.66-9.9l4.75-1.82c1.87-.72 3.39-1.31 4.85-1.91 10.1-4.15 17.07-8.32 22.76-14.4 6.05-6.45 13.95-12.4 24.49-18.92 1.56-.96 7.82-4.6 14.15-8.33v-64.58c-4 8.15-8.52 14.85-12.7 17.9-2.51 1.82-5.38 4.02-9.04 6.92a1063.87 1063.87 0 0 0-6.23 4.98l-1.27 1.02a2309.25 2309.25 0 0 1-4.87 3.9c-7.55 6-12.9 10.05-17.61 13.19-3.1 2.06-3.86 2.78-8.06 7.13-5.84 6.07-11.72 8.62-29.15 10.95-11.3 1.5-20.04 4.91-30.75 11.07-1.65.94-7.27 4.27-6.97 4.1-2.7 1.58-4.69 2.69-6.64 3.66-5.63 2.8-10.47 4.17-15.71 4.17-17.13 0-41.44 11.51-51.63 22.83-12.05 13.4-31.42 27.7-45.25 31.16-7.4 1.85-11.85 7.05-14.04 14.69-1.26 4.4-1.58 8.28-1.58 13.82 0 .82.01.98.24 3.63.45 5.18.35 8.72-.77 13.26-1.53 6.2-4.89 12.6-10.59 19.43-13.87 16.65-22.88 46.58-22.88 71.68 0 2.39.02 4.26.06 8.75.12 10.8.1 15.8-.22 21.95-.56 11.18-2.09 20.73-5 29.3h-1.05c2.94-8.56 4.49-18.12 5.05-29.35.31-6.13.34-11.1.22-21.9-.04-4.48-.06-6.36-.06-8.75 0-25.32 9.07-55.47 23.12-72.32 5.6-6.72 8.88-12.99 10.38-19.03 1.09-4.4 1.18-7.85.74-12.93-.23-2.7-.24-2.86-.24-3.72 0-5.62.32-9.57 1.62-14.1 2.28-7.95 6.97-13.44 14.76-15.39 13.6-3.4 32.82-17.59 44.75-30.84C409 360.14 433.58 348.5 451 348.5c5.07 0 9.77-1.33 15.26-4.07 1.93-.96 3.9-2.05 6.58-3.62-.3.18 5.33-3.16 6.98-4.11 10.82-6.21 19.66-9.67 31.11-11.2 17.23-2.3 22.9-4.75 28.57-10.64 4.25-4.41 5.04-5.16 8.22-7.28 4.68-3.11 10.01-7.14 17.55-13.14a1113.33 1113.33 0 0 0 4.86-3.89l1.28-1.02a4668.54 4668.54 0 0 1 6.23-4.98c3.67-2.9 6.55-5.12 9.07-6.95 4.37-3.19 9.16-10.56 13.29-19.4v66.9zm0-116.23c-.62.01-1.27.06-1.95.13-6.13.63-13.83 3.45-21.83 7.45-3.64 1.82-8.46 2.67-14.17 2.71-4.7.04-9.72-.47-14.73-1.33-1.7-.3-3.26-.61-4.67-.93a31.55 31.55 0 0 0-3.55-.57 273.4 273.4 0 0 0-16.66-.88c-10.42-.16-17.2.74-17.97 2.73-.38.97.6 2.55 3.03 4.87 1.01.97 2.22 2.03 4.04 3.55a1746.07 1746.07 0 0 0 4.79 4.02c1.39 1.2 3.1 1.92 5.5 2.5.7.16.86.2 2.64.54 3.53.7 5.03 1.25 6.15 2.63 1.41 1.76 1.4 4.54-.15 8.88-2.44 6.83-5.72 10.05-10.19 10.33-3.63.23-7.6-1.29-14.52-5.06-4.53-2.47-6.82-7.3-8.32-15.26-.17-.87-.32-1.78-.5-2.86l-.43-2.76c-1.05-6.58-1.9-9.2-3.73-10.11-.81-.4-1.59-.74-2.36-1-2.27-.77-4.6-1.02-8.1-.92-2.29.07-14.7 1-13.77.93-20.55 1.37-28.8 5.05-37.09 14.99a133.07 133.07 0 0 0-4.25 5.44l-2.3 3.09-2.51 3.32c-4.1 5.36-7.06 8.48-10.39 11.12-.65.52-1.33 1.04-2.13 1.62l-4.11 2.94a106.8 106.8 0 0 0-5.16 3.99c-4.55 3.74-9.74 8.6-16.25 15.38-8.25 8.58-11.78 13.54-11.7 15.95.07 1.65 1.64 2.11 6.79 2.38 1.61.09 2.15.12 2.98.2 2.95.24 5.09.73 6.81 1.68 7.48 4.15 11.63 7.26 13.95 11.58 3.3 6.15.8 12.88-8.89 20.26-8.28 6.3-11.1 10.37-11.31 14.96-.06 1.17 0 1.93.26 4.43.69 6.47.25 10.65-2.8 17.42a44.23 44.23 0 0 1-4.16 7.53c-2.82 3.97-5.47 5.74-10.6 7.69-.43.16-3.34 1.23-4.27 1.59-1.8.68-3.38 1.36-5.01 2.14-4.18 2-8.4 4.6-13.1 8.24-8.44 6.51-13.23 14.56-15.98 25.06-1.1 4.2-1.55 6.81-2.8 15.21-1.26 8.6-2.17 12.64-4.08 16.55-2.1 4.28-11.93 26.59-12.97 28.88a382.7 382.7 0 0 1-6.37 13.41c-4.07 8.11-7.61 14.07-10.73 17.81-5.38 6.46-8.98 14.37-13.77 28.42a810.14 810.14 0 0 0-1.89 5.6c-1.8 5.35-2.96 8.6-4.26 11.85-6.13 15.32-25.43 26.31-46.46 26.31-11.2 0-20.58-2.74-31.02-8.55-5.6-3.13-4.55-2.42-22.26-14.54-14.33-9.8-17.7-10.73-20.47-6.9-.37.5-1.81 2.74-1.83 2.77a52.24 52.24 0 0 1-4.94 5.9c-.73.79-5.52 5.87-6.97 7.45-2.38 2.6-4.3 4.81-5.98 6.93a45.6 45.6 0 0 0-5.08 7.66c-1.29 2.57-1.9 5.25-2.66 10.6a997.6 997.6 0 0 1-.46 3.18h-1l.47-3.32c.77-5.45 1.4-8.2 2.75-10.9a46.54 46.54 0 0 1 5.2-7.84c1.7-2.14 3.63-4.38 6.03-6.98 1.45-1.59 6.24-6.68 6.96-7.46a51.58 51.58 0 0 0 4.84-5.78s1.47-2.26 1.86-2.8c3.25-4.5 7.08-3.44 21.84 6.67 17.67 12.08 16.62 11.38 22.19 14.48 10.3 5.73 19.5 8.43 30.53 8.43 20.65 0 39.57-10.77 45.54-25.69a219.7 219.7 0 0 0 4.24-11.8 6752.32 6752.32 0 0 0 1.88-5.6c4.83-14.16 8.47-22.14 13.96-28.73 3.05-3.66 6.56-9.57 10.6-17.61 1.97-3.93 4.04-8.31 6.35-13.38 1.03-2.28 10.88-24.61 12.98-28.91 1.85-3.79 2.75-7.76 4-16.25 1.24-8.44 1.7-11.07 2.81-15.32 2.8-10.7 7.71-18.94 16.33-25.6a73.18 73.18 0 0 1 13.29-8.35c1.66-.8 3.27-1.48 5.08-2.18.94-.36 3.86-1.43 4.28-1.59 4.95-1.88 7.44-3.55 10.14-7.33 1.35-1.9 2.68-4.3 4.06-7.37 2.97-6.58 3.39-10.59 2.72-16.9a27.13 27.13 0 0 1-.27-4.58c.22-4.94 3.21-9.24 11.7-15.7 9.33-7.11 11.66-13.34 8.62-19-2.2-4.09-6.25-7.12-13.55-11.17-1.57-.88-3.6-1.33-6.42-1.57-.8-.07-1.34-.1-2.95-.19-5.77-.3-7.63-.85-7.72-3.34-.1-2.81 3.5-7.87 11.97-16.69 6.53-6.8 11.75-11.69 16.33-15.45 1.79-1.47 3.42-2.72 5.2-4.03l4.12-2.94c.79-.58 1.46-1.08 2.1-1.59 3.26-2.6 6.16-5.65 10.21-10.94a383.2 383.2 0 0 0 2.5-3.32l2.31-3.09c1.8-2.39 3.04-4 4.29-5.48 8.47-10.17 16.98-13.96 37.27-15.3-.44.02 12-.9 14.32-.98 3.62-.1 6.05.16 8.46.98.8.27 1.62.62 2.47 1.04 2.27 1.14 3.17 3.87 4.27 10.85l.44 2.76c.17 1.07.33 1.97.5 2.83 1.44 7.69 3.62 12.29 7.8 14.57 6.76 3.68 10.6 5.15 13.99 4.94 4-.25 6.99-3.17 9.3-9.67 1.45-4.04 1.46-6.49.32-7.92-.9-1.12-2.28-1.62-5.57-2.27a55.8 55.8 0 0 1-2.67-.55c-2.54-.6-4.39-1.4-5.93-2.71a252.63 252.63 0 0 0-4.78-4.01 84.35 84.35 0 0 1-4.08-3.6c-2.73-2.6-3.86-4.43-3.28-5.95 1.02-2.64 7.82-3.54 18.93-3.37a230.56 230.56 0 0 1 16.73.88c2.76.39 3.2.49 3.68.6 1.4.3 2.95.62 4.62.91a82.9 82.9 0 0 0 14.56 1.32c5.56-.04 10.24-.86 13.73-2.6 8.1-4.05 15.89-6.9 22.17-7.56.7-.07 1.4-.11 2.05-.13v1zm0-100.94v1.5c-8.62 16.05-17.27 29.55-23.65 35.92-3.19 3.2-7.62 4.9-13.54 5.56-4.45.48-8.28.4-19.18-.2-9.91-.55-15.32-.44-20.52.78a84.05 84.05 0 0 1-15 2.11l-2.25.14c-12.49.75-19.37 1.78-32.72 5.74-4.5 1.33-9.27 2.49-14.3 3.48a246.27 246.27 0 0 1-32.6 3.97c-7.56.45-13.21.57-20.24.57-5.4 0-11.9 1.61-18 5.18-8.3 4.87-15.06 12.87-19.53 24.5a68.57 68.57 0 0 1-4.56 9.8c-3.6 6.2-6.92 8.99-13.38 12.18l-4.03 1.96a64.48 64.48 0 0 0-15.16 10.25c-8.2 7.33-13.72 16.63-22.54 35.6l-2.08 4.49c-7.3 15.7-11.5 23.3-17.35 29.87-7.7 8.66-20.25 14.42-40.31 20.08-4.37 1.23-19.04 5.08-19.24 5.13-6.92 1.87-11.68 3.34-15.63 4.92-10.55 4.22-18.71 10.52-36.38 26.52l-1.7 1.54c-8.58 7.76-13.41 11.9-18.81 15.88-3.95 2.9-8 5.67-12.97 8.91-2.06 1.34-10.3 6.6-12.33 7.94-11.52 7.5-18.53 13.04-24.62 20.08a62.01 62.01 0 0 0-6.44 8.85c-4.13 6.91-6.27 13.15-9.2 25.11l-1.54 6.26c-.6 2.45-1.15 4.54-1.72 6.58-2.97 10.7-6.9 17.36-14.78 26.91L69.6 491a148.51 148.51 0 0 0-4.19 5.3 23.9 23.9 0 0 0-3.44 6.28c-1.16 3.23-1.52 5.9-1.87 11.94-.58 10.05-1.42 15.04-4.63 22.67-1.57 3.72-5.66 14.02-6.41 15.8a73.46 73.46 0 0 1-3.57 7.4c-2.88 5.14-6.71 10.12-13.12 16.95-5.96 6.36-8.87 10.9-10.61 16a56.88 56.88 0 0 0-1.38 4.82l-.46 1.84h-1.03l.52-2.08c.52-2.09.92-3.49 1.4-4.9 1.8-5.25 4.78-9.9 10.84-16.36 6.35-6.78 10.13-11.7 12.97-16.77a72.5 72.5 0 0 0 3.52-7.29c.75-1.76 4.84-12.06 6.4-15.8 3.17-7.5 3.99-12.4 4.56-22.33.35-6.14.72-8.88 1.93-12.23a24.9 24.9 0 0 1 3.58-6.54c1.27-1.7 2.6-3.37 4.22-5.34l4.11-4.95c7.8-9.46 11.66-16 14.59-26.54.56-2.04 1.1-4.12 1.71-6.56l1.53-6.26c2.96-12.04 5.13-18.36 9.32-25.39 1.84-3.08 4-6.05 6.54-8.99 6.17-7.12 13.24-12.7 24.83-20.26 2.05-1.33 10.28-6.6 12.33-7.94 4.96-3.22 9-5.98 12.92-8.87 5.37-3.95 10.19-8.08 18.74-15.82l1.7-1.54c17.76-16.09 25.98-22.43 36.67-26.7 4-1.6 8.8-3.09 15.75-4.96.21-.06 14.87-3.9 19.22-5.13 19.9-5.61 32.32-11.31 39.85-19.78 5.76-6.48 9.93-14.02 17.18-29.64l2.09-4.5c8.87-19.07 14.44-28.46 22.77-35.9a65.48 65.48 0 0 1 15.38-10.4l4.04-1.97c6.3-3.1 9.47-5.77 12.96-11.77a67.6 67.6 0 0 0 4.48-9.67c4.56-11.84 11.47-20.02 19.97-25 6.25-3.66 12.93-5.32 18.5-5.32 7.01 0 12.65-.12 20.17-.57a245.3 245.3 0 0 0 32.47-3.96c5-.98 9.75-2.13 14.22-3.45 13.43-3.98 20.38-5.02 32.94-5.78l2.24-.14c5.76-.37 9.8-.9 14.85-2.09 5.31-1.25 10.79-1.35 22.6-.7 9.04.5 12.84.58 17.21.1 5.71-.62 9.94-2.26 12.95-5.26 6.44-6.45 15.3-20.37 24.35-36.72zm0 450.21c-1.28-4.6-2.2-10.55-3.33-20.25l-.24-2.04-.23-2.03c-1.82-15.7-3.07-21.98-5.55-24.47-2.46-2.46-3.04-5.03-2.52-8.64.1-.6.18-1.1.39-2.15.69-3.54.77-5.04.08-6.84-.91-2.38-3.31-4.41-7.79-6.26-5.08-2.09-6.52-4.84-4.89-8.44.66-1.45 1.79-3.02 3.52-5.01 1.04-1.2 5.48-5.96 5.08-5.53 6.15-6.7 8.98-11.34 8.98-16.48a15.2 15.2 0 0 1 6.5-12.89v1.26a14.17 14.17 0 0 0-5.5 11.63c0 5.47-2.93 10.29-9.24 17.16.38-.42-4.04 4.33-5.07 5.5-1.67 1.93-2.75 3.43-3.36 4.77-1.37 3.04-.23 5.22 4.36 7.1 4.71 1.95 7.32 4.16 8.34 6.83.78 2.04.7 3.67-.03 7.4-.2 1.03-.3 1.51-.38 2.09-.48 3.33.03 5.59 2.23 7.8 2.74 2.74 3.98 8.96 5.84 25.06l.24 2.03.23 2.04c.82 7.01 1.53 12.06 2.34 16.03v4.33zm0-62.16c-1.4-3.13-4.43-9.9-4.95-11.17-1.02-2.53-1.25-3.8-.91-5.18.2-.84 2.05-4.68 2.32-5.33a70.79 70.79 0 0 0 3.54-11.2v3.99a62.82 62.82 0 0 1-2.62 7.6c-.31.75-2.09 4.46-2.27 5.18-.28 1.12-.08 2.22.87 4.57.41 1.02 2.5 5.7 4.02 9.09v2.45zm0-85.09c-1.65 1.66-3.66 2.9-6.4 4.13-.25.1-13.97 5.47-20.4 8.43-9.35 4.32-16.7 5.9-23.03 5.25-5.08-.53-9.02-2.25-14.77-5.92l-3.2-2.07a77.4 77.4 0 0 0-5.44-3.27c-4.05-2.18-3.25-5.8 1.47-10.47 3.71-3.68 9.6-7.93 18.73-13.8l4.46-2.82c17.95-11.33 18.22-11.5 22.27-14.74 11.25-9 19.69-14.02 26.31-15.1v1.02c-6.37 1.1-14.62 6-25.69 14.86-4.1 3.28-4.34 3.44-22.36 14.8a652.4 652.4 0 0 0-4.45 2.83c-9.07 5.83-14.92 10.05-18.57 13.66-4.31 4.28-4.95 7.13-1.7 8.88 1.7.91 3.29 1.88 5.5 3.3l3.2 2.08c5.64 3.59 9.45 5.25 14.34 5.76 6.13.64 13.32-.9 22.52-5.15 6.46-2.98 20.18-8.35 20.4-8.44 3.04-1.37 5.1-2.71 6.81-4.69v1.47zm0-41.37v1c-6.56.26-12.11 3.13-19.71 9.08l-4.63 3.68a51.87 51.87 0 0 1-4.4 3.14c-.82.52-5.51 3.33-6.22 3.76-3.31 2-6.15 3.8-8.87 5.6a112.61 112.61 0 0 0-8.16 5.92c-4.61 3.72-7.4 6.9-7.97 9.35-.63 2.67 1.48 4.53 7.05 5.46 10.7 1.78 20.92-.05 30.45-4.65a61.96 61.96 0 0 0 17.1-12.2 41.8 41.8 0 0 0 5.36-7.42v1.92a38.94 38.94 0 0 1-4.64 6.19 62.95 62.95 0 0 1-17.39 12.41c-9.7 4.68-20.13 6.55-31.05 4.73-6.06-1-8.65-3.29-7.85-6.67.64-2.74 3.53-6.05 8.31-9.9 2.35-1.9 5.1-3.88 8.24-5.97 2.73-1.82 5.58-3.61 8.9-5.62.72-.44 5.4-3.24 6.22-3.75 1.26-.8 2.6-1.76 4.3-3.09.8-.62 3.9-3.1 4.63-3.67 7.77-6.1 13.49-9.04 20.33-9.3zm0-154.6v1c-1.75-.24-4.3.23-7.82 1.55-10.01 3.75-13.8 5.07-19.15 6.76-1.78.56-2.63.83-3.87 1.24-1.48.5-3.16.76-6.74 1.16a1550.34 1550.34 0 0 0-2.64.3c-7.8.94-11.28 2.47-11.28 6.07 0 4.45 2.89 13.18 7.96 25.81a57.34 57.34 0 0 1 2.33 7.6 258.32 258.32 0 0 1 .84 3.46c1.86 7.62 3.17 10.71 5.56 11.67 2.21.88 4.7.6 7.47-.72 3.48-1.69 7.22-4.94 11.2-9.47 1.52-1.7 2.97-3.49 4.59-5.57l3.16-4.1c2.59-3.23 6.07-12.21 8.39-20.23v3.45c-2.29 7.2-5.27 14.5-7.61 17.41-.44.55-2.67 3.46-3.15 4.09-1.63 2.1-3.1 3.9-4.62 5.62-4.08 4.61-7.9 7.94-11.53 9.7-2.99 1.44-5.77 1.75-8.28.74-2.84-1.13-4.2-4.34-6.15-12.35a2097.48 2097.48 0 0 1-.84-3.46c-.8-3.2-1.47-5.45-2.28-7.46-5.14-12.8-8.04-21.55-8.04-26.19 0-4.37 3.84-6.06 12.16-7.07a160.9 160.9 0 0 1 2.65-.3c3.5-.39 5.15-.64 6.53-1.1 1.26-.42 2.1-.7 3.88-1.26 5.34-1.68 9.11-3 19.1-6.74 3.53-1.32 6.22-1.84 8.18-1.61zM0 292c10.13-11.31 18.13-23.2 23.07-35.39 3.3-8.14 6.09-16.12 10.81-30.55l1.59-4.84c6.53-19.94 10.11-29.82 14.77-39.56 6.07-12.72 12.55-21.18 20.27-25.54 6.66-3.76 10.2-7.86 12.22-13.15a46.6 46.6 0 0 0 1.86-6.58c1.23-5.2 2.05-7.59 3.93-10.36 2.45-3.62 6.27-6.53 12.1-8.96 15.78-6.58 16.73-7.04 18.05-9.01.65-.98.83-2.15.74-4.51-.03-.73-.23-3.82-.24-4A93.8 93.8 0 0 1 119 94c0-10.04.18-11.37 2.37-13.15.52-.42 1.13-.8 2.07-1.3.27-.14 2.18-1.12 2.84-1.48a68.4 68.4 0 0 0 9.12-5.87c2.06-1.54 2.64-2.14 8.01-7.93 3.78-4.09 6.21-6.36 8.96-8.12 3.64-2.33 7.2-3.12 10.9-2.11 4.4 1.2 10.81 2 18.78 2.46 6.9.4 12.9.5 21.95.5 4.87 0 8.97.47 15.4 1.57 7.77 1.33 9.3 1.54 12.38 1.54 4.05 0 7.43-.88 10.68-2.95 5.06-3.22 8.11-4.67 11.2-5.2 3.62-.64 4.77-.46 16.55 2.06 17.26 3.7 30.85 1.36 41.06-9.7 5.1-5.53 5.48-8.9 3.48-14.8-.83-2.42-1.03-3.1-1.17-4.3-.29-2.52.5-4.71 2.71-6.93 2.65-2.65 4.72-9.17 6.22-18.29h2.03c-1.56 9.71-3.77 16.65-6.83 19.7-1.79 1.8-2.36 3.39-2.14 5.28.11 1 .3 1.63 1.07 3.9 2.22 6.53 1.76 10.66-3.9 16.8-10.77 11.66-25.07 14.13-42.95 10.3-11.42-2.45-12.55-2.62-15.78-2.06-2.77.48-5.62 1.84-10.47 4.92a20.93 20.93 0 0 1-11.76 3.27c-3.25 0-4.81-.22-12.73-1.57C212.74 59.46 208.73 59 204 59c-9.1 0-15.11-.1-22.07-.5-8.09-.47-14.62-1.29-19.2-2.54-5.62-1.53-10.17 1.38-17.85 9.66-5.5 5.94-6.08 6.53-8.28 8.18a70.38 70.38 0 0 1-9.38 6.03c-.68.37-2.58 1.35-2.84 1.49-.84.44-1.35.76-1.75 1.08-1.47 1.2-1.63 2.4-1.63 11.6 0 1.85.06 3.54.17 5.44 0 .17.2 3.28.24 4.03.1 2.75-.13 4.29-1.08 5.71-1.67 2.5-2.27 2.8-18.95 9.74-5.48 2.29-8.99 4.96-11.2 8.24-1.71 2.51-2.47 4.73-3.64 9.7-.83 3.5-1.21 4.92-1.94 6.83-2.18 5.73-6.05 10.19-13.1 14.18-7.3 4.12-13.55 12.28-19.46 24.66-4.6 9.64-8.17 19.46-14.67 39.32l-1.58 4.84c-4.75 14.47-7.54 22.48-10.86 30.69-5.28 13.01-13.95 25.65-24.93 37.6v-2.97zm0 78v-.5l1-.01c6.32 0 7.47 5.2 4.6 13.36a60.36 60.36 0 0 1-5.6 11.3v-1.92a57.76 57.76 0 0 0 4.65-9.72c2.69-7.6 1.71-12.02-3.65-12.02-.34 0-.67 0-1 .02v-46.59a340.96 340.96 0 0 0 13.71-8.34c13.66-9.46 29.79-37.6 29.79-53.59 0-18.1 21.57-72.64 32.23-79.42 12.71-8.09 32.24-27.96 35.8-37.75 1.93-5.3 5.5-7.27 14.42-9.37 6.15-1.44 8.64-2.42 10.67-4.79 1.5-1.74 2.72-4.79 4.33-10.3.23-.78 1.9-6.68 2.43-8.46 3.62-12.08 7.3-18.49 13.47-20.39 2.5-.76 3.03-.98 9.74-3.7 7.49-3.03 11.97-4.43 17.12-4.92 6.75-.65 13.13.75 19.55 4.67 5.43 3.32 12.19 4.72 20.17 4.56 6.03-.12 12.2-1.07 19.83-2.8 1.82-.4 7.38-1.74 8.26-1.94 2.69-.6 4.34-.89 5.48-.89 4.97 0 8.93-.05 14.2-.27 7.9-.32 15.56-.92 22.75-1.88 8.5-1.14 15.9-2.73 21.88-4.82 18.9-6.62 32.64-18.3 33.67-27.59.29-2.56.4-2.96 2.79-11.11 2.33-7.95 3.21-12.93 2.72-18.23-.2-2.24-.69-4.38-1.48-6.42-1.5-3.92-2.63-9.4-3.43-16.18h.9c.77 6.47 1.89 11.72 3.47 15.82a24.93 24.93 0 0 1 1.54 6.69c.5 5.46-.4 10.54-2.77 18.6-2.36 8.06-2.47 8.47-2.74 10.95-1.09 9.75-15.1 21.68-34.33 28.41-6.06 2.12-13.52 3.72-22.09 4.87-7.22.96-14.92 1.57-22.83 1.89-5.3.21-9.27.27-14.25.27-1.04 0-2.64.27-5.26.87-.87.2-6.43 1.53-8.26 1.94-7.68 1.73-13.92 2.7-20.03 2.82-8.15.17-15.1-1.27-20.71-4.7-6.23-3.81-12.4-5.16-18.93-4.54-5.04.48-9.44 1.86-16.84 4.86-6.75 2.74-7.29 2.95-9.82 3.73-5.73 1.76-9.28 7.96-12.81 19.72-.53 1.77-2.2 7.66-2.43 8.46-1.66 5.65-2.91 8.78-4.53 10.67-2.22 2.58-4.84 3.62-12.01 5.3-7.8 1.83-11.13 3.66-12.9 8.54-3.65 10.04-23.32 30.06-36.2 38.25C65.94 190 44.5 244.2 44.5 262c0 16.34-16.3 44.78-30.22 54.41-2.14 1.48-8.24 5.12-14.28 8.68v-1.16 46.09zm0-173.7v-1.11c7.42-3.82 14.55-10.23 21.84-18.98 3.8-4.56 14.21-18.78 15.79-20.55 1.8-2.04 4.06-3.96 7.42-6.45 1.08-.8 4.92-3.57 5.49-3.99 9.36-6.85 14-11.96 15.98-19.36.8-2.98 1.54-6.78 2.46-12.3.23-1.44 2-12.46 2.56-15.79 2.87-16.77 5.73-26.79 10.07-32.1C92.46 52.43 101.5 38.13 101.5 33c0-2.54.34-3.35 6.05-15.71.68-1.49 1.25-2.74 1.77-3.93 2.5-5.75 3.9-10.04 4.14-13.36h1c-.23 3.48-1.66 7.87-4.23 13.76-.52 1.2-1.09 2.45-1.78 3.95-5.54 12.01-5.95 12.99-5.95 15.29 0 5.47-9.09 19.84-20.11 33.31-4.2 5.12-7.03 15.06-9.86 31.64-.57 3.33-2.33 14.33-2.57 15.78-.92 5.56-1.67 9.38-2.48 12.4-2.05 7.68-6.82 12.93-16.35 19.91l-5.49 3.98c-3.3 2.45-5.51 4.34-7.27 6.31-1.53 1.73-11.94 15.93-15.76 20.53-7.52 9.02-14.88 15.6-22.61 19.46zm0 361.83v-4.33c.48 2.36 1 4.35 1.6 6.15 2 6.03 4.6 8.26 8.19 6.59C28.76 557.69 43.5 542.4 43.5 527c0-16.2 6.37-31.99 17.1-46.3 1.88-2.5 3.66-4.4 5.53-6 .73-.62 1.45-1.18 2.3-1.8l2-1.43c3.68-2.68 5.32-5.28 7.08-12.59.75-3.07 1.38-5.02 4.2-13.26l.63-1.88c3.24-9.58 4.56-14.97 4.17-18.65-.48-4.43-3.8-5.23-11.3-1.64a81.12 81.12 0 0 1-9.15 3.7c-13.89 4.67-26.96 5.8-42.66 5.42l-1.95-.05-1.45-.02a39.8 39.8 0 0 0-15.05 2.96A21.81 21.81 0 0 0 0 438.37v-1.26a23.55 23.55 0 0 1 4.55-2.57 40.77 40.77 0 0 1 16.92-3.02l1.95.05c15.6.38 28.57-.75 42.32-5.37a80.12 80.12 0 0 0 9.04-3.65c8.04-3.84 12.16-2.85 12.72 2.43.42 3.89-.92 9.34-4.21 19.08l-.64 1.88c-2.8 8.2-3.43 10.15-4.16 13.18-1.82 7.52-3.59 10.34-7.47 13.16l-2 1.43c-.84.6-1.54 1.15-2.25 1.75a35.45 35.45 0 0 0-5.37 5.84c-10.61 14.15-16.9 29.74-16.9 45.7 0 15.88-15 31.45-34.29 40.45-4.3 2.01-7.39-.66-9.56-7.18-.23-.68-.44-1.39-.65-2.13zm0-62.16v-2.45l1.46 3.27c2.1 4.8 3.46 10.33 4.26 16.77.66 5.3.84 9.3 1.04 18.5.2 9.32.5 12.75 1.63 15.05 1.28 2.6 3.67 2.35 8.29-1.5 17.14-14.3 21.82-22.9 21.82-38.62 0-7.17 1.1-12.39 3.7-17.68 2.27-4.67 3.65-6.62 13.4-19.62a69.8 69.8 0 0 1 7.6-8.79 44.76 44.76 0 0 1 3.54-3.06c.38-.3.64-.52.89-.74a10.47 10.47 0 0 0 2.63-3.32 35.78 35.78 0 0 0 2.26-5.94l.37-1.2.36-1.15c.29-.91.48-1.55.66-2.16.45-1.53.74-2.68.91-3.66.38-2.2.12-3.49-.85-4.15-2.35-1.61-9.28-.24-23.8 4.94-9.54 3.4-16.12 4.17-27.85 4.26-7.71.06-10.43.4-13.25 2.12-3.48 2.12-5.84 6.4-7.58 14.26-.5 2.2-.99 4.19-1.49 5.98v-3.98l.51-2.22c1.8-8.1 4.28-12.6 8.04-14.9 3.04-1.85 5.86-2.2 13.77-2.26 11.61-.09 18.1-.84 27.51-4.2 14.93-5.32 21.95-6.71 24.7-4.83 1.38.94 1.71 2.6 1.28 5.15a33.69 33.69 0 0 1-.94 3.78l-.66 2.17-.36 1.15-.37 1.2a36.64 36.64 0 0 1-2.33 6.1c-.8 1.53-1.61 2.52-2.86 3.61l-.92.77-1.02.83c-.9.74-1.65 1.4-2.47 2.18a68.84 68.84 0 0 0-7.48 8.66c-9.7 12.93-11.07 14.87-13.31 19.46-2.52 5.15-3.59 10.22-3.59 17.24 0 16.04-4.82 24.91-22.18 39.38-5.04 4.2-8.18 4.55-9.83 1.18-1.22-2.5-1.52-5.94-1.73-15.47-.2-9.16-.38-13.15-1.03-18.4-.79-6.34-2.12-11.8-4.19-16.49L0 495.98zM379.27 0h1.04l1.5 5.26c3.28 11.56 4.89 19.33 5.26 27.8.49 11.01-1.52 21.26-6.63 31.17-7.8 15.13-20.47 26.5-36.22 34.1-12.38 5.96-26.12 9.17-36.22 9.17-6.84 0-17.24 1.38-37.27 4.62l-2.27.37c-24.5 3.99-31.65 5-37.46 5-3.49 0-4.08-.08-19.54-2.8-3.56-.64-6.32-1.1-9-1.5-20.23-2.96-31-1.2-31.96 7.86-.1.85-.18 1.72-.29 2.81l-.27 2.73c-1.1 10.9-2.02 15.73-4.31 19.96-2.9 5.34-7.77 7.95-15.63 7.95-10.2 0-12.92.6-15.5 3.17.52-.51-5.03 5.85-8.16 8.7-2.75 2.5-14.32 12.55-15.77 13.83a341.27 341.27 0 0 0-6.54 5.92c-6.97 6.49-11.81 11.76-14.6 16.15-5.92 9.3-10.48 18.04-11.69 24.08-1.66 8.3 3.67 9.54 19.02 1.21a626.23 626.23 0 0 1 44.54-21.9c3.5-1.56 14.04-6.2 15.68-6.95 5.05-2.25 8.3-3.8 10.78-5.15l1.95-1.07 2.18-1.18c1.76-.94 3.38-1.76 5-2.55 18.1-8.72 34.48-10.46 50.33-1.2 22.89 13.34 38.28 37.02 38.28 56.44 0 19.12-.73 25.13-5.18 33.2a45.32 45.32 0 0 1-4.94 7.12c-6.47 7.77-11.81 16.2-12.76 21.27-1.2 6.34 4.69 7.03 20.17-.05 13.31-6.08 22.4-14.95 28.5-26.32a80.51 80.51 0 0 0 6.1-15.13c.9-2.98 3.17-11.65 3.41-12.48a29.02 29.02 0 0 1 1.75-4.83c7.47-14.93 21.09-30.5 36.25-37.24 7.61-3.38 13-9.65 19.4-20.79.84-1.48 4.26-7.64 5.14-9.17 3.52-6.1 6.22-9.7 9.37-11.98 10.15-7.4 28.7-11.1 50.29-11.1 7.52 0 16.54-1.24 27.51-3.58a420.1 420.1 0 0 0 14.96-3.52c-1.3.33 15.54-3.98 19.42-4.89 14.15-3.33 41.07-5.01 64.11-5.01 17.36 0 27.82-9.23 38.53-38.67 6.62-18.21 6.62-26.37 2.69-34.35l-1.18-2.37A13.36 13.36 0 0 1 587.5 58c0-4.03 0-4.01 2.5-24.56.46-3.73.8-6.74 1.12-9.64.9-8.45 1.38-15.2 1.38-20.8 0-.94-.02-1.94-.04-3h1c.03 1.06.04 2.06.04 3 0 5.65-.48 12.43-1.39 20.9-.3 2.91-.66 5.93-1.11 9.66-2.5 20.45-2.5 20.47-2.5 24.44 0 1.97.45 3.57 1.45 5.68.24.51 1.16 2.35 1.17 2.36 4.06 8.24 4.06 16.68-2.65 35.13-10.84 29.8-21.63 39.33-39.47 39.33-22.96 0-49.83 1.68-63.89 4.99-3.86.9-20.69 5.2-19.4 4.88a421.05 421.05 0 0 1-14.99 3.53c-11.04 2.35-20.11 3.6-27.72 3.6-21.4 0-39.76 3.67-49.7 10.9-3 2.19-5.64 5.7-9.1 11.68-.87 1.52-4.29 7.68-5.14 9.17-6.49 11.3-12 17.71-19.86 21.2-14.9 6.63-28.38 22.03-35.75 36.77a28.17 28.17 0 0 0-1.69 4.67c-.23.8-2.5 9.49-3.4 12.5a81.48 81.48 0 0 1-6.19 15.3c-6.2 11.56-15.44 20.58-28.96 26.76-16.1 7.36-23 6.55-21.58-1.04 1-5.29 6.4-13.83 12.99-21.73a44.33 44.33 0 0 0 4.82-6.96c4.35-7.88 5.06-13.77 5.06-32.72 0-19.04-15.19-42.4-37.72-55.55-15.57-9.08-31.62-7.38-49.45 1.21a132.9 132.9 0 0 0-7.14 3.71l-1.95 1.07a158.83 158.83 0 0 1-10.85 5.19c-1.65.74-12.18 5.38-15.69 6.95a625.25 625.25 0 0 0-44.46 21.86c-15.95 8.66-22.37 7.16-20.48-2.29 1.24-6.2 5.83-15.02 11.82-24.42 2.85-4.48 7.74-9.8 14.77-16.34 1.98-1.85 4.12-3.79 6.56-5.94 1.46-1.29 13.02-11.33 15.75-13.82 3.09-2.8 8.6-9.14 8.14-8.67 2.82-2.82 5.75-3.46 16.2-3.46 7.5 0 12.04-2.43 14.75-7.42 2.2-4.07 3.11-8.84 4.2-19.59l.26-2.73.3-2.81c.56-5.42 4.47-8.5 11.23-9.6 5.44-.88 12.51-.51 21.86.86 2.7.4 5.47.86 9.04 1.49 15.33 2.7 15.96 2.8 19.36 2.8 5.73 0 12.9-1.03 37.3-5l2.27-.36c20.1-3.26 30.52-4.64 37.43-4.64 9.95 0 23.54-3.18 35.78-9.08 15.57-7.5 28.09-18.73 35.78-33.65 5.02-9.75 7-19.82 6.51-30.67-.37-8.37-1.96-16.08-5.23-27.57L379.27 0zm13.68 0h1.02c.78 3.9 1.92 8.7 3.51 14.88 3.63 14.05 3.06 27.03-.75 38.77a61 61 0 0 1-11.35 20.68 138.36 138.36 0 0 1-19.32 18.77c-11.32 9.02-23.36 15.49-35.95 18.39a258.63 258.63 0 0 1-22.57 4.07c-3.17.44-6.36.85-10.3 1.32l-9.39 1.12c-11.53 1.41-17.45 2.55-21.64 4.46-9.28 4.21-28.35 6.04-49.21 6.04-1.37 0-2.8-.12-4.3-.35-2.62-.41-5-1.03-9.14-2.29-7.34-2.21-9.63-2.75-12.63-2.56-3.9.23-6.63 2.29-8.47 6.89-1.86 4.66-2.42 7.53-3.34 14.98-1.1 8.98-2.87 12.12-9.97 14.3a40.12 40.12 0 0 0-6.8 2.66c-.63.33-1.16.64-1.76 1.02l-1.34.86c-1.9 1.14-3.86 1.49-9.25 1.49-3.2 0-8.83-.55-9.51-.39-1.22.28-.75-.14-7.14 6.24-1.5 1.5-3.49 3.18-6.32 5.37-1.52 1.18-7.16 5.43-7.94 6.03-4.96 3.78-8.33 6.6-11.06 9.38-4.88 4.98-6.85 9.15-5.56 12.7 1.34 3.67 4.07 4.42 8.9 2.82a55.72 55.72 0 0 0 7.77-3.48c1.5-.77 7.78-4.13 9.37-4.96a116.8 116.8 0 0 1 12.31-5.68 162.2 162.2 0 0 0 11.04-4.84c2.04-.97 10.74-5.16 13-6.22 4.41-2.1 8.1-3.78 11.65-5.29 17.14-7.3 29.32-9.9 37.67-6.65l5.43 2.1c2.3.88 4.17 1.62 6.02 2.38a150.9 150.9 0 0 1 13.07 6c18.34 9.63 30.35 22.13 34.79 39.87 6.96 27.85 3.6 45.53-8.08 62.4-3.97 5.75-3.52 9.2.06 8.97 4.14-.28 10.21-4.95 15.11-12.52 3.1-4.8 5.1-10.45 8.05-21.53l1.69-6.35c.66-2.47 1.24-4.52 1.83-6.5 4.93-16.56 11-27.28 21.56-34.76 7.15-5.06 23.73-15.5 25.48-16.75 6.74-4.81 10.53-9.44 14.34-18 7.74-17.44 21.09-24.34 44.47-24.34 9.36 0 17.91-1.13 29.53-3.49a624.86 624.86 0 0 0 6.2-1.28c2.4-.5 4.07-.84 5.66-1.13 4.03-.74 7.04-1.1 9.61-1.1 4.44 0 9.39-1 31.39-5.99l2.95-.66c16.34-3.67 25.64-5.35 31.66-5.35 1.54 0 2.4.01 6.4.1 7.8.15 12.27.13 17.33-.2 16.41-1.06 26.73-5.36 29.8-14.56a87.1 87.1 0 0 1 3.55-8.83c-.15.31 2.29-4.96 2.9-6.38 5.38-12.3 5.57-21.92-1.44-39.44a86.4 86.4 0 0 1-5.26-20.72c-1.61-11.98-1.38-23.14.1-40.35l.2-2.12h1l-.2 2.2c-1.48 17.15-1.7 28.24-.11 40.14a85.4 85.4 0 0 0 5.2 20.47c7.1 17.78 6.91 27.67 1.43 40.22-.62 1.43-3.06 6.72-2.91 6.4a86.17 86.17 0 0 0-3.52 8.73c-3.23 9.72-13.9 14.15-30.68 15.24-5.1.33-9.58.35-17.42.2-3.98-.09-4.84-.1-6.37-.1-5.91 0-15.18 1.67-31.44 5.32l-2.95.67c-22.16 5.02-27.05 6.01-31.61 6.01-2.5 0-5.45.36-9.43 1.09-1.58.29-3.25.62-5.64 1.11a4894.21 4894.21 0 0 0-6.2 1.29c-11.68 2.37-20.3 3.51-29.73 3.51-23.02 0-36 6.71-43.53 23.66-3.9 8.8-7.82 13.58-14.7 18.5-1.78 1.27-18.36 11.7-25.48 16.75-10.34 7.32-16.3 17.87-21.19 34.23-.58 1.96-1.15 4-1.82 6.47l-1.69 6.35c-2.98 11.18-5 16.9-8.17 21.81-5.05 7.81-11.37 12.68-15.89 12.98-4.7.31-5.3-4.23-.94-10.53 11.52-16.64 14.82-34.03 7.92-61.6-4.35-17.42-16.16-29.72-34.27-39.22-4-2.1-8.2-4-12.99-5.97-1.84-.75-3.7-1.49-6-2.38l-5.43-2.08c-8.03-3.12-20.02-.58-36.92 6.63-3.52 1.5-7.21 3.19-11.61 5.27l-13 6.22c-4.71 2.22-8.16 3.75-11.11 4.88a115.87 115.87 0 0 0-12.21 5.63c-1.58.83-7.86 4.18-9.37 4.96a56.55 56.55 0 0 1-7.9 3.54c-5.3 1.75-8.62.85-10.17-3.43-1.46-4.02.66-8.5 5.8-13.74 2.75-2.82 6.16-5.66 11.15-9.48.79-.6 6.43-4.85 7.94-6.02a66.96 66.96 0 0 0 6.23-5.28c6.74-6.74 6.1-6.16 7.61-6.51.87-.2 6.69.36 9.74.36 5.22 0 7.03-.32 8.74-1.35l1.31-.84c.62-.4 1.18-.72 1.84-1.07a41.07 41.07 0 0 1 6.96-2.72c6.64-2.04 8.22-4.84 9.28-13.47.93-7.53 1.5-10.47 3.4-15.24 1.99-4.95 5.04-7.26 9.34-7.51 3.17-.2 5.5.35 12.97 2.6a63.54 63.54 0 0 0 9.02 2.26c1.45.22 2.83.34 4.14.34 20.71 0 39.7-1.82 48.8-5.96 4.32-1.96 10.29-3.1 21.93-4.53l9.4-1.12c3.92-.48 7.11-.88 10.27-1.32 8.16-1.14 15.4-2.43 22.49-4.06 12.42-2.86 24.33-9.26 35.55-18.2a137.4 137.4 0 0 0 19.18-18.64 60.02 60.02 0 0 0 11.15-20.32c3.76-11.57 4.32-24.36.75-38.23A284.86 284.86 0 0 1 392.95 0zM506.7 0h1.26c-.5.66-.9 1.18-1.17 1.51-3.95 4.96-6.9 7.92-9.82 9.57A10.02 10.02 0 0 1 492 12.5c-2.38 0-4.24.67-6.71 2.21l-2.65 1.71c-4.38 2.8-8.01 4.08-13.64 4.08-5.6 0-9.99-1.26-16.08-4.05a202.63 202.63 0 0 1-2.3-1.06l-2.18-.98c-1.6-.7-2.92-1.17-4.17-1.48a13.42 13.42 0 0 0-3.27-.43c-2.3 0-4.3-.68-11-3.37l-1.56-.62c-5-1.97-8.1-2.82-10.52-2.66-2.93.2-4.42 2.03-4.42 6.15 0 20.76-5.21 50.42-12.15 57.35-7.58 7.59-26.55 23.7-34.06 29.06-13.16 9.4-31.17 20.2-44.11 25.06a106.87 106.87 0 0 1-13.32 4.03c-3.28.78-6.6 1.43-11.25 2.24-.53.1-8.8 1.5-11.5 1.99-4.86.87-9.3 1.74-14 2.76-20.62 4.48-25.07 5.01-38.11 5.01-2.49 0-2.9-.07-14.05-2-2.42-.42-4.31-.73-6.15-1-8.11-1.19-13.83-1.36-17.64-.2-4.54 1.4-5.93 4.65-3.7 10.52 2.02 5.28 4.84 8.61 8.84 10.74 3.26 1.74 6.75 2.6 13.82 3.71 9.42 1.48 10.94 1.75 15.5 2.92a78.2 78.2 0 0 1 18.62 7.37c8.3 4.58 14.58 11.5 19.98 20.89 2.73 4.73 9.46 19.33 10.54 21.19 3.4 5.85 6.26 6.63 10.89 2 4.95-4.94 10.35-8.37 21.13-14.06.47-.25 2.06-1.1 2.12-1.12 7.98-4.21 11.92-6.51 15.87-9.54 5.11-3.9 8.66-8.1 10.77-13.11 8.52-20.24 20.75-33.31 32.46-33.31l5.5.03c10.53.08 17.35.02 24.9-.31 13.66-.62 23.78-2.09 29.39-4.67 5.85-2.7 13.42-5.49 24.18-9.02 3.46-1.14 6.29-2.05 12.7-4.1 7.7-2.45 11.08-3.54 15.17-4.9a1059.43 1059.43 0 0 1 11.33-3.72c3.67-1.2 5.96-2 8.03-2.78a59.88 59.88 0 0 0 6.66-2.94c1.87-.98 3.76-2.1 5.86-3.5 3.48-2.33 6.15-3.13 12.04-4.13l1.15-.2c5.71-1.01 9-2.3 12.76-5.63 7.82-6.96 8.58-23.18 3.84-44.52-1.7-7.67-2.1-19.28-1.57-35.47A837.22 837.22 0 0 1 546.76 0h1l-.15 3.06c-.32 6.42-.53 11.02-.68 15.62-.51 16.1-.12 27.65 1.56 35.21 4.82 21.68 4.04 38.2-4.16 45.48-3.91 3.48-7.37 4.84-13.24 5.87l-1.16.2c-5.76.99-8.32 1.75-11.65 3.98a63.73 63.73 0 0 1-5.96 3.56 60.86 60.86 0 0 1-6.77 2.99c-2.09.79-4.39 1.58-8.07 2.79a5398.31 5398.31 0 0 1-11.32 3.71c-4.1 1.37-7.48 2.46-15.18 4.92-6.42 2.04-9.24 2.95-12.7 4.08-10.73 3.53-18.27 6.3-24.07 8.98-5.76 2.66-15.97 4.14-29.77 4.77-7.56.33-14.4.39-24.95.31l-5.49-.03c-11.19 0-23.16 12.79-31.54 32.7-2.19 5.19-5.84 9.52-11.08 13.52-4.02 3.07-7.99 5.39-16.01 9.62l-2.12 1.12c-10.7 5.65-16.04 9.04-20.9 13.9-5.14 5.14-8.75 4.15-12.45-2.22-1.12-1.92-7.85-16.5-10.54-21.2-5.33-9.24-11.48-16.02-19.6-20.5a77.2 77.2 0 0 0-18.4-7.28c-4.5-1.17-6.02-1.43-15.4-2.9-7.17-1.12-10.74-2-14.13-3.81-4.22-2.25-7.2-5.77-9.3-11.27-2.43-6.39-.78-10.26 4.34-11.83 4-1.22 9.82-1.05 18.08.17 1.84.27 3.74.58 6.17 1 11.02 1.9 11.48 1.98 13.88 1.98 12.96 0 17.35-.52 37.9-4.99 4.71-1.02 9.16-1.9 14.03-2.77 2.71-.48 10.98-1.9 11.5-1.98 4.64-.81 7.95-1.46 11.2-2.23 4.55-1.07 8.76-2.34 13.2-4 12.83-4.81 30.79-15.59 43.88-24.94 7.47-5.33 26.4-21.4 33.94-28.94C407.3 61.98 412.5 32.49 412.5 12c0-4.61 1.86-6.9 5.35-7.15 2.63-.18 5.8.7 10.96 2.73l1.56.62c6.53 2.62 8.53 3.3 10.63 3.3 1.14 0 2.3.16 3.5.46 1.32.33 2.68.82 4.34 1.53a90.97 90.97 0 0 1 3.34 1.52l1.15.54c5.98 2.73 10.23 3.95 15.67 3.95 5.41 0 8.87-1.21 13.1-3.92.2-.13 2.1-1.38 2.66-1.72 2.62-1.63 4.64-2.36 7.24-2.36 1.47 0 2.94-.43 4.47-1.3 2.78-1.56 5.67-4.45 9.54-9.31l.7-.89zM324.54 600h-2.03c.49-2.96.91-6.2 1.28-9.66.44-4.1.76-8.25.98-12.21.08-1.39.14-2.65-.35-7.29-.47-1.94-.93-4.14-1.36-6.54-2.01-11.26-2.66-22.9-1.14-33.78a60.76 60.76 0 0 1 5.18-17.95 70.78 70.78 0 0 1 12.6-18.22c3.38-3.6 5.53-5.5 11.83-10.79 4.5-3.78 6.35-5.56 7.52-7.5.64-1.07.95-2.06.95-3.06 0-1.75 0-1.74-.75-9.23-.36-3.7-.57-6.3-.68-8.96-.5-12.1 1.62-19.6 8.11-21.76 15.9-5.3 25.89-12.1 33.45-25.54C409.6 390.65 425.85 376 436 376c12.36 0 20-1.96 29.41-8.8 6.76-4.92 9.5-6.6 12.47-7.46 2.22-.64 3.8-.74 9.12-.74 1.86 0 3.53-.83 5.57-2.62 1.08-.96 5.11-5.12 5.6-5.6 6.04-5.85 11.98-8.78 20.83-8.78 2.45 0 4.54.04 7.32.12 7.51.23 8.87.17 11.27-.7 3.03-1.1 5.53-3.03 14.75-11.17 8-7.06 10.72-8.92 22.87-16.47 1.44-.9 2.59-1.63 3.69-2.37a69.45 69.45 0 0 0 9.46-7.5c4.12-3.88 8.02-7.85 11.64-11.9v2.98a201.58 201.58 0 0 1-10.27 10.38c-3.18 3-6.2 5.35-9.72 7.7-1.12.76-2.28 1.5-3.75 2.4-12.05 7.5-14.71 9.32-22.6 16.28-9.46 8.35-12.01 10.32-15.39 11.55-2.74 1-4.19 1.06-12.01.82-2.76-.08-4.83-.12-7.26-.12-8.27 0-13.75 2.7-19.43 8.22-.44.43-4.52 4.64-5.68 5.66-2.37 2.09-4.46 3.12-6.89 3.12-5.1 0-6.6.1-8.56.66-2.67.78-5.29 2.37-11.85 7.15-9.8 7.13-17.85 9.19-30.59 9.19-9.22 0-24.96 14.2-34.13 30.49-7.84 13.94-18.24 21.02-34.55 26.46-5.31 1.77-7.21 8.51-6.75 19.78.1 2.6.31 5.19.68 8.84.75 7.62.75 7.58.75 9.43 0 1.38-.42 2.73-1.24 4.09-1.33 2.2-3.26 4.07-7.94 8-6.25 5.24-8.36 7.12-11.67 10.63a68.8 68.8 0 0 0-12.25 17.71 58.8 58.8 0 0 0-5 17.36c-1.49 10.66-.85 22.09 1.13 33.15.43 2.37.88 4.53 1.33 6.44.16.66.3 1.25.6 4.06a249.3 249.3 0 0 1-1.17 16.12c-.37 3.37-.78 6.53-1.25 9.44zm-13.4 0h-1.05l.12-.28c3.07-7.16 4.29-11.83 4.29-18.72 0-3.57-.07-4.93-.76-15.65-.77-12.04-1-19.64-.55-28.3.58-11.5 2.4-22.1 5.81-32.16 1.3-3.8 2.8-7.5 4.55-11.1 3.46-7.14 6.83-12.39 10.42-16.6a59.02 59.02 0 0 1 4.35-4.56c.43-.4 3-2.8 3.67-3.45 5.72-5.6 7.51-11.52 7.51-29.18 0-18.84 2.9-23.77 15.82-28.24 1.09-.37 1.92-.67 2.77-.98a51.3 51.3 0 0 0 6.1-2.7c4.95-2.6 9.64-6.22 14.44-11.42 25.5-27.63 37.15-35.16 56.37-35.16 8.28 0 14.54-1.95 22-6.3 1.78-1.03 13.82-8.82 18.16-11.27 2.83-1.59 5.66-3.03 8.63-4.39 7.92-3.6 13.97-4.45 26.6-4.8 7.53-.2 10.7-.49 14.26-1.58 4.55-1.4 8.06-4 10.93-8.43 2.2-3.41 6.85-7.08 14.66-12.06 1.61-1.03 3.27-2.05 5.65-3.5 9.53-5.85 11.56-7.13 14.81-9.57 5.34-4 9.3-8.37 13.68-14.77a204.2 204.2 0 0 0 5.62-8.75v1.9c-1.97 3.17-3.4 5.38-4.8 7.42-4.42 6.48-8.46 10.92-13.9 15-3.29 2.46-5.32 3.75-14.89 9.61a375.06 375.06 0 0 0-5.63 3.5c-7.7 4.9-12.26 8.52-14.36 11.76-3 4.63-6.7 7.39-11.48 8.85-3.68 1.12-6.9 1.42-14.53 1.63-12.5.34-18.44 1.18-26.2 4.7a111.08 111.08 0 0 0-8.56 4.35c-4.3 2.43-16.34 10.22-18.15 11.27-7.6 4.43-14.03 6.43-22.5 6.43-18.87 0-30.3 7.4-55.63 34.84-4.88 5.28-9.67 8.97-14.7 11.62-2 1.05-4 1.92-6.23 2.75-.86.32-1.7.62-5.37 1.87-5.08 1.76-7.44 3.25-9.28 6.37-2.23 3.78-3.29 9.94-3.29 20.05 0 17.9-1.87 24.07-7.8 29.89-.69.67-3.27 3.06-3.69 3.46a58.04 58.04 0 0 0-4.28 4.49c-3.53 4.14-6.86 9.32-10.28 16.38a95.19 95.19 0 0 0-4.5 10.99c-3.38 9.97-5.18 20.48-5.76 31.9-.44 8.6-.22 16.17.55 28.17.69 10.76.76 12.12.76 15.72 0 6.35-1.02 10.87-4.35 19zm25.08 0h-1c-.04-4.73.06-9.39.28-15.02.26-6.41-.4-11.79-2.53-24.37l-.31-1.86c-2.12-12.55-2.76-19.35-1.97-26.47 1.03-9.25 4.75-16.68 12-22.67 22.04-18.2 29.81-30.18 29.81-44.61 0-2.6-.3-4.81-.98-8.17-.97-4.79-1.1-5.68-.97-7.57.2-2.56 1.27-4.7 3.56-6.72 2.67-2.35 7.05-4.6 13.72-7.01 9.72-3.5 15.52-9.18 24.3-21.57l1.78-2.5c4.48-6.33 7.1-9.63 10.43-12.78 4.31-4.07 8.98-6.77 14.54-8.17 13.3-3.32 20.37-5.47 25.34-7.64a49.5 49.5 0 0 0 5.28-2.7c1.1-.65 1.75-1.04 4.24-2.6 2.7-1.68 5.22-2.08 11.38-2.28 5.44-.18 7.9-.43 10.97-1.41a21.47 21.47 0 0 0 9.54-6.22c4.87-5.3 10.03-7.61 17.79-8.9 1.07-.18 1.88-.3 3.86-.58 6.9-.97 9.94-1.69 13.48-3.62 4.5-2.45 6.79-4.44 23.46-19.68l3.14-2.85c9.65-8.71 16.12-13.83 21.42-16.48 4.25-2.12 7.6-4.69 11.22-8.6v1.45c-3.42 3.57-6.69 6-10.78 8.05-5.18 2.59-11.61 7.67-21.2 16.32l-3.12 2.85c-16.8 15.35-19.05 17.3-23.66 19.82-3.68 2-6.8 2.75-13.82 3.73-1.97.28-2.78.4-3.84.57-7.56 1.26-12.52 3.48-17.21 8.6a22.47 22.47 0 0 1-9.97 6.5c-3.2 1-5.72 1.27-11.25 1.45-5.98.2-8.39.57-10.89 2.13a144 144 0 0 1-4.25 2.61 50.48 50.48 0 0 1-5.39 2.75c-5.04 2.2-12.15 4.37-25.5 7.7-9.74 2.44-15.26 7.65-24.4 20.56l-1.77 2.5c-8.9 12.54-14.82 18.34-24.78 21.93-6.57 2.36-10.85 4.57-13.4 6.82-2.1 1.86-3.05 3.74-3.22 6.04-.13 1.76 0 2.63.95 7.3.7 3.42 1 5.7 1 8.37 0 14.79-7.93 27-30.18 45.39-7.03 5.8-10.64 13-11.64 22-.78 7-.14 13.73 1.96 26.2l.32 1.85c2.15 12.65 2.8 18.07 2.54 24.58-.22 5.57-.32 10.2-.28 14.98zM95.9 600h-2.04c.68-3.82 1.14-8.8 1.61-15.98.2-3.11.27-4.06.39-5.6 1.3-17.54 4.04-27.14 11.5-33.2 4.65-3.77 7.22-8.92 8.67-16 .51-2.52.7-3.87 1.33-9.17.66-5.5 1.16-8.06 2.24-10.36 1.45-3.09 3.82-4.69 7.39-4.69 14.28 0 38.48 9.12 53.6 20.2 8.66 6.35 21.26 13.32 31.74 17.11 13.03 4.71 21.89 4.41 24.75-1.73 1.7-3.64 1.92-4.11 2.65-5.77 2.93-6.67 4.69-12.2 5.25-17.5.23-2.17.24-4.23.02-6.2-.32-2.75-1.42-4.55-4.08-7.35l-1.32-1.37a30.59 30.59 0 0 1-2.41-2.79 30.37 30.37 0 0 1-2.5-4.07l-1.13-2.14c-1.62-3.1-2.68-4.6-4.12-5.56-5.26-3.5-14.8-5.5-28.55-6.83a272.42 272.42 0 0 0-9.04-.71l-2.18-.17c-9.57-.73-15.12-1.56-19.06-3.2C156.57 471.07 136 450.5 136 440c0-5.34 1.74-9.53 5.47-14.13 1.98-2.44 11.12-11.71 12.79-13.54 4.52-4.97 10.16-9.54 17.68-14.66 2.8-1.9 14.78-9.6 17.49-11.49a50.54 50.54 0 0 0 6.34-5.43c1.53-1.5 6.96-7.13 7.12-7.3 7.18-7.3 12.7-11.56 19.74-14.38 3.36-1.34 8.13-2.79 17.45-5.38a9577.18 9577.18 0 0 1 11.78-3.28 602.6 602.6 0 0 0 12.67-3.7c20.4-6.24 34-12.08 40.79-18.44 8.74-8.2 11.78-13.84 15.73-26.02 2.02-6.22 3.09-9.04 5.07-12.72 9.54-17.71 28.71-39.37 43.5-45.45C383.77 238.25 389 232.34 389 226c0-2.89 2.73-8.4 6.83-13.73 4.76-6.2 10.65-11.36 16.75-14.18 12.5-5.77 33.5-10.09 47.42-10.09 5.32 0 9.83-1.5 16.42-4.89 9.2-4.71 10.1-5.11 13.58-5.11 10.42 0 32.06-2.55 45.76-5.97l3.88-.98 3.47-.89c2.6-.66 4.33-1.08 5.93-1.43 3.9-.86 6.76-1.23 9.58-1.17 2.74.06 5.47.52 8.67 1.48 4.56 1.37 13.71-.9 22.87-5.68a68.07 68.07 0 0 0 9.84-6.2v2.4c-11.09 8.14-25.76 13.66-33.29 11.4a29.72 29.72 0 0 0-8.13-1.4c-2.63-.05-5.36.3-9.11 1.12a238 238 0 0 0-9.33 2.3l-3.9.99C522.38 177.43 500.58 180 490 180c-2.99 0-3.91.4-12.67 4.89-6.85 3.51-11.61 5.11-17.33 5.11-13.65 0-34.35 4.26-46.58 9.9-5.78 2.67-11.42 7.62-16 13.58-3.85 5.02-6.42 10.2-6.42 12.52 0 7.27-5.8 13.82-20.62 19.92-14.27 5.88-33.16 27.21-42.5 44.55-1.9 3.55-2.95 6.28-4.93 12.4-4.05 12.47-7.23 18.39-16.27 26.86-7.08 6.64-20.87 12.57-41.57 18.89a604.52 604.52 0 0 1-12.7 3.71 1495.1 1495.1 0 0 1-11.8 3.28c-9.24 2.58-13.97 4.01-17.24 5.32-6.73 2.69-12.05 6.8-19.05 13.92-.15.15-5.6 5.8-7.15 7.32a52.4 52.4 0 0 1-6.6 5.65c-2.74 1.92-14.75 9.63-17.5 11.5-7.4 5.04-12.94 9.52-17.33 14.35-1.72 1.9-10.8 11.11-12.71 13.46-3.47 4.26-5.03 8.03-5.03 12.87 0 9.5 20 29.5 33.38 35.08 3.67 1.53 9.1 2.34 18.45 3.05a586.23 586.23 0 0 0 4.34.32c3.24.23 5.07.37 6.93.55 14.08 1.37 23.82 3.4 29.45 7.17 1.82 1.2 3.02 2.91 4.8 6.29l1.11 2.13a28.55 28.55 0 0 0 2.34 3.81c.62.83 1.3 1.6 2.26 2.61.23.24 1.1 1.16 1.32 1.37 2.93 3.09 4.24 5.23 4.61 8.5.24 2.12.23 4.33-.01 6.64-.59 5.55-2.4 11.25-5.41 18.1-.74 1.67-.96 2.15-2.66 5.8-3.49 7.47-13.33 7.8-27.25 2.77-10.67-3.86-23.43-10.92-32.25-17.38C164.62 515.96 140.82 507 127 507c-5 0-6.4 3.02-7.64 13.29a99.03 99.03 0 0 1-1.36 9.33c-1.53 7.5-4.3 13.04-9.37 17.16-6.87 5.58-9.5 14.78-10.77 31.8-.11 1.52-.18 2.47-.38 5.57-.46 7.01-.91 11.99-1.57 15.85zm8.05 0h-1.02c.29-1.41.58-2.94.9-4.59l1.05-5.62c2.5-13.3 4.2-19.92 6.68-24.05 1.7-2.84 3.68-5.5 8.05-11.03 8.21-10.36 10.88-14.55 10.88-18.71l-.02-1.69c-.02-1.78-.02-2.7.02-3.77.21-5.05 1.47-8.2 4.64-9.4 3.92-1.5 10.39.44 20.12 6.43 9.56 5.88 17.53 10.7 25.91 15.66 1.31.78 14.27 8.41 17.67 10.45a714.21 714.21 0 0 1 6.42 3.9c13.82 8.5 38.94 5.05 46.3-7.83 3.6-6.28 4.54-8.52 7.78-17.32a82.3 82.3 0 0 1 1.18-3.07 42.27 42.27 0 0 1 4.06-7.64c9.33-13.98 14.92-26.1 14.92-36.72 0-3.66.75-6.62 3.36-14.85.52-1.64.83-2.66 1.15-3.73 3.64-12.23 3.04-19.12-4.29-24a23.1 23.1 0 0 0-9.98-3.78c-7.2-.93-14.49 1.17-23.91 5.88-1.55.78-6.64 3.44-7.6 3.93a62.6 62.6 0 0 0-4.14 2.3l-4.4 2.66c-11.62 6.92-20.4 9.18-32.81 6.08-3.32-.84-6.24-1.4-13.1-2.64-13.25-2.39-18.7-3.75-23.33-6.46-6.23-3.67-7.46-9.02-2.88-16.65A93.1 93.1 0 0 1 172 415.42a157 157 0 0 1 8.32-7.66c-.07.05 6.16-5.3 7.82-6.77a85.12 85.12 0 0 0 6.5-6.33c7.7-8.46 12.78-13.36 20.08-18.57 9.94-7.1 21.4-12.36 35.18-15.58 37.03-8.64 51-12.7 58.83-17.93 8.6-5.73 21.3-24.77 36.84-54.81 5.22-10.1 12.27-18.4 21.13-25.71 5.13-4.24 9.56-7.25 17.55-12.23 7.42-4.62 9.62-6.14 11.38-8.16a21.15 21.15 0 0 0 2.95-4.87c.61-1.3 2.87-6.47 3-6.77 1.36-3 2.56-5.4 3.95-7.73 6.53-10.97 16.03-18 31.4-20.8 12.73-2.3 19.85-2.7 29.68-2.3 3.25.13 4.13.16 5.6.14 5.15-.07 9.71-1.04 16.61-3.8 20.74-8.3 38.75-12.04 59.19-12.04 3.05 0 6.03.15 10.48.48l2.09.16c12.45.96 18.08.96 25.34-.63a49.65 49.65 0 0 0 14.09-5.45v1.15a50.52 50.52 0 0 1-13.88 5.28c-7.38 1.61-13.08 1.61-25.63.65l-2.08-.16c-4.43-.33-7.39-.48-10.41-.48-20.3 0-38.2 3.72-58.81 11.96-7.01 2.8-11.7 3.8-16.97 3.88-1.5.02-2.39-.01-5.66-.14-9.76-.4-16.8-.01-29.47 2.3-15.06 2.73-24.32 9.58-30.71 20.31a72.8 72.8 0 0 0-3.9 7.63c-.12.28-2.39 5.47-3.01 6.79a22 22 0 0 1-3.1 5.1c-1.86 2.13-4.07 3.66-11.6 8.35-7.95 4.96-12.35 7.95-17.44 12.15-8.76 7.23-15.73 15.43-20.89 25.4-15.61 30.2-28.36 49.32-37.16 55.19-7.98 5.32-21.97 9.39-59.17 18.07-13.65 3.18-24.98 8.39-34.82 15.42-7.22 5.16-12.27 10.01-19.92 18.43a86.07 86.07 0 0 1-6.57 6.4c-1.67 1.48-7.91 6.83-7.84 6.77-3.27 2.84-5.8 5.16-8.26 7.62a92.1 92.1 0 0 0-14.27 18.13c-4.3 7.16-3.22 11.89 2.53 15.26 4.47 2.63 9.88 3.99 23.24 6.39a185.7 185.7 0 0 1 12.92 2.6c12.11 3.03 20.64.84 32.06-5.96l4.4-2.65c1.66-1 2.96-1.73 4.2-2.35.95-.48 6.04-3.14 7.6-3.92 9.59-4.8 17.04-6.94 24.49-5.98a24.1 24.1 0 0 1 10.4 3.93c7.82 5.21 8.45 12.52 4.7 25.13-.32 1.07-.64 2.1-1.16 3.74-2.57 8.12-3.31 11.04-3.31 14.55 0 10.88-5.66 23.14-15.08 37.28a41.28 41.28 0 0 0-3.97 7.46c-.37.9-.73 1.82-1.18 3.04-3.25 8.85-4.21 11.13-7.84 17.47-7.67 13.42-33.43 16.95-47.7 8.18a578.4 578.4 0 0 0-6.4-3.89c-3.4-2.04-16.36-9.67-17.67-10.45-8.38-4.97-16.36-9.78-25.92-15.66-9.5-5.85-15.7-7.7-19.24-6.36-2.68 1.02-3.8 3.82-4 8.51a61.12 61.12 0 0 0-.02 3.72l.02 1.7c0 4.5-2.69 8.73-11.52 19.87-3.92 4.95-5.87 7.59-7.55 10.39-2.39 3.97-4.08 10.56-6.56 23.72l-1.05 5.62-.86 4.4zm10.5 0h-1c.03-.34.04-.68.04-1 0-12.39 8.48-33.57 19.16-43.37a26.18 26.18 0 0 0 3.67-4.17 35.8 35.8 0 0 0 2.88-4.9c.36-.72 1.75-3.66 2.1-4.36 3.22-6.29 6.84-6.54 16.97.39 1.34.9 6.07 4.16 6.4 4.38 2.62 1.8 4.67 3.2 6.7 4.56 5.03 3.39 9.37 6.2 13.51 8.7 14.33 8.67 25.49 13.27 34.11 13.27 16.86 0 32.71-5.95 39.6-14.8 1.59-2.04 3.2-5.17 5.06-9.63.8-1.92 1.64-4.06 2.67-6.8l2.74-7.33c4.66-12.44 7.76-19.06 11.56-23.27 7.9-8.79 14.87-36 14.87-52.67 0-1.9.17-3.11 1.02-8.27.37-2.2.58-3.6.74-5.07.63-5.51.21-9.46-1.68-12.39-4.6-7.1-19.7-9.23-38.46-4.78a100.57 100.57 0 0 0-18.94 6.3c-5.17 2.37-17.11 9.74-16.5 9.4-6.72 3.64-12.97 4.15-24.8 1.3-29.55-7.14-30.43-8.62-15.26-26.81 17.44-20.93 47.12-46.18 56.38-46.18 9.92 0 53.84-11.98 65.78-17.95 9.46-4.73 24.32-21.18 36.82-37.85.71-.95 13.5-21.6 19.2-29.6 9.35-13.13 18.22-22.55 26.95-27.53 7.29-4.17 13.16-10.28 18.8-18.73 1.93-2.9 10.52-17.65 12.73-20.41 1.54-1.93 3-3.21 4.52-3.89 14.07-6.25 24.22-9.04 39.2-9.04h29c4.05 0 7.36-.4 22.93-2.5l4.3-.57c9.92-1.3 16.57-1.93 21.77-1.93 1.66 0 2.95.01 6.03.04 18.61.19 28.55-.48 44.86-4.03 3.1-.67 6.13-1.78 9.11-3.31v1.12a37.96 37.96 0 0 1-8.9 3.17c-16.4 3.56-26.4 4.24-45.08 4.05-3.08-.03-4.36-.04-6.02-.04-5.15 0-11.76.63-21.64 1.92l-4.3.58c-15.64 2.11-18.94 2.5-23.06 2.5h-29c-14.81 0-24.84 2.75-38.8 8.96-1.34.6-2.69 1.78-4.14 3.6-2.16 2.68-10.72 17.39-12.68 20.33-5.72 8.57-11.7 14.8-19.13 19.04-8.57 4.9-17.36 14.23-26.63 27.24-5.68 7.97-18.47 28.64-19.22 29.63-12.6 16.8-27.52 33.32-37.18 38.15-12.06 6.03-56.14 18.05-66.22 18.05-8.82 0-38.39 25.15-55.62 45.82-14.6 17.52-14.19 18.21 14.74 25.2 11.6 2.8 17.6 2.3 24.09-1.2-.67.35 11.31-7.03 16.56-9.44 5.41-2.48 11.6-4.59 19.11-6.37 19.13-4.53 34.65-2.35 39.54 5.22 2.05 3.17 2.48 7.32 1.84 13.04a96.34 96.34 0 0 1-.75 5.13c-.84 5.08-1.01 6.29-1.01 8.1 0 16.9-7.03 44.33-15.13 53.33-3.68 4.09-6.76 10.65-11.37 22.96-.35.93-2.2 5.94-2.73 7.33-1.04 2.76-1.88 4.9-2.68 6.84-1.9 4.53-3.55 7.73-5.2 9.85-7.1 9.13-23.25 15.19-40.39 15.19-8.86 0-20.15-4.65-34.63-13.42-4.15-2.51-8.5-5.32-13.55-8.72a861.54 861.54 0 0 1-6.71-4.56l-6.4-4.39c-9.68-6.63-12.61-6.42-15.5-.75-.35.68-1.74 3.62-2.1 4.35a36.77 36.77 0 0 1-2.96 5.03c-1.12 1.57-2.37 3-3.81 4.33-10.47 9.6-18.84 30.51-18.84 42.63l-.03 1zm-29.65 0h-1.1c1.17-2.52 1.79-5.2 1.79-8 0-20 4.83-42.04 12.15-49.35 5.17-5.18 7.77-8.38 9.9-12.74 2.64-5.41 3.95-12 3.95-20.91 0-6.82 1.14-11.59 3.37-15.07 1.74-2.7 3.6-4.21 8.91-7.52a31.64 31.64 0 0 0 3.9-2.79c4.61-3.96 6.58-6.2 7.72-9.41 1.43-4.02.93-9.04-1.86-16.02a68.98 68.98 0 0 0-3.99-8.07l-.93-1.7a75.47 75.47 0 0 1-2.64-5c-5.16-10.71-3.77-18.9 7.68-29.78a204 204 0 0 1 26.81-21.55c3.96-2.69 16.8-10.8 19.24-12.5 1.99-1.4 4.33-3.3 7.77-6.3-.02 0 7.23-6.39 9.47-8.3 4.97-4.26 9.09-7.5 13.05-10.15 4.72-3.15 8.97-5.28 12.87-6.32 12.78-3.41 15.6-4.18 21.77-5.97 12.55-3.64 21.96-6.9 28.14-10a45.47 45.47 0 0 1 7.47-2.79c8.66-2.66 12.02-4.1 16.97-8.1 6.78-5.46 13.07-14.25 19.33-27.87 15.97-34.77 19.08-39.39 32.15-49.19 3.14-2.36 6.37-4.1 11.43-6.4l2.33-1.04c11.93-5.35 16.87-8.93 21.1-17.38 1.88-3.77 2.48-6.29 3.37-12.27.78-5.19 1.48-7.56 3.53-10.25 2.57-3.4 7.03-6.27 14.36-9.01 3.37-1.26 7.36-2.5 12.05-3.73 16.33-4.3 25.28-5.36 39.6-5.81 6.9-.22 9.5-.56 12.66-2 1.19-.54 2.36-1.23 3.58-2.11 3.7-2.7 8.14-4.54 13.24-5.67 5.71-1.27 10.69-1.54 18.7-1.45l2.35.02c2.82 0 6.8-1 19.7-4.69 10.83-3.08 15.95-4.31 19.3-4.31.82 0 1.9.13 3.55.41l5.01.9c9.82 1.68 17.44 1.89 25.15-.21 7.98-2.18 14.8-6.77 20.29-14.24V147c-5.47 7.04-12.21 11.42-20.03 13.55-7.88 2.15-15.63 1.94-25.58.23l-5-.9c-1.6-.26-2.64-.39-3.39-.39-3.2 0-8.32 1.22-19.74 4.48-12.35 3.53-16.3 4.52-19.26 4.52l-2.36-.02c-7.94-.1-12.85.17-18.47 1.42-4.97 1.11-9.3 2.9-12.88 5.5a21.4 21.4 0 0 1-3.75 2.22c-3.32 1.5-6 1.87-13.04 2.09-14.25.44-23.13 1.5-39.37 5.77a125.56 125.56 0 0 0-11.95 3.7c-7.17 2.7-11.49 5.46-13.93 8.68-1.9 2.52-2.58 4.76-3.33 9.8-.9 6.08-1.53 8.68-3.47 12.56a30.6 30.6 0 0 1-9.66 11.45c-3.12 2.26-5.95 3.73-11.93 6.4l-2.31 1.04c-5.01 2.27-8.18 3.99-11.25 6.29-12.9 9.68-15.93 14.17-31.85 48.8-6.31 13.76-12.7 22.68-19.6 28.25-5.08 4.1-8.53 5.57-17.3 8.27a44.64 44.64 0 0 0-7.33 2.73c-6.24 3.12-15.7 6.4-28.3 10.06a867.4 867.4 0 0 1-21.8 5.97c-3.77 1.01-7.93 3.1-12.56 6.19a137.35 137.35 0 0 0-12.95 10.07c-2.24 1.92-9.48 8.3-9.48 8.3a98.2 98.2 0 0 1-7.84 6.37c-2.46 1.72-15.32 9.83-19.26 12.5a203 203 0 0 0-26.69 21.45c-11.13 10.58-12.43 18.3-7.47 28.63a74.52 74.52 0 0 0 2.62 4.95l.94 1.7a69.84 69.84 0 0 1 4.03 8.17c2.88 7.2 3.4 12.46 1.89 16.73-1.22 3.43-3.28 5.77-8.02 9.84-1.14.97-2.32 1.8-5.3 3.67-3.92 2.45-5.69 3.89-7.31 6.42-2.13 3.3-3.22 7.89-3.22 14.53 0 9.05-1.34 15.79-4.05 21.34-2.19 4.49-4.85 7.77-10.1 13.01-7.07 7.07-11.85 28.9-11.85 48.65 0 2.8-.58 5.48-1.7 8zm282.54 0h-1.01l-1.1-5.8c-3.08-16.26-4.05-26.2-2.74-37.26.7-5.8.77-9.68.55-15.3-.18-4.45-.17-5.68.19-7.63.78-4.3 3.44-8.53 10.39-16.34 9.07-10.2 12.26-15.41 19.8-30.15 1.35-2.64 2.33-4.47 3.38-6.3.9-1.58 1.82-3.06 2.77-4.5 3.14-4.7 7.03-8.42 16.84-16.81 11.22-9.6 15.5-13.86 18.13-19.13.7-1.4 1.3-2.8 1.93-4.4a206 206 0 0 0 1.49-4.05c3.63-9.94 8.01-13.93 22.9-17.81 4.99-1.3 20.55-5.13 21.38-5.34 16.19-4.1 25.33-7.36 33.48-12.6 5.86-3.77 5.84-3.76 27.66-16.53l2.6-1.52c10.23-6 17.1-10.2 22.73-13.95a149.3 149.3 0 0 0 8.8-6.3 723.7 723.7 0 0 0 6.37-5.08A87.74 87.74 0 0 1 600 342.95v1.12a85.76 85.76 0 0 0-15.49 9.9c.18-.14-4.76 3.84-6.38 5.1a150.3 150.3 0 0 1-8.85 6.35c-5.65 3.76-12.53 7.96-22.78 13.97l-2.6 1.53c-21.8 12.75-21.78 12.74-27.63 16.5-8.27 5.32-17.49 8.61-33.78 12.73-.83.21-16.39 4.04-21.36 5.33-8.03 2.1-13.15 4.5-16.45 7.5-2.66 2.42-4 4.86-5.77 9.7l-1.5 4.07a51.12 51.12 0 0 1-1.96 4.47c-2.72 5.45-7.04 9.75-18.38 19.45-9.73 8.32-13.6 12.02-16.65 16.6a77.18 77.18 0 0 0-2.74 4.45c-1.05 1.81-2.01 3.63-3.35 6.25-7.58 14.81-10.82 20.08-19.96 30.36-6.83 7.7-9.4 11.78-10.15 15.86-.34 1.85-.34 3.04-.17 7.4.22 5.68.14 9.6-.55 15.47-1.3 10.92-.34 20.79 2.73 36.95l1.12 5.99zm-76.59 0h-2.1l1.39-4.3c1.04-3.3 1.93-6.78 2.68-10.4 2.65-12.73 3.27-23.63 3.27-41.3 0-5.71-1.86-9.75-4.13-9.75-2.94 0-6.96 5.61-10.93 17.08C271.14 579.68 258.3 593 238 593c-22.42 0-29.26-1.35-48.42-10.09a87.69 87.69 0 0 1-9.42-5.04c-2.95-1.8-12.78-8.57-14.84-9.72-4.2-2.36-7-2.71-9.72-.99-.63.4-1.26.91-1.9 1.55a57.69 57.69 0 0 1-4.31 3.86 147.88 147.88 0 0 1-3.06 2.44l-1 .8C137.01 582.43 134 587.18 134 597c0 1.02-.02 2.01-.07 3h-2c.05-.99.07-1.98.07-3 0-10.52 3.33-15.78 12.09-22.76a265.61 265.61 0 0 1 2-1.6c.83-.64 1.43-1.13 2.03-1.61a55.76 55.76 0 0 0 4.17-3.74c.74-.73 1.48-1.34 2.24-1.82 3.47-2.2 7-1.75 11.77.93 2.15 1.21 12.03 8 14.9 9.76a85.7 85.7 0 0 0 9.22 4.93C209.29 589.7 215.85 591 238 591c19.25 0 31.49-12.7 41.06-40.33 4.24-12.25 8.66-18.42 12.81-18.42 3.8 0 6.13 5.06 6.13 11.75 0 17.8-.63 28.8-3.3 41.7-.77 3.7-1.68 7.23-2.75 10.6-.4 1.3-.8 2.53-1.19 3.7zm-149.25 0 .5-.94a160.1 160.1 0 0 0 6.53-13.26c2.73-6.29 5.78-9.64 9.24-10.52 3.74-.95 7.15.74 12.56 5.13 5.43 4.4 6.07 4.86 7.73 5.1 1.6.22 4.28 1.14 8.86 2.95 1.3.5 10.78 4.35 13.85 5.55 3.07 1.2 5.85 2.25 8.49 3.18 3.1 1.1 5.98 2.04 8.65 2.81h-3.45c-1.76-.56-3.6-1.18-5.54-1.87a281.2 281.2 0 0 1-8.51-3.19c-3.08-1.2-12.57-5.04-13.86-5.55-4.5-1.78-7.15-2.68-8.63-2.9-1.94-.27-2.53-.7-8.22-5.3-5.17-4.2-8.36-5.78-11.69-4.94-3.1.78-5.94 3.92-8.56 9.95a161 161 0 0 1-6.82 13.8h-1.13zm112.89 0a30.34 30.34 0 0 0 11.27-6.27c1.55-1.36 3.32-3.46 5.34-6.29 1.05-1.46 2.15-3.1 3.41-5.04a349.73 349.73 0 0 0 2.5-3.9l.47-.75.93-1.47a89.17 89.17 0 0 1 3.25-4.86c1.05-1.43 1.82-2.23 2.44-2.46 1.02-.37 1.49.48 1.49 2.04l.01 2.11c.05 6.91-.08 11.32-.7 16.33a48.4 48.4 0 0 1-2.38 10.56h-1.07a46.47 46.47 0 0 0 2.45-10.68c.62-4.96.75-9.33.7-16.2l-.01-2.12c0-.97-.08-1.12-.15-1.1-.36.14-1.05.85-1.97 2.1a88.44 88.44 0 0 0-3.22 4.82l-.92 1.46-.48.75a1268.1 1268.1 0 0 1-2.5 3.92c-1.26 1.95-2.38 3.6-3.44 5.08-2.06 2.88-3.87 5.04-5.5 6.45a30.87 30.87 0 0 1-8.94 5.52h-2.98zm-183.72 0H69.3c3.37-3.43 5.19-8.33 5.19-15 0-18.6-.04-17.35 1.02-20.77.6-1.93 1.5-3.74 3.27-6.63.42-.7 4.92-7.8 6.78-10.86 3.04-4.97 11.04-16.5 12.21-18.56 3.48-6.08 4.72-12.06 4.72-24.18 0-7.85 2.5-14.2 8.1-23.44l2.84-4.63a72.67 72.67 0 0 0 2.49-4.4c1.62-3.15 2.48-5.78 2.62-8.28.2-3.78-1.3-7.29-4.9-10.9-5.13-5.12-8.6-5.43-11.2-1.85-2.12 2.92-3.48 7.74-5.06 16.47-.2 1.03-.82 4.6-.82 4.57-.83 4.67-1.4 7.33-2.1 9.6-1.35 4.42-3.7 7.61-8.36 12.26l-3.26 3.2c-6.38 6.39-9.68 11.51-11.36 19.5l-1.16 5.52c-.87 4.1-1.56 7.04-2.33 9.94-3.67 13.74-9.65 25.97-22.59 44.72-7.68 11.14-11.05 18.87-10.92 23.72h-1c-.12-5.16 3.35-13.05 11.1-24.28 12.87-18.67 18.8-30.8 22.44-44.42.77-2.88 1.45-5.8 2.32-9.89l1.16-5.51c1.73-8.22 5.13-13.5 11.64-20 .63-.64 2.84-2.8 3.25-3.21 4.57-4.54 6.82-7.62 8.12-11.84a81.58 81.58 0 0 0 2.07-9.48l.81-4.57c1.62-8.9 3-13.8 5.24-16.89 3-4.15 7.2-3.78 12.71 1.74 3.8 3.8 5.42 7.58 5.2 11.66-.15 2.66-1.05 5.41-2.73 8.68a73.6 73.6 0 0 1-2.52 4.46l-2.84 4.63c-5.52 9.1-7.96 15.3-7.96 22.92 0 12.28-1.28 18.43-4.85 24.68-1.2 2.1-9.21 13.65-12.22 18.58-1.87 3.06-6.37 10.18-6.78 10.86-1.73 2.82-2.6 4.57-3.17 6.4-1.02 3.28-.98 2.1-.98 20.48 0 6.52-1.7 11.44-4.82 15zM310.09 0h1.06c-.37.9-.77 1.83-1.2 2.82-3.9 9.06-5.45 15.15-5.45 25.18 0 7.64-2.1 11.6-6.64 13.05-3.46 1.1-5.72.98-17.57-.43-11.55-1.36-19.17-1.58-28.16-.14-6.24 2.49-25.91 7.02-32.13 7.02-11.15 0-36.76-2.88-54.12-7.01a22.08 22.08 0 0 0-16.95 2.48c-4.05 2.33-7.09 5.03-13.9 11.97-6.28 6.39-9.53 9.23-13.8 11.5-7.09 3.79-11.22 7.65-13.4 12.27-1.82 3.85-2.33 7.84-2.33 15.29 0 4.4-2.65 6.69-9.45 9.74.1-.05-2.97 1.31-3.84 1.71-8.78 4.06-12.71 8.29-12.71 16.55 0 12.52-4.86 19.22-17.34 27.96l-4.56 3.14c-1.9 1.3-3.3 2.3-4.67 3.3-.92.68-1.79 1.34-2.62 2-7.16 5.62-11 14.54-15.56 33.28-.63 2.57-3.3 14-4.07 17.14a350.44 350.44 0 0 1-5.2 19.33c-1.37 4.5-4.5 15.07-4.96 16.53-1.05 3.4-1.64 4.94-2.46 6.32-.82 1.4-6.85 9.08-12.64 18.27L0 277.98v-1.9l4.58-7.35a270.8 270.8 0 0 1 12.61-18.23c-.3.5 1.35-2.8 2.38-6.12.45-1.44 3.58-12.01 4.95-16.53 1.83-6.03 3.44-12.09 5.19-19.27.76-3.13 3.44-14.56 4.06-17.14 4.62-18.95 8.52-28.02 15.92-33.83.84-.67 1.72-1.33 2.65-2.01 1.38-1.02 2.8-2.01 4.7-3.32l4.54-3.14C73.83 140.57 78.5 134.13 78.5 122c0-8.74 4.2-13.26 13.29-17.45.88-.41 3.96-1.77 3.85-1.73 6.46-2.9 8.86-4.97 8.86-8.82 0-7.6.53-11.7 2.42-15.71 2.29-4.84 6.57-8.85 13.84-12.73 4.15-2.21 7.35-5 14.15-11.93 6.28-6.4 9.36-9.13 13.52-11.53a23.07 23.07 0 0 1 17.69-2.59c17.27 4.12 42.8 6.99 53.88 6.99 6.1 0 25.73-4.53 31.92-7 9.12-1.46 16.83-1.25 28.49.13 11.63 1.38 13.9 1.5 17.15.47 4.06-1.3 5.94-4.85 5.94-12.1 0-10.1 1.56-16.3 6.6-28zm25.12 0h1c.05 5.62.26 11.48.65 19.4.47 9.7.64 14.57.64 21.6 0 9.81-4.68 17.46-13.1 23.16-6.53 4.43-14.94 7.46-24.33 9.33-3.74.54-9.42.56-22.68.23-6.74-.17-9.35-.22-12.39-.22-2.77 0-4.97.43-7.63 1.36-.88.3-4.55 1.74-5.58 2.11-6.55 2.35-13.59 3.53-24.79 3.53-8.1 0-13.58-1.38-22.46-4.9l-3.18-1.25c-12.55-4.87-21.27-5.15-37.18 1.12-11.15 4.39-18.13 9.2-22.28 14.81-3.15 4.26-4.33 7.8-5.94 15.8-1.22 6.09-1.93 8.74-3.5 12.13-1.65 3.53-3.97 5.81-7.07 7.22-2.33 1.07-4.35 1.5-9.32 2.19-9.04 1.27-12.77 3.09-15.61 9.58-3.71 8.48-7.72 13.87-14.22 19.76-2.4 2.18-13.14 11.02-15.91 13.42-8.2 7.1-13.85 17.37-18.7 31.97a258.81 258.81 0 0 0-3.27 10.7c-.01.05-2.26 7.97-2.88 10.1-8.49 28.85-17.88 52.95-26.13 61.2-2.8 2.8-5.06 5.64-10.4 12.96-3.4 4.68-6.23 8.25-8.95 11.1v-1.55c2.74-2.98 5.73-6.82 9.48-11.97 4.03-5.52 6.32-8.4 9.17-11.24 8.07-8.08 17.44-32.14 25.87-60.8.62-2.1 2.86-10.03 2.88-10.08 1.21-4.24 2.21-7.53 3.28-10.74 4.9-14.75 10.63-25.16 19-32.4 2.78-2.42 13.5-11.25 15.89-13.4 6.4-5.8 10.32-11.09 13.97-19.43 1.68-3.83 4.05-6.31 7.2-7.86 2.4-1.17 4.64-1.67 9.53-2.36 4.54-.63 6.5-1.05 8.7-2.06 2.89-1.31 5.03-3.42 6.58-6.73 1.53-3.3 2.23-5.9 3.43-11.9 1.64-8.14 2.85-11.79 6.11-16.2 4.28-5.79 11.41-10.7 22.73-15.16 16.15-6.36 25.13-6.07 37.9-1.11l3.19 1.26c8.77 3.47 14.13 4.82 22.09 4.82 11.09 0 18.02-1.16 24.46-3.47 1-.36 4.68-1.8 5.58-2.11A22.5 22.5 0 0 1 265 72.5c3.05 0 5.67.05 14.07.26 11.53.29 17.2.27 20.83-.25 9.25-1.85 17.54-4.83 23.94-9.17C332 57.8 336.5 50.46 336.5 41c0-7-.17-11.86-.7-22.7-.35-7.26-.55-12.83-.59-18.3zM93.87 0h2.04c-.7 4-1.61 6.82-3.03 9.47-2.33 4.38-2.85 5.75-5.26 13.03a40.46 40.46 0 0 1-1.94 5.03c-2.24 4.66-5.92 8.8-13.07 14.26-8.01 6.13-14.27 16.55-20.03 31.55-2.4 6.23-8.75 25.63-9.64 28.01-2.69 7.16-6.56 12.7-15.63 23.68l-2.68 3.24c-6.02 7.34-9.35 12.07-11.72 17.15-2.3 4.94-7.12 9.9-12.91 14.15v-2.4c5.14-3.94 9.1-8.3 11.1-12.6 2.46-5.27 5.87-10.1 11.98-17.56l2.68-3.26c8.94-10.8 12.72-16.22 15.3-23.1.88-2.33 7.24-21.74 9.65-28.03 5.89-15.31 12.3-26 20.68-32.41 6.92-5.3 10.4-9.2 12.48-13.55.65-1.35 1.16-2.7 1.85-4.79 2.45-7.4 3-8.83 5.4-13.34A27.68 27.68 0 0 0 93.87 0zm9.07 0h1.02c-1.66 8.3-2.91 12.67-4.54 15.26a59.14 59.14 0 0 0-4.1 8.21c-1.27 3-2.44 6.2-3.5 9.4-.38 1.12-.7 2.16-2.41 5.39a251.48 251.48 0 0 0-12.81 13.3c-3.48 3.96-5.95 7.27-7.15 9.66-.95 1.9-2.06 5.99-3.61 12.97-.64 2.9-3.65 17.15-4.51 21.07-3.63 16.45-6.63 26.69-9.9 32-7.66 12.45-10.64 15.71-37.08 41.1A69.78 69.78 0 0 1 0 179.21v-1.15a69.39 69.39 0 0 0 13.65-10.42c26.4-25.33 29.32-28.55 36.92-40.9 3.2-5.18 6.18-15.37 9.78-31.7.86-3.91 3.87-18.16 4.51-21.06 1.57-7.09 2.7-11.2 3.7-13.2 1.24-2.5 3.76-5.86 7.29-9.89.9-1.03 1.86-2.1 2.86-3.18 2.4-2.6 4.96-5.22 7.53-7.76.9-.88 1.73-1.7 3.37-3.4a129.02 129.02 0 0 1 4.78-13.46 60.07 60.07 0 0 1 4.19-8.35c1.52-2.44 2.74-6.71 4.36-14.74zM83.71 0h1.1c-2.09 4.74-6.03 8.92-11.42 12.3-7.2 4.52-16.5 7.2-24.39 7.2-8.9 0-11.8 7-11.74 21.52 0 1.7.04 3.17.12 5.99.1 3.3.12 4.45.12 5.99 0 5.73-.76 11.3-2.01 16.5a66.67 66.67 0 0 1-2.15 6.97 2597.76 2597.76 0 0 1-7 15.86 4270.8 4270.8 0 0 1-19.9 43.87A54.64 54.64 0 0 1 0 147v-1.65a54.87 54.87 0 0 0 5.55-9.57A4269.82 4269.82 0 0 0 30.7 79.97c.53-1.2.99-2.23 2.44-5.9A69.23 69.23 0 0 0 36.5 53c0-1.52-.03-2.66-.12-5.95-.08-2.83-.12-4.31-.12-6.01-.03-6.79.53-11.62 2.07-15.34 1.94-4.68 5.39-7.19 10.67-7.19 7.7 0 16.81-2.63 23.86-7.05C77.93 8.27 81.66 4.38 83.7 0zm282.63 0h1.01c1.86 10.02 2.18 12.67 2.32 18.3a123.43 123.43 0 0 1 .37 27.83c-.96 8.78-3.1 16.01-6.63 21.15-11.34 16.5-39.8 29.22-66.41 29.22-5.09 0-10.47.28-16.31.83a413.8 413.8 0 0 0-24.37 3.16c-21.56 3.26-27.66 4.01-36.32 4.01-6.92 0-12.2-1.05-21.69-3.9l-2.78-.83c-1.39-.41-2.54-.74-3.65-1.02-8-2.05-14.22-2.04-21.7.72a16.32 16.32 0 0 0-9.17 8.18c-1.6 3.05-2.5 6.06-4.02 12.83-1.5 6.64-2.34 9.52-3.99 12.64a16.16 16.16 0 0 1-9.85 8.36 104.8 104.8 0 0 0-9.5 3.42c-6.55 2.8-10.1 5.57-13.8 10.47-1.33 1.75-1.03 1.3-5.43 7.9-1.98 2.97-4.66 5.8-8.48 9.14-2.01 1.76-10.71 8.83-12.88 10.7-7.37 6.35-12.58 12.14-16.63 19.14-4.22 7.3-7.8 18.3-11.28 33.26-.87 3.73-1.72 7.64-2.64 12.14l-1.18 5.8-1.09 5.45c-1.8 8.96-2.77 13.28-3.77 16.26-6.8 20.44-17.26 42.16-27.13 51.2-5.11 4.7-8.1 7.07-11.1 8.86-.9.54-1.84 1.04-2.92 1.57-.44.22-9.6 4.4-14.1 6.66l-1.22.62v-1.13l.78-.39c4.52-2.26 13.67-6.44 14.1-6.65a41.19 41.19 0 0 0 2.84-1.54c2.94-1.75 5.88-4.09 10.94-8.73 9.71-8.9 20.1-30.51 26.87-50.79.97-2.92 1.94-7.22 3.73-16.13l1.1-5.46a490.5 490.5 0 0 1 3.82-17.96c3.5-15.06 7.1-26.14 11.39-33.54 4.11-7.11 9.4-12.98 16.83-19.4 2.19-1.88 10.88-8.95 12.88-10.7 3.77-3.28 6.39-6.05 8.3-8.93 4.43-6.64 4.12-6.18 5.47-7.96 3.8-5.03 7.5-7.91 14.21-10.78 2.61-1.12 5.74-2.24 9.59-3.46a15.17 15.17 0 0 0 9.27-7.86c1.59-3.02 2.42-5.85 4.03-12.99 1.41-6.27 2.32-9.33 3.98-12.48a17.31 17.31 0 0 1 9.7-8.66c7.7-2.83 14.1-2.84 22.3-.75 1.12.29 2.28.61 3.68 1.03l3.73 1.11c8.47 2.54 13.66 3.58 20.46 3.58 8.59 0 14.67-.75 36.18-4a414.64 414.64 0 0 1 24.41-3.17c5.88-.54 11.29-.83 16.41-.83 26.3 0 54.45-12.58 65.59-28.78 3.42-4.98 5.5-12.06 6.46-20.7.84-7.74.73-16.02.02-23.9a136.2 136.2 0 0 0-.57-5.12c0-4.47-.3-6.94-2.16-17zM18.88 0h1.03C18 7.57 17.15 10.18 14.46 16.2c-1.95 4.37-2.67 9.19-2.42 14.89.2 4.33.71 7.7 2.28 16.13 1.09 5.88 1.57 8.77 1.94 12.2.96 8.9.24 16.08-2.8 22.79A463.4 463.4 0 0 1 0 109.43v-2.12a465 465 0 0 0 12.54-25.52c2.97-6.52 3.67-13.53 2.72-22.27-.36-3.4-.84-6.26-1.93-12.12-1.57-8.47-2.1-11.88-2.29-16.27-.26-5.84.48-10.81 2.5-15.33 2.64-5.9 3.48-8.47 5.34-15.8zm280.47 0a70.78 70.78 0 0 1-4.91 11.24c-2.56 4.7-4.01 8.45-4.86 11.98l-.4 1.8-.28 1.45a5.28 5.28 0 0 1-.74 2.07c-.74 1.03-1.93 1.28-5.13 1.25.92 0-9.85-.29-15.03-.29-10.2 0-18.45.82-29.46 2.56-16.87 2.66-17.73 2.77-23.66 2.52a42.57 42.57 0 0 1-8-1.09c-17.7-4.16-46.18-5.86-54.72-3.01-2.72.9-5.88 2.8-9.52 5.59a112.37 112.37 0 0 0-6.54 5.48c-1.4 1.25-9.17 8.5-10.78 9.84-1.45 1.2-8.18 7.42-8.85 8.02a114.65 114.65 0 0 1-4.55 3.9c-4.99 4.03-8.9 6.2-11.92 6.2-3.52.05-4.32 0-5.14-.4-1.13-.56-1.5-1.72-1.13-3.57.74-3.63 4.47-10.84 12.84-24.8 5.69-9.48 9.42-18 11.78-26.2 1.45-5.04 1.94-7.4 2.97-14.54h1.01c-1.05 7.3-1.54 9.7-3.01 14.82-2.39 8.28-6.16 16.89-11.9 26.44-8.3 13.84-12 21.01-12.7 24.48-.3 1.45-.08 2.14.59 2.47.6.3 1.35.35 3.48.3 3.92 0 7.69-2.1 12.5-5.98a114.6 114.6 0 0 0 4.51-3.86c.66-.59 7.41-6.83 8.88-8.05 1.59-1.33 9.34-8.55 10.75-9.82 2.4-2.15 4.55-3.96 6.6-5.53 3.72-2.85 6.97-4.8 9.81-5.74 8.76-2.92 37.41-1.22 55.27 2.99 2.57.6 5.14.95 7.81 1.06 5.84.25 6.7.14 23.47-2.51 11.05-1.75 19.36-2.57 29.6-2.57 5.2 0 15.99.3 15.05.29 2.87.03 3.84-.17 4.3-.83.23-.32.4-.8.58-1.7l.28-1.43.4-1.85c.88-3.6 2.36-7.44 4.96-12.22A69.5 69.5 0 0 0 298.29 0h1.06zm-8.59 0c-5.91 17.94-9.55 22-19.76 22-4.5 0-10.22.32-28.69 1.5l-1.53.1c-15.6.99-23.47 1.4-28.78 1.4-5.35 0-13.24-.96-28.86-3.28l-1.54-.23C163.18 18.75 157.47 18 153 18c-4.45 0-7.3 1.01-10.96 3.34-.1.06-1.8 1.17-2.3 1.47-2.43 1.5-4.32 2.19-6.74 2.19-2.8 0-4.11-1.46-4.11-4.22 0-1.04.16-2.29.5-4.1.16-.82.9-4.4 1.07-5.32.8-4.11 1.3-7.68 1.47-11.36h2c-.17 3.82-.68 7.5-1.5 11.75-.19.94-.92 4.5-1.07 5.31a21.04 21.04 0 0 0-.47 3.72c0 1.7.46 2.22 2.11 2.22 1.99 0 3.55-.57 5.7-1.9.47-.28 2.15-1.37 2.26-1.44C144.92 17.14 148.12 16 153 16c4.62 0 10.3.74 28.9 3.51l1.53.23C198.93 22.04 206.8 23 212 23c5.25 0 13.11-.41 28.65-1.4l1.54-.1C260.73 20.32 266.43 20 271 20c8.95 0 12.15-3.4 17.66-20h2.1zM141.51 0h1.13c-2.06 3.86-2.63 5.1-2.77 6.19-.15 1.12.42 1.64 2.32 1.96 1.8.3 3.85.35 10.81.35 6.02 0 13 .56 21.35 1.62 3.95.5 8.03 1.1 13.13 1.89 24 3.7 22.5 3.49 26.83 3.49 24.02 0 51.83-2.24 60.45-6.94 2.88-1.57 5.05-4.49 6.6-8.56h1.07c-1.64 4.47-3.98 7.69-7.2 9.44-8.83 4.82-36.67 7.06-60.92 7.06-4.41 0-2.84.22-26.98-3.5-5.1-.8-9.17-1.38-13.1-1.88-8.31-1.06-15.26-1.62-21.23-1.62-7.04 0-9.1-.05-10.97-.37-2.38-.4-3.38-1.32-3.15-3.07.16-1.22.69-2.41 2.63-6.06zm76.4 0c5.69 1.64 10.37 2.5 14.09 2.5 9.59 0 16.7-.71 22.4-2.5h2.98C251.12 2.53 243.2 3.5 232 3.5c-4.5 0-10.32-1.21-17.53-3.5h3.45zM70.69 0c-2.87 3.27-6.95 5.39-12.02 6.53-3.98.89-7.5 1.08-12.92 1A97.24 97.24 0 0 0 44 7.5c-5.37 0-8.86-1.24-10.1-4.97A8.6 8.6 0 0 1 33.5 0h.99c.02.82.14 1.56.36 2.22C35.91 5.39 39.02 6.5 44 6.5l1.76.02c5.35.09 8.8-.1 12.69-.97C62.95 4.54 66.63 2.74 69.3 0h1.37zM0 207.87c7.31-.16 11.5 3.33 11.5 11.13 0 11.41-5.05 28.35-11.5 41.5v-2.3c5.93-12.72 10.5-28.47 10.5-39.2 0-7.18-3.7-10.3-10.5-10.13v-1zm0 7.05c1.23.14 2.18.58 2.87 1.31 1.4 1.48 1.6 3.72 1.16 7.58l-.16 1.3A28.93 28.93 0 0 0 3.5 229c0 3.2-1.48 9.52-3.5 15.9v-3.45c1.49-5.13 2.5-9.87 2.5-12.45 0-.98.08-1.75.37-4.02l.16-1.29c.42-3.56.24-5.59-.88-6.77-.5-.53-1.21-.87-2.15-1v-1zM0 410.9v-1.47a21.67 21.67 0 0 0 2.97-4.7c1.32-2.7 2.68-6.28 4.56-11.89 7.85-23.55 7.83-26.6.25-30.4-2.25-1.12-4.8-1.43-7.78-.91v-1.02a13.1 13.1 0 0 1 8.22 1.04c8.24 4.12 8.26 7.6.25 31.6-1.88 5.66-3.25 9.27-4.6 12.02A20.82 20.82 0 0 1 0 410.9zM33.64 452c1.68 0 3.04-.23 8.34-1.31l2.38-.47c8.26-1.57 12.72-1.3 14.53 2.33 1.38 2.75-.47 5.86-4.75 9.68a75.6 75.6 0 0 1-5.08 4.07c-.94.7-4.89 3.59-5.79 4.27-1.86 1.4-2.97 2.37-3.47 3.03a19.08 19.08 0 0 0-2.89 5.5c.07-.2-4.02 13.65-6.96 22.22-2.7 7.85-5.56 10.72-8.82 8.59-2.11-1.4-3.66-4.24-6.6-11.03-1.98-4.62-2.5-5.76-3.4-7.4-4.55-8.18-3.9-23.9-.05-32.87a9.6 9.6 0 0 1 6.98-5.96c2.59-.66 4.86-.75 11.78-.67l3.8.02zm0 2c-1.13 0-2.09 0-3.82-.02-12.07-.13-14.83.57-16.9 5.41-3.63 8.47-4.26 23.55-.05 31.12.96 1.73 1.48 2.88 3.5 7.58 2.72 6.3 4.24 9.08 5.86 10.14 1.64 1.08 3.5-.8 5.82-7.55a682.9 682.9 0 0 0 6.97-22.24 21.03 21.03 0 0 1 3.18-6.04c.65-.87 1.85-1.9 3.86-3.43.92-.7 4.87-3.57 5.8-4.27 2.02-1.5 3.6-2.77 4.95-3.97 3.63-3.23 5.09-5.7 4.3-7.28-1.21-2.42-5.07-2.65-12.38-1.27l-2.35.47c-5.49 1.11-6.86 1.35-8.74 1.35zm345.63 146c-3.45-12.26-3.77-14.13-3.77-19 0-3.33-.13-6.27-.43-11.34-.63-10.33-.65-13.5.26-17.07 1.21-4.74 4.21-7.1 9.67-7.1h26c4.08 0 5.19 1.85 5.93 7.11.1.79.13.97.19 1.32.84 5.35 2.8 7.58 8.88 7.58 3.64 0 5.54.4 6.43 1.37.76.83.76 1.44.36 3.93-.85 5.26.5 8.85 7.5 13.8 6.32 4.45 11.63 5.36 16.55 3.37 3.8-1.54 6.73-4.16 11.92-10l1.1-1.23 1.09-1.23a75.6 75.6 0 0 1 2.7-2.86 35.81 35.81 0 0 1 9.57-6.73c1.52-.76 1.72-.86 5.66-2.63 6.1-2.73 9.01-4.5 11.74-7.62 2.63-3 4.67-4.85 6.7-6.04 3.18-1.85 5.46-2.13 13.68-2.13 5.98 0 10.56-4.32 18-14.99l2.82-4.03c1.06-1.5 1.94-2.7 2.79-3.79 7.87-10.12 19.38-10.4 30.74.96 5.54 5.53 10.17 19.43 13.64 38.51 2.5 13.75 4.18 29.46 4.47 39.84h-1c-.3-10.32-1.96-25.97-4.45-39.66-3.43-18.87-8.02-32.65-13.36-37.99-10.95-10.95-21.76-10.68-29.26-1.04-.83 1.07-1.7 2.26-2.75 3.75l-2.81 4.02c-7.65 10.95-12.38 15.42-18.83 15.42-8.04 0-10.21.26-13.17 2-1.92 1.12-3.9 2.9-6.45 5.83-2.86 3.26-5.87 5.09-12.09 7.88a103.35 103.35 0 0 0-5.62 2.6 34.84 34.84 0 0 0-9.32 6.54 74.67 74.67 0 0 0-3.75 4.05l-1.1 1.24c-5.28 5.95-8.29 8.64-12.28 10.25-5.26 2.13-10.92 1.17-17.5-3.48-7.33-5.17-8.82-9.15-7.92-14.77.34-2.12.34-2.6-.1-3.1-.64-.69-2.34-1.04-5.7-1.04-6.63 0-8.96-2.63-9.87-8.42l-.2-1.34c-.67-4.82-1.53-6.24-4.93-6.24h-26c-5 0-7.6 2.04-8.7 6.34-.88 3.43-.85 6.57-.23 16.76a177 177 0 0 1 .43 11.4c0 4.78.32 6.63 3.81 19h-1.04zm13.68 0c-1.31-6.58-1.61-10.71-1.36-14.84.04-.7.1-1.44.18-2.38l.23-2.56c.34-3.81.5-6.97.5-11.22 0-4.94 1.46-7.76 4.21-8.42 2.38-.58 5.56.54 9.2 3 6.64 4.52 13.99 13.07 16.55 19.23 4.77 11.44 14.12 15.69 33.54 15.69 8.6 0 14.32-2.35 20.67-7.88 1.45-1.26 15.06-15 21-20 7.21-6.07 11.77-7.59 20.62-8.32 5.52-.45 7.98-.9 11.44-2.36 4.58-1.95 9.36-5.48 14.9-11.29 7.43-7.76 13.25-8.92 17.47-4.3 3.32 3.63 5.46 10.58 6.82 20.24.73 5.17.94 7.74 1.58 17.38.25 3.75.17 5.32-.92 18.03h-1c1.09-12.7 1.17-14.28.92-17.97-.64-9.6-.85-12.16-1.57-17.3-1.33-9.47-3.43-16.27-6.56-19.7-3.76-4.11-8.93-3.08-16 4.32-5.65 5.9-10.54 9.5-15.25 11.5-3.58 1.53-6.13 1.99-11.6 2.44-8.8.72-13.17 2.18-20.2 8.1-5.9 4.96-19.5 18.7-21 19.99-6.52 5.68-12.47 8.12-21.32 8.12-19.78 0-29.5-4.42-34.46-16.3-2.49-5.97-9.71-14.38-16.2-18.79-3.42-2.32-6.36-3.35-8.4-2.86-2.2.53-3.44 2.92-3.44 7.45 0 4.28-.16 7.47-.5 11.31l-.23 2.56c-.09.93-.14 1.65-.19 2.35-.24 4.08.06 8.18 1.39 14.78h-1.02zm113.75 0c2.52-3.26 8.93-11.79 10.9-14.3 5.48-6.98 13.05-12.38 19.4-13.94 7.01-1.71 11.5 1.45 11.5 9.24 0 4.02-.04 5.16-.74 19h-1c.7-13.85.74-15 .74-19 0-7.12-3.86-9.83-10.26-8.26-6.11 1.5-13.5 6.77-18.85 13.57-1.86 2.36-7.65 10.07-10.43 13.69h-1.26zm-9.86-338.96c3.44 2.71 7 5.1 11.44 7.75 1.06.64 8.42 4.9 10.35 6.1 11.27 7 15 13.35 12.35 25.33-1.45 6.52-4.53 11.1-9.39 14.44-3.83 2.63-8.07 4.26-16.08 6.56-11.97 3.45-13.68 3.99-18.82 6.28a60.18 60.18 0 0 0-7.81 4.18c-11.11 7.07-19.1 7.7-27.96 3.28-3.56-1.77-17.2-11-17.2-11.01a101.77 101.77 0 0 0-5.2-3.07c-16.04-8.83-34.27-24.16-34.52-31.85-.11-3.46 1.99-6.57 6.28-10.26 1.03-.9 2.18-1.81 3.68-2.95.72-.55 3.38-2.56 3.94-3 4.47-3.4 7.18-5.79 9.32-8.45 11.12-13.82 26.55-28.68 34.36-32.28 12.06-5.54 19.84-5.77 27.37.12 3.25 2.54 5.65 6.54 8.58 13.35.29.65 2.3 5.45 2.88 6.74 1.62 3.65 2.9 5.8 4.24 6.94.72.6 1.45 1.2 2.2 1.8zm-3.49-.28c-1.63-1.39-3.03-3.74-4.77-7.65-.58-1.3-2.6-6.12-2.88-6.76-2.81-6.5-5.08-10.3-7.98-12.56-6.83-5.35-13.85-5.15-25.3.12-7.45 3.42-22.7 18.12-33.64 31.72-2.27 2.82-5.08 5.3-9.67 8.79l-3.94 2.98a79.98 79.98 0 0 0-3.59 2.88c-3.87 3.33-5.67 6-5.58 8.69.21 6.64 18.14 21.72 33.48 30.15 1.76.97 3.5 2 5.3 3.13.12.08 13.61 9.22 17.03 10.92 8.22 4.1 15.46 3.52 26-3.18a62.17 62.17 0 0 1 8.07-4.31c5.25-2.35 7-2.9 19.08-6.38 7.8-2.24 11.9-3.82 15.5-6.3 4.44-3.04 7.23-7.18 8.56-13.22 2.44-11.02-.83-16.6-11.45-23.2-1.9-1.18-9.23-5.42-10.32-6.08-4.5-2.69-8.13-5.12-11.64-7.9-.77-.6-1.52-1.21-2.26-1.84zM87.72 241.6c4.3-2.98 7.88-5 12.14-6.95.84-.4 1.73-.78 2.78-1.24l4.37-1.88a164.3 164.3 0 0 0 17.74-8.96 320.67 320.67 0 0 1 27.87-14.5c4.22-1.95 21.89-9.84 21.17-9.52 19.17-8.62 28.1-6.93 49.5 8.05 7.91 5.54 13.24 13.25 16.45 22.66 3.02 8.83 3.76 16.51 3.76 27.75 0 8.32-.66 12.95-3.68 18.97-4.18 8.36-12.3 16.14-25.58 23.47-24.45 13.49-38.83 27.55-52.83 47.84-8.83 12.8-47.76 44.21-65.16 54.15C75.04 413.55 48.89 423.5 31 423.5c-10.05 0-14.67-4.78-14.76-13.37-.07-6.32 2.06-13.73 6.3-24.32 2.95-7.37 2.02-12.9-2.16-22.29-3.19-7.17-3.88-9.14-3.88-12.52 0-3.35 1.87-6.9 5.52-11.07 2.61-3 3.5-3.83 11.9-11.5 5.09-4.66 8.08-7.6 10.7-10.75 9.46-11.36 12.62-19.47 17.9-44.78 3.12-15.05 6.63-20.28 15.12-25.25.8-.47 3.95-2.25 4.7-2.68a76.66 76.66 0 0 0 5.38-3.38zm.56.82a77.63 77.63 0 0 1-5.44 3.43l-4.7 2.67c-8.23 4.82-11.57 9.81-14.65 24.6-5.3 25.45-8.51 33.7-18.1 45.21-2.66 3.19-5.68 6.16-10.8 10.84-8.36 7.64-9.24 8.48-11.82 11.42-3.5 4.01-5.27 7.36-5.27 10.42 0 3.18.68 5.1 3.8 12.12 4.27 9.6 5.24 15.37 2.16 23.07-4.18 10.47-6.29 17.78-6.22 23.93.08 8.06 4.26 12.38 13.76 12.38 17.67 0 43.68-9.9 64.75-21.93 17.28-9.88 56.1-41.2 64.84-53.85 14.08-20.42 28.57-34.59 53.17-48.16 13.12-7.23 21.09-14.87 25.17-23.03 2.92-5.86 3.57-10.35 3.57-18.53 0-11.13-.74-18.73-3.7-27.43-3.15-9.22-8.36-16.75-16.09-22.16-21.13-14.8-29.7-16.42-48.5-7.95.7-.32-16.96 7.56-21.17 9.5-1.7.8-3.3 1.55-4.86 2.3a319.68 319.68 0 0 0-22.93 12.17 165.3 165.3 0 0 1-17.85 9.01l-4.37 1.88c-1.04.45-1.92.84-2.76 1.23a74.56 74.56 0 0 0-11.99 6.86zm-7.6 12.2c7.7-6.25 12.3-8.17 23.68-11.27 6.12-1.67 9.12-2.95 12.31-5.72 3.8-3.3 7.47-4.52 15.86-6.1 2.75-.52 3.67-.7 5.06-1.02 5.48-1.24 9.48-2.93 13.1-5.89 10.42-8.53 25.4-14.11 36.31-14.11 5.33 0 16.77 7.58 25.74 17.16 10.73 11.46 15.96 23.27 12.73 32.5-3.18 9.1-11.39 18.57-23.03 27.86-8.44 6.73-18.36 13-25.22 16.43-3.72 1.86-6.59 4.88-9.77 9.99-.69 1.1-11.1 20.25-16.03 27.83-5.62 8.65-15.4 17.36-30.23 27.96a552.58 552.58 0 0 1-9.2 6.42c-.13.09-6.81 4.65-8.6 5.89-6.47 4.46-10.35 7.35-13.05 9.83-11.64 10.67-37.14 15.54-43.7 8.98-1.96-1.96-2.2-4.06-1.95-10.52.37-9.42-.5-14.5-4.95-20.51a34.09 34.09 0 0 0-7.04-6.92c-3.93-2.95-6.07-6.11-6.56-9.49-.97-6.61 3.87-13.06 14.17-21.69 1.58-1.32 6.67-5.44 7.09-5.78a48.03 48.03 0 0 0 5.23-4.77c4.1-4.63 5.85-9.55 7.8-20.07a501.52 501.52 0 0 0 .8-4.37c.33-1.87.6-3.3.88-4.73.74-3.78 1.5-7.18 2.4-10.63 1-3.78 1.38-5.5 2.36-10.37.6-3.02.93-4.21 1.56-5.47 1.22-2.45 1.27-2.5 12.25-11.42zm.64.78c-10.77 8.74-10.88 8.84-12 11.08-.58 1.16-.88 2.3-1.47 5.22-.98 4.89-1.36 6.63-2.37 10.44-.9 3.43-1.65 6.8-2.39 10.56a339.79 339.79 0 0 0-1.29 6.95l-.39 2.15c-1.98 10.68-3.77 15.74-8.04 20.54a48.77 48.77 0 0 1-5.34 4.88c-.42.34-5.5 4.47-7.07 5.78-10.04 8.4-14.72 14.65-13.83 20.78.45 3.1 2.44 6.03 6.17 8.83 3 2.25 5.39 4.62 7.24 7.12 4.63 6.24 5.52 11.52 5.15 21.15-.25 6.14-.01 8.1 1.66 9.78 6.1 6.1 31.02 1.33 42.31-9.02 2.75-2.52 6.66-5.43 13.16-9.92l8.6-5.89c3.63-2.48 6.45-4.44 9.19-6.4 14.73-10.54 24.44-19.18 29.97-27.7 4.9-7.54 15.31-26.68 16.02-27.8 3.27-5.26 6.26-8.41 10.18-10.37 6.79-3.4 16.65-9.63 25.03-16.32 11.52-9.18 19.61-18.53 22.72-27.4 3.07-8.78-2.02-20.27-12.52-31.49-8.8-9.4-20.04-16.84-25.01-16.84-10.67 0-25.43 5.5-35.68 13.89-3.76 3.07-7.9 4.81-13.5 6.09-1.41.32-2.35.5-5.11 1.02-8.21 1.55-11.76 2.73-15.38 5.88-3.34 2.9-6.45 4.22-12.7 5.92-11.26 3.07-15.75 4.94-23.31 11.09zM212 251.85c0 7.56-.6 10.92-2.6 14.3-1.1 1.84-7.66 10.05-8.6 11.3-5.96 7.94-9.33 10.28-17.26 13.76-1.34.58-2.2 1-3.03 1.5-.55.33-1.2.66-2 1.02-.71.33-4.46 1.9-5.52 2.39-6.05 2.78-8.99 5.8-8.99 10.73 0 10.97-18.95 36.12-34.51 44.87-8.18 4.6-21.3 9.36-32.78 11.86-13.33 2.9-22.49 2.48-24.62-2.32-1.32-2.97-4.4-4.26-11.98-5.81l-.6-.12c-4.84-.99-6.94-1.55-9.03-2.64-2.92-1.5-4.48-3.7-4.48-6.84 0-2.74 1.08-5.77 3.25-9.67.85-1.53 1.82-3.13 3.23-5.35-.16.25 2.83-4.4 3.67-5.76 6.69-10.7 9.85-18.5 9.85-27.22 0-18.41 11.22-33.37 27.5-42.86 5.22-3.05 9.23-3.31 15.2-2.12 5.04 1 6.05.9 7.43-1.52 4.5-7.85 7.04-9.5 15.87-9.5 3.93 0 6.97-.98 10.47-3.16 1.56-.97 8.67-6.17 10.99-7.68 9.2-5.98 11.34-7 25.2-11.95 6.95-2.48 15.18 1.28 22.33 9.12 6.55 7.19 11.01 16.61 11.01 23.67zm-2 0c0-6.5-4.25-15.48-10.49-22.32-6.67-7.32-14.16-10.74-20.17-8.59-13.73 4.9-15.73 5.85-24.8 11.75-2.24 1.46-9.37 6.68-11.01 7.7-3.8 2.36-7.2 3.46-11.53 3.46-8.08 0-9.98 1.23-14.13 8.5-1.1 1.91-2.51 2.88-4.35 3.09-1.3.14-1.9.05-5.22-.61-5.53-1.1-9.07-.88-13.8 1.88-15.72 9.17-26.5 23.55-26.5 41.14 0 9.2-3.28 17.29-10.15 28.28l-3.68 5.77c-1.39 2.19-2.35 3.77-3.17 5.25-2.02 3.63-3 6.38-3 8.7 0 4.19 2.87 5.67 11.9 7.52l.61.12c8.27 1.7 11.7 3.13 13.4 6.95 3.17 7.14 36 0 54.6-10.46 14.98-8.43 33.49-32.99 33.49-43.13 0-5.9 3.47-9.48 10.16-12.55 1.1-.5 4.85-2.08 5.52-2.38.74-.34 1.32-.64 1.8-.93.92-.55 1.85-1 3.25-1.62 7.65-3.35 10.75-5.5 16.47-13.12 1.02-1.36 7.47-9.42 8.47-11.11 1.79-3.01 2.33-6.06 2.33-13.3zm-37.18-22.4c.15-.1 2.4-1.51 2.95-1.84.96-.57 1.7-.94 2.43-1.17 2.57-.83 5.06-.1 11.04 3.12 14.86 8 19.43 22.87 9.18 38.71-4.04 6.24-9.37 9-18.72 11.11-.85.2-1.2.27-3.13.68-6.04 1.29-8.78 2.08-11.6 3.65-3.63 2.02-6.09 4.98-7.5 9.44-7.87 24.93-19.72 43.34-36.28 50.31-16.45 6.93-21.13 8.53-27.98 8.89-4.94.25-9.8-.65-15.4-2.89a44.45 44.45 0 0 1-5.64-2.6c-4.02-2.33-5.14-4.74-4.5-9.31.3-2.13 3.77-15.53 4.84-20.65.63-3.05 1.19-6.14 1.75-9.69a464.04 464.04 0 0 0 1.35-8.9c1.42-9.41 2.5-14.27 4.49-18.65 2.46-5.43 6.13-9.03 11.72-11.13 6.59-2.47 10.54-3.1 18.03-3.53 4.75-.27 6.68-.64 9-2.05.61-.37 1.22-.81 1.82-1.33a30.61 30.61 0 0 0 3.37-3.4c.59-.69 2.38-2.9 2.63-3.19 3.36-4 6.3-5.53 12.33-5.53 3.94 0 5.9-.92 8.18-3.36-.17.18 2.75-3.14 3.85-4.22a30.95 30.95 0 0 1 6.79-5c1.5-.83 3.15-1.62 4.99-2.38a64.92 64.92 0 0 0 10.01-5.1zm-14.52 8.34a29.95 29.95 0 0 0-6.57 4.84 116.68 116.68 0 0 0-3.82 4.2c-2.46 2.63-4.68 3.67-8.91 3.67-5.72 0-8.39 1.39-11.57 5.17-.23.28-2.03 2.5-2.63 3.2a31.6 31.6 0 0 1-3.47 3.51c-.65.55-1.3 1.03-1.96 1.43-2.5 1.51-4.55 1.9-9.47 2.19-7.39.42-11.25 1.04-17.72 3.47-5.34 2-8.82 5.4-11.17 10.6-1.93 4.27-3 9.07-4.41 18.39l-.65 4.34-.7 4.57c-.57 3.56-1.12 6.67-1.76 9.73-1.08 5.18-4.54 18.53-4.83 20.59-.59 4.17.35 6.18 4.01 8.3 1.35.77 3.1 1.58 5.52 2.55 5.46 2.18 10.18 3.05 14.97 2.8 6.69-.34 11.32-1.93 27.65-8.8 16.21-6.83 27.92-25.01 35.71-49.7 1.49-4.7 4.12-7.86 7.97-10 2.93-1.63 5.74-2.45 11.87-3.76 1.92-.4 2.28-.49 3.12-.68 9.12-2.06 14.24-4.7 18.1-10.67 9.92-15.34 5.55-29.55-8.82-37.29-5.75-3.1-8.03-3.76-10.25-3.05-.65.2-1.33.54-2.23 1.08-.55.32-2.77 1.72-2.93 1.82a65.91 65.91 0 0 1-10.16 5.17c-1.8.75-3.42 1.52-4.89 2.33zm-42.39 32.72c16.15-2.87 26.36-.97 32.47 6.16 5.08 5.93 1.13 21.42-5.93 35.55-4.79 9.58-10.6 16.21-23.16 25.19-14.15 10.1-35.5 12.2-40.71 3.85-1.86-2.97-2.1-8.14-1.06-15.73.78-5.68 1.86-10.71 4.73-22.98l.12-.51c1.59-6.8 2.37-10.31 3.14-14.14 1.45-7.25 3.74-11.47 7.26-13.74 2.81-1.8 5.53-2.28 12.33-2.62 5.33-.27 7.56-.46 10.81-1.03zm.18.98c-3.3.59-5.56.78-10.94 1.05-6.62.33-9.23.78-11.84 2.46-3.25 2.1-5.42 6.09-6.82 13.1-.77 3.84-1.56 7.35-3.15 14.17l-.12.5c-2.86 12.24-3.93 17.26-4.7 22.9-1.03 7.36-.79 12.36.9 15.07 4.82 7.7 25.54 5.67 39.29-4.15 12.43-8.88 18.13-15.39 22.84-24.81 6.86-13.72 10.75-29 6.07-34.45-5.84-6.81-15.7-8.65-31.53-5.84zM132 276.5c7.12 0 10.66 3.08 11.25 8.7.42 4.02-.43 8.14-2.77 15.94-2.56 8.52-18.36 25.38-27.2 31.28-7.01 4.67-20.02 5.67-26.57.99-3.99-2.85-3.53-12.08.02-26.46.68-2.75 1.47-5.65 2.37-8.76a412.6 412.6 0 0 1 3.05-10.14l.37-1.2c1.48-4.8 5.1-7.75 10.73-9.27 4.4-1.2 9.54-1.5 17.48-1.33l3.89.1c3.87.11 5.42.15 7.38.15zm0 1c-1.97 0-3.53-.04-7.41-.15l-3.88-.1c-7.85-.17-12.92.13-17.2 1.3-5.32 1.43-8.67 4.16-10.03 8.6a1277.83 1277.83 0 0 1-1.6 5.21c-.68 2.2-1.27 4.17-1.82 6.1-.9 3.1-1.68 5.99-2.36 8.73-3.43 13.88-3.87 22.93-.4 25.4 6.17 4.42 18.73 3.45 25.42-1 8.66-5.78 24.33-22.49 26.8-30.73 2.3-7.67 3.14-11.71 2.73-15.56-.53-5.1-3.64-7.8-10.25-7.8zm-17.79 7a31.3 31.3 0 0 1 8.57 1.4c5.42 1.78 8.72 5.03 8.72 10.1 0 9.59-9.51 17.2-22.34 21.47-9.82 3.28-13.62-1.79-11.66-16.54.84-6.28 3.82-10.67 8.24-13.46a20.38 20.38 0 0 1 8.47-2.97zm-.6 1.08a19.39 19.39 0 0 0-7.34 2.73c-4.18 2.64-6.98 6.78-7.77 12.76-1.89 14.11 1.36 18.45 10.34 15.46C121.3 312.37 130.5 305 130.5 296c0-4.56-2.98-7.5-8.03-9.15a28.05 28.05 0 0 0-8.2-1.35c-.13 0-.35.03-.66.08zm80.87-23.45c-2.72 9.8-14.93 9.86-26.72 3.3-10.17-5.64-13.8-17.98-5-22.87a66.53 66.53 0 0 0 4.48-2.7l2.03-1.3a50.15 50.15 0 0 1 3.92-2.3c4.73-2.43 8.82-2.8 14-.72 9.16 3.66 10.98 13.33 7.3 26.6zm-20.83-24.98a49.26 49.26 0 0 0-3.84 2.25l-2.03 1.3c-.84.53-1.5.95-2.16 1.35-.82.5-1.6.96-2.38 1.39-7.94 4.4-4.59 15.8 5 21.12 11.31 6.29 22.8 6.23 25.28-2.7 3.57-12.83 1.85-21.97-6.7-25.4-4.9-1.95-8.69-1.62-13.17.7zm17.85 12.15c0 5.7-2.44 9-6.64 9.96-3.3.76-7.56-.05-11.08-1.81l-1.89-.94c-.67-.34-1.18-.62-1.63-.88-4.07-2.38-4.13-4.97.34-10.93 6.8-9.06 20.9-7.16 20.9 4.6zm-1 0c0-5.3-2.87-8.55-7.32-9.16-4.23-.57-8.99 1.44-11.78 5.16-4.15 5.54-4.1 7.44-.64 9.47.44.25.93.51 1.59.85l1.87.93c3.34 1.67 7.36 2.44 10.42 1.74 3.73-.86 5.86-3.74 5.86-9zm196.5 281c0-12.8 2.44-16.74 18.48-29.77a56.8 56.8 0 0 1 7.61-5.2c2.6-1.5 5.33-2.82 8.5-4.18 1.24-.53 2.48-1.05 4.1-1.7l3.92-1.57c9.4-3.83 13.74-6.7 16.62-12.05 1.2-2.22 2.21-4.4 3.23-6.83a148.57 148.57 0 0 0 1.54-3.84l.3-.74.56-1.44c3.2-8.02 6.05-12.08 12.7-16.5a35.26 35.26 0 0 0 4.96-4 46.36 46.36 0 0 0 3.88-4.29c.27-.34 2.55-3.2 3.2-3.98 3.48-4.15 6.51-5.9 11.51-5.9 3.08 0 5.62-.63 9.57-2.1 5.42-2.02 6.53-2.34 8.96-2.2 2.53.13 4.85 1.26 7.18 3.59 1.3 1.3 5.55 5.83 6.52 6.78 5.06 5 9.44 6.92 17.77 6.92a197.5 197.5 0 0 1 12.08.45c15.93.87 21.94.57 25.28-2.21 6.91-5.77 11.64-2.73 11.64 7.76 0 10.73-8.6 20-19 20-4.8 0-8.32 1.43-9.34 3.67-1.12 2.48.68 6.15 5.98 10.57 13.6 11.33 11.24 20.76-7.64 20.76a21.91 21.91 0 0 0-14.6 5.24c-3.28 2.71-5.8 5.86-9.85 11.82l-1.52 2.25c-3.1 4.57-5.01 7.1-7.32 9.4-6.21 6.21-9.3 7.64-13.05 6.89l-1-.23a10.82 10.82 0 0 0-2.66-.37c-1.6 0-2.41.67-8.18 6.22-4.85 4.67-8.07 6.78-11.82 6.78-1.33 0-3.46 1.15-6.45 3.45-1.27.98-2.68 2.14-4.5 3.7l-4.92 4.29a181.11 181.11 0 0 1-4.54 3.82c-9.33 7.56-15.63 10.2-20.21 6.52-2.7-2.15-4.14-4.51-4.63-7.26-.37-2.04-.26-3.63.29-7.3.87-5.85.65-8.42-1.83-11.6-2.32-2.98-2.96-3.22-3.77-2.39-.25.26-1.35 1.63-1.61 1.94-2.21 2.5-4.85 3.57-9 2.82-4.6-.84-5.57-4.11-4.72-10.09l.24-1.56c.6-3.66.68-4.93.25-5.8-.44-.86-1.9-.94-5.23.4l-.74.29c-13.78 5.54-15.26 6.09-19.43 6.67-6.03.84-9.31-1.6-9.31-7.9zm2 0c0 5 2.14 6.6 7.04 5.92 3.91-.55 5.43-1.1 18.95-6.55l.75-.3c4.17-1.66 6.7-1.54 7.76.58.71 1.43.62 2.76-.06 7l-.24 1.53c-.72 5.04-.06 7.27 3.09 7.84 3.43.62 5.38-.17 7.15-2.18.2-.23 1.34-1.66 1.68-2 1.9-1.96 3.82-1.25 6.78 2.55 2.9 3.74 3.17 6.77 2.22 13.12-1 6.75-.52 9.4 3.62 12.71 3.49 2.8 9.1.45 17.7-6.51 1.35-1.1 2.75-2.28 4.49-3.78l4.93-4.3c1.84-1.58 3.27-2.76 4.58-3.77 3.34-2.56 5.74-3.86 7.67-3.86 3.04 0 5.95-1.9 10.43-6.22l2.46-2.39c.94-.89 1.67-1.56 2.37-2.13 1.81-1.49 3.3-2.26 4.74-2.26 1.03 0 1.81.13 3.1.42.7.16.71.17.96.21 2.96.6 5.45-.55 11.23-6.33 2.2-2.2 4.06-4.65 7.09-9.11l1.52-2.25c4.15-6.11 6.76-9.37 10.22-12.24a23.9 23.9 0 0 1 15.88-5.7c16.87 0 18.62-7.01 6.36-17.23-5.9-4.92-8.12-9.41-6.52-12.93 1.42-3.12 5.67-4.84 11.16-4.84 9.25 0 17-8.34 17-18 0-8.94-2.88-10.79-8.36-6.23-3.94 3.28-9.98 3.59-26.67 2.68l-1.02-.06c-5.09-.27-7.99-.39-10.95-.39-8.88 0-13.76-2.14-19.18-7.5-1-.98-5.26-5.53-6.53-6.79-1.99-1.99-3.86-2.9-5.87-3-2.03-.12-3.06.18-8.15 2.07-4.15 1.55-6.9 2.22-10.27 2.22-4.33 0-6.84 1.46-9.98 5.2-.63.74-2.89 3.6-3.18 3.95a48.29 48.29 0 0 1-4.04 4.46 37.26 37.26 0 0 1-5.24 4.23c-6.26 4.17-8.9 7.91-11.95 15.58l-.57 1.43-.28.74a531.5 531.5 0 0 1-1.56 3.88 77.49 77.49 0 0 1-3.32 7c-3.16 5.88-7.82 8.97-17.63 12.96l-3.92 1.58c-1.6.64-2.84 1.15-4.05 1.67a79.2 79.2 0 0 0-8.3 4.08 54.8 54.8 0 0 0-7.35 5.02c-15.62 12.7-17.74 16.13-17.74 28.23zm133.22-79.76c3.06 1.53 6.54 2.02 10.68 1.7 2.53-.2 4.91-.62 8.8-1.49 5.36-1.19 6.33-1.38 8.33-1.54 2.78-.23 4.82.17 6.29 1.4 1.58 1.31 1.96 2.72 1.26 4.22-.66 1.38-1.05 1.74-5.05 5.07-3.53 2.93-5.03 4.83-5.03 7.09 0 7.3 1.29 10.02 7.83 15.62 3.86 3.3 5.93 6.84 5.28 9.62-.75 3.25-4.96 5.02-12.61 5.02-7.18 0-12.7 4.61-20.03 14.68-.5.7-3.96 5.57-4.94 6.87a38.89 38.89 0 0 1-4.72 5.5c-1.06.98-2.09 1.7-3.1 2.15-2.85 1.26-5.05 1.57-9.83 1.74-7.66.27-10.87 1.45-14.98 7.1-1.58 2.17-3.11 4-4.68 5.6a42.87 42.87 0 0 1-8.65 6.69c-.15.08-10.69 6.19-14.8 8.83-3.76 2.42-6.45 2.04-8.22-.77-1.28-2.03-1.9-4.54-2.87-10.35-.84-5.08-1.27-7.08-2.06-8.93-.97-2.3-2.21-3.24-4.02-2.88-6.2 1.24-8.95 1.39-10.98.2-2.37-1.4-3.13-4.62-2.62-10.73.16-1.96-1.04-2.87-3.76-3.04-2.24-.13-4.9.2-9.94 1.12l-.69.12c-7.97 1.45-10.72 1.72-12.72.73-2.91-1.43-1.6-5.27 4.23-12.21 5.48-6.53 10.6-10.81 15.76-13.53 3.74-1.97 5.94-2.65 12.16-4.1 7.29-1.72 10.4-3.51 14.04-9.31 2.96-4.75 10.74-18.62 12.14-20.84 3.59-5.67 6.8-9.1 11.05-11.34 2.6-1.38 4.72-2.82 9.17-6.07l1.38-1.01c7.85-5.72 12.3-7.98 17.68-7.98 4.22 0 6.49 1.36 9.13 4.77.34.43 1.67 2.22 2 2.67.85 1.09 1.6 1.98 2.45 2.83a24.29 24.29 0 0 0 6.64 4.78zm-.44.9c-2.8-1.4-5-3.03-6.92-4.97-.87-.9-1.65-1.81-2.51-2.93-.35-.46-1.68-2.25-2.01-2.67-2.47-3.18-4.46-4.38-8.34-4.38-5.09 0-9.4 2.2-17.09 7.78l-1.38 1.01c-4.49 3.29-6.63 4.74-9.3 6.15-4.06 2.15-7.16 5.45-10.66 11-1.39 2.19-9.16 16.05-12.15 20.82-3.79 6.07-7.13 7.98-14.66 9.75-6.13 1.45-8.27 2.1-11.92 4.02-5.04 2.66-10.05 6.86-15.46 13.3-5.43 6.46-6.53 9.69-4.55 10.66 1.7.84 4.48.57 12.1-.81l.7-.13c5.12-.93 7.82-1.27 10.17-1.12 3.21.2 4.92 1.48 4.7 4.11-.48 5.76.2 8.64 2.13 9.78 1.73 1.02 4.34.88 10.27-.31 2.35-.47 4 .78 5.14 3.47.83 1.95 1.27 4 2.07 8.8l.06.36c.94 5.65 1.55 8.11 2.72 9.98 1.46 2.3 3.52 2.6 6.84.46 4.14-2.66 14.69-8.77 14.81-8.85a41.9 41.9 0 0 0 8.46-6.54 47.89 47.89 0 0 0 4.6-5.48c4.32-5.95 7.81-7.23 15.74-7.5 4.66-.17 6.76-.47 9.46-1.67.9-.4 1.85-1.06 2.84-1.96a38.03 38.03 0 0 0 4.6-5.36c.96-1.3 4.4-6.16 4.93-6.87 7.5-10.31 13.22-15.09 20.83-15.09 7.24 0 11.02-1.6 11.64-4.24.54-2.32-1.36-5.55-4.97-8.64-6.75-5.79-8.17-8.79-8.17-16.38 0-2.67 1.64-4.74 5.39-7.86 3.8-3.17 4.23-3.56 4.78-4.73.5-1.06.25-1.99-.99-3.03-2.23-1.85-4.72-1.65-13.76.36-3.93.87-6.35 1.3-8.94 1.5-4.3.34-7.97-.18-11.2-1.8zm-28-3.9c5.65-2.82 8.96-2.2 12.9 1.37.56.5 2.6 2.47 3.02 2.87 4.2 3.89 8.07 5.71 14.3 5.71 11.37 0 14 1.41 16.1 8.09.26.83 1.35 4.6 1.66 5.62.8 2.63 1.64 5.03 2.7 7.6 2.13 5.17 2.64 8.32 1.72 10.24-.77 1.61-2.1 2.18-5.37 2.79-2.32.43-2.8.53-3.85.85-1.85.58-3.35 1.4-4.6 2.66-1 1-2.02 2.13-3.31 3.66-.6.71-2.91 3.5-3.46 4.14-7.2 8.54-12.43 12.35-19.59 12.35-3.76 0-6.95 1.28-10.59 4-1.84 1.37-11.62 10.31-15.22 13.06a73.09 73.09 0 0 1-8.95 5.88c-4.58 2.54-7.35 3.22-8.98 2.23-1.32-.8-1.65-2.07-1.94-5.5a52.53 52.53 0 0 0-.16-1.81c-.54-4.73-2.24-6.86-7.16-6.86-7.11 0-8.85-1.23-9.73-5.41-.96-4.61-2.1-6.7-6.55-9.67-3.97-2.65-4.31-5.42-1.52-8.22 2-2 4.63-3.5 11.35-6.87 6.61-3.3 9.2-4.8 11.1-6.68a39.09 39.09 0 0 0 5.3-6.48c.98-1.5 1.83-3.04 2.88-5.13l2.12-4.3c.91-1.83 1.72-3.37 2.61-4.98 5.74-10.32 10.37-14.78 23.22-21.2zm-22.34 21.7c-.89 1.59-1.69 3.12-2.6 4.94l-2.11 4.3a52.9 52.9 0 0 1-2.94 5.23 40.08 40.08 0 0 1-5.44 6.63c-2 2-4.62 3.51-11.35 6.87-6.6 3.3-9.2 4.8-11.1 6.69-2.33 2.34-2.08 4.37 1.38 6.67 4.7 3.14 5.96 5.46 6.97 10.3.78 3.7 2.09 4.62 8.75 4.62 5.5 0 7.57 2.57 8.15 7.75.06.5.09.82.17 1.84.25 3.06.55 4.17 1.46 4.72 1.2.74 3.69.13 7.98-2.25a72.09 72.09 0 0 0 8.82-5.8c3.55-2.7 13.34-11.65 15.24-13.07 3.79-2.83 7.18-4.19 11.18-4.19 6.77 0 11.8-3.67 18.83-12l3.45-4.13a60.07 60.07 0 0 1 3.37-3.72 11.72 11.72 0 0 1 5.01-2.91c1.1-.34 1.6-.45 3.97-.89 2.95-.55 4.07-1.02 4.65-2.23.76-1.59.28-4.5-1.74-9.43a84.46 84.46 0 0 1-2.74-7.69c-.31-1.03-1.4-4.8-1.66-5.61-1.95-6.2-4.16-7.39-15.14-7.39-6.5 0-10.61-1.93-14.98-5.98-.44-.4-2.46-2.37-3.01-2.86-3.65-3.3-6.52-3.85-11.79-1.21-12.67 6.33-17.15 10.65-22.78 20.8zm55.86 11.93c-2.98 6.45-16.78 15.26-26.74 15.26-5.33 0-7.56-2.98-7.11-7.86.32-3.48 2.1-7.91 3.93-10.61l1.52-2.32a44.95 44.95 0 0 1 1.88-2.7c3.66-4.8 7.85-7.45 13.62-7.45 9.06 0 15.75 9.52 12.9 15.68zm-.9-.42c2.52-5.47-3.65-14.26-12-14.26-5.4 0-9.33 2.48-12.82 7.06-.6.8-1.17 1.6-1.85 2.64 0 0-1.2 1.87-1.52 2.33-1.74 2.57-3.46 6.85-3.77 10.14-.4 4.33 1.43 6.77 6.12 6.77 9.57 0 23.02-8.58 25.83-14.68zm-69.67 20.74c2.08.18 4.44.81 5.88 1.8 2.12 1.47 2.2 3.6-.26 6.05-5.14 5.15-12.85 4.34-12.85-1.35 0-4.66 3.14-6.84 7.23-6.5zm-.09 1c-3.56-.3-6.14 1.5-6.14 5.5 0 4.58 6.53 5.26 11.15.65 2.03-2.04 1.98-3.43.4-4.52-1.27-.88-3.48-1.47-5.4-1.63zm29.59-225.95c4.64 2.35 17.27 8.24 19.39 9.43a24.14 24.14 0 0 1 7.05 5.64 45.03 45.03 0 0 1 3.75 5.2c2.4 3.78.04 7.66-6.2 11.63-4.97 3.16-12.18 6.3-21.95 9.82-4.84 1.74-19.63 6.68-21.1 7.2-6.59 2.33-14.85.1-25.14-5.86-3.93-2.27-8-5-12.94-8.54-2.23-1.61-9.5-6.99-10.7-7.85a81.21 81.21 0 0 0-8.63-5.7c-4.82-2.6-4.45-6.64.17-12.13 3.27-3.88 4.17-4.67 18.1-16.33a230.2 230.2 0 0 0 8.89-7.74 95.2 95.2 0 0 0 4.72-4.66c5.08-5.43 9.8-6.49 14.97-3.92 2.24 1.1 4.53 2.85 7.43 5.52 1.48 1.37 6.94 6.72 7.98 7.7 5.2 4.91 9.46 8.2 14.2 10.6zm-.46.9c-4.85-2.45-9.18-5.79-14.44-10.76-1.05-1-6.5-6.34-7.97-7.69-2.83-2.61-5.06-4.3-7.2-5.37-4.75-2.36-9-1.4-13.8 3.71a96.18 96.18 0 0 1-4.76 4.71c-2.48 2.3-5.16 4.62-8.92 7.77-13.86 11.6-14.77 12.4-17.98 16.21-4.28 5.08-4.58 8.4-.46 10.61 2.23 1.2 4.9 2.99 8.74 5.77 1.2.87 8.47 6.24 10.7 7.85a154.8 154.8 0 0 0 12.85 8.49c10.06 5.82 18.07 7.98 24.3 5.78 1.48-.52 16.27-5.47 21.1-7.2 9.7-3.5 16.86-6.61 21.75-9.72 5.84-3.71 7.9-7.1 5.9-10.26a44.09 44.09 0 0 0-3.67-5.08 23.16 23.16 0 0 0-6.78-5.42c-2.08-1.16-14.68-7.05-19.36-9.4zm-38.83 8.05c3.11-.37 5.7-.13 8.4.7 2.15.66 2.74.93 8.64 3.77 4.75 2.29 8.39 3.86 13.19 5.56 8.38 2.97 11.32 6.23 8.83 9.76-2.08 2.94-8.04 5.92-17.84 9.18-8.45 2.82-15.48 2.35-21.43-.9-4.65-2.55-8.33-6.5-12.15-12.3-2.9-4.41-2.73-8.2.16-11.06 2.48-2.45 6.87-4.07 12.2-4.7zm.12 1c-5.13.6-9.33 2.16-11.62 4.42-2.53 2.5-2.68 5.77-.02 9.8 3.73 5.68 7.3 9.51 11.8 11.97 5.7 3.11 12.43 3.57 20.62.84 9.59-3.2 15.44-6.12 17.34-8.82 1.94-2.75-.5-5.45-8.35-8.24-4.84-1.72-8.5-3.3-13.28-5.6-5.84-2.81-6.42-3.07-8.5-3.71a18.42 18.42 0 0 0-8-.66zM202.5 500.38c0 4.78-1.45 7.56-4.43 8.93-2.29 1.05-4.55 1.23-10.79 1.2l-1.78-.01c-9.19 0-17-7.65-17-15.5 0-7.59 10.6-10.51 19.74-5.44 2.78 1.55 4.21 1.94 8.57 2.75 4.44.83 5.69 2.27 5.69 8.07zm-1 0c0-5.3-.9-6.34-4.88-7.08-4.45-.83-5.96-1.25-8.86-2.86-8.57-4.76-18.26-2.1-18.26 4.56 0 7.3 7.36 14.5 16 14.5h1.79c6.06.04 8.26-.14 10.36-1.1 2.6-1.2 3.85-3.6 3.85-8.02zm33.33-117.85c3.71-1.31 8.7-2.7 16.1-4.55 2.58-.65 16.53-4.04 20.56-5.05 19.59-4.93 31.55-8.9 38.23-13.35 14.93-9.95 36.87-33.88 43.83-47.8 2.25-4.5 4.65-6.38 7.68-6.25 1.26.06 2.61.45 4.32 1.2a50.81 50.81 0 0 1 3.54 1.7l1.26.63c4.78 2.34 8.38 3.44 12.65 3.44 7.2 0 10.01 3.07 8.35 7.91-1.4 4.06-5.92 8.91-11.1 12.02-8.3 4.98-11.75 17.3-11.75 33.57 0 3.59-1.37 6.28-3.98 8.36-1.98 1.58-4.2 2.6-8.47 4.16l-1.02.37c-4.85 1.75-6.98 2.77-8.68 4.46-5.09 5.1-12.54 7.15-20.35 7.15-1.38 0-2.47.92-3.99 3.1-.29.41-1.32 1.95-1.47 2.18-2.68 3.92-4.93 5.72-8.54 5.72-7.84 0-10.74.93-21.76 6.94-5.18 2.82-8.8 3.58-14.66 3.68-.26 0-.47 0-.92.02-4.82.06-7.12.3-10.51 1.34a73.43 73.43 0 0 0-8.89 3.56c-2.17 1-10.53 5.01-10.23 4.87-7.79 3.7-13.32 5.98-18.9 7.57-12.41 3.55-18.58 2.24-27.42-4.07-2.58-1.85-2.72-4.43-.83-7.62 1.45-2.45 3.9-5.09 8.08-8.97l1.78-1.64c3.92-3.6 4.48-4.11 5.9-5.53 2.32-2.32 3.12-3.5 5.48-7.63 1.93-3.36 3.37-5.11 6.27-7.06 2.3-1.54 5.34-2.98 9.44-4.43zm.34.94c-4.03 1.42-7 2.83-9.22 4.32-2.75 1.85-4.1 3.49-5.96 6.73-2.4 4.2-3.24 5.44-5.64 7.83-1.43 1.44-2 1.96-5.94 5.57l-1.77 1.63c-4.1 3.82-6.52 6.41-7.9 8.75-1.65 2.79-1.54 4.8.55 6.3 8.6 6.14 14.46 7.38 26.57 3.92 5.5-1.57 11-3.84 18.74-7.51-.3.14 8.06-3.88 10.24-4.88a74.3 74.3 0 0 1 9.01-3.6c3.51-1.09 5.89-1.33 10.8-1.4h.91c5.72-.1 9.18-.83 14.2-3.57 11.16-6.08 14.2-7.06 22.24-7.06 3.19 0 5.2-1.6 7.71-5.28l1.48-2.2c1.7-2.43 3-3.52 4.81-3.52 7.57 0 14.78-2 19.65-6.85 1.83-1.84 4.04-2.9 9.04-4.7l1.02-.37c8.6-3.13 11.79-5.67 11.79-11.58 0-16.6 3.53-29.2 12.24-34.43 5-3 9.35-7.67 10.66-11.48 1.42-4.13-.83-6.59-7.4-6.59-4.45 0-8.19-1.14-13.09-3.54-7.52-3.67-6.78-3.34-8.72-3.43-2.58-.1-4.65 1.52-6.74 5.7-7.04 14.07-29.1 38.14-44.17 48.19-6.81 4.54-18.84 8.52-38.55 13.48-4.03 1.02-17.98 4.4-20.56 5.05-7.37 1.84-12.33 3.23-16 4.52zM252 387.5c2.08 0 4-.2 7.25-.69 5.22-.77 6.64-.9 8.46-.5 2.52.56 3.79 2.35 3.79 5.69 0 4.05-2.27 7.29-6.62 10.11-3.24 2.1-6.53 3.53-14.15 6.4l-.27.1-2.28.86c-3.04 1.16-5.27 2.52-9.33 5.43l-.8.57c-8.19 5.88-13.35 8.03-23.05 8.03-4.98 0-6.88-2.03-5.75-5.62.87-2.81 3.58-6.56 7.8-11.13 1.26-1.37 2.64-2.8 4.15-4.3 3.17-3.14 11.25-10.61 11.45-10.8.46-.47.93-.89 1.4-1.26 3.38-2.71 5.77-3.08 14.18-2.93 1.65.03 2.63.04 3.77.04zm0 1c-1.15 0-2.13-.01-3.79-.04-8.18-.14-10.4.2-13.54 2.71-.44.35-.88.74-1.32 1.18-.2.21-8.3 7.69-11.45 10.82a134.6 134.6 0 0 0-4.12 4.26c-4.12 4.47-6.76 8.12-7.58 10.75-.9 2.88.45 4.32 4.8 4.32 9.46 0 14.44-2.07 22.46-7.84l.8-.57c4.13-2.96 6.42-4.36 9.56-5.56l2.3-.86.25-.1c7.55-2.84 10.8-4.25 13.97-6.3 4.08-2.65 6.16-5.6 6.16-9.27 0-2.89-.97-4.26-3-4.7-1.65-.37-3.05-.25-8.1.5-3.3.5-5.26.7-7.4.7zm112.47-45.34c-1.88 5.44-1.98 6.76-.98 12.76 1.18 7.06-1.38 16.58-5.49 16.58a16.89 16.89 0 0 0-1.51.07l-.64.04c-2.86.18-4.83.17-6.94-.17-6.55-1.06-10.41-5.14-10.41-13.44 0-13.9 2.14-19.69 8.13-26.33a21.9 21.9 0 0 0 2.52-3.75c.59-1.03 2.78-5.13 2.72-5.01 4.44-8.14 7.71-11.53 12.25-10.4 1.17.3 2.2.77 3.58 1.59l1.39.84a20 20 0 0 0 3.1 1.6c.7.27 1.8.32 4.75.26l.72-.01c3.16-.05 4.78.08 5.83.66 1.61.89 1.2 2.56-1.14 4.9a215.9 215.9 0 0 1-3.86 3.76c-10.6 10.1-12.75 12.4-14.02 16.05zm-.94-.32c1.34-3.9 3.46-6.17 14.27-16.46 1.55-1.47 2.73-2.62 3.85-3.73 1.94-1.95 2.17-2.88 1.35-3.33-.82-.45-2.37-.58-5.32-.53l-.72.01c-3.14.06-4.26.02-5.14-.34-1.06-.41-1.97-.9-3.25-1.67l-1.38-.83a12.1 12.1 0 0 0-3.31-1.47c-3.88-.97-6.92 2.17-11.13 9.9.07-.13-2.14 3.98-2.73 5.02a22.71 22.71 0 0 1-2.65 3.92c-5.81 6.47-7.87 12-7.87 25.67 0 7.79 3.48 11.47 9.57 12.45 2.01.33 3.92.34 6.71.16a371.33 371.33 0 0 0 1.23-.07c.42-.03.73-.04.99-.04 3.2 0 5.6-8.9 4.5-15.42-1.02-6.16-.91-7.64 1.03-13.24zm-9.26 12.42c.58.52 2.5 1.9 2.55 1.93 1.96 1.57 2.04 3.31.01 6.36-3.74 5.64-8.83 3.09-8.83-4.55 0-3.81.51-5.67 2.07-6.02 1.18-.26 2 .3 4.2 2.28zm-1.34 1.48c-1.5-1.35-2.23-1.85-2.43-1.8-.17.03-.5 1.23-.5 4.06 0 5.87 2.67 7.21 5.17 3.45 1.5-2.26 1.47-2.84.4-3.7.03.03-1.95-1.4-2.64-2zm222.9-130.19c2.2-1.1 3.67-1.66 5.88-2.36l.28-.09a48.92 48.92 0 0 0 8.79-3.55c4.17-2.08 6.35-1.88 6.96.84.44 2 .2 4.01-1.25 12.7-2.27 13.62-9.16 26.14-21.17 36.3-4.3 3.63-7.41 4.39-9.75 2.44-1.88-1.57-3.1-4.57-4.61-10.48-.3-1.15-1.43-5.83-1.72-6.96a114.18 114.18 0 0 0-2.71-9.22c-2.4-6.82-3.03-10.78-2.1-12.94.77-1.83 2.08-2.24 5.6-2.45 1.49-.09 2.09-.14 2.97-.28l1.95-.33c.72-.12 1.22-.2 1.68-.29 1.1-.2 1.92-.38 2.71-.6 1.7-.49 3.42-1.2 6.49-2.73zm.44.9c-3.11 1.54-4.88 2.29-6.65 2.79-.84.23-1.69.42-2.81.63a108.77 108.77 0 0 1-3.81.63c-.77.13-1.39.19-2.92.28-3.13.18-4.17.51-4.74 1.85-.78 1.84-.2 5.62 2.13 12.2a115.12 115.12 0 0 1 2.74 9.31l1.72 6.96c1.46 5.7 2.62 8.58 4.28 9.96 1.87 1.56 4.49.93 8.47-2.44 11.82-10 18.6-22.3 20.83-35.7 1.4-8.45 1.65-10.51 1.25-12.31-.41-1.87-1.86-2-5.54-.16a49.87 49.87 0 0 1-8.93 3.6l-.28.1a35.4 35.4 0 0 0-5.74 2.3zm-4.5 6.58c1.37-.32 2.5-.75 3.9-1.42.35-.18 2.57-1.31 3.32-1.67 1.5-.71 2.97-1.31 4.7-1.89 2.7-.9 4.64-.77 5.88.4.98.94 1.34 2.26 1.41 4.18.02.4.02.7.02 1.37 0 5.63-4.63 16.88-11.34 22.75-4.34 3.8-7.31 4.67-9.92 2.52-2.06-1.7-3.5-4.65-6.67-12.91-1.86-4.83-2.05-8.1-.68-10.2 1.12-1.7 2.9-2.36 5.83-2.7l1.26-.12c1.19-.12 1.75-.19 2.3-.31zm-2.1 2.3-1.22.12c-2.4.27-3.7.76-4.39 1.81-.93 1.43-.78 4.1.87 8.38 3.02 7.84 4.41 10.71 6.08 12.09 1.63 1.34 3.64.75 7.33-2.48C584.6 250.77 589 240.08 589 235c0-.64 0-.93-.02-1.29-.05-1.44-.3-2.33-.79-2.8-.6-.57-1.8-.65-3.87.04a37.95 37.95 0 0 0-4.47 1.8c-.72.34-2.93 1.47-3.32 1.66a19.54 19.54 0 0 1-4.3 1.56c-.66.16-1.28.24-2.56.36zm-227.73-88.98c-1.59 4.3-3.54 7.25-7.14 11.4l-2.6 2.97a67.02 67.02 0 0 0-2.63 3.23 46.4 46.4 0 0 0-4.68 7.5c-2.85 5.7-7.14 10.18-12.85 13.89-4.25 2.76-8.25 4.62-15.67 7.59-11.01 4.4-16.43 1.26-27.22-16.4-2.86-4.69-8.8-8.63-17.98-12.66-3-1.33-12.88-5.24-14.43-5.92-4.96-2.18-7.04-3.72-6.42-5.85.67-2.32 5.3-4.05 15.48-6.08 16.63-3.32 26.93-3.82 39.93-3.02 7.9.49 9.67.5 12.74-.26 1.99-.48 3.92-1.3 6-2.6l2.79-1.71c9.86-6.14 12.94-7.96 17.3-9.9 6.03-2.71 10.57-3.32 13.94-1.4 7.2 4.12 7.68 7.7 3.44 19.22zm-1.88-.7c3.95-10.7 3.6-13.26-2.56-16.78-2.66-1.52-6.62-.99-12.12 1.48-4.24 1.9-7.3 3.7-17.07 9.77l-2.79 1.73a22.6 22.6 0 0 1-6.57 2.84c-3.36.81-5.22.8-13.34.3-12.84-.78-22.97-.29-39.41 3-4.9.97-8.45 1.88-10.79 2.75-2.03.76-3.04 1.45-3.17 1.91-.16.57 1.48 1.79 5.3 3.46 1.5.67 11.39 4.58 14.44 5.93 9.52 4.19 15.74 8.3 18.87 13.44 10.35 16.93 14.87 19.56 24.78 15.6 7.3-2.93 11.21-4.75 15.33-7.42 5.42-3.53 9.47-7.75 12.15-13.1 1.44-2.9 3.02-5.4 4.86-7.82a68.95 68.95 0 0 1 2.72-3.33l2.6-2.97c3.46-3.99 5.28-6.75 6.77-10.79zm-6.64-.39c-7.94 12.8-18.53 21.75-33.3 25.23-7.82 1.83-12.47-.79-13.12-5.93-.55-4.45 2.29-9.06 6-9.06 3.02 0 5.6-1.68 15.38-9.16 1.47-1.12 2.57-1.96 3.66-2.74 4.4-3.2 7.77-5.17 10.82-6.08 5.57-1.67 9.33-2.15 11.35-1.22 2.5 1.14 2.22 4.13-.79 8.96zm-.84-.52c2.72-4.4 2.94-6.74 1.21-7.53-1.71-.79-5.32-.33-10.65 1.27-2.9.87-6.2 2.79-10.51 5.92-1.08.79-2.18 1.62-3.65 2.74-10.08 7.72-12.62 9.36-15.98 9.36-3.02 0-5.5 4.02-5 7.94.56 4.5 4.62 6.78 11.89 5.07 14.48-3.4 24.86-12.18 32.69-24.77zM461.17 33.53c13.88 4.96 20.75 4.96 31.62.01 3.02-1.37 5.47-2.94 11-6.82 5.57-3.92 8.05-5.51 11.14-6.92 4.14-1.88 7.78-2.38 11.22-1.28 3.92 1.26 6.2 12.3 6.78 28.45.5 14.2-.52 28.93-2.46 34.2-1.82 4.93-5.86 8.17-11.51 10.02A41.7 41.7 0 0 1 506 93.01c-5.79 0-9 2.4-12.2 7.64-.37.59-1.55 2.6-1.71 2.87-1.75 2.9-3.05 4.33-4.93 4.95-.94.32-2.07.83-3.87 1.74l-2.43 1.23c-1.03.53-1.87.94-2.7 1.34-6.43 3.1-11.73 4.72-17.16 4.72-5.71 0-10.04 2.09-14.02 5.92-1.16 1.11-4.2 4.53-4.63 4.94-2.54 2.44-5.93 4.24-10.85 6.1-1.4.52-5.98 2.13-6.25 2.22l-2.06.78c-.89.36-1.78.63-2.7.81-5.55 1.14-11.14-.54-17.98-4.42-1.27-.73-5.13-3.06-5.76-3.42-2.05-1.16-4.12-1.53-9.09-1.9l-1.73-.15c-4.78-.4-7.68-1.14-10.22-2.97-5-3.61-6.77-7.76-5.65-12.33 1.33-5.42 6.5-11.02 14.85-17.28a169.2 169.2 0 0 1 6.5-4.61c-.33.23 4.33-2.92 5.3-3.6 2.73-1.91 4.8-3.9 12.75-12.04l1.09-1.1c3.49-3.56 5.89-5.89 8.12-7.83 2.9-2.5 4.72-5.95 7.5-13.05l.63-1.61c2.7-6.92 4.28-10 6.87-12.33 1.42-1.28 6.68-6.54 7.93-7.5 3.98-3 8.01-2.73 19.57 1.4zm-.34.94c-11.26-4.02-15-4.28-18.62-1.53-1.19.9-6.4 6.11-7.88 7.43-2.42 2.18-3.96 5.19-6.6 11.95l-.63 1.61c-2.83 7.26-4.72 10.8-7.77 13.45a141.85 141.85 0 0 0-9.16 8.87c-8.02 8.2-10.08 10.2-12.88 12.16-.99.69-5.65 3.84-5.31 3.6-2.5 1.71-4.52 3.13-6.47 4.59-8.17 6.13-13.23 11.6-14.48 16.72-1.02 4.15.58 7.9 5.26 11.27 2.36 1.7 5.11 2.4 9.72 2.8l1.73.13c5.12.4 7.28.78 9.5 2.05.65.36 4.5 2.7 5.76 3.4 6.66 3.78 12.04 5.4 17.29 4.32.86-.17 1.7-.42 2.52-.75a67 67 0 0 1 2.1-.8c.28-.1 4.86-1.7 6.24-2.22 4.8-1.8 8.08-3.56 10.5-5.88.4-.38 3.44-3.8 4.63-4.94 4.16-4 8.72-6.2 14.72-6.2 5.25 0 10.42-1.59 16.73-4.62.82-.4 1.65-.8 2.68-1.33.12-.06 1.93-.99 2.43-1.23 1.84-.93 3-1.46 4-1.8 1.6-.52 2.76-1.82 4.39-4.52l1.7-2.88c3.39-5.5 6.87-8.11 13.07-8.11 4.45 0 8.73-.49 12.64-1.77 5.4-1.76 9.2-4.8 10.9-9.41 1.87-5.11 2.9-19.75 2.39-33.83-.56-15.53-2.81-26.48-6.08-27.52-3.18-1.02-6.57-.55-10.5 1.23-3.02 1.37-5.47 2.94-11 6.83-5.57 3.92-8.05 5.5-11.14 6.92-11.13 5.05-18.26 5.05-32.38.01zM475 55c5.38 0 7.55-.21 9.72-.96 1.26-.43 9.95-4.8 14.88-6.96 1.9-.82 3.56-2.44 6.6-6.04 2.56-3.04 3.19-3.75 4.4-4.84 3.7-3.35 7.07-3.28 10.22 1.23 6.23 8.9 5.61 15.94.07 27.02a71.26 71.26 0 0 0-2.5 5.48c-.32.8-1 2.7-1.09 2.9-.17.45-.34.81-.54 1.17-.63 1.14-1.56 2.21-4.05 4.7-2.4 2.4-5.16 3.27-11.68 4.33-1.81.3-2.2.36-3 .51-6.02 1.1-9.6 2.69-12.24 6.07-3.57 4.59-7.9 7.48-14.98 10.74-.55.24-1.1.5-1.8.8l-1.78.8a60.08 60.08 0 0 0-7.7 3.9c-2.57 1.6-4.79 2.35-9.42 3.46-8.58 2.06-12.28 3.76-17.37 9.36-5.12 5.64-10.17 7.64-16.63 6.7-5.36-.79-10.63-3.01-23.56-9.48-6.3-3.15-6.43-7.78-1.5-13.56 3.38-3.94 3.52-4.06 19.4-16.44 8.12-6.33 12.97-10.57 16.63-14.88 2.53-2.98 4.2-5.73 4.96-8.3 5.5-18.3 12.5-21.98 22.78-15.56 1.95 1.22 6.61 4.55 7.18 4.9 3.36 2.15 6.52 2.95 13 2.95zm0 2c-6.84 0-10.37-.89-14.08-3.26-.63-.4-5.27-3.71-7.16-4.9-9.05-5.65-14.66-2.7-19.8 14.45-.86 2.87-2.67 5.85-5.35 9.01-3.78 4.45-8.7 8.75-16.94 15.17-15.66 12.21-15.86 12.38-19.1 16.16-4.17 4.9-4.09 8 .88 10.48 12.71 6.35 17.89 8.54 22.94 9.28 5.78.84 10.18-.9 14.87-6.06 5.42-5.96 9.45-7.82 18.38-9.96 4.43-1.07 6.5-1.76 8.83-3.22a61.7 61.7 0 0 1 7.94-4.02l1.78-.8 1.78-.8c6.82-3.13 10.91-5.87 14.24-10.14 3-3.87 7-5.64 13.46-6.82.83-.15 1.21-.21 3.04-.51 6.1-1 8.6-1.78 10.58-3.77 2.36-2.36 3.21-3.34 3.72-4.26.15-.27.29-.56.44-.94.06-.15.75-2.06 1.09-2.9.64-1.6 1.45-3.4 2.57-5.64 5.24-10.49 5.8-16.8.07-24.98-2.4-3.44-4.37-3.48-7.24-.89-1.11 1-1.73 1.7-4.22 4.65-3.24 3.85-5.04 5.59-7.32 6.59-4.82 2.1-13.62 6.53-15.03 7.01-2.44.84-4.79 1.07-10.37 1.07zm-12.7 8.6c5.47 3.9 10.34 3.72 18.23.88 5.39-1.94 5.92-2.1 7.7-2.1 2.5-.01 4.21 1.36 5.24 4.46 1.66 4.98-2.32 8.52-12.3 12.68-2.7 1.13-16.25 6.18-20 7.73-7.86 3.24-13.93 6.42-18.87 10.15-13.02 9.84-18.36 11.93-23.71 9.68a24.67 24.67 0 0 1-3.62-1.98l-1.99-1.28a90.4 90.4 0 0 0-2.24-1.4c-3.33-2-2.82-4.28.85-7.34 1.35-1.13 10.66-7.61 13.53-9.91 7.1-5.69 11.91-11.47 14.41-18.34 3.07-8.45 4.89-12.1 6.8-13.39 1.73-1.16 3.36-.53 6.18 1.9.63.56 3.4 3.08 4.11 3.7 1.93 1.7 3.71 3.15 5.67 4.55zm-.6.8c-1.98-1.42-3.79-2.88-5.74-4.6-.73-.64-3.48-3.16-4.1-3.7-2.5-2.16-3.75-2.65-4.97-1.83-1.66 1.11-3.44 4.7-6.42 12.9-2.57 7.07-7.5 12.99-14.72 18.78-2.91 2.33-12.21 8.8-13.52 9.9-3.22 2.68-3.56 4.17-.97 5.72l2.26 1.4 1.99 1.28c1.47.93 2.48 1.5 3.47 1.91 4.9 2.07 9.96.07 22.72-9.56 5.02-3.79 11.15-7 19.1-10.28 3.76-1.55 17.3-6.6 20-7.72 9.5-3.97 13.14-7.2 11.73-11.44-.9-2.71-2.25-3.8-4.3-3.79-1.6 0-2.15.17-7.36 2.05-8.17 2.94-13.34 3.14-19.16-1.01z'/%3E%3C/svg%3E")}`,
  map: `{"version":3,"file":"contact.svelte","sources":["contact.svelte"],"sourcesContent":["<script context=\\"module\\">\\r\\n  export const prerender = true\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n  import SEOHead from '$lib/SEOHead.svelte'\\r\\n<\/script>\\r\\n\\r\\n<style>.bg-header{background-color:#ecefef;background-image:url(\\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cpath fill='%23f7f7f8' d='M600 325.1v-1.17c-6.5 3.83-13.06 7.64-14.68 8.64-10.6 6.56-18.57 12.56-24.68 19.09-5.58 5.95-12.44 10.06-22.42 14.15-1.45.6-2.96 1.2-4.83 1.9l-4.75 1.82c-9.78 3.75-14.8 6.27-18.98 10.1-4.23 3.88-9.65 6.6-16.77 8.84-1.95.6-3.99 1.17-6.47 1.8l-6.14 1.53c-5.29 1.35-8.3 2.37-10.54 3.78-3.08 1.92-6.63 3.26-12.74 5.03a384.1 384.1 0 0 1-4.82 1.36c-2.04.58-3.6 1.04-5.17 1.52a110.03 110.03 0 0 0-11.2 4.05c-2.7 1.15-5.5 3.93-8.78 8.4a157.68 157.68 0 0 0-6.15 9.2c-5.75 9.07-7.58 11.74-10.24 14.51a50.97 50.97 0 0 1-4.6 4.22c-2.33 1.9-10.39 7.54-11.81 8.74a14.68 14.68 0 0 0-3.67 4.15c-1.24 2.3-1.9 4.57-2.78 8.87-2.17 10.61-3.52 14.81-8.2 22.1-4.07 6.33-6.8 9.88-9.83 12.99-.47.48-.95.96-1.5 1.48l-3.75 3.56c-1.67 1.6-3.18 3.12-4.86 4.9a42.44 42.44 0 0 0-9.89 16.94c-2.5 8.13-2.72 15.47-1.76 27.22.47 5.82.51 6.36.51 8.18 0 10.51.12 17.53.63 25.78.24 4.05.56 7.8.97 11.22h.9c-1.13-9.58-1.5-21.83-1.5-37 0-1.86-.04-2.4-.52-8.26-.94-11.63-.72-18.87 1.73-26.85a41.44 41.44 0 0 1 9.65-16.55c1.67-1.76 3.18-3.27 4.83-4.85.63-.6 3.13-2.96 3.75-3.57a71.6 71.6 0 0 0 1.52-1.5c3.09-3.16 5.86-6.76 9.96-13.15 4.77-7.42 6.15-11.71 8.34-22.44.86-4.21 1.5-6.4 2.68-8.6.68-1.25 1.79-2.48 3.43-3.86 1.38-1.15 9.43-6.8 11.8-8.72 1.71-1.4 3.26-2.81 4.7-4.3 2.72-2.85 4.56-5.54 10.36-14.67a156.9 156.9 0 0 1 6.1-9.15c3.2-4.33 5.9-7.01 8.37-8.07 3.5-1.5 7.06-2.77 11.1-4.02a233.84 233.84 0 0 1 7.6-2.2l2.38-.67c6.19-1.79 9.81-3.16 12.98-5.15 2.14-1.33 5.08-2.33 10.27-3.65l6.14-1.53c2.5-.63 4.55-1.2 6.52-1.82 7.24-2.27 12.79-5.06 17.15-9.05 4.05-3.72 9-6.2 18.66-9.9l4.75-1.82c1.87-.72 3.39-1.31 4.85-1.91 10.1-4.15 17.07-8.32 22.76-14.4 6.05-6.45 13.95-12.4 24.49-18.92 1.56-.96 7.82-4.6 14.15-8.33v-64.58c-4 8.15-8.52 14.85-12.7 17.9-2.51 1.82-5.38 4.02-9.04 6.92a1063.87 1063.87 0 0 0-6.23 4.98l-1.27 1.02a2309.25 2309.25 0 0 1-4.87 3.9c-7.55 6-12.9 10.05-17.61 13.19-3.1 2.06-3.86 2.78-8.06 7.13-5.84 6.07-11.72 8.62-29.15 10.95-11.3 1.5-20.04 4.91-30.75 11.07-1.65.94-7.27 4.27-6.97 4.1-2.7 1.58-4.69 2.69-6.64 3.66-5.63 2.8-10.47 4.17-15.71 4.17-17.13 0-41.44 11.51-51.63 22.83-12.05 13.4-31.42 27.7-45.25 31.16-7.4 1.85-11.85 7.05-14.04 14.69-1.26 4.4-1.58 8.28-1.58 13.82 0 .82.01.98.24 3.63.45 5.18.35 8.72-.77 13.26-1.53 6.2-4.89 12.6-10.59 19.43-13.87 16.65-22.88 46.58-22.88 71.68 0 2.39.02 4.26.06 8.75.12 10.8.1 15.8-.22 21.95-.56 11.18-2.09 20.73-5 29.3h-1.05c2.94-8.56 4.49-18.12 5.05-29.35.31-6.13.34-11.1.22-21.9-.04-4.48-.06-6.36-.06-8.75 0-25.32 9.07-55.47 23.12-72.32 5.6-6.72 8.88-12.99 10.38-19.03 1.09-4.4 1.18-7.85.74-12.93-.23-2.7-.24-2.86-.24-3.72 0-5.62.32-9.57 1.62-14.1 2.28-7.95 6.97-13.44 14.76-15.39 13.6-3.4 32.82-17.59 44.75-30.84C409 360.14 433.58 348.5 451 348.5c5.07 0 9.77-1.33 15.26-4.07 1.93-.96 3.9-2.05 6.58-3.62-.3.18 5.33-3.16 6.98-4.11 10.82-6.21 19.66-9.67 31.11-11.2 17.23-2.3 22.9-4.75 28.57-10.64 4.25-4.41 5.04-5.16 8.22-7.28 4.68-3.11 10.01-7.14 17.55-13.14a1113.33 1113.33 0 0 0 4.86-3.89l1.28-1.02a4668.54 4668.54 0 0 1 6.23-4.98c3.67-2.9 6.55-5.12 9.07-6.95 4.37-3.19 9.16-10.56 13.29-19.4v66.9zm0-116.23c-.62.01-1.27.06-1.95.13-6.13.63-13.83 3.45-21.83 7.45-3.64 1.82-8.46 2.67-14.17 2.71-4.7.04-9.72-.47-14.73-1.33-1.7-.3-3.26-.61-4.67-.93a31.55 31.55 0 0 0-3.55-.57 273.4 273.4 0 0 0-16.66-.88c-10.42-.16-17.2.74-17.97 2.73-.38.97.6 2.55 3.03 4.87 1.01.97 2.22 2.03 4.04 3.55a1746.07 1746.07 0 0 0 4.79 4.02c1.39 1.2 3.1 1.92 5.5 2.5.7.16.86.2 2.64.54 3.53.7 5.03 1.25 6.15 2.63 1.41 1.76 1.4 4.54-.15 8.88-2.44 6.83-5.72 10.05-10.19 10.33-3.63.23-7.6-1.29-14.52-5.06-4.53-2.47-6.82-7.3-8.32-15.26-.17-.87-.32-1.78-.5-2.86l-.43-2.76c-1.05-6.58-1.9-9.2-3.73-10.11-.81-.4-1.59-.74-2.36-1-2.27-.77-4.6-1.02-8.1-.92-2.29.07-14.7 1-13.77.93-20.55 1.37-28.8 5.05-37.09 14.99a133.07 133.07 0 0 0-4.25 5.44l-2.3 3.09-2.51 3.32c-4.1 5.36-7.06 8.48-10.39 11.12-.65.52-1.33 1.04-2.13 1.62l-4.11 2.94a106.8 106.8 0 0 0-5.16 3.99c-4.55 3.74-9.74 8.6-16.25 15.38-8.25 8.58-11.78 13.54-11.7 15.95.07 1.65 1.64 2.11 6.79 2.38 1.61.09 2.15.12 2.98.2 2.95.24 5.09.73 6.81 1.68 7.48 4.15 11.63 7.26 13.95 11.58 3.3 6.15.8 12.88-8.89 20.26-8.28 6.3-11.1 10.37-11.31 14.96-.06 1.17 0 1.93.26 4.43.69 6.47.25 10.65-2.8 17.42a44.23 44.23 0 0 1-4.16 7.53c-2.82 3.97-5.47 5.74-10.6 7.69-.43.16-3.34 1.23-4.27 1.59-1.8.68-3.38 1.36-5.01 2.14-4.18 2-8.4 4.6-13.1 8.24-8.44 6.51-13.23 14.56-15.98 25.06-1.1 4.2-1.55 6.81-2.8 15.21-1.26 8.6-2.17 12.64-4.08 16.55-2.1 4.28-11.93 26.59-12.97 28.88a382.7 382.7 0 0 1-6.37 13.41c-4.07 8.11-7.61 14.07-10.73 17.81-5.38 6.46-8.98 14.37-13.77 28.42a810.14 810.14 0 0 0-1.89 5.6c-1.8 5.35-2.96 8.6-4.26 11.85-6.13 15.32-25.43 26.31-46.46 26.31-11.2 0-20.58-2.74-31.02-8.55-5.6-3.13-4.55-2.42-22.26-14.54-14.33-9.8-17.7-10.73-20.47-6.9-.37.5-1.81 2.74-1.83 2.77a52.24 52.24 0 0 1-4.94 5.9c-.73.79-5.52 5.87-6.97 7.45-2.38 2.6-4.3 4.81-5.98 6.93a45.6 45.6 0 0 0-5.08 7.66c-1.29 2.57-1.9 5.25-2.66 10.6a997.6 997.6 0 0 1-.46 3.18h-1l.47-3.32c.77-5.45 1.4-8.2 2.75-10.9a46.54 46.54 0 0 1 5.2-7.84c1.7-2.14 3.63-4.38 6.03-6.98 1.45-1.59 6.24-6.68 6.96-7.46a51.58 51.58 0 0 0 4.84-5.78s1.47-2.26 1.86-2.8c3.25-4.5 7.08-3.44 21.84 6.67 17.67 12.08 16.62 11.38 22.19 14.48 10.3 5.73 19.5 8.43 30.53 8.43 20.65 0 39.57-10.77 45.54-25.69a219.7 219.7 0 0 0 4.24-11.8 6752.32 6752.32 0 0 0 1.88-5.6c4.83-14.16 8.47-22.14 13.96-28.73 3.05-3.66 6.56-9.57 10.6-17.61 1.97-3.93 4.04-8.31 6.35-13.38 1.03-2.28 10.88-24.61 12.98-28.91 1.85-3.79 2.75-7.76 4-16.25 1.24-8.44 1.7-11.07 2.81-15.32 2.8-10.7 7.71-18.94 16.33-25.6a73.18 73.18 0 0 1 13.29-8.35c1.66-.8 3.27-1.48 5.08-2.18.94-.36 3.86-1.43 4.28-1.59 4.95-1.88 7.44-3.55 10.14-7.33 1.35-1.9 2.68-4.3 4.06-7.37 2.97-6.58 3.39-10.59 2.72-16.9a27.13 27.13 0 0 1-.27-4.58c.22-4.94 3.21-9.24 11.7-15.7 9.33-7.11 11.66-13.34 8.62-19-2.2-4.09-6.25-7.12-13.55-11.17-1.57-.88-3.6-1.33-6.42-1.57-.8-.07-1.34-.1-2.95-.19-5.77-.3-7.63-.85-7.72-3.34-.1-2.81 3.5-7.87 11.97-16.69 6.53-6.8 11.75-11.69 16.33-15.45 1.79-1.47 3.42-2.72 5.2-4.03l4.12-2.94c.79-.58 1.46-1.08 2.1-1.59 3.26-2.6 6.16-5.65 10.21-10.94a383.2 383.2 0 0 0 2.5-3.32l2.31-3.09c1.8-2.39 3.04-4 4.29-5.48 8.47-10.17 16.98-13.96 37.27-15.3-.44.02 12-.9 14.32-.98 3.62-.1 6.05.16 8.46.98.8.27 1.62.62 2.47 1.04 2.27 1.14 3.17 3.87 4.27 10.85l.44 2.76c.17 1.07.33 1.97.5 2.83 1.44 7.69 3.62 12.29 7.8 14.57 6.76 3.68 10.6 5.15 13.99 4.94 4-.25 6.99-3.17 9.3-9.67 1.45-4.04 1.46-6.49.32-7.92-.9-1.12-2.28-1.62-5.57-2.27a55.8 55.8 0 0 1-2.67-.55c-2.54-.6-4.39-1.4-5.93-2.71a252.63 252.63 0 0 0-4.78-4.01 84.35 84.35 0 0 1-4.08-3.6c-2.73-2.6-3.86-4.43-3.28-5.95 1.02-2.64 7.82-3.54 18.93-3.37a230.56 230.56 0 0 1 16.73.88c2.76.39 3.2.49 3.68.6 1.4.3 2.95.62 4.62.91a82.9 82.9 0 0 0 14.56 1.32c5.56-.04 10.24-.86 13.73-2.6 8.1-4.05 15.89-6.9 22.17-7.56.7-.07 1.4-.11 2.05-.13v1zm0-100.94v1.5c-8.62 16.05-17.27 29.55-23.65 35.92-3.19 3.2-7.62 4.9-13.54 5.56-4.45.48-8.28.4-19.18-.2-9.91-.55-15.32-.44-20.52.78a84.05 84.05 0 0 1-15 2.11l-2.25.14c-12.49.75-19.37 1.78-32.72 5.74-4.5 1.33-9.27 2.49-14.3 3.48a246.27 246.27 0 0 1-32.6 3.97c-7.56.45-13.21.57-20.24.57-5.4 0-11.9 1.61-18 5.18-8.3 4.87-15.06 12.87-19.53 24.5a68.57 68.57 0 0 1-4.56 9.8c-3.6 6.2-6.92 8.99-13.38 12.18l-4.03 1.96a64.48 64.48 0 0 0-15.16 10.25c-8.2 7.33-13.72 16.63-22.54 35.6l-2.08 4.49c-7.3 15.7-11.5 23.3-17.35 29.87-7.7 8.66-20.25 14.42-40.31 20.08-4.37 1.23-19.04 5.08-19.24 5.13-6.92 1.87-11.68 3.34-15.63 4.92-10.55 4.22-18.71 10.52-36.38 26.52l-1.7 1.54c-8.58 7.76-13.41 11.9-18.81 15.88-3.95 2.9-8 5.67-12.97 8.91-2.06 1.34-10.3 6.6-12.33 7.94-11.52 7.5-18.53 13.04-24.62 20.08a62.01 62.01 0 0 0-6.44 8.85c-4.13 6.91-6.27 13.15-9.2 25.11l-1.54 6.26c-.6 2.45-1.15 4.54-1.72 6.58-2.97 10.7-6.9 17.36-14.78 26.91L69.6 491a148.51 148.51 0 0 0-4.19 5.3 23.9 23.9 0 0 0-3.44 6.28c-1.16 3.23-1.52 5.9-1.87 11.94-.58 10.05-1.42 15.04-4.63 22.67-1.57 3.72-5.66 14.02-6.41 15.8a73.46 73.46 0 0 1-3.57 7.4c-2.88 5.14-6.71 10.12-13.12 16.95-5.96 6.36-8.87 10.9-10.61 16a56.88 56.88 0 0 0-1.38 4.82l-.46 1.84h-1.03l.52-2.08c.52-2.09.92-3.49 1.4-4.9 1.8-5.25 4.78-9.9 10.84-16.36 6.35-6.78 10.13-11.7 12.97-16.77a72.5 72.5 0 0 0 3.52-7.29c.75-1.76 4.84-12.06 6.4-15.8 3.17-7.5 3.99-12.4 4.56-22.33.35-6.14.72-8.88 1.93-12.23a24.9 24.9 0 0 1 3.58-6.54c1.27-1.7 2.6-3.37 4.22-5.34l4.11-4.95c7.8-9.46 11.66-16 14.59-26.54.56-2.04 1.1-4.12 1.71-6.56l1.53-6.26c2.96-12.04 5.13-18.36 9.32-25.39 1.84-3.08 4-6.05 6.54-8.99 6.17-7.12 13.24-12.7 24.83-20.26 2.05-1.33 10.28-6.6 12.33-7.94 4.96-3.22 9-5.98 12.92-8.87 5.37-3.95 10.19-8.08 18.74-15.82l1.7-1.54c17.76-16.09 25.98-22.43 36.67-26.7 4-1.6 8.8-3.09 15.75-4.96.21-.06 14.87-3.9 19.22-5.13 19.9-5.61 32.32-11.31 39.85-19.78 5.76-6.48 9.93-14.02 17.18-29.64l2.09-4.5c8.87-19.07 14.44-28.46 22.77-35.9a65.48 65.48 0 0 1 15.38-10.4l4.04-1.97c6.3-3.1 9.47-5.77 12.96-11.77a67.6 67.6 0 0 0 4.48-9.67c4.56-11.84 11.47-20.02 19.97-25 6.25-3.66 12.93-5.32 18.5-5.32 7.01 0 12.65-.12 20.17-.57a245.3 245.3 0 0 0 32.47-3.96c5-.98 9.75-2.13 14.22-3.45 13.43-3.98 20.38-5.02 32.94-5.78l2.24-.14c5.76-.37 9.8-.9 14.85-2.09 5.31-1.25 10.79-1.35 22.6-.7 9.04.5 12.84.58 17.21.1 5.71-.62 9.94-2.26 12.95-5.26 6.44-6.45 15.3-20.37 24.35-36.72zm0 450.21c-1.28-4.6-2.2-10.55-3.33-20.25l-.24-2.04-.23-2.03c-1.82-15.7-3.07-21.98-5.55-24.47-2.46-2.46-3.04-5.03-2.52-8.64.1-.6.18-1.1.39-2.15.69-3.54.77-5.04.08-6.84-.91-2.38-3.31-4.41-7.79-6.26-5.08-2.09-6.52-4.84-4.89-8.44.66-1.45 1.79-3.02 3.52-5.01 1.04-1.2 5.48-5.96 5.08-5.53 6.15-6.7 8.98-11.34 8.98-16.48a15.2 15.2 0 0 1 6.5-12.89v1.26a14.17 14.17 0 0 0-5.5 11.63c0 5.47-2.93 10.29-9.24 17.16.38-.42-4.04 4.33-5.07 5.5-1.67 1.93-2.75 3.43-3.36 4.77-1.37 3.04-.23 5.22 4.36 7.1 4.71 1.95 7.32 4.16 8.34 6.83.78 2.04.7 3.67-.03 7.4-.2 1.03-.3 1.51-.38 2.09-.48 3.33.03 5.59 2.23 7.8 2.74 2.74 3.98 8.96 5.84 25.06l.24 2.03.23 2.04c.82 7.01 1.53 12.06 2.34 16.03v4.33zm0-62.16c-1.4-3.13-4.43-9.9-4.95-11.17-1.02-2.53-1.25-3.8-.91-5.18.2-.84 2.05-4.68 2.32-5.33a70.79 70.79 0 0 0 3.54-11.2v3.99a62.82 62.82 0 0 1-2.62 7.6c-.31.75-2.09 4.46-2.27 5.18-.28 1.12-.08 2.22.87 4.57.41 1.02 2.5 5.7 4.02 9.09v2.45zm0-85.09c-1.65 1.66-3.66 2.9-6.4 4.13-.25.1-13.97 5.47-20.4 8.43-9.35 4.32-16.7 5.9-23.03 5.25-5.08-.53-9.02-2.25-14.77-5.92l-3.2-2.07a77.4 77.4 0 0 0-5.44-3.27c-4.05-2.18-3.25-5.8 1.47-10.47 3.71-3.68 9.6-7.93 18.73-13.8l4.46-2.82c17.95-11.33 18.22-11.5 22.27-14.74 11.25-9 19.69-14.02 26.31-15.1v1.02c-6.37 1.1-14.62 6-25.69 14.86-4.1 3.28-4.34 3.44-22.36 14.8a652.4 652.4 0 0 0-4.45 2.83c-9.07 5.83-14.92 10.05-18.57 13.66-4.31 4.28-4.95 7.13-1.7 8.88 1.7.91 3.29 1.88 5.5 3.3l3.2 2.08c5.64 3.59 9.45 5.25 14.34 5.76 6.13.64 13.32-.9 22.52-5.15 6.46-2.98 20.18-8.35 20.4-8.44 3.04-1.37 5.1-2.71 6.81-4.69v1.47zm0-41.37v1c-6.56.26-12.11 3.13-19.71 9.08l-4.63 3.68a51.87 51.87 0 0 1-4.4 3.14c-.82.52-5.51 3.33-6.22 3.76-3.31 2-6.15 3.8-8.87 5.6a112.61 112.61 0 0 0-8.16 5.92c-4.61 3.72-7.4 6.9-7.97 9.35-.63 2.67 1.48 4.53 7.05 5.46 10.7 1.78 20.92-.05 30.45-4.65a61.96 61.96 0 0 0 17.1-12.2 41.8 41.8 0 0 0 5.36-7.42v1.92a38.94 38.94 0 0 1-4.64 6.19 62.95 62.95 0 0 1-17.39 12.41c-9.7 4.68-20.13 6.55-31.05 4.73-6.06-1-8.65-3.29-7.85-6.67.64-2.74 3.53-6.05 8.31-9.9 2.35-1.9 5.1-3.88 8.24-5.97 2.73-1.82 5.58-3.61 8.9-5.62.72-.44 5.4-3.24 6.22-3.75 1.26-.8 2.6-1.76 4.3-3.09.8-.62 3.9-3.1 4.63-3.67 7.77-6.1 13.49-9.04 20.33-9.3zm0-154.6v1c-1.75-.24-4.3.23-7.82 1.55-10.01 3.75-13.8 5.07-19.15 6.76-1.78.56-2.63.83-3.87 1.24-1.48.5-3.16.76-6.74 1.16a1550.34 1550.34 0 0 0-2.64.3c-7.8.94-11.28 2.47-11.28 6.07 0 4.45 2.89 13.18 7.96 25.81a57.34 57.34 0 0 1 2.33 7.6 258.32 258.32 0 0 1 .84 3.46c1.86 7.62 3.17 10.71 5.56 11.67 2.21.88 4.7.6 7.47-.72 3.48-1.69 7.22-4.94 11.2-9.47 1.52-1.7 2.97-3.49 4.59-5.57l3.16-4.1c2.59-3.23 6.07-12.21 8.39-20.23v3.45c-2.29 7.2-5.27 14.5-7.61 17.41-.44.55-2.67 3.46-3.15 4.09-1.63 2.1-3.1 3.9-4.62 5.62-4.08 4.61-7.9 7.94-11.53 9.7-2.99 1.44-5.77 1.75-8.28.74-2.84-1.13-4.2-4.34-6.15-12.35a2097.48 2097.48 0 0 1-.84-3.46c-.8-3.2-1.47-5.45-2.28-7.46-5.14-12.8-8.04-21.55-8.04-26.19 0-4.37 3.84-6.06 12.16-7.07a160.9 160.9 0 0 1 2.65-.3c3.5-.39 5.15-.64 6.53-1.1 1.26-.42 2.1-.7 3.88-1.26 5.34-1.68 9.11-3 19.1-6.74 3.53-1.32 6.22-1.84 8.18-1.61zM0 292c10.13-11.31 18.13-23.2 23.07-35.39 3.3-8.14 6.09-16.12 10.81-30.55l1.59-4.84c6.53-19.94 10.11-29.82 14.77-39.56 6.07-12.72 12.55-21.18 20.27-25.54 6.66-3.76 10.2-7.86 12.22-13.15a46.6 46.6 0 0 0 1.86-6.58c1.23-5.2 2.05-7.59 3.93-10.36 2.45-3.62 6.27-6.53 12.1-8.96 15.78-6.58 16.73-7.04 18.05-9.01.65-.98.83-2.15.74-4.51-.03-.73-.23-3.82-.24-4A93.8 93.8 0 0 1 119 94c0-10.04.18-11.37 2.37-13.15.52-.42 1.13-.8 2.07-1.3.27-.14 2.18-1.12 2.84-1.48a68.4 68.4 0 0 0 9.12-5.87c2.06-1.54 2.64-2.14 8.01-7.93 3.78-4.09 6.21-6.36 8.96-8.12 3.64-2.33 7.2-3.12 10.9-2.11 4.4 1.2 10.81 2 18.78 2.46 6.9.4 12.9.5 21.95.5 4.87 0 8.97.47 15.4 1.57 7.77 1.33 9.3 1.54 12.38 1.54 4.05 0 7.43-.88 10.68-2.95 5.06-3.22 8.11-4.67 11.2-5.2 3.62-.64 4.77-.46 16.55 2.06 17.26 3.7 30.85 1.36 41.06-9.7 5.1-5.53 5.48-8.9 3.48-14.8-.83-2.42-1.03-3.1-1.17-4.3-.29-2.52.5-4.71 2.71-6.93 2.65-2.65 4.72-9.17 6.22-18.29h2.03c-1.56 9.71-3.77 16.65-6.83 19.7-1.79 1.8-2.36 3.39-2.14 5.28.11 1 .3 1.63 1.07 3.9 2.22 6.53 1.76 10.66-3.9 16.8-10.77 11.66-25.07 14.13-42.95 10.3-11.42-2.45-12.55-2.62-15.78-2.06-2.77.48-5.62 1.84-10.47 4.92a20.93 20.93 0 0 1-11.76 3.27c-3.25 0-4.81-.22-12.73-1.57C212.74 59.46 208.73 59 204 59c-9.1 0-15.11-.1-22.07-.5-8.09-.47-14.62-1.29-19.2-2.54-5.62-1.53-10.17 1.38-17.85 9.66-5.5 5.94-6.08 6.53-8.28 8.18a70.38 70.38 0 0 1-9.38 6.03c-.68.37-2.58 1.35-2.84 1.49-.84.44-1.35.76-1.75 1.08-1.47 1.2-1.63 2.4-1.63 11.6 0 1.85.06 3.54.17 5.44 0 .17.2 3.28.24 4.03.1 2.75-.13 4.29-1.08 5.71-1.67 2.5-2.27 2.8-18.95 9.74-5.48 2.29-8.99 4.96-11.2 8.24-1.71 2.51-2.47 4.73-3.64 9.7-.83 3.5-1.21 4.92-1.94 6.83-2.18 5.73-6.05 10.19-13.1 14.18-7.3 4.12-13.55 12.28-19.46 24.66-4.6 9.64-8.17 19.46-14.67 39.32l-1.58 4.84c-4.75 14.47-7.54 22.48-10.86 30.69-5.28 13.01-13.95 25.65-24.93 37.6v-2.97zm0 78v-.5l1-.01c6.32 0 7.47 5.2 4.6 13.36a60.36 60.36 0 0 1-5.6 11.3v-1.92a57.76 57.76 0 0 0 4.65-9.72c2.69-7.6 1.71-12.02-3.65-12.02-.34 0-.67 0-1 .02v-46.59a340.96 340.96 0 0 0 13.71-8.34c13.66-9.46 29.79-37.6 29.79-53.59 0-18.1 21.57-72.64 32.23-79.42 12.71-8.09 32.24-27.96 35.8-37.75 1.93-5.3 5.5-7.27 14.42-9.37 6.15-1.44 8.64-2.42 10.67-4.79 1.5-1.74 2.72-4.79 4.33-10.3.23-.78 1.9-6.68 2.43-8.46 3.62-12.08 7.3-18.49 13.47-20.39 2.5-.76 3.03-.98 9.74-3.7 7.49-3.03 11.97-4.43 17.12-4.92 6.75-.65 13.13.75 19.55 4.67 5.43 3.32 12.19 4.72 20.17 4.56 6.03-.12 12.2-1.07 19.83-2.8 1.82-.4 7.38-1.74 8.26-1.94 2.69-.6 4.34-.89 5.48-.89 4.97 0 8.93-.05 14.2-.27 7.9-.32 15.56-.92 22.75-1.88 8.5-1.14 15.9-2.73 21.88-4.82 18.9-6.62 32.64-18.3 33.67-27.59.29-2.56.4-2.96 2.79-11.11 2.33-7.95 3.21-12.93 2.72-18.23-.2-2.24-.69-4.38-1.48-6.42-1.5-3.92-2.63-9.4-3.43-16.18h.9c.77 6.47 1.89 11.72 3.47 15.82a24.93 24.93 0 0 1 1.54 6.69c.5 5.46-.4 10.54-2.77 18.6-2.36 8.06-2.47 8.47-2.74 10.95-1.09 9.75-15.1 21.68-34.33 28.41-6.06 2.12-13.52 3.72-22.09 4.87-7.22.96-14.92 1.57-22.83 1.89-5.3.21-9.27.27-14.25.27-1.04 0-2.64.27-5.26.87-.87.2-6.43 1.53-8.26 1.94-7.68 1.73-13.92 2.7-20.03 2.82-8.15.17-15.1-1.27-20.71-4.7-6.23-3.81-12.4-5.16-18.93-4.54-5.04.48-9.44 1.86-16.84 4.86-6.75 2.74-7.29 2.95-9.82 3.73-5.73 1.76-9.28 7.96-12.81 19.72-.53 1.77-2.2 7.66-2.43 8.46-1.66 5.65-2.91 8.78-4.53 10.67-2.22 2.58-4.84 3.62-12.01 5.3-7.8 1.83-11.13 3.66-12.9 8.54-3.65 10.04-23.32 30.06-36.2 38.25C65.94 190 44.5 244.2 44.5 262c0 16.34-16.3 44.78-30.22 54.41-2.14 1.48-8.24 5.12-14.28 8.68v-1.16 46.09zm0-173.7v-1.11c7.42-3.82 14.55-10.23 21.84-18.98 3.8-4.56 14.21-18.78 15.79-20.55 1.8-2.04 4.06-3.96 7.42-6.45 1.08-.8 4.92-3.57 5.49-3.99 9.36-6.85 14-11.96 15.98-19.36.8-2.98 1.54-6.78 2.46-12.3.23-1.44 2-12.46 2.56-15.79 2.87-16.77 5.73-26.79 10.07-32.1C92.46 52.43 101.5 38.13 101.5 33c0-2.54.34-3.35 6.05-15.71.68-1.49 1.25-2.74 1.77-3.93 2.5-5.75 3.9-10.04 4.14-13.36h1c-.23 3.48-1.66 7.87-4.23 13.76-.52 1.2-1.09 2.45-1.78 3.95-5.54 12.01-5.95 12.99-5.95 15.29 0 5.47-9.09 19.84-20.11 33.31-4.2 5.12-7.03 15.06-9.86 31.64-.57 3.33-2.33 14.33-2.57 15.78-.92 5.56-1.67 9.38-2.48 12.4-2.05 7.68-6.82 12.93-16.35 19.91l-5.49 3.98c-3.3 2.45-5.51 4.34-7.27 6.31-1.53 1.73-11.94 15.93-15.76 20.53-7.52 9.02-14.88 15.6-22.61 19.46zm0 361.83v-4.33c.48 2.36 1 4.35 1.6 6.15 2 6.03 4.6 8.26 8.19 6.59C28.76 557.69 43.5 542.4 43.5 527c0-16.2 6.37-31.99 17.1-46.3 1.88-2.5 3.66-4.4 5.53-6 .73-.62 1.45-1.18 2.3-1.8l2-1.43c3.68-2.68 5.32-5.28 7.08-12.59.75-3.07 1.38-5.02 4.2-13.26l.63-1.88c3.24-9.58 4.56-14.97 4.17-18.65-.48-4.43-3.8-5.23-11.3-1.64a81.12 81.12 0 0 1-9.15 3.7c-13.89 4.67-26.96 5.8-42.66 5.42l-1.95-.05-1.45-.02a39.8 39.8 0 0 0-15.05 2.96A21.81 21.81 0 0 0 0 438.37v-1.26a23.55 23.55 0 0 1 4.55-2.57 40.77 40.77 0 0 1 16.92-3.02l1.95.05c15.6.38 28.57-.75 42.32-5.37a80.12 80.12 0 0 0 9.04-3.65c8.04-3.84 12.16-2.85 12.72 2.43.42 3.89-.92 9.34-4.21 19.08l-.64 1.88c-2.8 8.2-3.43 10.15-4.16 13.18-1.82 7.52-3.59 10.34-7.47 13.16l-2 1.43c-.84.6-1.54 1.15-2.25 1.75a35.45 35.45 0 0 0-5.37 5.84c-10.61 14.15-16.9 29.74-16.9 45.7 0 15.88-15 31.45-34.29 40.45-4.3 2.01-7.39-.66-9.56-7.18-.23-.68-.44-1.39-.65-2.13zm0-62.16v-2.45l1.46 3.27c2.1 4.8 3.46 10.33 4.26 16.77.66 5.3.84 9.3 1.04 18.5.2 9.32.5 12.75 1.63 15.05 1.28 2.6 3.67 2.35 8.29-1.5 17.14-14.3 21.82-22.9 21.82-38.62 0-7.17 1.1-12.39 3.7-17.68 2.27-4.67 3.65-6.62 13.4-19.62a69.8 69.8 0 0 1 7.6-8.79 44.76 44.76 0 0 1 3.54-3.06c.38-.3.64-.52.89-.74a10.47 10.47 0 0 0 2.63-3.32 35.78 35.78 0 0 0 2.26-5.94l.37-1.2.36-1.15c.29-.91.48-1.55.66-2.16.45-1.53.74-2.68.91-3.66.38-2.2.12-3.49-.85-4.15-2.35-1.61-9.28-.24-23.8 4.94-9.54 3.4-16.12 4.17-27.85 4.26-7.71.06-10.43.4-13.25 2.12-3.48 2.12-5.84 6.4-7.58 14.26-.5 2.2-.99 4.19-1.49 5.98v-3.98l.51-2.22c1.8-8.1 4.28-12.6 8.04-14.9 3.04-1.85 5.86-2.2 13.77-2.26 11.61-.09 18.1-.84 27.51-4.2 14.93-5.32 21.95-6.71 24.7-4.83 1.38.94 1.71 2.6 1.28 5.15a33.69 33.69 0 0 1-.94 3.78l-.66 2.17-.36 1.15-.37 1.2a36.64 36.64 0 0 1-2.33 6.1c-.8 1.53-1.61 2.52-2.86 3.61l-.92.77-1.02.83c-.9.74-1.65 1.4-2.47 2.18a68.84 68.84 0 0 0-7.48 8.66c-9.7 12.93-11.07 14.87-13.31 19.46-2.52 5.15-3.59 10.22-3.59 17.24 0 16.04-4.82 24.91-22.18 39.38-5.04 4.2-8.18 4.55-9.83 1.18-1.22-2.5-1.52-5.94-1.73-15.47-.2-9.16-.38-13.15-1.03-18.4-.79-6.34-2.12-11.8-4.19-16.49L0 495.98zM379.27 0h1.04l1.5 5.26c3.28 11.56 4.89 19.33 5.26 27.8.49 11.01-1.52 21.26-6.63 31.17-7.8 15.13-20.47 26.5-36.22 34.1-12.38 5.96-26.12 9.17-36.22 9.17-6.84 0-17.24 1.38-37.27 4.62l-2.27.37c-24.5 3.99-31.65 5-37.46 5-3.49 0-4.08-.08-19.54-2.8-3.56-.64-6.32-1.1-9-1.5-20.23-2.96-31-1.2-31.96 7.86-.1.85-.18 1.72-.29 2.81l-.27 2.73c-1.1 10.9-2.02 15.73-4.31 19.96-2.9 5.34-7.77 7.95-15.63 7.95-10.2 0-12.92.6-15.5 3.17.52-.51-5.03 5.85-8.16 8.7-2.75 2.5-14.32 12.55-15.77 13.83a341.27 341.27 0 0 0-6.54 5.92c-6.97 6.49-11.81 11.76-14.6 16.15-5.92 9.3-10.48 18.04-11.69 24.08-1.66 8.3 3.67 9.54 19.02 1.21a626.23 626.23 0 0 1 44.54-21.9c3.5-1.56 14.04-6.2 15.68-6.95 5.05-2.25 8.3-3.8 10.78-5.15l1.95-1.07 2.18-1.18c1.76-.94 3.38-1.76 5-2.55 18.1-8.72 34.48-10.46 50.33-1.2 22.89 13.34 38.28 37.02 38.28 56.44 0 19.12-.73 25.13-5.18 33.2a45.32 45.32 0 0 1-4.94 7.12c-6.47 7.77-11.81 16.2-12.76 21.27-1.2 6.34 4.69 7.03 20.17-.05 13.31-6.08 22.4-14.95 28.5-26.32a80.51 80.51 0 0 0 6.1-15.13c.9-2.98 3.17-11.65 3.41-12.48a29.02 29.02 0 0 1 1.75-4.83c7.47-14.93 21.09-30.5 36.25-37.24 7.61-3.38 13-9.65 19.4-20.79.84-1.48 4.26-7.64 5.14-9.17 3.52-6.1 6.22-9.7 9.37-11.98 10.15-7.4 28.7-11.1 50.29-11.1 7.52 0 16.54-1.24 27.51-3.58a420.1 420.1 0 0 0 14.96-3.52c-1.3.33 15.54-3.98 19.42-4.89 14.15-3.33 41.07-5.01 64.11-5.01 17.36 0 27.82-9.23 38.53-38.67 6.62-18.21 6.62-26.37 2.69-34.35l-1.18-2.37A13.36 13.36 0 0 1 587.5 58c0-4.03 0-4.01 2.5-24.56.46-3.73.8-6.74 1.12-9.64.9-8.45 1.38-15.2 1.38-20.8 0-.94-.02-1.94-.04-3h1c.03 1.06.04 2.06.04 3 0 5.65-.48 12.43-1.39 20.9-.3 2.91-.66 5.93-1.11 9.66-2.5 20.45-2.5 20.47-2.5 24.44 0 1.97.45 3.57 1.45 5.68.24.51 1.16 2.35 1.17 2.36 4.06 8.24 4.06 16.68-2.65 35.13-10.84 29.8-21.63 39.33-39.47 39.33-22.96 0-49.83 1.68-63.89 4.99-3.86.9-20.69 5.2-19.4 4.88a421.05 421.05 0 0 1-14.99 3.53c-11.04 2.35-20.11 3.6-27.72 3.6-21.4 0-39.76 3.67-49.7 10.9-3 2.19-5.64 5.7-9.1 11.68-.87 1.52-4.29 7.68-5.14 9.17-6.49 11.3-12 17.71-19.86 21.2-14.9 6.63-28.38 22.03-35.75 36.77a28.17 28.17 0 0 0-1.69 4.67c-.23.8-2.5 9.49-3.4 12.5a81.48 81.48 0 0 1-6.19 15.3c-6.2 11.56-15.44 20.58-28.96 26.76-16.1 7.36-23 6.55-21.58-1.04 1-5.29 6.4-13.83 12.99-21.73a44.33 44.33 0 0 0 4.82-6.96c4.35-7.88 5.06-13.77 5.06-32.72 0-19.04-15.19-42.4-37.72-55.55-15.57-9.08-31.62-7.38-49.45 1.21a132.9 132.9 0 0 0-7.14 3.71l-1.95 1.07a158.83 158.83 0 0 1-10.85 5.19c-1.65.74-12.18 5.38-15.69 6.95a625.25 625.25 0 0 0-44.46 21.86c-15.95 8.66-22.37 7.16-20.48-2.29 1.24-6.2 5.83-15.02 11.82-24.42 2.85-4.48 7.74-9.8 14.77-16.34 1.98-1.85 4.12-3.79 6.56-5.94 1.46-1.29 13.02-11.33 15.75-13.82 3.09-2.8 8.6-9.14 8.14-8.67 2.82-2.82 5.75-3.46 16.2-3.46 7.5 0 12.04-2.43 14.75-7.42 2.2-4.07 3.11-8.84 4.2-19.59l.26-2.73.3-2.81c.56-5.42 4.47-8.5 11.23-9.6 5.44-.88 12.51-.51 21.86.86 2.7.4 5.47.86 9.04 1.49 15.33 2.7 15.96 2.8 19.36 2.8 5.73 0 12.9-1.03 37.3-5l2.27-.36c20.1-3.26 30.52-4.64 37.43-4.64 9.95 0 23.54-3.18 35.78-9.08 15.57-7.5 28.09-18.73 35.78-33.65 5.02-9.75 7-19.82 6.51-30.67-.37-8.37-1.96-16.08-5.23-27.57L379.27 0zm13.68 0h1.02c.78 3.9 1.92 8.7 3.51 14.88 3.63 14.05 3.06 27.03-.75 38.77a61 61 0 0 1-11.35 20.68 138.36 138.36 0 0 1-19.32 18.77c-11.32 9.02-23.36 15.49-35.95 18.39a258.63 258.63 0 0 1-22.57 4.07c-3.17.44-6.36.85-10.3 1.32l-9.39 1.12c-11.53 1.41-17.45 2.55-21.64 4.46-9.28 4.21-28.35 6.04-49.21 6.04-1.37 0-2.8-.12-4.3-.35-2.62-.41-5-1.03-9.14-2.29-7.34-2.21-9.63-2.75-12.63-2.56-3.9.23-6.63 2.29-8.47 6.89-1.86 4.66-2.42 7.53-3.34 14.98-1.1 8.98-2.87 12.12-9.97 14.3a40.12 40.12 0 0 0-6.8 2.66c-.63.33-1.16.64-1.76 1.02l-1.34.86c-1.9 1.14-3.86 1.49-9.25 1.49-3.2 0-8.83-.55-9.51-.39-1.22.28-.75-.14-7.14 6.24-1.5 1.5-3.49 3.18-6.32 5.37-1.52 1.18-7.16 5.43-7.94 6.03-4.96 3.78-8.33 6.6-11.06 9.38-4.88 4.98-6.85 9.15-5.56 12.7 1.34 3.67 4.07 4.42 8.9 2.82a55.72 55.72 0 0 0 7.77-3.48c1.5-.77 7.78-4.13 9.37-4.96a116.8 116.8 0 0 1 12.31-5.68 162.2 162.2 0 0 0 11.04-4.84c2.04-.97 10.74-5.16 13-6.22 4.41-2.1 8.1-3.78 11.65-5.29 17.14-7.3 29.32-9.9 37.67-6.65l5.43 2.1c2.3.88 4.17 1.62 6.02 2.38a150.9 150.9 0 0 1 13.07 6c18.34 9.63 30.35 22.13 34.79 39.87 6.96 27.85 3.6 45.53-8.08 62.4-3.97 5.75-3.52 9.2.06 8.97 4.14-.28 10.21-4.95 15.11-12.52 3.1-4.8 5.1-10.45 8.05-21.53l1.69-6.35c.66-2.47 1.24-4.52 1.83-6.5 4.93-16.56 11-27.28 21.56-34.76 7.15-5.06 23.73-15.5 25.48-16.75 6.74-4.81 10.53-9.44 14.34-18 7.74-17.44 21.09-24.34 44.47-24.34 9.36 0 17.91-1.13 29.53-3.49a624.86 624.86 0 0 0 6.2-1.28c2.4-.5 4.07-.84 5.66-1.13 4.03-.74 7.04-1.1 9.61-1.1 4.44 0 9.39-1 31.39-5.99l2.95-.66c16.34-3.67 25.64-5.35 31.66-5.35 1.54 0 2.4.01 6.4.1 7.8.15 12.27.13 17.33-.2 16.41-1.06 26.73-5.36 29.8-14.56a87.1 87.1 0 0 1 3.55-8.83c-.15.31 2.29-4.96 2.9-6.38 5.38-12.3 5.57-21.92-1.44-39.44a86.4 86.4 0 0 1-5.26-20.72c-1.61-11.98-1.38-23.14.1-40.35l.2-2.12h1l-.2 2.2c-1.48 17.15-1.7 28.24-.11 40.14a85.4 85.4 0 0 0 5.2 20.47c7.1 17.78 6.91 27.67 1.43 40.22-.62 1.43-3.06 6.72-2.91 6.4a86.17 86.17 0 0 0-3.52 8.73c-3.23 9.72-13.9 14.15-30.68 15.24-5.1.33-9.58.35-17.42.2-3.98-.09-4.84-.1-6.37-.1-5.91 0-15.18 1.67-31.44 5.32l-2.95.67c-22.16 5.02-27.05 6.01-31.61 6.01-2.5 0-5.45.36-9.43 1.09-1.58.29-3.25.62-5.64 1.11a4894.21 4894.21 0 0 0-6.2 1.29c-11.68 2.37-20.3 3.51-29.73 3.51-23.02 0-36 6.71-43.53 23.66-3.9 8.8-7.82 13.58-14.7 18.5-1.78 1.27-18.36 11.7-25.48 16.75-10.34 7.32-16.3 17.87-21.19 34.23-.58 1.96-1.15 4-1.82 6.47l-1.69 6.35c-2.98 11.18-5 16.9-8.17 21.81-5.05 7.81-11.37 12.68-15.89 12.98-4.7.31-5.3-4.23-.94-10.53 11.52-16.64 14.82-34.03 7.92-61.6-4.35-17.42-16.16-29.72-34.27-39.22-4-2.1-8.2-4-12.99-5.97-1.84-.75-3.7-1.49-6-2.38l-5.43-2.08c-8.03-3.12-20.02-.58-36.92 6.63-3.52 1.5-7.21 3.19-11.61 5.27l-13 6.22c-4.71 2.22-8.16 3.75-11.11 4.88a115.87 115.87 0 0 0-12.21 5.63c-1.58.83-7.86 4.18-9.37 4.96a56.55 56.55 0 0 1-7.9 3.54c-5.3 1.75-8.62.85-10.17-3.43-1.46-4.02.66-8.5 5.8-13.74 2.75-2.82 6.16-5.66 11.15-9.48.79-.6 6.43-4.85 7.94-6.02a66.96 66.96 0 0 0 6.23-5.28c6.74-6.74 6.1-6.16 7.61-6.51.87-.2 6.69.36 9.74.36 5.22 0 7.03-.32 8.74-1.35l1.31-.84c.62-.4 1.18-.72 1.84-1.07a41.07 41.07 0 0 1 6.96-2.72c6.64-2.04 8.22-4.84 9.28-13.47.93-7.53 1.5-10.47 3.4-15.24 1.99-4.95 5.04-7.26 9.34-7.51 3.17-.2 5.5.35 12.97 2.6a63.54 63.54 0 0 0 9.02 2.26c1.45.22 2.83.34 4.14.34 20.71 0 39.7-1.82 48.8-5.96 4.32-1.96 10.29-3.1 21.93-4.53l9.4-1.12c3.92-.48 7.11-.88 10.27-1.32 8.16-1.14 15.4-2.43 22.49-4.06 12.42-2.86 24.33-9.26 35.55-18.2a137.4 137.4 0 0 0 19.18-18.64 60.02 60.02 0 0 0 11.15-20.32c3.76-11.57 4.32-24.36.75-38.23A284.86 284.86 0 0 1 392.95 0zM506.7 0h1.26c-.5.66-.9 1.18-1.17 1.51-3.95 4.96-6.9 7.92-9.82 9.57A10.02 10.02 0 0 1 492 12.5c-2.38 0-4.24.67-6.71 2.21l-2.65 1.71c-4.38 2.8-8.01 4.08-13.64 4.08-5.6 0-9.99-1.26-16.08-4.05a202.63 202.63 0 0 1-2.3-1.06l-2.18-.98c-1.6-.7-2.92-1.17-4.17-1.48a13.42 13.42 0 0 0-3.27-.43c-2.3 0-4.3-.68-11-3.37l-1.56-.62c-5-1.97-8.1-2.82-10.52-2.66-2.93.2-4.42 2.03-4.42 6.15 0 20.76-5.21 50.42-12.15 57.35-7.58 7.59-26.55 23.7-34.06 29.06-13.16 9.4-31.17 20.2-44.11 25.06a106.87 106.87 0 0 1-13.32 4.03c-3.28.78-6.6 1.43-11.25 2.24-.53.1-8.8 1.5-11.5 1.99-4.86.87-9.3 1.74-14 2.76-20.62 4.48-25.07 5.01-38.11 5.01-2.49 0-2.9-.07-14.05-2-2.42-.42-4.31-.73-6.15-1-8.11-1.19-13.83-1.36-17.64-.2-4.54 1.4-5.93 4.65-3.7 10.52 2.02 5.28 4.84 8.61 8.84 10.74 3.26 1.74 6.75 2.6 13.82 3.71 9.42 1.48 10.94 1.75 15.5 2.92a78.2 78.2 0 0 1 18.62 7.37c8.3 4.58 14.58 11.5 19.98 20.89 2.73 4.73 9.46 19.33 10.54 21.19 3.4 5.85 6.26 6.63 10.89 2 4.95-4.94 10.35-8.37 21.13-14.06.47-.25 2.06-1.1 2.12-1.12 7.98-4.21 11.92-6.51 15.87-9.54 5.11-3.9 8.66-8.1 10.77-13.11 8.52-20.24 20.75-33.31 32.46-33.31l5.5.03c10.53.08 17.35.02 24.9-.31 13.66-.62 23.78-2.09 29.39-4.67 5.85-2.7 13.42-5.49 24.18-9.02 3.46-1.14 6.29-2.05 12.7-4.1 7.7-2.45 11.08-3.54 15.17-4.9a1059.43 1059.43 0 0 1 11.33-3.72c3.67-1.2 5.96-2 8.03-2.78a59.88 59.88 0 0 0 6.66-2.94c1.87-.98 3.76-2.1 5.86-3.5 3.48-2.33 6.15-3.13 12.04-4.13l1.15-.2c5.71-1.01 9-2.3 12.76-5.63 7.82-6.96 8.58-23.18 3.84-44.52-1.7-7.67-2.1-19.28-1.57-35.47A837.22 837.22 0 0 1 546.76 0h1l-.15 3.06c-.32 6.42-.53 11.02-.68 15.62-.51 16.1-.12 27.65 1.56 35.21 4.82 21.68 4.04 38.2-4.16 45.48-3.91 3.48-7.37 4.84-13.24 5.87l-1.16.2c-5.76.99-8.32 1.75-11.65 3.98a63.73 63.73 0 0 1-5.96 3.56 60.86 60.86 0 0 1-6.77 2.99c-2.09.79-4.39 1.58-8.07 2.79a5398.31 5398.31 0 0 1-11.32 3.71c-4.1 1.37-7.48 2.46-15.18 4.92-6.42 2.04-9.24 2.95-12.7 4.08-10.73 3.53-18.27 6.3-24.07 8.98-5.76 2.66-15.97 4.14-29.77 4.77-7.56.33-14.4.39-24.95.31l-5.49-.03c-11.19 0-23.16 12.79-31.54 32.7-2.19 5.19-5.84 9.52-11.08 13.52-4.02 3.07-7.99 5.39-16.01 9.62l-2.12 1.12c-10.7 5.65-16.04 9.04-20.9 13.9-5.14 5.14-8.75 4.15-12.45-2.22-1.12-1.92-7.85-16.5-10.54-21.2-5.33-9.24-11.48-16.02-19.6-20.5a77.2 77.2 0 0 0-18.4-7.28c-4.5-1.17-6.02-1.43-15.4-2.9-7.17-1.12-10.74-2-14.13-3.81-4.22-2.25-7.2-5.77-9.3-11.27-2.43-6.39-.78-10.26 4.34-11.83 4-1.22 9.82-1.05 18.08.17 1.84.27 3.74.58 6.17 1 11.02 1.9 11.48 1.98 13.88 1.98 12.96 0 17.35-.52 37.9-4.99 4.71-1.02 9.16-1.9 14.03-2.77 2.71-.48 10.98-1.9 11.5-1.98 4.64-.81 7.95-1.46 11.2-2.23 4.55-1.07 8.76-2.34 13.2-4 12.83-4.81 30.79-15.59 43.88-24.94 7.47-5.33 26.4-21.4 33.94-28.94C407.3 61.98 412.5 32.49 412.5 12c0-4.61 1.86-6.9 5.35-7.15 2.63-.18 5.8.7 10.96 2.73l1.56.62c6.53 2.62 8.53 3.3 10.63 3.3 1.14 0 2.3.16 3.5.46 1.32.33 2.68.82 4.34 1.53a90.97 90.97 0 0 1 3.34 1.52l1.15.54c5.98 2.73 10.23 3.95 15.67 3.95 5.41 0 8.87-1.21 13.1-3.92.2-.13 2.1-1.38 2.66-1.72 2.62-1.63 4.64-2.36 7.24-2.36 1.47 0 2.94-.43 4.47-1.3 2.78-1.56 5.67-4.45 9.54-9.31l.7-.89zM324.54 600h-2.03c.49-2.96.91-6.2 1.28-9.66.44-4.1.76-8.25.98-12.21.08-1.39.14-2.65-.35-7.29-.47-1.94-.93-4.14-1.36-6.54-2.01-11.26-2.66-22.9-1.14-33.78a60.76 60.76 0 0 1 5.18-17.95 70.78 70.78 0 0 1 12.6-18.22c3.38-3.6 5.53-5.5 11.83-10.79 4.5-3.78 6.35-5.56 7.52-7.5.64-1.07.95-2.06.95-3.06 0-1.75 0-1.74-.75-9.23-.36-3.7-.57-6.3-.68-8.96-.5-12.1 1.62-19.6 8.11-21.76 15.9-5.3 25.89-12.1 33.45-25.54C409.6 390.65 425.85 376 436 376c12.36 0 20-1.96 29.41-8.8 6.76-4.92 9.5-6.6 12.47-7.46 2.22-.64 3.8-.74 9.12-.74 1.86 0 3.53-.83 5.57-2.62 1.08-.96 5.11-5.12 5.6-5.6 6.04-5.85 11.98-8.78 20.83-8.78 2.45 0 4.54.04 7.32.12 7.51.23 8.87.17 11.27-.7 3.03-1.1 5.53-3.03 14.75-11.17 8-7.06 10.72-8.92 22.87-16.47 1.44-.9 2.59-1.63 3.69-2.37a69.45 69.45 0 0 0 9.46-7.5c4.12-3.88 8.02-7.85 11.64-11.9v2.98a201.58 201.58 0 0 1-10.27 10.38c-3.18 3-6.2 5.35-9.72 7.7-1.12.76-2.28 1.5-3.75 2.4-12.05 7.5-14.71 9.32-22.6 16.28-9.46 8.35-12.01 10.32-15.39 11.55-2.74 1-4.19 1.06-12.01.82-2.76-.08-4.83-.12-7.26-.12-8.27 0-13.75 2.7-19.43 8.22-.44.43-4.52 4.64-5.68 5.66-2.37 2.09-4.46 3.12-6.89 3.12-5.1 0-6.6.1-8.56.66-2.67.78-5.29 2.37-11.85 7.15-9.8 7.13-17.85 9.19-30.59 9.19-9.22 0-24.96 14.2-34.13 30.49-7.84 13.94-18.24 21.02-34.55 26.46-5.31 1.77-7.21 8.51-6.75 19.78.1 2.6.31 5.19.68 8.84.75 7.62.75 7.58.75 9.43 0 1.38-.42 2.73-1.24 4.09-1.33 2.2-3.26 4.07-7.94 8-6.25 5.24-8.36 7.12-11.67 10.63a68.8 68.8 0 0 0-12.25 17.71 58.8 58.8 0 0 0-5 17.36c-1.49 10.66-.85 22.09 1.13 33.15.43 2.37.88 4.53 1.33 6.44.16.66.3 1.25.6 4.06a249.3 249.3 0 0 1-1.17 16.12c-.37 3.37-.78 6.53-1.25 9.44zm-13.4 0h-1.05l.12-.28c3.07-7.16 4.29-11.83 4.29-18.72 0-3.57-.07-4.93-.76-15.65-.77-12.04-1-19.64-.55-28.3.58-11.5 2.4-22.1 5.81-32.16 1.3-3.8 2.8-7.5 4.55-11.1 3.46-7.14 6.83-12.39 10.42-16.6a59.02 59.02 0 0 1 4.35-4.56c.43-.4 3-2.8 3.67-3.45 5.72-5.6 7.51-11.52 7.51-29.18 0-18.84 2.9-23.77 15.82-28.24 1.09-.37 1.92-.67 2.77-.98a51.3 51.3 0 0 0 6.1-2.7c4.95-2.6 9.64-6.22 14.44-11.42 25.5-27.63 37.15-35.16 56.37-35.16 8.28 0 14.54-1.95 22-6.3 1.78-1.03 13.82-8.82 18.16-11.27 2.83-1.59 5.66-3.03 8.63-4.39 7.92-3.6 13.97-4.45 26.6-4.8 7.53-.2 10.7-.49 14.26-1.58 4.55-1.4 8.06-4 10.93-8.43 2.2-3.41 6.85-7.08 14.66-12.06 1.61-1.03 3.27-2.05 5.65-3.5 9.53-5.85 11.56-7.13 14.81-9.57 5.34-4 9.3-8.37 13.68-14.77a204.2 204.2 0 0 0 5.62-8.75v1.9c-1.97 3.17-3.4 5.38-4.8 7.42-4.42 6.48-8.46 10.92-13.9 15-3.29 2.46-5.32 3.75-14.89 9.61a375.06 375.06 0 0 0-5.63 3.5c-7.7 4.9-12.26 8.52-14.36 11.76-3 4.63-6.7 7.39-11.48 8.85-3.68 1.12-6.9 1.42-14.53 1.63-12.5.34-18.44 1.18-26.2 4.7a111.08 111.08 0 0 0-8.56 4.35c-4.3 2.43-16.34 10.22-18.15 11.27-7.6 4.43-14.03 6.43-22.5 6.43-18.87 0-30.3 7.4-55.63 34.84-4.88 5.28-9.67 8.97-14.7 11.62-2 1.05-4 1.92-6.23 2.75-.86.32-1.7.62-5.37 1.87-5.08 1.76-7.44 3.25-9.28 6.37-2.23 3.78-3.29 9.94-3.29 20.05 0 17.9-1.87 24.07-7.8 29.89-.69.67-3.27 3.06-3.69 3.46a58.04 58.04 0 0 0-4.28 4.49c-3.53 4.14-6.86 9.32-10.28 16.38a95.19 95.19 0 0 0-4.5 10.99c-3.38 9.97-5.18 20.48-5.76 31.9-.44 8.6-.22 16.17.55 28.17.69 10.76.76 12.12.76 15.72 0 6.35-1.02 10.87-4.35 19zm25.08 0h-1c-.04-4.73.06-9.39.28-15.02.26-6.41-.4-11.79-2.53-24.37l-.31-1.86c-2.12-12.55-2.76-19.35-1.97-26.47 1.03-9.25 4.75-16.68 12-22.67 22.04-18.2 29.81-30.18 29.81-44.61 0-2.6-.3-4.81-.98-8.17-.97-4.79-1.1-5.68-.97-7.57.2-2.56 1.27-4.7 3.56-6.72 2.67-2.35 7.05-4.6 13.72-7.01 9.72-3.5 15.52-9.18 24.3-21.57l1.78-2.5c4.48-6.33 7.1-9.63 10.43-12.78 4.31-4.07 8.98-6.77 14.54-8.17 13.3-3.32 20.37-5.47 25.34-7.64a49.5 49.5 0 0 0 5.28-2.7c1.1-.65 1.75-1.04 4.24-2.6 2.7-1.68 5.22-2.08 11.38-2.28 5.44-.18 7.9-.43 10.97-1.41a21.47 21.47 0 0 0 9.54-6.22c4.87-5.3 10.03-7.61 17.79-8.9 1.07-.18 1.88-.3 3.86-.58 6.9-.97 9.94-1.69 13.48-3.62 4.5-2.45 6.79-4.44 23.46-19.68l3.14-2.85c9.65-8.71 16.12-13.83 21.42-16.48 4.25-2.12 7.6-4.69 11.22-8.6v1.45c-3.42 3.57-6.69 6-10.78 8.05-5.18 2.59-11.61 7.67-21.2 16.32l-3.12 2.85c-16.8 15.35-19.05 17.3-23.66 19.82-3.68 2-6.8 2.75-13.82 3.73-1.97.28-2.78.4-3.84.57-7.56 1.26-12.52 3.48-17.21 8.6a22.47 22.47 0 0 1-9.97 6.5c-3.2 1-5.72 1.27-11.25 1.45-5.98.2-8.39.57-10.89 2.13a144 144 0 0 1-4.25 2.61 50.48 50.48 0 0 1-5.39 2.75c-5.04 2.2-12.15 4.37-25.5 7.7-9.74 2.44-15.26 7.65-24.4 20.56l-1.77 2.5c-8.9 12.54-14.82 18.34-24.78 21.93-6.57 2.36-10.85 4.57-13.4 6.82-2.1 1.86-3.05 3.74-3.22 6.04-.13 1.76 0 2.63.95 7.3.7 3.42 1 5.7 1 8.37 0 14.79-7.93 27-30.18 45.39-7.03 5.8-10.64 13-11.64 22-.78 7-.14 13.73 1.96 26.2l.32 1.85c2.15 12.65 2.8 18.07 2.54 24.58-.22 5.57-.32 10.2-.28 14.98zM95.9 600h-2.04c.68-3.82 1.14-8.8 1.61-15.98.2-3.11.27-4.06.39-5.6 1.3-17.54 4.04-27.14 11.5-33.2 4.65-3.77 7.22-8.92 8.67-16 .51-2.52.7-3.87 1.33-9.17.66-5.5 1.16-8.06 2.24-10.36 1.45-3.09 3.82-4.69 7.39-4.69 14.28 0 38.48 9.12 53.6 20.2 8.66 6.35 21.26 13.32 31.74 17.11 13.03 4.71 21.89 4.41 24.75-1.73 1.7-3.64 1.92-4.11 2.65-5.77 2.93-6.67 4.69-12.2 5.25-17.5.23-2.17.24-4.23.02-6.2-.32-2.75-1.42-4.55-4.08-7.35l-1.32-1.37a30.59 30.59 0 0 1-2.41-2.79 30.37 30.37 0 0 1-2.5-4.07l-1.13-2.14c-1.62-3.1-2.68-4.6-4.12-5.56-5.26-3.5-14.8-5.5-28.55-6.83a272.42 272.42 0 0 0-9.04-.71l-2.18-.17c-9.57-.73-15.12-1.56-19.06-3.2C156.57 471.07 136 450.5 136 440c0-5.34 1.74-9.53 5.47-14.13 1.98-2.44 11.12-11.71 12.79-13.54 4.52-4.97 10.16-9.54 17.68-14.66 2.8-1.9 14.78-9.6 17.49-11.49a50.54 50.54 0 0 0 6.34-5.43c1.53-1.5 6.96-7.13 7.12-7.3 7.18-7.3 12.7-11.56 19.74-14.38 3.36-1.34 8.13-2.79 17.45-5.38a9577.18 9577.18 0 0 1 11.78-3.28 602.6 602.6 0 0 0 12.67-3.7c20.4-6.24 34-12.08 40.79-18.44 8.74-8.2 11.78-13.84 15.73-26.02 2.02-6.22 3.09-9.04 5.07-12.72 9.54-17.71 28.71-39.37 43.5-45.45C383.77 238.25 389 232.34 389 226c0-2.89 2.73-8.4 6.83-13.73 4.76-6.2 10.65-11.36 16.75-14.18 12.5-5.77 33.5-10.09 47.42-10.09 5.32 0 9.83-1.5 16.42-4.89 9.2-4.71 10.1-5.11 13.58-5.11 10.42 0 32.06-2.55 45.76-5.97l3.88-.98 3.47-.89c2.6-.66 4.33-1.08 5.93-1.43 3.9-.86 6.76-1.23 9.58-1.17 2.74.06 5.47.52 8.67 1.48 4.56 1.37 13.71-.9 22.87-5.68a68.07 68.07 0 0 0 9.84-6.2v2.4c-11.09 8.14-25.76 13.66-33.29 11.4a29.72 29.72 0 0 0-8.13-1.4c-2.63-.05-5.36.3-9.11 1.12a238 238 0 0 0-9.33 2.3l-3.9.99C522.38 177.43 500.58 180 490 180c-2.99 0-3.91.4-12.67 4.89-6.85 3.51-11.61 5.11-17.33 5.11-13.65 0-34.35 4.26-46.58 9.9-5.78 2.67-11.42 7.62-16 13.58-3.85 5.02-6.42 10.2-6.42 12.52 0 7.27-5.8 13.82-20.62 19.92-14.27 5.88-33.16 27.21-42.5 44.55-1.9 3.55-2.95 6.28-4.93 12.4-4.05 12.47-7.23 18.39-16.27 26.86-7.08 6.64-20.87 12.57-41.57 18.89a604.52 604.52 0 0 1-12.7 3.71 1495.1 1495.1 0 0 1-11.8 3.28c-9.24 2.58-13.97 4.01-17.24 5.32-6.73 2.69-12.05 6.8-19.05 13.92-.15.15-5.6 5.8-7.15 7.32a52.4 52.4 0 0 1-6.6 5.65c-2.74 1.92-14.75 9.63-17.5 11.5-7.4 5.04-12.94 9.52-17.33 14.35-1.72 1.9-10.8 11.11-12.71 13.46-3.47 4.26-5.03 8.03-5.03 12.87 0 9.5 20 29.5 33.38 35.08 3.67 1.53 9.1 2.34 18.45 3.05a586.23 586.23 0 0 0 4.34.32c3.24.23 5.07.37 6.93.55 14.08 1.37 23.82 3.4 29.45 7.17 1.82 1.2 3.02 2.91 4.8 6.29l1.11 2.13a28.55 28.55 0 0 0 2.34 3.81c.62.83 1.3 1.6 2.26 2.61.23.24 1.1 1.16 1.32 1.37 2.93 3.09 4.24 5.23 4.61 8.5.24 2.12.23 4.33-.01 6.64-.59 5.55-2.4 11.25-5.41 18.1-.74 1.67-.96 2.15-2.66 5.8-3.49 7.47-13.33 7.8-27.25 2.77-10.67-3.86-23.43-10.92-32.25-17.38C164.62 515.96 140.82 507 127 507c-5 0-6.4 3.02-7.64 13.29a99.03 99.03 0 0 1-1.36 9.33c-1.53 7.5-4.3 13.04-9.37 17.16-6.87 5.58-9.5 14.78-10.77 31.8-.11 1.52-.18 2.47-.38 5.57-.46 7.01-.91 11.99-1.57 15.85zm8.05 0h-1.02c.29-1.41.58-2.94.9-4.59l1.05-5.62c2.5-13.3 4.2-19.92 6.68-24.05 1.7-2.84 3.68-5.5 8.05-11.03 8.21-10.36 10.88-14.55 10.88-18.71l-.02-1.69c-.02-1.78-.02-2.7.02-3.77.21-5.05 1.47-8.2 4.64-9.4 3.92-1.5 10.39.44 20.12 6.43 9.56 5.88 17.53 10.7 25.91 15.66 1.31.78 14.27 8.41 17.67 10.45a714.21 714.21 0 0 1 6.42 3.9c13.82 8.5 38.94 5.05 46.3-7.83 3.6-6.28 4.54-8.52 7.78-17.32a82.3 82.3 0 0 1 1.18-3.07 42.27 42.27 0 0 1 4.06-7.64c9.33-13.98 14.92-26.1 14.92-36.72 0-3.66.75-6.62 3.36-14.85.52-1.64.83-2.66 1.15-3.73 3.64-12.23 3.04-19.12-4.29-24a23.1 23.1 0 0 0-9.98-3.78c-7.2-.93-14.49 1.17-23.91 5.88-1.55.78-6.64 3.44-7.6 3.93a62.6 62.6 0 0 0-4.14 2.3l-4.4 2.66c-11.62 6.92-20.4 9.18-32.81 6.08-3.32-.84-6.24-1.4-13.1-2.64-13.25-2.39-18.7-3.75-23.33-6.46-6.23-3.67-7.46-9.02-2.88-16.65A93.1 93.1 0 0 1 172 415.42a157 157 0 0 1 8.32-7.66c-.07.05 6.16-5.3 7.82-6.77a85.12 85.12 0 0 0 6.5-6.33c7.7-8.46 12.78-13.36 20.08-18.57 9.94-7.1 21.4-12.36 35.18-15.58 37.03-8.64 51-12.7 58.83-17.93 8.6-5.73 21.3-24.77 36.84-54.81 5.22-10.1 12.27-18.4 21.13-25.71 5.13-4.24 9.56-7.25 17.55-12.23 7.42-4.62 9.62-6.14 11.38-8.16a21.15 21.15 0 0 0 2.95-4.87c.61-1.3 2.87-6.47 3-6.77 1.36-3 2.56-5.4 3.95-7.73 6.53-10.97 16.03-18 31.4-20.8 12.73-2.3 19.85-2.7 29.68-2.3 3.25.13 4.13.16 5.6.14 5.15-.07 9.71-1.04 16.61-3.8 20.74-8.3 38.75-12.04 59.19-12.04 3.05 0 6.03.15 10.48.48l2.09.16c12.45.96 18.08.96 25.34-.63a49.65 49.65 0 0 0 14.09-5.45v1.15a50.52 50.52 0 0 1-13.88 5.28c-7.38 1.61-13.08 1.61-25.63.65l-2.08-.16c-4.43-.33-7.39-.48-10.41-.48-20.3 0-38.2 3.72-58.81 11.96-7.01 2.8-11.7 3.8-16.97 3.88-1.5.02-2.39-.01-5.66-.14-9.76-.4-16.8-.01-29.47 2.3-15.06 2.73-24.32 9.58-30.71 20.31a72.8 72.8 0 0 0-3.9 7.63c-.12.28-2.39 5.47-3.01 6.79a22 22 0 0 1-3.1 5.1c-1.86 2.13-4.07 3.66-11.6 8.35-7.95 4.96-12.35 7.95-17.44 12.15-8.76 7.23-15.73 15.43-20.89 25.4-15.61 30.2-28.36 49.32-37.16 55.19-7.98 5.32-21.97 9.39-59.17 18.07-13.65 3.18-24.98 8.39-34.82 15.42-7.22 5.16-12.27 10.01-19.92 18.43a86.07 86.07 0 0 1-6.57 6.4c-1.67 1.48-7.91 6.83-7.84 6.77-3.27 2.84-5.8 5.16-8.26 7.62a92.1 92.1 0 0 0-14.27 18.13c-4.3 7.16-3.22 11.89 2.53 15.26 4.47 2.63 9.88 3.99 23.24 6.39a185.7 185.7 0 0 1 12.92 2.6c12.11 3.03 20.64.84 32.06-5.96l4.4-2.65c1.66-1 2.96-1.73 4.2-2.35.95-.48 6.04-3.14 7.6-3.92 9.59-4.8 17.04-6.94 24.49-5.98a24.1 24.1 0 0 1 10.4 3.93c7.82 5.21 8.45 12.52 4.7 25.13-.32 1.07-.64 2.1-1.16 3.74-2.57 8.12-3.31 11.04-3.31 14.55 0 10.88-5.66 23.14-15.08 37.28a41.28 41.28 0 0 0-3.97 7.46c-.37.9-.73 1.82-1.18 3.04-3.25 8.85-4.21 11.13-7.84 17.47-7.67 13.42-33.43 16.95-47.7 8.18a578.4 578.4 0 0 0-6.4-3.89c-3.4-2.04-16.36-9.67-17.67-10.45-8.38-4.97-16.36-9.78-25.92-15.66-9.5-5.85-15.7-7.7-19.24-6.36-2.68 1.02-3.8 3.82-4 8.51a61.12 61.12 0 0 0-.02 3.72l.02 1.7c0 4.5-2.69 8.73-11.52 19.87-3.92 4.95-5.87 7.59-7.55 10.39-2.39 3.97-4.08 10.56-6.56 23.72l-1.05 5.62-.86 4.4zm10.5 0h-1c.03-.34.04-.68.04-1 0-12.39 8.48-33.57 19.16-43.37a26.18 26.18 0 0 0 3.67-4.17 35.8 35.8 0 0 0 2.88-4.9c.36-.72 1.75-3.66 2.1-4.36 3.22-6.29 6.84-6.54 16.97.39 1.34.9 6.07 4.16 6.4 4.38 2.62 1.8 4.67 3.2 6.7 4.56 5.03 3.39 9.37 6.2 13.51 8.7 14.33 8.67 25.49 13.27 34.11 13.27 16.86 0 32.71-5.95 39.6-14.8 1.59-2.04 3.2-5.17 5.06-9.63.8-1.92 1.64-4.06 2.67-6.8l2.74-7.33c4.66-12.44 7.76-19.06 11.56-23.27 7.9-8.79 14.87-36 14.87-52.67 0-1.9.17-3.11 1.02-8.27.37-2.2.58-3.6.74-5.07.63-5.51.21-9.46-1.68-12.39-4.6-7.1-19.7-9.23-38.46-4.78a100.57 100.57 0 0 0-18.94 6.3c-5.17 2.37-17.11 9.74-16.5 9.4-6.72 3.64-12.97 4.15-24.8 1.3-29.55-7.14-30.43-8.62-15.26-26.81 17.44-20.93 47.12-46.18 56.38-46.18 9.92 0 53.84-11.98 65.78-17.95 9.46-4.73 24.32-21.18 36.82-37.85.71-.95 13.5-21.6 19.2-29.6 9.35-13.13 18.22-22.55 26.95-27.53 7.29-4.17 13.16-10.28 18.8-18.73 1.93-2.9 10.52-17.65 12.73-20.41 1.54-1.93 3-3.21 4.52-3.89 14.07-6.25 24.22-9.04 39.2-9.04h29c4.05 0 7.36-.4 22.93-2.5l4.3-.57c9.92-1.3 16.57-1.93 21.77-1.93 1.66 0 2.95.01 6.03.04 18.61.19 28.55-.48 44.86-4.03 3.1-.67 6.13-1.78 9.11-3.31v1.12a37.96 37.96 0 0 1-8.9 3.17c-16.4 3.56-26.4 4.24-45.08 4.05-3.08-.03-4.36-.04-6.02-.04-5.15 0-11.76.63-21.64 1.92l-4.3.58c-15.64 2.11-18.94 2.5-23.06 2.5h-29c-14.81 0-24.84 2.75-38.8 8.96-1.34.6-2.69 1.78-4.14 3.6-2.16 2.68-10.72 17.39-12.68 20.33-5.72 8.57-11.7 14.8-19.13 19.04-8.57 4.9-17.36 14.23-26.63 27.24-5.68 7.97-18.47 28.64-19.22 29.63-12.6 16.8-27.52 33.32-37.18 38.15-12.06 6.03-56.14 18.05-66.22 18.05-8.82 0-38.39 25.15-55.62 45.82-14.6 17.52-14.19 18.21 14.74 25.2 11.6 2.8 17.6 2.3 24.09-1.2-.67.35 11.31-7.03 16.56-9.44 5.41-2.48 11.6-4.59 19.11-6.37 19.13-4.53 34.65-2.35 39.54 5.22 2.05 3.17 2.48 7.32 1.84 13.04a96.34 96.34 0 0 1-.75 5.13c-.84 5.08-1.01 6.29-1.01 8.1 0 16.9-7.03 44.33-15.13 53.33-3.68 4.09-6.76 10.65-11.37 22.96-.35.93-2.2 5.94-2.73 7.33-1.04 2.76-1.88 4.9-2.68 6.84-1.9 4.53-3.55 7.73-5.2 9.85-7.1 9.13-23.25 15.19-40.39 15.19-8.86 0-20.15-4.65-34.63-13.42-4.15-2.51-8.5-5.32-13.55-8.72a861.54 861.54 0 0 1-6.71-4.56l-6.4-4.39c-9.68-6.63-12.61-6.42-15.5-.75-.35.68-1.74 3.62-2.1 4.35a36.77 36.77 0 0 1-2.96 5.03c-1.12 1.57-2.37 3-3.81 4.33-10.47 9.6-18.84 30.51-18.84 42.63l-.03 1zm-29.65 0h-1.1c1.17-2.52 1.79-5.2 1.79-8 0-20 4.83-42.04 12.15-49.35 5.17-5.18 7.77-8.38 9.9-12.74 2.64-5.41 3.95-12 3.95-20.91 0-6.82 1.14-11.59 3.37-15.07 1.74-2.7 3.6-4.21 8.91-7.52a31.64 31.64 0 0 0 3.9-2.79c4.61-3.96 6.58-6.2 7.72-9.41 1.43-4.02.93-9.04-1.86-16.02a68.98 68.98 0 0 0-3.99-8.07l-.93-1.7a75.47 75.47 0 0 1-2.64-5c-5.16-10.71-3.77-18.9 7.68-29.78a204 204 0 0 1 26.81-21.55c3.96-2.69 16.8-10.8 19.24-12.5 1.99-1.4 4.33-3.3 7.77-6.3-.02 0 7.23-6.39 9.47-8.3 4.97-4.26 9.09-7.5 13.05-10.15 4.72-3.15 8.97-5.28 12.87-6.32 12.78-3.41 15.6-4.18 21.77-5.97 12.55-3.64 21.96-6.9 28.14-10a45.47 45.47 0 0 1 7.47-2.79c8.66-2.66 12.02-4.1 16.97-8.1 6.78-5.46 13.07-14.25 19.33-27.87 15.97-34.77 19.08-39.39 32.15-49.19 3.14-2.36 6.37-4.1 11.43-6.4l2.33-1.04c11.93-5.35 16.87-8.93 21.1-17.38 1.88-3.77 2.48-6.29 3.37-12.27.78-5.19 1.48-7.56 3.53-10.25 2.57-3.4 7.03-6.27 14.36-9.01 3.37-1.26 7.36-2.5 12.05-3.73 16.33-4.3 25.28-5.36 39.6-5.81 6.9-.22 9.5-.56 12.66-2 1.19-.54 2.36-1.23 3.58-2.11 3.7-2.7 8.14-4.54 13.24-5.67 5.71-1.27 10.69-1.54 18.7-1.45l2.35.02c2.82 0 6.8-1 19.7-4.69 10.83-3.08 15.95-4.31 19.3-4.31.82 0 1.9.13 3.55.41l5.01.9c9.82 1.68 17.44 1.89 25.15-.21 7.98-2.18 14.8-6.77 20.29-14.24V147c-5.47 7.04-12.21 11.42-20.03 13.55-7.88 2.15-15.63 1.94-25.58.23l-5-.9c-1.6-.26-2.64-.39-3.39-.39-3.2 0-8.32 1.22-19.74 4.48-12.35 3.53-16.3 4.52-19.26 4.52l-2.36-.02c-7.94-.1-12.85.17-18.47 1.42-4.97 1.11-9.3 2.9-12.88 5.5a21.4 21.4 0 0 1-3.75 2.22c-3.32 1.5-6 1.87-13.04 2.09-14.25.44-23.13 1.5-39.37 5.77a125.56 125.56 0 0 0-11.95 3.7c-7.17 2.7-11.49 5.46-13.93 8.68-1.9 2.52-2.58 4.76-3.33 9.8-.9 6.08-1.53 8.68-3.47 12.56a30.6 30.6 0 0 1-9.66 11.45c-3.12 2.26-5.95 3.73-11.93 6.4l-2.31 1.04c-5.01 2.27-8.18 3.99-11.25 6.29-12.9 9.68-15.93 14.17-31.85 48.8-6.31 13.76-12.7 22.68-19.6 28.25-5.08 4.1-8.53 5.57-17.3 8.27a44.64 44.64 0 0 0-7.33 2.73c-6.24 3.12-15.7 6.4-28.3 10.06a867.4 867.4 0 0 1-21.8 5.97c-3.77 1.01-7.93 3.1-12.56 6.19a137.35 137.35 0 0 0-12.95 10.07c-2.24 1.92-9.48 8.3-9.48 8.3a98.2 98.2 0 0 1-7.84 6.37c-2.46 1.72-15.32 9.83-19.26 12.5a203 203 0 0 0-26.69 21.45c-11.13 10.58-12.43 18.3-7.47 28.63a74.52 74.52 0 0 0 2.62 4.95l.94 1.7a69.84 69.84 0 0 1 4.03 8.17c2.88 7.2 3.4 12.46 1.89 16.73-1.22 3.43-3.28 5.77-8.02 9.84-1.14.97-2.32 1.8-5.3 3.67-3.92 2.45-5.69 3.89-7.31 6.42-2.13 3.3-3.22 7.89-3.22 14.53 0 9.05-1.34 15.79-4.05 21.34-2.19 4.49-4.85 7.77-10.1 13.01-7.07 7.07-11.85 28.9-11.85 48.65 0 2.8-.58 5.48-1.7 8zm282.54 0h-1.01l-1.1-5.8c-3.08-16.26-4.05-26.2-2.74-37.26.7-5.8.77-9.68.55-15.3-.18-4.45-.17-5.68.19-7.63.78-4.3 3.44-8.53 10.39-16.34 9.07-10.2 12.26-15.41 19.8-30.15 1.35-2.64 2.33-4.47 3.38-6.3.9-1.58 1.82-3.06 2.77-4.5 3.14-4.7 7.03-8.42 16.84-16.81 11.22-9.6 15.5-13.86 18.13-19.13.7-1.4 1.3-2.8 1.93-4.4a206 206 0 0 0 1.49-4.05c3.63-9.94 8.01-13.93 22.9-17.81 4.99-1.3 20.55-5.13 21.38-5.34 16.19-4.1 25.33-7.36 33.48-12.6 5.86-3.77 5.84-3.76 27.66-16.53l2.6-1.52c10.23-6 17.1-10.2 22.73-13.95a149.3 149.3 0 0 0 8.8-6.3 723.7 723.7 0 0 0 6.37-5.08A87.74 87.74 0 0 1 600 342.95v1.12a85.76 85.76 0 0 0-15.49 9.9c.18-.14-4.76 3.84-6.38 5.1a150.3 150.3 0 0 1-8.85 6.35c-5.65 3.76-12.53 7.96-22.78 13.97l-2.6 1.53c-21.8 12.75-21.78 12.74-27.63 16.5-8.27 5.32-17.49 8.61-33.78 12.73-.83.21-16.39 4.04-21.36 5.33-8.03 2.1-13.15 4.5-16.45 7.5-2.66 2.42-4 4.86-5.77 9.7l-1.5 4.07a51.12 51.12 0 0 1-1.96 4.47c-2.72 5.45-7.04 9.75-18.38 19.45-9.73 8.32-13.6 12.02-16.65 16.6a77.18 77.18 0 0 0-2.74 4.45c-1.05 1.81-2.01 3.63-3.35 6.25-7.58 14.81-10.82 20.08-19.96 30.36-6.83 7.7-9.4 11.78-10.15 15.86-.34 1.85-.34 3.04-.17 7.4.22 5.68.14 9.6-.55 15.47-1.3 10.92-.34 20.79 2.73 36.95l1.12 5.99zm-76.59 0h-2.1l1.39-4.3c1.04-3.3 1.93-6.78 2.68-10.4 2.65-12.73 3.27-23.63 3.27-41.3 0-5.71-1.86-9.75-4.13-9.75-2.94 0-6.96 5.61-10.93 17.08C271.14 579.68 258.3 593 238 593c-22.42 0-29.26-1.35-48.42-10.09a87.69 87.69 0 0 1-9.42-5.04c-2.95-1.8-12.78-8.57-14.84-9.72-4.2-2.36-7-2.71-9.72-.99-.63.4-1.26.91-1.9 1.55a57.69 57.69 0 0 1-4.31 3.86 147.88 147.88 0 0 1-3.06 2.44l-1 .8C137.01 582.43 134 587.18 134 597c0 1.02-.02 2.01-.07 3h-2c.05-.99.07-1.98.07-3 0-10.52 3.33-15.78 12.09-22.76a265.61 265.61 0 0 1 2-1.6c.83-.64 1.43-1.13 2.03-1.61a55.76 55.76 0 0 0 4.17-3.74c.74-.73 1.48-1.34 2.24-1.82 3.47-2.2 7-1.75 11.77.93 2.15 1.21 12.03 8 14.9 9.76a85.7 85.7 0 0 0 9.22 4.93C209.29 589.7 215.85 591 238 591c19.25 0 31.49-12.7 41.06-40.33 4.24-12.25 8.66-18.42 12.81-18.42 3.8 0 6.13 5.06 6.13 11.75 0 17.8-.63 28.8-3.3 41.7-.77 3.7-1.68 7.23-2.75 10.6-.4 1.3-.8 2.53-1.19 3.7zm-149.25 0 .5-.94a160.1 160.1 0 0 0 6.53-13.26c2.73-6.29 5.78-9.64 9.24-10.52 3.74-.95 7.15.74 12.56 5.13 5.43 4.4 6.07 4.86 7.73 5.1 1.6.22 4.28 1.14 8.86 2.95 1.3.5 10.78 4.35 13.85 5.55 3.07 1.2 5.85 2.25 8.49 3.18 3.1 1.1 5.98 2.04 8.65 2.81h-3.45c-1.76-.56-3.6-1.18-5.54-1.87a281.2 281.2 0 0 1-8.51-3.19c-3.08-1.2-12.57-5.04-13.86-5.55-4.5-1.78-7.15-2.68-8.63-2.9-1.94-.27-2.53-.7-8.22-5.3-5.17-4.2-8.36-5.78-11.69-4.94-3.1.78-5.94 3.92-8.56 9.95a161 161 0 0 1-6.82 13.8h-1.13zm112.89 0a30.34 30.34 0 0 0 11.27-6.27c1.55-1.36 3.32-3.46 5.34-6.29 1.05-1.46 2.15-3.1 3.41-5.04a349.73 349.73 0 0 0 2.5-3.9l.47-.75.93-1.47a89.17 89.17 0 0 1 3.25-4.86c1.05-1.43 1.82-2.23 2.44-2.46 1.02-.37 1.49.48 1.49 2.04l.01 2.11c.05 6.91-.08 11.32-.7 16.33a48.4 48.4 0 0 1-2.38 10.56h-1.07a46.47 46.47 0 0 0 2.45-10.68c.62-4.96.75-9.33.7-16.2l-.01-2.12c0-.97-.08-1.12-.15-1.1-.36.14-1.05.85-1.97 2.1a88.44 88.44 0 0 0-3.22 4.82l-.92 1.46-.48.75a1268.1 1268.1 0 0 1-2.5 3.92c-1.26 1.95-2.38 3.6-3.44 5.08-2.06 2.88-3.87 5.04-5.5 6.45a30.87 30.87 0 0 1-8.94 5.52h-2.98zm-183.72 0H69.3c3.37-3.43 5.19-8.33 5.19-15 0-18.6-.04-17.35 1.02-20.77.6-1.93 1.5-3.74 3.27-6.63.42-.7 4.92-7.8 6.78-10.86 3.04-4.97 11.04-16.5 12.21-18.56 3.48-6.08 4.72-12.06 4.72-24.18 0-7.85 2.5-14.2 8.1-23.44l2.84-4.63a72.67 72.67 0 0 0 2.49-4.4c1.62-3.15 2.48-5.78 2.62-8.28.2-3.78-1.3-7.29-4.9-10.9-5.13-5.12-8.6-5.43-11.2-1.85-2.12 2.92-3.48 7.74-5.06 16.47-.2 1.03-.82 4.6-.82 4.57-.83 4.67-1.4 7.33-2.1 9.6-1.35 4.42-3.7 7.61-8.36 12.26l-3.26 3.2c-6.38 6.39-9.68 11.51-11.36 19.5l-1.16 5.52c-.87 4.1-1.56 7.04-2.33 9.94-3.67 13.74-9.65 25.97-22.59 44.72-7.68 11.14-11.05 18.87-10.92 23.72h-1c-.12-5.16 3.35-13.05 11.1-24.28 12.87-18.67 18.8-30.8 22.44-44.42.77-2.88 1.45-5.8 2.32-9.89l1.16-5.51c1.73-8.22 5.13-13.5 11.64-20 .63-.64 2.84-2.8 3.25-3.21 4.57-4.54 6.82-7.62 8.12-11.84a81.58 81.58 0 0 0 2.07-9.48l.81-4.57c1.62-8.9 3-13.8 5.24-16.89 3-4.15 7.2-3.78 12.71 1.74 3.8 3.8 5.42 7.58 5.2 11.66-.15 2.66-1.05 5.41-2.73 8.68a73.6 73.6 0 0 1-2.52 4.46l-2.84 4.63c-5.52 9.1-7.96 15.3-7.96 22.92 0 12.28-1.28 18.43-4.85 24.68-1.2 2.1-9.21 13.65-12.22 18.58-1.87 3.06-6.37 10.18-6.78 10.86-1.73 2.82-2.6 4.57-3.17 6.4-1.02 3.28-.98 2.1-.98 20.48 0 6.52-1.7 11.44-4.82 15zM310.09 0h1.06c-.37.9-.77 1.83-1.2 2.82-3.9 9.06-5.45 15.15-5.45 25.18 0 7.64-2.1 11.6-6.64 13.05-3.46 1.1-5.72.98-17.57-.43-11.55-1.36-19.17-1.58-28.16-.14-6.24 2.49-25.91 7.02-32.13 7.02-11.15 0-36.76-2.88-54.12-7.01a22.08 22.08 0 0 0-16.95 2.48c-4.05 2.33-7.09 5.03-13.9 11.97-6.28 6.39-9.53 9.23-13.8 11.5-7.09 3.79-11.22 7.65-13.4 12.27-1.82 3.85-2.33 7.84-2.33 15.29 0 4.4-2.65 6.69-9.45 9.74.1-.05-2.97 1.31-3.84 1.71-8.78 4.06-12.71 8.29-12.71 16.55 0 12.52-4.86 19.22-17.34 27.96l-4.56 3.14c-1.9 1.3-3.3 2.3-4.67 3.3-.92.68-1.79 1.34-2.62 2-7.16 5.62-11 14.54-15.56 33.28-.63 2.57-3.3 14-4.07 17.14a350.44 350.44 0 0 1-5.2 19.33c-1.37 4.5-4.5 15.07-4.96 16.53-1.05 3.4-1.64 4.94-2.46 6.32-.82 1.4-6.85 9.08-12.64 18.27L0 277.98v-1.9l4.58-7.35a270.8 270.8 0 0 1 12.61-18.23c-.3.5 1.35-2.8 2.38-6.12.45-1.44 3.58-12.01 4.95-16.53 1.83-6.03 3.44-12.09 5.19-19.27.76-3.13 3.44-14.56 4.06-17.14 4.62-18.95 8.52-28.02 15.92-33.83.84-.67 1.72-1.33 2.65-2.01 1.38-1.02 2.8-2.01 4.7-3.32l4.54-3.14C73.83 140.57 78.5 134.13 78.5 122c0-8.74 4.2-13.26 13.29-17.45.88-.41 3.96-1.77 3.85-1.73 6.46-2.9 8.86-4.97 8.86-8.82 0-7.6.53-11.7 2.42-15.71 2.29-4.84 6.57-8.85 13.84-12.73 4.15-2.21 7.35-5 14.15-11.93 6.28-6.4 9.36-9.13 13.52-11.53a23.07 23.07 0 0 1 17.69-2.59c17.27 4.12 42.8 6.99 53.88 6.99 6.1 0 25.73-4.53 31.92-7 9.12-1.46 16.83-1.25 28.49.13 11.63 1.38 13.9 1.5 17.15.47 4.06-1.3 5.94-4.85 5.94-12.1 0-10.1 1.56-16.3 6.6-28zm25.12 0h1c.05 5.62.26 11.48.65 19.4.47 9.7.64 14.57.64 21.6 0 9.81-4.68 17.46-13.1 23.16-6.53 4.43-14.94 7.46-24.33 9.33-3.74.54-9.42.56-22.68.23-6.74-.17-9.35-.22-12.39-.22-2.77 0-4.97.43-7.63 1.36-.88.3-4.55 1.74-5.58 2.11-6.55 2.35-13.59 3.53-24.79 3.53-8.1 0-13.58-1.38-22.46-4.9l-3.18-1.25c-12.55-4.87-21.27-5.15-37.18 1.12-11.15 4.39-18.13 9.2-22.28 14.81-3.15 4.26-4.33 7.8-5.94 15.8-1.22 6.09-1.93 8.74-3.5 12.13-1.65 3.53-3.97 5.81-7.07 7.22-2.33 1.07-4.35 1.5-9.32 2.19-9.04 1.27-12.77 3.09-15.61 9.58-3.71 8.48-7.72 13.87-14.22 19.76-2.4 2.18-13.14 11.02-15.91 13.42-8.2 7.1-13.85 17.37-18.7 31.97a258.81 258.81 0 0 0-3.27 10.7c-.01.05-2.26 7.97-2.88 10.1-8.49 28.85-17.88 52.95-26.13 61.2-2.8 2.8-5.06 5.64-10.4 12.96-3.4 4.68-6.23 8.25-8.95 11.1v-1.55c2.74-2.98 5.73-6.82 9.48-11.97 4.03-5.52 6.32-8.4 9.17-11.24 8.07-8.08 17.44-32.14 25.87-60.8.62-2.1 2.86-10.03 2.88-10.08 1.21-4.24 2.21-7.53 3.28-10.74 4.9-14.75 10.63-25.16 19-32.4 2.78-2.42 13.5-11.25 15.89-13.4 6.4-5.8 10.32-11.09 13.97-19.43 1.68-3.83 4.05-6.31 7.2-7.86 2.4-1.17 4.64-1.67 9.53-2.36 4.54-.63 6.5-1.05 8.7-2.06 2.89-1.31 5.03-3.42 6.58-6.73 1.53-3.3 2.23-5.9 3.43-11.9 1.64-8.14 2.85-11.79 6.11-16.2 4.28-5.79 11.41-10.7 22.73-15.16 16.15-6.36 25.13-6.07 37.9-1.11l3.19 1.26c8.77 3.47 14.13 4.82 22.09 4.82 11.09 0 18.02-1.16 24.46-3.47 1-.36 4.68-1.8 5.58-2.11A22.5 22.5 0 0 1 265 72.5c3.05 0 5.67.05 14.07.26 11.53.29 17.2.27 20.83-.25 9.25-1.85 17.54-4.83 23.94-9.17C332 57.8 336.5 50.46 336.5 41c0-7-.17-11.86-.7-22.7-.35-7.26-.55-12.83-.59-18.3zM93.87 0h2.04c-.7 4-1.61 6.82-3.03 9.47-2.33 4.38-2.85 5.75-5.26 13.03a40.46 40.46 0 0 1-1.94 5.03c-2.24 4.66-5.92 8.8-13.07 14.26-8.01 6.13-14.27 16.55-20.03 31.55-2.4 6.23-8.75 25.63-9.64 28.01-2.69 7.16-6.56 12.7-15.63 23.68l-2.68 3.24c-6.02 7.34-9.35 12.07-11.72 17.15-2.3 4.94-7.12 9.9-12.91 14.15v-2.4c5.14-3.94 9.1-8.3 11.1-12.6 2.46-5.27 5.87-10.1 11.98-17.56l2.68-3.26c8.94-10.8 12.72-16.22 15.3-23.1.88-2.33 7.24-21.74 9.65-28.03 5.89-15.31 12.3-26 20.68-32.41 6.92-5.3 10.4-9.2 12.48-13.55.65-1.35 1.16-2.7 1.85-4.79 2.45-7.4 3-8.83 5.4-13.34A27.68 27.68 0 0 0 93.87 0zm9.07 0h1.02c-1.66 8.3-2.91 12.67-4.54 15.26a59.14 59.14 0 0 0-4.1 8.21c-1.27 3-2.44 6.2-3.5 9.4-.38 1.12-.7 2.16-2.41 5.39a251.48 251.48 0 0 0-12.81 13.3c-3.48 3.96-5.95 7.27-7.15 9.66-.95 1.9-2.06 5.99-3.61 12.97-.64 2.9-3.65 17.15-4.51 21.07-3.63 16.45-6.63 26.69-9.9 32-7.66 12.45-10.64 15.71-37.08 41.1A69.78 69.78 0 0 1 0 179.21v-1.15a69.39 69.39 0 0 0 13.65-10.42c26.4-25.33 29.32-28.55 36.92-40.9 3.2-5.18 6.18-15.37 9.78-31.7.86-3.91 3.87-18.16 4.51-21.06 1.57-7.09 2.7-11.2 3.7-13.2 1.24-2.5 3.76-5.86 7.29-9.89.9-1.03 1.86-2.1 2.86-3.18 2.4-2.6 4.96-5.22 7.53-7.76.9-.88 1.73-1.7 3.37-3.4a129.02 129.02 0 0 1 4.78-13.46 60.07 60.07 0 0 1 4.19-8.35c1.52-2.44 2.74-6.71 4.36-14.74zM83.71 0h1.1c-2.09 4.74-6.03 8.92-11.42 12.3-7.2 4.52-16.5 7.2-24.39 7.2-8.9 0-11.8 7-11.74 21.52 0 1.7.04 3.17.12 5.99.1 3.3.12 4.45.12 5.99 0 5.73-.76 11.3-2.01 16.5a66.67 66.67 0 0 1-2.15 6.97 2597.76 2597.76 0 0 1-7 15.86 4270.8 4270.8 0 0 1-19.9 43.87A54.64 54.64 0 0 1 0 147v-1.65a54.87 54.87 0 0 0 5.55-9.57A4269.82 4269.82 0 0 0 30.7 79.97c.53-1.2.99-2.23 2.44-5.9A69.23 69.23 0 0 0 36.5 53c0-1.52-.03-2.66-.12-5.95-.08-2.83-.12-4.31-.12-6.01-.03-6.79.53-11.62 2.07-15.34 1.94-4.68 5.39-7.19 10.67-7.19 7.7 0 16.81-2.63 23.86-7.05C77.93 8.27 81.66 4.38 83.7 0zm282.63 0h1.01c1.86 10.02 2.18 12.67 2.32 18.3a123.43 123.43 0 0 1 .37 27.83c-.96 8.78-3.1 16.01-6.63 21.15-11.34 16.5-39.8 29.22-66.41 29.22-5.09 0-10.47.28-16.31.83a413.8 413.8 0 0 0-24.37 3.16c-21.56 3.26-27.66 4.01-36.32 4.01-6.92 0-12.2-1.05-21.69-3.9l-2.78-.83c-1.39-.41-2.54-.74-3.65-1.02-8-2.05-14.22-2.04-21.7.72a16.32 16.32 0 0 0-9.17 8.18c-1.6 3.05-2.5 6.06-4.02 12.83-1.5 6.64-2.34 9.52-3.99 12.64a16.16 16.16 0 0 1-9.85 8.36 104.8 104.8 0 0 0-9.5 3.42c-6.55 2.8-10.1 5.57-13.8 10.47-1.33 1.75-1.03 1.3-5.43 7.9-1.98 2.97-4.66 5.8-8.48 9.14-2.01 1.76-10.71 8.83-12.88 10.7-7.37 6.35-12.58 12.14-16.63 19.14-4.22 7.3-7.8 18.3-11.28 33.26-.87 3.73-1.72 7.64-2.64 12.14l-1.18 5.8-1.09 5.45c-1.8 8.96-2.77 13.28-3.77 16.26-6.8 20.44-17.26 42.16-27.13 51.2-5.11 4.7-8.1 7.07-11.1 8.86-.9.54-1.84 1.04-2.92 1.57-.44.22-9.6 4.4-14.1 6.66l-1.22.62v-1.13l.78-.39c4.52-2.26 13.67-6.44 14.1-6.65a41.19 41.19 0 0 0 2.84-1.54c2.94-1.75 5.88-4.09 10.94-8.73 9.71-8.9 20.1-30.51 26.87-50.79.97-2.92 1.94-7.22 3.73-16.13l1.1-5.46a490.5 490.5 0 0 1 3.82-17.96c3.5-15.06 7.1-26.14 11.39-33.54 4.11-7.11 9.4-12.98 16.83-19.4 2.19-1.88 10.88-8.95 12.88-10.7 3.77-3.28 6.39-6.05 8.3-8.93 4.43-6.64 4.12-6.18 5.47-7.96 3.8-5.03 7.5-7.91 14.21-10.78 2.61-1.12 5.74-2.24 9.59-3.46a15.17 15.17 0 0 0 9.27-7.86c1.59-3.02 2.42-5.85 4.03-12.99 1.41-6.27 2.32-9.33 3.98-12.48a17.31 17.31 0 0 1 9.7-8.66c7.7-2.83 14.1-2.84 22.3-.75 1.12.29 2.28.61 3.68 1.03l3.73 1.11c8.47 2.54 13.66 3.58 20.46 3.58 8.59 0 14.67-.75 36.18-4a414.64 414.64 0 0 1 24.41-3.17c5.88-.54 11.29-.83 16.41-.83 26.3 0 54.45-12.58 65.59-28.78 3.42-4.98 5.5-12.06 6.46-20.7.84-7.74.73-16.02.02-23.9a136.2 136.2 0 0 0-.57-5.12c0-4.47-.3-6.94-2.16-17zM18.88 0h1.03C18 7.57 17.15 10.18 14.46 16.2c-1.95 4.37-2.67 9.19-2.42 14.89.2 4.33.71 7.7 2.28 16.13 1.09 5.88 1.57 8.77 1.94 12.2.96 8.9.24 16.08-2.8 22.79A463.4 463.4 0 0 1 0 109.43v-2.12a465 465 0 0 0 12.54-25.52c2.97-6.52 3.67-13.53 2.72-22.27-.36-3.4-.84-6.26-1.93-12.12-1.57-8.47-2.1-11.88-2.29-16.27-.26-5.84.48-10.81 2.5-15.33 2.64-5.9 3.48-8.47 5.34-15.8zm280.47 0a70.78 70.78 0 0 1-4.91 11.24c-2.56 4.7-4.01 8.45-4.86 11.98l-.4 1.8-.28 1.45a5.28 5.28 0 0 1-.74 2.07c-.74 1.03-1.93 1.28-5.13 1.25.92 0-9.85-.29-15.03-.29-10.2 0-18.45.82-29.46 2.56-16.87 2.66-17.73 2.77-23.66 2.52a42.57 42.57 0 0 1-8-1.09c-17.7-4.16-46.18-5.86-54.72-3.01-2.72.9-5.88 2.8-9.52 5.59a112.37 112.37 0 0 0-6.54 5.48c-1.4 1.25-9.17 8.5-10.78 9.84-1.45 1.2-8.18 7.42-8.85 8.02a114.65 114.65 0 0 1-4.55 3.9c-4.99 4.03-8.9 6.2-11.92 6.2-3.52.05-4.32 0-5.14-.4-1.13-.56-1.5-1.72-1.13-3.57.74-3.63 4.47-10.84 12.84-24.8 5.69-9.48 9.42-18 11.78-26.2 1.45-5.04 1.94-7.4 2.97-14.54h1.01c-1.05 7.3-1.54 9.7-3.01 14.82-2.39 8.28-6.16 16.89-11.9 26.44-8.3 13.84-12 21.01-12.7 24.48-.3 1.45-.08 2.14.59 2.47.6.3 1.35.35 3.48.3 3.92 0 7.69-2.1 12.5-5.98a114.6 114.6 0 0 0 4.51-3.86c.66-.59 7.41-6.83 8.88-8.05 1.59-1.33 9.34-8.55 10.75-9.82 2.4-2.15 4.55-3.96 6.6-5.53 3.72-2.85 6.97-4.8 9.81-5.74 8.76-2.92 37.41-1.22 55.27 2.99 2.57.6 5.14.95 7.81 1.06 5.84.25 6.7.14 23.47-2.51 11.05-1.75 19.36-2.57 29.6-2.57 5.2 0 15.99.3 15.05.29 2.87.03 3.84-.17 4.3-.83.23-.32.4-.8.58-1.7l.28-1.43.4-1.85c.88-3.6 2.36-7.44 4.96-12.22A69.5 69.5 0 0 0 298.29 0h1.06zm-8.59 0c-5.91 17.94-9.55 22-19.76 22-4.5 0-10.22.32-28.69 1.5l-1.53.1c-15.6.99-23.47 1.4-28.78 1.4-5.35 0-13.24-.96-28.86-3.28l-1.54-.23C163.18 18.75 157.47 18 153 18c-4.45 0-7.3 1.01-10.96 3.34-.1.06-1.8 1.17-2.3 1.47-2.43 1.5-4.32 2.19-6.74 2.19-2.8 0-4.11-1.46-4.11-4.22 0-1.04.16-2.29.5-4.1.16-.82.9-4.4 1.07-5.32.8-4.11 1.3-7.68 1.47-11.36h2c-.17 3.82-.68 7.5-1.5 11.75-.19.94-.92 4.5-1.07 5.31a21.04 21.04 0 0 0-.47 3.72c0 1.7.46 2.22 2.11 2.22 1.99 0 3.55-.57 5.7-1.9.47-.28 2.15-1.37 2.26-1.44C144.92 17.14 148.12 16 153 16c4.62 0 10.3.74 28.9 3.51l1.53.23C198.93 22.04 206.8 23 212 23c5.25 0 13.11-.41 28.65-1.4l1.54-.1C260.73 20.32 266.43 20 271 20c8.95 0 12.15-3.4 17.66-20h2.1zM141.51 0h1.13c-2.06 3.86-2.63 5.1-2.77 6.19-.15 1.12.42 1.64 2.32 1.96 1.8.3 3.85.35 10.81.35 6.02 0 13 .56 21.35 1.62 3.95.5 8.03 1.1 13.13 1.89 24 3.7 22.5 3.49 26.83 3.49 24.02 0 51.83-2.24 60.45-6.94 2.88-1.57 5.05-4.49 6.6-8.56h1.07c-1.64 4.47-3.98 7.69-7.2 9.44-8.83 4.82-36.67 7.06-60.92 7.06-4.41 0-2.84.22-26.98-3.5-5.1-.8-9.17-1.38-13.1-1.88-8.31-1.06-15.26-1.62-21.23-1.62-7.04 0-9.1-.05-10.97-.37-2.38-.4-3.38-1.32-3.15-3.07.16-1.22.69-2.41 2.63-6.06zm76.4 0c5.69 1.64 10.37 2.5 14.09 2.5 9.59 0 16.7-.71 22.4-2.5h2.98C251.12 2.53 243.2 3.5 232 3.5c-4.5 0-10.32-1.21-17.53-3.5h3.45zM70.69 0c-2.87 3.27-6.95 5.39-12.02 6.53-3.98.89-7.5 1.08-12.92 1A97.24 97.24 0 0 0 44 7.5c-5.37 0-8.86-1.24-10.1-4.97A8.6 8.6 0 0 1 33.5 0h.99c.02.82.14 1.56.36 2.22C35.91 5.39 39.02 6.5 44 6.5l1.76.02c5.35.09 8.8-.1 12.69-.97C62.95 4.54 66.63 2.74 69.3 0h1.37zM0 207.87c7.31-.16 11.5 3.33 11.5 11.13 0 11.41-5.05 28.35-11.5 41.5v-2.3c5.93-12.72 10.5-28.47 10.5-39.2 0-7.18-3.7-10.3-10.5-10.13v-1zm0 7.05c1.23.14 2.18.58 2.87 1.31 1.4 1.48 1.6 3.72 1.16 7.58l-.16 1.3A28.93 28.93 0 0 0 3.5 229c0 3.2-1.48 9.52-3.5 15.9v-3.45c1.49-5.13 2.5-9.87 2.5-12.45 0-.98.08-1.75.37-4.02l.16-1.29c.42-3.56.24-5.59-.88-6.77-.5-.53-1.21-.87-2.15-1v-1zM0 410.9v-1.47a21.67 21.67 0 0 0 2.97-4.7c1.32-2.7 2.68-6.28 4.56-11.89 7.85-23.55 7.83-26.6.25-30.4-2.25-1.12-4.8-1.43-7.78-.91v-1.02a13.1 13.1 0 0 1 8.22 1.04c8.24 4.12 8.26 7.6.25 31.6-1.88 5.66-3.25 9.27-4.6 12.02A20.82 20.82 0 0 1 0 410.9zM33.64 452c1.68 0 3.04-.23 8.34-1.31l2.38-.47c8.26-1.57 12.72-1.3 14.53 2.33 1.38 2.75-.47 5.86-4.75 9.68a75.6 75.6 0 0 1-5.08 4.07c-.94.7-4.89 3.59-5.79 4.27-1.86 1.4-2.97 2.37-3.47 3.03a19.08 19.08 0 0 0-2.89 5.5c.07-.2-4.02 13.65-6.96 22.22-2.7 7.85-5.56 10.72-8.82 8.59-2.11-1.4-3.66-4.24-6.6-11.03-1.98-4.62-2.5-5.76-3.4-7.4-4.55-8.18-3.9-23.9-.05-32.87a9.6 9.6 0 0 1 6.98-5.96c2.59-.66 4.86-.75 11.78-.67l3.8.02zm0 2c-1.13 0-2.09 0-3.82-.02-12.07-.13-14.83.57-16.9 5.41-3.63 8.47-4.26 23.55-.05 31.12.96 1.73 1.48 2.88 3.5 7.58 2.72 6.3 4.24 9.08 5.86 10.14 1.64 1.08 3.5-.8 5.82-7.55a682.9 682.9 0 0 0 6.97-22.24 21.03 21.03 0 0 1 3.18-6.04c.65-.87 1.85-1.9 3.86-3.43.92-.7 4.87-3.57 5.8-4.27 2.02-1.5 3.6-2.77 4.95-3.97 3.63-3.23 5.09-5.7 4.3-7.28-1.21-2.42-5.07-2.65-12.38-1.27l-2.35.47c-5.49 1.11-6.86 1.35-8.74 1.35zm345.63 146c-3.45-12.26-3.77-14.13-3.77-19 0-3.33-.13-6.27-.43-11.34-.63-10.33-.65-13.5.26-17.07 1.21-4.74 4.21-7.1 9.67-7.1h26c4.08 0 5.19 1.85 5.93 7.11.1.79.13.97.19 1.32.84 5.35 2.8 7.58 8.88 7.58 3.64 0 5.54.4 6.43 1.37.76.83.76 1.44.36 3.93-.85 5.26.5 8.85 7.5 13.8 6.32 4.45 11.63 5.36 16.55 3.37 3.8-1.54 6.73-4.16 11.92-10l1.1-1.23 1.09-1.23a75.6 75.6 0 0 1 2.7-2.86 35.81 35.81 0 0 1 9.57-6.73c1.52-.76 1.72-.86 5.66-2.63 6.1-2.73 9.01-4.5 11.74-7.62 2.63-3 4.67-4.85 6.7-6.04 3.18-1.85 5.46-2.13 13.68-2.13 5.98 0 10.56-4.32 18-14.99l2.82-4.03c1.06-1.5 1.94-2.7 2.79-3.79 7.87-10.12 19.38-10.4 30.74.96 5.54 5.53 10.17 19.43 13.64 38.51 2.5 13.75 4.18 29.46 4.47 39.84h-1c-.3-10.32-1.96-25.97-4.45-39.66-3.43-18.87-8.02-32.65-13.36-37.99-10.95-10.95-21.76-10.68-29.26-1.04-.83 1.07-1.7 2.26-2.75 3.75l-2.81 4.02c-7.65 10.95-12.38 15.42-18.83 15.42-8.04 0-10.21.26-13.17 2-1.92 1.12-3.9 2.9-6.45 5.83-2.86 3.26-5.87 5.09-12.09 7.88a103.35 103.35 0 0 0-5.62 2.6 34.84 34.84 0 0 0-9.32 6.54 74.67 74.67 0 0 0-3.75 4.05l-1.1 1.24c-5.28 5.95-8.29 8.64-12.28 10.25-5.26 2.13-10.92 1.17-17.5-3.48-7.33-5.17-8.82-9.15-7.92-14.77.34-2.12.34-2.6-.1-3.1-.64-.69-2.34-1.04-5.7-1.04-6.63 0-8.96-2.63-9.87-8.42l-.2-1.34c-.67-4.82-1.53-6.24-4.93-6.24h-26c-5 0-7.6 2.04-8.7 6.34-.88 3.43-.85 6.57-.23 16.76a177 177 0 0 1 .43 11.4c0 4.78.32 6.63 3.81 19h-1.04zm13.68 0c-1.31-6.58-1.61-10.71-1.36-14.84.04-.7.1-1.44.18-2.38l.23-2.56c.34-3.81.5-6.97.5-11.22 0-4.94 1.46-7.76 4.21-8.42 2.38-.58 5.56.54 9.2 3 6.64 4.52 13.99 13.07 16.55 19.23 4.77 11.44 14.12 15.69 33.54 15.69 8.6 0 14.32-2.35 20.67-7.88 1.45-1.26 15.06-15 21-20 7.21-6.07 11.77-7.59 20.62-8.32 5.52-.45 7.98-.9 11.44-2.36 4.58-1.95 9.36-5.48 14.9-11.29 7.43-7.76 13.25-8.92 17.47-4.3 3.32 3.63 5.46 10.58 6.82 20.24.73 5.17.94 7.74 1.58 17.38.25 3.75.17 5.32-.92 18.03h-1c1.09-12.7 1.17-14.28.92-17.97-.64-9.6-.85-12.16-1.57-17.3-1.33-9.47-3.43-16.27-6.56-19.7-3.76-4.11-8.93-3.08-16 4.32-5.65 5.9-10.54 9.5-15.25 11.5-3.58 1.53-6.13 1.99-11.6 2.44-8.8.72-13.17 2.18-20.2 8.1-5.9 4.96-19.5 18.7-21 19.99-6.52 5.68-12.47 8.12-21.32 8.12-19.78 0-29.5-4.42-34.46-16.3-2.49-5.97-9.71-14.38-16.2-18.79-3.42-2.32-6.36-3.35-8.4-2.86-2.2.53-3.44 2.92-3.44 7.45 0 4.28-.16 7.47-.5 11.31l-.23 2.56c-.09.93-.14 1.65-.19 2.35-.24 4.08.06 8.18 1.39 14.78h-1.02zm113.75 0c2.52-3.26 8.93-11.79 10.9-14.3 5.48-6.98 13.05-12.38 19.4-13.94 7.01-1.71 11.5 1.45 11.5 9.24 0 4.02-.04 5.16-.74 19h-1c.7-13.85.74-15 .74-19 0-7.12-3.86-9.83-10.26-8.26-6.11 1.5-13.5 6.77-18.85 13.57-1.86 2.36-7.65 10.07-10.43 13.69h-1.26zm-9.86-338.96c3.44 2.71 7 5.1 11.44 7.75 1.06.64 8.42 4.9 10.35 6.1 11.27 7 15 13.35 12.35 25.33-1.45 6.52-4.53 11.1-9.39 14.44-3.83 2.63-8.07 4.26-16.08 6.56-11.97 3.45-13.68 3.99-18.82 6.28a60.18 60.18 0 0 0-7.81 4.18c-11.11 7.07-19.1 7.7-27.96 3.28-3.56-1.77-17.2-11-17.2-11.01a101.77 101.77 0 0 0-5.2-3.07c-16.04-8.83-34.27-24.16-34.52-31.85-.11-3.46 1.99-6.57 6.28-10.26 1.03-.9 2.18-1.81 3.68-2.95.72-.55 3.38-2.56 3.94-3 4.47-3.4 7.18-5.79 9.32-8.45 11.12-13.82 26.55-28.68 34.36-32.28 12.06-5.54 19.84-5.77 27.37.12 3.25 2.54 5.65 6.54 8.58 13.35.29.65 2.3 5.45 2.88 6.74 1.62 3.65 2.9 5.8 4.24 6.94.72.6 1.45 1.2 2.2 1.8zm-3.49-.28c-1.63-1.39-3.03-3.74-4.77-7.65-.58-1.3-2.6-6.12-2.88-6.76-2.81-6.5-5.08-10.3-7.98-12.56-6.83-5.35-13.85-5.15-25.3.12-7.45 3.42-22.7 18.12-33.64 31.72-2.27 2.82-5.08 5.3-9.67 8.79l-3.94 2.98a79.98 79.98 0 0 0-3.59 2.88c-3.87 3.33-5.67 6-5.58 8.69.21 6.64 18.14 21.72 33.48 30.15 1.76.97 3.5 2 5.3 3.13.12.08 13.61 9.22 17.03 10.92 8.22 4.1 15.46 3.52 26-3.18a62.17 62.17 0 0 1 8.07-4.31c5.25-2.35 7-2.9 19.08-6.38 7.8-2.24 11.9-3.82 15.5-6.3 4.44-3.04 7.23-7.18 8.56-13.22 2.44-11.02-.83-16.6-11.45-23.2-1.9-1.18-9.23-5.42-10.32-6.08-4.5-2.69-8.13-5.12-11.64-7.9-.77-.6-1.52-1.21-2.26-1.84zM87.72 241.6c4.3-2.98 7.88-5 12.14-6.95.84-.4 1.73-.78 2.78-1.24l4.37-1.88a164.3 164.3 0 0 0 17.74-8.96 320.67 320.67 0 0 1 27.87-14.5c4.22-1.95 21.89-9.84 21.17-9.52 19.17-8.62 28.1-6.93 49.5 8.05 7.91 5.54 13.24 13.25 16.45 22.66 3.02 8.83 3.76 16.51 3.76 27.75 0 8.32-.66 12.95-3.68 18.97-4.18 8.36-12.3 16.14-25.58 23.47-24.45 13.49-38.83 27.55-52.83 47.84-8.83 12.8-47.76 44.21-65.16 54.15C75.04 413.55 48.89 423.5 31 423.5c-10.05 0-14.67-4.78-14.76-13.37-.07-6.32 2.06-13.73 6.3-24.32 2.95-7.37 2.02-12.9-2.16-22.29-3.19-7.17-3.88-9.14-3.88-12.52 0-3.35 1.87-6.9 5.52-11.07 2.61-3 3.5-3.83 11.9-11.5 5.09-4.66 8.08-7.6 10.7-10.75 9.46-11.36 12.62-19.47 17.9-44.78 3.12-15.05 6.63-20.28 15.12-25.25.8-.47 3.95-2.25 4.7-2.68a76.66 76.66 0 0 0 5.38-3.38zm.56.82a77.63 77.63 0 0 1-5.44 3.43l-4.7 2.67c-8.23 4.82-11.57 9.81-14.65 24.6-5.3 25.45-8.51 33.7-18.1 45.21-2.66 3.19-5.68 6.16-10.8 10.84-8.36 7.64-9.24 8.48-11.82 11.42-3.5 4.01-5.27 7.36-5.27 10.42 0 3.18.68 5.1 3.8 12.12 4.27 9.6 5.24 15.37 2.16 23.07-4.18 10.47-6.29 17.78-6.22 23.93.08 8.06 4.26 12.38 13.76 12.38 17.67 0 43.68-9.9 64.75-21.93 17.28-9.88 56.1-41.2 64.84-53.85 14.08-20.42 28.57-34.59 53.17-48.16 13.12-7.23 21.09-14.87 25.17-23.03 2.92-5.86 3.57-10.35 3.57-18.53 0-11.13-.74-18.73-3.7-27.43-3.15-9.22-8.36-16.75-16.09-22.16-21.13-14.8-29.7-16.42-48.5-7.95.7-.32-16.96 7.56-21.17 9.5-1.7.8-3.3 1.55-4.86 2.3a319.68 319.68 0 0 0-22.93 12.17 165.3 165.3 0 0 1-17.85 9.01l-4.37 1.88c-1.04.45-1.92.84-2.76 1.23a74.56 74.56 0 0 0-11.99 6.86zm-7.6 12.2c7.7-6.25 12.3-8.17 23.68-11.27 6.12-1.67 9.12-2.95 12.31-5.72 3.8-3.3 7.47-4.52 15.86-6.1 2.75-.52 3.67-.7 5.06-1.02 5.48-1.24 9.48-2.93 13.1-5.89 10.42-8.53 25.4-14.11 36.31-14.11 5.33 0 16.77 7.58 25.74 17.16 10.73 11.46 15.96 23.27 12.73 32.5-3.18 9.1-11.39 18.57-23.03 27.86-8.44 6.73-18.36 13-25.22 16.43-3.72 1.86-6.59 4.88-9.77 9.99-.69 1.1-11.1 20.25-16.03 27.83-5.62 8.65-15.4 17.36-30.23 27.96a552.58 552.58 0 0 1-9.2 6.42c-.13.09-6.81 4.65-8.6 5.89-6.47 4.46-10.35 7.35-13.05 9.83-11.64 10.67-37.14 15.54-43.7 8.98-1.96-1.96-2.2-4.06-1.95-10.52.37-9.42-.5-14.5-4.95-20.51a34.09 34.09 0 0 0-7.04-6.92c-3.93-2.95-6.07-6.11-6.56-9.49-.97-6.61 3.87-13.06 14.17-21.69 1.58-1.32 6.67-5.44 7.09-5.78a48.03 48.03 0 0 0 5.23-4.77c4.1-4.63 5.85-9.55 7.8-20.07a501.52 501.52 0 0 0 .8-4.37c.33-1.87.6-3.3.88-4.73.74-3.78 1.5-7.18 2.4-10.63 1-3.78 1.38-5.5 2.36-10.37.6-3.02.93-4.21 1.56-5.47 1.22-2.45 1.27-2.5 12.25-11.42zm.64.78c-10.77 8.74-10.88 8.84-12 11.08-.58 1.16-.88 2.3-1.47 5.22-.98 4.89-1.36 6.63-2.37 10.44-.9 3.43-1.65 6.8-2.39 10.56a339.79 339.79 0 0 0-1.29 6.95l-.39 2.15c-1.98 10.68-3.77 15.74-8.04 20.54a48.77 48.77 0 0 1-5.34 4.88c-.42.34-5.5 4.47-7.07 5.78-10.04 8.4-14.72 14.65-13.83 20.78.45 3.1 2.44 6.03 6.17 8.83 3 2.25 5.39 4.62 7.24 7.12 4.63 6.24 5.52 11.52 5.15 21.15-.25 6.14-.01 8.1 1.66 9.78 6.1 6.1 31.02 1.33 42.31-9.02 2.75-2.52 6.66-5.43 13.16-9.92l8.6-5.89c3.63-2.48 6.45-4.44 9.19-6.4 14.73-10.54 24.44-19.18 29.97-27.7 4.9-7.54 15.31-26.68 16.02-27.8 3.27-5.26 6.26-8.41 10.18-10.37 6.79-3.4 16.65-9.63 25.03-16.32 11.52-9.18 19.61-18.53 22.72-27.4 3.07-8.78-2.02-20.27-12.52-31.49-8.8-9.4-20.04-16.84-25.01-16.84-10.67 0-25.43 5.5-35.68 13.89-3.76 3.07-7.9 4.81-13.5 6.09-1.41.32-2.35.5-5.11 1.02-8.21 1.55-11.76 2.73-15.38 5.88-3.34 2.9-6.45 4.22-12.7 5.92-11.26 3.07-15.75 4.94-23.31 11.09zM212 251.85c0 7.56-.6 10.92-2.6 14.3-1.1 1.84-7.66 10.05-8.6 11.3-5.96 7.94-9.33 10.28-17.26 13.76-1.34.58-2.2 1-3.03 1.5-.55.33-1.2.66-2 1.02-.71.33-4.46 1.9-5.52 2.39-6.05 2.78-8.99 5.8-8.99 10.73 0 10.97-18.95 36.12-34.51 44.87-8.18 4.6-21.3 9.36-32.78 11.86-13.33 2.9-22.49 2.48-24.62-2.32-1.32-2.97-4.4-4.26-11.98-5.81l-.6-.12c-4.84-.99-6.94-1.55-9.03-2.64-2.92-1.5-4.48-3.7-4.48-6.84 0-2.74 1.08-5.77 3.25-9.67.85-1.53 1.82-3.13 3.23-5.35-.16.25 2.83-4.4 3.67-5.76 6.69-10.7 9.85-18.5 9.85-27.22 0-18.41 11.22-33.37 27.5-42.86 5.22-3.05 9.23-3.31 15.2-2.12 5.04 1 6.05.9 7.43-1.52 4.5-7.85 7.04-9.5 15.87-9.5 3.93 0 6.97-.98 10.47-3.16 1.56-.97 8.67-6.17 10.99-7.68 9.2-5.98 11.34-7 25.2-11.95 6.95-2.48 15.18 1.28 22.33 9.12 6.55 7.19 11.01 16.61 11.01 23.67zm-2 0c0-6.5-4.25-15.48-10.49-22.32-6.67-7.32-14.16-10.74-20.17-8.59-13.73 4.9-15.73 5.85-24.8 11.75-2.24 1.46-9.37 6.68-11.01 7.7-3.8 2.36-7.2 3.46-11.53 3.46-8.08 0-9.98 1.23-14.13 8.5-1.1 1.91-2.51 2.88-4.35 3.09-1.3.14-1.9.05-5.22-.61-5.53-1.1-9.07-.88-13.8 1.88-15.72 9.17-26.5 23.55-26.5 41.14 0 9.2-3.28 17.29-10.15 28.28l-3.68 5.77c-1.39 2.19-2.35 3.77-3.17 5.25-2.02 3.63-3 6.38-3 8.7 0 4.19 2.87 5.67 11.9 7.52l.61.12c8.27 1.7 11.7 3.13 13.4 6.95 3.17 7.14 36 0 54.6-10.46 14.98-8.43 33.49-32.99 33.49-43.13 0-5.9 3.47-9.48 10.16-12.55 1.1-.5 4.85-2.08 5.52-2.38.74-.34 1.32-.64 1.8-.93.92-.55 1.85-1 3.25-1.62 7.65-3.35 10.75-5.5 16.47-13.12 1.02-1.36 7.47-9.42 8.47-11.11 1.79-3.01 2.33-6.06 2.33-13.3zm-37.18-22.4c.15-.1 2.4-1.51 2.95-1.84.96-.57 1.7-.94 2.43-1.17 2.57-.83 5.06-.1 11.04 3.12 14.86 8 19.43 22.87 9.18 38.71-4.04 6.24-9.37 9-18.72 11.11-.85.2-1.2.27-3.13.68-6.04 1.29-8.78 2.08-11.6 3.65-3.63 2.02-6.09 4.98-7.5 9.44-7.87 24.93-19.72 43.34-36.28 50.31-16.45 6.93-21.13 8.53-27.98 8.89-4.94.25-9.8-.65-15.4-2.89a44.45 44.45 0 0 1-5.64-2.6c-4.02-2.33-5.14-4.74-4.5-9.31.3-2.13 3.77-15.53 4.84-20.65.63-3.05 1.19-6.14 1.75-9.69a464.04 464.04 0 0 0 1.35-8.9c1.42-9.41 2.5-14.27 4.49-18.65 2.46-5.43 6.13-9.03 11.72-11.13 6.59-2.47 10.54-3.1 18.03-3.53 4.75-.27 6.68-.64 9-2.05.61-.37 1.22-.81 1.82-1.33a30.61 30.61 0 0 0 3.37-3.4c.59-.69 2.38-2.9 2.63-3.19 3.36-4 6.3-5.53 12.33-5.53 3.94 0 5.9-.92 8.18-3.36-.17.18 2.75-3.14 3.85-4.22a30.95 30.95 0 0 1 6.79-5c1.5-.83 3.15-1.62 4.99-2.38a64.92 64.92 0 0 0 10.01-5.1zm-14.52 8.34a29.95 29.95 0 0 0-6.57 4.84 116.68 116.68 0 0 0-3.82 4.2c-2.46 2.63-4.68 3.67-8.91 3.67-5.72 0-8.39 1.39-11.57 5.17-.23.28-2.03 2.5-2.63 3.2a31.6 31.6 0 0 1-3.47 3.51c-.65.55-1.3 1.03-1.96 1.43-2.5 1.51-4.55 1.9-9.47 2.19-7.39.42-11.25 1.04-17.72 3.47-5.34 2-8.82 5.4-11.17 10.6-1.93 4.27-3 9.07-4.41 18.39l-.65 4.34-.7 4.57c-.57 3.56-1.12 6.67-1.76 9.73-1.08 5.18-4.54 18.53-4.83 20.59-.59 4.17.35 6.18 4.01 8.3 1.35.77 3.1 1.58 5.52 2.55 5.46 2.18 10.18 3.05 14.97 2.8 6.69-.34 11.32-1.93 27.65-8.8 16.21-6.83 27.92-25.01 35.71-49.7 1.49-4.7 4.12-7.86 7.97-10 2.93-1.63 5.74-2.45 11.87-3.76 1.92-.4 2.28-.49 3.12-.68 9.12-2.06 14.24-4.7 18.1-10.67 9.92-15.34 5.55-29.55-8.82-37.29-5.75-3.1-8.03-3.76-10.25-3.05-.65.2-1.33.54-2.23 1.08-.55.32-2.77 1.72-2.93 1.82a65.91 65.91 0 0 1-10.16 5.17c-1.8.75-3.42 1.52-4.89 2.33zm-42.39 32.72c16.15-2.87 26.36-.97 32.47 6.16 5.08 5.93 1.13 21.42-5.93 35.55-4.79 9.58-10.6 16.21-23.16 25.19-14.15 10.1-35.5 12.2-40.71 3.85-1.86-2.97-2.1-8.14-1.06-15.73.78-5.68 1.86-10.71 4.73-22.98l.12-.51c1.59-6.8 2.37-10.31 3.14-14.14 1.45-7.25 3.74-11.47 7.26-13.74 2.81-1.8 5.53-2.28 12.33-2.62 5.33-.27 7.56-.46 10.81-1.03zm.18.98c-3.3.59-5.56.78-10.94 1.05-6.62.33-9.23.78-11.84 2.46-3.25 2.1-5.42 6.09-6.82 13.1-.77 3.84-1.56 7.35-3.15 14.17l-.12.5c-2.86 12.24-3.93 17.26-4.7 22.9-1.03 7.36-.79 12.36.9 15.07 4.82 7.7 25.54 5.67 39.29-4.15 12.43-8.88 18.13-15.39 22.84-24.81 6.86-13.72 10.75-29 6.07-34.45-5.84-6.81-15.7-8.65-31.53-5.84zM132 276.5c7.12 0 10.66 3.08 11.25 8.7.42 4.02-.43 8.14-2.77 15.94-2.56 8.52-18.36 25.38-27.2 31.28-7.01 4.67-20.02 5.67-26.57.99-3.99-2.85-3.53-12.08.02-26.46.68-2.75 1.47-5.65 2.37-8.76a412.6 412.6 0 0 1 3.05-10.14l.37-1.2c1.48-4.8 5.1-7.75 10.73-9.27 4.4-1.2 9.54-1.5 17.48-1.33l3.89.1c3.87.11 5.42.15 7.38.15zm0 1c-1.97 0-3.53-.04-7.41-.15l-3.88-.1c-7.85-.17-12.92.13-17.2 1.3-5.32 1.43-8.67 4.16-10.03 8.6a1277.83 1277.83 0 0 1-1.6 5.21c-.68 2.2-1.27 4.17-1.82 6.1-.9 3.1-1.68 5.99-2.36 8.73-3.43 13.88-3.87 22.93-.4 25.4 6.17 4.42 18.73 3.45 25.42-1 8.66-5.78 24.33-22.49 26.8-30.73 2.3-7.67 3.14-11.71 2.73-15.56-.53-5.1-3.64-7.8-10.25-7.8zm-17.79 7a31.3 31.3 0 0 1 8.57 1.4c5.42 1.78 8.72 5.03 8.72 10.1 0 9.59-9.51 17.2-22.34 21.47-9.82 3.28-13.62-1.79-11.66-16.54.84-6.28 3.82-10.67 8.24-13.46a20.38 20.38 0 0 1 8.47-2.97zm-.6 1.08a19.39 19.39 0 0 0-7.34 2.73c-4.18 2.64-6.98 6.78-7.77 12.76-1.89 14.11 1.36 18.45 10.34 15.46C121.3 312.37 130.5 305 130.5 296c0-4.56-2.98-7.5-8.03-9.15a28.05 28.05 0 0 0-8.2-1.35c-.13 0-.35.03-.66.08zm80.87-23.45c-2.72 9.8-14.93 9.86-26.72 3.3-10.17-5.64-13.8-17.98-5-22.87a66.53 66.53 0 0 0 4.48-2.7l2.03-1.3a50.15 50.15 0 0 1 3.92-2.3c4.73-2.43 8.82-2.8 14-.72 9.16 3.66 10.98 13.33 7.3 26.6zm-20.83-24.98a49.26 49.26 0 0 0-3.84 2.25l-2.03 1.3c-.84.53-1.5.95-2.16 1.35-.82.5-1.6.96-2.38 1.39-7.94 4.4-4.59 15.8 5 21.12 11.31 6.29 22.8 6.23 25.28-2.7 3.57-12.83 1.85-21.97-6.7-25.4-4.9-1.95-8.69-1.62-13.17.7zm17.85 12.15c0 5.7-2.44 9-6.64 9.96-3.3.76-7.56-.05-11.08-1.81l-1.89-.94c-.67-.34-1.18-.62-1.63-.88-4.07-2.38-4.13-4.97.34-10.93 6.8-9.06 20.9-7.16 20.9 4.6zm-1 0c0-5.3-2.87-8.55-7.32-9.16-4.23-.57-8.99 1.44-11.78 5.16-4.15 5.54-4.1 7.44-.64 9.47.44.25.93.51 1.59.85l1.87.93c3.34 1.67 7.36 2.44 10.42 1.74 3.73-.86 5.86-3.74 5.86-9zm196.5 281c0-12.8 2.44-16.74 18.48-29.77a56.8 56.8 0 0 1 7.61-5.2c2.6-1.5 5.33-2.82 8.5-4.18 1.24-.53 2.48-1.05 4.1-1.7l3.92-1.57c9.4-3.83 13.74-6.7 16.62-12.05 1.2-2.22 2.21-4.4 3.23-6.83a148.57 148.57 0 0 0 1.54-3.84l.3-.74.56-1.44c3.2-8.02 6.05-12.08 12.7-16.5a35.26 35.26 0 0 0 4.96-4 46.36 46.36 0 0 0 3.88-4.29c.27-.34 2.55-3.2 3.2-3.98 3.48-4.15 6.51-5.9 11.51-5.9 3.08 0 5.62-.63 9.57-2.1 5.42-2.02 6.53-2.34 8.96-2.2 2.53.13 4.85 1.26 7.18 3.59 1.3 1.3 5.55 5.83 6.52 6.78 5.06 5 9.44 6.92 17.77 6.92a197.5 197.5 0 0 1 12.08.45c15.93.87 21.94.57 25.28-2.21 6.91-5.77 11.64-2.73 11.64 7.76 0 10.73-8.6 20-19 20-4.8 0-8.32 1.43-9.34 3.67-1.12 2.48.68 6.15 5.98 10.57 13.6 11.33 11.24 20.76-7.64 20.76a21.91 21.91 0 0 0-14.6 5.24c-3.28 2.71-5.8 5.86-9.85 11.82l-1.52 2.25c-3.1 4.57-5.01 7.1-7.32 9.4-6.21 6.21-9.3 7.64-13.05 6.89l-1-.23a10.82 10.82 0 0 0-2.66-.37c-1.6 0-2.41.67-8.18 6.22-4.85 4.67-8.07 6.78-11.82 6.78-1.33 0-3.46 1.15-6.45 3.45-1.27.98-2.68 2.14-4.5 3.7l-4.92 4.29a181.11 181.11 0 0 1-4.54 3.82c-9.33 7.56-15.63 10.2-20.21 6.52-2.7-2.15-4.14-4.51-4.63-7.26-.37-2.04-.26-3.63.29-7.3.87-5.85.65-8.42-1.83-11.6-2.32-2.98-2.96-3.22-3.77-2.39-.25.26-1.35 1.63-1.61 1.94-2.21 2.5-4.85 3.57-9 2.82-4.6-.84-5.57-4.11-4.72-10.09l.24-1.56c.6-3.66.68-4.93.25-5.8-.44-.86-1.9-.94-5.23.4l-.74.29c-13.78 5.54-15.26 6.09-19.43 6.67-6.03.84-9.31-1.6-9.31-7.9zm2 0c0 5 2.14 6.6 7.04 5.92 3.91-.55 5.43-1.1 18.95-6.55l.75-.3c4.17-1.66 6.7-1.54 7.76.58.71 1.43.62 2.76-.06 7l-.24 1.53c-.72 5.04-.06 7.27 3.09 7.84 3.43.62 5.38-.17 7.15-2.18.2-.23 1.34-1.66 1.68-2 1.9-1.96 3.82-1.25 6.78 2.55 2.9 3.74 3.17 6.77 2.22 13.12-1 6.75-.52 9.4 3.62 12.71 3.49 2.8 9.1.45 17.7-6.51 1.35-1.1 2.75-2.28 4.49-3.78l4.93-4.3c1.84-1.58 3.27-2.76 4.58-3.77 3.34-2.56 5.74-3.86 7.67-3.86 3.04 0 5.95-1.9 10.43-6.22l2.46-2.39c.94-.89 1.67-1.56 2.37-2.13 1.81-1.49 3.3-2.26 4.74-2.26 1.03 0 1.81.13 3.1.42.7.16.71.17.96.21 2.96.6 5.45-.55 11.23-6.33 2.2-2.2 4.06-4.65 7.09-9.11l1.52-2.25c4.15-6.11 6.76-9.37 10.22-12.24a23.9 23.9 0 0 1 15.88-5.7c16.87 0 18.62-7.01 6.36-17.23-5.9-4.92-8.12-9.41-6.52-12.93 1.42-3.12 5.67-4.84 11.16-4.84 9.25 0 17-8.34 17-18 0-8.94-2.88-10.79-8.36-6.23-3.94 3.28-9.98 3.59-26.67 2.68l-1.02-.06c-5.09-.27-7.99-.39-10.95-.39-8.88 0-13.76-2.14-19.18-7.5-1-.98-5.26-5.53-6.53-6.79-1.99-1.99-3.86-2.9-5.87-3-2.03-.12-3.06.18-8.15 2.07-4.15 1.55-6.9 2.22-10.27 2.22-4.33 0-6.84 1.46-9.98 5.2-.63.74-2.89 3.6-3.18 3.95a48.29 48.29 0 0 1-4.04 4.46 37.26 37.26 0 0 1-5.24 4.23c-6.26 4.17-8.9 7.91-11.95 15.58l-.57 1.43-.28.74a531.5 531.5 0 0 1-1.56 3.88 77.49 77.49 0 0 1-3.32 7c-3.16 5.88-7.82 8.97-17.63 12.96l-3.92 1.58c-1.6.64-2.84 1.15-4.05 1.67a79.2 79.2 0 0 0-8.3 4.08 54.8 54.8 0 0 0-7.35 5.02c-15.62 12.7-17.74 16.13-17.74 28.23zm133.22-79.76c3.06 1.53 6.54 2.02 10.68 1.7 2.53-.2 4.91-.62 8.8-1.49 5.36-1.19 6.33-1.38 8.33-1.54 2.78-.23 4.82.17 6.29 1.4 1.58 1.31 1.96 2.72 1.26 4.22-.66 1.38-1.05 1.74-5.05 5.07-3.53 2.93-5.03 4.83-5.03 7.09 0 7.3 1.29 10.02 7.83 15.62 3.86 3.3 5.93 6.84 5.28 9.62-.75 3.25-4.96 5.02-12.61 5.02-7.18 0-12.7 4.61-20.03 14.68-.5.7-3.96 5.57-4.94 6.87a38.89 38.89 0 0 1-4.72 5.5c-1.06.98-2.09 1.7-3.1 2.15-2.85 1.26-5.05 1.57-9.83 1.74-7.66.27-10.87 1.45-14.98 7.1-1.58 2.17-3.11 4-4.68 5.6a42.87 42.87 0 0 1-8.65 6.69c-.15.08-10.69 6.19-14.8 8.83-3.76 2.42-6.45 2.04-8.22-.77-1.28-2.03-1.9-4.54-2.87-10.35-.84-5.08-1.27-7.08-2.06-8.93-.97-2.3-2.21-3.24-4.02-2.88-6.2 1.24-8.95 1.39-10.98.2-2.37-1.4-3.13-4.62-2.62-10.73.16-1.96-1.04-2.87-3.76-3.04-2.24-.13-4.9.2-9.94 1.12l-.69.12c-7.97 1.45-10.72 1.72-12.72.73-2.91-1.43-1.6-5.27 4.23-12.21 5.48-6.53 10.6-10.81 15.76-13.53 3.74-1.97 5.94-2.65 12.16-4.1 7.29-1.72 10.4-3.51 14.04-9.31 2.96-4.75 10.74-18.62 12.14-20.84 3.59-5.67 6.8-9.1 11.05-11.34 2.6-1.38 4.72-2.82 9.17-6.07l1.38-1.01c7.85-5.72 12.3-7.98 17.68-7.98 4.22 0 6.49 1.36 9.13 4.77.34.43 1.67 2.22 2 2.67.85 1.09 1.6 1.98 2.45 2.83a24.29 24.29 0 0 0 6.64 4.78zm-.44.9c-2.8-1.4-5-3.03-6.92-4.97-.87-.9-1.65-1.81-2.51-2.93-.35-.46-1.68-2.25-2.01-2.67-2.47-3.18-4.46-4.38-8.34-4.38-5.09 0-9.4 2.2-17.09 7.78l-1.38 1.01c-4.49 3.29-6.63 4.74-9.3 6.15-4.06 2.15-7.16 5.45-10.66 11-1.39 2.19-9.16 16.05-12.15 20.82-3.79 6.07-7.13 7.98-14.66 9.75-6.13 1.45-8.27 2.1-11.92 4.02-5.04 2.66-10.05 6.86-15.46 13.3-5.43 6.46-6.53 9.69-4.55 10.66 1.7.84 4.48.57 12.1-.81l.7-.13c5.12-.93 7.82-1.27 10.17-1.12 3.21.2 4.92 1.48 4.7 4.11-.48 5.76.2 8.64 2.13 9.78 1.73 1.02 4.34.88 10.27-.31 2.35-.47 4 .78 5.14 3.47.83 1.95 1.27 4 2.07 8.8l.06.36c.94 5.65 1.55 8.11 2.72 9.98 1.46 2.3 3.52 2.6 6.84.46 4.14-2.66 14.69-8.77 14.81-8.85a41.9 41.9 0 0 0 8.46-6.54 47.89 47.89 0 0 0 4.6-5.48c4.32-5.95 7.81-7.23 15.74-7.5 4.66-.17 6.76-.47 9.46-1.67.9-.4 1.85-1.06 2.84-1.96a38.03 38.03 0 0 0 4.6-5.36c.96-1.3 4.4-6.16 4.93-6.87 7.5-10.31 13.22-15.09 20.83-15.09 7.24 0 11.02-1.6 11.64-4.24.54-2.32-1.36-5.55-4.97-8.64-6.75-5.79-8.17-8.79-8.17-16.38 0-2.67 1.64-4.74 5.39-7.86 3.8-3.17 4.23-3.56 4.78-4.73.5-1.06.25-1.99-.99-3.03-2.23-1.85-4.72-1.65-13.76.36-3.93.87-6.35 1.3-8.94 1.5-4.3.34-7.97-.18-11.2-1.8zm-28-3.9c5.65-2.82 8.96-2.2 12.9 1.37.56.5 2.6 2.47 3.02 2.87 4.2 3.89 8.07 5.71 14.3 5.71 11.37 0 14 1.41 16.1 8.09.26.83 1.35 4.6 1.66 5.62.8 2.63 1.64 5.03 2.7 7.6 2.13 5.17 2.64 8.32 1.72 10.24-.77 1.61-2.1 2.18-5.37 2.79-2.32.43-2.8.53-3.85.85-1.85.58-3.35 1.4-4.6 2.66-1 1-2.02 2.13-3.31 3.66-.6.71-2.91 3.5-3.46 4.14-7.2 8.54-12.43 12.35-19.59 12.35-3.76 0-6.95 1.28-10.59 4-1.84 1.37-11.62 10.31-15.22 13.06a73.09 73.09 0 0 1-8.95 5.88c-4.58 2.54-7.35 3.22-8.98 2.23-1.32-.8-1.65-2.07-1.94-5.5a52.53 52.53 0 0 0-.16-1.81c-.54-4.73-2.24-6.86-7.16-6.86-7.11 0-8.85-1.23-9.73-5.41-.96-4.61-2.1-6.7-6.55-9.67-3.97-2.65-4.31-5.42-1.52-8.22 2-2 4.63-3.5 11.35-6.87 6.61-3.3 9.2-4.8 11.1-6.68a39.09 39.09 0 0 0 5.3-6.48c.98-1.5 1.83-3.04 2.88-5.13l2.12-4.3c.91-1.83 1.72-3.37 2.61-4.98 5.74-10.32 10.37-14.78 23.22-21.2zm-22.34 21.7c-.89 1.59-1.69 3.12-2.6 4.94l-2.11 4.3a52.9 52.9 0 0 1-2.94 5.23 40.08 40.08 0 0 1-5.44 6.63c-2 2-4.62 3.51-11.35 6.87-6.6 3.3-9.2 4.8-11.1 6.69-2.33 2.34-2.08 4.37 1.38 6.67 4.7 3.14 5.96 5.46 6.97 10.3.78 3.7 2.09 4.62 8.75 4.62 5.5 0 7.57 2.57 8.15 7.75.06.5.09.82.17 1.84.25 3.06.55 4.17 1.46 4.72 1.2.74 3.69.13 7.98-2.25a72.09 72.09 0 0 0 8.82-5.8c3.55-2.7 13.34-11.65 15.24-13.07 3.79-2.83 7.18-4.19 11.18-4.19 6.77 0 11.8-3.67 18.83-12l3.45-4.13a60.07 60.07 0 0 1 3.37-3.72 11.72 11.72 0 0 1 5.01-2.91c1.1-.34 1.6-.45 3.97-.89 2.95-.55 4.07-1.02 4.65-2.23.76-1.59.28-4.5-1.74-9.43a84.46 84.46 0 0 1-2.74-7.69c-.31-1.03-1.4-4.8-1.66-5.61-1.95-6.2-4.16-7.39-15.14-7.39-6.5 0-10.61-1.93-14.98-5.98-.44-.4-2.46-2.37-3.01-2.86-3.65-3.3-6.52-3.85-11.79-1.21-12.67 6.33-17.15 10.65-22.78 20.8zm55.86 11.93c-2.98 6.45-16.78 15.26-26.74 15.26-5.33 0-7.56-2.98-7.11-7.86.32-3.48 2.1-7.91 3.93-10.61l1.52-2.32a44.95 44.95 0 0 1 1.88-2.7c3.66-4.8 7.85-7.45 13.62-7.45 9.06 0 15.75 9.52 12.9 15.68zm-.9-.42c2.52-5.47-3.65-14.26-12-14.26-5.4 0-9.33 2.48-12.82 7.06-.6.8-1.17 1.6-1.85 2.64 0 0-1.2 1.87-1.52 2.33-1.74 2.57-3.46 6.85-3.77 10.14-.4 4.33 1.43 6.77 6.12 6.77 9.57 0 23.02-8.58 25.83-14.68zm-69.67 20.74c2.08.18 4.44.81 5.88 1.8 2.12 1.47 2.2 3.6-.26 6.05-5.14 5.15-12.85 4.34-12.85-1.35 0-4.66 3.14-6.84 7.23-6.5zm-.09 1c-3.56-.3-6.14 1.5-6.14 5.5 0 4.58 6.53 5.26 11.15.65 2.03-2.04 1.98-3.43.4-4.52-1.27-.88-3.48-1.47-5.4-1.63zm29.59-225.95c4.64 2.35 17.27 8.24 19.39 9.43a24.14 24.14 0 0 1 7.05 5.64 45.03 45.03 0 0 1 3.75 5.2c2.4 3.78.04 7.66-6.2 11.63-4.97 3.16-12.18 6.3-21.95 9.82-4.84 1.74-19.63 6.68-21.1 7.2-6.59 2.33-14.85.1-25.14-5.86-3.93-2.27-8-5-12.94-8.54-2.23-1.61-9.5-6.99-10.7-7.85a81.21 81.21 0 0 0-8.63-5.7c-4.82-2.6-4.45-6.64.17-12.13 3.27-3.88 4.17-4.67 18.1-16.33a230.2 230.2 0 0 0 8.89-7.74 95.2 95.2 0 0 0 4.72-4.66c5.08-5.43 9.8-6.49 14.97-3.92 2.24 1.1 4.53 2.85 7.43 5.52 1.48 1.37 6.94 6.72 7.98 7.7 5.2 4.91 9.46 8.2 14.2 10.6zm-.46.9c-4.85-2.45-9.18-5.79-14.44-10.76-1.05-1-6.5-6.34-7.97-7.69-2.83-2.61-5.06-4.3-7.2-5.37-4.75-2.36-9-1.4-13.8 3.71a96.18 96.18 0 0 1-4.76 4.71c-2.48 2.3-5.16 4.62-8.92 7.77-13.86 11.6-14.77 12.4-17.98 16.21-4.28 5.08-4.58 8.4-.46 10.61 2.23 1.2 4.9 2.99 8.74 5.77 1.2.87 8.47 6.24 10.7 7.85a154.8 154.8 0 0 0 12.85 8.49c10.06 5.82 18.07 7.98 24.3 5.78 1.48-.52 16.27-5.47 21.1-7.2 9.7-3.5 16.86-6.61 21.75-9.72 5.84-3.71 7.9-7.1 5.9-10.26a44.09 44.09 0 0 0-3.67-5.08 23.16 23.16 0 0 0-6.78-5.42c-2.08-1.16-14.68-7.05-19.36-9.4zm-38.83 8.05c3.11-.37 5.7-.13 8.4.7 2.15.66 2.74.93 8.64 3.77 4.75 2.29 8.39 3.86 13.19 5.56 8.38 2.97 11.32 6.23 8.83 9.76-2.08 2.94-8.04 5.92-17.84 9.18-8.45 2.82-15.48 2.35-21.43-.9-4.65-2.55-8.33-6.5-12.15-12.3-2.9-4.41-2.73-8.2.16-11.06 2.48-2.45 6.87-4.07 12.2-4.7zm.12 1c-5.13.6-9.33 2.16-11.62 4.42-2.53 2.5-2.68 5.77-.02 9.8 3.73 5.68 7.3 9.51 11.8 11.97 5.7 3.11 12.43 3.57 20.62.84 9.59-3.2 15.44-6.12 17.34-8.82 1.94-2.75-.5-5.45-8.35-8.24-4.84-1.72-8.5-3.3-13.28-5.6-5.84-2.81-6.42-3.07-8.5-3.71a18.42 18.42 0 0 0-8-.66zM202.5 500.38c0 4.78-1.45 7.56-4.43 8.93-2.29 1.05-4.55 1.23-10.79 1.2l-1.78-.01c-9.19 0-17-7.65-17-15.5 0-7.59 10.6-10.51 19.74-5.44 2.78 1.55 4.21 1.94 8.57 2.75 4.44.83 5.69 2.27 5.69 8.07zm-1 0c0-5.3-.9-6.34-4.88-7.08-4.45-.83-5.96-1.25-8.86-2.86-8.57-4.76-18.26-2.1-18.26 4.56 0 7.3 7.36 14.5 16 14.5h1.79c6.06.04 8.26-.14 10.36-1.1 2.6-1.2 3.85-3.6 3.85-8.02zm33.33-117.85c3.71-1.31 8.7-2.7 16.1-4.55 2.58-.65 16.53-4.04 20.56-5.05 19.59-4.93 31.55-8.9 38.23-13.35 14.93-9.95 36.87-33.88 43.83-47.8 2.25-4.5 4.65-6.38 7.68-6.25 1.26.06 2.61.45 4.32 1.2a50.81 50.81 0 0 1 3.54 1.7l1.26.63c4.78 2.34 8.38 3.44 12.65 3.44 7.2 0 10.01 3.07 8.35 7.91-1.4 4.06-5.92 8.91-11.1 12.02-8.3 4.98-11.75 17.3-11.75 33.57 0 3.59-1.37 6.28-3.98 8.36-1.98 1.58-4.2 2.6-8.47 4.16l-1.02.37c-4.85 1.75-6.98 2.77-8.68 4.46-5.09 5.1-12.54 7.15-20.35 7.15-1.38 0-2.47.92-3.99 3.1-.29.41-1.32 1.95-1.47 2.18-2.68 3.92-4.93 5.72-8.54 5.72-7.84 0-10.74.93-21.76 6.94-5.18 2.82-8.8 3.58-14.66 3.68-.26 0-.47 0-.92.02-4.82.06-7.12.3-10.51 1.34a73.43 73.43 0 0 0-8.89 3.56c-2.17 1-10.53 5.01-10.23 4.87-7.79 3.7-13.32 5.98-18.9 7.57-12.41 3.55-18.58 2.24-27.42-4.07-2.58-1.85-2.72-4.43-.83-7.62 1.45-2.45 3.9-5.09 8.08-8.97l1.78-1.64c3.92-3.6 4.48-4.11 5.9-5.53 2.32-2.32 3.12-3.5 5.48-7.63 1.93-3.36 3.37-5.11 6.27-7.06 2.3-1.54 5.34-2.98 9.44-4.43zm.34.94c-4.03 1.42-7 2.83-9.22 4.32-2.75 1.85-4.1 3.49-5.96 6.73-2.4 4.2-3.24 5.44-5.64 7.83-1.43 1.44-2 1.96-5.94 5.57l-1.77 1.63c-4.1 3.82-6.52 6.41-7.9 8.75-1.65 2.79-1.54 4.8.55 6.3 8.6 6.14 14.46 7.38 26.57 3.92 5.5-1.57 11-3.84 18.74-7.51-.3.14 8.06-3.88 10.24-4.88a74.3 74.3 0 0 1 9.01-3.6c3.51-1.09 5.89-1.33 10.8-1.4h.91c5.72-.1 9.18-.83 14.2-3.57 11.16-6.08 14.2-7.06 22.24-7.06 3.19 0 5.2-1.6 7.71-5.28l1.48-2.2c1.7-2.43 3-3.52 4.81-3.52 7.57 0 14.78-2 19.65-6.85 1.83-1.84 4.04-2.9 9.04-4.7l1.02-.37c8.6-3.13 11.79-5.67 11.79-11.58 0-16.6 3.53-29.2 12.24-34.43 5-3 9.35-7.67 10.66-11.48 1.42-4.13-.83-6.59-7.4-6.59-4.45 0-8.19-1.14-13.09-3.54-7.52-3.67-6.78-3.34-8.72-3.43-2.58-.1-4.65 1.52-6.74 5.7-7.04 14.07-29.1 38.14-44.17 48.19-6.81 4.54-18.84 8.52-38.55 13.48-4.03 1.02-17.98 4.4-20.56 5.05-7.37 1.84-12.33 3.23-16 4.52zM252 387.5c2.08 0 4-.2 7.25-.69 5.22-.77 6.64-.9 8.46-.5 2.52.56 3.79 2.35 3.79 5.69 0 4.05-2.27 7.29-6.62 10.11-3.24 2.1-6.53 3.53-14.15 6.4l-.27.1-2.28.86c-3.04 1.16-5.27 2.52-9.33 5.43l-.8.57c-8.19 5.88-13.35 8.03-23.05 8.03-4.98 0-6.88-2.03-5.75-5.62.87-2.81 3.58-6.56 7.8-11.13 1.26-1.37 2.64-2.8 4.15-4.3 3.17-3.14 11.25-10.61 11.45-10.8.46-.47.93-.89 1.4-1.26 3.38-2.71 5.77-3.08 14.18-2.93 1.65.03 2.63.04 3.77.04zm0 1c-1.15 0-2.13-.01-3.79-.04-8.18-.14-10.4.2-13.54 2.71-.44.35-.88.74-1.32 1.18-.2.21-8.3 7.69-11.45 10.82a134.6 134.6 0 0 0-4.12 4.26c-4.12 4.47-6.76 8.12-7.58 10.75-.9 2.88.45 4.32 4.8 4.32 9.46 0 14.44-2.07 22.46-7.84l.8-.57c4.13-2.96 6.42-4.36 9.56-5.56l2.3-.86.25-.1c7.55-2.84 10.8-4.25 13.97-6.3 4.08-2.65 6.16-5.6 6.16-9.27 0-2.89-.97-4.26-3-4.7-1.65-.37-3.05-.25-8.1.5-3.3.5-5.26.7-7.4.7zm112.47-45.34c-1.88 5.44-1.98 6.76-.98 12.76 1.18 7.06-1.38 16.58-5.49 16.58a16.89 16.89 0 0 0-1.51.07l-.64.04c-2.86.18-4.83.17-6.94-.17-6.55-1.06-10.41-5.14-10.41-13.44 0-13.9 2.14-19.69 8.13-26.33a21.9 21.9 0 0 0 2.52-3.75c.59-1.03 2.78-5.13 2.72-5.01 4.44-8.14 7.71-11.53 12.25-10.4 1.17.3 2.2.77 3.58 1.59l1.39.84a20 20 0 0 0 3.1 1.6c.7.27 1.8.32 4.75.26l.72-.01c3.16-.05 4.78.08 5.83.66 1.61.89 1.2 2.56-1.14 4.9a215.9 215.9 0 0 1-3.86 3.76c-10.6 10.1-12.75 12.4-14.02 16.05zm-.94-.32c1.34-3.9 3.46-6.17 14.27-16.46 1.55-1.47 2.73-2.62 3.85-3.73 1.94-1.95 2.17-2.88 1.35-3.33-.82-.45-2.37-.58-5.32-.53l-.72.01c-3.14.06-4.26.02-5.14-.34-1.06-.41-1.97-.9-3.25-1.67l-1.38-.83a12.1 12.1 0 0 0-3.31-1.47c-3.88-.97-6.92 2.17-11.13 9.9.07-.13-2.14 3.98-2.73 5.02a22.71 22.71 0 0 1-2.65 3.92c-5.81 6.47-7.87 12-7.87 25.67 0 7.79 3.48 11.47 9.57 12.45 2.01.33 3.92.34 6.71.16a371.33 371.33 0 0 0 1.23-.07c.42-.03.73-.04.99-.04 3.2 0 5.6-8.9 4.5-15.42-1.02-6.16-.91-7.64 1.03-13.24zm-9.26 12.42c.58.52 2.5 1.9 2.55 1.93 1.96 1.57 2.04 3.31.01 6.36-3.74 5.64-8.83 3.09-8.83-4.55 0-3.81.51-5.67 2.07-6.02 1.18-.26 2 .3 4.2 2.28zm-1.34 1.48c-1.5-1.35-2.23-1.85-2.43-1.8-.17.03-.5 1.23-.5 4.06 0 5.87 2.67 7.21 5.17 3.45 1.5-2.26 1.47-2.84.4-3.7.03.03-1.95-1.4-2.64-2zm222.9-130.19c2.2-1.1 3.67-1.66 5.88-2.36l.28-.09a48.92 48.92 0 0 0 8.79-3.55c4.17-2.08 6.35-1.88 6.96.84.44 2 .2 4.01-1.25 12.7-2.27 13.62-9.16 26.14-21.17 36.3-4.3 3.63-7.41 4.39-9.75 2.44-1.88-1.57-3.1-4.57-4.61-10.48-.3-1.15-1.43-5.83-1.72-6.96a114.18 114.18 0 0 0-2.71-9.22c-2.4-6.82-3.03-10.78-2.1-12.94.77-1.83 2.08-2.24 5.6-2.45 1.49-.09 2.09-.14 2.97-.28l1.95-.33c.72-.12 1.22-.2 1.68-.29 1.1-.2 1.92-.38 2.71-.6 1.7-.49 3.42-1.2 6.49-2.73zm.44.9c-3.11 1.54-4.88 2.29-6.65 2.79-.84.23-1.69.42-2.81.63a108.77 108.77 0 0 1-3.81.63c-.77.13-1.39.19-2.92.28-3.13.18-4.17.51-4.74 1.85-.78 1.84-.2 5.62 2.13 12.2a115.12 115.12 0 0 1 2.74 9.31l1.72 6.96c1.46 5.7 2.62 8.58 4.28 9.96 1.87 1.56 4.49.93 8.47-2.44 11.82-10 18.6-22.3 20.83-35.7 1.4-8.45 1.65-10.51 1.25-12.31-.41-1.87-1.86-2-5.54-.16a49.87 49.87 0 0 1-8.93 3.6l-.28.1a35.4 35.4 0 0 0-5.74 2.3zm-4.5 6.58c1.37-.32 2.5-.75 3.9-1.42.35-.18 2.57-1.31 3.32-1.67 1.5-.71 2.97-1.31 4.7-1.89 2.7-.9 4.64-.77 5.88.4.98.94 1.34 2.26 1.41 4.18.02.4.02.7.02 1.37 0 5.63-4.63 16.88-11.34 22.75-4.34 3.8-7.31 4.67-9.92 2.52-2.06-1.7-3.5-4.65-6.67-12.91-1.86-4.83-2.05-8.1-.68-10.2 1.12-1.7 2.9-2.36 5.83-2.7l1.26-.12c1.19-.12 1.75-.19 2.3-.31zm-2.1 2.3-1.22.12c-2.4.27-3.7.76-4.39 1.81-.93 1.43-.78 4.1.87 8.38 3.02 7.84 4.41 10.71 6.08 12.09 1.63 1.34 3.64.75 7.33-2.48C584.6 250.77 589 240.08 589 235c0-.64 0-.93-.02-1.29-.05-1.44-.3-2.33-.79-2.8-.6-.57-1.8-.65-3.87.04a37.95 37.95 0 0 0-4.47 1.8c-.72.34-2.93 1.47-3.32 1.66a19.54 19.54 0 0 1-4.3 1.56c-.66.16-1.28.24-2.56.36zm-227.73-88.98c-1.59 4.3-3.54 7.25-7.14 11.4l-2.6 2.97a67.02 67.02 0 0 0-2.63 3.23 46.4 46.4 0 0 0-4.68 7.5c-2.85 5.7-7.14 10.18-12.85 13.89-4.25 2.76-8.25 4.62-15.67 7.59-11.01 4.4-16.43 1.26-27.22-16.4-2.86-4.69-8.8-8.63-17.98-12.66-3-1.33-12.88-5.24-14.43-5.92-4.96-2.18-7.04-3.72-6.42-5.85.67-2.32 5.3-4.05 15.48-6.08 16.63-3.32 26.93-3.82 39.93-3.02 7.9.49 9.67.5 12.74-.26 1.99-.48 3.92-1.3 6-2.6l2.79-1.71c9.86-6.14 12.94-7.96 17.3-9.9 6.03-2.71 10.57-3.32 13.94-1.4 7.2 4.12 7.68 7.7 3.44 19.22zm-1.88-.7c3.95-10.7 3.6-13.26-2.56-16.78-2.66-1.52-6.62-.99-12.12 1.48-4.24 1.9-7.3 3.7-17.07 9.77l-2.79 1.73a22.6 22.6 0 0 1-6.57 2.84c-3.36.81-5.22.8-13.34.3-12.84-.78-22.97-.29-39.41 3-4.9.97-8.45 1.88-10.79 2.75-2.03.76-3.04 1.45-3.17 1.91-.16.57 1.48 1.79 5.3 3.46 1.5.67 11.39 4.58 14.44 5.93 9.52 4.19 15.74 8.3 18.87 13.44 10.35 16.93 14.87 19.56 24.78 15.6 7.3-2.93 11.21-4.75 15.33-7.42 5.42-3.53 9.47-7.75 12.15-13.1 1.44-2.9 3.02-5.4 4.86-7.82a68.95 68.95 0 0 1 2.72-3.33l2.6-2.97c3.46-3.99 5.28-6.75 6.77-10.79zm-6.64-.39c-7.94 12.8-18.53 21.75-33.3 25.23-7.82 1.83-12.47-.79-13.12-5.93-.55-4.45 2.29-9.06 6-9.06 3.02 0 5.6-1.68 15.38-9.16 1.47-1.12 2.57-1.96 3.66-2.74 4.4-3.2 7.77-5.17 10.82-6.08 5.57-1.67 9.33-2.15 11.35-1.22 2.5 1.14 2.22 4.13-.79 8.96zm-.84-.52c2.72-4.4 2.94-6.74 1.21-7.53-1.71-.79-5.32-.33-10.65 1.27-2.9.87-6.2 2.79-10.51 5.92-1.08.79-2.18 1.62-3.65 2.74-10.08 7.72-12.62 9.36-15.98 9.36-3.02 0-5.5 4.02-5 7.94.56 4.5 4.62 6.78 11.89 5.07 14.48-3.4 24.86-12.18 32.69-24.77zM461.17 33.53c13.88 4.96 20.75 4.96 31.62.01 3.02-1.37 5.47-2.94 11-6.82 5.57-3.92 8.05-5.51 11.14-6.92 4.14-1.88 7.78-2.38 11.22-1.28 3.92 1.26 6.2 12.3 6.78 28.45.5 14.2-.52 28.93-2.46 34.2-1.82 4.93-5.86 8.17-11.51 10.02A41.7 41.7 0 0 1 506 93.01c-5.79 0-9 2.4-12.2 7.64-.37.59-1.55 2.6-1.71 2.87-1.75 2.9-3.05 4.33-4.93 4.95-.94.32-2.07.83-3.87 1.74l-2.43 1.23c-1.03.53-1.87.94-2.7 1.34-6.43 3.1-11.73 4.72-17.16 4.72-5.71 0-10.04 2.09-14.02 5.92-1.16 1.11-4.2 4.53-4.63 4.94-2.54 2.44-5.93 4.24-10.85 6.1-1.4.52-5.98 2.13-6.25 2.22l-2.06.78c-.89.36-1.78.63-2.7.81-5.55 1.14-11.14-.54-17.98-4.42-1.27-.73-5.13-3.06-5.76-3.42-2.05-1.16-4.12-1.53-9.09-1.9l-1.73-.15c-4.78-.4-7.68-1.14-10.22-2.97-5-3.61-6.77-7.76-5.65-12.33 1.33-5.42 6.5-11.02 14.85-17.28a169.2 169.2 0 0 1 6.5-4.61c-.33.23 4.33-2.92 5.3-3.6 2.73-1.91 4.8-3.9 12.75-12.04l1.09-1.1c3.49-3.56 5.89-5.89 8.12-7.83 2.9-2.5 4.72-5.95 7.5-13.05l.63-1.61c2.7-6.92 4.28-10 6.87-12.33 1.42-1.28 6.68-6.54 7.93-7.5 3.98-3 8.01-2.73 19.57 1.4zm-.34.94c-11.26-4.02-15-4.28-18.62-1.53-1.19.9-6.4 6.11-7.88 7.43-2.42 2.18-3.96 5.19-6.6 11.95l-.63 1.61c-2.83 7.26-4.72 10.8-7.77 13.45a141.85 141.85 0 0 0-9.16 8.87c-8.02 8.2-10.08 10.2-12.88 12.16-.99.69-5.65 3.84-5.31 3.6-2.5 1.71-4.52 3.13-6.47 4.59-8.17 6.13-13.23 11.6-14.48 16.72-1.02 4.15.58 7.9 5.26 11.27 2.36 1.7 5.11 2.4 9.72 2.8l1.73.13c5.12.4 7.28.78 9.5 2.05.65.36 4.5 2.7 5.76 3.4 6.66 3.78 12.04 5.4 17.29 4.32.86-.17 1.7-.42 2.52-.75a67 67 0 0 1 2.1-.8c.28-.1 4.86-1.7 6.24-2.22 4.8-1.8 8.08-3.56 10.5-5.88.4-.38 3.44-3.8 4.63-4.94 4.16-4 8.72-6.2 14.72-6.2 5.25 0 10.42-1.59 16.73-4.62.82-.4 1.65-.8 2.68-1.33.12-.06 1.93-.99 2.43-1.23 1.84-.93 3-1.46 4-1.8 1.6-.52 2.76-1.82 4.39-4.52l1.7-2.88c3.39-5.5 6.87-8.11 13.07-8.11 4.45 0 8.73-.49 12.64-1.77 5.4-1.76 9.2-4.8 10.9-9.41 1.87-5.11 2.9-19.75 2.39-33.83-.56-15.53-2.81-26.48-6.08-27.52-3.18-1.02-6.57-.55-10.5 1.23-3.02 1.37-5.47 2.94-11 6.83-5.57 3.92-8.05 5.5-11.14 6.92-11.13 5.05-18.26 5.05-32.38.01zM475 55c5.38 0 7.55-.21 9.72-.96 1.26-.43 9.95-4.8 14.88-6.96 1.9-.82 3.56-2.44 6.6-6.04 2.56-3.04 3.19-3.75 4.4-4.84 3.7-3.35 7.07-3.28 10.22 1.23 6.23 8.9 5.61 15.94.07 27.02a71.26 71.26 0 0 0-2.5 5.48c-.32.8-1 2.7-1.09 2.9-.17.45-.34.81-.54 1.17-.63 1.14-1.56 2.21-4.05 4.7-2.4 2.4-5.16 3.27-11.68 4.33-1.81.3-2.2.36-3 .51-6.02 1.1-9.6 2.69-12.24 6.07-3.57 4.59-7.9 7.48-14.98 10.74-.55.24-1.1.5-1.8.8l-1.78.8a60.08 60.08 0 0 0-7.7 3.9c-2.57 1.6-4.79 2.35-9.42 3.46-8.58 2.06-12.28 3.76-17.37 9.36-5.12 5.64-10.17 7.64-16.63 6.7-5.36-.79-10.63-3.01-23.56-9.48-6.3-3.15-6.43-7.78-1.5-13.56 3.38-3.94 3.52-4.06 19.4-16.44 8.12-6.33 12.97-10.57 16.63-14.88 2.53-2.98 4.2-5.73 4.96-8.3 5.5-18.3 12.5-21.98 22.78-15.56 1.95 1.22 6.61 4.55 7.18 4.9 3.36 2.15 6.52 2.95 13 2.95zm0 2c-6.84 0-10.37-.89-14.08-3.26-.63-.4-5.27-3.71-7.16-4.9-9.05-5.65-14.66-2.7-19.8 14.45-.86 2.87-2.67 5.85-5.35 9.01-3.78 4.45-8.7 8.75-16.94 15.17-15.66 12.21-15.86 12.38-19.1 16.16-4.17 4.9-4.09 8 .88 10.48 12.71 6.35 17.89 8.54 22.94 9.28 5.78.84 10.18-.9 14.87-6.06 5.42-5.96 9.45-7.82 18.38-9.96 4.43-1.07 6.5-1.76 8.83-3.22a61.7 61.7 0 0 1 7.94-4.02l1.78-.8 1.78-.8c6.82-3.13 10.91-5.87 14.24-10.14 3-3.87 7-5.64 13.46-6.82.83-.15 1.21-.21 3.04-.51 6.1-1 8.6-1.78 10.58-3.77 2.36-2.36 3.21-3.34 3.72-4.26.15-.27.29-.56.44-.94.06-.15.75-2.06 1.09-2.9.64-1.6 1.45-3.4 2.57-5.64 5.24-10.49 5.8-16.8.07-24.98-2.4-3.44-4.37-3.48-7.24-.89-1.11 1-1.73 1.7-4.22 4.65-3.24 3.85-5.04 5.59-7.32 6.59-4.82 2.1-13.62 6.53-15.03 7.01-2.44.84-4.79 1.07-10.37 1.07zm-12.7 8.6c5.47 3.9 10.34 3.72 18.23.88 5.39-1.94 5.92-2.1 7.7-2.1 2.5-.01 4.21 1.36 5.24 4.46 1.66 4.98-2.32 8.52-12.3 12.68-2.7 1.13-16.25 6.18-20 7.73-7.86 3.24-13.93 6.42-18.87 10.15-13.02 9.84-18.36 11.93-23.71 9.68a24.67 24.67 0 0 1-3.62-1.98l-1.99-1.28a90.4 90.4 0 0 0-2.24-1.4c-3.33-2-2.82-4.28.85-7.34 1.35-1.13 10.66-7.61 13.53-9.91 7.1-5.69 11.91-11.47 14.41-18.34 3.07-8.45 4.89-12.1 6.8-13.39 1.73-1.16 3.36-.53 6.18 1.9.63.56 3.4 3.08 4.11 3.7 1.93 1.7 3.71 3.15 5.67 4.55zm-.6.8c-1.98-1.42-3.79-2.88-5.74-4.6-.73-.64-3.48-3.16-4.1-3.7-2.5-2.16-3.75-2.65-4.97-1.83-1.66 1.11-3.44 4.7-6.42 12.9-2.57 7.07-7.5 12.99-14.72 18.78-2.91 2.33-12.21 8.8-13.52 9.9-3.22 2.68-3.56 4.17-.97 5.72l2.26 1.4 1.99 1.28c1.47.93 2.48 1.5 3.47 1.91 4.9 2.07 9.96.07 22.72-9.56 5.02-3.79 11.15-7 19.1-10.28 3.76-1.55 17.3-6.6 20-7.72 9.5-3.97 13.14-7.2 11.73-11.44-.9-2.71-2.25-3.8-4.3-3.79-1.6 0-2.15.17-7.36 2.05-8.17 2.94-13.34 3.14-19.16-1.01z'/%3E%3C/svg%3E\\")}</style>\\r\\n\\r\\n<SEOHead\\r\\n\\ttitle=\\"Contact | St\xE9phanie Delon\\"\\r\\n\\tdescription=\\"Trouvons ensemble une solution adapt\xE9e \xE0 vos besoins ! | St\xE9phanie Delon - d\xE9veloppeuse web et graphiste\\"\\r\\n\\timage=\\"\\"\\r\\n\\talt=\\"\\" />\\r\\n\\r\\n<section class=\\"bg-header pb-8\\">    \\r\\n    <div class=\\"container px-4 mx-auto\\">\\r\\n      <div class=\\"max-w-4xl mx-auto text-center pt-20 mb-24\\">\\r\\n        <span class=\\"text-gray-500 uppercase font-semibold tracking-wide\\">Accompagnement num\xE9rique</span>\\r\\n        <h1 class=\\"mb-8 mt-2 text-5xl text-white font-black font-heading\\">Optez pour une visibilit\xE9 num\xE9rique sur-mesure et performante</h1>\\r\\n      </div>\\r\\n      <div class=\\"flex flex-wrap justify-center\\">\\r\\n        <div class=\\"w-full sm:w-1/2 lg:w-1/3 flex px-4 mb-8\\">\\r\\n          <div class=\\"w-2/3 mb-4\\">\\r\\n            <h2 class=\\"mb-2 text-2xl text-gray-800 font-bold font-heading\\">Identit\xE9 num\xE9rique</h2>\\r\\n            <p class=\\"text-lg text-gray-700 tracking-tight\\">Cr\xE9ation ou refonte de votre site internet, je vous proposerai la solution la plus adapt\xE9e \xE0 vos besoins.</p>\\r\\n          </div>\\r\\n        </div>\\r\\n        <div class=\\"w-full sm:w-1/2 lg:w-1/3 flex px-4 mb-8\\">\\r\\n          <div class=\\"w-2/3 mb-4\\">\\r\\n            <h2 class=\\"mb-2 text-2xl text-gray-800 font-bold font-heading\\">Flyers, brochures...</h2>\\r\\n            <p class=\\"text-lg text-gray-700 tracking-tight\\">En tant que graphiste, n'h\xE9sitez pas \xE0 me confier vos r\xE9alisations de flyers, cartes de visite et brochures !</p>\\r\\n          </div>\\r\\n        </div>\\r\\n        <div class=\\"w-full lg:w-1/3 flex px-4 mb-8\\">\\r\\n          <div class=\\"w-2/3 mb-4\\">\\r\\n            <h2 class=\\"mb-2 text-2xl text-gray-800 font-bold font-heading\\">Autonomie</h2>\\r\\n            <p class=\\"text-lg text-gray-700 tracking-tight\\">Apr\xE8s une formation gratuite et r\xE9alis\xE9e par mes soins, vous serez autonome pour la mise \xE0 jour de votre site.</p>\\r\\n          </div>\\r\\n        </div>\\r\\n      </div>\\r\\n    </div>\\r\\n</section>\\r\\n\\r\\n<section id=\\"formulaire\\" class=\\"py-20\\">\\r\\n    <div class=\\"container px-4 mx-auto\\">\\r\\n      <div class=\\"flex flex-wrap -mx-4\\">\\r\\n        <div class=\\"w-full lg:w-1/2 px-4 mb-8 lg:mb-0\\">\\r\\n          <div class=\\"max-w-lg\\">\\r\\n            <h2 class=\\"text-5xl font-black text-gray-800 max-w-2xl mx-auto\\">Trouvons ensemble une solution adapt\xE9e \xE0 vos attentes !</h2>\\r\\n            <div class=\\"pt-8 text-gray-600 leading-loose\\">\\r\\n              <h3 class=\\"text-lg font-bold\\">St\xE9phanie Delon</h3>\\r\\n              <p class=\\"font-semibold\\">D\xE9veloppeuse web & graphiste</p>\\r\\n              <p>1 Interridi - 29770 Goulien</p>\\r\\n              <p>Appelez-moi au <a class=\\"hover:font-bold\\" href=\\"tel:0627922658\\">06.27.92.26.58</a></p>\\r\\n            </div>\\r\\n          </div>\\r\\n        </div>\\r\\n        <div class=\\"w-full lg:w-1/2 px-4\\">\\r\\n          <form name=\\"contact\\" method=\\"POST\\" data-netlify=\\"true\\" action=\\"/merci\\">\\r\\n            <input type=\\"hidden\\" name=\\"form-name\\" value=\\"contact\\">\\r\\n            <label for=\\"name\\">\\r\\n                Nom\\r\\n                <input class=\\"w-full py-3 pl-3 mb-4 border rounded\\" type=\\"text\\" name=\\"nom\\" required aria-required=\\"true\\">\\r\\n            </label>\\r\\n            <label for=\\"email\\">\\r\\n                Email\\r\\n                <input class=\\"w-full py-3 pl-3 mb-4 border rounded\\" type=\\"email\\" name=\\"email\\" required aria-required=\\"true\\">\\r\\n            </label>\\r\\n            <label for=\\"message\\">\\r\\n                Message\\r\\n                <textarea class=\\"mb-4 w-full p-3 border rounded resize-none\\" id=\\"1\\" name=\\"message\\" cols=\\"30\\" rows=\\"10\\" placeholder=\\"Votre message...\\" required aria-required=\\"true\\"></textarea>\\r\\n            </label>\\r\\n            <button type=\\"submit\\" class=\\"w-full inline-block px-6 py-3 mr-4 text-gray-bg font-bold leading-loose bg-bleu-dark rounded transition duration-200\\">Envoyer</button>\\r\\n          </form>\\r\\n        </div>\\r\\n      </div>\\r\\n    </div>\\r\\n</section>"],"names":[],"mappings":"AAQO,wBAAU,CAAC,iBAAiB,OAAO,CAAC,iBAAiB,IAAI,m8yFAAm8yF,CAAC,CAAC"}`
};
var prerender = true;
var Contact = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `${validate_component(SEOHead, "SEOHead").$$render($$result, {
    title: "Contact | St\xE9phanie Delon",
    description: "Trouvons ensemble une solution adapt\xE9e \xE0 vos besoins ! | St\xE9phanie Delon - d\xE9veloppeuse web et graphiste",
    image: "",
    alt: ""
  }, {}, {})}

<section class="${"bg-header pb-8 svelte-vw0wye"}"><div class="${"container px-4 mx-auto"}"><div class="${"max-w-4xl mx-auto text-center pt-20 mb-24"}"><span class="${"text-gray-500 uppercase font-semibold tracking-wide"}">Accompagnement num\xE9rique</span>
        <h1 class="${"mb-8 mt-2 text-5xl text-white font-black font-heading"}">Optez pour une visibilit\xE9 num\xE9rique sur-mesure et performante</h1></div>
      <div class="${"flex flex-wrap justify-center"}"><div class="${"w-full sm:w-1/2 lg:w-1/3 flex px-4 mb-8"}"><div class="${"w-2/3 mb-4"}"><h2 class="${"mb-2 text-2xl text-gray-800 font-bold font-heading"}">Identit\xE9 num\xE9rique</h2>
            <p class="${"text-lg text-gray-700 tracking-tight"}">Cr\xE9ation ou refonte de votre site internet, je vous proposerai la solution la plus adapt\xE9e \xE0 vos besoins.</p></div></div>
        <div class="${"w-full sm:w-1/2 lg:w-1/3 flex px-4 mb-8"}"><div class="${"w-2/3 mb-4"}"><h2 class="${"mb-2 text-2xl text-gray-800 font-bold font-heading"}">Flyers, brochures...</h2>
            <p class="${"text-lg text-gray-700 tracking-tight"}">En tant que graphiste, n&#39;h\xE9sitez pas \xE0 me confier vos r\xE9alisations de flyers, cartes de visite et brochures !</p></div></div>
        <div class="${"w-full lg:w-1/3 flex px-4 mb-8"}"><div class="${"w-2/3 mb-4"}"><h2 class="${"mb-2 text-2xl text-gray-800 font-bold font-heading"}">Autonomie</h2>
            <p class="${"text-lg text-gray-700 tracking-tight"}">Apr\xE8s une formation gratuite et r\xE9alis\xE9e par mes soins, vous serez autonome pour la mise \xE0 jour de votre site.</p></div></div></div></div></section>

<section id="${"formulaire"}" class="${"py-20"}"><div class="${"container px-4 mx-auto"}"><div class="${"flex flex-wrap -mx-4"}"><div class="${"w-full lg:w-1/2 px-4 mb-8 lg:mb-0"}"><div class="${"max-w-lg"}"><h2 class="${"text-5xl font-black text-gray-800 max-w-2xl mx-auto"}">Trouvons ensemble une solution adapt\xE9e \xE0 vos attentes !</h2>
            <div class="${"pt-8 text-gray-600 leading-loose"}"><h3 class="${"text-lg font-bold"}">St\xE9phanie Delon</h3>
              <p class="${"font-semibold"}">D\xE9veloppeuse web &amp; graphiste</p>
              <p>1 Interridi - 29770 Goulien</p>
              <p>Appelez-moi au <a class="${"hover:font-bold"}" href="${"tel:0627922658"}">06.27.92.26.58</a></p></div></div></div>
        <div class="${"w-full lg:w-1/2 px-4"}"><form name="${"contact"}" method="${"POST"}" data-netlify="${"true"}" action="${"/merci"}"><input type="${"hidden"}" name="${"form-name"}" value="${"contact"}">
            <label for="${"name"}">Nom
                <input class="${"w-full py-3 pl-3 mb-4 border rounded"}" type="${"text"}" name="${"nom"}" required aria-required="${"true"}"></label>
            <label for="${"email"}">Email
                <input class="${"w-full py-3 pl-3 mb-4 border rounded"}" type="${"email"}" name="${"email"}" required aria-required="${"true"}"></label>
            <label for="${"message"}">Message
                <textarea class="${"mb-4 w-full p-3 border rounded resize-none"}" id="${"1"}" name="${"message"}" cols="${"30"}" rows="${"10"}" placeholder="${"Votre message..."}" required aria-required="${"true"}"></textarea></label>
            <button type="${"submit"}" class="${"w-full inline-block px-6 py-3 mr-4 text-gray-bg font-bold leading-loose bg-bleu-dark rounded transition duration-200"}">Envoyer</button></form></div></div></div></section>`;
});
var contact = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Contact,
  prerender
});
var css = {
  code: "h1.svelte-n5sc12{font-size:1.25rem;font-weight:900;line-height:1.75rem;margin-bottom:1.25rem}p.svelte-n5sc12{max-width:32rem}",
  map: `{"version":3,"file":"merci.svelte","sources":["merci.svelte"],"sourcesContent":["<style>h1{font-size:1.25rem;font-weight:900;line-height:1.75rem;margin-bottom:1.25rem}p{max-width:32rem}</style>\\r\\n\\r\\n<section class=\\"container py-16 flex flex-wrap\\">\\r\\n    <div>\\r\\n        <h1 >Merci pour votre message !</h1>\\r\\n        <p>Votre message est bien arriv\xE9 dans ma bo\xEEte email. J'en prends connaissance au plus vite et je reviens vers vous dans les plus brefs d\xE9lais.</p>\\r\\n    </div>\\r\\n    <img class=\\"w-96 h-auto drop-shadow-xl\\" src=\\"/assets/vector-email.svg\\" alt=\\"illustration d'une enveloppe affichant une notification\\"/>\\r\\n</section>"],"names":[],"mappings":"AAAO,gBAAE,CAAC,UAAU,OAAO,CAAC,YAAY,GAAG,CAAC,YAAY,OAAO,CAAC,cAAc,OAAO,CAAC,eAAC,CAAC,UAAU,KAAK,CAAC"}`
};
var Merci = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<section class="${"container py-16 flex flex-wrap"}"><div><h1 class="${"svelte-n5sc12"}">Merci pour votre message !</h1>
        <p class="${"svelte-n5sc12"}">Votre message est bien arriv\xE9 dans ma bo\xEEte email. J&#39;en prends connaissance au plus vite et je reviens vers vous dans les plus brefs d\xE9lais.</p></div>
    <img class="${"w-96 h-auto drop-shadow-xl"}" src="${"/assets/vector-email.svg"}" alt="${"illustration d'une enveloppe affichant une notification"}"></section>`;
});
var merci = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Merci
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const type = headers["content-type"];
  const rawBody = type && isContentTypeTextual(type) ? isBase64Encoded ? Buffer.from(body, "base64").toString() : body : new TextEncoder("base64").encode(body);
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      headers: rendered.headers,
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
