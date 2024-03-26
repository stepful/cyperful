import { useCallback, useEffect, useRef, useState } from "react";

const websocketConnections = new Map<string, WebSocket>();

export const useWebsocketData = <Data extends { event: string }>(
  url: string,
  eventType: Data["event"],
  onError?: (err: Error) => void,
  /** Don't close the connection on unmount */
  keepOpen = true,
) => {
  const [res, setRes] = useState<{ data?: Data; error?: Error }>({});

  const latestOnError = useRef(onError);
  latestOnError.current = onError;

  const update = useCallback((error: Error | null, data?: Data) => {
    setRes({ error: error || undefined, data });
    if (error) latestOnError.current?.(error);
  }, []);

  useEffect(() => {
    let websocketConnection = websocketConnections.get(url);
    if (!websocketConnection) {
      try {
        const websocketUrl = new URL(url, window.location.href);
        websocketUrl.protocol = "ws:";
        websocketConnection = new WebSocket(websocketUrl.href);
        websocketConnections.set(url, websocketConnection);
      } catch (err) {
        update(err as Error);
        return;
      }

      // try to tell the server to close the connection when the page is closed
      window.addEventListener("beforeunload", () => {
        websocketConnection?.close();
      });
    }

    websocketConnection.addEventListener("message", (evt) => {
      const data = evt.data ? (JSON.parse(evt.data) as Data) : null;
      if (!data || data.event !== eventType) return;
      update(null, data);
    });

    websocketConnection.addEventListener("error", () => {
      update(new Error(`WebSocket error. See console for details.`));
    });

    websocketConnection.addEventListener("close", () => {
      update(new Error("WebSocket closed. Try restarting the server."));
    });

    return () => {
      if (!keepOpen) {
        websocketConnection?.close();
        websocketConnections.delete(url);
      }
    };
  }, [url, eventType, update, keepOpen]);

  return res;
};
