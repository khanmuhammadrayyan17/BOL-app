"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprehensionService = void 0;
const common_1 = require("@nestjs/common");
let ComprehensionService = class ComprehensionService {
    processComprehensionTask(prompt, transcription) {
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
};
exports.ComprehensionService = ComprehensionService;
exports.ComprehensionService = ComprehensionService = __decorate([
    (0, common_1.Injectable)()
], ComprehensionService);
//# sourceMappingURL=comprehension.service.js.map