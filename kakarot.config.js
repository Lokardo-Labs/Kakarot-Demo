/** @type {import('@kakarot-ci/core').KakarotConfig} */
const config = {
  apiKey: process.env.KAKAROT_API_KEY,
  framework: 'jest',
  provider: 'anthropic',
  model: 'claude-opus-4-6',
  maxTokens: 16000,
  testLocation: 'separate',
  testDirectory: '__tests__',
  testFilePattern: '*.test.ts',
  includePatterns: ['src/**/*.ts'],
  enableCoverage: true,
};

module.exports = config;
