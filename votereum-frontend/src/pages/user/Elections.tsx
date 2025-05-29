import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../../components/UserLayout";
import { electionService } from "../../services/apiService";

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [userEligibility, setUserEligibility] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        const electionData = await electionService.getElections();
        console.log("Fetched elections:", electionData);
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
            eligibilityData[election.id] = { eligible: false, voted: false };
          }
        }
        setUserEligibility(eligibilityData);
      } catch (err) {
        setError("Failed to load elections");
        console.error("Error fetching elections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  // Calculate status and time remaining
  const getElectionStatus = (election) => {
    const now = new Date();
    const startDate = new Date(election.start_time || election.startTime);
    const endDate = new Date(election.end_time || election.endTime);

    if (now < startDate) {
      const daysRemaining = Math.max(
        1,
        Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))
      );
      return {
        status: "upcoming",
        text: `Opens in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`,
      };
    } else if (now > endDate) {
      return { status: "closed", text: "Election closed" };
    } else {
      const daysRemaining = Math.max(
        1,
        Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
      );
      return {
        status: "open",
        text: `Closing in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`,
      };
    }
  };

  return (
    <UserLayout title="Elections">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Available Elections
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View all current and past elections you can participate in.
          </p>
        </div>

        {loading ? (
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
              <p className="mt-2 text-gray-600">Loading elections...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="p-6">
            {elections.length === 0 ? (
              <div className="text-center p-10">
                <p className="text-gray-500">No elections are available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {elections.map((election) => {
                  const statusInfo = getElectionStatus(election);
                  const eligibility = userEligibility[election.id] || {
                    eligible: true,
                    voted: false,
                  };

                  return (
                    <div
                      key={election.id}
                      className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">
                            {election.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-2">
                            {election.description}
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

                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>
                            <span className="font-medium">Start:</span>{" "}
                            {new Date(election.start_time).toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">End:</span>{" "}
                            {new Date(election.end_time).toLocaleString()}
                          </p>
                          <p className="italic">{statusInfo.text}</p>
                        </div>

                        <div className="mt-4 sm:mt-0 flex space-x-3">
                          {statusInfo.status === "open" &&
                            eligibility.eligible &&
                            !eligibility.voted && (
                              <Link
                                to={`/dashboard/vote/${election.id}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Vote Now
                              </Link>
                            )}

                          {(eligibility.voted ||
                            statusInfo.status === "closed") && (
                            <Link
                              to={`/dashboard/results/${election.id}`}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              View Results
                            </Link>
                          )}

                          {statusInfo.status === "upcoming" && (
                            <span className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-50 cursor-not-allowed">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
