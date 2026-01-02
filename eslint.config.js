import js from '@eslint/js'
import globals from 'globals'
import nodePlugin from 'eslint-plugin-n'
import importPlugin from 'eslint-plugin-import'
import pluginPromise from 'eslint-plugin-promise'
import pluginSecurity from 'eslint-plugin-security'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import jestExtendedPlugin from 'eslint-plugin-jest-extended'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // 1. Ignorer les fichiers inutiles
  {
    ignores: ['dist', '.yarn', 'coverage', 'eslint.config.js', 'node_modules'],
  },

  // 2. Configuration pour tous les fichiers JS
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest', // Supporte import.meta et les nouveaux littéraux numériques
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2025, // On prend le futur pour être tranquille avec Node 24
      },
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },
    plugins: {
      n: nodePlugin,
      import: importPlugin,
      promise: pluginPromise,
      security: pluginSecurity,
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      // Intégration des recommandations de base
      ...js.configs.recommended.rules,
      ...nodePlugin.configs['flat/recommended'].rules,
      ...pluginPromise.configs['flat/recommended'].rules,
      ...pluginSecurity.configs.recommended.rules,

      // --- RÉGLAGES SPÉCIFIQUES POUR ESM ---
      // On désactive les règles "import" qui rament ou buggent en ESM natif
      'import/namespace': 'off',
      'import/no-unresolved': 'off', // Node 24 gère ça très bien lui-même
      'import/default': 'off',
      'import/no-named-as-default': 'off',

      // Ordre des imports (Utile pour la lisibilité)
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // --- SÉCURITÉ & QUALITÉ ---
      'security/detect-object-injection': 'off', // Trop de faux positifs
      'security/detect-non-literal-fs-filename': 'off', // Pour tes utils file-system

      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/filename-case': 'off',
    },
  },

  // 3. Configuration spécifique pour les tests
  {
    files: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    plugins: {
      'jest-extended': jestExtendedPlugin,
    },
    rules: {
      ...jestExtendedPlugin.configs['flat/all'].rules,
    },
  },

  // 4. Prettier (Désactive les règles de style conflictuelles)
  eslintConfigPrettier,
]
