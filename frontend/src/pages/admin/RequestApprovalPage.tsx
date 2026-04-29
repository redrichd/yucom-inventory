import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, limit, startAfter, orderBy } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { approveRequest, rejectRequest, completeRequest } from "../../features/requests/approvalService";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowLeft, User, Package, Calendar, Clock, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Request {
  id: string;
  userId: string;
  userDisplayName?: string;
  itemName: string;
  quantity: number;
  status: string;
  createdAt?: any;
  deliveryDate?: string;
}

export default function RequestApprovalPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED">("PENDING");
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [searchName, setSearchName] = useState("");
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [regions, setRegions] = useState<{id: string, name: string}[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const PAGE_SIZE = 10;

  const DEFAULT_REGIONS = [
    { id: "default-1", name: "新莊區" },
    { id: "default-2", name: "三蘆區" },
    { id: "default-3", name: "板中永區" }
  ];

  // 1. 載入區域清單 (若資料庫為空則使用預設值)
  useEffect(() => {
    getDocs(collection(db, "regions")).then(snap => {
      let loadedRegions = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
      if (loadedRegions.length === 0) {
        loadedRegions = DEFAULT_REGIONS;
      }
      setRegions(loadedRegions);
      
      // 預設選取使用者所屬區域
      if (userData?.region && selectedRegions.length === 0) {
        setSelectedRegions([userData.region]);
      } else if (selectedRegions.length === 0) {
        setSelectedRegions(loadedRegions.map(r => r.name)); // 預設全選
      }
    });
  }, [userData]);

  // 2. 當選擇區域或標籤改變時，重新抓取
  useEffect(() => {
    if (selectedRegions.length > 0) {
      fetchRequests(true);
    } else {
      setRequests([]);
      setLoading(false);
    }
  }, [selectedRegions, activeTab]);

  const toggleRegion = (regionName: string) => {
    setSelectedRegions(prev => 
      prev.includes(regionName) 
        ? prev.filter(r => r !== regionName)
        : [...prev, regionName]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests(true);
  };

  async function fetchRequests(isFirstPage = false) {
    if (!userData?.region) return;
    
    if (isFirstPage) {
      setLoading(true);
      setLastDoc(null);
    } else {
      setLoadingMore(true);
    }
    
    try {
      let q = query(
        collection(db, "requests"), 
        where("region", "in", selectedRegions), 
        where("status", "==", activeTab)
      );

      // 如果有輸入搜尋名稱
      if (searchName.trim()) {
        q = query(q, where("userName", "==", searchName.trim()));
      }

      q = query(q, orderBy("createdAt", "desc"), limit(PAGE_SIZE));

      if (!isFirstPage && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snap = await getDocs(q);
      const rawRequests = snap.docs.map(d => ({ 
        id: d.id, 
        userDisplayName: (d.data() as any).userName || "載入中...", // 先用快照名稱
        ...d.data() 
      } as Request));

      // 針對沒有快照名稱的舊資料，才進行異步補抓
      const requestsWithNames = await Promise.all(rawRequests.map(async (req) => {
        if (req.userDisplayName !== "載入中...") return req;
        try {
          const userSnap = await getDoc(doc(db, "users", req.userId));
          return {
            ...req,
            userDisplayName: userSnap.exists() ? userSnap.data().displayName : "未知用戶"
          };
        } catch {
          return { ...req, userDisplayName: "未知用戶" };
        }
      }));

      if (isFirstPage) {
        setRequests(requestsWithNames);
      } else {
        setRequests(prev => [...prev, ...requestsWithNames]);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("載入申請失敗:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      if (action === "APPROVE") {
        await approveRequest(id, userData!.uid);
      } else {
        await rejectRequest(id, userData!.uid);
      }
      setRequests(requests.filter(r => r.id !== id));
    } catch (error: any) {
      alert(error.message || "操作失敗");
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleComplete = async (id: string) => {
    const date = deliveryDates[id];
    if (!date) {
      alert("請填寫交付日期");
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      await completeRequest(id, userData!.uid, date);
      setRequests(requests.filter(r => r.id !== id));
      alert("已成功結案！");
    } catch (error: any) {
      alert(error.message || "操作失敗");
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between glass-card p-6 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800">審核與交付管理</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {regions.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggleRegion(r.name)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    selectedRegions.includes(r.name)
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 border-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {r.name}
                </button>
              ))}
              <span className="text-xs text-gray-400 font-medium ml-2">· 共 {requests.length} 筆</span>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-100/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === "PENDING" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            待審核
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === "APPROVED" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            待交付
          </button>
        </div>
      </div>

      <div className="glass-card p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜尋申請人姓名 (精確匹配)..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">搜尋</Button>
          {searchName && (
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={() => { setSearchName(""); fetchRequests(true); }}
            >
              清除
            </Button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-400/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">載入中...</p>
        </div>
      ) : (
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
                <p className="text-gray-400 font-medium text-lg">目前沒有任何{activeTab === "PENDING" ? "待審核" : "待交付"}的紀錄</p>
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
                  <div className="flex items-center gap-5 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{r.userDisplayName}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "---"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-center bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                     <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-gray-700">{r.itemName}</span>
                        <span className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-blue-600 font-black text-lg shadow-sm">
                          x {r.quantity}
                        </span>
                     </div>
                  </div>

                  {activeTab === "PENDING" ? (
                    <div className="flex items-center gap-3 min-w-[180px] justify-end">
                      <Button 
                        className="bg-green-600 hover:bg-green-700 shadow-green-100"
                        onClick={() => handleAction(r.id, "APPROVE")}
                        disabled={processing[r.id]}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        核准
                      </Button>
                      <Button 
                        variant="danger" 
                        className="shadow-red-100"
                        onClick={() => handleAction(r.id, "REJECT")}
                        disabled={processing[r.id]}
                      >
                        <X className="w-4 h-4 mr-2" />
                        拒絕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 min-w-[280px] justify-end bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <input 
                          type="date" 
                          className="w-full sm:w-auto text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 px-2 py-1.5"
                          value={deliveryDates[r.id] || ""}
                          onChange={(e) => setDeliveryDates({...deliveryDates, [r.id]: e.target.value})}
                          placeholder="選擇交付日"
                        />
                      </div>
                      <Button 
                        className="whitespace-nowrap w-full sm:w-auto"
                        onClick={() => handleComplete(r.id)}
                        disabled={processing[r.id] || !deliveryDates[r.id]}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        結案
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {hasMore && requests.length > 0 && (
        <div className="flex justify-center pt-4 pb-12">
          <button
            onClick={() => fetchRequests(false)}
            disabled={loadingMore}
            className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
          >
            {loadingMore ? "載入中..." : "載入更多申請"}
          </button>
        </div>
      )}
    </div>
  );
}
