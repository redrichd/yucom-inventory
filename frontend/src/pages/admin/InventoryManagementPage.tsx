import { useEffect, useState } from "react";
import { collection, getDocs, query, where, runTransaction, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface InventoryItem {
  id: string;
  name: string;
  actualQuantity: number;
  availableQuantity: number;
}

export default function InventoryManagementPage() {
  const { userData } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (userData?.region) {
      const q = query(collection(db, "inventory"), where("region", "==", userData.region));
      getDocs(q).then(snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))));
    }
  }, [userData]);

  const handleUpdateStock = async () => {
    if (!selectedItem || !reason) return;
    
    await runTransaction(db, async (transaction) => {
      const itemRef = doc(db, "inventory", selectedItem.id);
      const logRef = doc(collection(db, "transactions"));
      
      transaction.update(itemRef, {
        actualQuantity: selectedItem.actualQuantity + adjustment,
        availableQuantity: selectedItem.availableQuantity + adjustment
      });
      
      transaction.set(logRef, {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        type: "CORRECTION",
        delta: adjustment,
        reason,
        adminId: userData?.uid,
        createdAt: serverTimestamp()
      });
    });
    
    setSelectedItem(null);
    setReason("");
    // Refresh items locally
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">庫存手動修正 ({userData?.region})</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-semibold">選擇物資</h2>
            <div className="space-y-2">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-3 rounded-md border ${selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-gray-500">實際: {item.actualQuantity} | 可用: {item.availableQuantity}</p>
                </button>
              ))}
            </div>
         </div>
         
         {selectedItem && (
           <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-lg font-semibold">修正量 (正數增加，負數減少)</h2>
              <Input type="number" value={adjustment} onChange={e => setAdjustment(Number(e.target.value))} />
              <Input label="修正原因" placeholder="例如：入庫、盤損、毀損" value={reason} onChange={e => setReason(e.target.value)} required />
              <Button className="w-full" onClick={handleUpdateStock} disabled={!reason}>執行修正</Button>
           </div>
         )}
      </div>
    </div>
  );
}
