import { toPublicAnalysis, toPublicAnalyses } from "./analysis-public.mapper";
import type { Analysis } from "./analysis.types";

const base: Analysis = {
  id: "a1",
  url: "https://shop.test",
  status: "pending",
  errorCode: null,
  errorMessage: null,
  userId: null,
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  shopId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("toPublicAnalysis", () => {
  it("retire sessionId de la réponse publique", () => {
    const publicAnalysis = toPublicAnalysis(base);
    expect(publicAnalysis).not.toHaveProperty("sessionId");
    expect(publicAnalysis.id).toBe("a1");
    expect(publicAnalysis.url).toBe("https://shop.test");
  });

  it("mappe une liste sans sessionId", () => {
    const list = toPublicAnalyses([base]);
    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty("sessionId");
  });
});
