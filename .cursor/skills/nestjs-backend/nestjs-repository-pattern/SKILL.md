---
name: nestjs-repository-pattern
description: >
  Architecture et pattern Repository pour le backend NestJS de FicheProduit. Consulte ce skill
  dès qu'on crée ou modifie un module domain/ (user, shop, analysis, catalog, billing),
  qu'on écrit une interface Repository, qu'on implémente des mappers toEntity/toRow, ou qu'on
  se demande comment organiser les couches Controller → Service → Repository. Couvre aussi le
  SupabaseModule (core/supabase), le AuthModule (core/auth), les guards JwtGuard / OptionalJwtGuard,
  le décorateur @CurrentUser, et les règles d'usage des clients forUser() vs admin. À utiliser
  systématiquement avant de toucher à n'importe quel module du backend.
---

# Pattern Repository — Backend FicheProduit

## Vision produit

FicheProduit génère des fiches produits pour commerçants e-commerce. Le commerçant entre l'URL
de son shop → le site est analysé par l'IA → on détecte son secteur → on lui propose des produits
issus de **catalogues fabricants** scrappés → il les exporte en CSV pour PrestaShop / Shopify.

**Stack** : NestJS + TypeScript strict + Zod + Supabase JS + Fastify

---

## Architecture globale

```
src/
├── core/                        # Infrastructure partagée
│   ├── supabase/                # SupabaseModule @Global (client partagé)
│   ├── auth/                    # Guards + @CurrentUser decorator
│   └── scraper/                 # SiteScraperService (fetch HTML, détection CMS)
│
├── domain/                      # Modules métier — Controller / Service / Repository
│   ├── user/
│   ├── shop/
│   ├── analysis/
│   ├── catalog/
│   └── billing/                 # Stripe, crédits, plans, webhooks
│
└── feature/                     # Orchestration transverse — pas de Repository direct
    ├── suggest-urls/
    ├── export/                  # Génération CSV stateless (mapping IA)
    └── health/
```

**Règle de dépendance** : `feature/` → `domain/` → `core/`. Jamais l'inverse.

---

## Entités métier définies

### User

```typescript
type User = {
  id: string;
  email: string;
  username: string;
  websiteUrl: string | null;
  pendingAutoAnalyze: boolean;
};
```

### Shop

```typescript
type Shop = {
  id: string;
  name: string;
  url: string;
  cms: "prestashop" | "shopify" | "woocommerce" | "other" | "unknown";
  sector: string | null; // valeur libre
  brands: string[];
  categories: string[]; // catégories détectées sur le site (pas de produits individuels)
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};
```

### Analysis

```typescript
type Analysis = {
  id: string;
  url: string;
  status: "pending" | "running" | "done" | "failed";
  errorCode: "SITE_UNREACHABLE" | "UNANALYZABLE" | "UNKNOWN_SECTOR" | "INTERNAL_ERROR" | null;
  errorMessage: string | null;
  userId: string | null; // null si guest
  sessionId: string | null; // null si connecté — jamais les deux en même temps
  shopId: string | null; // créé/rattaché quand status = done
  createdAt: string;
};
// Règle : status=done → Shop toujours créé (même si sector=null)
// Au signup : transfert atomique Analysis + Shop du sessionId vers le userId
```

### CatalogProduct

```typescript
type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  sector: string;
  category: string;
  subCategory: string | null;
  year: number;
  price: number; // non nullable
  description: string; // texte brut fabricant
  detailedDescription: string; // fiche technique — vide si null en DB
  images: string[];
  url: string;
  attributes: Record<string, string>; // libre par produit (couleur, taille, référence…)
};
```

### Export PrestaShop (stateless — pas de table)

Module `feature/export/` : `CatalogProduct[]` → CSV PrestaShop généré à la volée, non persisté. Consomme `CreditService` pour le débit crédits.

### Billing (module `domain/billing/`)

Module multi-services avec **plusieurs repositories** et intégration Stripe :

