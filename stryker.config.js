/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  mutate: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
  ],
  testRunner: 'jest',
  jest: {
    configFile: 'jest.config.js',
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  reporters: ['clear-text', 'html'],
  coverageAnalysis: 'perTest',
  timeoutMS: 30000,
  concurrency: 4,
};

module.exports = config;
