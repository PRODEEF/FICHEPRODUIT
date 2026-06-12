import type { z } from "zod";

type FieldWithName = { name: string };

/**
 * Vérifie l'absence de noms de champs en double (comparaison insensible à la casse).
 * Ajoute une issue Zod sur chaque occurrence dupliquée.
 */
export function assertUniqueFieldNames(
  fields: FieldWithName[],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[] = ["fields"],
): void {
  const seen = new Map<string, number>();

  fields.forEach((field, index) => {
    const key = field.name.trim().toLowerCase();
    if (!key) return;

    const firstIndex = seen.get(key);
    if (firstIndex === undefined) {
      seen.set(key, index);
      return;
    }

    const displayName = field.name.trim();
    ctx.addIssue({
      code: "custom",
      path: [...pathPrefix, index, "name"],
      message: `Le champ « ${displayName} » est en double.`,
    });
    ctx.addIssue({
      code: "custom",
      path: [...pathPrefix, firstIndex, "name"],
      message: `Le champ « ${fields[firstIndex]?.name.trim() ?? displayName} » est en double.`,
    });
  });
}
