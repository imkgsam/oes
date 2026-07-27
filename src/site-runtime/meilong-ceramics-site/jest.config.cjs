module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json'
      }
    ]
  },
  moduleNameMapper: {
    '^@oes/site-runtime-kit$': '<rootDir>/../site-runtime-kit/dist/index.js'
  }
}
