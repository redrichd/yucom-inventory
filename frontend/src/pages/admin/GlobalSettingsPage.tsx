import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { storage, db } from "../../lib/firebase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Trash2, MapPin } from "lucide-react";

export default function GlobalSettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [regions, setRegions] = useState<{id: string, name: string}[]>([]);
  const [newRegionName, setNewRegionName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    const q = query(collection(db, "regions"), orderBy("name"));
    const snap = await getDocs(q);
    setRegions(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
  };

  const handleAddRegion = async () => {
    if (!newRegionName.trim()) return;
    try {
      setLoading(true);
      await addDoc(collection(db, "regions"), { name: newRegionName.trim() });
      setNewRegionName("");
      await fetchRegions();
      alert("區域新增成功！");
    } catch (error) {
      alert("新增失敗，請確認權限。");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegion = async (id: string, name: string) => {
    if (!window.confirm(`確定要刪除「${name}」嗎？這可能會影響現有使用者的區域歸屬。`)) return;
    try {
      await deleteDoc(doc(db, "regions", id));
      await fetchRegions();
    } catch (error) {
      alert("刪除失敗");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const storageRef = ref(storage, `logo/company_logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
      alert("LOGO 上傳成功！");
    } catch (error) {
      alert("上傳失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 p-4">
      <h1 className="text-2xl font-black text-gray-800">全域系統設定</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 區域管理 */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">區域與站點管理</h2>
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder="輸入區域名稱 (例如：新莊區)" 
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
            />
            <Button onClick={handleAddRegion} disabled={loading} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" /> 新增
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {regions.length === 0 && <p className="text-gray-400 text-center py-4 text-sm">目前無自定義區域</p>}
            {regions.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all">
                <span className="font-bold text-gray-700">{r.name}</span>
                <button 
                  onClick={() => handleDeleteRegion(r.id, r.name)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LOGO 設定 */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">企業標識設定</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">目前的企業 LOGO：</p>
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center min-h-[100px]">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-16" /> : <p className="text-gray-400 text-xs">尚未上傳 LOGO</p>}
            </div>
            <input 
              type="file" 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={e => setFile(e.target.files?.[0] || null)} 
            />
            <Button onClick={handleUpload} disabled={loading || !file} className="w-full">
              上傳並更新 LOGO
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
