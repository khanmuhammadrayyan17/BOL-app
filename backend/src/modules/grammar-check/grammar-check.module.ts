import { Module } from '@nestjs/common';
import { GrammarCheckService } from './grammar-check.service';

@Module({
  providers: [GrammarCheckService],
  exports: [GrammarCheckService],
})
export class GrammarCheckModule {}