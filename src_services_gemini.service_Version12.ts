import { Injectable, signal, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * GeminiService (موحَّد)
 * - يقرأ مفتاح API من: <meta name="gemini-api-key"> أو window.__PLATINUM__.GEMINI_API_KEY أو process.env.GEMINI_API_KEY
 * - يوفر: generateImage(prompt) => dataURL (image/jpeg;base64,...) أو يرمي خطأ واضح
 * - يوفر: generateProductDetailsFromImage(base64Image, price, existingCategories, instructions?) => { name, description, category }
 *
 * ملاحظة أمنيّة: لا تضع المفاتيح في مستودعات عامة. استعمل متغيَّـرات بيئة على الخادم أو حقن الوسم meta على وقت النشر.
 */
@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  isConfigured = signal(false);
  configurationError = signal<string | null>(null);

  constructor(@Inject(DOCUMENT) private document: Document) {
    try {
      let apiKey: string | null = null;

      // 1) حاول من وسم meta في index.html
      const meta = this.document.querySelector('meta[name="gemini-api-key"]') as HTMLMetaElement | null;
      if (meta && meta.content && meta.content.trim().length > 0) {
        apiKey = meta.content.trim();
      }

      // 2) أو من window global (مثال لحقن من خادم)
      if (!apiKey && (window as any).__PLATINUM__ && (window as any).__PLATINUM__.GEMINI_API_KEY) {
        apiKey = (window as any).__PLATINUM__.GEMINI_API_KEY;
      }

      // 3) أو من process.env (بيئات تطوير محلية / سيرفرات تدعم ذلك)
      if (!apiKey && (typeof process !== 'undefined') && (process as any).env && (process as any).env.GEMINI_API_KEY) {
        apiKey = (process as any).env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        const msg = 'Gemini API key is not configured. AI features will be disabled.';
        this.configurationError.set(msg);
        console.warn(msg);
        return;
      }

      this.ai = new GoogleGenAI({ apiKey });
      this.isConfigured.set(true);
    } catch (err) {
      const msg = 'Failed to initialize Gemini Service.';
      this.configurationError.set(msg);
      console.error(msg, err);
    }
  }

  // Helper: ensure returned image is a data URL
  private makeDataUrlFromBytes(imageBytes?: string): string | undefined {
    if (!imageBytes) return undefined;
    if (imageBytes.startsWith('data:')) return imageBytes;
    return `data:image/jpeg;base64,${imageBytes}`;
  }

  // Generate an image from text prompt (returns data URL)
  async generateImage(prompt: string): Promise<string> {
    if (!this.isConfigured() || !this.ai) {
      throw new Error(this.configurationError() || 'Gemini service is not configured.');
    }
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
      const dataUrl = this.makeDataUrlFromBytes(imageBytes);
      if (!dataUrl) throw new Error('No image bytes returned by Gemini imagen model.');
      return dataUrl;
    } catch (error: any) {
      console.error('Gemini.generateImage error:', error);
      const message = error?.message || (typeof error === 'string' ? error : 'Unknown Gemini error while generating image.');
      throw new Error(message);
    }
  }

  // Generate product details (name, description, category) from an image (base64) and price
  async generateProductDetailsFromImage(
    base64Image: string,
    price: number,
    existingCategories: string[],
    instructions?: string
  ): Promise<{ name: string; description: string; category: string; }> {
    if (!this.isConfigured() || !this.ai) {
      throw new Error(this.configurationError() || 'Gemini service is not configured.');
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    };

    const categoriesString = existingCategories.length > 0 ? existingCategories.join(', ') : 'عام';
    let prompt = `أنت خبير تسويق. استنادًا إلى الصورة المرفقة والسعر ${price} د.ج، أنشئ JSON باللغة العربية بالشكل:
{ "name": "اسم جذاب", "description": "وصف تسويقي مفصّل", "category": "تصنيف مناسب" }.
إذا أمكن، اختَر التصنيف من: [${categoriesString}].`;

    if (instructions && instructions.trim().length > 0) {
      prompt += `\nملاحظات صاحب المتجر: ${instructions}`;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json'
        }
      });

      // API قد يُرجع نصاً مع أكواد أو أقواس؛ نحاول تنظيف وتحليل JSON بأمان
      const raw = response.text || '{}';
      const cleaned = String(raw).replace(/```json\s*|```/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        return {
          name: String(parsed.name || parsed.title || 'منتج جديد'),
          description: String(parsed.description || parsed.desc || 'وصف المنتج...'),
          category: String(parsed.category || parsed.cat || existingCategories[0] || 'عام')
        };
      } catch (parseErr) {
        // إذا فشل التحليل، نحاول استخراج بالقواعد البسيطة
        console.warn('Failed to parse JSON from Gemini, falling back to heuristic extraction.');
        const fallbackName = /"name"\s*:\s*"([^"]+)"/.exec(cleaned)?.[1] || `منتج بـ ${price} د.ج`;
        const fallbackDesc = /"description"\s*:\s*"([^"]+)"/.exec(cleaned)?.[1] || 'وصف المنتج...';
        const fallbackCat = /"category"\s*:\s*"([^"]+)"/.exec(cleaned)?.[1] || existingCategories[0] || 'عام';
        return { name: fallbackName, description: fallbackDesc, category: fallbackCat };
      }
    } catch (error: any) {
      console.error('Gemini.generateProductDetailsFromImage error:', error);
      const message = error?.message || 'Unknown Gemini error while generating product details.';
      throw new Error(message);
    }
  }
}