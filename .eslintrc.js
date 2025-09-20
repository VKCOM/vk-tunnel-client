const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'vitest'],
  extends: ['plugin:@vkontakte/eslint-plugin/typescript', 'plugin:import/recommended', 'prettier'],
  ignorePatterns: ['.eslintrc.js', 'vitest.config.mts', '**/*.d.ts'],
  overrides: [
    {
      files: '**/*.{ts,tsx,test.ts}',
      rules: {
        'import/named': 'off',
        'import/no-unresolved': 'off',
        'no-shadow': 'off',
        'guard-for-in': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/prefer-readonly': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/no-extraneous-class': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
      },
    },
  ],
};
