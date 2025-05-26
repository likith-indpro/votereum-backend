import axios from "axios";

const API_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";
const ADMIN_ROLE_ID = "5769ed7c-8096-4047-a581-6ffa7c5dafec"; // The UUID from your response

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Directus error responses
    const errorMessage =
      error.response?.data?.errors?.[0]?.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(errorMessage));
  }
);

// Set the auth token for authenticated requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("authToken", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("authToken");
  }
};

// Initialize token from localStorage
const token = localStorage.getItem("authToken");
if (token) {
  setAuthToken(token);
}

export const authService = {
  login: async (email: string, password: string) => {
    // First, authenticate with Directus
    const response = await api.post("/auth/login", { email, password });

    // Store the access token
    setAuthToken(response.data.data.access_token);

    // Then, fetch the current user to get complete role information
    const userResponse = await api.get("/users/me");
    localStorage.setItem("userData", JSON.stringify(userResponse.data.data));

    return {
      ...response.data,
      userData: userResponse.data.data,
    };
  },

  loginWithMetamask: async (address: string, signature: string) => {
    // This would be your custom endpoint to verify ethereum signatures
    const response = await api.post("/auth/login/metamask", {
      address,
      signature,
    });

    // Store the access token
    setAuthToken(response.data.data.access_token);

    // Then, fetch the current user to get complete role information
    const userResponse = await api.get("/users/me");
    localStorage.setItem("userData", JSON.stringify(userResponse.data.data));

    return {
      ...response.data,
      userData: userResponse.data.data,
    };
  },

  signup: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    // Map the form fields to match Directus user fields
    const directusUser = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password,
      // Default to regular user role
    };

    const response = await api.post("/users", directusUser);
    return response.data;
  },

  signupWithMetamask: async (
    address: string,
    userData: {
      firstName: string;
      lastName: string;
      email: string;
    }
  ) => {
    // This would be your custom endpoint to register users with ethereum addresses
    const response = await api.post("/users/metamask", {
      address,
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      // Always clear local storage and remove the token
      setAuthToken(null);
      localStorage.removeItem("userData");
    }
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  },

  getCurrentUserWithRole: async () => {
    try {
      // Check if token exists
      const token = localStorage.getItem("authToken");
      if (!token) return null;

      // Fetch current user data including role
      const response = await api.get("/users/me");
      const userData = response.data.data;

      // Update localStorage with fresh user data
      localStorage.setItem("userData", JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  },

  isAdmin: async () => {
    try {
      const userData = await authService.getCurrentUserWithRole();
      return userData && userData.role === ADMIN_ROLE_ID;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  },
};

export default api;
