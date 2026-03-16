import { describe, it, expect } from "vitest";
import * as fftest from "firebase-functions-test";
import { onRequestCreated } from "../src/triggers/onRequestCreated";

const testEnv = fftest();

describe("onRequestCreated Trigger V2", () => {
  it("should log notification on creation", async () => {
    const snap = testEnv.firestore.makeDocumentSnapshot(
      { userId: "user1", itemName: "Item 1", quantity: 2 },
      "requests/req1"
    );
    
    const event = {
      data: snap,
      params: { requestId: "req1" }
    };

    const result = await (onRequestCreated as any).run(event);
    expect(result).toBe(true);
  });
});
