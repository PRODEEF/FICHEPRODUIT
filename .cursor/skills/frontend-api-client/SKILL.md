---
name: frontend-api-client
description: >
  Client HTTP frontend vers le backend NestJS : nestHttpClient, ApiError, getApiBaseUrl,
  types @types-api, organisation src/api/. Consulte ce skill dès qu'on ajoute un appel API,
  un endpoint consommé côté React, ou qu'on gère les erreurs HTTP Nest. Complète 200-frontend.mdc.
  Fichiers API existants : analysis, billing, catalog, export, shop, suggestUrls, user.
paths:
  - "frontend/src/api/**/*.ts"
  - "frontend/src/features/**/hooks/**/*.ts"
---

# Client API frontend — FicheProduit

## Règle d'architecture

```
Composant (.tsx)
    → Hook (features/*/hooks/ ou shared/hooks/)
        → Fonction async (src/api/*.ts)
            → requestNestJson (nestHttpClient.ts)
                → Backend Nest /api/*
```

- ❌ **Jamais** de `fetch()` direct dans un composant `.tsx`
- ❌ **Jamais** d'import d'une fonction `src/api/` directement dans un composant
- ✅ Fonctions API = async pures, sans état React
- ✅ Hooks exposent `loading`, `error`, données

---

## Fichiers clés

| Fichier                             | Rôle                                                     |
| ----------------------------------- | -------------------------------------------------------- |
| `src/api/nestHttpClient.ts`         | `requestNestJson`, auth headers                          |
| `src/api/apiError.ts`               | `ApiError`, `NetworkError`, `isApiError`, `isAbortError` |
| `src/shared/lib/apiErrorMessage.ts` | Messages UI FR (`apiErrorMessage`)                       |
| `src/api/apiBase.ts`                | `getApiBaseUrl()` — `VITE_API_URL` ou URLs relatives     |
| `src/api/apiAuth.ts`                | Helpers auth / `apiFetch`                                |
| `src/api/types/api.types.ts`        | Types partagés — import `@types-api`                     |
| `src/api/<domaine>.ts`              | Une fonction par endpoint — voir `shop.ts`, `catalog.ts`, `billing.ts` |

---

## `requestNestJson`

Client HTTP unique pour Nest :

```typescript
import { requestNestJson, getSupabaseSessionAuthHeaders } from "@api/nestHttpClient";

export async function fetchMyShop(): Promise<Shop> {
  return requestNestJson<Shop>({
    method: "GET",
    path: "/shops/me",
    authHeaders: getSupabaseSessionAuthHeaders,
  });
}
```

Options principales :

- `path` — relatif à `/api` (ex. `/shops/me` → `{base}/api/shops/me`)
- `absoluteUrl` — URL complète ou relative à l'origin (cas exceptionnels)
- `authHeaders` — async, typiquement `getSupabaseSessionAuthHeaders`
- `bearerToken` — Bearer explicite si besoin
- `body` — sérialisé JSON automatiquement

---

## Gestion des erreurs

```typescript
import { isApiError, isAbortError } from "@api/apiError";
import { apiErrorMessage } from "@lib/apiErrorMessage";

try {
  await patchMyShop(body);
} catch (e) {
  if (isAbortError(e)) return; // annulation — ne pas afficher
  if (isApiError(e)) {
    // e.status, e.body, e.url, e.method — message serveur brut dans e.message
  }
  setError(apiErrorMessage(e)); // texte UI FR (4xx = serveur, 5xx = générique)
}
```

Les clients HTTP lèvent via `ApiError.from(status, body, { url, method })`.
`NetworkError` couvre DNS/CORS/offline. Ne pas utiliser `instanceof ApiError` (HMR).

Dans les hooks : capturer l'erreur, exposer `error: string | null` via `apiErrorMessage`.

---

## Types API (`@types-api`)

Types des entités et payloads API centralisés dans `src/api/types/api.types.ts`.

```typescript
import type { Shop, PatchMyShopBody } from "@types-api";
```

- Ne pas importer depuis un ancien `generated/api.ts` (supprimé)
- Types spécifiques à un seul feature UI → `features/<nom>/types.ts`
- Types partagés backend/frontend contract → `@types-api`

---

## Alias TypeScript (tsconfig)

| Alias        | Cible                     |
| ------------ | ------------------------- |
| `@api/*`     | `src/api/*`               |
| `@types-api` | `src/api/types/api.types` |
| `@shared/*`  | `src/shared/*`            |
| `@lib/*`     | `src/shared/lib/*`        |
| `@ui`        | `src/shared/ui/index.ts`  |

---

## Auth sur les requêtes

- Endpoints protégés : `authHeaders: getSupabaseSessionAuthHeaders` (Bearer depuis session Supabase)
- Session invité : voir `shared/lib/analysis/guestSessionStorage.ts` + paramètres API documentés dans `user.ts` / `analysis.ts`
- Supabase client : `getSupabaseClient()` depuis `@shared/supabase` — jamais dans un composant pour un appel API direct

---

## Ajouter un nouvel endpoint

1. Ajouter types dans `api.types.ts` si nouveau contrat
2. Créer la fonction dans `src/api/<domaine>.ts` avec `requestNestJson`
3. Consommer via un hook dans `features/<nom>/hooks/`
4. Test Vitest `src/api/<domaine>.vitest.ts` si logique de mapping ou erreurs non triviales

---

## Checklist

- [ ] Fonction dans `src/api/`, pas dans le composant
- [ ] Types depuis `@types-api` ou types feature locaux
- [ ] `isApiError` / `apiErrorMessage` gérés dans le hook
- [ ] `void` sur les appels async dans `useEffect` et handlers JSX
