import { dedupeFieldsByNormalizedLabel } from "./dedupe-fields-by-label";

describe("dedupeFieldsByNormalizedLabel", () => {
  it("fusionne Couleur et Couleur :", () => {
    const samples: Record<string, string> = { Couleur: "Noir" };
    const { fields, merges } = dedupeFieldsByNormalizedLabel(
      [
        { name: "Couleur", type: "color", required: false },
        { name: "Couleur :", type: "text", required: false },
      ],
      samples,
    );

    expect(fields).toHaveLength(1);
    expect(fields[0]?.name).toBe("Couleur");
    expect(fields[0]?.type).toBe("color");
    expect(merges).toEqual([{ keptName: "Couleur", droppedName: "Couleur :" }]);
    expect(samples["Couleur"]).toBe("Noir");
  });

  it("ne fusionne pas Description courte et Détails produit (description)", () => {
    const { fields, merges } = dedupeFieldsByNormalizedLabel(
      [
        { name: "Description courte", type: "long_text", required: false },
        { name: "Détails produit (description)", type: "rich_text", required: false },
      ],
      {},
    );

    expect(fields).toHaveLength(2);
    expect(merges).toHaveLength(0);
  });
});
