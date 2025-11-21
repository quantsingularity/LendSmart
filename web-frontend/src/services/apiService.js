import axios from "axios";

// Get the API base URL from environment variables
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// Create an Axios instance
const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add JWT token to requests if available
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // Or get from AuthContext
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor to handle responses (e.g., for global error handling or token refresh)
apiService.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);

      if (error.response.status === 401) {
        // Handle unauthorized errors, e.g., redirect to login, refresh token
        // localStorage.removeItem("authToken");
        // window.location.href = "/login"; // Or use history.push for React Router
        console.warn(
          "Unauthorized access - 401. Consider redirecting to login.",
        );
      }
      // You might want to throw a more specific error or handle it globally
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API No Response:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Request Setup Error:", error.message);
    }
    return Promise.reject(error.response ? error.response.data : error); // Return error.response.data for easier handling in components
  },
);

// --- Auth Service Calls ---
export const registerUser = (userData) =>
  apiService.post("/auth/register", userData);
export const loginUser = (credentials) =>
  apiService.post("/auth/login", credentials);
export const getUserProfile = () => apiService.get("/auth/me");
export const updateUserProfile = (profileData) =>
  apiService.put("/auth/profile", profileData);

// --- Loan Service Calls ---
export const applyLoan = (loanData) =>
  apiService.post("/loans/apply", loanData);
export const getMarketplaceLoans = (params) =>
  apiService.get("/loans", { params }); // e.g., params = { status: 'pending', page: 1, limit: 10 }
export const getMyLoans = (params) =>
  apiService.get("/loans/my-loans", { params }); // e.g., params = { type: 'borrowed' }
export const getLoanDetails = (loanId) => apiService.get(`/loans/${loanId}`);
export const fundLoan = (loanId, fundingData) =>
  apiService.post(`/loans/${loanId}/fund`, fundingData); // fundingData = { amountToFund: 100 }
export const recordRepayment = (loanId, repaymentData) =>
  apiService.post(`/loans/${loanId}/repay`, repaymentData);
// repaymentData = { installmentNumber: 1, amountPaid: 50, paymentDate: 'YYYY-MM-DD' }

// --- ML Prediction Service Call (if backend exposes it) ---
// Example: Assuming backend has an endpoint /predict/credit-score
export const getCreditPrediction = (applicantData) =>
  apiService.post("/predict/credit-score", applicantData);

export default apiService;
