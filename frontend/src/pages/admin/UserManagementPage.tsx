import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../../components/ui/Button";

interface ManagedUser {
  uid: string;
  displayName: string;
  region: string;
  status: string;
  role: string;
  isApproved: boolean;
}

export default function UserManagementPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.region) {
      const q = query(collection(db, "users"), where("region", "==", userData.region));
      getDocs(q).then((snap) => {
        setUsers(snap.docs.map(d => d.data() as ManagedUser));
        setLoading(false);
      });
    }
  }, [userData]);

  const handleApprove = async (uid: string) => {
    await updateDoc(doc(db, "users", uid), { 
      status: "ACTIVE",
      isApproved: true 
    });
    setUsers(users.map(u => u.uid === uid ? { ...u, status: "ACTIVE", isApproved: true } : u));
  };

  if (loading) return <div>載入中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">區域使用者管理 ({userData?.region})</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">姓名</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">狀態</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">區域</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u.uid}>
                <td className="px-6 py-4">{u.displayName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4">{u.region}</td>
                <td className="px-6 py-4">
                  {u.status === 'PENDING' && (
                    <Button size="sm" onClick={() => handleApprove(u.uid)}>核准開通</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
