import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import babelParser from '@babel/eslint-parser'
import nodePlugin from 'eslint-plugin-n'
import importPlugin from 'eslint-plugin-import'
import pluginPromise from 'eslint-plugin-promise'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginSecurity from 'eslint-plugin-security'

export default defineConfig([
  globalIgnores(['dist', '.yarn', '.pnp.*', 'eslint.config.js']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
      parser: babelParser,
    },
  },
  nodePlugin.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  pluginPromise.configs['flat/recommended'],
  eslintConfigPrettier,
  pluginSecurity.configs.recommended,
])
