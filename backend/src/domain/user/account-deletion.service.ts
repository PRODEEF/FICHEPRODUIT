import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import type { Database } from "../../core/supabase/database.types";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { StripeService } from "../billing/stripe.service";

type CreditLotRow = Database["public"]["Tables"]["credit_lots"]["Row"];
type UserBillingRow = Database["public"]["Tables"]["user_billing"]["Row"];
type BillingInvoiceArchiveInsert =
  Database["public"]["Tables"]["billing_invoice_archive"]["Insert"];

/**
 * Orchestre la suppression définitive d'un compte utilisateur (RGPD art. 17) :
 *
 * 1. Ré-authentification par mot de passe (protection contre la suppression involontaire).
 * 2. Annulation immédiate de l'abonnement Stripe éventuel.
 * 3. Archivage sans PII des lots de crédits liés à des factures (obligation comptable).
 * 4. Purge du journal de crédits (ON DELETE RESTRICT sur `credit_lots`).
 * 5. Anonymisation du client Stripe (email/nom/téléphone effacés, `metadata.deleted_at`).
 * 6. Suppression du compte Supabase Auth → cascade sur `public.users` puis toutes les
 *    tables reliées (shops, user_billing, credit_lots, user_entitlements, ...).
 *
 * Les étapes 2 → 5 sont exécutées avant la suppression d'auth : si l'une d'elles échoue,
 * le compte reste utilisable pour retenter la demande (aucune donnée partiellement supprimée).
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly stripe: StripeService,
  ) {}

  async deleteAccount(user: AuthenticatedUser, password: string): Promise<void> {
    const passwordOk = await this.supabase.verifyEmailPassword(user.email, password);
    if (!passwordOk) {
      throw new UnauthorizedException("Mot de passe incorrect.");
    }

    try {
      const billing = await this.loadBilling(user.id);

      if (billing?.active_subscription_id) {
        await this.stripe.cancelSubscription(billing.active_subscription_id);
      }

      const lots = await this.loadCreditLots(user.id);
      await this.archiveInvoiceLots(lots);
      await this.deleteCreditTransactions(user.id);

      if (billing?.stripe_customer_id) {
        await this.stripe.anonymizeCustomer(billing.stripe_customer_id);
      }

      await this.deleteAuthUser(user.id);

      this.logger.log(`Compte supprimé : user=${user.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`deleteAccount(${user.id}) failed : ${message}`);
      // On propage les exceptions HTTP typées (Unauthorized, ServiceUnavailable, etc.)
      // afin que le client reçoive un code pertinent.
      if (error instanceof HttpException) throw error;
      // Toute erreur inconnue est masquée pour éviter de fuiter des détails techniques.
      throw new InternalServerErrorException(
        "La suppression du compte a échoué. Réessayez ou contactez le support.",
      );
    }
  }

  private async loadBilling(userId: string): Promise<UserBillingRow | null> {
    const { data, error } = await this.supabase.admin
      .from("user_billing")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      this.logger.error(`loadBilling(${userId}) failed`, error);
      throw new InternalServerErrorException("Impossible de lire les informations de facturation.");
    }
    return (data as UserBillingRow | null) ?? null;
  }

  private async loadCreditLots(userId: string): Promise<CreditLotRow[]> {
    const { data, error } = await this.supabase.admin
      .from("credit_lots")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      this.logger.error(`loadCreditLots(${userId}) failed`, error);
      throw new InternalServerErrorException("Impossible de lire les lots de crédits.");
    }
    return (data ?? []) as CreditLotRow[];
  }

  private async archiveInvoiceLots(lots: CreditLotRow[]): Promise<void> {
    const toArchive = lots
      .filter((lot) => this.shouldArchive(lot))
      .map<BillingInvoiceArchiveInsert>((lot) => ({
        stripe_invoice_id: lot.stripe_invoice_id,
        stripe_checkout_session_id: lot.stripe_checkout_session_id,
        credits_amount: lot.amount_initial,
        source: lot.source,
        plan_id: lot.plan_id,
        sector: lot.sector,
        purchased_at: lot.created_at,
      }));

    if (toArchive.length === 0) return;

    const { error } = await this.supabase.admin.from("billing_invoice_archive").insert(toArchive);
    if (error) {
      this.logger.error("archiveInvoiceLots insert failed", error);
      throw new InternalServerErrorException("Impossible d'archiver les factures.");
    }
  }

  private shouldArchive(lot: CreditLotRow): boolean {
    if (lot.stripe_invoice_id !== null) return true;
    if (lot.stripe_checkout_session_id !== null) return true;
    return lot.source === "pack_purchase" || lot.source === "subscription_grant";
  }

  private async deleteCreditTransactions(userId: string): Promise<void> {
    // Requis avant la suppression du compte : `credit_transactions.lot_id → credit_lots(id)`
    // est en ON DELETE RESTRICT ; sans purge préalable, la cascade auth échouerait.
    const { error } = await this.supabase.admin
      .from("credit_transactions")
      .delete()
      .eq("user_id", userId);
    if (error) {
      this.logger.error(`deleteCreditTransactions(${userId}) failed`, error);
      throw new InternalServerErrorException("Impossible de purger le journal des crédits.");
    }
  }

  private async deleteAuthUser(userId: string): Promise<void> {
    const { error } = await this.supabase.admin.auth.admin.deleteUser(userId);
    if (error) {
      this.logger.error(`deleteAuthUser(${userId}) failed`, error);
      throw new InternalServerErrorException("Impossible de supprimer l'identité Supabase.");
    }
  }
}
