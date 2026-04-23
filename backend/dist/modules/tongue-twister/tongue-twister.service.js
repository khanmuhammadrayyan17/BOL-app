"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TongueTwisterService = void 0;
const common_1 = require("@nestjs/common");
let TongueTwisterService = class TongueTwisterService {
    processTongueTwisterTask(prompt, transcription) {
        return `You are a warm, encouraging English language tutor for children. 

A student is practicing a tongue twister to wake up their pet:
Tongue Twister: "${prompt}"
Student's Transcription: "${transcription}"

Your task:
1. Judge their performance based on clarity and accuracy of these tricky sounds.
2. Reply in 2-3 short, friendly sentences.
3. If they nailed it: celebrate their fast and clear speaking!
4. If they stumbled or missed a sound: kindly encourage them to try again, perhaps slower first.
5. Focus on the "fun" of the tongue twister.
6. Keep the tone morning-fresh and motivating.`;
    }
};
exports.TongueTwisterService = TongueTwisterService;
exports.TongueTwisterService = TongueTwisterService = __decorate([
    (0, common_1.Injectable)()
], TongueTwisterService);
//# sourceMappingURL=tongue-twister.service.js.map