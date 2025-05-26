import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserLayout from "../../components/UserLayout";
import { electionService, authService } from "../../services/apiService";

export default function Vote() {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [eligibility, setEligibility] = useState({
    eligible: false,
    voted: false,
  });
  const { id } = useParams();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";

  useEffect(() => {
    const fetchElectionData = async () => {
      if (!id) return;

      try {
        // Check if user is connected to MetaMask
        const userData = authService.getCurrentUser();
        if (!userData?.ethereum_address) {
          setError(
            "Please connect your MetaMask wallet in your profile settings before voting"
          );
          setLoading(false);
          return;
        }

        // Get election details
        const electionData = await electionService.getElection(id);
        setElection(electionData);

        // Get candidates
        const candidatesData = await electionService.getCandidates(id);
        setCandidates(candidatesData);

        // Check eligibility
        const eligibilityData = await electionService.checkEligibility(id);
        setEligibility(eligibilityData);

        // If already voted or not eligible, redirect
        if (eligibilityData.voted) {
          navigate(`/dashboard/results/${id}`);
          return;
        }

        if (!eligibilityData.eligible) {
          setError("You are not eligible to vote in this election");
        }
      } catch (err) {
        console.error("Error loading election data:", err);
        setError("Failed to load election data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchElectionData();
  }, [id, navigate]);

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidate(candidateId);
  };

  const handleSubmitVote = async () => {
    if (!selectedCandidate) {
      setError("Please select a candidate");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await electionService.vote(id, selectedCandidate);
      // Redirect to results page on successful vote
      navigate(`/dashboard/results/${id}`);
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError(err instanceof Error ? err.message : "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <UserLayout title="Vote">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <svg
              className="animate-spin h-10 w-10 mx-auto text-blue-500"
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
            <p className="mt-2 text-gray-600">Loading election data...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (error && !eligibility.eligible) {
    return (
      <UserLayout title="Vote">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Not Eligible
              </h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title={election?.name || "Vote"}>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {election?.name}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {election?.description}
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

        <div className="px-4 py-5 sm:p-6">
          <p className="mb-4 text-sm text-gray-600">
            Please select one candidate from the list below:
          </p>

          <div className="space-y-4 mt-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCandidate === candidate.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => handleCandidateSelect(candidate.id)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {candidate.img ? (
                      <img
                        src={`${API_URL}/assets/${candidate.img}`}
                        alt={candidate.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-500">
                        {candidate.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium text-gray-900">
                      {candidate.name}
                    </div>
                    {candidate.description && (
                      <div className="text-sm text-gray-500">
                        {candidate.description}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <input
                      type="radio"
                      name="candidate"
                      checked={selectedCandidate === candidate.id}
                      onChange={() => handleCandidateSelect(candidate.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSubmitVote}
              disabled={
                !selectedCandidate || submitting || !eligibility.eligible
              }
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? (
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
                  Processing Vote...
                </span>
              ) : (
                "Cast Your Vote"
              )}
            </button>
            <p className="mt-2 text-xs text-center text-gray-500">
              Note: This action cannot be undone. Your vote will be securely
              recorded on the blockchain.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
