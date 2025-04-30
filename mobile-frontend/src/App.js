import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

// TODO: Add WalletConnectModal provider if using WalletConnect
// import { WalletConnectModal } from "@walletconnect/modal-react-native";

// TODO: Configure WalletConnect Project ID
// const walletConnectProjectId = 'YOUR_PROJECT_ID';

// TODO: Configure WalletConnect Provider Metadata
// const providerMetadata = {
//   name: 'LendSmart Mobile',
//   description: 'LendSmart Mobile App',
//   url: 'https://your-project-url.com/', // Replace with your project URL
//   icons: ['https://your-project-url.com/logo.png'], // Replace with your logo URL
//   redirect: {
//     native: 'lendsmart://',
//     universal: 'https://your-project-url.com'
//   }
// };

const AppContent = () => {
  // Use ThemeContext to get the actual theme object for PaperProvider
  const { theme } = React.useContext(ThemeContext);

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
      {/* Render WalletConnectModal here if using WalletConnect */}
      {/* <WalletConnectModal projectId={walletConnectProjectId} providerMetadata={providerMetadata} /> */}
    </PaperProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* Wrap AppContent to access ThemeContext within PaperProvider */}
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;

