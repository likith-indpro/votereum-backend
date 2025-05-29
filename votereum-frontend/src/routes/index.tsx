import { createBrowserRouter } from "react-router-dom";
import AdminDashboard from "../pages/admin/Dashboard";
// import AdminElections from "../pages/admin/Elections";
import CreateElection from "../pages/admin/CreateElection";
// import ManageVoters from "../pages/admin/ManageVoters";
import UserDashboard from "../pages/user/Dasboard";
import UserProfile from "../pages/user/Profile";
import Vote from "../pages/user/Vote";
import Results from "../pages/user/Result";
import Home from "../pages/user/Home";
import About from "../pages/user/About";
import Login from "../pages/user/Login";
import SignUp from "../pages/user/SignUp";
import ProtectedRoute from "../components/ProtectedRoutes";
import NotFound from "../pages/NotFound";
import AdminResults from "../pages/admin/AdminResults";
import Elections from "../pages/user/Elections";
import ManageCandidates from "../pages/admin/ManageCandidates";

const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },

  // User routes
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/elections",
    element: (
      <ProtectedRoute>
        <Elections />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/profile",
    element: (
      <ProtectedRoute>
        <UserProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/vote/:id",
    element: (
      <ProtectedRoute>
        <Vote />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/results/:id",
    element: (
      <ProtectedRoute>
        <Results />
      </ProtectedRoute>
    ),
  },

  // Admin routes
  {
    path: "/admin",
    element: (
      <ProtectedRoute requireAdmin={true}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  //   {
  //     path: "/admin/elections",
  //     element: (
  //       <ProtectedRoute requireAdmin={true}>
  //         <AdminElections />
  //       </ProtectedRoute>
  //     ),
  //   },
  {
    path: "/admin/elections/create",
    element: (
      <ProtectedRoute requireAdmin={true}>
        <CreateElection />
      </ProtectedRoute>
    ),
  },

  {
    path: "/admin/candidates",
    element: (
      <ProtectedRoute requireAdmin={true}>
        <ManageCandidates />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/results",
    element: (
      <ProtectedRoute requireAdmin={true}>
        <AdminResults />
      </ProtectedRoute>
    ),
  },

  //   {
  //     path: "/admin/voters",
  //     element: (
  //       <ProtectedRoute requireAdmin={true}>
  //         <ManageVoters />
  //       </ProtectedRoute>
  //     ),
  //   },

  // 404 route
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
