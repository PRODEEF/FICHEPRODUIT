---
name: nestjs-controllers-dto
description: >
  Création de Controllers NestJS et validation avec Zod via nestjs-zod. Consulte ce skill dès qu'on
  crée un endpoint REST, un DTO, la validation body/query/param, ou qu'on gère les erreurs HTTP.
  Couvre : @Controller, verbes HTTP, createZodDto, ZodValidationPipe (APP_PIPE),
  gestion des erreurs, typage des réponses. Stack : NestJS + zod + nestjs-zod (pas class-validator).
paths:
  - "backend/**/*.ts"
---

# NestJS — Controllers & DTOs avec `nestjs-zod`

## Dépendances

```bash
npm install zod nestjs-zod
```

`nestjs-zod` v5+ requiert `zod` ^3.25 ou ^4 (voir readme du paquet).

---

## `ZodValidationPipe` — enregistrer une fois dans `AppModule`

C'est la méthode recommandée par `nestjs-zod` : même comportement pour tous les Controllers sans répéter de pipe inline.

### `app.module.ts` (extrait)

```typescript
import { Module } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";

@Module({
  imports: [
    /* ... */
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
```

> Avec ce setup, typer `@Body() dto: CreateUserDto` suffit pour valider automatiquement le body contre le schéma du DTO. Pas besoin de `@UsePipes(new ...)` par méthode.

---

## DTO avec `createZodDto` — pattern standard

Le **schéma Zod exporté** reste la source unique ; la **classe DTO** sert au typage Nest + Swagger (voir skill `nestjs-swagger`).

### `dto/create-user.dto.ts`

```typescript
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(["admin", "user"]).default("user"),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
```

### `dto/update-user.dto.ts`

```typescript
import { createZodDto } from "nestjs-zod";
import { createUserSchema } from "./create-user.dto";

export const updateUserSchema = createUserSchema.partial();

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
```

> **`z.infer<typeof createUserSchema>`** reste utilisable hors Nest (tests, helpers) ; dans les Controllers préférer **`CreateUserDto`** pour rester aligné avec le pipe.

---

## Controller — squelette complet

Hypothèse : `ZodValidationPipe` est fourni globalement comme ci-dessus.

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
```

Référence réelle : `backend/src/domain/catalog/catalog.controller.ts` (guards, `@CurrentUser`, Swagger).

---

## Validation fine des `@Param()` (optionnel)

Pour valider `:id` avec Zod sous forme de DTO groupe :

### `dto/user-id-params.dto.ts`

```typescript
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export class UserIdParams extends createZodDto(userIdParamsSchema) {}
```

```typescript
@Get(":id")
async findOne(@Param() params: UserIdParams) {
  const user = await this.usersService.findById(params.id);
  if (!user) throw new NotFoundException(`User ${params.id} not found`);
  return user;
}
```

Alternative Nest native : `ParseUUIDPipe` sur `@Param("id")` si tu ne veux pas de DTO Zod pour les segments.

---

## Gestion des erreurs

`nestjs-zod` lève **`ZodValidationException`** sur body/query/param invalides → réponse **400** automatique via le pipe global.

Pour les erreurs métier dans le Controller : lancer `NotFoundException`, `ForbiddenException`, etc. — NestJS les transforme en réponses HTTP.

> Ce projet utilise **Fastify**, pas Express. Ne pas copier un `GlobalExceptionFilter` basé sur `express.Request` sans l'adapter. Vérifier s'il existe déjà un filtre dans `backend/src/` avant d'en créer un.

Référence erreurs validation Zod : doc officielle `nestjs-zod` (filtre dédié `ZodValidationException` si harmonisation nécessaire).

---

## Typer les réponses du Controller

Utiliser un type simple quand la forme métier est claire :

```typescript
import type { User } from "./types/user.types";

@Get()
findAll(): Promise<User[]> {
  return this.usersService.findAll();
}
```

> Une classe **`UserResponseDto` + `createZodDto`** vaut surtout quand Swagger doit documenter précisément la réponse ou qu'on active la sérialisation Zod ; sinon un type TS suffit (skill `nestjs-swagger`).

---

## Fallback — pipe Zod manuel

Si **`nestjs-zod` est interdit** sur un projet legacy, un pipe `safeParse` + `BadRequestException` reste acceptable (ancien gabarit) — alors **ne pas** utiliser `createZodDto` en parallèle : garde soit Zod artisanal + Swagger class-validator / schémas OpenAPI séparés, soit migration complète vers `nestjs-zod`.

---

## Checklist Controller

1. Un Controller par module — pas de logique métier dedans
2. **`ZodValidationPipe`** en global (`APP_PIPE`) sauf contrainte documentée
3. Chaque body typé avec une **classe** `createZodDto(...)`, pas seulement un type `infer`
4. Les `NotFoundException`, etc. sont lancées dans le Controller (pas dans le Service pour un simple « absent »)
5. Le Service retourne `null` si non trouvé — le Controller choisit le code HTTP
6. Pas de `try/catch` dans le Controller — laisser NestJS / `ZodValidationPipe` gérer
