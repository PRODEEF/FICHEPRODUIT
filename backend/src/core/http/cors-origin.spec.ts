import {
  buildCorsOptions,
  isAllowedCorsOrigin,
  isStrictCorsMode,
  parseCorsOriginList,
} from "./cors-origin";

describe("parseCorsOriginList", () => {
  it("parse les origines séparées par des virgules", () => {
    expect(parseCorsOriginList("https://a.fr, https://b.fr")).toEqual([
      "https://a.fr",
      "https://b.fr",
    ]);
  });

  it("retourne une liste vide pour * ou chaîne vide", () => {
    expect(parseCorsOriginList("*")).toEqual([]);
    expect(parseCorsOriginList("")).toEqual([]);
  });
});

describe("isStrictCorsMode", () => {
  it("est strict en production Vercel", () => {
    expect(isStrictCorsMode("production", "production")).toBe(true);
  });

  it("n’est pas strict en preview Vercel malgré NODE_ENV=production", () => {
    expect(isStrictCorsMode("production", "preview")).toBe(false);
  });

  it("n’est pas strict en développement local", () => {
    expect(isStrictCorsMode("development")).toBe(false);
  });
});

describe("isAllowedCorsOrigin", () => {
  const allowed = ["https://app.example.com"];

  it("autorise une origine listée en mode strict", () => {
    expect(isAllowedCorsOrigin("https://app.example.com", allowed, true)).toBe(true);
  });

  it("refuse une origine preview en mode strict", () => {
    expect(isAllowedCorsOrigin("https://front-abc.vercel.app", allowed, true)).toBe(false);
  });

  it("autorise *.vercel.app hors mode strict", () => {
    expect(isAllowedCorsOrigin("https://ficheproduit-pzekwi22e.vercel.app", allowed, false)).toBe(
      true,
    );
  });

  it("autorise localhost hors mode strict", () => {
    expect(isAllowedCorsOrigin("http://localhost:5173", allowed, false)).toBe(true);
  });
});

describe("buildCorsOptions", () => {
  it("expose une fonction origin en mode strict avec CORS_ORIGIN défini", () => {
    const options = buildCorsOptions({
      corsOrigin: "https://app.example.com",
      nodeEnv: "production",
      vercelEnv: "production",
    });
    expect(typeof options.origin).toBe("function");
  });

  it("autorise *.vercel.app via le callback origin en preview Vercel", async () => {
    const options = buildCorsOptions({
      corsOrigin: "https://app.example.com",
      nodeEnv: "production",
      vercelEnv: "preview",
    });
    const originFn = options.origin;
    if (typeof originFn !== "function") {
      throw new Error("origin callback attendu");
    }

    const previewOrigin = "https://ficheproduit-pzekwi22e-yann-thebodys-projects.vercel.app";
    await new Promise<void>((resolve, reject) => {
      originFn(previewOrigin, (err, result) => {
        if (err) reject(err);
        else {
          expect(result).toBe(previewOrigin);
          resolve();
        }
      });
    });
  });
});
