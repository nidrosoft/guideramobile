const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  ...tsjPreset,
  preset: 'react-native',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        babelConfig: true,
      },
    ],
  },
  
  // Transform settings
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-modules-core|@unimodules|react-native-reanimated|iconsax-react-native|zustand)/)',
  ],
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/__tests__/utils/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.styles.ts',
    '!src/**/index.ts',
    '!src/app/**/*',
  ],
  
  // Coverage thresholds (start low, increase over time)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Globals
  globals: {
    __DEV__: true,
  },
};
