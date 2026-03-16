import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { initLiff, getLiffProfile } from "../../lib/liff";

interface UserData {
  uid: string;
  displayName: string;
  region: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  isApproved: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  liffProfile: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  liffProfile: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liffProfile, setLiffProfile] = useState<any>(null);

  useEffect(() => {
    let unsubscribeFirestore: () => void;

    async function setupAuth() {
      try {
        await initLiff();
        const profile = await getLiffProfile();
        setLiffProfile(profile);
      } catch (err) {
        console.error("LIFF setup failed", err);
      }

      onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          unsubscribeFirestore = onSnapshot(doc(db, "users", firebaseUser.uid), (snapshot) => {
            if (snapshot.exists()) {
              setUserData({ ...snapshot.data() as UserData, uid: firebaseUser.uid });
            } else {
              setUserData(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Firestore onSnapshot error", error);
            setLoading(false);
          });
        } else {
          setUserData(null);
          setLoading(false);
        }
      });
    }

    setupAuth();

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, liffProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
