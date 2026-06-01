import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { SuggestUrlsResponseDto } from "./dto/suggest-urls-response.dto";
import { SuggestUrlsDto } from "./dto/suggest-urls.dto";
import { OptionalJwtGuard } from "../../core/auth/guards/optional-jwt.guard";
import { SuggestUrlsService } from "./suggest-urls.service";
import type { SuggestUrlsResponse } from "./suggest-urls.types";

@ApiTags("Suggest URLs")
@Controller("api/suggest-urls")
@UseGuards(OptionalJwtGuard)
export class SuggestUrlsController {
  constructor(private readonly suggestUrlsService: SuggestUrlsService) {}

  @Get()
  @ApiOperation({
    summary: "Suggérer des URLs e-commerce à partir d’un indice texte (query q)",
  })
  @ApiQuery({
    name: "q",
    required: true,
    description: "Indice texte pour trouver des URLs e-commerce",
    type: String,
  })
  @ApiOkResponse({
    description: "Liste d’URLs de page d’accueil suggérées",
    type: SuggestUrlsResponseDto,
  })
  @ApiBadRequestResponse({ description: "Paramètre q manquant ou invalide" })
  getSuggest(@Query() query: SuggestUrlsDto): Promise<SuggestUrlsResponse> {
    return this.suggestUrlsService.suggest(query.q);
  }

  @Post()
  @ApiOperation({
    summary: "Suggérer des URLs e-commerce (corps JSON { q })",
  })
  @ApiBody({ type: SuggestUrlsDto })
  @ApiOkResponse({
    description: "Liste d’URLs de page d’accueil suggérées",
    type: SuggestUrlsResponseDto,
  })
  @ApiBadRequestResponse({ description: "Corps JSON invalide (q manquant ou invalide)" })
  postSuggest(@Body() body: SuggestUrlsDto): Promise<SuggestUrlsResponse> {
    return this.suggestUrlsService.suggest(body.q);
  }
}
