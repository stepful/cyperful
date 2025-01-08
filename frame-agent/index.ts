/* eslint-disable @typescript-eslint/unbound-method */

import { notify } from "./notify";
import { wrapFetch, wrapXHR } from "./wrap-requests";

declare global {
  let __CYPERFUL_CONFIG__: {
    CYPERFUL_ORIGIN: string;
  };

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __cyperfulAgentInitialized?: boolean;
  }
}

(() => {
  if (window.__cyperfulAgentInitialized) return;
  window.__cyperfulAgentInitialized = true;

  const prevLog = console.log;
  const log = (...args: unknown[]) => prevLog("[Cyperful Agent]", ...args);

  log("Loading...");

  const { CYPERFUL_ORIGIN } = __CYPERFUL_CONFIG__ || {};

  if (!CYPERFUL_ORIGIN) {
    log("No __CYPERFUL_CONFIG__ found");
    return;
  }

  if (window.location.origin === CYPERFUL_ORIGIN) {
    log("Ignoring parent frame (Why are we here?)");
    return;
  }

  wrapFetch();
  wrapXHR();

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
