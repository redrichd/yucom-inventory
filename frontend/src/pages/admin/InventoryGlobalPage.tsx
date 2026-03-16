import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface InventoryItem {
  id: string;
  name: string;
  imageUrl: string;
  region: string;
  actualQuantity: number;
  availableQuantity: number;
  locationDetail: string;
}

export default function InventoryGlobalPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    getDocs(collection(db, "inventory")).then(snap => 
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)))
    );
  }, []);

  const handleSave = async () => {
    if (!editingItem?.name || !editingItem.region) return;
    
    let imageUrl = editingItem.imageUrl || "";
    if (file) {
      const storageRef = ref(storage, `inventory/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    const itemData = { ...editingItem, imageUrl };
    delete (itemData as any).id;

    if (editingItem.id) {
      await updateDoc(doc(db, "inventory", editingItem.id), itemData);
    } else {
      await addDoc(collection(db, "inventory"), {
        ...itemData,
        actualQuantity: 0,
        availableQuantity: 0
      });
    }
    
    setEditingItem(null);
    setFile(null);
    // Refresh items
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">全域物資管理</h1>
        <Button onClick={() => setEditingItem({})}>新增物資專案</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow border border-gray-100 flex gap-4">
            <img src={item.imageUrl} className="w-20 h-20 object-cover rounded" alt="" />
            <div className="flex-1">
              <p className="font-bold">{item.name}</p>
              <p className="text-sm text-gray-500">{item.region}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => setEditingItem(item)}>編輯</Button>
                <Button size="sm" variant="danger" onClick={() => deleteDoc(doc(db, "inventory", item.id))}>刪除</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">{editingItem.id ? "編輯物資" : "新增物資"}</h2>
            <Input label="名稱" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
            <Input label="區域" value={editingItem.region} onChange={e => setEditingItem({...editingItem, region: e.target.value})} />
            <Input label="存放細節" value={editingItem.locationDetail} onChange={e => setEditingItem({...editingItem, locationDetail: e.target.value})} />
            <div>
              <label className="block text-sm font-medium mb-1">圖片</label>
              <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">儲存</Button>
              <Button variant="secondary" onClick={() => setEditingItem(null)} className="flex-1">取消</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