```
domain/billing/
├── billing.controller.ts          # Plans, résumé compte, checkout session
├── billing.service.ts
├── stripe.service.ts              # API Stripe (checkout, pas de Repository)
├── stripe-webhook.controller.ts   # POST webhook — signature Stripe
├── stripe-webhook.service.ts
├── credit.service.ts              # Débit crédits export
├── credit-ledger.service.ts       # Ledger / soldes
├── credit-grant.service.ts        # Attribution crédits (achat, promo)
├── pricing/billing-pricing.service.ts
├── repositories/
│   ├── user-billing.repository.ts
│   ├── credit-lot.repository.ts
│   ├── credit-transaction.repository.ts
│   └── user-entitlement.repository.ts
└── dto/                           # Checkout, plans, billing summary
```

Symboles Repository : `USER_BILLING_REPOSITORY`, `CREDIT_LOT_REPOSITORY`, `CREDIT_TRANSACTION_REPOSITORY`, `USER_ENTITLEMENT_REPOSITORY`.

> Détails Stripe, webhooks, débit export → skill **`billing-stripe`**.

---

## core/supabase — SupabaseService

Le `SupabaseModule` est `@Global()` — importé une seule fois dans `AppModule`.

### Deux clients, deux usages stricts

```typescript
@Injectable()
export class SupabaseService {
  // Client scopé au JWT — RLS actives
  forUser(accessToken: string): SupabaseClient<Database>;

  // Client admin — bypass RLS — réservé aux opérations système
  get admin(): SupabaseClient<Database>;

  // Validation de token uniquement (pour le guard)
  async getUser(accessToken: string): Promise<User | null>;
}
```

**Règles d'usage :**

- `.forUser(token)` → dans tous les Repositories pour les opérations utilisateur
- `.admin` → uniquement pour : transfert guest→user au signup, opérations de maintenance
- Jamais de client Supabase instancié directement dans un Service ou Controller

---

## core/auth — Guards et décorateur

```
src/core/auth/
├── guards/
│   ├── jwt.guard.ts            # Route obligatoirement authentifiée
│   └── optional-jwt.guard.ts  # Route accessible guest ou user
├── decorators/
│   └── current-user.decorator.ts
└── types/
    └── jwt-payload.types.ts
```

```typescript
// Type injecté par le guard dans tous les controllers
type AuthenticatedUser = {
  id: string;
  email: string;
  accessToken: string; // passé aux Repositories pour scoper le client Supabase
};
```

**Dans les controllers — toujours utiliser `@CurrentUser()` :**

```typescript
// ❌ Avant
async create(@Req() req: FastifyRequest & { user?: User }, @Headers('authorization') auth: string)

// ✅ Après
async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateShopDto)
```

**Comportement `OptionalJwtGuard` :**

- Pas de token → guest, `req.user` undefined, pas d'erreur
- Token présent mais invalide → 401 explicite (pas de fallback silencieux en guest)

---

## Pattern Repository — structure d'un module domain/

```
src/domain/shop/
├── shop.module.ts
├── shop.controller.ts
├── shop.service.ts
├── shop.repository.interface.ts   # Le contrat (interface + Symbol)
├── shop.repository.ts             # L'implémentation Supabase
├── dto/
│   ├── create-shop.dto.ts
│   └── update-shop.dto.ts
└── types/
    └── shop.types.ts              # Types métier purs (pas les types DB)
```

### 1. L'interface Repository

```typescript
// shop.repository.interface.ts
import type { Shop, CreateShop, UpdateShop } from "./types/shop.types";

export interface IShopRepository {
  findById(id: string, accessToken: string): Promise<Shop | null>;
  findAllByOwner(ownerId: string, accessToken: string): Promise<Shop[]>;
  create(data: CreateShop, accessToken: string): Promise<Shop>;
  update(id: string, data: UpdateShop, accessToken: string): Promise<Shop>;
  transferToUser(sessionId: string, userId: string): Promise<void>; // admin
}

export const SHOP_REPOSITORY = Symbol("IShopRepository");
```

### 2. L'implémentation Repository

