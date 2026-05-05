import type { ZodError } from 'zod';

export function parseZodFieldErrors<K extends string>(error: ZodError): Partial<Record<K, string>> {
  const result: Partial<Record<K, string>> = {};

  for (const issue of error.issues) {
    const head = issue.path[0];
    if (typeof head !== 'string' || !head || result[head as K]) continue;
    result[head as K] = issue.message;
  }
  return result;
}
