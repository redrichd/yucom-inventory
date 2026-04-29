import { runTransaction, doc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function approveRequest(requestId: string, adminId: string) {
  return runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "requests", requestId);
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists()) throw new Error("申請單不存在");
    
    const requestData = requestSnap.data();
    const itemRef = doc(db, "inventory", requestData.itemId);
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists()) throw new Error("物資不存在");
    
    const itemData = itemSnap.data();

    // 1. Deduct actual quantity (already deducted available at creation)
    transaction.update(itemRef, {
      actualQuantity: itemData.actualQuantity - requestData.quantity
    });

    // 2. Mark request as approved
    transaction.update(requestRef, {
      status: "APPROVED",
      approvedAt: serverTimestamp(),
      adminId
    });

    // 3. Log transaction
    const logRef = doc(collection(db, "transactions"));
    transaction.set(logRef, {
      type: "FULFILLMENT",
      requestId,
      itemId: requestData.itemId,
      itemName: requestData.itemName,
      userId: requestData.userId,
      quantity: requestData.quantity,
      adminId,
      createdAt: serverTimestamp()
    });
  });
}

export async function rejectRequest(requestId: string, adminId: string) {
  return runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "requests", requestId);
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists()) throw new Error("申請單不存在");
    
    const requestData = requestSnap.data();
    const itemRef = doc(db, "inventory", requestData.itemId);
    const itemSnap = await transaction.get(itemRef);
    
    // 1. Return items to available quantity
    if (itemSnap.exists()) {
      transaction.update(itemRef, {
        availableQuantity: itemSnap.data().availableQuantity + requestData.quantity
      });
    }

    // 2. Mark request as rejected
    transaction.update(requestRef, {
      status: "REJECTED",
      rejectedAt: serverTimestamp(),
      adminId
    });
  });
}

export async function completeRequest(requestId: string, adminId: string, deliveryDate: string) {
  return runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "requests", requestId);
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists()) throw new Error("申請單不存在");
    
    // Mark request as completed with delivery date
    transaction.update(requestRef, {
      status: "COMPLETED",
      completedAt: serverTimestamp(),
      deliveryDate,
      adminId
    });
  });
}
