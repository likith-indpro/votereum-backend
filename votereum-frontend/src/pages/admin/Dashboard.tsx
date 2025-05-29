import AdminLayout from "../../components/AdminLayout";
import { useEffect, useState } from "react";
import { electionService } from "../../services/apiService";

export default function AdminDashboard() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all elections
        const electionData = await electionService.getElections();
        console.log("Admin: Fetched elections", electionData);

        setElections(electionData);

        // Additional dashboard data can be fetched here
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Platform Overview
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Key metrics and administrative controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-blue-700">
              Active Elections
            </h4>
            <p className="text-3xl font-bold mt-2">3</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-green-700">
              Total Users
            </h4>
            <p className="text-3xl font-bold mt-2">256</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-purple-700">
              Total Votes Cast
            </h4>
            <p className="text-3xl font-bold mt-2">1,024</p>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Election
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Vote Cast
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    John Doe
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Student Council 2023
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2 minutes ago
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    New User Registered
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Alice Smith
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    15 minutes ago
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Election Created
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Admin User
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Faculty Senate 2023
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    1 hour ago
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Elections
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {elections.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No elections found
                    </td>
                  </tr>
                ) : (
                  elections.map((election) => {
                    const now = new Date();
                    const startDate = new Date(election.start_time);
                    const endDate = new Date(election.end_time);

                    let status = "upcoming";
                    if (now > endDate) status = "closed";
                    else if (now >= startDate) status = "active";

                    return (
                      <tr key={election.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {election.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(election.start_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(election.end_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${
                  status === "active"
                    ? "bg-green-100 text-green-800"
                    : status === "upcoming"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`/admin/results/${election.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Results
                          </a>
                          <a
                            href={`/admin/elections/${election.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Details
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
