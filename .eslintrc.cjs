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
  ],
};
