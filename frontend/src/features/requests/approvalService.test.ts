import { describe, it, expect, vi, beforeEach } from "vitest";
import { approveRequest } from "./approvalService";
import { runTransaction } from "firebase/firestore";

vi.mock("firebase/firestore");
vi.mock("../../lib/firebase", () => ({
  db: {}
}));

describe("approvalService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approveRequest should update status and actual stock", async () => {
    const mockTransaction = {
      get: vi.fn()
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ itemId: "item1", quantity: 2, itemName: "Item 1", userId: "user1" }) })
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "Item 1", actualQuantity: 10 }) }),
      update: vi.fn(),
      set: vi.fn()
    };
    (runTransaction as any).mockImplementation((_db: any, callback: any) => callback(mockTransaction));

    await approveRequest("req1", "admin1");

    expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      actualQuantity: 8
    }));
    expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      status: "APPROVED"
    }));
  });
});
