import { describe, expect, it } from "vitest";

import { categorizeOperation, mapPowensCategory, normalizeLabel, normalizeMerchantName } from "../categorization";

describe("categorization", () => {
  it("normalizes labels", () => {
    expect(normalizeLabel("PRLV Spotify FR")).toBe("prlv spotify fr");
    expect(normalizeMerchantName("CB CARREFOUR CITY PARIS")).toBe("carrefour city paris");
  });

  it("maps provider categories", () => {
    expect(mapPowensCategory("restaurants")).toBe("food");
    expect(mapPowensCategory("salary")).toBe("income");
    expect(mapPowensCategory("unknown")).toBeNull();
  });

  it("uses keyword fallback when provider category is missing", () => {
    const result = categorizeOperation({
      amount: -23.4,
      label: "Carte Monoprix Nation",
      merchant: "Monoprix"
    });

    expect(result.categoryId).toBe("food");
    expect(result.needsReview).toBe(false);
  });
});
