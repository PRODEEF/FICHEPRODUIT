---
name: billing-stripe
description: >
  Module billing du backend FicheProduit : Stripe checkout, webhooks, crédits, plans tarifaires,
  débit à l'export. Consulte ce skill dès qu'on touche à domain/billing/, aux crédits utilisateur,
  aux sessions Stripe, ou aux endpoints /api/billing. Complète nestjs-repository-pattern.
paths:
  - "backend/src/domain/billing/**/*.ts"
  - "backend/src/feature/export/**/*.ts"
---

# Billing & Stripe — Backend FicheProduit

## Vue d'ensemble

Le billing gère :

- **Plans tarifaires** affichés sur la page Pricing (API + config `billing-pricing`)
- **Checkout Stripe** pour acheter des crédits ou un abonnement
- **Webhooks Stripe** pour confirmer les paiements et créditer le compte
- **Ledger de crédits** : lots, transactions, entitlements utilisateur
- **Débit à l'export** CSV (feature `export/` consomme `CreditService`)

---

## Structure du module

| Fichier / dossier                    | Rôle                                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| `billing.controller.ts`              | Endpoints utilisateur authentifié (résumé, plans, checkout) |
| `billing.service.ts`                 | Orchestration métier billing                                |
| `stripe.service.ts`                  | Appels API Stripe (sessions checkout) — pas de Supabase     |
| `stripe-webhook.controller.ts`       | `POST` webhook brut (body signature)                        |
| `stripe-webhook.service.ts`          | Vérification signature + traitement événements              |
| `credit.service.ts`                  | Débit crédits (export)                                      |
| `credit-ledger.service.ts`           | Consultation soldes / historique                            |
| `credit-grant.service.ts`            | Attribution crédits après paiement                          |
| `pricing/billing-pricing.service.ts` | Plans et tarifs exposés API                                 |
| `repositories/*`                     | Persistance Supabase (4 repositories)                       |

---

## Repositories et symboles

| Interface                      | Symbol                          | Responsabilité               |
| ------------------------------ | ------------------------------- | ---------------------------- |
| `IUserBillingRepository`       | `USER_BILLING_REPOSITORY`       | Profil billing utilisateur   |
| `ICreditLotRepository`         | `CREDIT_LOT_REPOSITORY`         | Lots de crédits (FIFO débit) |
| `ICreditTransactionRepository` | `CREDIT_TRANSACTION_REPOSITORY` | Historique transactions      |
| `IUserEntitlementRepository`   | `USER_ENTITLEMENT_REPOSITORY`   | Droits / quotas              |

Tous suivent le pattern standard : `forUser(accessToken)` pour opérations utilisateur, `.admin` uniquement pour opérations système documentées (webhooks, grants système).

---

## Flux checkout

```
Frontend → POST /api/billing/checkout (CreateCheckoutDto)
    → BillingService → StripeService.createCheckoutSession
    → URL Stripe renvoyée au client

Utilisateur paie sur Stripe
    → Webhook POST /api/billing/stripe/webhook
    → StripeWebhookService (vérif signature)
    → CreditGrantService + repositories
    → Crédits ajoutés au compte
```

---

## Flux débit export

```
Feature export/ → CreditService.debitForExport(...)
    → Vérif solde via CreditLedgerService
    → InsufficientCreditsException si solde insuffisant
    → Débit FIFO sur credit_lots + transaction enregistrée
```

Exceptions métier :

- `InsufficientCreditsException` — HTTP 402 ou mapping frontend modal crédits
- `InsufficientCreditsDebitError` — erreur interne ledger

---

## Règles spécifiques

- **Webhook** : ne jamais bypasser la vérification de signature Stripe
- **StripeService** : pas d'accès Supabase — uniquement SDK Stripe via `ConfigService`
- **Idempotence** : les webhooks peuvent être rejoués — vérifier les doublons côté grant
- **Secrets** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` dans `configuration.ts` uniquement
- **Tests** : mocker `StripeService` et les 4 repositories — pas d'appels Stripe réels

---

## Frontend associé

- Feature `frontend/src/features/billing/` — `BillingContext`, hooks `useBilling`
- API `frontend/src/api/billing.ts` — types dans `@types-api`
- Modal `InsufficientCreditsModal` sur export catalogue

---

## Checklist modification billing

- [ ] DTO Zod + Swagger sur nouveaux endpoints
- [ ] `JwtGuard` sur routes utilisateur ; webhook sans JWT mais avec signature Stripe
- [ ] Repository via Symbol — pas d'accès Supabase dans les services Stripe
- [ ] Tests unitaires service + spec webhook si logique nouvelle
- [ ] Vérifier impact sur débit export si changement ledger
