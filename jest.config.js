module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.mock.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/__tests__/__mocks__/uuid.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
