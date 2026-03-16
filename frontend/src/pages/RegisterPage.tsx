import React, { useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function RegisterPage() {
  const { user, liffProfile } = useAuth();
  const [name, setName] = useState(liffProfile?.displayName || "");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: name,
        region: region,
        role: "USER",
        status: "PENDING",
        isApproved: false,
        createdAt: new Date(),
      });
      // Navigation will be handled by AuthProvider state change or Router
    } catch (error) {
      console.error("Registration failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">歡迎加入</h2>
          <p className="mt-2 text-gray-600">請填寫基本資料以完成註冊</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <Input
              label="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="請輸入真實姓名"
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">所屬區域</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
              >
                <option value="">請選擇區域</option>
                <option value="新莊區">新莊區</option>
            <option value="三蘆區">三蘆區</option>
            <option value="板中永區">板中永區</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "處理中..." : "送出申請"}
          </Button>
        </form>
      </div>
    </div>
  );
}
