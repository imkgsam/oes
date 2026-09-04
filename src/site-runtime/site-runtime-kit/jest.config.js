/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/**/*.unit.spec.ts',
    '<rootDir>/**/*.component.spec.ts',
    '<rootDir>/**/*.contract.spec.ts',
    '<rootDir>/**/*.integration.spec.ts'
  ],
  setupFiles: ['reflect-metadata'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.tests.json'
      }
    ]
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: './coverage'
}
