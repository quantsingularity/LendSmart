# LendSmart Web Frontend

This directory contains the source code for the LendSmart web application, built with React.

## Overview

The web frontend provides a comprehensive interface for users (borrowers, lenders, and administrators) to interact with the LendSmart platform. Key features include:
- User registration, login, and profile management.
- A marketplace for browsing and filtering available loans.
- Loan application process for borrowers.
- Loan funding capabilities for lenders.
- Dashboard for users to manage their active loans, applications, and investments.
- Admin panel for platform management (user management, loan monitoring, etc. - if applicable).
- Integration with wallet extensions (e.g., MetaMask) for blockchain interactions.

## Project Structure

```
web-frontend/
├── public/
│   ├── index.html      # Main HTML file
│   └── manifest.json   # Web app manifest
│   └── ... (other static assets like favicons)
├── src/
│   ├── App.js          # Main application component, sets up routing
│   ├── App.css         # Global styles for App.js
│   ├── index.js        # Entry point of the React application
│   ├── index.css       # Global base styles
│   ├── assets/         # Images, fonts, icons, etc.
│   ├── components/     # Reusable UI components (e.g., Navbar, Footer, Button, Card)
│   │   ├── Footer.js
│   │   └── Navbar.js
│   ├── contexts/       # React Context API for global state (e.g., AuthContext)
│   │   └── AuthContext.js
│   ├── hooks/          # Custom React hooks (e.g., useAuth, useFormInput)
│   ├── pages/          # Top-level page components (e.g., HomePage, LoginPage)
│   │   ├── DashboardPage.js
│   │   ├── HomePage.js
│   │   ├── LoanDetailsPage.js
│   │   ├── LoansMarketplacePage.js
│   │   ├── LoginPage.js
│   │   ├── NotFoundPage.js
│   │   └── RegisterPage.js
│   ├── routes/         # Route configuration (e.g., using React Router DOM)
│   │   └── index.js    # (Or defined directly in App.js)
│   ├── services/       # API service calls and blockchain interactions
│   │   ├── apiService.js
│   │   └── blockchainService.js # (To be created for web3 interactions)
│   ├── utils/          # Utility functions (e.g., validators, formatters)
│   └── theme/          # (Optional) Theming setup (e.g., Material-UI theme, styled-components theme)
├── tests/              # Test files (e.g., using Jest and React Testing Library)
│   └── __tests__/
├── .env.example        # Example environment variables
├── .eslintignore       # ESLint ignore patterns
├── .eslintrc.js        # ESLint configuration
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies and scripts
├── README.md           # This file
└── jsconfig.json or tsconfig.json # JS/TS path configurations
```

## Prerequisites

-   Node.js (LTS version recommended, e.g., v18.x or v20.x)
-   npm or Yarn

## Setup and Installation

1.  **Navigate to the `web-frontend` directory:**
    ```bash
    cd LendSmart/web-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `web-frontend` directory by copying `.env.example` (if it exists, or create one manually):
    ```bash
    cp .env.example .env # If .env.example is provided
    ```
    Update the `.env` file with your backend API URL and other necessary configurations. React environment variables must be prefixed with `REACT_APP_`.
    ```env
    REACT_APP_API_BASE_URL=http://localhost:5000/api # Or your deployed backend URL
    REACT_APP_BLOCKCHAIN_NETWORK_ID= # e.g., 1 for Ethereum Mainnet, 11155111 for Sepolia
    REACT_APP_LOAN_CONTRACT_ADDRESS= # Address of the deployed LoanContract.sol
    # Add other environment variables as needed
    ```

## Running the Application

-   **Development mode:**
    ```bash
    npm start
    # or
    # yarn start
    ```
    This will start the development server, usually on `http://localhost:3000`, and open the application in your default web browser. The page will automatically reload if you make changes to the code.

-   **Production build:**
    ```bash
    npm run build
    # or
    # yarn build
    ```
    This command builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

## Key Libraries Used

-   **React:** Core JavaScript library for building user interfaces.
-   **React Router DOM:** For declarative routing in the application.
-   **Axios (or Fetch API):** For making HTTP requests to the backend API (`src/services/apiService.js`).
-   **Ethers.js / Web3.js:** For interacting with Ethereum smart contracts, typically through browser wallet extensions like MetaMask (`src/services/blockchainService.js`).
-   **React Context API / Redux / Zustand:** For global state management (e.g., `src/contexts/AuthContext.js`).
-   **Styled Components / Material-UI / Tailwind CSS / CSS Modules:** For styling components.
-   **Jest / React Testing Library:** For writing unit and integration tests.

## Development Notes

-   **API Integration:** Backend API calls are managed via `src/services/apiService.js`. Ensure `REACT_APP_API_BASE_URL` is correctly configured in your `.env` file.
-   **Blockchain Integration:** Interactions with smart contracts (e.g., loan funding, repayments) will be handled by `src/services/blockchainService.js`. This service will need to connect to the user's wallet (e.g., MetaMask) and use the configured contract addresses and ABIs.
-   **Routing:** Application navigation is handled by React Router. Define routes in `src/App.js` or a dedicated routing configuration file (e.g., `src/routes/index.js`).
-   **State Management:** Global application state like user authentication is managed using React Context in `src/contexts/`. For more complex state, consider Redux or Zustand.
-   **Styling:** Choose a consistent styling approach (CSS-in-JS, utility classes, or plain CSS/Sass).
-   **Error Handling:** Implement robust error handling for API requests, blockchain transactions, and user inputs.

## Testing

Run tests using:
```bash
npm test
# or
# yarn test
```
This will launch the test runner in interactive watch mode. Test files are typically located in `src/__tests__/` or a top-level `tests/` directory.

## Linting

Run the linter using:
```bash
npm run lint
# or
# yarn lint
```
(Ensure ESLint is configured, typically in `.eslintrc.js`.)

## License

This project is licensed under the [Specify License, e.g., MIT License] - see the `LICENSE` file in the root project directory for details.
