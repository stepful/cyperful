/* eslint-disable @typescript-eslint/unbound-method */

import type { EventPayloads } from "~/lib/data";

declare global {
  let __CYPERFUL_CONFIG__: {
    CYPERFUL_ORIGIN: string;
  };

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __cyperfulAgentInitialized?: boolean;
  }
}

type WatcherEvent<
  Finished extends boolean = false,
  Type extends keyof EventPayloads = keyof EventPayloads,
> = {
  type: Finished extends true ? `${Type}:finished` : Type;
  data: Finished extends true
    ? Partial<EventPayloads[Type]>
    : EventPayloads[Type];
  id: string;
  timestamp: number;
  start_id: Finished extends true ? string : undefined;
};

(() => {
  if (window.__cyperfulAgentInitialized) return;
  window.__cyperfulAgentInitialized = true;

  const prevLog = console.log;
  const log = (...args: unknown[]) => prevLog("[Cyperful Agent]", ...args);

  log("Loading...");

  const { CYPERFUL_ORIGIN } = __CYPERFUL_CONFIG__;

  if (window.location.origin === CYPERFUL_ORIGIN) {
    log("Ignoring parent frame (Why are we here?)");
    return;
  }

  let idCounter = 0;
  const notify = <
    Type extends keyof EventPayloads,
    StartEvent extends WatcherEvent<true, Type> | null,
  >(
    type: StartEvent extends null ? Type : `${Type}:finished`,
    data: StartEvent extends null
      ? EventPayloads[Type]
      : Partial<EventPayloads[Type]>,
    startEvent: StartEvent = null as StartEvent,
  ): WatcherEvent<boolean, Type> | null => {
    let evt: WatcherEvent<boolean, Type> | null = null;
    try {
      const timestamp = Date.now();
      const id = `${timestamp}-${idCounter++}`;

      if ("url" in data && data.url != null) {
        try {
          const url = new URL(data.url, window.location.origin);

          // don't show our own requests
          if (url.origin === CYPERFUL_ORIGIN) return null;

          if (url.origin === window.location.origin) {
            data.url = url.pathname + url.search + url.hash;
          }
        } catch (_err) {
          // e.g. invalid URL
        }
      }

      evt = {
        type,
        data,
        id,
        timestamp,
        start_id: startEvent ? startEvent.id : undefined,
      };

      window.parent.postMessage(evt, CYPERFUL_ORIGIN);
    } catch (_err) {
      // e.g. blocked by CORS
      // e.g. invalid payload
    }
    return evt;
  };

  // capture console logs
  for (const level of [
    "log",
    "error",
    "warn",
    "info",
    "dir",
    "debug",
  ] as const) {
    const original = console[level];
    if (!original) continue;
    console[level] = (...args) => {
      original.apply(console, args);
      notify("log", { level, args });
    };
  }

  // capture global errors
  window.addEventListener("error", (event) => {
    notify("global_error", { message: event.error.toString() });
  });
  window.addEventListener("unhandledrejection", (event) => {
    notify("unhandledrejection", { message: event.reason.toString() });
  });

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

  // capture XHR network requests
  const OriginalXHR = window.XMLHttpRequest;
  function XHR() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    xhr.open = ((...args) => {
      const [method, url, _body]: [string, string, string] = args as any;
      const start = notify("xhr", {
        method,
        url,
        // body,
      });
      xhr.addEventListener("load", () => {
        if (start)
          notify(
            "xhr:finished",
            { status: xhr.status, response: xhr.response },
            start,
          );
      });
      // @ts-expect-error ignore
      return originalOpen.apply(this, args);
    }) as typeof xhr.open;
    return xhr;
  }
  // @ts-expect-error ignore
  window.XMLHttpRequest = XHR;

  // capture fetch network requests
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    const [url, options = {}] =
      typeof args[0] === "string" || args[0] instanceof URL
        ? [args[0], args[1]]
        : [args[0].url, args[0]];

    const method = options.method ?? "GET";
    const body = options.body;
    const headers = (options.headers || {}) as Record<
      string,
      string | undefined
    >;
    const bodyType =
      headers["content-type"] || headers["Content-Type"] || undefined;
    const parsedBody =
      body instanceof FormData
        ? formDataToObject(body)
        : bodyType?.includes("application/json")
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
        const ct = response.headers.get("content-type") || "";
        const resBody = ct.includes("application/json")
          ? await response.clone().json()
          : ct.includes("text/")
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
      .catch(() => {});
    return promise;
  };

  // capture client-side location changes
  const originalPushState = history.pushState;
  history.pushState = (...args) => {
    originalPushState.apply(history, args);
    notify("client_navigate", {
      url: location.href,
      replace: false,
    });
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = (...args) => {
    originalReplaceState.apply(history, args);
    notify("client_navigate", {
      url: location.href,
      replace: true,
    });
  };

  log("Loaded.");
})();

export {};
