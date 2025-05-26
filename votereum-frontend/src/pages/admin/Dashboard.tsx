import { useState, useEffect } from "react";
import Layout from "../../components/Layout";

// Mock data - replace with actual API call later
const mockData = {
  totalElections: 5,
  activeElections: 2,
  completedElections: 3,
  totalVoters: 150,
  votedCount: 87,
  participationRate: 58,
  recentVotes: [
    {
      timestamp: "2025-05-25T10:30:00",
      voter: "John Doe",
      election: "Board Election",
      candidate: "Candidate A",
    },
    {
      timestamp: "2025-05-25T09:45:00",
      voter: "Jane Smith",
      election: "Board Election",
      candidate: "Candidate B",
    },
    {
      timestamp: "2025-05-24T16:20:00",
      voter: "Mike Johnson",
      election: "Tech Committee",
      candidate: "Candidate C",
    },
  ],
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockData);
  const [loading, setLoading] = useState(false);

  // Later replace with actual API call
  useEffect(() => {
    // Simulating API call
    setLoading(true);
    setTimeout(() => {
      setStats(mockData);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <div className="text-center py-8">Loading dashboard data...</div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-gray-500 text-sm font-medium">
                Total Elections
              </h2>
              <p className="text-3xl font-bold mt-2">{stats.totalElections}</p>
              <div className="mt-2 text-xs text-gray-500">
                {stats.activeElections} active, {stats.completedElections}{" "}
                completed
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-gray-500 text-sm font-medium">
                Registered Voters
              </h2>
              <p className="text-3xl font-bold mt-2">{stats.totalVoters}</p>
              <div className="mt-2 text-xs text-gray-500">
                {stats.totalVoters - stats.votedCount} have not voted yet
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-gray-500 text-sm font-medium">
                Participation Rate
              </h2>
              <p className="text-3xl font-bold mt-2">
                {stats.participationRate}%
              </p>
              <div className="mt-2 text-xs text-gray-500">
                {stats.votedCount} votes cast
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-medium">Recent Voting Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Voter
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Election
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Choice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentVotes.map((vote, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vote.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vote.voter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vote.election}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vote.candidate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
