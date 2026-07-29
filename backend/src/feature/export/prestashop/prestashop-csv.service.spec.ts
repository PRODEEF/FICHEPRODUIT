import { PrestashopCsvService } from "./prestashop-csv.service";
import { PRESTASHOP_PRODUCT_HEADERS } from "./prestashop-headers";
import type { PrestashopProductRow } from "./prestashop.types";

function collectStream(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}

describe("PrestashopCsvService", () => {
  const service = new PrestashopCsvService();

  it("préfixe le CSV avec le BOM UTF-8", () => {
    const csv = service.build([], PRESTASHOP_PRODUCT_HEADERS);
    expect(PrestashopCsvService.hasBom(csv)).toBe(true);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("utilise le séparateur ; et échappe HTML avec guillemets et point-virgule", () => {
    const row = Object.fromEntries(
      PRESTASHOP_PRODUCT_HEADERS.map((h) => [h, ""]),
    ) as PrestashopProductRow;
    row["Nom *"] = "Produit";
    row["Description"] = '<p>Texte avec "guillemets" et ; point-virgule</p>';

    const csv = service.build([row], PRESTASHOP_PRODUCT_HEADERS);
    const body = csv.replace(/^\uFEFF/, "");
    const lines = body.split(/\r?\n/).filter((l) => l.length > 0);
    expect(lines[0]).toContain(";");
    expect(lines[0]?.split(";")[0]).toBe("ID");

    const dataLine = lines[1] ?? "";
    expect(dataLine).toContain('""guillemets""');
    expect(dataLine).toMatch(/"<p>Texte avec ""guillemets"" et ; point-virgule<\/p>"/);
  });

  it("stream produit le même BOM et le même séparateur", async () => {
    const row = Object.fromEntries(
      PRESTASHOP_PRODUCT_HEADERS.map((h) => [h, ""]),
    ) as PrestashopProductRow;
    row["Référence #"] = "SKU-1";

    const streamed = await collectStream(service.toStream([row], PRESTASHOP_PRODUCT_HEADERS));
    expect(PrestashopCsvService.hasBom(streamed)).toBe(true);
    expect(streamed).toContain("SKU-1");
    expect(streamed.replace(/^\uFEFF/, "").split("\n")[0]).toContain(";");
  });
});
