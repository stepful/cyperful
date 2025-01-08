/* eslint-disable @typescript-eslint/unbound-method */
import { notify } from "./notify";

function tryParseJson(val: unknown) {
  try {
    if (typeof val === "string") return JSON.parse(val);
  } catch {
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
    let parsedBody;
    try {
      parsedBody =
        body instanceof FormData
          ? formDataToObject(body)
          : bodyType?.match(/[+/]json\b/)
            ? tryParseJson(body)
            : body;
    } catch {}

    const start = notify("fetch", {
      method,
      url: url.toString(),
      body: parsedBody,
      bodyType,
    });

    const promise = originalFetch(...args);
    promise
      .then(async (initResponse) => {
        const ct = initResponse.headers.get("content-type") || undefined;

        let resBody;
        try {
          const response = initResponse.clone();
          // form data:
          if (ct?.match(/\bform-data\b/))
            resBody = formDataToObject(await response.formData());
          if (ct?.match(/[+/]json\b/))
            resBody = (await response.json()) as Record<string, unknown>;
          else if (ct?.match(/\btext[+/]/)) resBody = await response.text();
          else resBody = `[[ Unhandled content-type: ${ct || "<empty>"} ]]`;
        } catch {}

        if (start)
          notify(
            "fetch:finished",
            {
              status: initResponse.status,
              responseType: ct,
              response: resBody,
            },
            start,
          );
      })
      .catch((err) => {
        if (!start) return;
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

    const bodyType = meta?.headers["content-type"];

    let parsedBody;
    try {
      parsedBody =
        body instanceof FormData
          ? formDataToObject(body)
          : bodyType?.match(/[+/]json\b/)
            ? tryParseJson(body)
            : body;
    } catch {}

    const start = meta
      ? notify("xhr", {
          method: meta.method,
          url: meta.url,
          body: parsedBody,
          bodyType,
        })
      : null;

    this.addEventListener("load", async () => {
      if (!start) return;

      const ct = this.getResponseHeader("content-type") || undefined;

      let resBody;
      try {
        resBody = ct?.match(/[+/]json\b/)
          ? await this.response.clone().json()
          : ct?.match(/\btext[+/]/)
            ? await this.response.clone().text()
            : `[[ Unhandled content-type: ${ct || "<empty>"} ]]`;
      } catch {}

      notify(
        "xhr:finished",
        {
          status: this.status,
          response: resBody,
          responseType: ct,
        },
        start,
      );
    });

    this.addEventListener("error", () => {
      if (!start) return;
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
