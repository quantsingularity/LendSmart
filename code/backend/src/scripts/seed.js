require('dotenv').config({ path: __dirname + '/../.env' }); // Adjust path to .env if seed script is in a subfolder
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/UserModel');
const Loan = require('../models/LoanModel');
const bcrypt = require('bcryptjs');

// Connect to DB
connectDB();

const users = [
    {
        username: 'adminUser',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        walletAddress: '0xAdminWalletAddress001',
    },
    {
        username: 'borrower1',
        email: 'borrower1@example.com',
        password: 'password123',
        role: 'borrower',
        firstName: 'John',
        lastName: 'Doe',
        walletAddress: '0xBorrowerWalletAddress001',
    },
    {
        username: 'lender1',
        email: 'lender1@example.com',
        password: 'password123',
        role: 'lender',
        firstName: 'Jane',
        lastName: 'Smith',
        walletAddress: '0xLenderWalletAddress001',
    },
];

const loans = (
    userRefs, // This will be an object like { adminUserId: "mongoId", borrower1Id: "mongoId", ... }
) => [
    {
        borrower: userRefs.borrower1Id,
        amount: 1000,
        interestRate: 5.5,
        term: 12,
        termUnit: 'months',
        status: 'marketplace',
        purpose: 'Home renovation',
        collateral: 'Second-hand car',
    },
    {
        borrower: userRefs.borrower1Id,
        lender: userRefs.lender1Id,
        amount: 5000,
        interestRate: 4.0,
        term: 24,
        termUnit: 'months',
        status: 'active',
        purpose: 'Small business expansion',
        fundedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        firstPaymentDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    },
    {
        borrower: userRefs.adminUserId, // Admin can also be a borrower for testing
        amount: 200,
        interestRate: 10,
        term: 30,
        termUnit: 'days',
        status: 'pending_approval',
        purpose: 'Emergency fund',
    },
];

const importData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Loan.deleteMany();
        console.log('Old data cleared...');

        // Create users and get their IDs
        const createdUsers = await User.insertMany(
            users.map((user) => {
                // Note: Password hashing is handled by the pre-save hook in UserModel
                // If not using insertMany or if hook doesn't run, hash here or save individually.
                // For insertMany, hooks are NOT executed by default. So we need to save them one by one or hash passwords before.
                return user; // For now, assuming we might need to adjust this if hooks don't run with insertMany
            }),
        );

        // Let's save users one by one to ensure hooks run
        await User.deleteMany(); // Clear again before individual save
        const userRefs = {};
        const savedUsers = [];
        for (const userData of users) {
            const user = new User(userData);
            const savedUser = await user.save();
            savedUsers.push(savedUser);
            if (userData.username === 'adminUser') userRefs.adminUserId = savedUser._id;
            if (userData.username === 'borrower1') userRefs.borrower1Id = savedUser._id;
            if (userData.username === 'lender1') userRefs.lender1Id = savedUser._id;
        }
        console.log(`${savedUsers.length} Users Imported...`);

        // Create loans with references to created users
        const sampleLoans = loans(userRefs);
        await Loan.insertMany(sampleLoans);
        console.log(`${sampleLoans.length} Loans Imported...`);

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();
        await Loan.deleteMany();
        console.log('Data Destroyed Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error with data destruction:', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
