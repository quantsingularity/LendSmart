module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  globalSetup: "./tests/globalSetup.js",
  globalTeardown: "./tests/globalTeardown.js",
  setupFilesAfterEnv: ["./tests/jestSetup.js"],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: false,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
    "!src/scripts/**",
  ],
  /**
   * moduleNameMapper redirects bare `require('web-push')` calls to the manual
   * mock at <rootDir>/__mocks__/web-push.js.
   *
   * web-push is an optional runtime dependency (only active when VAPID keys are
   * configured via env vars).  None of the test suites exercise push-notification
   * delivery directly, so a stub is sufficient and avoids the need to install the
   * package in the test environment.
   */
  moduleNameMapper: {
    "^web-push$": "<rootDir>/__mocks__/web-push.js",
  },
};
