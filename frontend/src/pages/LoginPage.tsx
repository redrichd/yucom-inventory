import { signInWithPopup } from "firebase/auth";
import { auth, lineProvider } from "../lib/firebase";
import { Button } from "../components/ui/Button";

export default function LoginPage() {
  const handleLineLogin = async () => {
    try {
      const result = await signInWithPopup(auth, lineProvider);
      console.log("登入成功！使用者名稱：", result.user.displayName);
      // AuthProvider 會自動偵測狀態改變並導向註冊或首頁
    } catch (error) {
      console.error("LINE 登入發生錯誤：", error);
      alert("登入失敗，請確認是否已在 LINE 開發者後台將頻道設為 Published，且 Firebase 已設定 LINE 橫幅。");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">悠康物資管理</h1>
        <p className="text-gray-500">請使用 LINE 帳號登入系統</p>
        
        <div className="py-8 flex justify-center">
          {/* 加入 LINE 綠色的品牌感 */}
          <Button 
            onClick={handleLineLogin} 
            className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-4 text-lg font-bold rounded-full flex items-center justify-center gap-3 transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
               <path d="M24 10.3c0-4.5-4.5-8.3-10.1-8.3C8.3 2 3.8 5.8 3.8 10.3c0 4 3.6 7.3 8.3 8.1.3 0 .7.3.8.7l.3 1.8c0 .2.4.4.6.2l3.4-3.4c2.8-1 4.8-4 4.8-7.4z"/>
            </svg>
            使用 LINE 登入
          </Button>
        </div>
        
        <p className="text-xs text-gray-400">登入即代表您同意本系統之使用規範</p>
      </div>
    </div>
  );
}
