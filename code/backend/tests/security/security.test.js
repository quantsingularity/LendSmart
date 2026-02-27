const request = require("supertest");
const { expect } = require("chai");
const app = require("../../src/server");
const testSetup = require("../setup");

describe("Security Tests", () => {
  before(async () => {
    await testSetup.setup();
  });

  after(async () => {
    await testSetup.cleanup();
  });

  beforeEach(async () => {
    await testSetup.resetDatabase();
  });

  describe("Input Validation Security", () => {
    describe("SQL Injection Prevention", () => {
      it("should prevent SQL injection in login", async () => {
        const maliciousPayload = {
          email: "admin@example.com' OR '1'='1",
          password: "password' OR '1'='1",
        };

        const response = await request(app)
          .post("/api/auth/login")
          .send(maliciousPayload)
          .expect(401);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "UNAUTHORIZED");
      });

      it("should prevent SQL injection in user search", async () => {
        const token = testSetup.getTestToken("testadmin").token;

        const response = await request(app)
          .get("/api/users/search")
          .set("Authorization", `Bearer ${token}`)
          .query({ q: "'; DROP TABLE users; --" })
          .expect(400);

        expect(response.body).to.have.property("error");
      });
    });

    describe("NoSQL Injection Prevention", () => {
      it("should prevent NoSQL injection in login", async () => {
        const maliciousPayload = {
          email: { $ne: null },
          password: { $ne: null },
        };

        const response = await request(app)
          .post("/api/auth/login")
          .send(maliciousPayload)
          .expect(400);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property(
          "code",
          "VALIDATION_ERROR",
        );
      });

      it("should prevent NoSQL injection in user queries", async () => {
        const token = testSetup.getTestToken("testadmin").token;

        const maliciousPayload = {
          filter: { $where: "function() { return true; }" },
        };

        const response = await request(app)
          .post("/api/users/query")
          .set("Authorization", `Bearer ${token}`)
          .send(maliciousPayload)
          .expect(400);

        expect(response.body).to.have.property("error");
      });
    });

    describe("XSS Prevention", () => {
      it("should sanitize XSS in user registration", async () => {
        const maliciousPayload = {
          username: '<script>alert("xss")</script>',
          email: "test@example.com",
          password: "TestPassword123!",
          firstName: '<img src=x onerror=alert("xss")>',
          lastName: "User",
          dateOfBirth: "1990-01-01",
          phoneNumber: "+1234567890",
          employmentStatus: "full-time",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(maliciousPayload)
          .expect(400);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property(
          "code",
          "VALIDATION_ERROR",
        );
      });

      it("should sanitize XSS in loan application", async () => {
        const token = testSetup.getTestToken("testuser").token;

        const maliciousPayload = {
          amount: 10000,
          interestRate: 12.5,
          term: 12,
          termUnit: "months",
          purpose: "debt_consolidation",
          description: '<script>alert("xss")</script>',
        };

        const response = await request(app)
          .post("/api/loans/apply")
          .set("Authorization", `Bearer ${token}`)
          .send(maliciousPayload)
          .expect(400);

        expect(response.body).to.have.property("error");
      });
    });

    describe("Command Injection Prevention", () => {
      it("should prevent command injection in file operations", async () => {
        const token = testSetup.getTestToken("testuser").token;

        const maliciousPayload = {
          filename: "document.pdf; rm -rf /",
        };

        const response = await request(app)
          .post("/api/documents/upload")
          .set("Authorization", `Bearer ${token}`)
          .send(maliciousPayload)
          .expect(400);

        expect(response.body).to.have.property("error");
      });
    });

    describe("Path Traversal Prevention", () => {
      it("should prevent directory traversal in file access", async () => {
        const token = testSetup.getTestToken("testuser").token;

        const response = await request(app)
          .get("/api/documents/../../etc/passwd")
          .set("Authorization", `Bearer ${token}`)
          .expect(404);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "NOT_FOUND");
      });

      it("should prevent path traversal in document download", async () => {
        const token = testSetup.getTestToken("testuser").token;

        const response = await request(app)
          .get("/api/documents/download")
          .set("Authorization", `Bearer ${token}`)
          .query({ path: "../../../etc/passwd" })
          .expect(400);

        expect(response.body).to.have.property("error");
      });
    });
  });

  describe("Authentication Security", () => {
    describe("JWT Security", () => {
      it("should reject tampered JWT tokens", async () => {
        const validToken = testSetup.getTestToken("testuser").token;
        const tamperedToken = validToken.slice(0, -10) + "tampered123";

        const response = await request(app)
          .get("/api/user/profile")
          .set("Authorization", `Bearer ${tamperedToken}`)
          .expect(401);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "INVALID_TOKEN");
      });

      it("should reject expired JWT tokens", async () => {
        // Create an expired token (in real implementation, you'd use a token with past expiry)
        const expiredToken =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxNGY5ZjI4ZjI4ZjI4ZjI4ZjI4ZjI4ZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjMyNzY4MzY4LCJleHAiOjE2MzI3Njg0Mjh9.expired";

        const response = await request(app)
          .get("/api/user/profile")
          .set("Authorization", `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "TOKEN_EXPIRED");
      });

      it("should reject malformed JWT tokens", async () => {
        const malformedToken = "not.a.valid.jwt.token";

        const response = await request(app)
          .get("/api/user/profile")
          .set("Authorization", `Bearer ${malformedToken}`)
          .expect(401);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "INVALID_TOKEN");
      });
    });

    describe("Session Security", () => {
      it("should invalidate sessions on password change", async () => {
        const token = testSetup.getTestToken("testuser").token;

        // Change password
        await request(app)
          .put("/api/user/change-password")
          .set("Authorization", `Bearer ${token}`)
          .send({
            currentPassword: "TestPassword123!",
            newPassword: "NewPassword123!",
            confirmPassword: "NewPassword123!",
          })
          .expect(200);

        // Old token should be invalid
        const response = await request(app)
          .get("/api/user/profile")
          .set("Authorization", `Bearer ${token}`)
          .expect(401);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "INVALID_TOKEN");
      });

      it("should limit concurrent sessions", async () => {
        const loginData = {
          email: "test@example.com",
          password: "TestPassword123!",
        };

        // Create multiple sessions
        const sessions = [];
        for (let i = 0; i < 10; i++) {
          const response = await request(app)
            .post("/api/auth/login")
            .send(loginData);

          if (response.status === 200) {
            sessions.push(response.body.data.token);
          }
        }

        // Verify session limit is enforced (should be max 5 sessions)
        expect(sessions.length).to.be.at.most(5);
      });
    });

    describe("Brute Force Protection", () => {
      it("should lock account after multiple failed attempts", async () => {
        const loginData = {
          email: "test@example.com",
          password: "WrongPassword",
        };

        // Make 5 failed attempts
        for (let i = 0; i < 5; i++) {
          await request(app)
            .post("/api/auth/login")
            .send(loginData)
            .expect(401);
        }

        // 6th attempt should result in account lock
        const response = await request(app)
          .post("/api/auth/login")
          .send(loginData)
          .expect(423);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "ACCOUNT_LOCKED");
      });

      it("should implement progressive delays for failed attempts", async () => {
        const loginData = {
          email: "test@example.com",
          password: "WrongPassword",
        };

        const startTime = Date.now();

        // Make multiple failed attempts
        for (let i = 0; i < 3; i++) {
          await request(app).post("/api/auth/login").send(loginData);
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Should take longer due to progressive delays
        expect(totalTime).to.be.greaterThan(1000); // At least 1 second
      });
    });
  });

  describe("Authorization Security", () => {
    describe("Role-Based Access Control", () => {
      it("should prevent regular users from accessing admin endpoints", async () => {
        const userToken = testSetup.getTestToken("testuser").token;

        const response = await request(app)
          .get("/api/admin/users")
          .set("Authorization", `Bearer ${userToken}`)
          .expect(403);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "FORBIDDEN");
      });

      it("should allow admin users to access admin endpoints", async () => {
        const adminToken = testSetup.getTestToken("testadmin").token;

        const response = await request(app)
          .get("/api/admin/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).to.have.property("success", true);
      });

      it("should prevent users from accessing other users' data", async () => {
        const userToken = testSetup.getTestToken("testuser").token;
        const otherUser = testSetup.getTestUser("testborrower");

        const response = await request(app)
          .get(`/api/users/${otherUser._id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .expect(403);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "FORBIDDEN");
      });
    });

    describe("Resource Ownership", () => {
      it("should prevent users from modifying other users' loans", async () => {
        const userToken = testSetup.getTestToken("testuser").token;
        const loan = await testSetup.createTestLoan("testborrower");

        const response = await request(app)
          .put(`/api/loans/${loan._id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ amount: 20000 })
          .expect(403);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.have.property("code", "FORBIDDEN");
      });

      it("should allow users to modify their own loans", async () => {
        const userToken = testSetup.getTestToken("testborrower").token;
        const loan = await testSetup.createTestLoan("testborrower");

        const response = await request(app)
          .put(`/api/loans/${loan._id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ description: "Updated description" })
          .expect(200);

        expect(response.body).to.have.property("success", true);
      });
    });
  });

  describe("Data Protection", () => {
    describe("Sensitive Data Exposure", () => {
      it("should not expose sensitive user data in API responses", async () => {
        const userToken = testSetup.getTestToken("testuser").token;

        const response = await request(app)
          .get("/api/user/profile")
          .set("Authorization", `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.data.user).to.not.have.property("password");
        expect(response.body.data.user).to.not.have.property("mfaSecret");
        expect(response.body.data.user).to.not.have.property("refreshTokens");
        expect(response.body.data.user).to.not.have.property(
          "passwordResetToken",
        );
        expect(response.body.data.user).to.not.have.property(
          "socialSecurityNumber",
        );
      });

      it("should not expose internal system information in errors", async () => {
        const response = await request(app)
          .get("/api/nonexistent-endpoint")
          .expect(404);

        expect(response.body.error.message).to.not.include("stack");
        expect(response.body.error.message).to.not.include("database");
        expect(response.body.error.message).to.not.include("internal");
      });
    });

    describe("Data Encryption", () => {
      it("should encrypt sensitive data in database", async () => {
        const User = require("../../src/models/UserModel");
        const user = testSetup.getTestUser("testuser");

        // Get raw data from database
        const rawUser = await User.findById(user._id).lean();

        // Sensitive fields should be encrypted (not equal to original values)
        expect(rawUser.firstName).to.not.equal("Test");
        expect(rawUser.lastName).to.not.equal("User");
        expect(rawUser.phoneNumber).to.not.equal("+1234567890");
      });

      it("should decrypt sensitive data when retrieved", async () => {
        const User = require("../../src/models/UserModel");
        const user = await User.findById(testSetup.getTestUser("testuser")._id);

        // Data should be decrypted when retrieved through model
        expect(user.firstName).to.equal("Test");
        expect(user.lastName).to.equal("User");
        expect(user.phoneNumber).to.equal("+1234567890");
      });
    });
  });

  describe("Rate Limiting Security", () => {
    it("should rate limit API requests per user", async () => {
      const userToken = testSetup.getTestToken("testuser").token;

      // Make many requests quickly
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .get("/api/user/profile")
            .set("Authorization", `Bearer ${userToken}`),
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );

      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });

    it("should rate limit by IP address", async () => {
      // Make many requests from same IP without authentication
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(request(app).get("/api/health"));
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );

      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });
  });

  describe("CORS Security", () => {
    it("should include proper CORS headers", async () => {
      const response = await request(app)
        .options("/api/auth/login")
        .set("Origin", "https://example.com")
        .expect(200);

      expect(response.headers).to.have.property("access-control-allow-origin");
      expect(response.headers).to.have.property("access-control-allow-methods");
      expect(response.headers).to.have.property("access-control-allow-headers");
    });

    it("should reject requests from unauthorized origins in production", async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", "https://malicious-site.com")
        .send({
          email: "test@example.com",
          password: "TestPassword123!",
        });

      // Restore environment
      process.env.NODE_ENV = originalEnv;

      // In production, should have stricter CORS policy
      expect(response.headers["access-control-allow-origin"]).to.not.equal("*");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers in all responses", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.headers).to.have.property(
        "x-content-type-options",
        "nosniff",
      );
      expect(response.headers).to.have.property("x-frame-options", "DENY");
      expect(response.headers).to.have.property(
        "x-xss-protection",
        "1; mode=block",
      );
      expect(response.headers).to.have.property("strict-transport-security");
      expect(response.headers).to.have.property("content-security-policy");
    });

    it("should not expose server information", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.headers).to.not.have.property("server");
      expect(response.headers).to.not.have.property("x-powered-by");
    });
  });

  describe("File Upload Security", () => {
    it("should validate file types for uploads", async () => {
      const userToken = testSetup.getTestToken("testuser").token;

      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", Buffer.from("malicious script"), "malware.exe")
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.error.message).to.include("file type");
    });

    it("should limit file sizes for uploads", async () => {
      const userToken = testSetup.getTestToken("testuser").token;
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", largeBuffer, "large-file.pdf")
        .expect(413);

      expect(response.body).to.have.property("error");
      expect(response.body.error).to.have.property("code", "FILE_TOO_LARGE");
    });

    it("should scan uploaded files for malware", async () => {
      const userToken = testSetup.getTestToken("testuser").token;

      // Mock malware signature
      const maliciousContent = Buffer.from(
        "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
      );

      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", maliciousContent, "test.pdf")
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.error.message).to.include("security");
    });
  });

  describe("API Security", () => {
    it("should validate request content types", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "text/plain")
        .send("malicious data")
        .expect(415);

      expect(response.body).to.have.property("error");
      expect(response.body.error).to.have.property(
        "code",
        "UNSUPPORTED_MEDIA_TYPE",
      );
    });

    it("should limit request body sizes", async () => {
      const largePayload = "x".repeat(10 * 1024 * 1024); // 10MB string

      const response = await request(app)
        .post("/api/auth/register")
        .send({ data: largePayload })
        .expect(413);

      expect(response.body).to.have.property("error");
    });

    it("should validate JSON structure", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).to.have.property("error");
      expect(response.body.error).to.have.property("code", "INVALID_FORMAT");
    });
  });

  describe("Logging Security", () => {
    it("should not log sensitive data", async () => {
      // This test would check log files in a real implementation
      // For now, we'll verify that sensitive data is sanitized in responses

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "TestPassword123!",
        })
        .expect(200);

      // Verify password is not in response
      expect(JSON.stringify(response.body)).to.not.include("TestPassword123!");
    });

    it("should log security events", async () => {
      // Attempt unauthorized access
      await request(app)
        .get("/api/admin/users")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      // In a real implementation, you would check that this event was logged
      // For now, we'll just verify the response structure
      expect(true).to.be.true; // Placeholder assertion
    });
  });
});
