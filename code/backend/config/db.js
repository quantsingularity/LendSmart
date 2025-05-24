const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load env vars if not already loaded (e.g., in server.js)
// dotenv.config({ path: "./.env" }); // Adjust path if your .env is elsewhere relative to this file

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Mongoose 6 deprecated these options, they are now default
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true, // Not supported
            // useFindAndModify: false // Not supported
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;

