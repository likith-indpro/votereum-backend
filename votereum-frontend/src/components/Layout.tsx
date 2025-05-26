import { ReactNode } from "react";
import { Link } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
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
                to="/admin/votes"
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Vote Management
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
              <Link
                to="/"
                className="block p-2 hover:bg-gray-100 rounded text-gray-600"
              >
                Exit Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Admin Dashboard
            </h1>
            <div>
              {/* User menu / profile */}
              <span className="text-sm text-gray-600">Admin User</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4">{children}</main>
      </div>
    </div>
  );
}
