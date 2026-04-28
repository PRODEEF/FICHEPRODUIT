import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import type { components } from '../../generated/api';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { SiteAnalysisService } from './site-analysis.service';

type SiteAnalysis = components['schemas']['SiteAnalysis'];
type ProductListResponse = components['schemas']['ProductListResponse'];

function accessTokenFromAuthHeader(authorization: string | undefined): string {
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid Authorization header');
  }
  return authorization.slice(7);
}

@ApiTags('Analyses')
@ApiBearerAuth('bearerAuth')
@UseGuards(SupabaseAuthGuard)
@Controller('analyses')
export class SiteAnalysisController {
  constructor(private readonly siteAnalysisService: SiteAnalysisService) {}

  @Get()
  @ApiOperation({ summary: 'List user analyses' })
  @ApiOkResponse({ description: 'List of analyses' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async list(
    @CurrentUser() user: User,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<SiteAnalysis[]> {
    return this.siteAnalysisService.listForUser(
      user.id,
      accessTokenFromAuthHeader(authorization),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new site analysis' })
  @ApiCreatedResponse({ description: 'Analysis created and started' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @CurrentUser() user: User,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateAnalysisDto,
  ): Promise<SiteAnalysis> {
    return this.siteAnalysisService.create(
      user.id,
      body.url,
      accessTokenFromAuthHeader(authorization),
    );
  }

  /** Declare before @Get(':id') so paths like .../products are not captured as a bare :id. */
  @Get(':id/products')
  @ApiOperation({ summary: 'Get products from an analysis' })
  @ApiOkResponse({ description: 'List of products' })
  @ApiNotFoundResponse({ description: 'Analysis not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getProducts(
    @CurrentUser() user: User,
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('search') _search?: string,
    @Query('brand') _brand?: string,
    @Query('year') _year?: string,
    @Query('category') _category?: string,
    @Query('subCategory') _subCategory?: string,
  ): Promise<ProductListResponse> {
    return this.siteAnalysisService.getProductsForUser(
      user.id,
      id,
      accessTokenFromAuthHeader(authorization),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get analysis status' })
  @ApiOkResponse({ description: 'Analysis details' })
  @ApiNotFoundResponse({ description: 'Analysis not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getOne(
    @CurrentUser() user: User,
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SiteAnalysis> {
    return this.siteAnalysisService.getForUser(
      user.id,
      id,
      accessTokenFromAuthHeader(authorization),
    );
  }
}
