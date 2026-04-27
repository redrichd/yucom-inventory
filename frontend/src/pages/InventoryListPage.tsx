import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Package, Plus, X, MapPin, Layers, TrendingUp, Info, Search, Star, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createRequest } from "../features/requests/requestService";
import { ShoppingCart, Check } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  actualQuantity: number;
  availableQuantity: number;
  region: string;
  imageUrl?: string;
  isStarred?: boolean;
}

export default function InventoryListPage() {
  const { userData, user, liffProfile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [regions, setRegions] = useState<{id: string, name: string}[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [requestingItem, setRequestingItem] = useState<InventoryItem | null>(null);
  const [requestQuantity, setRequestQuantity] = useState("1");
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") {
      getDocs(collection(db, "regions")).then(snap => {
        let loadedRegions = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
        
        // 若 Firestore 尚未建立區域資料，先提供預設的三個區域
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
      }).catch(err => {
        console.error("載入區域失敗:", err);
        // 若失敗仍預設為自己的區域，避免卡住
        if (userData?.region && !selectedRegion) {
          setSelectedRegion(userData.region);
        }
      });
    } else if (userData?.region) {
      setSelectedRegion(userData.region);
    }
  }, [userData]);

  useEffect(() => {
    if (!selectedRegion) return;

    const q = query(
      collection(db, "inventory"),
      where("region", "==", selectedRegion)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setItems(itemList);
      setLoading(false);
    }, (error) => {
      console.error("載入庫存失敗:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedRegion]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !newItem.name || !newItem.quantity) return;

    try {
      setIsUploading(true);
      let imageUrl = "";

      if (file) {
        const storageRef = ref(storage, `inventory/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "inventory"), {
        name: newItem.name,
        actualQuantity: Number(newItem.quantity),
        availableQuantity: Number(newItem.quantity),
        region: selectedRegion || userData.region,
        category: "材料包",
        imageUrl: imageUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      setNewItem({ name: "", quantity: "" });
      setFile(null);
      setShowAddForm(false);
    } catch (error) {
      console.error("錯誤：", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProduct = async (id: string) => {
    if (!editingItem) return;
    try {
      setIsUploading(true);
      let newImageUrl = editingItem.imageUrl || "";
      if (file) {
        const storageRef = ref(storage, `inventory/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        newImageUrl = await getDownloadURL(storageRef);
      }
      await updateDoc(doc(db, "inventory", id), {
        actualQuantity: editingItem.actualQuantity,
        availableQuantity: editingItem.availableQuantity,
        imageUrl: newImageUrl,
        updatedAt: serverTimestamp(),
      });
      setEditingItem(null);
      setFile(null);
    } catch (error) {
      console.error("更新失敗", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("確定要刪除這個庫存品項嗎？這個動作無法復原。")) {
      await deleteDoc(doc(db, "inventory", id));
    }
  };

  const handleToggleStar = async (item: InventoryItem) => {
    await updateDoc(doc(db, "inventory", item.id), {
      isStarred: !item.isStarred
    });
  };

    });
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !requestingItem || !requestQuantity) return;

    try {
      setIsRequesting(true);
      await createRequest(user.uid, requestingItem.id, Number(requestQuantity));
      setRequestingItem(null);
      setRequestQuantity("1");
      alert("申請成功，請等待管理員審核！");
    } catch (error: any) {
      alert(error.message || "申請失敗");
    } finally {
      setIsRequesting(false);
    }
  };

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return 0;
    });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-bold animate-pulse">載入悠康庫存中...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-6 md:p-8">
        <div className="flex items-center gap-4">
          {liffProfile?.pictureUrl ? (
            <img src={liffProfile.pictureUrl} alt="Avatar" className="w-14 h-14 rounded-full border-4 border-white shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl border-4 border-white shadow-sm">
              {userData?.displayName?.charAt(0) || "U"}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-blue-600">
              <Layers className="w-6 h-6 md:w-8 md:h-8" />
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                悠康庫存系統
              </h1>
            </div>
            <div className="flex items-center gap-2 text-gray-500 font-medium ml-1 text-sm md:text-base">
              <span className="font-bold text-gray-700">{userData?.displayName}</span>
              <span className="text-gray-300">|</span>
              <MapPin className="w-4 h-4 text-red-100" />
              <span>當前區域：</span>
              <span className="text-gradient font-bold">{selectedRegion || "未設定"}</span>
            </div>
          </div>
        </div>

        {(userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") && (
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              variant="secondary"
              onClick={() => navigate("/admin/approvals")}
              className="flex-1 md:flex-none"
            >
              <Check className="w-5 h-5 mr-2" /> 審核申請
            </Button>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              size="lg"
              className="flex-1 md:flex-none"
            >
              {showAddForm ? (
                <><X className="w-5 h-5 mr-2" /> 取消新增</>
              ) : (
                <><Plus className="w-5 h-5 mr-2" /> 新增庫存品項</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs for Admins */}
      {(userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") && regions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {regions.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.name)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                selectedRegion === r.name 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200/50 translate-y-[0px]" 
                  : "bg-white/80 text-gray-600 hover:bg-blue-50/80 border border-gray-200/60 shadow-sm"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Add Form Section */}
      {showAddForm && (
        <form
          onSubmit={handleAddProduct}
          className="glass-card p-8 space-y-6 animate-in fade-in slide-in-from-top-10 duration-500"
        >
          <div className="flex items-center gap-3 border-b border-white/20 pb-4">
            <div className="p-2 bg-blue-100/50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">快速新增品項</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="材料名稱"
              placeholder="例如：悠康防水材料包(大)"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required
            />
            <Input
              label="初始庫存量"
              type="number"
              placeholder="0"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              required
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品圖片 (選填)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); setFile(null); }}>
              取消
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "圖片上傳中..." : "確認提交"}
            </Button>
          </div>
        </form>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">總品項</span>
          <span className="text-2xl font-black text-blue-600">{items.length}</span>
        </div>
        <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">總庫存</span>
          <span className="text-2xl font-black text-green-600">
            {items.reduce((acc, item) => acc + item.actualQuantity, 0)}
          </span>
        </div>
        <div className="col-span-2 glass-card p-4 flex items-center gap-4">
           <div className="p-3 bg-yellow-100/50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
           </div>
           <div>
              <p className="text-sm font-semibold text-gray-700">庫存動態即時監控中</p>
              <p className="text-xs text-gray-500">所有變動將自動同步至雲端</p>
           </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative glass-card border-none bg-white/40">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-blue-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 bg-transparent border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          placeholder="搜尋品項名稱..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Inventory Grid */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } },
          hidden: {}
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10"
      >
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass-card border-dashed border-gray-300">
            <div className="p-6 bg-gray-100/50 rounded-full mb-4">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">找不到符合的庫存資料</p>
            {searchQuery === "" && <p className="text-gray-400 text-sm mt-2">點擊上方按鈕開始建立您的第一筆庫存</p>}
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              key={item.id}
              className={`glass-card overflow-hidden group border-transparent transition-all ${item.isStarred ? 'ring-1 ring-yellow-400/50 shadow-lg shadow-yellow-100/30' : 'hover:border-blue-200/50 hover:shadow-lg hover:shadow-blue-100/30'}`}
            >
              {/* Card Decoration */}
              <div className="h-32 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 flex items-center justify-center relative overflow-hidden group-hover:from-blue-100/50 group-hover:to-indigo-100/50 transition-colors">
                 {item.imageUrl ? (
                   <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <Package className="w-16 h-16 text-blue-200/60 group-hover:scale-110 group-hover:text-blue-300 transition-all duration-500" />
                 )}
                 <div className="absolute top-2 right-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-bold text-blue-500 border border-blue-100 backdrop-blur-sm uppercase">
                      {item.region}
                    </span>
                 </div>

                 {(userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") && (
                   <button 
                     onClick={() => handleToggleStar(item)}
                     className="absolute top-2 left-2 p-1.5 rounded-full bg-white/60 hover:bg-white backdrop-blur-sm transition-all"
                   >
                     <Star className={`w-4 h-4 ${item.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
                   </button>
                 )}
              </div>

              {editingItem?.id === item.id ? (
                <div className="p-6 space-y-4 bg-blue-50/30">
                  <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="實際庫存" type="number" value={editingItem.actualQuantity.toString()} onChange={e => setEditingItem({...editingItem, actualQuantity: Number(e.target.value)})} />
                    <Input label="可用庫存" type="number" value={editingItem.availableQuantity.toString()} onChange={e => setEditingItem({...editingItem, availableQuantity: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">更換圖片 (選填)</label>
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 cursor-pointer" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" disabled={isUploading} onClick={() => handleUpdateProduct(item.id)}>{isUploading ? "儲存中..." : "儲存變更"}</Button>
                    <Button variant="secondary" onClick={() => { setEditingItem(null); setFile(null); }}>取消</Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-2xl text-gray-800 group-hover:text-gradient transition-all duration-300 line-clamp-1 flex-1 pr-2">
                      {item.name}
                    </h3>
                    {(userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditingItem(item)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProduct(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 glass-effect rounded-xl flex flex-col border border-blue-100/30 bg-blue-50/20 group-hover:bg-blue-50/40 transition-colors">
                      <span className="text-[10px] font-medium text-blue-500 uppercase tracking-wider mb-1">實際庫存</span>
                      <span className="text-xl font-bold text-gray-800">{item.actualQuantity}</span>
                    </div>
                    <div className="p-3 glass-effect rounded-xl flex flex-col border border-green-100/30 bg-green-50/20 group-hover:bg-green-50/40 transition-colors">
                      <span className="text-[10px] font-medium text-green-500 uppercase tracking-wider mb-1">可用庫存</span>
                      <span className="text-xl font-bold text-gray-800">{item.availableQuantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                     <div className="flex items-center gap-1.5 text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-[10px] font-medium tracking-widest uppercase">已與雲端同步</span>
                     </div>
                     
                     {userData?.role === "USER" && (
                       <Button 
                         size="sm" 
                         className="rounded-lg px-4"
                         onClick={() => setRequestingItem(item)}
                       >
                         <ShoppingCart className="w-4 h-4 mr-2" />
                         申請
                       </Button>
                     )}

                     {(userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") && (
                       <button className="p-2 glass-effect rounded-lg hover:bg-white hover:text-blue-500 transition-all text-gray-400 border border-gray-100 shadow-sm">
                          <Info className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                </div>
              )}

              {/* Request Overlay */}
              <AnimatePresence>
                {requestingItem?.id === item.id && (
                  <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center p-6"
                  >
                    <motion.form 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onSubmit={handleRequestSubmit}
                      className="glass-card p-6 w-full space-y-4 bg-white/90 shadow-2xl"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-800">物資申請</h4>
                        <button type="button" onClick={() => setRequestingItem(null)}><X className="w-4 h-4 text-gray-400" /></button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">申請品項: {item.name}</p>
                        <p className="text-xs text-gray-500">可用餘額: {item.availableQuantity}</p>
                      </div>
                      <Input 
                        label="申請數量" 
                        type="number" 
                        min="1" 
                        max={item.availableQuantity}
                        value={requestQuantity} 
                        onChange={e => setRequestQuantity(e.target.value)} 
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={isRequesting}>
                          {isRequesting ? "處理中..." : "確認申請"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setRequestingItem(null)}>取消</Button>
                      </div>
                    </motion.form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
