const request = require("supertest");
const app = require("../src/server"); // Adjust path to your app entry file
const mongoose = require("mongoose");
// const connectDB = require("../src/config/db"); // If you need to connect/disconnect DB for tests

/*
BEFORE ALL TESTS:
- Ensure MongoDB is running.
- Environment variables for testing are set (e.g., a separate test database).
*/

// Example: Basic test for a public endpoint
describe("GET / (API Root)", () => {
  it("should return welcome message and 200 OK", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Welcome to LendSmart Backend API");
  });
});

// Example: Test for a protected route (requires more setup for auth)
// describe("GET /api/auth/me", () => {
//   let token;

//   beforeAll(async () => {
//     // You might need to connect to a test database here if not already handled
//     // await connectDB();

//     // Register and login a test user to get a token
//     await request(app)
//       .post("/api/auth/register")
//       .send({
//         username: "testuser_for_me_route",
//         email: "testme@example.com",
//         password: "password123",
//         role: "borrower",
//       });

//     const loginRes = await request(app)
//       .post("/api/auth/login")
//       .send({
//         email: "testme@example.com",
//         password: "password123",
//       });
//     token = loginRes.body.token;
//   });

//   afterAll(async () => {
//     // Clean up: delete the test user, disconnect DB, etc.
//     // await mongoose.connection.db.dropCollection("users"); // Example cleanup
//     // await mongoose.connection.close();
//   });

//   it("should return 401 Unauthorized if no token is provided", async () => {
//     const res = await request(app).get("/api/auth/me");
//     expect(res.statusCode).toEqual(401);
//   });

//   it("should return user data if token is valid", async () => {
//     if (!token) throw new Error("Token not obtained in beforeAll for /api/auth/me test");
//     const res = await request(app)
//       .get("/api/auth/me")
//       .set("Authorization", `Bearer ${token}`);
//     expect(res.statusCode).toEqual(200);
//     expect(res.body.success).toBe(true);
//     expect(res.body.user).toHaveProperty("email", "testme@example.com");
//   });
// });

// Close MongoDB connection after all tests are done if managed here
// afterAll(async () => {
//   await mongoose.connection.close();
// });
