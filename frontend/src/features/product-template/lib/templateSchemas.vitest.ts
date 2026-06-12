import { describe, expect, it } from 'vitest';

import {
  buildTemplateSaveSchema,
  findDuplicateFieldRowIds,
  templateNameDuplicateMessage,
} from './templateSchemas';

describe('buildTemplateSaveSchema', () => {
  it('accepte un nom et des champs distincts', () => {
    const schema = buildTemplateSaveSchema({ existingNames: ['Autre fiche'] });
    const r = schema.safeParse({
      name: 'Ma fiche',
      fieldRows: [
        { id: '1', name: 'Nom', type: 'text', required: false },
        { id: '2', name: 'Prix', type: 'price', required: true },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejette un nom déjà pris (insensible à la casse)', () => {
    const schema = buildTemplateSaveSchema({ existingNames: ['Ma Fiche'] });
    const r = schema.safeParse({
      name: '  ma fiche  ',
      fieldRows: [{ id: '1', name: 'Nom', type: 'text', required: false }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe(templateNameDuplicateMessage('Ma Fiche'));
    }
  });

  it('autorise le nom actuel en édition via excludeName', () => {
    const schema = buildTemplateSaveSchema({
      existingNames: ['Ma fiche'],
      excludeName: 'Ma fiche',
    });
    const r = schema.safeParse({
      name: 'Ma fiche',
      fieldRows: [{ id: '1', name: 'Nom', type: 'text', required: false }],
    });
    expect(r.success).toBe(true);
  });

  it('rejette des champs en double', () => {
    const schema = buildTemplateSaveSchema({ existingNames: [] });
    const r = schema.safeParse({
      name: 'Fiche',
      fieldRows: [
        { id: '1', name: 'Prix', type: 'price', required: false },
        { id: '2', name: '  prix  ', type: 'text', required: false },
      ],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('en double'))).toBe(true);
    }
  });
});

describe('findDuplicateFieldRowIds', () => {
  it('retourne les IDs des lignes en doublon', () => {
    const ids = findDuplicateFieldRowIds([
      { id: 'a', name: 'Prix', type: 'price', required: false },
      { id: 'b', name: 'Nom', type: 'text', required: false },
      { id: 'c', name: 'prix', type: 'text', required: false },
    ]);
    expect(ids.has('a')).toBe(true);
    expect(ids.has('c')).toBe(true);
    expect(ids.has('b')).toBe(false);
  });
});
