import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

let testEnv: RulesTestEnvironment;

describe("US1 Firestore Rules Verification", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ucon-inventory-us1-test",
      firestore: {
        rules: readFileSync("firebase/firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("Active user can create a request for themselves", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    const aliceRef = aliceDb.collection("users").doc("alice");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("users").doc("alice").set({ status: 'ACTIVE', role: 'USER' });
      await context.firestore().collection("inventory").doc("item1").set({ region: "北部", availableQuantity: 5 });
    });

    await assertSucceeds(
      aliceDb.collection("requests").add({
        userId: "alice",
        itemId: "item1",
        quantity: 1,
        status: "PENDING"
      })
    );
  });

  it("Pending user cannot read inventory", async () => {
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("users").doc("bob").set({ status: 'PENDING', role: 'USER' });
    });

    await assertFails(bobDb.collection("inventory").get());
  });
});
