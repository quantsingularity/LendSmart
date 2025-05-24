import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { BrowserRouter as Router, MemoryRouter } from 'react-router-dom';
import Layout from '../../code/web-frontend/src/components/Layout'; // Adjusted import path
import { AuthProvider } from '../../code/web-frontend/src/context/AuthContext'; // Actual AuthProvider
import { ThemeProvider as AppThemeProvider } from '../../code/web-frontend/src/theme/ThemeContext'; // Actual ThemeProvider
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

// Mock useAuth and useThemeMode from their actual context providers
let mockIsAuthenticated = false;
let mockUserProfile = null;
const mockConnectWallet = jest.fn();
const mockDisconnectWallet = jest.fn();
let mockThemeMode = 'light';
const mockToggleColorMode = jest.fn();

jest.mock('../../code/web-frontend/src/context/AuthContext', () => ({
  ...jest.requireActual('../../code/web-frontend/src/context/AuthContext'),
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    userProfile: mockUserProfile,
    connectWallet: mockConnectWallet,
    disconnectWallet: mockDisconnectWallet,
  }),
}));

jest.mock('../../code/web-frontend/src/theme/ThemeContext', () => ({
  ...jest.requireActual('../../code/web-frontend/src/theme/ThemeContext'),
  useThemeMode: () => ({
    mode: mockThemeMode,
    toggleColorMode: mockToggleColorMode,
  }),
}));

// MUI Theme and Router wrapper
const muiTheme = createTheme();
const AllTheProviders = ({ children, initialRoutes = ['/'] }) => {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <AppThemeProvider> {/* Our app's theme provider */}
        <AuthProvider>   {/* Our app's auth provider */}
          <MemoryRouter initialEntries={initialRoutes}>
            {children}
          </MemoryRouter>
        </AuthProvider>
      </AppThemeProvider>
    </MuiThemeProvider>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    mockUserProfile = null;
    mockConnectWallet.mockClear();
    mockDisconnectWallet.mockClear();
    mockThemeMode = 'light';
    mockToggleColorMode.mockClear();
    // Mock matchMedia for useMediaQuery
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('md') ? false : true, // Default to desktop, or true if not md query
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('renders Layout with header, child content, and footer', () => {
    render(
      <Layout>
        <div>Main Content Area</div>
      </Layout>,
      { wrapper: AllTheProviders }
    );

    // Check for Header (AppBar)
    expect(screen.getByRole('banner')).toBeInTheDocument(); // AppBar has role 'banner'
    expect(screen.getByText('LendSmart')).toBeInTheDocument(); // Logo text

    // Check for Child Content
    expect(screen.getByText('Main Content Area')).toBeInTheDocument();

    // Check for Footer
    // The footer is a Box with component="footer", so we can look for that role
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer has role 'contentinfo'
    expect(within(screen.getByRole('contentinfo')).getByText('LendSmart')).toBeInTheDocument(); // Logo in footer
  });

  test('displays "Connect Wallet" button when not authenticated', () => {
    mockIsAuthenticated = false;
    render(<Layout><div>Child</div></Layout>, { wrapper: AllTheProviders });
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
  });

  test('displays user profile chip and menu when authenticated', () => {
    mockIsAuthenticated = true;
    mockUserProfile = { shortAddress: '0x123...abc', name: 'Test User' };
    render(<Layout><div>Child</div></Layout>, { wrapper: AllTheProviders });

    expect(screen.queryByRole('button', { name: /Connect Wallet/i })).not.toBeInTheDocument();
    expect(screen.getByText('0x123...abc')).toBeInTheDocument(); // Profile chip label
  });

  test('navigation links are present in the header (desktop view)', () => {
    render(<Layout><div>Child</div></Layout>, { wrapper: AllTheProviders });
    // Desktop view by default with mock
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Apply for Loan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Marketplace' })).toBeInTheDocument();
  });

  test('theme toggle button works', () => {
    render(<Layout><div>Child</div></Layout>, { wrapper: AllTheProviders });
    const themeToggleButton = screen.getByRole('button', { name: /Light Mode|Dark Mode/i }); // It will be 'Light Mode' or 'Dark Mode' based on mockThemeMode
    fireEvent.click(themeToggleButton);
    expect(mockToggleColorMode).toHaveBeenCalledTimes(1);
  });

  test('mobile drawer can be opened and shows navigation links', () => {
    // Simulate mobile view
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('(max-width:900px)') ? true : false, // md breakpoint
          media: query,
          onchange: null,
          addListener: jest.fn(), 
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

    render(<Layout><div>Child</div></Layout>, { wrapper: AllTheProviders });

    const menuButton = screen.getByRole('button', { name: /open drawer/i });
    fireEvent.click(menuButton);

    // Drawer should be visible (MUI Drawer might not have a simple role, check for content)
    // Let's check for a link that is typically in the drawer
    // The drawer itself is a 'dialog' role when open
    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Apply for Loan' })).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Marketplace' })).toBeInTheDocument();
  });

  test('profile menu opens and shows links when authenticated', async () => {
    mockIsAuthenticated = true;
    mockUserProfile = { shortAddress: '0xTest...User', name: 'Test User' };
    render(<Layout><div>Child</div></Layout>, { wrapper: AllTheProviders });

    const profileChip = screen.getByText('0xTest...User');
    fireEvent.click(profileChip);

    // Menu items should appear
    await screen.findByRole('menuitem', { name: /Profile/i });
    expect(screen.getByRole('menuitem', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Disconnect Wallet/i })).toBeInTheDocument();
  });

   test('disconnect wallet from profile menu calls disconnectWallet', async () => {
    mockIsAuthenticated = true;
    mockUserProfile = { shortAddress: '0xTest...User', name: 'Test User' };
    render(<Layout><div>Child</div></Layout>, { wrapper: AllTheProviders });

    const profileChip = screen.getByText('0xTest...User');
    fireEvent.click(profileChip);

    const disconnectButton = await screen.findByRole('menuitem', { name: /Disconnect Wallet/i });
    fireEvent.click(disconnectButton);
    expect(mockDisconnectWallet).toHaveBeenCalledTimes(1);
  });

});

