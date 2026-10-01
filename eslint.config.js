import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist/**", "data/**"] },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  // Formatting is Prettier's job: turn off the stylistic rules that would conflict
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      // Optional props are simply undefined when not passed
      "vue/require-default-prop": "off",
      "no-unused-vars": ["error", { caughtErrors: "none" }],
    },
  },
];
