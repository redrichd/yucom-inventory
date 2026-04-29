import { describe, it, expect, vi, beforeEach } from "vitest";
import { runTransaction } from "firebase/firestore";

import { createRequest } from "./requestService";

vi.mock("firebase/firestore");
vi.mock("../../lib/firebase", () => ({
  db: {}
}));

describe("requestService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createRequest should扣除可用庫存並建立申請單", async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ name: "Item 1", availableQuantity: 10, region: "北部" })
      }),
      update: vi.fn(),
      set: vi.fn()
    };
    (runTransaction as any).mockImplementation((_db: any, callback: any) => callback(mockTransaction));

    await createRequest("user1", "Test User", "item1", 2);

    expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
      availableQuantity: 8
    });
    expect(mockTransaction.set).toHaveBeenCalled();
  });

  it("should throw error if stock is insufficient", async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ name: "Item 1", availableQuantity: 1, region: "北部" })
      }),
      update: vi.fn(),
      set: vi.fn()
    };
    (runTransaction as any).mockImplementation((_db: any, callback: any) => callback(mockTransaction));

    await expect(createRequest("user1", "Test User", "item1", 5)).rejects.toThrow("可用庫存不足");
  });
});
