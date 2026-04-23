import { ConfigService } from '@nestjs/config';
export declare class AppService {
    private configService;
    constructor(configService: ConfigService);
    getHello(): string;
    voiceCheck(audio: any, prompt: string, type?: 'reading' | 'comprehension' | 'tongue-twister' | 'grammar-check' | 'conversation' | 'vocabulary' | 'description'): Promise<{
        error: string;
        details?: undefined;
        result?: undefined;
        transcription?: undefined;
        bubbles?: undefined;
    } | {
        error: string;
        details: any;
        result?: undefined;
        transcription?: undefined;
        bubbles?: undefined;
    } | {
        result: any;
        transcription: string;
        bubbles: number;
        error?: undefined;
        details?: undefined;
    } | {
        error: string;
        details: any;
        transcription: string;
        result?: undefined;
        bubbles?: undefined;
    }>;
}
