import { useEffect, useState } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, lineProvider } from "../lib/firebase";
import { Button } from "../components/ui/Button";

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 處理重新導向後的結果
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("重新導向登入成功！", result.user.displayName);
        }
      })
      .catch((error) => {
        console.error("重新導向登入失敗：", error);
        if (error.code !== 'auth/internal-error') {
          alert("登入失敗，請嘗試點擊右上角「...」並選擇「使用預設瀏覽器開啟」再登入。");
        }
      });
  }, []);

  const handleLineLogin = async () => {
    try {
      setIsLoggingIn(true);
      // 偵測是否為行動裝置
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // 行動裝置（尤其是 LINE 瀏覽器）強烈建議使用 Redirect
        await signInWithRedirect(auth, lineProvider);
      } else {
        const result = await signInWithPopup(auth, lineProvider);
        console.log("登入成功！使用者名稱：", result.user.displayName);
      }
    } catch (error: any) {
      console.error("LINE 登入發生錯誤：", error);
      setIsLoggingIn(false);
      alert("登入失敗：" + (error.message || "未知錯誤"));
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
            disabled={isLoggingIn}
            className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-4 text-lg font-bold rounded-full flex items-center justify-center gap-3 transition-transform hover:scale-105 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
               <path d="M24 10.3c0-4.5-4.5-8.3-10.1-8.3C8.3 2 3.8 5.8 3.8 10.3c0 4 3.6 7.3 8.3 8.1.3 0 .7.3.8.7l.3 1.8c0 .2.4.4.6.2l3.4-3.4c2.8-1 4.8-4 4.8-7.4z"/>
            </svg>
            {isLoggingIn ? "登入中..." : "使用 LINE 登入"}
          </Button>
        </div>
        
        <p className="text-xs text-gray-400">登入即代表您同意本系統之使用規範</p>
      </div>
    </div>
  );
}
