/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/*.unit.spec.ts',
    '<rootDir>/src/**/*.component.spec.ts',
    '<rootDir>/test/**/*.contract.spec.ts',
    '<rootDir>/test/**/*.integration.spec.ts',
  ],
  setupFiles: ['reflect-metadata'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json'
      }
    ]
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: './coverage'
}
