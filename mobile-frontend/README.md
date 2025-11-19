# LendSmart Mobile Frontend

This directory contains the source code for the LendSmart mobile application, built with React Native.

## Overview

The mobile app provides users (borrowers and lenders) with a native experience to interact with the LendSmart platform. Key features include:
- User registration and login.
- Browsing available loans in the marketplace.
- Applying for new loans (for borrowers).
- Funding loans (for lenders).
- Managing user profiles and loan portfolios.
- Viewing transaction history.
- Wallet integration for interacting with smart contracts (e.g., for loan disbursement and repayments).

## Project Structure

```
mobile-frontend/
├── android/            # Android specific project files
├── ios/                # iOS specific project files
├── src/
│   ├── App.js          # Main application component
│   ├── assets/         # Images, fonts, and other static assets
│   ├── components/     # Reusable UI components (e.g., Button, Card, InputField)
│   ├── config/         # Application configuration (e.g., API endpoints, keys)
│   │   └── index.js
│   ├── constants/      # Global constants (e.g., colors, dimensions, action types)
│   │   ├── colors.js
│   │   └── dimensions.js
│   ├── contexts/       # React Context API for global state management
│   │   ├── AuthContext.js
│   │   ├── LoanContext.js
│   │   ├── ThemeContext.js
│   │   └── WalletContext.js
│   ├── features/       # Feature-specific modules (screens, components, services)
│   │   ├── Auth/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   │   ├── LoginScreen.js
│   │   │   │   └── RegisterScreen.js
│   │   │   └── services/ (authService.js - API calls for auth)
│   │   ├── Dashboard/
│   │   │   └── DashboardScreen.js
│   │   ├── Loans/
│   │   │   ├── LoanApplicationScreen.js
│   │   │   ├── MarketplaceScreen.js
│   │   │   └── screens/
│   │   │       └── LoanDetailsScreen.js
│   │   └── Profile/
│   │       └── ProfileScreen.js
│   ├── hooks/          # Custom React hooks (e.g., useAuth, useForm)
│   ├── navigation/     # Navigation setup (React Navigation)
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   ├── MainTabNavigator.js
│   │   └── MarketplaceNavigator.js
│   ├── services/       # Global services (e.g., API client, blockchain interaction)
│   │   ├── apiService.js
│   │   └── blockchainService.js
│   ├── theme/          # Theming configuration (e.g., light/dark mode styles)
│   │   └── theme.js
│   ├── types/          # TypeScript type definitions (if using TypeScript)
│   └── utils/          # Utility functions (e.g., helpers, validators)
│       └── helpers.js
├── tests/              # Unit and integration tests (e.g., using Jest and React Native Testing Library)
│   └── __tests__/
├── .env.example        # Example environment variables
├── .eslintrc.js        # ESLint configuration
├── .gitignore          # Git ignore file
├── babel.config.js     # Babel configuration
├── index.js            # Entry point for the React Native application
├── metro.config.js     # Metro bundler configuration
├── package.json        # Project dependencies and scripts
└── README.md           # This file
```

## Prerequisites

-   Node.js (LTS version recommended)
-   npm or Yarn
-   React Native CLI (or Expo CLI if using Expo)
-   Android Studio (for Android development) with JDK and Android SDK
-   Xcode (for iOS development, macOS only)
-   CocoaPods (for iOS dependency management)

Refer to the [React Native Environment Setup Guide](https://reactnative.dev/docs/environment-setup) for detailed instructions.

## Setup and Installation

1.  **Navigate to the `mobile-frontend` directory:**
    ```bash
    cd LendSmart/mobile-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Install iOS dependencies (if on macOS):**
    ```bash
    cd ios
    pod install
    cd ..
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the `mobile-frontend` directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your backend API URL and other necessary configurations:
    ```
    API_BASE_URL=http://localhost:5000/api # Or your deployed backend URL
    # Add other environment variables as needed (e.g., blockchain network RPC, contract addresses)
    ```
    Ensure these variables are correctly accessed in your `src/config/index.js` or similar.

## Running the Application

1.  **Start the Metro Bundler:**
    Open a terminal in the `mobile-frontend` directory and run:
    ```bash
    npm start
    # or
    # yarn start
    ```

2.  **Run on Android:**
    -   Ensure an Android emulator is running or a physical device is connected and configured for debugging.
    -   In a new terminal window (in the `mobile-frontend` directory), run:
        ```bash
        npm run android
        # or
        # yarn android
        ```

3.  **Run on iOS (macOS only):**
    -   Ensure an iOS simulator is running or a physical device is connected.
    -   In a new terminal window (in the `mobile-frontend` directory), run:
        ```bash
        npm run ios
        # or
        # yarn ios
        ```

## Key Libraries Used

-   **React Native:** Core framework.
-   **React Navigation:** For routing and navigation.
-   **Axios (or Fetch API):** For making HTTP requests to the backend API.
-   **Ethers.js / Web3.js:** For interacting with Ethereum smart contracts (via `blockchainService.js`).
-   **React Context API / Redux / Zustand:** For state management.
-   **Styled Components / React Native StyleSheet:** For styling.
-   **Jest / React Native Testing Library:** For testing.

## Development Notes

-   **API Integration:** All backend API calls are managed through `src/services/apiService.js`. Ensure the `API_BASE_URL` is correctly configured.
-   **Blockchain Integration:** Interactions with smart contracts are handled by `src/services/blockchainService.js`. This service will require configuration for the network, contract addresses, and ABIs.
-   **State Management:** Global state (e.g., authentication status, user profile, theme) is managed using React Context API in `src/contexts/`. Consider more robust solutions like Redux or Zustand for larger applications.
-   **Styling:** Consistent styling is maintained using a combination of `StyleSheet` and potentially a theming solution in `src/theme/`.
-   **Error Handling:** Implement comprehensive error handling for API calls, blockchain interactions, and user inputs.

## Testing

Run tests using:
```bash
npm test
# or
# yarn test
```
Test files are located in the `tests/__tests__/` directory.

## Linting

Run the linter using:
```bash
npm run lint
# or
# yarn lint
```
(Ensure ESLint is configured in `.eslintrc.js`)

## License

This project is licensed under the [Specify License, e.g., MIT License] - see the `LICENSE` file in the root project directory for details.
