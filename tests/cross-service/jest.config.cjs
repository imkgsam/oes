/** Executes TypeScript Journey specifications against production modules from the repository root. */
module.exports = {
  rootDir: '../..',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  testMatch: ['<rootDir>/tests/cross-service/**/*.journey.spec.ts'],
  testTimeout: 300_000,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tests/cross-service/tsconfig.json',
        diagnostics: false
      }
    ]
  }
}
