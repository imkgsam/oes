module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/**/*.unit.spec.ts',
    '<rootDir>/**/*.component.spec.ts',
    '<rootDir>/**/*.contract.spec.ts',
    '<rootDir>/**/*.integration.spec.ts'
  ],
  testPathIgnorePatterns: ['\\.node\\.integration\\.spec\\.ts$'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.tests.json'
      }
    ]
  },
  moduleNameMapper: {
    '^@oes/site-runtime-kit$': '<rootDir>/../site-runtime-kit/dist/index.js'
  }
}
