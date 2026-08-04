---
name: frontend-validation
description: >
  Règles de validation des formulaires et des données frontend pour FicheProduit.
  Utilise ce skill OBLIGATOIREMENT dès qu'on touche à de la validation côté frontend :
  création d'un nouveau formulaire, ajout d'un champ à un formulaire existant, création d'un
  feature avec des inputs utilisateur, validation de données avant envoi API, ou toute question
  sur comment valider une valeur côté client. Ne jamais écrire de validation manuelle (if/regex/trim
  à la main) sans avoir consulté ce skill — Zod est installé et doit être utilisé.
paths:
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.tsx"
---

# Frontend validation — FicheProduit

## Règle absolue

**Zod est installé (`zod` v4). Toute validation frontend passe par Zod. Jamais de validation manuelle.**

Validation manuelle = interdit :

```ts
// ❌ JAMAIS ça
if (username.length < 3) return "Trop court";
if (!EMAIL_REGEX.test(email)) return "Email invalide";
const trimmed = value.trim();
if (!trimmed) return "Requis";
```

Avec Zod = toujours :

```ts
// ✅ TOUJOURS ça
const schema = z.string().trim().min(3, "Trop court").email("Email invalide");
```

---

## Choisir le pattern de formulaire

| Cas | Pattern | Où |
|-----|---------|-----|
| Auth (login, signup, profil, mot de passe) | `useForm` + `zodResolver(loginSchema)` | Pages auth |
| Formulaire simple ou mailto | `safeParse` + `parseZodFieldErrors` dans un hook | `useDemoRequestForm`, etc. |
| Édition inline (un champ à la fois) | `schema.safeParse` au blur/save | `ShopInfoSection`, `TagListEditor` |
| Filtres catalogue | Pas de Zod formulaire — état hook | `useProductFilters` |

Les deux premiers patterns utilisent le **même schéma Zod** ; seul le binding UI change.

---

## Architecture des fichiers de validation

```
features/<nom>/lib/
└── <nom>Schemas.ts      ← schemas Zod + types inférés (source de vérité)

features/auth/lib/
└── authSchemas.ts       ← champs réutilisables (email, password, username, URL)

shared/lib/
└── parseZodErrors.ts    ← parseZodFieldErrors (partagé, ne pas recréer)
```

**Ne jamais créer de fichier `*Validation.ts` avec des fonctions impératives.**

---

## Pattern A — react-hook-form (formulaires auth)

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../lib/authSchemas";

const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
});
```

---

## Pattern B — safeParse dans un hook

### 1. Définir le schema dans `<feature>/lib/<feature>Schemas.ts`

```ts
import { z } from "zod";

export const monFormulaireSchema = z.object({
  email: z.string().trim().min(1, "Veuillez entrer une adresse e-mail.").email("Format d'e-mail invalide."),
  fullName: z.string().trim().min(1, "Ce champ est requis."),
});

export type MonFormulaireInput = z.input<typeof monFormulaireSchema>;
export type MonFormulairePayload = z.output<typeof monFormulaireSchema>;
```

### 2. Utiliser `parseZodFieldErrors` depuis shared

```ts
import { parseZodFieldErrors } from "@shared/lib/parseZodErrors";

const result = monFormulaireSchema.safeParse(form);
if (!result.success) {
  setFieldErrors(parseZodFieldErrors(result.error));
  return;
}
const payload = result.data;
```

### 3. Shape des erreurs

```ts
type MonFormulaireErrors = Partial<Record<keyof MonFormulaireInput, string>>;
const [fieldErrors, setFieldErrors] = useState<MonFormulaireErrors>({});
```

---

## Règles Zod courantes

### Champs obligatoires

```ts
z.string().trim().min(1, "Ce champ est requis.");
```

### Email

```ts
z.string().trim().min(1, "Veuillez entrer une adresse e-mail.").email("Format d'e-mail invalide.");
```

### Confirmation de mot de passe (cross-field)

```ts
z.object({ password: z.string(), passwordConfirm: z.string() }).superRefine(
  ({ password, passwordConfirm }, ctx) => {
    if (password !== passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirm"],
        message: "Les mots de passe ne correspondent pas.",
      });
    }
  },
);
```

---

## Règles de déduplication

Avant de créer un schema, vérifier `features/auth/lib/authSchemas.ts` :

| Besoin | Déjà disponible |
| ------ | --------------- |
| Email | `emailField` |
| Username | `usernameField` |
| Password | `passwordField` |
| URL optionnelle | `websiteUrlField` |
| ZodError → fieldErrors | `@shared/lib/parseZodErrors` → `parseZodFieldErrors` |

---

## Checklist

1. Créer ou étendre `<feature>/lib/<feature>Schemas.ts`.
2. Inférer les types avec `z.input` / `z.output` si transforms.
3. Choisir RHF (auth) ou safeParse (simple/inline) selon la table ci-dessus.
4. Aucun `if (value.length < N)` dans un composant ou une page.
5. Vérifier `authSchemas.ts` avant de recréer une règle générique.
