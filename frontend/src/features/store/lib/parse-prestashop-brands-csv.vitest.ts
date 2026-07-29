import { describe, expect, it } from 'vitest';

import {
  mergeBrands,
  parsePrestashopBrandsCsv,
  parseSemicolonCsvLine,
} from './parse-prestashop-brands-csv';

const SAMPLE_CSV = `ID;Logo;Nom;Adresses;Produits;Activé
1;;Duotone;--;3;1
17;;"Ride Engine";--;0;1
2;;Quiksilver;--;5;0
3;;;--;0;1
4;;   ;--;0;1
`;

describe('parseSemicolonCsvLine', () => {
  it('découpe les champs simples', () => {
    expect(parseSemicolonCsvLine('1;;Duotone;--;3;1')).toEqual([
      '1',
      '',
      'Duotone',
      '--',
      '3',
      '1',
    ]);
  });

  it('retire les guillemets autour d’un champ', () => {
    expect(parseSemicolonCsvLine('17;;"Ride Engine";--;0;1')).toEqual([
      '17',
      '',
      'Ride Engine',
      '--',
      '0',
      '1',
    ]);
  });

  it('gère les guillemets échappés', () => {
    expect(parseSemicolonCsvLine('"Marque ""Pro"""')).toEqual(['Marque "Pro"']);
  });
});

describe('parsePrestashopBrandsCsv', () => {
  it('extrait les marques actives du CSV d’exemple', () => {
    const result = parsePrestashopBrandsCsv(SAMPLE_CSV);
    expect(result.brands).toEqual(['Duotone', 'Ride Engine']);
    expect(result.skippedInactive).toBe(1);
    expect(result.skippedInvalid).toBe(2);
    expect(result.skippedDuplicate).toBe(0);
  });

  it('importe les noms entre guillemets sans les guillemets', () => {
    const csv = `Nom;Activé
"Ride Engine";1
`;
    expect(parsePrestashopBrandsCsv(csv).brands).toEqual(['Ride Engine']);
  });

  it('ignore les lignes inactives (Activé=0)', () => {
    const csv = `Nom;Activé
Active;1
Inactive;0
AlsoActive;true
`;
    const result = parsePrestashopBrandsCsv(csv);
    expect(result.brands).toEqual(['Active', 'AlsoActive']);
    expect(result.skippedInactive).toBe(1);
  });

  it('ignore les noms vides ou invalides', () => {
    const csv = `Nom;Activé
Ok;1
;1
${'x'.repeat(65)};1
`;
    const result = parsePrestashopBrandsCsv(csv);
    expect(result.brands).toEqual(['Ok']);
    expect(result.skippedInvalid).toBe(2);
  });

  it('importe toutes les lignes si la colonne Activé est absente', () => {
    const csv = `ID;Nom;Produits
1;Duotone;3
2;Quiksilver;5
`;
    const result = parsePrestashopBrandsCsv(csv);
    expect(result.brands).toEqual(['Duotone', 'Quiksilver']);
    expect(result.skippedInactive).toBe(0);
  });

  it('accepte les en-têtes anglais Name/Active', () => {
    const csv = `ID;Name;Active
1;Duotone;1
2;Quiksilver;0
`;
    const result = parsePrestashopBrandsCsv(csv);
    expect(result.brands).toEqual(['Duotone']);
    expect(result.skippedInactive).toBe(1);
  });

  it('déduplique les doublons dans le CSV (insensible à la casse)', () => {
    const csv = `Nom;Activé
Nike;1
nike;1
NIKE;1
`;
    const result = parsePrestashopBrandsCsv(csv);
    expect(result.brands).toEqual(['Nike']);
    expect(result.skippedDuplicate).toBe(2);
  });

  it('lève une erreur si la colonne Nom est absente', () => {
    expect(() => parsePrestashopBrandsCsv('ID;Logo;Activé\n1;;1')).toThrow(
      /Colonne « Nom » introuvable/,
    );
  });

  it('lève une erreur si le fichier est vide', () => {
    expect(() => parsePrestashopBrandsCsv('   \n  ')).toThrow(/CSV est vide/);
  });
});

describe('mergeBrands', () => {
  it('conserve l’existant en premier et ajoute les nouvelles marques', () => {
    const result = mergeBrands(['Nike', 'Adidas'], ['Puma', 'Nike', 'Vans']);
    expect(result.brands).toEqual(['Nike', 'Adidas', 'Puma', 'Vans']);
    expect(result.added).toBe(2);
    expect(result.alreadyPresent).toBe(1);
  });

  it('déduplique sans tenir compte de la casse et garde l’orthographe existante', () => {
    const result = mergeBrands(['Nike'], ['nike', 'NIKE', 'Puma']);
    expect(result.brands).toEqual(['Nike', 'Puma']);
    expect(result.added).toBe(1);
    expect(result.alreadyPresent).toBe(2);
  });
});
