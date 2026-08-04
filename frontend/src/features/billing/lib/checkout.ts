import { isApiError } from '@api/apiError';
import { createCheckoutSession } from '@api/billing';
import type { BillingPlanId } from '@api/types/api.types';
import { apiErrorMessage } from '@lib/apiErrorMessage';
import type { ShopSectorLabel } from '@shared/lib/shopSectors';

export type CheckoutResult = { ok: true } | { ok: false; message: string; needsAuth?: boolean };

/**
 * Lance le paiement Stripe pour un forfait et un secteur donnés.
 * Redirige le navigateur vers l'URL Checkout en cas de succès.
 */
export async function startPlanCheckout(
  planId: BillingPlanId,
  sector: ShopSectorLabel,
): Promise<CheckoutResult> {
  try {
    const { url } = await createCheckoutSession({ planId, sector });
    window.location.assign(url);
    return { ok: true };
  } catch (err) {
    if (isApiError(err) && err.status === 401) {
      return {
        ok: false,
        needsAuth: true,
        message: 'Connecte-toi pour acheter des crédits.',
      };
    }
    return {
      ok: false,
      message: apiErrorMessage(err, 'Le paiement n’a pas pu démarrer.'),
    };
  }
}
