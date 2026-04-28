import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ScrapeProductController } from './scrape-product.controller';
import { ScrapeProductService } from './scrape-product.service';

@Module({
  imports: [AuthModule],
  controllers: [ScrapeProductController],
  providers: [ScrapeProductService],
})
export class ScrapeProductModule {}
