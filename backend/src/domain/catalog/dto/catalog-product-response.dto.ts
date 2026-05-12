import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const catalogProductResponseSchema = z.object({
  id: z.uuid().describe("Identifiant produit catalogue"),
  name: z.string().describe("Libellé fabricant"),
  brand: z.string().describe("Marque"),
  sector: z.string().describe("Secteur (axe métier)"),
  category: z.string().describe("Catégorie"),
  subCategory: z.string().nullable().describe("Sous-catégorie"),
  year: z.number().int().describe("Année modèle (0 si inconnue)"),
  price: z.number().describe("Prix catalogue"),
  description: z.string().describe("Description texte brut"),
  detailedDescription: z.string().describe("Description détaillée / fiche technique"),
  images: z.array(z.string()).describe("URLs des visuels"),
  url: z.string().describe("Lien fiche fabricant / source"),
  attributes: z.record(z.string(), z.string()).describe("Attributs libres (couleur, taille, etc.)"),
});

export class CatalogProductResponseDto extends createZodDto(catalogProductResponseSchema) {}
