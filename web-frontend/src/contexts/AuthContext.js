import React, { createContext, useState, useEffect, useCallback } from "react";
// import apiService from "./services/apiService"; // Assuming you have an apiService

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To check initial auth status
  const [token, setToken] = useState(localStorage.getItem("lendsmart_token"));

  const updateUserAndToken = useCallback((userData, newToken) => {
    setUser(userData);
    if (newToken) {
      setToken(newToken);
      localStorage.setItem("lendsmart_token", newToken);
    } else {
      localStorage.removeItem("lendsmart_token");
    }
  }, []);

  // Effect to load user on initial app load if token exists
  useEffect(() => {
    const loadUserFromToken = async () => {
      if (token) {
        try {
          // This is where you would typically call your backend to verify the token
          // and get user data. For now, we simulate it or assume token is valid.
          // const response = await apiService.auth.getMe();
          // setUser(response.data.user);
          console.log("AuthContext: Token found, would attempt to load user.");
          // Placeholder: if you have a way to decode token locally for basic info (not recommended for sensitive data)
          // For a real app, always verify with backend.
        } catch (error) {
          console.error("AuthContext: Failed to load user from token", error);
          localStorage.removeItem("lendsmart_token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUserFromToken();
  }, [token]);

  const login = useCallback(async (credentials) => {
    // try {
    //   const response = await apiService.auth.login(credentials);
    //   updateUserAndToken(response.data.user, response.data.token);
    //   return response.data.user;
    // } catch (error) {
    //   console.error("Login failed:", error);
    //   throw error; // Re-throw to be caught by the calling component
    // }
    console.log("AuthContext: login called (simulated)", credentials);
    // Simulate login
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (credentials.email === "test@example.com" && credentials.password === "password") {
                const mockUser = { id: "1", username: "TestUser", email: "test@example.com", role: "borrower" };
                const mockToken = "fake-jwt-token";
                updateUserAndToken(mockUser, mockToken);
                resolve(mockUser);
            } else {
                reject(new Error("Invalid credentials (simulated)"));
            }
        }, 500);
    });
  }, [updateUserAndToken]);

  const register = useCallback(async (userData) => {
    // try {
    //   const response = await apiService.auth.register(userData);
    //   // Optionally log in the user directly after registration
    //   // updateUserAndToken(response.data.user, response.data.token);
    //   return response.data; // Or response.data.user
    // } catch (error) {
    //   console.error("Registration failed:", error);
    //   throw error;
    // }
    console.log("AuthContext: register called (simulated)", userData);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (userData.email === "existing@example.com") {
                reject(new Error("Email already exists (simulated)"));
            } else {
                const mockUser = { id: "new", username: userData.username, email: userData.email, role: userData.role };
                // Don't set token or user here, registration usually requires login separately
                resolve({ user: mockUser, message: "Registration successful (simulated)" });
            }
        }, 500);
    });
  }, []); // Removed updateUserAndToken from dependencies as it's not used for setting user state here

  const logout = useCallback(() => {
    // try {
    //   // Optional: Call backend logout endpoint if it exists (e.g., to invalidate session/token server-side)
    //   // await apiService.auth.logout();
    // } catch (error) {
    //   console.error("Logout failed on server:", error);
    //   // Still proceed with client-side logout
    // }
    updateUserAndToken(null, null);
    console.log("AuthContext: logout called");
    // Here you might want to redirect to login page using useNavigate if this context has access to router
    // Or, components listening to user state will re-render and handle redirection.
  }, [updateUserAndToken]);

  const authContextValue = {
    user,
    token,
    isAuthenticated: !!user, // Or !!token, depending on your auth flow
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children} {/* Render children only after initial loading is done */}
    </AuthContext.Provider>
  );
};

export default AuthContext;
