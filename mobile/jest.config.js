/** Standalone Jest config for the pure-logic test suite. */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(crypto-js)/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
