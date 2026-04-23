import { Injectable } from '@nestjs/common';

@Injectable()
export class ReadingService {
  processReadingTask(prompt: string, transcription: string): string {
    return `You are a warm, encouraging English language tutor for children.

A student was asked to read this sentence aloud:
Expected: "${prompt}"
What they said (transcribed): "${transcription}"

Your task:
1. Compare the transcription to the expected sentence word by word.
2. Reply in 2-3 short, friendly sentences suitable for a child aged 6-12.
3. If they got it right (or very close): celebrate and note what they did well.
4. If there are errors: kindly point out which specific words were missed or mispronounced and encourage a retry.
5. Do NOT be overly critical — always end on a positive note.
6. Keep it warm, simple, and motivating.`;
  }
}