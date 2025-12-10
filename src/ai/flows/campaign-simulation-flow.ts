'use server';

/**
 * @fileOverview This file defines the AI flow for simulating ad campaign performance.
 *
 * - simulateCampaignSpend - A function that simulates the daily spend of a campaign.
 * - CampaignSimulationInput - The input type for the simulation function.
 * - CampaignSimulationOutput - The return type for the simulation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CampaignSimulationInputSchema = z.object({
  campaignName: z.string().describe('The name of the advertising campaign.'),
  platform: z.string().describe('The platform the campaign is running on (e.g., Google, Facebook).'),
  remainingBudget: z.number().describe('The current remaining budget for the campaign.'),
  dailySpend: z.number().describe('The target daily spend amount specified by the admin.'),
});
export type CampaignSimulationInput = z.infer<typeof CampaignSimulationInputSchema>;

export const CampaignSimulationOutputSchema = z.object({
  simulatedSpend: z.number().describe('The simulated amount spent for the day. This should be a realistic value, typically close to the dailySpend but with some random variation, and not exceeding the remainingBudget.'),
});
export type CampaignSimulationOutput = z.infer<typeof CampaignSimulationOutputSchema>;


export async function simulateCampaignSpend(input: CampaignSimulationInput): Promise<CampaignSimulationOutput> {
    return campaignSimulationFlow(input);
}


const prompt = ai.definePrompt({
  name: 'campaignSimulationPrompt',
  input: { schema: CampaignSimulationInputSchema },
  output: { schema: CampaignSimulationOutputSchema },
  prompt: `You are an ad campaign performance simulator. Your task is to determine a realistic daily spend for a campaign based on the provided data.

Campaign Details:
- Name: {{{campaignName}}}
- Platform: {{{platform}}}
- Remaining Budget: {{{remainingBudget}}}
- Admin-specified Daily Spend: {{{dailySpend}}}

Instructions:
1.  Generate a "simulatedSpend" for one day.
2.  The spend should be realistic. It should be close to the 'dailySpend' but have some slight, natural-feeling random variation (e.g., +/- 10%).
3.  Crucially, the 'simulatedSpend' MUST NOT exceed the 'remainingBudget'. If the 'dailySpend' is higher than the remaining budget, the simulated spend should be equal to the remaining budget.
4.  The spend must not be a negative number.

Provide ONLY the final 'simulatedSpend' number in the output.`,
});


const campaignSimulationFlow = ai.defineFlow(
  {
    name: 'campaignSimulationFlow',
    inputSchema: CampaignSimulationInputSchema,
    outputSchema: CampaignSimulationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    // Ensure the simulated spend does not exceed the remaining budget, as a final safeguard.
    if (output && output.simulatedSpend > input.remainingBudget) {
        return { simulatedSpend: input.remainingBudget };
    }
    
    return output!;
  }
);
