import { waitUntil } from "@vercel/functions";

/**
 * Enregistre une promesse pour qu’elle se termine après l’envoi de la réponse HTTP
 * sur Vercel (`waitUntil`), tout en conservant un comportement correct en local
 * (`void` sur la même promesse).
 */
export function scheduleBackgroundWork(task: Promise<unknown>): void {
  const settled = task.catch(() => undefined);
  try {
    waitUntil(settled);
  } catch {
    // waitUntil exige une Thenable — ne pas bloquer l’appelant
  }
  void settled;
}
