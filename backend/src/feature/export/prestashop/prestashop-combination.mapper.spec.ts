import {
  PrestashopCombinationMapper,
  buildAttributeColumns,
  cartesianAttributeChoices,
  combinationCell,
  extractVariantGroups,
} from "./prestashop-combination.mapper";
import { FICHEPRODUIT_PRESTASHOP_ID_BASE } from "./prestashop-reference";
import { sampleCatalogProduct } from "./prestashop-test.fixtures";

function idsFor(...products: { id: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  products.forEach((p, index) => {
    map.set(p.id, String(FICHEPRODUIT_PRESTASHOP_ID_BASE + index));
  });
  return map;
}

describe("extractVariantGroups / cartesian / buildAttributeColumns", () => {
  it("extrait couleur puis taille avec positions croissantes", () => {
    const groups = extractVariantGroups({
      couleur: "Bleu, Rouge",
      taille: "S, M",
    });
    expect(groups).toEqual([
      { name: "Couleur", type: "color", position: 0, values: ["Bleu", "Rouge"] },
      { name: "Taille", type: "select", position: 1, values: ["S", "M"] },
    ]);
  });

  it("construit groupes et valeurs alignés en une passe", () => {
    const choices = [
      { name: "Couleur", type: "color" as const, position: 0, value: "Bleu" },
      { name: "Taille", type: "select" as const, position: 1, value: "S" },
    ];
    const { attributeGroups, attributeValues } = buildAttributeColumns(choices);
    expect(attributeGroups).toBe("Couleur:color:0,Taille:select:1");
    expect(attributeValues).toBe("Bleu:0,S:1");
  });

  it("produit le cartésien de deux attributs", () => {
    const groups = extractVariantGroups({ color: "Blue,Red", size: "S,M" });
    const combos = cartesianAttributeChoices(groups);
    expect(combos).toHaveLength(4);
    expect(combos[0]?.map((c) => c.value)).toEqual(["Blue", "S"]);
    expect(combos[3]?.map((c) => c.value)).toEqual(["Red", "M"]);
  });
});

describe("PrestashopCombinationMapper", () => {
  const mapper = new PrestashopCombinationMapper();

  it("ne génère aucune ligne pour un produit sans déclinaison", () => {
    const product = sampleCatalogProduct({
      attributes: { reference: "REF-A" },
    });
    const rows = mapper.map([product], new Map([[product.id, "REF-A"]]), idsFor(product));
    expect(rows).toEqual([]);
  });

  it("génère 4 lignes pour 2 attributs × 2 valeurs, une seule Défaut=1", () => {
    const product = sampleCatalogProduct({
      attributes: {
        reference: "REF-B",
        couleur: "Noir, Blanc",
        taille: "6.0m², 11.0m²",
      },
    });
    const rows = mapper.map([product], new Map([[product.id, "REF-B"]]), idsFor(product));
    expect(rows).toHaveLength(4);

    const defaults = rows.map((r) => combinationCell(r, "Défaut (0 = Non, 1 = Oui)"));
    expect(defaults.filter((d) => d === "1")).toHaveLength(1);
    expect(defaults[0]).toBe("1");
    expect(defaults.slice(1).every((d) => d === "0")).toBe(true);

    expect(combinationCell(rows[0]!, "ID produit*")).toBe(String(FICHEPRODUIT_PRESTASHOP_ID_BASE));
    expect(combinationCell(rows[0]!, "Attribut (Nom:Type:Position)*")).toBe(
      "Couleur:color:0,Taille:select:1",
    );
    expect(combinationCell(rows[0]!, "Valeur (Valeur:Position)*")).toBe("Noir:0,6.0m²:1");
    expect(combinationCell(rows[0]!, "Référence")).toBe("REF-B-Noir-6.0m²");
  });

  it("aligne ID produit* sur l’ID numérique products.csv", () => {
    const product = sampleCatalogProduct({
      attributes: { reference: "44260-3012", taille: "S,M" },
    });
    const importIds = idsFor(product);
    const rows = mapper.map([product], new Map([[product.id, "44260-3012"]]), importIds);
    expect(rows).toHaveLength(2);
    expect(combinationCell(rows[0]!, "ID produit*")).toBe(String(FICHEPRODUIT_PRESTASHOP_ID_BASE));
    expect(combinationCell(rows[1]!, "ID produit*")).toBe(String(FICHEPRODUIT_PRESTASHOP_ID_BASE));
  });

  it("ignore les valeurs d’attribut vides après split", () => {
    const product = sampleCatalogProduct({
      attributes: { reference: "REF-C", taille: "S, , M" },
    });
    const rows = mapper.map([product], new Map([[product.id, "REF-C"]]), idsFor(product));
    expect(rows).toHaveLength(2);
    expect(combinationCell(rows[0]!, "Valeur (Valeur:Position)*")).toBe("S:0");
    expect(combinationCell(rows[1]!, "Valeur (Valeur:Position)*")).toBe("M:0");
  });
});
