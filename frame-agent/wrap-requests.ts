/* eslint-disable @typescript-eslint/unbound-method */
import { notify } from "./notify";

function tryParseJson(val: unknown) {
  try {
    if (typeof val === "string") return JSON.parse(val);
  } catch (_err) {
    return val;
  }
}

function formDataToObject(formData: FormData) {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      obj[key] = `[[ Blob: ${value.size} bytes ]]`;
    } else obj[key] = value.toString();
  }
  return obj;
}

// capture `fetch` network requests
export const wrapFetch = () => {
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    const [url, options = {}] =
      typeof args[0] === "string" || args[0] instanceof URL
        ? [args[0], args[1]]
        : [args[0].url, args[0]];

    const method = options.method?.toUpperCase() ?? "GET";
    const body = options.body;
    const reqHeaders = new Headers(options.headers);
    const bodyType = reqHeaders.get("content-type") || undefined;
    const parsedBody =
      body instanceof FormData
        ? formDataToObject(body)
        : bodyType?.match(/[+/]json\b/)
          ? tryParseJson(body)
          : body;

    const start = notify("fetch", {
      method,
      url: url.toString(),
      body: parsedBody,
      bodyType,
    });

    const promise = originalFetch(...args);
    promise
      .then(async (response) => {
        const ct = response.headers.get("content-type");
        const resBody = ct?.match(/[+/]json\b/)
          ? await response.clone().json()
          : ct?.match(/\btext[+/]/)
            ? await response.clone().text()
            : `[[ Unhandled content-type: ${ct || "<empty>"} ]]`;

        if (start)
          notify(
            "fetch:finished",
            {
              status: response.status,
              responseType: ct || undefined,
              response: resBody,
            },
            start,
          );
      })
      .catch((err) => {
        if (start)
          notify(
            "fetch:finished",
            {
              status: 0,
              response: `[caught error] ${(err as Error).message || "Unknown error"}`,
            },
            start,
          );
      });
    return promise;
  };
};

// capture XHR network requests
export const wrapXHR = () => {
  const originalOpen = window.XMLHttpRequest.prototype.open;
  const originalSend = window.XMLHttpRequest.prototype.send;
  const originalSetRequestHeader =
    window.XMLHttpRequest.prototype.setRequestHeader;

  type XHRMeta = {
    method: string;
    url: string;
    headers: Record<string, string>;
  };

  // Override open
  window.XMLHttpRequest.prototype.open = function wrappedOpen(
    ...args: [
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ]
  ) {
    (this as unknown as { _requestMeta?: XHRMeta })._requestMeta = {
      method: args[0],
      url: args[1].toString(),
      headers: {},
    };

    // @ts-expect-error arg types
    return originalOpen.apply(this, args);
  };

  window.XMLHttpRequest.prototype.setRequestHeader =
    function wrappedSetRequestHeader(name, value) {
      const meta = (this as unknown as { _requestMeta?: XHRMeta })._requestMeta;
      if (meta) meta.headers[name.toLowerCase()] = value;

      return originalSetRequestHeader.apply(this, [name, value]);
    };

  // Override send
  window.XMLHttpRequest.prototype.send = function wrappedSend(body) {
    const meta = (this as unknown as { _requestMeta?: XHRMeta })._requestMeta;
    const method = meta?.method;
    const url = meta?.url;
    const bodyType = meta?.headers["content-type"];

    const parsedBody =
      body instanceof FormData
        ? formDataToObject(body)
        : bodyType?.match(/[+/]json\b/)
          ? tryParseJson(body)
          : body;

    const start = notify("xhr", {
      method,
      url,
      body: parsedBody,
      bodyType,
    });

    this.addEventListener("load", () => {
      if (start)
        notify(
          "xhr:finished",
          {
            status: this.status,
            response: this.response,
            responseType: this.getResponseHeader("content-type") || undefined,
          },
          start,
        );
    });

    this.addEventListener("error", () => {
      if (start)
        notify(
          "xhr:finished",
          {
            status: 0,
            response: `[caught error] ${this.status ?? 0} - ${this.statusText || "Unknown error"}`,
          },
          start,
        );
    });

    return originalSend.apply(this, [body]);
  };
};
