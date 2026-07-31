const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "uploads/**",
      "generated/**",
    ],
  },

  {
    files: ["src/**/*.js", "prisma/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      ...js.configs.recommended.rules,

      "no-console": "off",

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",

          // catch (err) wali unnecessary warnings hata dega
          caughtErrors: "none",

          // Sensitive fields ko destructuring se remove karne par warning nahi dega
          ignoreRestSiblings: true,
        },
      ],

      "no-undef": "error",
      "eqeqeq": ["error", "always"],
      "prefer-const": "warn",
    },
  },
];