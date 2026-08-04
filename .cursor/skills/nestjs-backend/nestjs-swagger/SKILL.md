---
name: nestjs-swagger
description: >
  Documentation Swagger/OpenAPI pour NestJS avec @nestjs/swagger. Consulte ce skill dès qu'on
  crée ou modifie un Controller, un DTO, ou qu'on configure la documentation API (OpenAPI).
  Couvre : setup dans main.ts, cleanupOpenApiDoc (nestjs-zod), décorateurs sur Controllers et
  DTOs Zod via createZodDto, groupement par tags, réponses typées, Bearer security.
paths:
  - "backend/**/*.ts"
---

# NestJS — Documentation Swagger / OpenAPI

## Dépendances

```bash
npm install @nestjs/swagger zod nestjs-zod
```

---

## Setup — `create-nest-app.ts` (pas `main.ts` directement)

Le bootstrap Swagger est centralisé dans **`backend/src/core/http/create-nest-app.ts`**. `main.ts` appelle `createNestApp()`.

`nestjs-zod` doit **nettoyer le document OpenAPI** généré après `SwaggerModule.createDocument`, sinon les schémas Zod peuvent être incorrects dans l'UI.

```typescript
// Extrait de create-nest-app.ts — ne pas dupliquer ailleurs
if (swagger && nodeEnv !== "production") {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("FicheProduit API")
    .setDescription(
      "Documentation OpenAPI générée à partir des contrôleurs NestJS et des schémas Zod (nestjs-zod).",
    )
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
      "bearerAuth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, cleanupOpenApiDoc(document));
}
```

> UI typique : `http://localhost:3000/api/docs` (backend en dev, hors production)

### Référence FicheProduit (Fastify + JWT nommé)

Les contrôleurs protégés utilisent **`@ApiBearerAuth("bearerAuth")`** pour s'aligner sur le schéma ci-dessus.

Exemple domaine documenté de bout en bout : `backend/src/domain/catalog/catalog.controller.ts` avec `CatalogProductResponseDto` et `CatalogByIdsDto`.

---

## Legacy — `patchNestJsSwagger`

Sur les vieilles versions de **nestjs-zod**, on appelait `patchNestJsSwagger()` **avant** `NestFactory.create`. En **v5+**, ce comportement est remplacé par **`cleanupOpenApiDoc(document)`** sur le document Swagger (voir ci-dessus).

---

## DTOs Zod + Swagger — pattern `createZodDto`

Zod et `@nestjs/swagger` ne s’alignent pas seuls ; `nestjs-zod` fournit **`createZodDto`** pour lier classe DTO ↔ schéma ↔ metadata OpenAPI.

```typescript
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email().describe("Email de l'utilisateur"),
  name: z.string().min(2).max(100).describe("Nom complet"),
  role: z.enum(["admin", "user"]).default("user").describe("Rôle"),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
```

### DTO partiel pour PATCH

```typescript
import { createZodDto } from "nestjs-zod";
import { createUserSchema } from "./create-user.dto";

export class UpdateUserDto extends createZodDto(createUserSchema.partial()) {}
```

---

## Controller — décorateurs Swagger

> **Bloc illustratif.** Les imports `UsersService`, `CreateUserDto`, `UpdateUserDto`, `UserResponseDto`, `ApiCreatedResponse`, `ApiBadRequestResponse`, `HttpCode`, `NotFoundException` doivent exister comme dans tes modules réels.

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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Liste tous les utilisateurs" })
  @ApiOkResponse({ type: [UserResponseDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupère un utilisateur par ID" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: "Utilisateur non trouvé" })
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  @Post()
  @ApiOperation({ summary: "Crée un utilisateur" })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: "Body invalide" })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Met à jour un utilisateur" })
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Supprime un utilisateur" })
  @ApiNoContentResponse()
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
```

---

## DTO de réponse

```typescript
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "user"]),
  createdAt: z.string().datetime(),
});

export class UserResponseDto extends createZodDto(userResponseSchema) {}
```

> Ne pas exposer dans ce schéma `password`, tokens internes, ou champs sensibles.

---

## Décorateurs de réponse courants

| Code | Décorateur                                       |
| ---- | ------------------------------------------------ |
| 200  | `@ApiOkResponse({ type: MyDto })`                |
| 201  | `@ApiCreatedResponse({ type: MyDto })`           |
| 204  | `@ApiNoContentResponse()`                        |
| 400  | `@ApiBadRequestResponse({ description: '...' })` |
| 401  | `@ApiUnauthorizedResponse()`                     |
| 404  | `@ApiNotFoundResponse({ description: '...' })`   |
| 409  | `@ApiConflictResponse({ description: '...' })`   |

---

## Checklist Swagger par endpoint

- [ ] `@ApiTags` sur le Controller
- [ ] `@ApiOperation({ summary })` sur chaque méthode
- [ ] `@ApiOkResponse` / `@ApiCreatedResponse` avec le DTO de réponse
- [ ] Réponses d’erreur documentées (`@ApiNotFoundResponse`, etc.)
- [ ] `@ApiBearerAuth()` si l’endpoint est protégé
- [ ] `.describe()` sur les champs Zod des DTO d’entrée
- [ ] `SwaggerModule.setup(..., cleanupOpenApiDoc(document))` (nestjs-zod v5+)
