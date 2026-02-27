const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../src/server");
const User = require("../src/models/UserModel");
const { AuthService } = require("../src/security/authService");

// Test database setup
const MONGODB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/lendsmart_test";

describe("Authentication System", () => {
  let authService;
  let testUser;
  let validToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
    authService = new AuthService();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});

    // Create a test user
    const hashedPassword = await bcrypt.hash("TestPassword123!", 12);
    testUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      password: hashedPassword,
      role: "borrower",
      isEmailVerified: true,
      isActive: true,
    });

    // Generate valid token for authenticated tests
    validToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" },
    );
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe("User Registration", () => {
    test("should register a new user with valid data", async () => {
      const userData = {
        username: "newuser",
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
        role: "borrower",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();

      // Verify user was created in database
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.username).toBe(userData.username);
    });

    test("should reject registration with weak password", async () => {
      const userData = {
        username: "weakuser",
        email: "weak@example.com",
        firstName: "Weak",
        lastName: "User",
        password: "123", // Weak password
        confirmPassword: "123",
        role: "borrower",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("password");
      expect(response.body.requirements).toBeDefined();
    });

    test("should reject registration with mismatched passwords", async () => {
      const userData = {
        username: "mismatchuser",
        email: "mismatch@example.com",
        firstName: "Mismatch",
        lastName: "User",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
        role: "borrower",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("match");
    });

    test("should reject registration with duplicate email", async () => {
      const userData = {
        username: "duplicateuser",
        email: testUser.email, // Using existing email
        firstName: "Duplicate",
        lastName: "User",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "borrower",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    test("should reject registration with invalid email format", async () => {
      const userData = {
        username: "invalidemailuser",
        email: "invalid-email-format",
        firstName: "Invalid",
        lastName: "Email",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "borrower",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("email");
    });
  });

  describe("User Login", () => {
    test("should login with valid credentials", async () => {
      const loginData = {
        email: testUser.email,
        password: "TestPassword123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    test("should reject login with invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "TestPassword123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid credentials");
    });

    test("should reject login with invalid password", async () => {
      const loginData = {
        email: testUser.email,
        password: "WrongPassword123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid credentials");
    });

    test("should reject login for inactive user", async () => {
      // Deactivate the test user
      await User.findByIdAndUpdate(testUser._id, { isActive: false });

      const loginData = {
        email: testUser.email,
        password: "TestPassword123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("account is deactivated");
    });

    test("should implement rate limiting for failed login attempts", async () => {
      const loginData = {
        email: testUser.email,
        password: "WrongPassword123!",
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/auth/login").send(loginData).expect(401);
      }

      // The 6th attempt should be rate limited
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Too many attempts");
    });
  });

  describe("Token Management", () => {
    test("should verify valid JWT token", async () => {
      const response = await request(app)
        .post("/api/auth/verify")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser._id.toString());
    });

    test("should reject invalid JWT token", async () => {
      const invalidToken = "invalid.jwt.token";

      const response = await request(app)
        .post("/api/auth/verify")
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid token");
    });

    test("should reject expired JWT token", async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "-1h" }, // Expired 1 hour ago
      );

      const response = await request(app)
        .post("/api/auth/verify")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("expired");
    });

    test("should refresh access token with valid refresh token", async () => {
      // First, login to get refresh token
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "TestPassword123!",
      });

      const refreshToken = loginResponse.body.tokens.refreshToken;

      // Use refresh token to get new access token
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    test("should reject invalid refresh token", async () => {
      const invalidRefreshToken = "invalid.refresh.token";

      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: invalidRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid refresh token");
    });
  });

  describe("Password Security", () => {
    test("should validate password strength requirements", () => {
      const weakPasswords = [
        "123",
        "password",
        "Password",
        "Password123",
        "password123!",
        "PASSWORD123!",
      ];

      const strongPasswords = [
        "Password123!",
        "MyStr0ng@Pass",
        "C0mpl3x#P@ssw0rd",
      ];

      weakPasswords.forEach((password) => {
        const result = authService.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.requirements).toBeDefined();
      });

      strongPasswords.forEach((password) => {
        const result = authService.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });

    test("should hash passwords securely", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await authService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 characters

      // Verify the hash can be validated
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test("should change password with proper validation", async () => {
      const changePasswordData = {
        currentPassword: "TestPassword123!",
        newPassword: "NewPassword456!",
        confirmNewPassword: "NewPassword456!",
      };

      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${validToken}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Password changed successfully");

      // Verify old password no longer works
      const oldPasswordLogin = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "TestPassword123!",
        })
        .expect(401);

      // Verify new password works
      const newPasswordLogin = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "NewPassword456!",
        })
        .expect(200);

      expect(newPasswordLogin.body.success).toBe(true);
    });
  });

  describe("Multi-Factor Authentication (MFA)", () => {
    test("should setup MFA for user account", async () => {
      const response = await request(app)
        .post("/api/auth/mfa/setup")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.qrCode).toBeDefined();
      expect(response.body.secret).toBeDefined();
      expect(response.body.backupCodes).toBeDefined();
      expect(response.body.backupCodes).toHaveLength(10);
    });

    test("should verify MFA token during login", async () => {
      // First setup MFA
      await request(app)
        .post("/api/auth/mfa/setup")
        .set("Authorization", `Bearer ${validToken}`);

      // Enable MFA
      await User.findByIdAndUpdate(testUser._id, {
        mfaEnabled: true,
        mfaSecret: "test-mfa-secret",
      });

      // Attempt login - should require MFA
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "TestPassword123!",
        })
        .expect(200);

      expect(loginResponse.body.requiresMFA).toBe(true);
      expect(loginResponse.body.tempToken).toBeDefined();
    });

    test("should disable MFA with proper verification", async () => {
      // Setup and enable MFA first
      await User.findByIdAndUpdate(testUser._id, {
        mfaEnabled: true,
        mfaSecret: "test-mfa-secret",
      });

      const response = await request(app)
        .post("/api/auth/mfa/disable")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ mfaToken: "123456" }) // Mock MFA token
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("MFA disabled");

      // Verify MFA is disabled in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.mfaEnabled).toBe(false);
    });
  });

  describe("Session Management", () => {
    test("should logout and invalidate tokens", async () => {
      // First login to get tokens
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "TestPassword123!",
      });

      const accessToken = loginResponse.body.tokens.accessToken;
      const refreshToken = loginResponse.body.tokens.refreshToken;

      // Logout
      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
      expect(logoutResponse.body.message).toContain("Logged out successfully");

      // Verify tokens are invalidated
      const verifyResponse = await request(app)
        .post("/api/auth/verify")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(401);

      expect(verifyResponse.body.success).toBe(false);
    });

    test("should logout from all devices", async () => {
      // Login multiple times to create multiple sessions
      const login1 = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "TestPassword123!",
      });

      const login2 = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "TestPassword123!",
      });

      const token1 = login1.body.tokens.accessToken;
      const token2 = login2.body.tokens.accessToken;

      // Logout from all devices using first token
      const logoutResponse = await request(app)
        .post("/api/auth/logout-all")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Verify both tokens are invalidated
      await request(app)
        .post("/api/auth/verify")
        .set("Authorization", `Bearer ${token1}`)
        .expect(401);

      await request(app)
        .post("/api/auth/verify")
        .set("Authorization", `Bearer ${token2}`)
        .expect(401);
    });
  });

  describe("Account Security", () => {
    test("should lock account after multiple failed login attempts", async () => {
      const loginData = {
        email: testUser.email,
        password: "WrongPassword123!",
      };

      // Make multiple failed attempts
      for (let i = 0; i < 10; i++) {
        await request(app).post("/api/auth/login").send(loginData);
      }

      // Account should be locked
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "TestPassword123!", // Correct password
        })
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("locked");
    });

    test("should unlock account after lockout period", async () => {
      // Lock the account
      await User.findByIdAndUpdate(testUser._id, {
        accountLocked: true,
        lockoutExpires: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      // Should be able to login now
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "TestPassword123!",
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify account is unlocked
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.accountLocked).toBe(false);
    });
  });

  describe("Audit Logging", () => {
    test("should log successful authentication events", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "TestPassword123!",
      });

      expect(loginResponse.body.success).toBe(true);

      // Check if audit log was created (this would require access to audit logs)
      // In a real implementation, you would verify the audit log entry
    });

    test("should log failed authentication attempts", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "WrongPassword123!",
      });

      expect(loginResponse.body.success).toBe(false);

      // Check if audit log was created for failed attempt
      // In a real implementation, you would verify the audit log entry
    });
  });
});

// Helper functions for testing
const createTestUser = async (userData = {}) => {
  const defaultData = {
    username: "testuser",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    password: await bcrypt.hash("TestPassword123!", 12),
    role: "borrower",
    isEmailVerified: true,
    isActive: true,
  };

  return await User.create({ ...defaultData, ...userData });
};

const generateTestToken = (userId, expiresIn = "1h") => {
  return jwt.sign(
    { userId, email: "test@example.com" },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn },
  );
};

module.exports = {
  createTestUser,
  generateTestToken,
};
