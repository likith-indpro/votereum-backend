import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import UserLayout from "../../components/UserLayout";
import { electionService, authService } from "../../services/apiService";

export default function Results() {
  const [election, setElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = useParams();

  const API_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";

  useEffect(() => {
    const fetchResults = async () => {
      if (!id) return;

      try {
        // Get election details
        const electionData = await electionService.getElection(id);
        setElection(electionData);

        // Get results from blockchain
        const resultsData = await electionService.getResults(id);

        // Sort by vote count (descending)
        const sortedResults = [...resultsData].sort(
          (a, b) => parseInt(b.voteCount) - parseInt(a.voteCount)
        );

        setResults(sortedResults);
      } catch (err) {
        console.error("Error loading election results:", err);
        setError("Failed to load election results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  // Calculate total votes
  const totalVotes = results.reduce(
    (sum, candidate) => sum + parseInt(candidate.voteCount || "0"),
    0
  );

  // Calculate percentage
  const getPercentage = (votes) => {
    if (!totalVotes) return 0;
    return Math.round((parseInt(votes) / totalVotes) * 100);
  };

  if (loading) {
    return (
      <UserLayout title="Election Results">
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
            <p className="mt-2 text-gray-600">Loading results...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout
      title={election?.name ? `Results: ${election.name}` : "Election Results"}
    >
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {election?.name}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {election?.description}
          </p>
        </div>

        {error ? (
          <div className="px-4 py-5 sm:p-6 text-center">
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
              Error Loading Results
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-blue-900">
                    Election Summary
                  </h4>
                  <span className="text-sm text-blue-700">
                    Total Votes: {totalVotes}
                  </span>
                </div>

                {/* Election status info */}
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Start:</span>{" "}
                    {new Date(election?.start_time).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">End:</span>{" "}
                    {new Date(election?.end_time).toLocaleString()}
                  </div>
                </div>
              </div>

              <h4 className="text-base font-medium text-gray-900 mb-4">
                Results
              </h4>

              {results.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No results available for this election yet.
                </p>
              ) : (
                <div className="space-y-6">
                  {results.map((result, index) => {
                    const percentage = getPercentage(result.voteCount);

                    return (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="font-medium text-gray-900 flex-1">
                            {index === 0 && parseInt(result.voteCount) > 0 && (
                              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold mr-2 px-2 py-0.5 rounded">
                                Leading
                              </span>
                            )}
                            {result.name}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {percentage}%
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <div className="mt-2 text-sm text-gray-500">
                          {result.voteCount} votes
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Results are stored securely on the blockchain and cannot be
                tampered with. The election address is:{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">
                  {election?.blockchain_address}
                </code>
              </p>
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
}
