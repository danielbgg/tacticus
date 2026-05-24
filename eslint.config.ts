import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/", "build/", "coverage/", "node_modules/", "src-tauri/"],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "import/no-cycle": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  prettier,
);
