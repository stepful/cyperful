import clsx from "clsx";
import { Fragment, memo } from "react";
import {
  SyntaxHighlight,
  inspectRequestBody,
  safeStringify,
  type SyntaxHighlightType,
} from "~/components/syntax-highlighter";
import type { BrowserEvent } from "~/lib/data";

const EventDataPreview: React.FC<{
  label: React.ReactNode;
  content: unknown;
  type: SyntaxHighlightType;
}> = ({ label, content, type }) => {
  return (
    <div className="relative border-t border-gray-700">
      <span className="absolute right-0 top-0 bg-white/10 px-1 text-xs text-gray-500">
        {label}
      </span>

      <SyntaxHighlight
        className="h-16 resize-y"
        content={content}
        type={type}
      />
    </div>
  );
};

const eventContent = (event: BrowserEvent): React.ReactNode => {
  const { type, data } = event;
  if (type === "log") {
    const { args, level } = data;
    return (
      <pre
        className={clsx(
          "max-h-16 overflow-y-auto break-words",
          level === "error" && "text-red-500",
        )}
      >
        {args.map((arg, i) => (
          <Fragment key={i}>
            {i > 0 ? " " : null}
            {typeof arg === "string" ? arg : safeStringify(arg)}
          </Fragment>
        ))}
      </pre>
    );
  } else if (type === "fetch" || type === "xhr") {
    const { url, method, status, body, response } = data;

    const { graphqlQuery, strippedBody } = inspectRequestBody(url, body);

    return (
      <>
        <p className="mb-1 break-words">
          <span className="text-gray-400">{method}</span>{" "}
          <span className="text-gray-500">{url}</span>{" "}
          <span className="text-gray-400">{status}</span>
        </p>

        {graphqlQuery ? (
          <EventDataPreview
            label="GraphQL Query"
            content={graphqlQuery}
            type="graphql"
          />
        ) : null}
        {strippedBody != null ? (
          <EventDataPreview
            label="Request Body"
            content={strippedBody}
            type={
              strippedBody != null && typeof strippedBody === "object"
                ? "json"
                : null
            }
          />
        ) : null}
        {response != null ? (
          <EventDataPreview
            label="Response Body"
            content={response}
            type={
              response != null && typeof response === "object" ? "json" : null
            }
          />
        ) : null}
      </>
    );
  } else if (type === "global_error" || type === "unhandledrejection") {
    const { message } = data;
    return (
      <pre className="max-h-16 overflow-y-auto whitespace-pre-wrap break-words text-red-500">
        {message}
      </pre>
    );
  } else if (type === "client_navigate") {
    const { url, replace } = data;
    return (
      <pre className="max-h-16 overflow-y-auto break-words">
        {url}
        {replace ? " (replace)" : null}
      </pre>
    );
  }
  return null;
};

const EventRow_: React.FC<{ event: BrowserEvent }> = ({ event: evt }) => {
  return (
    <li key={evt.id}>
      <p className="p-2 text-xs text-gray-500">
        <strong>{evt.type}</strong>
        {evt.duration != null ? <> ({evt.duration}ms)</> : null}
      </p>
      <div className="p-2 pt-0 font-mono text-xs text-gray-500">
        {eventContent(evt)}
      </div>
    </li>
  );
};
export const EventRow = memo(EventRow_);
