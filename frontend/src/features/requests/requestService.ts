import { collection, runTransaction, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function createRequest(userId: string, userName: string, itemId: string, quantity: number) {
  return runTransaction(db, async (transaction) => {
    const itemRef = doc(db, "inventory", itemId);
    const itemSnap = await transaction.get(itemRef);

    if (!itemSnap.exists()) {
      throw new Error("物品不存在");
    }

    const itemData = itemSnap.data();
    if (itemData.availableQuantity < quantity) {
      throw new Error("可用庫存不足");
    }

    // 1. Deduct available inventory
    transaction.update(itemRef, {
      availableQuantity: itemData.availableQuantity - quantity
    });

    // 2. Create request document
    const requestRef = doc(collection(db, "requests"));
    transaction.set(requestRef, {
      userId,
      userName,
      itemId,
      itemName: itemData.name,
      quantity,
      status: "PENDING",
      createdAt: serverTimestamp(),
      region: itemData.region
    });

    return requestRef.id;
  });
}
