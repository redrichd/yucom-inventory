import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { storage, db } from "../../lib/firebase";
import { Button } from "../../components/ui/Button";
import { Image as ImageIcon } from "lucide-react";

export default function GlobalSettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists()) {
        setLogoUrl(snap.data().logoUrl);
      }
    } catch (error) {
      console.error("讀取 LOGO 失敗:", error);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const storageRef = ref(storage, `logo/company_logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // 將網址存入 Firestore
      await setDoc(doc(db, "settings", "global"), { logoUrl: url }, { merge: true });
      
      setLogoUrl(url);
      setFile(null);
      alert("LOGO 上傳並更新成功！");
    } catch (error) {
      console.error("上傳失敗:", error);
      alert("上傳失敗，請檢查權限設定。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">全域系統設定</h1>
        <p className="text-gray-500 font-medium">在此管理系統的視覺與企業標識。</p>
      </div>
      
      <div className="glass-card p-8 space-y-8 bg-white/80 backdrop-blur-xl border border-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">企業標識設定</h2>
            <p className="text-xs text-gray-400">這將更換首頁與瀏覽器分頁的圖示</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <p className="text-sm text-gray-500 font-bold mb-3">目前的企業 LOGO：</p>
            <div className="p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[200px] transition-all group-hover:bg-blue-50/30 group-hover:border-blue-200">
              {logoUrl ? (
                <img src={logoUrl} alt="Current Logo" className="max-h-32 object-contain drop-shadow-xl" />
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="w-12 h-12 text-gray-200 mx-auto" />
                  <p className="text-gray-400 text-sm">尚未設定企業 LOGO</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700">選擇新圖片</label>
            <div className="flex flex-col gap-4">
              <input 
                type="file" 
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all file:cursor-pointer"
                onChange={e => setFile(e.target.files?.[0] || null)} 
              />
              <Button 
                onClick={handleUpload} 
                disabled={loading || !file} 
                className="w-full py-4 text-lg bg-gray-900 hover:bg-black shadow-xl shadow-gray-200"
              >
                {loading ? "正在處理中..." : "上傳並更新 LOGO"}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center italic">
              建議上傳正方形且背景透明的 PNG 檔案，以獲得最佳顯示效果。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
