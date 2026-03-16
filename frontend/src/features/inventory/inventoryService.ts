import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export interface InventoryItem {
  id: string;
  name: string;
  imageUrl: string;
  region: string;
  locationDetail: string;
  actualQuantity: number;
  availableQuantity: number;
  safeQuantity: number;
}

export async function getInventoryByRegion(region: string): Promise<InventoryItem[]> {
  const q = query(collection(db, "inventory"), where("region", "==", region));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
}

export async function getItemById(id: string): Promise<InventoryItem | null> {
  const docRef = doc(db, "inventory", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as InventoryItem;
  }
  return null;
}
