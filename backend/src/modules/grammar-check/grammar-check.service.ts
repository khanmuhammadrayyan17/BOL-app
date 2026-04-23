import { Injectable } from '@nestjs/common';

@Injectable()
export class GrammarCheckService {
  processGrammarCheckTask(prompt: string, transcription: string): string {
    const sentence = prompt.split('(Expected:')[0].trim();
    const expected = (prompt.split('(Expected:')[1] ?? '').replace(')', '').trim();

    return `You are a warm, encouraging English language tutor for children. 

A student is practicing grammar by filling in the blank:
Full Sentence: "${sentence.replace('___', expected)}"
Expected Word: "${expected}"
What the student said (transcribed): "${transcription}"

Your task:
1. Judge whether the student spoke the CORRECT word for the blank.
2. If correct: celebrate and briefly explain why that tense/form is right.
3. If incorrect: gently tell them the correct word and explain the rule simply (e.g., "We use 'went' because it happened yesterday!").
4. Provide feedback in 2-3 short, friendly sentences.
5. Keep it warm and encouraging.`;
  }
}