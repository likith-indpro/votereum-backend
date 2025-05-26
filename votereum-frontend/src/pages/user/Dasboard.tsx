// Update UserDashboard to fetch and display real elections
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../../components/UserLayout";
import { electionService } from "../../services/apiService";

export default function UserDashboard() {
  const [elections, setElections] = useState([]);
  const [userEligibility, setUserEligibility] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const electionData = await electionService.getElections();
        setElections(electionData);

        // Check eligibility for each election
        const eligibilityData = {};
        for (const election of electionData) {
          try {
            const eligibility = await electionService.checkEligibility(
              election.id
            );
            eligibilityData[election.id] = eligibility;
          } catch (err) {
            console.error(
              `Error checking eligibility for election ${election.id}:`,
              err
            );
          }
        }
        setUserEligibility(eligibilityData);
      } catch (err) {
        setError("Failed to load elections");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate status and time remaining
  const getElectionStatus = (election) => {
    const now = new Date();
    const startDate = new Date(election.start_time);
    const endDate = new Date(election.end_time);

    if (now < startDate) {
      const daysRemaining = Math.ceil(
        (startDate - now) / (1000 * 60 * 60 * 24)
      );
      return {
        status: "upcoming",
        text: `Opens in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`,
      };
    } else if (now > endDate) {
      return { status: "closed", text: "Election closed" };
    } else {
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return {
        status: "open",
        text: `Closing in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`,
      };
    }
  };

  return (
    <UserLayout title="Dashboard">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Your Voting Status
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Current elections you can participate in.
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <svg
              className="animate-spin h-8 w-8 mx-auto text-blue-500"
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
            <p className="mt-2 text-gray-600">Loading elections...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : elections.length === 0 ? (
          <div className="p-6 text-center">
            <p>No elections are currently available for you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {elections.map((election) => {
              const statusInfo = getElectionStatus(election);
              const eligibility = userEligibility[election.id] || {
                eligible: false,
                voted: false,
              };

              return (
                <div
                  key={election.id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold">{election.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {statusInfo.text}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusInfo.status === "open"
                          ? "bg-green-100 text-green-800"
                          : statusInfo.status === "upcoming"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusInfo.status === "open"
                        ? "Open"
                        : statusInfo.status === "upcoming"
                          ? "Upcoming"
                          : "Closed"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    {election.description}
                  </p>

                  <div className="mt-4">
                    {statusInfo.status === "open" &&
                      eligibility.eligible &&
                      !eligibility.voted && (
                        <Link
                          to={`/dashboard/vote/${election.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Vote Now
                        </Link>
                      )}

                    {eligibility.voted && (
                      <Link
                        to={`/dashboard/results/${election.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Results
                      </Link>
                    )}

                    {statusInfo.status === "upcoming" && (
                      <span className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white">
                        Coming Soon
                      </span>
                    )}

                    {!eligibility.eligible && statusInfo.status === "open" && (
                      <span className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-500 bg-gray-50">
                        Not Eligible
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Voting History
          </h3>
          <div className="mt-4 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
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
                      {elections
                        .filter(
                          (election) => userEligibility[election.id]?.voted
                        )
                        .map((election) => (
                          <tr key={election.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {election.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(election.end_time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Voted
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Link
                                to={`/dashboard/results/${election.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Results
                              </Link>
                            </td>
                          </tr>
                        ))}
                      {elections.filter(
                        (election) => userEligibility[election.id]?.voted
                      ).length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            You haven't voted in any elections yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
