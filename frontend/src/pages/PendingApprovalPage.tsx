import { useAuth } from "../features/auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { auth } from "../lib/firebase";

export default function PendingApprovalPage() {
  const { userData } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-lg">
        <div className="flex justify-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">帳號開通中</h2>
        <p className="text-gray-600">
          親愛的 {userData?.displayName}，您的註冊申請已送出。<br />
          請耐心等待管理員核准後即可開始使用系統。
        </p>
        <div className="pt-4">
          <Button variant="secondary" onClick={() => auth.signOut()}>
            登出
          </Button>
        </div>
      </div>
    </div>
  );
}
