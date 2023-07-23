(() => {
  const log = console.log;

  log('Cyperful watcher loading...');

  const CYPERFUL_ORIGIN = 'http://localhost:3004';

  let idCounter = 0;
  const notify = (type, data, startEvent = null) => {
    let evt;
    try {
      const timestamp = Date.now();
      const id = `${timestamp}-${idCounter++}`;

      if (data.url != null) {
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
    return evt || {};
  };

  // capture console logs
  for (const level of ['log', 'error', 'warn', 'info', 'dir', 'debug']) {
    const original = console[level];
    if (!original) continue;
    console[level] = (...args) => {
      original.apply(console, args);
      notify('log', { level, args });
    };
  }

  // capture global errors
  window.addEventListener('error', (event) => {
    notify('global_error', { message: event.error.toString() });
  });
  window.addEventListener('unhandledrejection', (event) => {
    notify('unhandledrejection', { message: event.reason.toString() });
  });

  // capture XHR network requests
  const OriginalXHR = window.XMLHttpRequest;
  function XHR() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    xhr.open = (...args) => {
      const start = notify('xhr', {
        method: args[0],
        url: args[1],
        // body: args[2],
      });
      xhr.addEventListener('load', () => {
        if (start)
          notify(
            'xhr:finished',
            { status: xhr.status, response: xhr.response },
            start,
          );
      });
      return originalOpen.apply(this, args);
    };
    return xhr;
  }
  window.XMLHttpRequest = XHR;

  // capture fetch network requests
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    const [url, options] =
      typeof args[0] === 'string' ? args : [args[0].url, args[0]];
    const method = options?.method ?? 'GET';
    const body = options?.body;

    const start = notify('fetch', {
      method,
      url,
      body,
      bodyType:
        options.headers?.['content-type'] ||
        options.headers?.['Content-Type'] ||
        null,
    });

    const promise = originalFetch(...args);
    promise
      .then(async (response) => {
        const ct = response.headers.get('content-type') || '';
        const resBody = ct.includes('application/json')
          ? await response.clone().json()
          : ct.includes('text/')
          ? await response.clone().text()
          : `[[ Unhandled content-type: ${ct || '<empty>'} ]]`;

        if (start)
          notify(
            'fetch:finished',
            {
              status: response.status,
              responseType: ct || null,
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
    notify('client_navigate', {
      url: location.href,
      replace: false,
    });
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = (...args) => {
    originalReplaceState.apply(history, args);
    notify('client_navigate', {
      url: location.href,
      replace: true,
    });
  };

  log('Cyperful watcher loaded.');
})();
