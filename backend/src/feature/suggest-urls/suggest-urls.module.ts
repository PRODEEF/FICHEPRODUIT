import { Module } from '@nestjs/common';
import { SuggestUrlsController } from './suggest-urls.controller';
import { SuggestUrlsService } from './suggest-urls.service';

@Module({
  controllers: [SuggestUrlsController],
  providers: [SuggestUrlsService],
})
export class SuggestUrlsModule {}
