module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).js"],
  // setupFilesAfterEnv: ["./tests/setup.js"], // if you have a setup file for tests
  // verbose: true, // Optionally, for more detailed output
};
