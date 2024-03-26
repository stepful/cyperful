import { useEffect, useState } from "react";
import { request } from "~/lib/request";
import { EMPTY_ARRAY } from "~/lib/utils";
import { createProvider } from "~/lib/utils/providers";
import { useWebsocketData } from "~/lib/utils/websocket";

const STATUS_MAP = {
  pending: { colorClass: "text-gray-500" },
  paused: { colorClass: "text-yellow-500" },
  running: { colorClass: "text-blue-500" },
  passed: { colorClass: "text-green-500" },
  failed: { colorClass: "text-red-500" },
};

type StepStatus = keyof typeof STATUS_MAP;
type TestStatus = StepStatus; // same

export type Step = {
  index: number;
  method: string;
  line: number;
  column: number;
  block_depth: number;
  as_string: string;
  status: StepStatus;
  start_at: number | null; // ms
  end_at: number | null; // ms
  paused_at: number | null; // ms
  permalink: string | null;
};

type StepsData = {
  event: "steps_updated";
  steps: Step[];
  current_step_index: number | null;
  pause_at_step: number | true | null;
  test_suite: string;
  test_name: string;
  test_status: TestStatus;
  test_error: string | null;
  test_duration_ms: number | null;
};

type Commands = {
  stop: void;
  start: {
    pause_at_step?: number;
  } | void;
  reset: void;
  exit: void;
};

export const sendCommand = async <Command extends keyof Commands>(
  command: Command,
  params: Commands[Command] = {} as Commands[Command],
) => {
  await request("/api/steps/command", "POST", { command, params });
};

export const [StepsDataProvider, useStepsData] = createProvider(() => {
  const { data, error } = useWebsocketData<StepsData>(
    "/api/websocket",
    "steps_updated",
  );

  if (error) throw error;

  if (!data) return null; // loading

  if (!data.steps.length) throw new Error("No steps!");

  return data;
});

type FetchPayload = {
  method: string;
  url: string;
  status?: number;
  body?: unknown;
  bodyType?: string;
  response?: unknown;
  responseType?: string;
};

export type EventPayloads = {
  log: {
    args: unknown[];
    level: "log" | "error" | "warn" | "info" | "dir" | "debug";
  };
  fetch: FetchPayload;
  xhr: FetchPayload;
  client_navigate: {
    url: string;
    replace: boolean;
  };
  global_error: {
    message: string;
  };
  unhandledrejection: {
    message: string;
  };
};

type ToDiscriminatedUnion<
  Map,
  TypeField extends string,
  DataField extends string,
> = {
  [K in keyof Map]: { [P in TypeField]: K } & { [P in DataField]: Map[K] };
}[keyof Map];

export type BrowserEvent = {
  id: string;
  timestamp: number;
  duration?: number;
} & ToDiscriminatedUnion<EventPayloads, "type", "data">;

type MessagePayload = Omit<BrowserEvent, "duration"> & {
  start_id?: string;
};

const isMessagePayload = (data: any): data is MessagePayload =>
  !!data?.type &&
  typeof data.type === "string" &&
  typeof data.timestamp === "number";

/**
 * Listen to browser events from the iframe.
 * This is used to show console-logs, network requests, errors, etc.
 */
export const useBrowserEvents = (enabled = true) => {
  const [events, setEvents] = useState<BrowserEvent[]>(EMPTY_ARRAY);

  useEffect(() => {
    if (!enabled) {
      setEvents(EMPTY_ARRAY);
      return;
    }

    const onMessage = (evt: MessageEvent) => {
      const payload = evt.data;
      if (!isMessagePayload(payload)) return;

      setEvents((prev) => {
        // update "start event" if specified
        if (payload.start_id != null) {
          const startEvent = prev.find((e) => e.id === payload.start_id);
          if (startEvent) {
            startEvent.data = Object.assign(
              startEvent.data || {},
              payload.data || {},
            );
            startEvent.duration = payload.timestamp - startEvent.timestamp;
          }
          return [...prev];
        }

        return [...prev, payload as BrowserEvent];
      });
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [enabled]);

  return events;
};
