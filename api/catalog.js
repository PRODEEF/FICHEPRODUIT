/**
 * API Vercel : retourne le catalogue enrichi pour un secteur (ex. kitesurf).
 * GET /api/catalog?section=kitesurf
 * Si un fichier catalogs/{section}/products.json existe, on le renvoie ;
 * sinon 404 (l'app utilisera le catalogue statique data.js).
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const section = (req.query?.section || 'kitesurf').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!section) return res.status(400).json({ error: 'Paramètre section manquant' });

  const filePath = join(ROOT, 'catalogs', section, 'products.json');
  let data;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch (_) {
    return res.status(404).json({ error: 'Catalogue non disponible', section });
  }

  const products = data.products || data;
  const list = Array.isArray(products) ? products : [];
  return res.status(200).json({
    section: data.sector || section,
    updated: data.updated || null,
    count: list.length,
    products: list
  });
}
