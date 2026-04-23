import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    voiceCheck(audio: Express.Multer.File, prompt: string, type: string): Promise<{
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
    } | {
        error: string;
    }>;
}
