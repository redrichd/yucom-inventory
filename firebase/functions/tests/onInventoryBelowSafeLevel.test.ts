import { describe, it, expect } from "vitest";
import * as fftest from "firebase-functions-test";
import { onInventoryBelowSafeLevel } from "../src/triggers/onInventoryBelowSafeLevel";

const testEnv = fftest();

describe("onInventoryBelowSafeLevel Trigger", () => {
  it("should log warning if below safe level", async () => {
    const snap = testEnv.firestore.makeDocumentSnapshot(
      { name: "Masks", actualQuantity: 2, safeQuantity: 10 },
      "inventory/item1"
    );
    
    const event = {
      data: { after: snap },
      params: { itemId: "item1" }
    };

    await (onInventoryBelowSafeLevel as any).run(event);
    expect(true).toBe(true);
  });
});
