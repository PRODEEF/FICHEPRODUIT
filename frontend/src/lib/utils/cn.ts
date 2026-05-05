/** Concatène des noms de classes CSS en omettant les valeurs fausses. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
