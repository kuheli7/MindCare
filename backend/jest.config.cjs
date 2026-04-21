module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/config/db.js',
    '<rootDir>/middleware/authMiddleware.js',
    '<rootDir>/routes/authRoutes.js',
    '<rootDir>/routes/contactRoutes.js',
    '<rootDir>/routes/domainsRoutes.js',
    '<rootDir>/routes/assessmentTypeRoutes.js',
    '<rootDir>/models/utils/**/*.js',
    '<rootDir>/services/**/*.js',
    '!**/*.test.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {}
};
