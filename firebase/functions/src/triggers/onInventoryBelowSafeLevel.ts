import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

export const onInventoryBelowSafeLevel = onDocumentUpdated("inventory/{itemId}", async (event) => {
    const afterData = event.data?.after.data();
    if (!afterData) return;

    if (afterData.actualQuantity < (afterData.safeQuantity || 5)) {
        logger.warn(`ALARM: Item ${afterData.name} (${event.params.itemId}) is below safe level! Current: ${afterData.actualQuantity}, Safe: ${afterData.safeQuantity}`);
        // In real app: send email/notification
    }
});
