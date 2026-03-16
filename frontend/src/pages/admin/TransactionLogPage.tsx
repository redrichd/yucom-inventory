import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Transaction {
  id: string;
  type: string;
  itemId: string;
  itemName: string;
  delta?: number;
  quantity?: number;
  reason?: string;
  adminId: string;
  createdAt: any;
}

export default function TransactionLogPage() {
  const [logs, setLogs] = useState<Transaction[]>([]);

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(50));
    getDocs(q).then(snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">全域異動日誌</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left font-serif">
          <thead className="bg-gray-50 border-b border-gray-200">
             <tr>
               <th className="px-6 py-3 font-semibold">時間</th>
               <th className="px-6 py-3 font-semibold">類型</th>
               <th className="px-6 py-3 font-semibold">物品</th>
               <th className="px-6 py-3 font-semibold">異動量</th>
               <th className="px-6 py-3 font-semibold">原因</th>
               <th className="px-6 py-3 font-semibold">操作員</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log.id} className="text-sm">
                <td className="px-6 py-4">{log.createdAt?.toDate().toLocaleString()}</td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded-md font-bold ${log.type === 'CORRECTION' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                     {log.type === 'CORRECTION' ? '手動修正' : '申請領用'}
                   </span>
                </td>
                <td className="px-6 py-4">{log.itemName}</td>
                <td className="px-6 py-4 font-mono">{log.delta || -log.quantity!}</td>
                <td className="px-6 py-4 text-gray-500">{log.reason || "系統領用"}</td>
                <td className="px-6 py-4">{log.adminId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
