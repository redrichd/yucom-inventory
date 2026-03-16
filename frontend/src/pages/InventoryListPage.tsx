import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { getInventoryByRegion, type InventoryItem } from "../features/inventory/inventoryService";
import { Button } from "../components/ui/Button";

export default function InventoryListPage() {
  const { userData } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.region) {
      getInventoryByRegion(userData.region).then((data) => {
        setItems(data);
        setLoading(false);
      });
    }
  }, [userData]);

  if (loading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">材料包庫存 ({userData?.region})</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="h-48 bg-gray-200 relative">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div
                className="hidden absolute inset-0 items-center justify-center bg-gray-100 flex-col text-gray-400 p-4"
              >
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">圖片載入異常</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded ${item.availableQuantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.availableQuantity > 0 ? '有庫存' : '缺貨中'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>可用數量: {item.availableQuantity}</span>
                <span>存放位置: {item.locationDetail}</span>
              </div>
              <Button 
                className="w-full" 
                disabled={item.availableQuantity <= 0}
                variant={item.availableQuantity > 0 ? "primary" : "secondary"}
              >
                發起領用申請
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
