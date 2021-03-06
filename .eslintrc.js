module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-empty-interface': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0
  }
};