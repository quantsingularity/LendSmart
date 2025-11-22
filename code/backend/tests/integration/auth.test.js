const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const testSetup = require('../setup');

describe('Authentication Integration Tests', () => {
    before(async () => {
        await testSetup.setup();
    });

    after(async () => {
        await testSetup.cleanup();
    });

    beforeEach(async () => {
        await testSetup.resetDatabase();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'NewUserPassword123!',
                firstName: 'New',
                lastName: 'User',
                dateOfBirth: '1993-01-01',
                phoneNumber: '+1234567899',
                employmentStatus: 'full-time',
                income: 60000,
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data');
            expect(response.body.data).to.have.property('user');
            expect(response.body.data).to.have.property('token');
            expect(response.body.data.user).to.have.property('username', userData.username);
            expect(response.body.data.user).to.have.property('email', userData.email);
            expect(response.body.data.user).to.not.have.property('password');
        });

        it('should fail with missing required fields', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
                // Missing password and other required fields
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
        });

        it('should fail with invalid email format', async () => {
            const userData = {
                username: 'newuser',
                email: 'invalid-email',
                password: 'NewUserPassword123!',
                firstName: 'New',
                lastName: 'User',
                dateOfBirth: '1993-01-01',
                phoneNumber: '+1234567899',
                employmentStatus: 'full-time',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
        });

        it('should fail with weak password', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: '123',
                firstName: 'New',
                lastName: 'User',
                dateOfBirth: '1993-01-01',
                phoneNumber: '+1234567899',
                employmentStatus: 'full-time',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
        });

        it('should fail with duplicate username', async () => {
            const userData = {
                username: 'testuser', // Existing user from setup
                email: 'different@example.com',
                password: 'NewUserPassword123!',
                firstName: 'New',
                lastName: 'User',
                dateOfBirth: '1993-01-01',
                phoneNumber: '+1234567899',
                employmentStatus: 'full-time',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'DUPLICATE_ENTRY');
        });

        it('should fail with duplicate email', async () => {
            const userData = {
                username: 'differentuser',
                email: 'test@example.com', // Existing email from setup
                password: 'NewUserPassword123!',
                firstName: 'New',
                lastName: 'User',
                dateOfBirth: '1993-01-01',
                phoneNumber: '+1234567899',
                employmentStatus: 'full-time',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'DUPLICATE_ENTRY');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data');
            expect(response.body.data).to.have.property('user');
            expect(response.body.data).to.have.property('token');
            expect(response.body.data).to.have.property('refreshToken');
            expect(response.body.data.user).to.have.property('email', loginData.email);
            expect(response.body.data.user).to.not.have.property('password');
        });

        it('should login with username instead of email', async () => {
            const loginData = {
                username: 'testuser',
                password: 'TestPassword123!',
            };

            const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data.user).to.have.property('username', loginData.username);
        });

        it('should fail with invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'TestPassword123!',
            };

            const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'UNAUTHORIZED');
        });

        it('should fail with invalid password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword',
            };

            const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'UNAUTHORIZED');
        });

        it('should fail with locked account', async () => {
            // First, lock the account by making 5 failed login attempts
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword',
            };

            // Make 5 failed attempts
            for (let i = 0; i < 5; i++) {
                await request(app).post('/api/auth/login').send(loginData).expect(401);
            }

            // Now try with correct password - should be locked
            const correctLoginData = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(correctLoginData)
                .expect(423);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'ACCOUNT_LOCKED');
        });

        it('should fail with suspended account', async () => {
            // Update user account status to suspended
            const user = testSetup.getTestUser('testuser');
            user.accountStatus = 'suspended';
            await user.save();

            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const response = await request(app).post('/api/auth/login').send(loginData).expect(403);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'FORBIDDEN');
        });

        it('should require MFA when enabled', async () => {
            // Enable MFA for test user
            const user = testSetup.getTestUser('testuser');
            user.mfaEnabled = true;
            user.mfaSecret = 'test-mfa-secret';
            await user.save();

            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('requiresMFA', true);
            expect(response.body.data).to.have.property('tempToken');
            expect(response.body.data).to.not.have.property('token');
        });
    });

    describe('POST /api/auth/verify-mfa', () => {
        let tempToken;

        beforeEach(async () => {
            // Enable MFA and get temp token
            const user = testSetup.getTestUser('testuser');
            user.mfaEnabled = true;
            user.mfaSecret = 'test-mfa-secret';
            await user.save();

            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const loginResponse = await request(app).post('/api/auth/login').send(loginData);

            tempToken = loginResponse.body.data.tempToken;
        });

        it('should complete login with valid MFA code', async () => {
            const mfaData = {
                tempToken,
                mfaCode: '123456', // Mock valid code
            };

            const response = await request(app)
                .post('/api/auth/verify-mfa')
                .send(mfaData)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('token');
            expect(response.body.data).to.have.property('refreshToken');
            expect(response.body.data).to.have.property('user');
        });

        it('should fail with invalid MFA code', async () => {
            const mfaData = {
                tempToken,
                mfaCode: '000000', // Invalid code
            };

            const response = await request(app)
                .post('/api/auth/verify-mfa')
                .send(mfaData)
                .expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'UNAUTHORIZED');
        });

        it('should fail with invalid temp token', async () => {
            const mfaData = {
                tempToken: 'invalid-temp-token',
                mfaCode: '123456',
            };

            const response = await request(app)
                .post('/api/auth/verify-mfa')
                .send(mfaData)
                .expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'INVALID_TOKEN');
        });

        it('should accept backup code when MFA code fails', async () => {
            // Add backup codes to user
            const user = testSetup.getTestUser('testuser');
            user.mfaBackupCodes = [
                { code: 'backup123', used: false },
                { code: 'backup456', used: false },
            ];
            await user.save();

            const mfaData = {
                tempToken,
                mfaCode: 'backup123',
            };

            const response = await request(app)
                .post('/api/auth/verify-mfa')
                .send(mfaData)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('token');
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        let refreshToken;

        beforeEach(async () => {
            // Login to get refresh token
            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const loginResponse = await request(app).post('/api/auth/login').send(loginData);

            refreshToken = loginResponse.body.data.refreshToken;
        });

        it('should refresh token with valid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken })
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('token');
            expect(response.body.data).to.have.property('refreshToken');
            expect(response.body.data.refreshToken).to.not.equal(refreshToken); // Should be new
        });

        it('should fail with invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken: 'invalid-refresh-token' })
                .expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'INVALID_TOKEN');
        });

        it('should fail with expired refresh token', async () => {
            // Mock expired token (in real implementation, you'd use a token with past expiry)
            const expiredToken = 'expired-refresh-token';

            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken: expiredToken })
                .expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'TOKEN_EXPIRED');
        });
    });

    describe('POST /api/auth/logout', () => {
        let token, refreshToken;

        beforeEach(async () => {
            // Login to get tokens
            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const loginResponse = await request(app).post('/api/auth/login').send(loginData);

            token = loginResponse.body.data.token;
            refreshToken = loginResponse.body.data.refreshToken;
        });

        it('should logout successfully with valid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .send({ refreshToken })
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message', 'Logged out successfully');
        });

        it('should fail without authentication token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .send({ refreshToken })
                .expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'UNAUTHORIZED');
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer invalid-token')
                .send({ refreshToken })
                .expect(401);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'INVALID_TOKEN');
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should send password reset email for valid email', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message');
        });

        it('should not reveal if email does not exist', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message');
        });

        it('should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
        });
    });

    describe('POST /api/auth/reset-password', () => {
        let resetToken;

        beforeEach(async () => {
            // Generate reset token
            const user = testSetup.getTestUser('testuser');
            resetToken = user.generatePasswordResetToken();
            await user.save();
        });

        it('should reset password with valid token', async () => {
            const newPassword = 'NewPassword123!';

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    resetToken,
                    password: newPassword,
                    confirmPassword: newPassword,
                })
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message');

            // Verify can login with new password
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: newPassword,
                })
                .expect(200);

            expect(loginResponse.body).to.have.property('success', true);
        });

        it('should fail with invalid reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    resetToken: 'invalid-token',
                    password: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!',
                })
                .expect(400);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'INVALID_TOKEN');
        });

        it('should fail with mismatched passwords', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    resetToken,
                    password: 'NewPassword123!',
                    confirmPassword: 'DifferentPassword123!',
                })
                .expect(400);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
        });

        it('should fail with weak password', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    resetToken,
                    password: '123',
                    confirmPassword: '123',
                })
                .expect(400);

            expect(response.body).to.have.property('error');
            expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
        });
    });

    describe('Rate Limiting', () => {
        it('should rate limit login attempts', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword',
            };

            // Make multiple failed login attempts
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(request(app).post('/api/auth/login').send(loginData));
            }

            const responses = await Promise.all(promises);

            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter((res) => res.status === 429);
            expect(rateLimitedResponses.length).to.be.greaterThan(0);
        });

        it('should rate limit registration attempts', async () => {
            const userData = {
                username: 'spammer',
                email: 'spam@example.com',
                password: 'SpamPassword123!',
                firstName: 'Spam',
                lastName: 'User',
                dateOfBirth: '1990-01-01',
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            // Make multiple registration attempts
            const promises = [];
            for (let i = 0; i < 10; i++) {
                userData.username = `spammer${i}`;
                userData.email = `spam${i}@example.com`;
                promises.push(
                    request(app)
                        .post('/api/auth/register')
                        .send({ ...userData }),
                );
            }

            const responses = await Promise.all(promises);

            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter((res) => res.status === 429);
            expect(rateLimitedResponses.length).to.be.greaterThan(0);
        });
    });

    describe('Security Headers', () => {
        it('should include security headers in responses', async () => {
            const response = await request(app).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'TestPassword123!',
            });

            expect(response.headers).to.have.property('x-content-type-options');
            expect(response.headers).to.have.property('x-frame-options');
            expect(response.headers).to.have.property('x-xss-protection');
        });
    });
});
