"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingService = void 0;
const common_1 = require("@nestjs/common");
let ReadingService = class ReadingService {
    processReadingTask(prompt, transcription) {
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
};
exports.ReadingService = ReadingService;
exports.ReadingService = ReadingService = __decorate([
    (0, common_1.Injectable)()
], ReadingService);
//# sourceMappingURL=reading.service.js.map