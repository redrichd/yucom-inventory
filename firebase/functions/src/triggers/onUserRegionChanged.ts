import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export const onUserRegionChanged = onDocumentUpdated("users/{userId}", async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData || beforeData.region === afterData.region) {
        return;
    }

    const userId = event.params.userId;
    const db = admin.firestore();
    
    logger.info(`User ${userId} changed region from ${beforeData.region} to ${afterData.region}. Rejecting pending requests.`);

    const pendingRequests = await db.collection("requests")
        .where("userId", "==", userId)
        .where("status", "==", "PENDING")
        .get();

    const batch = db.batch();
    pendingRequests.docs.forEach((doc) => {
        batch.update(doc.ref, { 
            status: "REJECTED",
            rejectionReason: "區域異動自動取消"
        });
    });

    return batch.commit();
});
