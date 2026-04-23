"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabularyService = void 0;
const common_1 = require("@nestjs/common");
let VocabularyService = class VocabularyService {
    processVocabularyTask(prompt, transcription) {
        const targetWord = prompt.split('(Target:')[1]?.replace(')', '').trim() || 'the word';
        return `You are an English language tutor for children. 

The student said: "${transcription}"

Your task:
1. Check if the student used the word "${targetWord}" (or a very close variation/tense of it).
2. Judge if the sentence they spoke is grammatically correct.
3. Provide feedback in 2-3 short sentences, focusing on whether the word was used correctly and the grammar was accurate.
4. Keep the tone encouraging and simple.`;
    }
};
exports.VocabularyService = VocabularyService;
exports.VocabularyService = VocabularyService = __decorate([
    (0, common_1.Injectable)()
], VocabularyService);
//# sourceMappingURL=vocabulary.service.js.map