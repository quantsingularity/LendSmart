import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext'; // Import WalletProvider
import AppNavigator from './navigation/AppNavigator';

// Import necessary WalletConnect components
import { WalletConnectModal } from "@walletconnect/modal-react-native";
import '@walletconnect/react-native-compat'; // Polyfill for compatibility
import "react-native-get-random-values"; // Required for crypto operations

// --- WalletConnect Configuration ---
// IMPORTANT: Replace with your actual Project ID from https://cloud.walletconnect.com/
const walletConnectProjectId = 'YOUR_WALLETCONNECT_PROJECT_ID'; // <<< MUST BE REPLACED

// Configure Provider Metadata (Information about your DApp)
const providerMetadata = {
  name: 'LendSmart Mobile',
  description: 'LendSmart Mobile - P2P Lending Platform',
  url: 'https://lendsmart.example.com/', // Replace with your project URL
  icons: ['https://lendsmart.example.com/logo.png'], // Replace with your logo URL
  redirect: {
    native: 'lendsmart://', // Your app's deep link scheme
    universal: 'https://lendsmart.example.com' // Your app's universal link
  }
};

// Optional: Session Parameters for WalletConnect
// const sessionParams = { ... };

const AppContent = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
      {/* Render WalletConnectModal globally */}
      <WalletConnectModal
        projectId={walletConnectProjectId}
        providerMetadata={providerMetadata}
        // sessionParams={sessionParams} // Optional
        // themeMode={theme.dark ? 'dark' : 'light'} // Optional: Sync with app theme
        // accentColor={theme.colors.primary} // Optional: Sync with app theme
      />
    </PaperProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* Wrap AppContent with WalletProvider */}
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
