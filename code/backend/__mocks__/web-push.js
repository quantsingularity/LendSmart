/**
 * Manual Jest mock for the `web-push` package.
 *
 * `web-push` is an optional production dependency used only when VAPID keys are
 * configured at runtime.  It is NOT required for any unit or integration test,
 * so we stub every public API surface here so that Jest can resolve the module
 * without the package being installed.
 */

const webpush = {
  /**
   * Configure VAPID details.  No-op in tests.
   */
  setVapidDetails: jest.fn(),

  /**
   * Set the GCM API key.  No-op in tests.
   */
  setGCMAPIKey: jest.fn(),

  /**
   * Simulate a successful push-notification delivery.
   * Returns a resolved promise that matches the real API's shape:
   *   { statusCode, body, headers }
   */
  sendNotification: jest.fn().mockResolvedValue({
    statusCode: 201,
    body: "",
    headers: {},
  }),

  /**
   * Generate VAPID keys – returns deterministic fake keys so any code that
   * calls this during tests gets back a well-shaped object.
   */
  generateVAPIDKeys: jest.fn().mockReturnValue({
    publicKey: "fake-vapid-public-key-for-testing",
    privateKey: "fake-vapid-private-key-for-testing",
  }),

  /**
   * Encrypt a push message payload.  Returns a mock encrypted payload.
   */
  encrypt: jest.fn().mockReturnValue({
    localPublicKey: "fake-local-public-key",
    salt: "fake-salt",
    cipherText: Buffer.from("fake-encrypted-payload"),
  }),
};

module.exports = webpush;
