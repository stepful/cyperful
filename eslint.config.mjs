import BaseConfig from "@wyattades/eslint-config";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["**/node_modules/", "**/public/", "**/tmp/", ".notes/"],
  },
  ...BaseConfig,
  {
    rules: {
      "no-console": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
    },
  },
  {
    files: ["*.{mjs,cjs,js}"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
];
