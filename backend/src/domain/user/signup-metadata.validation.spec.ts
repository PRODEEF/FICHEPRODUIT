import {
  normalizePendingAutoAnalyze,
  normalizeSignupWebsiteUrl,
  sanitizeSignupMetadata,
} from "./signup-metadata.validation";

describe("signup-metadata.validation", () => {
  describe("normalizeSignupWebsiteUrl", () => {
    it("accepte une URL https valide", () => {
      expect(normalizeSignupWebsiteUrl("https://shop.example")).toBe("https://shop.example");
    });

    it("rejette javascript: et les URL trop longues", () => {
      expect(normalizeSignupWebsiteUrl("javascript:alert(1)")).toBeNull();
      expect(normalizeSignupWebsiteUrl(`https://x.com/${"a".repeat(3000)}`)).toBeNull();
    });

    it("retourne null pour vide", () => {
      expect(normalizeSignupWebsiteUrl("  ")).toBeNull();
      expect(normalizeSignupWebsiteUrl(null)).toBeNull();
    });
  });

  describe("normalizePendingAutoAnalyze", () => {
    it("n’active le flag que si une URL valide est présente", () => {
      expect(normalizePendingAutoAnalyze(true, "https://shop.example")).toBe(true);
      expect(normalizePendingAutoAnalyze(true, null)).toBe(false);
    });
  });

  describe("sanitizeSignupMetadata", () => {
    it("force pending à false si l’URL est invalide", () => {
      expect(
        sanitizeSignupMetadata({
          websiteUrl: "not-a-url",
          pendingAutoAnalyze: true,
        }),
      ).toEqual({ websiteUrl: null, pendingAutoAnalyze: false });
    });
  });
});
