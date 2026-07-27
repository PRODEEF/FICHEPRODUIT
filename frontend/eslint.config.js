import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,

      // ✅ Remplace tseslint.configs.recommended
      // strictTypeChecked = recommended + règles type-aware + règles strictes supplémentaires
      // Détecte : no-floating-promises, no-unsafe-assignment, no-unsafe-call, no-misused-promises…
      ...tseslint.configs.strictTypeChecked,

      // Règles stylistiques cohérentes (préfère `type` imports, consistent-type-assertions…)
      ...tseslint.configs.stylisticTypeChecked,

      // Règles React (hooks, jsx, composants)
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,

      // ✅ Plugins React recommandés pour TypeScript (détecte hooks mal utilisés, key manquantes…)
      reactX.configs['recommended-typescript'],

      // ✅ Détecte les mauvaises utilisations du DOM React (dangerouslySetInnerHTML, etc.)
      reactDom.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      // ✅ Requis pour que typescript-eslint accède aux informations de type
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Autorise les void expressions pour les handlers async (ex: onSubmit={(e) => void handleSubmit(e)})
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreVoidOperator: true }],

      // strictTypeChecked interdit les template literals sur des objets non-string.
      // Cette règle est souvent trop verbeuse sur les messages d'erreur — ajuster si besoin.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],

      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-meaningless-void-operator': 'off',
    },
  },
  // Fichier de définition de routes (lazy + JSX) — pas un module de composants UI
  {
    files: ['**/app/router.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // BillingContext exporte le Provider + le hook — pattern courant pour les contextes
  {
    files: ['**/BillingContext.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, allowExportNames: ['useBillingContext'] },
      ],
    },
  },
]);
