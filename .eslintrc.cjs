module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', 'src/**/*.ts', 'src/**/*.tsx', 'stories/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      parserOptions: {
        project: false,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
    {
      files: ['index.js'],
      rules: {
        'no-console': 'off', // Allow console in main entry point
      },
    },
    {
      files: ['test/**/*.js'],
      rules: {
        'no-console': 'off', // Allow console in test files
      },
    },
    {
      files: ['api/**/*.js'],
      rules: {
        'no-console': 'off', // Allow console in API endpoints for logging
      },
    },
  ],
};
