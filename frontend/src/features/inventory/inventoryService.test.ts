import { describe, it, expect, vi, beforeEach } from "vitest";
import { getInventoryByRegion, getItemById } from "./inventoryService";
import { getDocs, getDoc } from "firebase/firestore";

vi.mock("firebase/firestore");
vi.mock("../../lib/firebase", () => ({
  db: {}
}));

describe("inventoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getInventoryByRegion returns mapped items", async () => {
    const mockDocs = [
      { id: "1", data: () => ({ name: "Item 1", region: "Region A" }) },
      { id: "2", data: () => ({ name: "Item 2", region: "Region A" }) },
    ];
    (getDocs as any).mockResolvedValue({ docs: mockDocs });

    const result = await getInventoryByRegion("Region A");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[0].name).toBe("Item 1");
  });

  it("getItemById returns item if exists", async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      id: "1",
      data: () => ({ name: "Item 1" })
    });

    const result = await getItemById("1");
    expect(result?.name).toBe("Item 1");
  });

  it("getItemById returns null if not exists", async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => false
    });

    const result = await getItemById("non-existent");
    expect(result).toBeNull();
  });
});
