import { createBrowserRouter } from "react-router-dom";
import AdminDashboard from "../pages/admin/Dashboard";
import UserDashboard from "../pages/user/Dasboard";
import Home from "../pages/user/Home";
import About from "../pages/user/About";
import Login from "../pages/user/Login";
import SignUp from "../pages/user/SignUp";
import ProtectedRoute from "../components/ProtectedRoutes";

const router = createBrowserRouter([
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
  {
    path: "/admin",
    element: (
      <ProtectedRoute requireAdmin={true}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  // Other routes will be added as we create more pages
]);

export default router;
