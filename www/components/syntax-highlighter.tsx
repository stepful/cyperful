import clsx from "clsx";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import graphql from "react-syntax-highlighter/dist/esm/languages/prism/graphql";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import { oneLight as highlightStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { removeLeadingSpace } from "~/lib/utils/string";

SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("graphql", graphql);

const QUERY_KEYS = [
  "query",
  // any others?
] as const;
export const inspectRequestBody = (url: string, body: unknown) => {
  if (
    url.match(/[\/\._-](graphql|gql)\b/) &&
    body != null &&
    typeof body === "object"
  ) {
    for (const queryKey of QUERY_KEYS) {
      const queryValue = queryKey in body ? body[queryKey] : null;
      if (
        typeof queryValue === "string" &&
        queryValue.match(/\bquery\b|\bmutation\b|\bsubscription\b/i)
      ) {
        const strippedBody = { ...body } as Record<string, unknown>;
        strippedBody[queryKey] = "(see above)";
        return {
          graphqlQuery: removeLeadingSpace(queryValue).trim(),
          strippedBody,
        };
      }
    }
  }
  return {
    strippedBody: body,
  };
};

export const safeStringify = (data: unknown): string => {
  if (typeof data === "string" || typeof data === "number")
    return data.toString();

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "<unserializable data>";
  }
};

export const SyntaxHighlight: React.FC<{
  content: unknown;
  type: "graphql" | "json" | null;
  className?: string;
}> = ({ content, type, className }) => {
  if (type == null) {
    return (
      <pre className={clsx("whitespace-pre-wrap overflow-auto", className)}>
        {safeStringify(content)}
      </pre>
    );
  }

  return (
    <SyntaxHighlighter
      language={type}
      customStyle={{ padding: 0, margin: 0, background: "none !important" }}
      style={highlightStyle}
      className={className}
    >
      {safeStringify(content)}
    </SyntaxHighlighter>
  );
};
