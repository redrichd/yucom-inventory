import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { auth } from "../../lib/firebase";
import { Button } from "../ui/Button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userData } = useAuth();
  const navigate = useNavigate();

  if (userData?.role === "USER") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">管理後台</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/users" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md">
            使用者管理
          </Link>
          <Link to="/admin/inventory" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md">
            庫存修正
          </Link>
          <Link to="/admin/approvals" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md">
            申請單審核
          </Link>
          <div className="pt-4 border-t border-gray-100">
             <Link to="/" className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md font-bold">
               前往物資申請 (前端)
             </Link>
          </div>
          {userData?.role === "SUPER_ADMIN" && (
             <Link to="/admin/settings" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md">
               全域設定
             </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Button variant="secondary" className="w-full" onClick={() => auth.signOut()}>
            登出
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
