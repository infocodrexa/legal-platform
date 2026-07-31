import globals from "globals";

export default [
  { ignores: ["node_modules/**", "coverage/**"] },
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "commonjs", globals: { ...globals.node } },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-unreachable": "error",
      "no-constant-condition": ["error", { "checkLoops": false }]
    }
  }
];
