import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RefineTemplateFieldsController } from './refine-template-fields.controller';
import { RefineTemplateFieldsService } from './refine-template-fields.service';

@Module({
  imports: [AuthModule],
  controllers: [RefineTemplateFieldsController],
  providers: [RefineTemplateFieldsService],
})
export class RefineTemplateFieldsModule {}
