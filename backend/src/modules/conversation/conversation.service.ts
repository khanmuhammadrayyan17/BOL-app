import { Injectable } from '@nestjs/common';

@Injectable()
export class ConversationService {
  processConversationTask(prompt: string, transcription: string): string {
    const scenarioPrompt = prompt.split('(Expected:')[0].trim();
    const expected = (prompt.split('(Expected:')[1] ?? '').replace(')', '').trim();

    return `You are a warm, encouraging English language tutor for children. 

A student is practicing a real-life conversation in this scenario: "${scenarioPrompt}"
(A common or polite response might be: "${expected}")

The student said: "${transcription}"

Your task:
1. Judge whether the student's response makes sense in the context of the conversation.
2. Check for politeness and natural phrasing.
3. If they gave a great, natural response: celebrate their social skills and confidence!
4. If their response is a bit awkward or incorrect: gently suggest a more polite or natural way to say it.
5. Provide feedback in 2-4 short, friendly sentences.
6. Keep the tone very positive, as if they are actually out for a walk with a friend.`;
  }
}