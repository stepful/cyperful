import { Fragment } from 'react';

import type { BrowserEvent } from 'lib/data';

// TODO: render JSON and GraphQL requests/responses with syntax highlighting
const safeStringify = (data: unknown) => {
  if (typeof data === 'string' || typeof data === 'number') return data;

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return '<unserializable data>';
  }
};

const eventContent = (event: BrowserEvent): React.ReactNode => {
  const { type, data } = event;
  if (type === 'log') {
    const { args, level } = data;
    return (
      <p className={level === 'error' ? 'text-red-500' : ''}>
        {args.map((arg, i) => (
          <Fragment key={i}>
            {i > 0 ? ' ' : null}
            {typeof arg === 'string' ? arg : safeStringify(arg)}
          </Fragment>
        ))}
      </p>
    );
  } else if (type === 'fetch' || type === 'xhr') {
    const { url, method, status, body, response } = data;
    return (
      <>
        <p className="mb-1">
          {method} {url} {status}
        </p>

        {body != null ? (
          <div className="relative border-t border-gray-200">
            <span className="absolute top-0 right-0 text-xs bg-gray-100 text-gray-500">
              Request Body
            </span>

            <pre className="whitespace-pre-wrap max-h-16 overflow-y-auto">
              {safeStringify(body)}
            </pre>
          </div>
        ) : null}
        {response != null ? (
          <div className="relative border-t border-gray-200">
            <span className="absolute top-0 right-0 text-xs bg-gray-100 text-gray-500">
              Response Body
            </span>
            <pre className="whitespace-pre-wrap max-h-16 overflow-y-auto">
              {safeStringify(response)}
            </pre>
          </div>
        ) : null}
      </>
    );
  } else if (type === 'global_error' || type === 'unhandledrejection') {
    const { message } = data;
    return (
      <pre className="text-red-500 whitespace-pre-wrap max-h-16 overflow-y-auto">
        {message}
      </pre>
    );
  } else if (type === 'client_navigate') {
    const { url, replace } = data;
    return (
      <p>
        {url}
        {replace ? ' (replace)' : null}
      </p>
    );
  }
  return null;
};

export const EventRow: React.FC<{ event: BrowserEvent }> = ({ event: evt }) => {
  return (
    <li key={evt.id}>
      <p className="p-2 text-xs text-gray-500">
        <strong>{evt.type}</strong>
        {evt.duration != null ? <> ({evt.duration}ms)</> : null}
      </p>
      <div className="font-mono text-xs text-gray-500 p-2 pt-0 border-b border-gray-200">
        {eventContent(evt)}
      </div>
    </li>
  );
};
