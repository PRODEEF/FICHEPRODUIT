import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import type { components } from '../../generated/api';
import { ScrapeProductDto } from './dto/scrape-product.dto';
import { ScrapeProductService } from './scrape-product.service';

type ScrapeProductResponse = components['schemas']['ScrapeProductResponse'];

@ApiTags('Product templates')
@ApiBearerAuth('bearerAuth')
@UseGuards(SupabaseAuthGuard)
@Controller('api/scrape-product')
export class ScrapeProductController {
  constructor(private readonly scrapeProductService: ScrapeProductService) {}

  @Post()
  @ApiOperation({
    summary: 'Detect product fields from a product page URL',
    description:
      'Fetches HTML, parses JSON-LD Product schema and PrestaShop-style feature tables.',
  })
  @ApiOkResponse({ description: 'Proposed template fields' })
  @ApiBadRequestResponse({ description: 'Invalid URL or blocked host' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async scrape(@Body() body: ScrapeProductDto): Promise<ScrapeProductResponse> {
    return this.scrapeProductService.scrapeProductPage(body.url);
  }
}
