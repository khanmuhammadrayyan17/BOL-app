import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReadingModule } from './modules/reading/reading.module';
import { ComprehensionModule } from './modules/comprehension/comprehension.module';
import { TongueTwisterModule } from './modules/tongue-twister/tongue-twister.module';
import { GrammarCheckModule } from './modules/grammar-check/grammar-check.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { DescriptionModule } from './modules/description/description.module';

@Module({
  imports: [
  // Load environment variables from a .env file in the container root if present.
  // This makes it easier to deploy via Docker by mounting a .env file into the image
  ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ReadingModule,
    ComprehensionModule,
    TongueTwisterModule,
    GrammarCheckModule,
    ConversationModule,
    VocabularyModule,
    DescriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
