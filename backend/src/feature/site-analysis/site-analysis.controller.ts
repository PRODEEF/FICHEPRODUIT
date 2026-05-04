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
  Req,
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
import { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OptionalSupabaseAuthGuard } from '../../auth/optional-supabase-auth.guard';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import type { components } from '../../generated/api';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { GUEST_SITE_ANALYSIS_USER_ID } from './guest-site-analysis.constants';
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
@Controller('analyses')
export class SiteAnalysisController {
  constructor(private readonly siteAnalysisService: SiteAnalysisService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('bearerAuth')
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
  @UseGuards(OptionalSupabaseAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new site analysis' })
  @ApiCreatedResponse({ description: 'Analysis created and started' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @Req() req: FastifyRequest & { user?: User },
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateAnalysisDto,
  ): Promise<SiteAnalysis> {
    const rawToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    const effectiveUserId = req.user?.id ?? GUEST_SITE_ANALYSIS_USER_ID;
    return this.siteAnalysisService.create(
      effectiveUserId,
      body.url,
      rawToken,
    );
  }

  /** Declare before @Get(':id') so paths like .../products are not captured as a bare :id. */
  @Get(':id/products')
  @UseGuards(OptionalSupabaseAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Get products from an analysis' })
  @ApiOkResponse({ description: 'List of products' })
  @ApiNotFoundResponse({ description: 'Analysis not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getProducts(
    @Req() req: FastifyRequest & { user?: User },
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('search') _search?: string,
    @Query('brand') _brand?: string,
    @Query('year') _year?: string,
    @Query('category') _category?: string,
    @Query('subCategory') _subCategory?: string,
  ): Promise<ProductListResponse> {
    if (req.user) {
      return this.siteAnalysisService.getProductsForUser(
        req.user.id,
        id,
        accessTokenFromAuthHeader(authorization),
      );
    }
    return this.siteAnalysisService.getProductsForGuest(id);
  }

  @Get(':id')
  @UseGuards(OptionalSupabaseAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Get analysis status' })
  @ApiOkResponse({ description: 'Analysis details' })
  @ApiNotFoundResponse({ description: 'Analysis not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getOne(
    @Req() req: FastifyRequest & { user?: User },
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SiteAnalysis> {
    if (req.user) {
      return this.siteAnalysisService.getForUser(
        req.user.id,
        id,
        accessTokenFromAuthHeader(authorization),
      );
    }
    return this.siteAnalysisService.getForGuest(id);
  }
}
