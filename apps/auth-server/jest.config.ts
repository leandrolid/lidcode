import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^better-auth$': '<rootDir>/__mocks__/better-auth-core.ts',
    '^better-auth/adapters/drizzle$': '<rootDir>/__mocks__/better-auth-core.ts',
    '^@thallesp/nestjs-better-auth$': '<rootDir>/__mocks__/better-auth.ts',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
  transformIgnorePatterns: [
    'node_modules/(?!(better-auth|better-call|@thallesp/nestjs-better-auth)/)',
  ],
}

export default config
