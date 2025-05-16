# LendSmart Backend

This directory contains the backend server for the LendSmart application.

## Overview

The backend is built using Node.js and Express.js. It provides a RESTful API for the web and mobile frontends to interact with the application's data and business logic. Key features include user authentication, loan management, and integration with the machine learning model for credit scoring and the blockchain for smart contract interactions.

## Project Structure

```
backend/
├── config/             # Configuration files (database, environment variables)
├── controllers/        # Request handlers, business logic layer
├── middlewares/        # Custom Express middleware (e.g., authentication, error handling)
├── models/             # Database schemas/models (e.g., Mongoose models)
├── routes/             # API route definitions
├── services/           # Business logic services (e.g., authService, loanService)
├── src/                # Main application source (server.js, app.js)
├── tests/              # API and unit tests
├── .env.example        # Example environment variables file
├── .eslintrc.js        # ESLint configuration
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies and scripts
└── README.md           # This file
```

## Prerequisites

- Node.js (v18.x or later recommended)
- npm (or yarn)
- MongoDB (or a MongoDB Atlas account)

## Setup and Installation

1.  **Clone the repository (if not already done):**
    ```bash
    git clone <repository_url>
    cd LendSmart/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your specific configurations:
    ```
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    JWT_EXPIRES_IN=1d
    # Add other environment variables as needed (e.g., API keys for external services)
    ```

## Running the Application

-   **Development mode (with hot-reloading using nodemon):**
    ```bash
    npm run dev
    ```

-   **Production mode:**
    ```bash
    npm start
    ```

The server will typically start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

(This section should be populated as API routes are developed. Consider using a tool like Swagger/OpenAPI for detailed documentation.)

-   **Authentication:**
    -   `POST /api/auth/register` - Register a new user
    -   `POST /api/auth/login` - Login an existing user
    -   `GET /api/auth/me` - Get current user profile (requires token)
    -   `POST /api/auth/logout` - Logout user (optional, depends on token strategy)
-   **Loans:**
    -   `POST /api/loans/apply` - Apply for a new loan
    -   `GET /api/loans` - Get all loans (for marketplace, admin)
    -   `GET /api/loans/my-loans` - Get loans for the authenticated user
    -   `GET /api/loans/:id` - Get details of a specific loan
    -   `POST /api/loans/:id/repay` - Make a repayment on a loan
-   **Admin (Example):**
    -   `GET /api/admin/users` - Get all users
    -   `PUT /api/admin/users/:id/status` - Update user status

## Testing

To run tests:
```bash
npm test
```
(Ensure you have Jest and Supertest configured as dev dependencies, and test files are created in the `tests/` directory.)

## Linting

To lint the codebase:
```bash
npm run lint
```
(Ensure ESLint is configured.)

## Contributing

Please refer to the main project's `CONTRIBUTING.md` for guidelines.

## License

This project is licensed under the [Specify License, e.g., MIT License] - see the `LICENSE` file in the root project directory for details.

