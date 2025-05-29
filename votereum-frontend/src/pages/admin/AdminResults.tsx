// Remove voter analytics section

// Simplified version without detailed voter analytics
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { electionService } from "../../services/apiService";

export default function AdminResults() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [results, setResults] = useState([]);
  const [electionDetails, setElectionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalVoters: 0,
    votesCount: 0,
    participationRate: 0,
  });

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

  // Fetch results when an election is selected
  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedElection) {
        setResults([]);
        setElectionDetails(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch election details
        const electionData =
          await electionService.getElection(selectedElection);
        setElectionDetails(electionData);

        // Fetch results for the selected election from blockchain
        const resultsData = await electionService.getResults(selectedElection);
        setResults(resultsData);

        // Fetch voter statistics
        const voters = await electionService.getVoters(selectedElection);
        const totalVoters = voters.length;
        const votesCount = voters.filter((voter) => voter.voted).length;
        const participationRate =
          totalVoters > 0 ? ((votesCount / totalVoters) * 100).toFixed(2) : 0;

        setStats({
          totalVoters,
          votesCount,
          participationRate,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load election results");
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedElection]);

  const handleElectionChange = (e) => {
    setSelectedElection(e.target.value);
  };

  // Calculate total votes
  const totalVotes = results.reduce(
    (sum, candidate) => sum + (candidate.voteCount || 0),
    0
  );

  // Function to export results as CSV
  const exportToCSV = () => {
    if (!results.length) return;

    // Create CSV content
    let csvContent = "Candidate Name,Votes,Percentage\n";

    results.forEach((candidate) => {
      const percentage =
        totalVotes > 0
          ? ((candidate.voteCount / totalVotes) * 100).toFixed(2)
          : "0.00";

      csvContent += `"${candidate.name}",${candidate.voteCount},${percentage}%\n`;
    });

    // Add statistics
    csvContent += "\nElection Statistics\n";
    csvContent += `Total Eligible Voters,${stats.totalVoters}\n`;
    csvContent += `Total Votes Cast,${stats.votesCount}\n`;
    csvContent += `Participation Rate,${stats.participationRate}%\n`;

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create a link element and trigger download
    const link = document.createElement("a");
    const electionName = electionDetails?.name || "election-results";
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${electionName.toLowerCase().replace(/\s+/g, "-")}-results.csv`
    );
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Election Results">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Election Results
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View detailed election results and generate reports
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

          {selectedElection && electionDetails && !loading && (
            <>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {electionDetails.name}
                </h4>
                <p className="text-gray-600">{electionDetails.description}</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h5 className="text-sm font-medium text-gray-500">
                      Duration
                    </h5>
                    <p className="mt-1 text-lg font-semibold">
                      {new Date(
                        electionDetails.start_time
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(electionDetails.end_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Results</h4>
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    disabled={!results.length}
                  >
                    Export CSV
                  </button>
                </div>

                {results.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No results available for this election yet.
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
                            Rank
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Candidate
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Votes
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results
                          .sort((a, b) => b.voteCount - a.voteCount)
                          .map((candidate, index) => {
                            const percentage =
                              totalVotes > 0
                                ? (
                                    (candidate.voteCount / totalVotes) *
                                    100
                                  ).toFixed(2)
                                : "0.00";

                            return (
                              <tr
                                key={candidate.id}
                                className={index === 0 ? "bg-green-50" : ""}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    #{index + 1}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {candidate.name}
                                      </div>
                                      {candidate.description && (
                                        <div className="text-sm text-gray-500">
                                          {candidate.description.substring(
                                            0,
                                            60
                                          )}
                                          {candidate.description.length > 60
                                            ? "..."
                                            : ""}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {candidate.voteCount}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                                    <div
                                      className="bg-blue-600 h-2.5 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {percentage}%
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  disabled={!results.length}
                >
                  Download Full Report
                </button>
              </div>
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
                    Please select an election to view its results.
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
