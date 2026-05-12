import { cn } from './cn';

describe('cn', () => {
  it('fusionne les classes et résout les conflits Tailwind', () => {
    expect(cn('px-2 py-1', 'px-4')).toContain('px-4');
    expect(cn('a', undefined, 'c')).toBe('a c');
  });
});
