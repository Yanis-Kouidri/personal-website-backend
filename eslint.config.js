import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import babelParser from '@babel/eslint-parser'
import nodePlugin from 'eslint-plugin-n'
import importPlugin from 'eslint-plugin-import'
import pluginPromise from 'eslint-plugin-promise'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginSecurity from 'eslint-plugin-security'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import jestExtendedPlugin from 'eslint-plugin-jest-extended'

export default defineConfig([
  globalIgnores(['dist', '.yarn', '.pnp.*', 'eslint.config.js', 'coverage']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  nodePlugin.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  pluginPromise.configs['flat/recommended'],
  eslintConfigPrettier,
  pluginSecurity.configs.recommended,
  eslintPluginUnicorn.configs.recommended,
  js.configs.recommended,
  jestExtendedPlugin.configs['flat/all'],

  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { importPlugin },
    rules: {
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // ex: fs, path, etc.
            'external', // ex: express, mongoose
            'internal', // alias internes via tsconfig ou chemins relatifs
            'parent', // ../
            'sibling', // ./
            'index', // ./index.js
            'object', // import foo = require('foo') (rare)
            'type', // import type { Foo } from '...'
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
])
