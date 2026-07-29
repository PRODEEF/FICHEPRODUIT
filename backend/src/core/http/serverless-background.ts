import { Logger } from "@nestjs/common";
import { waitUntil } from "@vercel/functions";

const logger = new Logger("scheduleBackgroundWork");

/**
 * Enregistre une promesse pour qu’elle se termine après l’envoi de la réponse HTTP
 * sur Vercel (`waitUntil`), tout en conservant un comportement correct en local
 * (`void` sur la même promesse).
 */
export function scheduleBackgroundWork(task: Promise<unknown>): void {
  const settled = task.catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Tâche background échouée: ${message}`);
  });
  try {
    waitUntil(settled);
  } catch {
    // waitUntil exige une Thenable — ne pas bloquer l’appelant
  }
  void settled;
}