```typescript
// shop.repository.ts
@Injectable()
export class ShopRepository implements IShopRepository {
  private readonly logger = new Logger(ShopRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string, accessToken: string): Promise<Shop | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("shops")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to fetch shop");
    }
    return data ? this.toEntity(data) : null;
  }

  // Cas admin — bypass RLS
  async transferToUser(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from("shops")
      .update({ owner_id: userId, session_id: null })
      .eq("session_id", sessionId);

    if (error) throw new InternalServerErrorException(error.message);
  }

  // ─── Mappers ─────────────────────────────────────────────────
  // Si une colonne est renommée en DB, on ne change que ces deux fonctions.

  private toEntity(row: ShopRow): Shop {
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      cms: row.cms as Shop["cms"],
      sector: row.sector,
      brands: row.brands ?? [],
      categories: row.categories ?? [],
      ownerId: row.owner_id, // snake_case DB → camelCase métier
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toRow(shop: CreateShop): Omit<ShopRow, "id" | "created_at" | "updated_at"> {
    return {
      name: shop.name,
      url: shop.url,
      cms: shop.cms,
      sector: shop.sector,
      brands: shop.brands,
      categories: shop.categories,
      owner_id: shop.ownerId, // camelCase métier → snake_case DB
    };
  }
}
```

### 3. Le Service

```typescript
// shop.service.ts
@Injectable()
export class ShopService {
  constructor(
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepo: IShopRepository, // Interface, pas l'implémentation
  ) {}

  async getShopForUser(id: string, ownerId: string, accessToken: string): Promise<Shop> {
    const shop = await this.shopRepo.findById(id, accessToken);
    // Vérification métier : ownership
    if (!shop || shop.ownerId !== ownerId) throw new NotFoundException("Shop not found");
    return shop;
  }
}
```

### 4. Le Module

```typescript
// shop.module.ts
@Module({
  controllers: [ShopController],
  providers: [
    ShopService,
    {
      provide: SHOP_REPOSITORY, // Symbol comme token
      useClass: ShopRepository, // Implémentation injectée
    },
  ],
  exports: [ShopService],
})
export class ShopModule {}
```

---

## Règles non négociables

| Règle                                                 | Pourquoi                                                |
| ----------------------------------------------------- | ------------------------------------------------------- |
| Jamais de `SupabaseService` dans un `Service`         | Séparation des responsabilités                          |
| Toujours `toEntity()` / `toRow()` dans le Repository  | Le schéma DB ne fuite jamais dans le métier             |
| Interface + Symbol avant l'implémentation             | Testabilité — on mocke l'interface                      |
| `accessToken` dans chaque méthode Repository user     | RLS Supabase appliquées                                 |
| `.admin` uniquement pour les cas explicitement listés | Sécurité — bypass RLS intentionnel seulement            |
| `@CurrentUser()` dans tous les controllers            | Typage fort, plus de `req.headers.authorization` manuel |

---

## Checklist avant de committer un module

**Repository :**

- [ ] Implémente l'interface `I{Entity}Repository`
- [ ] Injecte uniquement `SupabaseService`
- [ ] Utilise `.forUser(accessToken)` pour les opérations user
- [ ] Utilise `.admin` uniquement pour les cas système documentés
- [ ] Mappers `toEntity()` et `toRow()` présents
- [ ] Logger NestJS sur chaque erreur Supabase
- [ ] `PGRST116` géré → retourne `null` (pas d'exception)

**Service :**

- [ ] Dépend de l'interface via `@Inject(SYMBOL)`
- [ ] Pas d'import `SupabaseService`
- [ ] Exceptions métier (`NotFoundException`, `ForbiddenException`) — pas `InternalServerErrorException`
- [ ] Vérifie l'ownership avant toute opération sensible

**Module :**

- [ ] `provide: SYMBOL` + `useClass: Implementation`
- [ ] N'exporte que le Service (jamais le Repository)

---

## Tests — mocker le Repository

```typescript
const module = await Test.createTestingModule({
  providers: [
    ShopService,
    {
      provide: SHOP_REPOSITORY,
      useValue: {
        findById: jest.fn().mockResolvedValue(mockShop),
        create: jest.fn(),
        findAllByOwner: jest.fn().mockResolvedValue([]),
      },
    },
  ],
}).compile();
// ShopService testé sans aucune dépendance Supabase
```

Pour les guides détaillés → skills `nestjs-controllers-dto`, `nestjs-swagger`, `nestjs-testing`, `billing-stripe`.
