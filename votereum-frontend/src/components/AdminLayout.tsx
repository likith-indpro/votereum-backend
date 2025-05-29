import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/apiService";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function AdminLayout({
  children,
  title = "Admin Dashboard",
}: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="font-bold text-xl text-blue-600">Votereum Admin</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link to="/admin" className="block p-2 hover:bg-gray-100 rounded">
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/admin/elections/create"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Create Election
              </Link>
            </li>
            <li>
              <Link
                to="/admin/candidates"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Manage Candidates
              </Link>
            </li>

            <li>
              <Link
                to="/admin/results"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Results
              </Link>
            </li>
            <li className="pt-4 mt-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full text-left block p-2 hover:bg-red-50 rounded text-red-600"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <div className="flex items-center">
              {/* User menu / profile */}
              <div className="relative ml-3">
                <div className="flex items-center">
                  <span className="hidden md:block text-sm text-gray-700 mr-2">
                    Administrator
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    A
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4">{children}</main>
      </div>
    </div>
  );
}
