
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | undefined;
  isConfigured = signal(false);
  configurationError = signal<string | null>(null);

  constructor() {
    try {
      this.apiKey = (process as any).env.API_KEY;
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

  // 1. Generate Product Details
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

  // 2. Generate Ad Copy
  async generateAdCopy(productName: string, productDescription: string): Promise<any> {
    if (!this.isConfigured() || !this.ai) return null;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Marketing JSON for "${productName}". Desc: "${productDescription}". JSON Only: { "headline": "Ar", "subheadline": "Ar", "features": [{"title":"Ar","description":"Ar","imagePrompt":"En"}] }`,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(this.cleanJson(response.text));
    } catch { return null; }
  }

  // 3. Generate Image (Imagen 4)
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

  // 4. Video Generation (Veo 3.1) - Supports Image Input
  async generateMarketingVideo(prompt: string, imageBase64?: string): Promise<string> {
    if (!this.isConfigured() || !this.ai) throw new Error('Gemini not configured');
    
    try {
      let operation;
      const model = 'veo-3.1-fast-generate-preview';
      
      if (imageBase64) {
        // Image-to-Video
        operation = await this.ai.models.generateVideos({
          model: model,
          prompt: prompt,
          image: {
             imageBytes: imageBase64,
             mimeType: 'image/jpeg' 
          },
          config: { numberOfVideos: 1 } // Aspect ratio defaults usually handled by model or ignored if image present
        });
      } else {
        // Text-to-Video
        operation = await this.ai.models.generateVideos({
          model: model,
          prompt: prompt,
          config: { numberOfVideos: 1 }
        });
      }

      let attempts = 0;
      while (!operation.done && attempts < 30) { // Poll for up to 2.5 mins
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await this.ai.operations.getVideosOperation({ operation: operation });
        attempts++;
      }
      
      if (!operation.done) throw new Error("Video generation timed out.");
      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) throw new Error('No video URI.');
      
      const videoRes = await fetch(`${videoUri}&key=${this.apiKey}`);
      const blob = await videoRes.blob();
      return URL.createObjectURL(blob);

    } catch (error: any) {
      this.handleGeminiError(error);
      throw new Error('فشل توليد الفيديو.');
    }
  }

  // 5. Google Search Grounding (Gemini 3)
  async researchMarketTrends(query: string): Promise<{ text: string; sources: any[] }> {
      if (!this.isConfigured() || !this.ai) return { text: 'الخدمة غير متوفرة', sources: [] };
      try {
          const response = await this.ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Answer this query in Arabic with recent data: ${query}`,
              config: {
                  tools: [{ googleSearch: {} }]
              }
          });
          
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const sources = chunks.map((c: any) => c.web).filter((w: any) => w);
          
          return {
              text: response.text || 'لا توجد نتائج.',
              sources: sources
          };
      } catch (error) {
          this.handleGeminiError(error);
          return { text: 'حدث خطأ أثناء البحث.', sources: [] };
      }
  }

  // 6. Image Editing (Nano Banana Style)
  // Since we don't have a direct "edit" endpoint exposed in this SDK version for Gemini 2.5 Flash Image editing directly on pixels,
  // We simulate it by using Gemini 2.5 Flash to understand the edit and Imagen 4 to generate the result.
  async editProductImage(base64Image: string, editPrompt: string): Promise<string | undefined> {
      if (!this.isConfigured() || !this.ai) return undefined;
      try {
          // Step 1: Describe the new image
          const descriptionResponse = await this.ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                  parts: [
                      { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                      { text: `Describe a new version of this image with the following change applied: "${editPrompt}". Give a detailed photorealistic prompt for an image generator.` }
                  ]
              }
          });
          
          const newPrompt = descriptionResponse.text;
          
          // Step 2: Generate the image
          return await this.generateMarketingImage(newPrompt);
      } catch (error) {
          this.handleGeminiError(error);
          return undefined;
      }
  }
}
