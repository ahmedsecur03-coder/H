'use server';
/**
 * @fileOverview A blog post generation AI flow.
 *
 * - generateBlogPost - A function that handles the blog post generation process.
 * - GenerateBlogPostInput - The input type for the generateBlogPost function.
 * - GenerateBlogPostOutput - The return type for the generateBlogPost function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateBlogPostInputSchema = z.string().describe('The topic for the blog post.');
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('The generated title of the blog post.'),
  content: z.string().describe('The generated content of the blog post in Arabic Markdown format.'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;

// This exported function is the Server Action
export async function generateBlogPost(topic: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(topic);
}

const prompt = ai.definePrompt({
  name: 'generateBlogPostPrompt',
  model: googleAI.model('gemini-pro'),
  input: { schema: GenerateBlogPostInputSchema },
  output: { schema: GenerateBlogPostOutputSchema },
  prompt: `أنت خبير في التسويق الرقمي وإنشاء المحتوى لمنصة خدمات رقمية تسمى "حاجاتي".
  مهمتك هي كتابة مقال احترافي وجذاب باللغة العربية حول الموضوع التالي: {{{input}}}

  يجب أن يكون المقال:
  - بتنسيق Markdown.
  - يحتوي على عناوين رئيسية (##) وعناوين فرعية (###).
  - يتضمن قوائم نقطية أو رقمية لسهولة القراءة.
  - مكتوب بأسلوب شيق ومفيد للجمهور المستهدف (المسوقون الرقميون، أصحاب الأعمال الصغيرة).
  - يهدف إلى تقديم قيمة حقيقية للقارئ مع الترويج بذكاء لخدمات المنصة إن أمكن.
  
  قم بتوليد عنوان جذاب ومحتوى متكامل للمقال.`,
});

const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("Failed to generate blog post. The model did not return any output.");
    }
    return output;
  }
);
