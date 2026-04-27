import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { approveRequest, rejectRequest } from "../../features/requests/approvalService";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowLeft, User, Package, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Request {
  id: string;
  userId: string;
  userDisplayName?: string;
  itemName: string;
  quantity: number;
  status: string;
  createdAt?: any;
}

export default function RequestApprovalPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      if (!userData?.region) return;
      
      try {
        const q = query(
          collection(db, "requests"), 
          where("region", "==", userData.region), 
          where("status", "==", "PENDING")
        );
        const snap = await getDocs(q);
        const rawRequests = snap.docs.map(d => ({ id: d.id, ...d.data() } as Request));

        // 批次獲取使用者名稱
        const requestsWithNames = await Promise.all(rawRequests.map(async (req) => {
          const userSnap = await getDoc(doc(db, "users", req.userId));
          return {
            ...req,
            userDisplayName: userSnap.exists() ? userSnap.data().displayName : "未知用戶"
          };
        }));

        setRequests(requestsWithNames);
      } catch (error) {
        console.error("載入申請失敗:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [userData]);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      if (action === "APPROVE") {
        await approveRequest(id, userData!.uid);
      } else {
        await rejectRequest(id, userData!.uid);
      }
      setRequests(requests.filter(r => r.id !== id));
    } catch (error: any) {
      alert(error.message || "操作失敗");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-10 h-10 border-4 border-blue-400/30 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">審核清單載入中...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between glass-card p-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800">待審核申請單</h1>
            <p className="text-sm text-gray-500 font-medium">{userData?.region} · 目前有 {requests.length} 筆待處理</p>
          </div>
        </div>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } },
          hidden: {}
        }}
        className="grid gap-4"
      >
        <AnimatePresence mode="popLayout">
          {requests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="glass-card p-20 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="p-6 bg-gray-50 rounded-full text-gray-300">
                <Check className="w-12 h-12" />
              </div>
              <p className="text-gray-400 font-medium text-lg">目前沒有任何待審核的申請</p>
            </motion.div>
          ) : (
            requests.map(r => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200/50 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{r.userDisplayName}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{r.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                      <span className="text-gray-200">|</span>
                      <span>ID: {r.id.slice(-6)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                   <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <span className="font-bold text-gray-700">{r.itemName}</span>
                      <span className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-blue-600 font-black text-lg">
                        x {r.quantity}
                      </span>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 shadow-green-100"
                    onClick={() => handleAction(r.id, "APPROVE")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    核准
                  </Button>
                  <Button 
                    variant="danger" 
                    className="shadow-red-100"
                    onClick={() => handleAction(r.id, "REJECT")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    拒絕
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
