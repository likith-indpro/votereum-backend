import { createBrowserRouter } from "react-router-dom";
import AdminDashboard from "../pages/admin/Dashboard";
import Home from "../pages/user/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
  // Other routes will be added as we create more pages
]);

export default router;
