import { z } from "zod";
import { assertUniqueFieldNames } from "./validate-template-fields";

const fieldSchema = z.object({ name: z.string() });

const fieldsSchema = z
  .array(fieldSchema)
  .superRefine((fields, ctx) => assertUniqueFieldNames(fields, ctx));

describe("assertUniqueFieldNames", () => {
  it("accepte des noms distincts", () => {
    const r = fieldsSchema.safeParse([{ name: "Nom" }, { name: "Prix" }]);
    expect(r.success).toBe(true);
  });

  it("rejette des noms en double (insensible à la casse)", () => {
    const r = fieldsSchema.safeParse([{ name: "Prix" }, { name: "  prix  " }]);
    expect(r.success).toBe(false);
    if (!r.success) {
      const messages = r.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("en double"))).toBe(true);
    }
  });

  it("ignore les noms vides", () => {
    const r = fieldsSchema.safeParse([{ name: "" }, { name: "   " }, { name: "Nom" }]);
    expect(r.success).toBe(true);
  });
});
