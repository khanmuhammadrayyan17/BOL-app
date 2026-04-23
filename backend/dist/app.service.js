"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
let AppService = class AppService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getHello() {
        return 'Hello World!';
    }
    async voiceCheck(audio, prompt, type = 'reading') {
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (!audio) {
            return { error: 'No audio file uploaded.' };
        }
        const minSize = 2000;
        if (audio.size < minSize) {
            return {
                error: 'Voice too short or quiet',
                details: `Captured audio size (${(audio.size / 1024).toFixed(2)} KB) is too small. Please speak louder or for longer.`
            };
        }
        const tempPath = `./temp-${Date.now()}.webm`;
        await (0, promises_1.writeFile)(tempPath, audio.buffer);
        let transcription = '';
        try {
            transcription = await new Promise((resolve, reject) => {
                (0, child_process_1.execFile)('python', ['-m', 'whisper', tempPath, '--model', 'base', '--language', 'English', '--fp16', 'False', '--output_format', 'txt'], { timeout: 120000 }, (err, stdout, stderr) => {
                    if (err)
                        return reject(stderr || err.message);
                    const txtPath = tempPath.replace(/\.webm$/, '.txt');
                    import('fs').then(fs => {
                        fs.readFile(txtPath, 'utf8', (err2, data) => {
                            if (err2)
                                return reject(err2);
                            resolve(data.trim());
                            fs.unlink(txtPath, () => { });
                            fs.unlink(tempPath, () => { });
                        });
                    });
                });
            });
        }
        catch (err) {
            await (0, promises_1.unlink)(tempPath).catch(() => { });
            return { error: 'Speech-to-text failed', details: err.toString() };
        }
        let geminiText;
        if (type === 'grammar-check') {
            const sentence = prompt.split('(Expected:')[0].trim();
            const expected = (prompt.split('(Expected:')[1] ?? '').replace(')', '').trim();
            geminiText = `You are a warm, encouraging English language tutor for children. 

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
        else if (type === 'tongue-twister') {
            geminiText = `You are a warm, encouraging English language tutor for children. 

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
        else if (type === 'comprehension') {
            const questionText = prompt.split('(Expected:')[0].trim();
            const expectedAnswer = (prompt.split('(Expected:')[1] ?? '').replace(')', '').trim();
            geminiText = `You are a warm, encouraging English language tutor for children. 

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
        else if (type === 'conversation') {
            const scenarioPrompt = prompt.split('(Expected:')[0].trim();
            const expected = (prompt.split('(Expected:')[1] ?? '').replace(')', '').trim();
            geminiText = `You are a warm, encouraging English language tutor for children. 

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
        else if (type === 'vocabulary') {
            const targetWord = prompt.split('(Target:')[1]?.replace(')', '').trim() || 'the word';
            geminiText = `You are an English language tutor for children. 

The student said: "${transcription}"

Your task:
1. Check if the student used the word "${targetWord}" correctly.
2. Judge if the sentence is grammatically correct.
3. Provide feedback in 2-3 short, friendly sentences.
4. Keep the tone encouraging and simple.`;
        }
        else if (type === 'description') {
            geminiText = `You are a warm, encouraging English language tutor for children. 

A student is describing an image. 
Image context/expected details: "${prompt}"

What the student said (transcribed): "${transcription}"

Your task:
1. Judge their description of the image. Check if they mentioned key objects, colors, or feelings.
2. Count the number of unique descriptive details they provided (adjectives, nouns, etc.).
3. Your response MUST end with the tag: [BUBBLES: X] where X is that count (e.g., [BUBBLES: 5]).
4. Provide positive, encouraging feedback in 2-3 short, friendly sentences.
5. Suggest 1 or 2 new words they could use to describe the scene even better.
6. Keep the tone splashing and fun!`;
        }
        else {
            geminiText = `You are a warm, encouraging English language tutor for children.

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
        const geminiPayload = {
            contents: [{
                    parts: [{ text: geminiText }]
                }]
        };
        try {
            console.log('Calling Gemini API with the following inputs:');
            console.log('Transcription:', transcription);
            console.log('Gemini Prompt (truncated):', geminiText.length > 400 ? geminiText.slice(0, 400) + '... [truncated]' : geminiText);
            const response = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, geminiPayload, { headers: { 'Content-Type': 'application/json' } });
            let result = response.data;
            let bubbles = 0;
            if (result && result.candidates && result.candidates.length > 0) {
                result = result.candidates[0].content?.parts?.[0]?.text || JSON.stringify(result);
                const bubbleMatch = result.match(/\[BUBBLES:\s*(\d+)\]/i);
                if (bubbleMatch) {
                    bubbles = parseInt(bubbleMatch[1]);
                    result = result.replace(/\[BUBBLES:\s*\d+\]/i, '').trim();
                }
            }
            else {
                result = 'I heard you, but I couldn\'t process the feedback. Good job practicing!';
            }
            return { result, transcription, bubbles };
        }
        catch (error) {
            const details = error.response?.data
                ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data)
                : error.message;
            console.error('Gemini API Error:', details);
            return { error: 'LLM feedback failed', details, transcription };
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AppService);
//# sourceMappingURL=app.service.js.map