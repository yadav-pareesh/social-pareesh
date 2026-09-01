module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  globals: { 'ts-jest': { tsconfig: { jsx: 'react-jsx', types: ['node', 'jest', '@testing-library/jest-dom'], baseUrl: '.', paths: { '@/*': ['src/*'] } } } },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  clearMocks: true,
  restoreMocks: true,
};