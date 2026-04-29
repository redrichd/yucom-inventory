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
  const [regions, setRegions] = useState<{id: string, name: string}[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 載入所有區域清單
    getDocs(collection(db, "regions")).then(snap => {
      let loadedRegions = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
      
      if (loadedRegions.length === 0) {
        loadedRegions = [
          { id: "default-1", name: "新莊區" },
          { id: "default-2", name: "三蘆區" },
          { id: "default-3", name: "板中永區" }
        ];
      }
      
      setRegions(loadedRegions);
      if (userData?.region && !selectedRegion) {
        setSelectedRegion(userData.region);
      } else if (loadedRegions.length > 0 && !selectedRegion) {
        setSelectedRegion(loadedRegions[0].name);
      }
    });
  }, [userData]);

  useEffect(() => {
    if (selectedRegion) {
      setLoading(true);
      const q = query(collection(db, "users"), where("region", "==", selectedRegion));
      getDocs(q).then((snap) => {
        setUsers(snap.docs.map(d => d.data() as ManagedUser));
        setLoading(false);
      });
    }
  }, [selectedRegion]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">使用者管理</h1>
        <select 
          className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-700"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          {regions.map(r => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </select>
      </div>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {u.isApproved ? '已核准' : '待審核'}
                  </span>
                </td>
                <td className="px-6 py-4">{u.region}</td>
                <td className="px-6 py-4">
                  {!u.isApproved && (
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
