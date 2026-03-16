import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ucon-inventory-test",
      firestore: {
        rules: readFileSync("firebase/firestore.rules", "utf8"),
        host: "localhost",
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("should deny unauthenticated access to users collection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection("users").get());
  });
});
