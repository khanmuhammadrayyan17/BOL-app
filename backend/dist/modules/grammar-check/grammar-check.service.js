"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrammarCheckService = void 0;
const common_1 = require("@nestjs/common");
let GrammarCheckService = class GrammarCheckService {
    processGrammarCheckTask(prompt, transcription) {
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
};
exports.GrammarCheckService = GrammarCheckService;
exports.GrammarCheckService = GrammarCheckService = __decorate([
    (0, common_1.Injectable)()
], GrammarCheckService);
//# sourceMappingURL=grammar-check.service.js.map