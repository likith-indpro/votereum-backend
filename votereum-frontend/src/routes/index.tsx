import { createBrowserRouter } from "react-router-dom";
import AdminDashboard from "../pages/admin/Dashboard";
import Home from "../pages/user/Home";
import About from "../pages/user/About";

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
    path: "/admin",
    element: <AdminDashboard />,
  },
  // Other routes will be added as we create more pages
]);

export default router;
