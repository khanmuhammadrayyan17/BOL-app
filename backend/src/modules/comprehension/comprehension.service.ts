import { Injectable } from '@nestjs/common';

@Injectable()
export class ComprehensionService {
  processComprehensionTask(prompt: string, transcription: string): string {
    const questionText = prompt.split('(Expected:')[0].trim();
    const expectedAnswer = (prompt.split('(Expected:')[1] ?? '').replace(')', '').trim();

    return `You are a warm, encouraging English language tutor for children. 

A student was asked this comprehension question: "${questionText}"
(According to the story, the answer is: "${expectedAnswer}")

The student said: "${transcription}"

Your task:
1. Start by acknowledging their answer warmly. 
2. If their answer doesn't match the story facts, gently mention what the story said, but focus primarily on their English.
3. Check their grammar and phrasing. If they have errors or if the sentence is simple, suggest a more natural or advanced way to say it in a friendly way.
4. Provide your feedback in 2-4 short, friendly sentences.
5. Keep the tone very positive and helpful.`;
  }
}