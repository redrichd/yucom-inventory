import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider";
import RegisterPage from "./pages/RegisterPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import InventoryListPage from "./pages/InventoryListPage";
import AdminLayout from "./components/layout/AdminLayout";
import UserManagementPage from "./pages/admin/UserManagementPage";
import InventoryManagementPage from "./pages/admin/InventoryManagementPage";
import RequestApprovalPage from "./pages/admin/RequestApprovalPage";
import GlobalSettingsPage from "./pages/admin/GlobalSettingsPage";
import TransactionLogPage from "./pages/admin/TransactionLogPage";
import LoginPage from "./pages/LoginPage";
import MyRequestsPage from "./pages/MyRequestsPage";

function AuthenticatedRoutes() {
  const { userData, user, loading } = useAuth();

  // 1. 還在讀取 Firebase 資料時顯示讀取中
  if (loading) return <div className="flex h-screen items-center justify-center">載入中...</div>;

  // 2. 沒登入 LINE，去登入頁
  if (!user) return <LoginPage />;

  // 3. 登入了但資料庫沒這筆資料（新使用者），去註冊頁
  if (!userData) return <RegisterPage />;

  // 4. 重點修正：如果還沒通過審核 (isApproved 為 false)，顯示開通中頁面
  // 這樣你就不用管 status 是不是 PENDING 了，只要後台勾選通過就進得去
  if (!userData.isApproved) return <PendingApprovalPage />;

  // 5. 通過審核後的路由
  return (
    <Routes>
      <Route path="/" element={<InventoryListPage />} />
      <Route path="/my-requests" element={<MyRequestsPage />} />
      {/* 管理員路徑 */}
      <Route path="/admin" element={<AdminLayout><Navigate to="/admin/users" /></AdminLayout>} />
      <Route path="/admin/users" element={<AdminLayout><UserManagementPage /></AdminLayout>} />
      <Route path="/admin/inventory" element={<AdminLayout><InventoryManagementPage /></AdminLayout>} />
      <Route path="/admin/approvals" element={<AdminLayout><RequestApprovalPage /></AdminLayout>} />
      <Route path="/admin/settings" element={<AdminLayout><GlobalSettingsPage /></AdminLayout>} />
      <Route path="/admin/logs" element={<AdminLayout><TransactionLogPage /></AdminLayout>} />
      {/* 萬用路徑：找不到頁面就回首頁 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

import Background3D from "./components/ui/Background3D";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Background3D />
        <AuthenticatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}