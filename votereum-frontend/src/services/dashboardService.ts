import axios from "axios";

const API_URL = "http://localhost:8055"; // Your backend API URL

export const getDashboardStats = async () => {
  // For development/testing, use this mock data
  const mockData = {
    totalElections: 5,
    activeElections: 2,
    completedElections: 3,
    totalVoters: 150,
    votedCount: 87,
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
    participationByElection: [
      { id: "1", name: "Board Election", total_voters: 100, voted_count: 62 },
      { id: "2", name: "Tech Committee", total_voters: 50, voted_count: 25 },
    ],
  };

  // Uncomment this when your backend API is ready
  // const token = localStorage.getItem('authToken');
  // return await axios.get(
  //   `${API_URL}/blockchain-voting/dashboard/stats`,
  //   {
  //     headers: { Authorization: `Bearer ${token}` }
  //   }
  // );

  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: mockData });
    }, 500);
  });
};
