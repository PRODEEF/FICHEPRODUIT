import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import type { components } from '../../generated/api';
import { RefineTemplateFieldsDto } from './dto/refine-template-fields.dto';
import { RefineTemplateFieldsService } from './refine-template-fields.service';

type RefineTemplateFieldsResponse =
  components['schemas']['RefineTemplateFieldsResponse'];

@ApiTags('Product templates')
@ApiBearerAuth('bearerAuth')
@UseGuards(SupabaseAuthGuard)
@Controller('api/refine-template-fields')
export class RefineTemplateFieldsController {
  constructor(private readonly refineService: RefineTemplateFieldsService) {}

  @Post()
  @ApiOperation({ summary: 'Refine template fields with AI (OpenAI)' })
  @ApiOkResponse({ description: 'Refined or unchanged fields' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async refine(
    @Body() body: RefineTemplateFieldsDto,
  ): Promise<RefineTemplateFieldsResponse> {
    return this.refineService.refine(body);
  }
}
