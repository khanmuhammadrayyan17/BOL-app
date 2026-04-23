import { Injectable } from '@nestjs/common';

@Injectable()
export class VocabularyService {
  processVocabularyTask(prompt: string, transcription: string): string {
    const targetWord = prompt.split('(Target:')[1]?.replace(')', '').trim() || 'the word';

    return `You are an English language tutor for children. 

The student said: "${transcription}"

Your task:
1. Check if the student used the word "${targetWord}" (or a very close variation/tense of it).
2. Judge if the sentence they spoke is grammatically correct.
3. Provide feedback in 2-3 short sentences, focusing on whether the word was used correctly and the grammar was accurate.
4. Keep the tone encouraging and simple.`;
  }
}