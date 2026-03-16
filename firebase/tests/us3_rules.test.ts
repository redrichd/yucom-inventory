import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

let testEnv: RulesTestEnvironment;

describe("US3 (Super Admin) Firestore & Storage Rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ucon-inventory-us3-test",
      firestore: {
        rules: readFileSync("firebase/firestore.rules", "utf8"),
      },
      storage: {
        rules: readFileSync("firebase/storage.rules", "utf8"),
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("Super Admin can create new regions", async () => {
    const superDb = testEnv.authenticatedContext("super").firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("users").doc("super").set({ status: 'ACTIVE', role: 'SUPER_ADMIN' });
    });

    await assertSucceeds(superDb.collection("regions").add({ name: "東部" }));
  });

  it("Regular Admin cannot create regions", async () => {
    const adminDb = testEnv.authenticatedContext("admin1").firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("users").doc("admin1").set({ status: 'ACTIVE', role: 'ADMIN' });
    });

    await assertFails(adminDb.collection("regions").add({ name: "非法區域" }));
  });
});
