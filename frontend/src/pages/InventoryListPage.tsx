import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

interface InventoryItem {
  id: string;
  name: string;
  actualQuantity: number;
  availableQuantity: number;
  region: string;
}

export default function InventoryListPage() {
  const { userData, user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.region) return;

    const q = query(
      collection(db, "inventory"),
      where("region", "==", userData.region)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setItems(itemList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.region]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !newItem.name || !newItem.quantity) return;

    try {
      await addDoc(collection(db, "inventory"), {
        name: newItem.name,
        actualQuantity: Number(newItem.quantity),
        availableQuantity: Number(newItem.quantity),
        region: userData.region,
        category: "材料包",
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      setNewItem({ name: "", quantity: "" });
      setShowAddForm(false);
      alert("新增成功！");
    } catch (error) {
      console.error("錯誤：", error);
      alert("新增失敗，請稍後再試。");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">材料包庫存</h1>
          <p className="text-sm text-gray-500">區域：{userData?.region || "未設定"}</p>
        </div>
        {/* 管理員專屬按鈕 */}
        {userData?.role === "ADMIN" && (
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="primary">
            {showAddForm ? "取消新增" : "＋ 新增品項"}
          </Button>
        )}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddProduct}
          className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <span className="text-lg">📦</span>
            <h2 className="font-bold">新增庫存品項</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="品項名稱"
              placeholder="例如：防水材料包"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
            <Input
              label="初始庫存數量"
              type="number"
              placeholder="0"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              required
              min="0"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              取消
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              確認新增
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {items.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-lg">目前沒有庫存資料</p>
            <p className="text-gray-300 text-sm mt-1">您可以點擊右上角新增品項</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  📦
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item.region}</span>
              </div>
              <h3 className="font-extrabold text-xl text-gray-800 mb-4 group-hover:text-blue-600 transition-colors">{item.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 group-hover:bg-blue-50/50 transition-colors">
                  <span className="text-sm text-gray-500">實際庫存</span>
                  <span className="font-bold text-gray-700 text-lg">{item.actualQuantity}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 group-hover:bg-green-50/50 transition-colors border-l-4 border-green-500">
                  <span className="text-sm text-green-600 font-medium">可用庫存</span>
                  <span className="font-bold text-green-700 text-lg">{item.availableQuantity}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
