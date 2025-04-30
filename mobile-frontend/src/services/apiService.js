import axios from 'axios';
import * as Keychain from 'react-native-keychain';

// TODO: Replace with actual API base URL from config or environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'; // Example URL

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add the auth token
apiService.interceptors.request.use(
  async (config) => {
    // No need to read from Keychain here, AuthContext sets the header on login/load
    // If the header is already set, use it. Otherwise, it's an unauthenticated request.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors (e.g., token refresh, global error handling)
apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Example: Handle token expiry and refresh (requires refresh token logic)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Attempting token refresh...');
      try {
        // Assuming you store refreshToken securely (e.g., in Keychain alongside token)
        const credentials = await Keychain.getGenericPassword({ service: 'userAuthData' });
        if (credentials) {
          const storedData = JSON.parse(credentials.password);
          const refreshToken = storedData.refreshToken; // You need to store refreshToken
          
          if (refreshToken) {
            // Replace with your actual refresh token endpoint
            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const { token: newToken, user: newUser, refreshToken: newRefreshToken } = data;
            
            // Update stored credentials
            const newDataToStore = JSON.stringify({ token: newToken, user: newUser, refreshToken: newRefreshToken });
            await Keychain.setGenericPassword('user', newDataToStore, { service: 'userAuthData' });
            
            // Update Authorization header for the original request and future requests
            apiService.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            console.log('Token refreshed successfully.');
            // TODO: Update user state in AuthContext if necessary
            
            return apiService(originalRequest); // Retry the original request
          } else {
             console.error('No refresh token found.');
             // Trigger logout or redirect to login
             // Example: authContext.logout(); // Need access to context or event emitter
          }
        } else {
           console.error('No credentials found for refresh.');
           // Trigger logout
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Trigger logout
        // Example: authContext.logout();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors (e.g., network errors, server errors)
    console.error('API Error:', error.response?.data || error.message);
    
    return Promise.reject(error);
  }
);

export default apiService;

