import { useEffect, useState } from "react";
import { collection, getDocs, query, where, runTransaction, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../../features/requests/requestService";

interface InventoryItem {
  id: string;
  name: string;
  actualQuantity: number;
  availableQuantity: number;
}

export default function InventoryManagementPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [requestQty, setRequestQty] = useState<number>(1);
  const [loading, setLoading] = useState(false);

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
    
    // Refresh items locally
  };

  const handleAdminRequest = async () => {
    if (!selectedItem || !userData) return;
    try {
      setLoading(true);
      await createRequest(userData.uid, userData.displayName, selectedItem.id, requestQty);
      alert("申請成功！正在跳轉至審核頁面...");
      navigate("/admin/approvals");
    } catch (error: any) {
      alert("申請失敗：" + error.message);
    } finally {
      setLoading(false);
    }
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
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl shadow space-y-4 border-l-4 border-blue-500">
                  <h2 className="text-lg font-bold text-blue-700">功能 1：管理者直接申請</h2>
                  <p className="text-sm text-gray-500">適用場景：管理者幫自己或他人領用物資，會產生申請紀錄。</p>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Input label="申請數量" type="number" min={1} value={requestQty} onChange={e => setRequestQty(Number(e.target.value))} />
                    </div>
                    <Button className="shrink-0 h-[42px] bg-blue-600" onClick={handleAdminRequest} disabled={loading}>送出申請</Button>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow space-y-4 border-l-4 border-orange-500">
                  <h2 className="text-lg font-bold text-orange-700">功能 2：庫存手動修正</h2>
                  <p className="text-sm text-gray-500">適用場景：盤點差異、毀損剔除等，不產生申請紀錄，僅修正數字。</p>
                  <Input label="修正數量 (正數加，負數減)" type="number" value={adjustment} onChange={e => setAdjustment(Number(e.target.value))} />
                  <Input label="修正原因" placeholder="例如：盤損、過期" value={reason} onChange={e => setReason(e.target.value)} required />
                  <Button className="w-full bg-orange-600" onClick={handleUpdateStock} disabled={!reason || loading}>執行修正</Button>
               </div>
            </div>
          )}
      </div>
    </div>
  );
}
