import { useState, useEffect } from "react";
import UserLayout from "../../components/UserLayout";
import { authService } from "../../services/apiService";

export default function Profile() {
  // State for user form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // State for MetaMask
  const [ethereumAddress, setEthereumAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // State for form submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);

  useEffect(() => {
    // Load user data
    const userData = authService.getCurrentUser();
    if (userData) {
      setFormData({
        ...formData,
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        email: userData.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Check if user has connected Ethereum address
      if (userData.ethereum_address) {
        setEthereumAddress(userData.ethereum_address);
        setIsConnected(true);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validate password if changing
      if (passwordChangeMode) {
        if (!formData.currentPassword) {
          throw new Error("Current password is required");
        }

        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("New passwords don't match");
        }

        if (formData.newPassword && formData.newPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
      }

      // Prepare data for update
      const updateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
      };

      // Add password change if needed
      if (passwordChangeMode && formData.newPassword) {
        updateData.password = formData.newPassword;
        updateData.current_password = formData.currentPassword;
      }

      // Call API to update user
      await authService.updateProfile(updateData);

      // Refresh user data to get the latest info
      await authService.getCurrentUserWithRole();

      // Update local form data with the latest from storage
      const updatedUser = authService.getCurrentUser();
      setFormData({
        ...formData,
        firstName: updatedUser.first_name || "",
        lastName: updatedUser.last_name || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Profile updated successfully!");

      // Reset password fields
      if (passwordChangeMode) {
        setPasswordChangeMode(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const connectMetamask = async () => {
    setError("");
    setIsConnecting(true);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error(
          "MetaMask is not installed. Please install it to connect your wallet."
        );
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Get the connected address
      const address = accounts[0];

      // Update user profile with Ethereum address
      await authService.connectMetamask(address);

      // Get updated user data
      await authService.getCurrentUserWithRole();
      const updatedUser = authService.getCurrentUser();

      // Update state
      setEthereumAddress(updatedUser.ethereum_address || address);
      setIsConnected(true);
      setSuccess("Ethereum wallet connected successfully!");
    } catch (err) {
      console.error("Failed to connect MetaMask:", err);
      if (err instanceof Error) {
        if (err.message.includes("User rejected")) {
          setError("You rejected the connection request.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to connect with MetaMask");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectMetamask = async () => {
    setError("");
    setIsConnecting(true);

    try {
      // Update user profile to remove Ethereum address
      await authService.disconnectMetamask();

      // Refresh user data
      await authService.getCurrentUserWithRole();

      // Update state
      setEthereumAddress("");
      setIsConnected(false);
      setSuccess("Ethereum wallet disconnected successfully!");
    } catch (err) {
      console.error("Failed to disconnect MetaMask:", err);
      setError(
        err instanceof Error ? err.message : "Failed to disconnect wallet"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <UserLayout title="Profile Management">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Personal Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Update your account details and preferences.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                disabled
                value={formData.email}
                className="mt-1 bg-gray-100 cursor-not-allowed block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email address cannot be changed. Please contact support if
                needed.
              </p>
            </div>

            {!passwordChangeMode ? (
              <div>
                <button
                  type="button"
                  onClick={() => setPasswordChangeMode(true)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <div className="space-y-4 bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">
                    Change Password
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordChangeMode(false);
                      setFormData({
                        ...formData,
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Ethereum Connection Section */}
        <div className="px-4 py-5 border-t border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Blockchain Wallet
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Connect your Ethereum wallet to verify your identity and sign
            transactions.
          </p>
        </div>

        <div className="p-4">
          {isConnected ? (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Connected Wallet
                  </h4>
                  <div className="mt-1 flex items-center">
                    <svg
                      className="h-5 w-5 text-orange-500 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-900">
                      {ethereumAddress.slice(0, 6)}...
                      {ethereumAddress.slice(-4)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={disconnectMetamask}
                  disabled={isConnecting}
                  className="mt-2 sm:mt-0 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isConnecting ? "Processing..." : "Disconnect Wallet"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No wallet connected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Connect your Ethereum wallet to use blockchain features.
                </p>
                <div className="mt-4">
                  <button
                    onClick={connectMetamask}
                    disabled={isConnecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Connecting...
                      </span>
                    ) : (
                      <>
                        <svg
                          className="-ml-0.5 mr-2 h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm10.293-4.707a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L12.586 10l-1.293-1.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Connect MetaMask
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
