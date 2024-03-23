import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Easily combine and override tailwind classes */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const request = async <T>(
  url: string,
  method = 'GET',
  data?: Record<string, unknown>,
) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data != null ? JSON.stringify(data) : undefined,
  });
  const json = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : undefined;
  if (!res.ok)
    throw new Error(
      `Request error: ${method} ${url} - ${res.status} ${res.statusText}`,
    );
  return json as T;
};

export const useElementSize = () => {
  const ref = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(() => {
      if (!ref.current) return;
      setSize({
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight,
      });
    });

    observer.observe(ref.current);

    setSize({
      width: ref.current.offsetWidth,
      height: ref.current.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  return [size, ref] as const;
};

const websocketConnections = new Map<string, WebSocket>();

export const useWebsocketData = <Data extends { event: string }>(
  eventType: Data['event'],
  url: string,
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
        websocketUrl.protocol = 'ws:';
        websocketConnection = new WebSocket(websocketUrl.href);
        websocketConnections.set(url, websocketConnection);
      } catch (err) {
        update(err as Error);
        return;
      }

      // try to tell the server to close the connection when the page is closed
      window.addEventListener('beforeunload', () => {
        websocketConnection?.close();
      });
    }

    websocketConnection.addEventListener('message', (evt) => {
      const data = evt.data ? (JSON.parse(evt.data) as Data) : null;
      if (!data || data.event !== eventType) return;
      update(null, data);
    });

    websocketConnection.addEventListener('error', () => {
      update(new Error(`WebSocket error. See console for details.`));
    });

    websocketConnection.addEventListener('close', () => {
      update(new Error('WebSocket closed. Try restarting the server.'));
    });

    return () => {
      if (!keepOpen) {
        websocketConnection?.close();
        websocketConnections.delete(url);
      }
    };
  }, [url, eventType, update]);

  return res;
};

export const EMPTY_ARRAY: never[] = [];
