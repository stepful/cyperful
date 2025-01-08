import type { EventPayloads } from "~/lib/data";

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

let idCounter = 0;

export const notify = <
  Type extends keyof EventPayloads,
  StartEvent extends WatcherEvent<true, Type> | null,
>(
  type: StartEvent extends null ? Type : `${Type}:finished`,
  data: StartEvent extends null
    ? EventPayloads[Type]
    : Partial<EventPayloads[Type]>,
  startEvent: StartEvent = null as StartEvent,
): WatcherEvent<boolean, Type> | null => {
  const { CYPERFUL_ORIGIN } = __CYPERFUL_CONFIG__;

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
