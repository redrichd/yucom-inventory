import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthProvider";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Request {
  id: string;
  itemName: string;
  quantity: number;
  status: string;
  createdAt?: any;
  approvedAt?: any;
  deliveryDate?: string;
  adminId?: string;
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchMyRequests(true);
  }, [user]);

  async function fetchMyRequests(isFirstPage = false) {
    if (!user?.uid) return;
    
    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      let q = query(
        collection(db, "requests"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (!isFirstPage && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snap = await getDocs(q);
      const newRequests = snap.docs.map(d => ({ id: d.id, ...d.data() } as Request));
      
      if (isFirstPage) {
        setRequests(newRequests);
      } else {
        setRequests(prev => [...prev, ...newRequests]);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("載入申請紀錄失敗:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING":
        return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-sm font-bold"><Clock className="w-4 h-4"/> 待審核</span>;
      case "APPROVED":
        return <span className="flex items-center gap-1 text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-sm font-bold"><CheckCircle className="w-4 h-4"/> 已核准(待交付)</span>;
      case "COMPLETED":
        return <span className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-bold"><Truck className="w-4 h-4"/> 已結案(已交付)</span>;
      case "REJECTED":
        return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm font-bold"><XCircle className="w-4 h-4"/> 已拒絕</span>;
      default:
        return <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-10 h-10 border-4 border-blue-400/30 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">載入中...</p>
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
            <h1 className="text-2xl font-black text-gray-800">我的申請紀錄</h1>
            <p className="text-sm text-gray-500 font-medium">查看所有物資申請狀態與進度</p>
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
                <Package className="w-12 h-12" />
              </div>
              <p className="text-gray-400 font-medium text-lg">您目前沒有任何申請紀錄</p>
            </motion.div>
          ) : (
            requests.map(r => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200/50 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{r.itemName}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{r.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center md:justify-end gap-6">
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">申請數量</span>
                    <span className="text-xl font-black text-gray-700">x {r.quantity}</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(r.status)}
                    {r.deliveryDate && (
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        交付日: {r.deliveryDate}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {hasMore && requests.length > 0 && (
        <div className="flex justify-center pt-4 pb-12">
          <button
            onClick={() => fetchMyRequests(false)}
            disabled={loadingMore}
            className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
          >
            {loadingMore ? "載入中..." : "載入更多紀錄"}
          </button>
        </div>
      )}
    </div>
  );
}
