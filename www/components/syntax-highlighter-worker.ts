import { getHighlighterCore } from "shiki/core";
import getWasm from "shiki/wasm";

// import theme from "shiki/themes/github-light.mjs";
import theme from "shiki/themes/vesper.mjs";

import graphql from "shiki/langs/graphql.mjs";
import json from "shiki/langs/json.mjs";

// override the background color
theme.colors!["editor.background"] = "transparent";

const highlighter = getHighlighterCore({
  themes: [theme],
  langs: [graphql, json],
  loadWasm: getWasm,
});

export type TaskRequest = {
  taskId: number;
  code: string;
  lang: string;
};
export type TaskResponse = {
  taskId: number;
  html: string;
};

self.addEventListener("message", async (event: MessageEvent<TaskRequest>) => {
  const { taskId, code, lang } = event.data;

  const html = (await highlighter).codeToHtml(code, {
    lang,
    theme: "vesper",
  });

  self.postMessage({ taskId, html } as TaskResponse);
});
