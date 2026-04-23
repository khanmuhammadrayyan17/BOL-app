import { Module } from '@nestjs/common';
import { DescriptionService } from './description.service';

@Module({
  providers: [DescriptionService],
  exports: [DescriptionService],
})
export class DescriptionModule {}