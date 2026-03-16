import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";
import { Button } from "../../components/ui/Button";

export default function GlobalSettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    const storageRef = ref(storage, `logo/company_logo_${Date.now()}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setLogoUrl(url);
    alert("LOGO 上傳成功！");
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">全域設定</h1>
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">修改企業 LOGO</h2>
        {logoUrl && <img src={logoUrl} alt="Logo" className="h-20 mb-4" />}
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <Button onClick={handleUpload}>上傳並更新</Button>
      </div>
    </div>
  );
}
