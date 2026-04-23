import { Controller, Get, Post, UploadedFile, Body, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import * as crypto from 'crypto';

// Simple in-memory recent-audio cache to dedupe near-duplicate uploads
const recentAudioMap: Map<string, number> = new Map();
const DEDUPE_WINDOW_MS = 5000; // ignore duplicates within 5 seconds

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('voice-check')
  @UseInterceptors(FileInterceptor('audio'))
  async voiceCheck(
    @UploadedFile() audio: Express.Multer.File,
    @Body('prompt') prompt: string,
    @Body('type') type: string,
  ) {
    // Log entry so we can correlate requests (helps detect duplicate requests or multiple processes)
    console.log(`voiceCheck endpoint called - pid=${process.pid} ts=${Date.now()} promptLen=${(prompt||'').length} type=${type}`);

    // If audio buffer present, compute a short hash and dedupe rapid duplicates
    try {
      if (audio && audio.buffer) {
        const hash = crypto.createHash('sha256').update(audio.buffer).digest('hex');
        const now = Date.now();
        // Remove stale entries
        for (const [k, ts] of recentAudioMap.entries()) {
          if (now - ts > DEDUPE_WINDOW_MS) recentAudioMap.delete(k);
        }
        if (recentAudioMap.has(hash)) {
          console.warn('Duplicate audio upload detected; ignoring within dedupe window');
          return { error: 'Duplicate audio detected (deduped)' };
        }
        recentAudioMap.set(hash, now);
      }
    } catch (err) {
      console.warn('Audio dedupe check failed:', err);
    }

    // Forward to service for Gemini API check, pass type from body so the correct prompt is used
    return this.appService.voiceCheck(audio, prompt, (type as any) || 'reading');
  }
}
