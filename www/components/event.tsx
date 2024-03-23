import { Fragment } from "react";
import {
  inspectRequestBody,
  safeStringify,
  SyntaxHighlight,
} from "~/components/syntax-highlighter";
import type { BrowserEvent } from "~/lib/data";

const eventContent = (event: BrowserEvent): React.ReactNode => {
  const { type, data } = event;
  if (type === "log") {
    const { args, level } = data;
    return (
      <p className={level === "error" ? "text-red-500" : ""}>
        {args.map((arg, i) => (
          <Fragment key={i}>
            {i > 0 ? " " : null}
            {typeof arg === "string" ? arg : safeStringify(arg)}
          </Fragment>
        ))}
      </p>
    );
  } else if (type === "fetch" || type === "xhr") {
    const { url, method, status, body, response } = data;

    const { graphqlQuery, strippedBody } = inspectRequestBody(url, body);

    return (
      <>
        <p className="mb-1">
          <span className="text-gray-400">{method}</span>{" "}
          <span className="text-gray-500">{url}</span>{" "}
          <span className="text-gray-400">{status}</span>
        </p>

        {graphqlQuery ? (
          <div className="relative border-t border-gray-200">
            <span className="absolute top-0 right-0 text-xs bg-gray-100 text-gray-500">
              GraphQL Query
            </span>

            <SyntaxHighlight
              className="max-h-16"
              content={graphqlQuery}
              type="graphql"
            />
          </div>
        ) : null}
        {strippedBody != null ? (
          <div className="relative border-t border-gray-200">
            <span className="absolute top-0 right-0 text-xs bg-gray-100 text-gray-500">
              Request Body
            </span>

            <SyntaxHighlight
              className="max-h-16"
              content={strippedBody}
              type={
                strippedBody != null && typeof strippedBody === "object"
                  ? "json"
                  : null
              }
            />
          </div>
        ) : null}
        {response != null ? (
          <div className="relative border-t border-gray-200">
            <span className="absolute top-0 right-0 text-xs bg-gray-100 text-gray-500">
              Response Body
            </span>
            <SyntaxHighlight
              className="max-h-16"
              content={response}
              type={
                response != null && typeof response === "object" ? "json" : null
              }
            />
          </div>
        ) : null}
      </>
    );
  } else if (type === "global_error" || type === "unhandledrejection") {
    const { message } = data;
    return (
      <pre className="text-red-500 whitespace-pre-wrap max-h-16 overflow-y-auto">
        {message}
      </pre>
    );
  } else if (type === "client_navigate") {
    const { url, replace } = data;
    return (
      <p>
        {url}
        {replace ? " (replace)" : null}
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
