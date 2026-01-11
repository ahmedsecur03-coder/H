
'use server';
/**
 * @fileOverview An AI flow for generating affiliate marketing posts.
 *
 * - generateAffiliatePost - A function that handles the affiliate post generation process.
 */

import { ai } from '@/ai/ai';
import { GenerateAffiliatePostInputSchema, GenerateAffiliatePostOutputSchema, type GenerateAffiliatePostInput, type GenerateAffiliatePostOutput } from './schemas';

const prompt = ai.definePrompt(
  {
    name: 'generateAffiliatePostPrompt',
    input: { schema: GenerateAffiliatePostInputSchema },
    output: { schema: GenerateAffiliatePostOutputSchema },
    prompt: `You are a creative social media marketing expert. Your task is to write a compelling and engaging post in Arabic to promote the 'Hagaaty' platform.

The post should be based on the following topic: {{{topic}}}

The post must:
- Be written entirely in Arabic.
- Be short, punchy, and suitable for platforms like Facebook, X, or Instagram.
- Create a sense of urgency or highlight a key benefit.
- Seamlessly and naturally include the affiliate referral link: {{{referralLink}}}
- Include 3-5 relevant and popular hashtags in Arabic.

Example Topic: "Fastest SMM services"
Example Output:
"هل سئمت من انتظار خدمات SMM البطيئة؟ 😴 في منصة حاجاتي، طلباتك تنطلق بسرعة الصاروخ! 🚀 احصل على متابعين ومشاهدات في دقائق وليس أيام. ابدأ الآن وشاهد الفرق بنفسك! ${'{{{referralLink}}}'}
#تسويق_رقمي #خدمات_SMM #نمو_سريع #حاجاتي"
`,
  },
);

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
