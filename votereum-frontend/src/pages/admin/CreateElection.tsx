import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { electionService, authService } from "../../services/apiService";

export default function CreateElection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    adminWallet: "",
  });

  // Candidates state
  const [candidates, setCandidates] = useState([
    { name: "", description: "", email: "" },
  ]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle candidate input changes
  const handleCandidateChange = (index, e) => {
    const { name, value } = e.target;
    const updatedCandidates = [...candidates];
    updatedCandidates[index] = { ...updatedCandidates[index], [name]: value };
    setCandidates(updatedCandidates);
  };

  // Add new candidate field
  const addCandidate = () => {
    setCandidates([...candidates, { name: "", description: "", email: "" }]);
  };

  // Remove candidate field
  const removeCandidate = (index) => {
    if (candidates.length === 1) return;
    const updatedCandidates = [...candidates];
    updatedCandidates.splice(index, 1);
    setCandidates(updatedCandidates);
  };

  // Fill admin wallet with connected MetaMask
  const fillWithMetaMask = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user && user.ethereum_address) {
        setFormData({
          ...formData,
          adminWallet: user.ethereum_address,
        });
        return;
      }

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setFormData({
          ...formData,
          adminWallet: accounts[0],
        });
      }
    } catch (error) {
      console.error("Error getting MetaMask account:", error);
      setError("Failed to get MetaMask account");
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validation
      if (
        !formData.title ||
        !formData.description ||
        !formData.startTime ||
        !formData.endTime ||
        !formData.adminWallet
      ) {
        throw new Error("Please fill out all required fields");
      }

      if (new Date(formData.startTime) < new Date()) {
        throw new Error("Start time must be in the future");
      }

      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        throw new Error("End time must be after start time");
      }

      if (candidates.some((c) => !c.name)) {
        throw new Error("All candidates must have a name");
      }

      // Format data for API
      const electionData = {
        title: formData.title,
        description: formData.description,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        adminWallet: formData.adminWallet,
        candidatesList: candidates,
      };

      // Create election
      await electionService.createElection(electionData);

      setSuccess("Election created successfully!");

      // Reset form
      setFormData({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        adminWallet: "",
      });

      setCandidates([{ name: "", description: "", email: "" }]);

      // Redirect after a delay
      setTimeout(() => {
        navigate("/admin/elections");
      }, 2000);
    } catch (err) {
      console.error("Error creating election:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create election"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create Election">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Create New Election
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Set up a new blockchain-based election
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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Election Details
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Basic information about the election
                </p>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Brief description of the election purpose
                  </p>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Start Time *
                  </label>
                  <div className="mt-1">
                    <input
                      type="datetime-local"
                      name="startTime"
                      id="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="endTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    End Time *
                  </label>
                  <div className="mt-1">
                    <input
                      type="datetime-local"
                      name="endTime"
                      id="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label
                    htmlFor="adminWallet"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Admin Wallet Address *
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="adminWallet"
                      id="adminWallet"
                      value={formData.adminWallet}
                      onChange={handleInputChange}
                      className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="0x..."
                      required
                    />
                    <button
                      type="button"
                      onClick={fillWithMetaMask}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Use MetaMask
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    This address will have authority over the election
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Candidates
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add candidates for this election
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {candidates.map((candidate, index) => (
                  <div key={index} className="border p-4 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Candidate #{index + 1}
                      </h4>
                      {candidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCandidate(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`name-${index}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Name *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id={`name-${index}`}
                            value={candidate.name}
                            onChange={(e) => handleCandidateChange(index, e)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label
                          htmlFor={`description-${index}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id={`description-${index}`}
                            name="description"
                            rows={2}
                            value={candidate.description}
                            onChange={(e) => handleCandidateChange(index, e)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`email-${index}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="email"
                            id={`email-${index}`}
                            value={candidate.email}
                            onChange={(e) => handleCandidateChange(index, e)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addCandidate}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="-ml-0.5 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Another Candidate
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/admin/elections")}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                    Creating...
                  </span>
                ) : (
                  "Create Election"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
