---
name: nestjs-testing
description: >
  Écriture de tests NestJS : unit tests (Service, Repository) avec Jest et mocks Supabase,
  tests e2e HTTP avec Supertest. Consulte ce skill quand tu crées ou modifie un Service,
  Repository ou Controller ou qu'on demande explicitement des tests. Couvre mocks,
  TestingModule, buildSupabaseQueryMock pour PostgREST, e2e avec app bootstrapée.
  Stack : Jest, Supertest, Nest Testing.
paths:
  - "backend/**/*.ts"
---

# NestJS — Tests (Jest + Supertest) — FicheProduit

## Philosophie

- **Unit tests** : logique métier du Service et requêtes du Repository isolées.
- **E2e** : flux HTTP (Controller → Service → Repository mocké).
- Éviter un test Controller seul hors e2e : la valeur est dans le flux.
- Priorité aux **chemins métier**, pas au coverage mécanique à 100 %.
- **Service** : mocker l'**interface Repository** via son Symbol — jamais SupabaseService directement.
- **Repository** : mocker `SupabaseService.forUser()` / `.admin` via les helpers partagés.

---

## Structure des fichiers

```
src/domain/shop/
├── shop.service.ts
├── shop.service.spec.ts
├── shop.repository.ts
├── shop.repository.spec.ts
└── shop.repository.interface.ts

src/test-utils/
└── supabase-query.mock.ts    ← buildSupabaseQueryMock, createSupabaseServiceMock

test/
└── *.e2e-spec.ts             ← tests e2e HTTP (config jest-e2e.json)
```

---

## Mocks Supabase partagés

Utiliser **`backend/src/test-utils/supabase-query.mock.ts`** — ne pas recréer un mock inline.

```typescript
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
```

- `buildSupabaseQueryMock({ data, error })` — client PostgREST chainable (`from`, `select`, `eq`, `maybeSingle`, etc.)
- `createSupabaseServiceMock(userClient)` — retourne `{ forUser, admin, anon, getUser }` avec `forUser` pointant vers `userClient`

---

## Unit test — Service

Pattern FicheProduit : injection via **Symbol + interface**, pas la classe Repository.

### `shop.service.spec.ts`

```typescript
import { NotFoundException } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { SHOP_REPOSITORY } from "./shop.repository.interface";
import type { IShopRepository } from "./shop.repository.interface";

describe("ShopService", () => {
  const repoMock: jest.Mocked<IShopRepository> = {
    findById: jest.fn(),
    findAllByOwner: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    transferToUser: jest.fn(),
  };

  const service = new ShopService(repoMock);

  beforeEach(() => jest.clearAllMocks());

  describe("getShopForUser", () => {
    it("retourne la boutique si elle appartient à l'utilisateur", async () => {
      const shop = { id: "shop-1", ownerId: "user-1", name: "Test", url: "https://x.com" };
      repoMock.findById.mockResolvedValue(shop as never);

      const result = await service.getShopForUser("shop-1", "user-1", "token");

      expect(repoMock.findById).toHaveBeenCalledWith("shop-1", "token");
      expect(result).toMatchObject({ id: "shop-1" });
    });

    it("lève NotFoundException si la boutique est introuvable", async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.getShopForUser("x", "user-1", "token")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

Alternative avec `Test.createTestingModule` :

```typescript
const module = await Test.createTestingModule({
  providers: [
    ShopService,
    { provide: SHOP_REPOSITORY, useValue: repoMock },
  ],
}).compile();
```

---

## Unit test — Repository

Référence : `backend/src/domain/shop/shop.repository.spec.ts`.

```typescript
import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { ShopRepository } from "./shop.repository";

describe("ShopRepository", () => {
  let repository: ShopRepository;
  let userClient: ReturnType<typeof buildSupabaseQueryMock>;
  let supabase: ReturnType<typeof createSupabaseServiceMock>;

  beforeEach(async () => {
    userClient = buildSupabaseQueryMock({ data: null, error: null });
    supabase = createSupabaseServiceMock(userClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopRepository, { provide: SupabaseService, useValue: supabase }],
    }).compile();

    repository = module.get(ShopRepository);
  });

  it("findById retourne une entité mappée", async () => {
    const row = {
      id: "shop-1",
      name: "Ma boutique",
      url: "https://example.com",
      cms: "prestashop",
      sector: "Glisse",
      brands: [],
      categories: [],
      user_id: "user-1",
      session_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };
    userClient.maybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const shop = await repository.findById("shop-1", "token");

    expect(shop?.ownerId).toBe("user-1");
    expect(supabase.forUser).toHaveBeenCalledWith("token");
  });

  it("findById retourne null sans erreur inattendue", async () => {
    userClient.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const shop = await repository.findById("inexistant", "token");

    expect(shop).toBeNull();
  });

  it("lève InternalServerErrorException sur erreur PostgREST inattendue", async () => {
    userClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "500", message: "DB error" },
    });

    await expect(repository.findById("shop-1", "token")).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
```

> Pour les opérations admin (transfert guest→user), mocker `supabase.admin` via le client retourné par `createSupabaseServiceMock`.

---

## E2e test — Supertest

### Prérequis validation Zod

L'application bootstrapée doit enregistrer le même **`ZodValidationPipe` global** que dans `AppModule` (provider `APP_PIPE`). Un `POST` avec body invalide doit produire **`400`**.

### `test/shop.e2e-spec.ts` (exemple)

```typescript
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { SHOP_REPOSITORY } from "../src/domain/shop/shop.repository.interface";

const mockShopRepository = {
  findById: jest.fn(),
  findAllByOwner: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  transferToUser: jest.fn(),
};

describe("ShopController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SHOP_REPOSITORY)
      .useValue(mockShopRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it("GET /api/shops/:id — 404 si introuvable", async () => {
    mockShopRepository.findById.mockResolvedValue(null);
    await request(app.getHttpServer()).get("/api/shops/inexistant").expect(404);
  });
});
```

> Les e2e réels du projet sont dans `backend/test/` avec `jest-e2e.json`. S'inspirer des fichiers existants pour l'auth Bearer et le bootstrap Fastify.

---

## Configuration Jest

Le projet utilise la config Jest du backend (`backend/package.json` scripts : `npm test`, e2e via `test/jest-e2e.json`). Ne pas dupliquer une config locale dans les skills — vérifier les fichiers existants avant d'en ajouter.

---

## Checklist tests

**Unit — Service :**

- [ ] Mock complet de l'interface Repository (toutes les méthodes)
- [ ] Injection via Symbol (`SHOP_REPOSITORY`, etc.)
- [ ] Cas nominal + cas d'erreur métier (`NotFoundException`, `ForbiddenException`)
- [ ] `jest.clearAllMocks()` dans `beforeEach`
- [ ] Vérifier que `accessToken` est propagé au Repository quand applicable

**Unit — Repository :**

- [ ] Utiliser `buildSupabaseQueryMock` + `createSupabaseServiceMock`
- [ ] Vérifier `supabase.forUser(token)` appelé avec le bon token
- [ ] Null / données absentes sans exception
- [ ] Erreurs inconnues ⇒ `InternalServerErrorException`
- [ ] Mapping `toEntity` (snake_case DB → camelCase métier)

**E2e :**

- [ ] `ZodValidationPipe` global actif → `400` sur body invalide
- [ ] Override du Repository via Symbol (pas de Postgres réel)
- [ ] Codes HTTP pertinents (`200`, `201`, `400`, `404`, `401`)
