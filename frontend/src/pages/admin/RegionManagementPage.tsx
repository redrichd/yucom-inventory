import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface Region {
  id: string;
  name: string;
}

export default function RegionManagementPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [newRegion, setNewRegion] = useState("");

  useEffect(() => {
    getDocs(collection(db, "regions")).then(snap => 
      setRegions(snap.docs.map(d => ({ id: d.id, name: d.data().name })))
    );
  }, []);

  const handleAdd = async () => {
    if (!newRegion) return;
    const docRef = await addDoc(collection(db, "regions"), { name: newRegion });
    setRegions([...regions, { id: docRef.id, name: newRegion }]);
    setNewRegion("");
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "regions", id));
    setRegions(regions.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">區域管理</h1>
      <div className="flex gap-2">
        <Input placeholder="輸入新區域名稱" value={newRegion} onChange={e => setNewRegion(e.target.value)} />
        <Button onClick={handleAdd}>新增</Button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {regions.map(r => (
            <li key={r.id} className="px-6 py-4 flex justify-between items-center">
              <span>{r.name}</span>
              <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)}>刪除</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
