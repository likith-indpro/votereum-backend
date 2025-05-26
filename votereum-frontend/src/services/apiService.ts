import axios from "axios";

const API_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";
const BLOCKCHAIN_ENDPOINT = `${API_URL}/blockchain-voting`;
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

// Authentication Service
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
    avatar?: string;
  }) => {
    try {
      // Use /users/me endpoint instead of /users/{id}
      const response = await api.patch("/users/me", userData);

      // Get the current user data
      const currentUser = authService.getCurrentUser();

      // Update local storage with the updated user data
      // But keep some fields like role that aren't returned in the response
      const updatedUser = {
        ...currentUser,
        first_name: userData.first_name || currentUser.first_name,
        last_name: userData.last_name || currentUser.last_name,
        // Include avatar if present
        avatar: userData.avatar ? userData.avatar : currentUser.avatar,
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

  uploadAvatar: async (file: File): Promise<string> => {
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file to Directus Files
      const response = await api.post("/files", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Return the file ID
      return response.data.data.id;
    } catch (error) {
      console.error("Error uploading avatar:", error);
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

  verifyMetaMaskSignature: async (message: string, signature: string) => {
    try {
      const response = await api.post(
        `${BLOCKCHAIN_ENDPOINT}/verify-signature`,
        {
          message,
          signature,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying signature:", error);
      throw error;
    }
  },
};

// Election Service for blockchain integration
export const electionService = {
  // Get all elections
  getElections: async () => {
    try {
      const response = await api.get("/items/elections");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching elections:", error);
      throw error;
    }
  },

  // Get single election details
  getElection: async (id: string) => {
    try {
      const response = await api.get(`/items/elections/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching election ${id}:`, error);
      throw error;
    }
  },

  // Get candidates for an election
  getCandidates: async (electionId: string) => {
    try {
      const response = await api.get(`/items/candidates`, {
        params: {
          filter: { election: { _eq: electionId } },
        },
      });
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching candidates for election ${electionId}:`,
        error
      );
      throw error;
    }
  },

  // Check if user is eligible to vote in an election
  checkEligibility: async (electionId: string) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error("User not authenticated");

      // For development/testing: If the eligibility API isn't working yet,
      // assume the user is eligible for all elections
      try {
        const response = await api.get(`/items/voters`, {
          params: {
            filter: {
              election: { _eq: electionId },
              voter_user: { _eq: currentUser.id },
            },
          },
        });

        // If there's a record, the user is eligible
        return response.data.data.length > 0
          ? { eligible: true, voted: response.data.data[0].voted }
          : { eligible: true, voted: false }; // TEMPORARY: return eligible=true until API is fixed
      } catch (error) {
        console.error(
          `Error checking eligibility for election ${electionId}:`,
          error
        );
        // TEMPORARY: return eligible=true for testing until API is fixed
        return { eligible: true, voted: false };
      }
    } catch (error) {
      console.error(
        `Error checking eligibility for election ${electionId}:`,
        error
      );
      throw error;
    }
  },

  // Vote in an election
  vote: async (electionId: string, candidateId: string) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error("User not authenticated");

      // Make sure user has connected MetaMask
      if (!currentUser.ethereum_address) {
        throw new Error("Please connect your MetaMask wallet before voting");
      }

      // Get message to sign
      const message = `Vote in election ${electionId} for candidate ${candidateId}`;

      // Request signature from user
      // This will need to be handled from UI using window.ethereum
      // Here we handle it as if the signature was already provided
      const signature = await requestSignatureFromUser(message);

      // Send vote to blockchain endpoint
      const response = await api.post(`${BLOCKCHAIN_ENDPOINT}/vote`, {
        electionId,
        candidateId,
        voterAddress: currentUser.ethereum_address,
        signature,
        message,
      });

      return response.data;
    } catch (error) {
      console.error(`Error voting in election ${electionId}:`, error);
      throw error;
    }
  },

  // Get election results from blockchain
  getResults: async (electionId: string) => {
    try {
      const response = await api.get(
        `${BLOCKCHAIN_ENDPOINT}/election/${electionId}/results`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching results for election ${electionId}:`,
        error
      );
      throw error;
    }
  },

  // Admin: Create a new election
  createElection: async (electionData: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    candidatesList: Array<{
      name: string;
      description?: string;
      img?: string;
      email?: string;
    }>;
    adminWallet: string;
    company_meta_id?: string;
  }) => {
    try {
      const response = await api.post(
        `${BLOCKCHAIN_ENDPOINT}/election`,
        electionData
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating election:", error);
      throw error;
    }
  },
};

// Helper function to request signature from user
// This is called from the vote function
const requestSignatureFromUser = async (message: string): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Connect to MetaMask if not already connected
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect MetaMask first.");
    }

    // Request signature from the user
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, accounts[0]],
    });

    return signature;
  } catch (error) {
    console.error("Error requesting signature:", error);
    throw error;
  }
};

export default api;
