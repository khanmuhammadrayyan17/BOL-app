"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
let ConversationService = class ConversationService {
    processConversationTask(prompt, transcription) {
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
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = __decorate([
    (0, common_1.Injectable)()
], ConversationService);
//# sourceMappingURL=conversation.service.js.map