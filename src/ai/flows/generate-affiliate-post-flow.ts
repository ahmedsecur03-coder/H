
'use server';
/**
 * @fileOverview A flow for generating promotional content for affiliates.
 *
 * - generateAffiliatePost - A function that handles the affiliate post generation.
 * - GenerateAffiliatePostInput - The input type for the function.
 * - GenerateAffiliatePostOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const GenerateAffiliatePostInputSchema = z.object({
  referralLink: z.string().url().describe("The affiliate's unique referral link."),
  platform: z.string().describe('The target platform for the post (e.g., Facebook, Twitter, Blog).'),
});
export type GenerateAffiliatePostInput = z.infer<typeof GenerateAffiliatePostInputSchema>;

const GenerateAffiliatePostOutputSchema = z.object({
  title: z.string().describe('The catchy title for the post.'),
  content: z.string().describe('The full content of the promotional post in Arabic, formatted in Markdown.'),
});
export type GenerateAffiliatePostOutput = z.infer<typeof GenerateAffiliatePostOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateAffiliatePostPrompt',
  input: { schema: GenerateAffiliatePostInputSchema },
  output: { schema: GenerateAffiliatePostOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `أنت خبير تسويق رقمي ومؤلف إعلانات محترف. مهمتك هي كتابة منشور تسويقي جذاب ومقنع باللغة العربية للترويج لمنصة "حاجاتي" الرقمية.

الهدف من المنشور هو تشجيع القراء على التسجيل في المنصة باستخدام رابط الإحالة المرفق.

**تفاصيل المنصة (حاجاتي):**
- هي منصة متكاملة لخدمات التسويق الرقمي (SMM).
- تقدم خدمات لجميع المنصات (انستغرام، تيك توك، فيسبوك، إلخ).
- تتيح إدارة حملات إعلانية ذكية على جوجل وميتا.
- توفر حسابات إعلانية وكالة (Agency Accounts) لتجاوز قيود الحسابات الجديدة.
- لديها نظام إحالة قوي ومتعدد المستويات.

**المهمة:**
قم بإنشاء عنوان جذاب ومحتوى تسويقي للمنصة المستهدفة: **{{{platform}}}**.

**التعليمات:**
- يجب أن يكون المحتوى باللغة العربية الفصحى، مع لمسة تسويقية حديثة.
- خاطب نقطة الألم لدى الجمهور المستهدف (مثل: صعوبة النمو على السوشيال ميديا، تقييد الحسابات الإعلانية، البحث عن مصدر دخل إضافي).
- أبرز الميزات والفوائد الرئيسية للمنصة.
- قم بتضمين رابط الإحالة التالي بشكل طبيعي داخل المحتوى: **{{{referralLink}}}**
- استخدم تنسيق الماركداون (Markdown) لجعل المنشور سهل القراءة (عناوين، نقاط، نص عريض).
- اجعل نبرة المنشور حماسية ومحفزة لاتخاذ إجراء (Call to Action).
`,
});

const generateAffiliatePostFlow = ai.defineFlow(
  {
    name: 'generateAffiliatePostFlow',
    inputSchema: GenerateAffiliatePostInputSchema,
    outputSchema: GenerateAffiliatePostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function generateAffiliatePost(input: GenerateAffiliatePostInput): Promise<GenerateAffiliatePostOutput> {
  return generateAffiliatePostFlow(input);
}
    