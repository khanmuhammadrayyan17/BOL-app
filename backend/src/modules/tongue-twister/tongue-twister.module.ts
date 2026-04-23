import { Module } from '@nestjs/common';
import { TongueTwisterService } from './tongue-twister.service';

@Module({
  providers: [TongueTwisterService],
  exports: [TongueTwisterService],
})
export class TongueTwisterModule {}