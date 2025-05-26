import axios from "axios";

const API_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";
const ADMIN_ROLE_ID = "5769ed7c-8096-4047-a581-6ffa7c5dafec"; // The UUID from your response

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies handling
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Details:", error.response?.data);
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
    // Store the refresh token as well
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      document.cookie = `directus_refresh_token=${refreshToken}; path=/; max-age=604800`; // 7 days
    }
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    // Clear the cookie too
    document.cookie =
      "directus_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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

    // Store the access token and refresh token
    setAuthToken(response.data.data.access_token);
    localStorage.setItem("refreshToken", response.data.data.refresh_token);

    // Store refresh token in cookie for Directus
    document.cookie = `directus_refresh_token=${response.data.data.refresh_token}; path=/; max-age=604800`; // 7 days

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

    // Use the /users/register endpoint if available, or fall back to standard endpoint
    try {
      const response = await api.post("/users", directusUser);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        // Include the refresh token in the logout request
        await api.post("/auth/logout", { refresh_token: refreshToken });
      } else {
        // Try a token-less logout, this may fail but we'll handle it
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.warn("Server logout failed:", error);
      // We'll handle this error in the component
      throw error;
    } finally {
      // Always clear tokens and state
      setAuthToken(null);
      localStorage.removeItem("userData");
      localStorage.removeItem("refreshToken");
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

  updateProfile: async (userData: {
    first_name?: string;
    last_name?: string;
    password?: string;
    current_password?: string;
  }) => {
    try {
      // Use /users/me endpoint instead of /users/{id}
      // This is more secure and avoids permission issues
      const response = await api.patch("/users/me", userData);

      // Get the current user data
      const currentUser = authService.getCurrentUser();

      // Update local storage with the updated user data
      // But keep some fields like role that aren't returned in the response
      const updatedUser = {
        ...currentUser,
        first_name: userData.first_name || currentUser.first_name,
        last_name: userData.last_name || currentUser.last_name,
      };

      localStorage.setItem("userData", JSON.stringify(updatedUser));

      // Refresh the user data from server
      await authService.getCurrentUserWithRole();

      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  connectMetamask: async (address: string) => {
    try {
      // Use /users/me endpoint instead of /users/{id}
      const response = await api.patch("/users/me", {
        ethereum_address: address,
      });

      // Get the current user data
      const currentUser = authService.getCurrentUser();

      // Update local storage
      const updatedUser = {
        ...currentUser,
        ethereum_address: address,
      };

      localStorage.setItem("userData", JSON.stringify(updatedUser));

      // Refresh the user data from server
      await authService.getCurrentUserWithRole();

      return response.data;
    } catch (error) {
      console.error("Error connecting MetaMask:", error);
      throw error;
    }
  },

  disconnectMetamask: async () => {
    try {
      // Use /users/me endpoint instead of /users/{id}
      const response = await api.patch("/users/me", {
        ethereum_address: null,
      });

      // Get the current user data
      const currentUser = authService.getCurrentUser();

      // Update local storage
      const updatedUser = {
        ...currentUser,
        ethereum_address: null,
      };

      localStorage.setItem("userData", JSON.stringify(updatedUser));

      // Refresh the user data from server
      await authService.getCurrentUserWithRole();

      return response.data;
    } catch (error) {
      console.error("Error disconnecting MetaMask:", error);
      throw error;
    }
  },
};

export default api;
