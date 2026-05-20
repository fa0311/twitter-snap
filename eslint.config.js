import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        after: 'readonly',
        before: 'readonly',
        console: 'readonly',
        describe: 'readonly',
        fetch: 'readonly',
        it: 'readonly',
        NodeJS: 'readonly',
        React: 'readonly',
        RequestInit: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      complexity: 'off',
      'no-case-declarations': 'off',
      'no-constant-binary-expression': 'off',
      'no-empty': 'off',
      'no-irregular-whitespace': 'off',
      'no-prototype-builtins': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
)
