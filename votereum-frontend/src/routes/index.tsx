import { createBrowserRouter } from "react-router-dom";
import AdminDashboard from "../pages/admin/Dashboard";

// Will add more routes as we build more pages
const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Home Page - Coming Soon</div>,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
]);

export default router;
