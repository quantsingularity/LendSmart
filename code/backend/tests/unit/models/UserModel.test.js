const { expect } = require('chai');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../src/models/UserModel');
const testSetup = require('../../setup');

describe('User Model', () => {
    before(async () => {
        await testSetup.setup();
    });

    after(async () => {
        await testSetup.cleanup();
    });

    beforeEach(async () => {
        await testSetup.resetDatabase();
    });

    describe('User Creation', () => {
        it('should create a valid user with required fields', async () => {
            const userData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser).to.exist;
            expect(savedUser.username).to.equal(userData.username);
            expect(savedUser.email).to.equal(userData.email);
            expect(savedUser.firstName).to.not.equal(userData.firstName); // Should be encrypted
            expect(savedUser.role).to.equal('user'); // Default role
            expect(savedUser.accountStatus).to.equal('pending'); // Default status
            expect(savedUser.creditScore).to.equal(600); // Default credit score
        });

        it('should hash password before saving', async () => {
            const userData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            const user = new User(userData);
            await user.save();

            // Password should be hashed
            expect(user.password).to.not.equal(userData.password);
            expect(user.password).to.have.length.greaterThan(50);

            // Should be able to verify password
            const isMatch = await bcrypt.compare(userData.password, user.password);
            expect(isMatch).to.be.true;
        });

        it('should encrypt sensitive fields', async () => {
            const userData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
                socialSecurityNumber: '123-45-6789',
                income: 75000,
            };

            const user = new User(userData);
            await user.save();

            // Sensitive fields should be encrypted in database
            const rawUser = await User.findById(user._id).lean();
            expect(rawUser.firstName).to.not.equal(userData.firstName);
            expect(rawUser.lastName).to.not.equal(userData.lastName);
            expect(rawUser.phoneNumber).to.not.equal(userData.phoneNumber);
            expect(rawUser.socialSecurityNumber).to.not.equal(userData.socialSecurityNumber);
        });

        it('should fail validation with missing required fields', async () => {
            const userData = {
                username: 'testuser123',
                email: 'test@example.com',
                // Missing password, firstName, lastName, etc.
            };

            const user = new User(userData);

            try {
                await user.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
                expect(error.errors).to.have.property('password');
                expect(error.errors).to.have.property('firstName');
                expect(error.errors).to.have.property('lastName');
            }
        });

        it('should fail validation with invalid email format', async () => {
            const userData = {
                username: 'testuser123',
                email: 'invalid-email',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            const user = new User(userData);

            try {
                await user.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
                expect(error.errors).to.have.property('email');
            }
        });

        it('should fail validation with weak password', async () => {
            const userData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: '123', // Too short
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            const user = new User(userData);

            try {
                await user.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
                expect(error.errors).to.have.property('password');
            }
        });

        it('should enforce unique username and email', async () => {
            const userData1 = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            const userData2 = {
                username: 'testuser123', // Same username
                email: 'test2@example.com',
                password: 'TestPassword123!',
                firstName: 'Test2',
                lastName: 'User2',
                dateOfBirth: new Date('1991-01-01'),
                phoneNumber: '+1234567891',
                employmentStatus: 'full-time',
            };

            const user1 = new User(userData1);
            await user1.save();

            const user2 = new User(userData2);

            try {
                await user2.save();
                expect.fail('Should have thrown duplicate key error');
            } catch (error) {
                expect(error.code).to.equal(11000); // MongoDB duplicate key error
            }
        });
    });

    describe('User Methods', () => {
        let testUser;

        beforeEach(async () => {
            const userData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            testUser = new User(userData);
            await testUser.save();
        });

        describe('matchPassword', () => {
            it('should return true for correct password', async () => {
                const isMatch = await testUser.matchPassword('TestPassword123!');
                expect(isMatch).to.be.true;
            });

            it('should return false for incorrect password', async () => {
                const isMatch = await testUser.matchPassword('WrongPassword');
                expect(isMatch).to.be.false;
            });
        });

        describe('generatePasswordResetToken', () => {
            it('should generate and set password reset token', () => {
                const token = testUser.generatePasswordResetToken();

                expect(token).to.be.a('string');
                expect(token).to.have.length(40); // 20 bytes hex = 40 chars
                expect(testUser.passwordResetToken).to.exist;
                expect(testUser.passwordResetExpires).to.exist;
                expect(testUser.passwordResetExpires).to.be.above(new Date());
            });
        });

        describe('generateEmailVerificationToken', () => {
            it('should generate and set email verification token', () => {
                const token = testUser.generateEmailVerificationToken();

                expect(token).to.be.a('string');
                expect(token).to.have.length(40);
                expect(testUser.emailVerificationToken).to.exist;
                expect(testUser.emailVerificationExpires).to.exist;
                expect(testUser.emailVerificationExpires).to.be.above(new Date());
            });
        });

        describe('generatePhoneVerificationCode', () => {
            it('should generate and set phone verification code', () => {
                const code = testUser.generatePhoneVerificationCode();

                expect(code).to.be.a('string');
                expect(code).to.have.length(6);
                expect(code).to.match(/^\d{6}$/); // 6 digits
                expect(testUser.phoneVerificationCode).to.exist;
                expect(testUser.phoneVerificationExpires).to.exist;
                expect(testUser.phoneVerificationExpires).to.be.above(new Date());
            });
        });

        describe('incrementLoginAttempts', () => {
            it('should increment login attempts', async () => {
                const initialAttempts = testUser.loginAttempts || 0;
                await testUser.incrementLoginAttempts();

                const updatedUser = await User.findById(testUser._id);
                expect(updatedUser.loginAttempts).to.equal(initialAttempts + 1);
            });

            it('should lock account after 5 failed attempts', async () => {
                // Set login attempts to 4
                testUser.loginAttempts = 4;
                await testUser.save();

                // Increment to 5
                await testUser.incrementLoginAttempts();

                const updatedUser = await User.findById(testUser._id);
                expect(updatedUser.loginAttempts).to.equal(5);
                expect(updatedUser.lockUntil).to.exist;
                expect(updatedUser.lockUntil).to.be.above(new Date());
            });
        });

        describe('resetLoginAttempts', () => {
            it('should reset login attempts and unlock account', async () => {
                testUser.loginAttempts = 3;
                testUser.lockUntil = new Date(Date.now() + 60000);
                await testUser.save();

                await testUser.resetLoginAttempts();

                const updatedUser = await User.findById(testUser._id);
                expect(updatedUser.loginAttempts).to.be.undefined;
                expect(updatedUser.lockUntil).to.be.undefined;
            });
        });

        describe('addRefreshToken', () => {
            it('should add refresh token to user', async () => {
                const token = 'test-refresh-token';
                const ipAddress = '192.168.1.1';
                const userAgent = 'Test Agent';

                await testUser.addRefreshToken(token, ipAddress, userAgent);

                const updatedUser = await User.findById(testUser._id);
                expect(updatedUser.refreshTokens).to.have.length(1);
                expect(updatedUser.refreshTokens[0].token).to.equal(token);
                expect(updatedUser.refreshTokens[0].ipAddress).to.equal(ipAddress);
                expect(updatedUser.refreshTokens[0].userAgent).to.equal(userAgent);
            });

            it('should limit refresh tokens to 5', async () => {
                // Add 6 refresh tokens
                for (let i = 0; i < 6; i++) {
                    await testUser.addRefreshToken(`token-${i}`, '192.168.1.1', 'Test Agent');
                }

                const updatedUser = await User.findById(testUser._id);
                expect(updatedUser.refreshTokens).to.have.length(5);
                expect(updatedUser.refreshTokens[0].token).to.equal('token-1'); // First token removed
            });
        });

        describe('recordGDPRConsent', () => {
            it('should record GDPR consent', async () => {
                const consentType = 'marketing';
                const granted = true;
                const ipAddress = '192.168.1.1';
                const userAgent = 'Test Agent';

                await testUser.recordGDPRConsent(consentType, granted, ipAddress, userAgent);

                const updatedUser = await User.findById(testUser._id);
                expect(updatedUser.gdprConsents).to.have.length(1);
                expect(updatedUser.gdprConsents[0].consentType).to.equal(consentType);
                expect(updatedUser.gdprConsents[0].granted).to.equal(granted);
                expect(updatedUser.gdprConsents[0].ipAddress).to.equal(ipAddress);
            });

            it('should replace existing consent of same type', async () => {
                // Add initial consent
                await testUser.recordGDPRConsent('marketing', true, '192.168.1.1', 'Test Agent');

                // Update consent
                await testUser.recordGDPRConsent('marketing', false, '192.168.1.2', 'Test Agent 2');

                const updatedUser = await User.findById(testUser._id);
                expect(updatedUser.gdprConsents).to.have.length(1);
                expect(updatedUser.gdprConsents[0].granted).to.be.false;
                expect(updatedUser.gdprConsents[0].ipAddress).to.equal('192.168.1.2');
            });
        });

        describe('toSafeObject', () => {
            it('should remove sensitive fields from user object', () => {
                const safeUser = testUser.toSafeObject();

                expect(safeUser).to.not.have.property('password');
                expect(safeUser).to.not.have.property('mfaSecret');
                expect(safeUser).to.not.have.property('mfaBackupCodes');
                expect(safeUser).to.not.have.property('refreshTokens');
                expect(safeUser).to.not.have.property('passwordResetToken');
                expect(safeUser).to.not.have.property('emailVerificationToken');
                expect(safeUser).to.not.have.property('phoneVerificationCode');
                expect(safeUser).to.not.have.property('socialSecurityNumber');
                expect(safeUser).to.not.have.property('loginAttempts');
                expect(safeUser).to.not.have.property('lockUntil');

                // Should still have safe fields
                expect(safeUser).to.have.property('username');
                expect(safeUser).to.have.property('email');
                expect(safeUser).to.have.property('role');
                expect(safeUser).to.have.property('accountStatus');
            });
        });
    });

    describe('Virtual Fields', () => {
        let testUser;

        beforeEach(async () => {
            const userData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                dateOfBirth: new Date('1990-01-01'),
                phoneNumber: '+1234567890',
                employmentStatus: 'full-time',
            };

            testUser = new User(userData);
            await testUser.save();
        });

        describe('fullName', () => {
            it('should return concatenated first and last name', () => {
                expect(testUser.fullName).to.equal('Test User');
            });
        });

        describe('age', () => {
            it('should calculate age from date of birth', () => {
                const currentYear = new Date().getFullYear();
                const birthYear = 1990;
                const expectedAge = currentYear - birthYear;

                expect(testUser.age).to.be.at.least(expectedAge - 1);
                expect(testUser.age).to.be.at.most(expectedAge);
            });
        });

        describe('isAccountLocked', () => {
            it('should return false for unlocked account', () => {
                expect(testUser.isAccountLocked).to.be.false;
            });

            it('should return true for locked account', () => {
                testUser.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
                expect(testUser.isAccountLocked).to.be.true;
            });

            it('should return false for expired lock', () => {
                testUser.lockUntil = new Date(Date.now() - 60000); // 1 minute ago
                expect(testUser.isAccountLocked).to.be.false;
            });
        });

        describe('isKYCVerified', () => {
            it('should return true for verified KYC status', () => {
                testUser.kycStatus = 'verified';
                expect(testUser.isKYCVerified).to.be.true;
            });

            it('should return false for non-verified KYC status', () => {
                testUser.kycStatus = 'pending';
                expect(testUser.isKYCVerified).to.be.false;
            });
        });
    });

    describe('Static Methods', () => {
        beforeEach(async () => {
            // Create test users
            const users = [
                {
                    username: 'user1',
                    email: 'user1@example.com',
                    password: 'Password123!',
                    firstName: 'User',
                    lastName: 'One',
                    dateOfBirth: new Date('1990-01-01'),
                    phoneNumber: '+1234567890',
                    employmentStatus: 'full-time',
                    accountStatus: 'active',
                    emailVerified: true,
                    kycStatus: 'verified',
                },
                {
                    username: 'user2',
                    email: 'user2@example.com',
                    password: 'Password123!',
                    firstName: 'User',
                    lastName: 'Two',
                    dateOfBirth: new Date('1991-01-01'),
                    phoneNumber: '+1234567891',
                    employmentStatus: 'part-time',
                    accountStatus: 'pending',
                    emailVerified: false,
                    kycStatus: 'not_started',
                },
            ];

            for (const userData of users) {
                const user = new User(userData);
                await user.save();
            }
        });

        describe('findByEmail', () => {
            it('should find user by email', async () => {
                const user = await User.findByEmail('user1@example.com');
                expect(user).to.exist;
                expect(user.username).to.equal('user1');
            });

            it('should return null for non-existent email', async () => {
                const user = await User.findByEmail('nonexistent@example.com');
                expect(user).to.be.null;
            });
        });

        describe('findByUsername', () => {
            it('should find user by username', async () => {
                const user = await User.findByUsername('user1');
                expect(user).to.exist;
                expect(user.email).to.equal('user1@example.com');
            });

            it('should return null for non-existent username', async () => {
                const user = await User.findByUsername('nonexistent');
                expect(user).to.be.null;
            });
        });

        describe('getActiveUsers', () => {
            it('should return only active users', async () => {
                const activeUsers = await User.getActiveUsers();
                expect(activeUsers).to.have.length(1);
                expect(activeUsers[0].accountStatus).to.equal('active');
            });
        });

        describe('getVerifiedUsers', () => {
            it('should return only verified users', async () => {
                const verifiedUsers = await User.getVerifiedUsers();
                expect(verifiedUsers).to.have.length(1);
                expect(verifiedUsers[0].accountStatus).to.equal('active');
                expect(verifiedUsers[0].emailVerified).to.be.true;
                expect(verifiedUsers[0].kycStatus).to.equal('verified');
            });
        });
    });

    describe('Indexes', () => {
        it('should have proper indexes for performance', async () => {
            const indexes = await User.collection.getIndexes();

            // Check for required indexes
            const indexNames = Object.keys(indexes);
            expect(indexNames).to.include('email_1');
            expect(indexNames).to.include('username_1');
            expect(indexNames).to.include('walletAddress_1');
        });
    });
});
