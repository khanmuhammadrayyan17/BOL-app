import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class DescriptionService {
  async processDescriptionTask(image: Buffer): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    const formData = new FormData();
    formData.append('image', image, {
      filename: 'uploaded-image.jpg',
      contentType: 'image/jpeg',
    });

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        formData,
        { headers: formData.getHeaders() }
      );

      return response.data.result || 'No feedback received.';
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image.');
    }
  }
}