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

function AuthenticatedRoutes() {
  const { userData, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginPage />;
  if (!userData) return <RegisterPage />;
  if (userData.status === "PENDING") return <PendingApprovalPage />;

  return (
    <Routes>
      <Route path="/" element={<InventoryListPage />} />
      <Route path="/admin" element={<AdminLayout children={<Navigate to="/admin/users" />} />} />
      <Route path="/admin/users" element={<AdminLayout children={<UserManagementPage />} />} />
      <Route path="/admin/inventory" element={<AdminLayout children={<InventoryManagementPage />} />} />
      <Route path="/admin/approvals" element={<AdminLayout children={<RequestApprovalPage />} />} />
      <Route path="/admin/settings" element={<AdminLayout children={<GlobalSettingsPage />} />} />
      <Route path="/admin/logs" element={<AdminLayout children={<TransactionLogPage />} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
