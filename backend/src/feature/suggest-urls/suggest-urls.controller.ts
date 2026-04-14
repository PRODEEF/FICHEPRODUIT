import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SuggestUrlsDto } from './dto/suggest-urls.dto';
import { SuggestUrlsService } from './suggest-urls.service';
import type { SuggestUrlsResponse } from './suggest-urls.types';

@ApiTags('Suggest URLs')
@Controller('api/suggest-urls')
export class SuggestUrlsController {
  constructor(private readonly suggestUrlsService: SuggestUrlsService) {}

  @Get()
  @ApiOperation({
    summary: 'Suggest ecommerce URLs from a text hint (query param q)',
  })
  @ApiOkResponse({
    description: 'List of suggested homepage URLs',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid q' })
  getSuggest(@Query() query: SuggestUrlsDto): Promise<SuggestUrlsResponse> {
    return this.suggestUrlsService.suggest(query.q);
  }

  @Post()
  @ApiOperation({
    summary: 'Suggest ecommerce URLs from a text hint (JSON body { q })',
  })
  @ApiOkResponse({
    description: 'List of suggested homepage URLs',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid q' })
  postSuggest(@Body() body: SuggestUrlsDto): Promise<SuggestUrlsResponse> {
    return this.suggestUrlsService.suggest(body.q);
  }
}
