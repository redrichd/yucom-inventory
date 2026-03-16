import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

export const onRequestCreated = onDocumentCreated("requests/{requestId}", async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const requestId = event.params.requestId;

    logger.info(`Notification: New request ${requestId} created by user ${data.userId} for item ${data.itemName}`);
    
    return true;
});
