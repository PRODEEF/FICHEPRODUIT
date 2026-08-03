import { describe, expect, it } from 'vitest';

import {
  asRecord,
  readNumber,
  readString,
  readStringArray,
  readStringRecord,
} from './parseJsonFields';

describe('parseJsonFields', () => {
  it('asRecord accepte les objets et refuse null / primitives', () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord(null)).toBeNull();
    expect(asRecord('x')).toBeNull();
  });

  it('readString / readNumber lisent les types attendus', () => {
    const o = { name: 'A', year: 2024, bad: 'nope' };
    expect(readString(o, 'name')).toBe('A');
    expect(readString(o, 'missing')).toBeNull();
    expect(readNumber(o, 'year')).toBe(2024);
    expect(readNumber(o, 'bad')).toBeNull();
  });

  it('readStringArray et readStringRecord filtrent les valeurs non string', () => {
    expect(readStringArray(['a', 1, 'b', null])).toEqual(['a', 'b']);
    expect(readStringArray('nope')).toEqual([]);
    expect(readStringRecord({ color: 'red', n: 1 })).toEqual({ color: 'red' });
    expect(readStringRecord(null)).toEqual({});
  });
});
