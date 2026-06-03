import {
  capitalizeWordsFr,
  formatFieldDisplayLabel,
  isLikelyVariantOptionValue,
} from "./normalize-field-label";

describe("isLikelyVariantOptionValue", () => {
  it("rejette les surfaces et codes type C1", () => {
    expect(isLikelyVariantOptionValue("5.7 m²")).toBe(true);
    expect(isLikelyVariantOptionValue("3.0 m2")).toBe(true);
    expect(isLikelyVariantOptionValue("C1")).toBe(true);
    expect(isLikelyVariantOptionValue("group[2]")).toBe(true);
  });

  it("accepte les vrais libellés", () => {
    expect(isLikelyVariantOptionValue("Surface voile")).toBe(false);
    expect(isLikelyVariantOptionValue("Couleur")).toBe(false);
    expect(isLikelyVariantOptionValue("Taille")).toBe(false);
  });
});

describe("formatFieldDisplayLabel", () => {
  it("nettoie et met une majuscule au début de chaque mot", () => {
    expect(formatFieldDisplayLabel("surface voile :")).toBe("Surface Voile");
    expect(formatFieldDisplayLabel("couleur")).toBe("Couleur");
  });
});

describe("capitalizeWordsFr", () => {
  it("préserve les mots déjà capitalisés en milieu de chaîne", () => {
    expect(capitalizeWordsFr("nom du produit")).toBe("Nom Du Produit");
  });
});
