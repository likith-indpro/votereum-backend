import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { electionService } from "../../services/apiService";

export default function ManageCandidates() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";

  // Fetch elections on component mount
  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        const data = await electionService.getElections();
        setElections(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching elections:", err);
        setError("Failed to load elections");
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  // Fetch candidates when an election is selected
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!selectedElection) {
        setCandidates([]);
        return;
      }

      try {
        setLoading(true);
        const candidatesData =
          await electionService.getCandidates(selectedElection);
        setCandidates(candidatesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching candidates:", err);
        setError("Failed to load candidates");
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [selectedElection]);

  const handleElectionChange = (e) => {
    setSelectedElection(e.target.value);
    setEditingCandidate(null);
    setIsEditing(false);
    setFormData({ name: "", description: "", email: "" });
    setSuccess("");
    setError("");
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name || "",
      description: candidate.description || "",
      email: candidate.email || "",
    });
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Replace the handleSubmit function with this implementation

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Candidate name is required");
      return;
    }

    try {
      setLoading(true);

      // Call the API service to update the candidate
      await electionService.updateCandidate(
        selectedElection,
        editingCandidate.id,
        {
          name: formData.name,
          description: formData.description,
          email: formData.email,
        }
      );

      // Update the candidates list locally
      const updatedCandidates = candidates.map((c) =>
        c.id === editingCandidate.id ? { ...c, ...formData } : c
      );

      setCandidates(updatedCandidates);
      setSuccess("Candidate updated successfully");
      setIsEditing(false);
      setEditingCandidate(null);
      setFormData({ name: "", description: "", email: "" });
    } catch (err) {
      console.error("Error updating candidate:", err);
      setError("Failed to update candidate");
    } finally {
      setLoading(false);
    }
  };
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingCandidate(null);
    setFormData({ name: "", description: "", email: "" });
    setError("");
  };

  return (
    <AdminLayout title="Manage Candidates">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Election Candidates
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and manage candidates for your elections
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {/* Election selector */}
          <div className="mb-6">
            <label
              htmlFor="election"
              className="block text-sm font-medium text-gray-700"
            >
              Select Election
            </label>
            <select
              id="election"
              name="election"
              value={selectedElection}
              onChange={handleElectionChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">-- Select an election --</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.name}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-blue-500"
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
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
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

          {selectedElection && !loading && (
            <>
              {isEditing ? (
                <div className="bg-gray-50 p-6 rounded-lg mt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Edit Candidate
                  </h4>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <textarea
                          name="description"
                          id="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex space-x-3">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div className="mt-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Candidates
                    </h4>
                    {candidates.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No candidates found for this election.
                      </p>
                    ) : (
                      <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Name
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Description
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Email
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {candidates.map((candidate) => (
                              <tr key={candidate.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {candidate.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-500 line-clamp-2">
                                    {candidate.description || "-"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {candidate.email || "-"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() =>
                                      handleEditCandidate(candidate)
                                    }
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/admin/elections/create")}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Create New Election
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {!selectedElection && !loading && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Please select an election to manage its candidates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
