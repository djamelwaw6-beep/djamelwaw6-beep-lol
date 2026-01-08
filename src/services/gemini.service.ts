

import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai'; // Removed 'Type' as it's no longer needed after removing schema examples

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | undefined;
  isConfigured = signal(false);
  configurationError = signal<string | null>(null);

  constructor() {
    try {
      this.apiKey = process.env.API_KEY; // Using process.env.API_KEY as per guidelines
      if (!this.apiKey) {
        const errorMessage = 'Gemini API key is not configured. AI features will be disabled.';
        this.configurationError.set(errorMessage);
        console.warn(errorMessage);
        return;
      }
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      this.isConfigured.set(true);
    } catch (error) {
      const errorMessage = 'Failed to initialize Gemini Service.';
      this.configurationError.set(errorMessage);
      console.error(errorMessage, error);
    }
  }

  private handleGeminiError(error: any): void {
    const errStr = typeof error === 'string' ? error : JSON.stringify(error);
    if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Gemini API Quota Exceeded.');
    } else {
        console.error('Gemini API Error:', error);
    }
  }

  private cleanJson(text: string): string {
    return text.replace(/```json\n?|\n?```/g, '').trim();
  }

  // 1. Generate Product Details (Kept)
  async generateProductDetailsFromImage(base64Image: string, price: number, existingCategories: string[]): Promise<{ name: string; description: string; category: string; }> {
    const fallbackDetails = { name: 'منتج جديد', description: 'وصف المنتج...', category: 'عام' };
    if (!this.isConfigured() || !this.ai) return fallbackDetails;

    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
    const categoriesString = existingCategories.length > 0 ? `[${existingCategories.join(', ')}]` : 'عام';
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: `Analyze image. Price: ${price} DZD. Categories: ${categoriesString}. Output JSON: { "name": "Arabic Name", "description": "Arabic Desc", "category": "One Category" }` }] },
        config: { responseMimeType: 'application/json' },
      });
      return JSON.parse(this.cleanJson(response.text));
    } catch (error) {
      this.handleGeminiError(error);
      return fallbackDetails;
    }
  }

  // 2. Generate Ad Copy (Kept)
  async generateAdCopy(productName: string, productDescription: string): Promise<any> {
    if (!this.isConfigured() || !this.ai) return null;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Marketing JSON for "${productName}". Desc: "${productDescription}". JSON Only: { "headline": "Ar", "subheadline": "Ar", "features": [{"title":"Ar","description":"Ar","imagePrompt":"En"}] }`,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(this.cleanJson(response.text));
    } catch (error) { // Added error logging for ad generation
      this.handleGeminiError(error);
      return null; 
    }
  }

  // 3. Generate Image (Imagen 4) - Helper, still useful for ad features if needed, but not directly exposed as AI Assistant feature.
  // Kept as it might be used internally for feature images in ad, though current implementation sets image to null for now.
  async generateMarketingImage(prompt: string): Promise<string | undefined> {
    if (!this.isConfigured() || !this.ai) return undefined;
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt + ", photorealistic, 4k",
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '4:3' }
      });
      return response.generatedImages?.[0]?.image?.imageBytes ? `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}` : undefined;
    } catch (e) { this.handleGeminiError(e); return undefined; }
  }

  // Removed: 4. Video Generation (Veo 3.1)
  // Removed: 5. Google Search Grounding (Gemini 3)
  // Removed: 6. Image Editing (Nano Banana Style)
}