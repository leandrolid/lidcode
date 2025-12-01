import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(chalk|@t3-oss|@leandrolid)/)'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/__tests__/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
}

export default config
