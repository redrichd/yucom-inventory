import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { approveRequest, rejectRequest } from "../../features/requests/approvalService";

interface Request {
  id: string;
  userId: string;
  itemName: string;
  quantity: number;
  status: string;
}

export default function RequestApprovalPage() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    if (userData?.region) {
      const q = query(collection(db, "requests"), where("region", "==", userData.region), where("status", "==", "PENDING"));
      getDocs(q).then(snap => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Request))));
    }
  }, [userData]);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    if (action === "APPROVE") await approveRequest(id, userData!.uid);
    else await rejectRequest(id, userData!.uid);
    setRequests(requests.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">待審核申請單 ({userData?.region})</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left font-serif">
          <thead className="bg-gray-50 border-b border-gray-200">
             <tr>
               <th className="px-6 py-3 font-semibold">申請人</th>
               <th className="px-6 py-3 font-semibold">物資</th>
               <th className="px-6 py-3 font-semibold">數量</th>
               <th className="px-6 py-3 font-semibold">操作</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-4">{r.userId}</td>
                <td className="px-6 py-4 font-bold text-gray-800">{r.itemName}</td>
                <td className="px-6 py-4">{r.quantity}</td>
                <td className="px-6 py-4 space-x-2">
                  <Button size="sm" onClick={() => handleAction(r.id, "APPROVE")}>核准</Button>
                  <Button size="sm" variant="danger" onClick={() => handleAction(r.id, "REJECT")}>拒絕</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
