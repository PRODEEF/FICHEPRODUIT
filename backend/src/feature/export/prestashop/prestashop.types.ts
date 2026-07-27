import type { PrestashopCombinationHeader, PrestashopProductHeader } from "./prestashop-headers";

/** Ligne CSV produits (clés = en-têtes FR PrestaShop). */
export type PrestashopProductRow = Record<PrestashopProductHeader, string>;

/** Ligne CSV déclinaisons. */
export type PrestashopCombinationRow = Record<PrestashopCombinationHeader, string>;

/** Type de groupe d’attribut PrestaShop pour l’import CSV. */
export type PrestashopAttributeType = "select" | "color" | "radio";

/** Choix d’attribut ordonné (une passe → colonnes groupes + valeurs alignées). */
export type PrestashopAttributeChoice = {
  name: string;
  type: PrestashopAttributeType;
  position: number;
  value: string;
};

export type PrestashopExportType = "products" | "combinations";
