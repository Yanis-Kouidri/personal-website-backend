import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import nodePlugin from 'eslint-plugin-n'

export default defineConfig([
  globalIgnores(['dist', '.yarn', '.pnp.*', 'eslint.config.js']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
  },
  nodePlugin.configs['flat/recommended'],
])
