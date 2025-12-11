
'use server';

/**
 * @fileOverview This file defines the AI flow for simulating ad campaign performance.
 *
 * - simulateCampaignPerformance - A function that simulates the daily performance of a campaign.
 * - CampaignSimulationInput - The input type for the simulation function.
 * - CampaignSimulationOutput - The return type for the simulation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Campaign } from '@/lib/types';


export const CampaignSimulationInputSchema = z.object({
  campaignName: z.string().describe('The name of the advertising campaign.'),
  platform: z.string().describe('The platform the campaign is running on (e.g., Google, Facebook).'),
  goal: z.string().describe('The main objective of the campaign (e.g., Website Traffic, Video Views).'),
  remainingBudget: z.number().describe('The current remaining budget for the campaign.'),
  dailySpend: z.number().describe('The target daily spend amount specified by the admin.'),
});
export type CampaignSimulationInput = z.infer<typeof CampaignSimulationInputSchema>;

export const CampaignSimulationOutputSchema = z.object({
  simulatedSpend: z.number().describe('The simulated amount spent for the day. This should be a realistic value, typically close to the dailySpend but with some random variation, and not exceeding the remainingBudget.'),
  simulatedImpressions: z.number().describe('The simulated number of impressions for the day. This should be a realistic number based on the platform and spend (e.g., TikTok has a low CPM, Google Search has a high CPM).'),
  simulatedClicks: z.number().describe('The simulated number of clicks. This should be logically derived from impressions, considering a realistic CTR for the platform and goal.'),
  simulatedResults: z.number().describe('The simulated number of results (e.g., conversions, views). This should be logically derived from clicks or impressions, based on the campaign goal.'),
});
export type CampaignSimulationOutput = z.infer<typeof CampaignSimulationOutputSchema>;


export async function simulateCampaignPerformance(input: CampaignSimulationInput): Promise<CampaignSimulationOutput> {
    return campaignSimulationFlow(input);
}


const prompt = ai.definePrompt({
  name: 'campaignSimulationPrompt',
  input: { schema: CampaignSimulationInputSchema },
  output: { schema: CampaignSimulationOutputSchema },
  prompt: `You are an expert ad campaign performance simulator. Your task is to generate a realistic daily performance report for a campaign based on the provided data.

Campaign Details:
- Name: {{{campaignName}}}
- Platform: {{{platform}}}
- Goal: {{{goal}}}
- Remaining Budget: {{{remainingBudget}}}
- Admin-specified Daily Spend: {{{dailySpend}}}

Instructions:
1.  **Simulate Daily Spend:** Generate a 'simulatedSpend'. It must be realistic, close to 'dailySpend' but with slight variation (e.g., +/- 10%). It CANNOT exceed 'remainingBudget'. If 'dailySpend' > 'remainingBudget', spend the entire remaining budget. It must not be negative.
2.  **Simulate Impressions:** Generate 'simulatedImpressions'. Be realistic based on the platform. For example, a $10 spend on TikTok might generate thousands of impressions (low CPM), while on Google Search it would be much less (high CPM).
3.  **Simulate Clicks:** Generate 'simulatedClicks'. This must be logically derived from impressions. Consider a realistic Click-Through Rate (CTR) for the platform and goal (e.g., Google Search CTR is high, TikTok/Facebook awareness CTR is low). Clicks cannot be more than impressions.
4.  **Simulate Results:** Generate 'simulatedResults'. This is the primary goal metric. It should be derived from clicks (for Traffic/Conversion goals) or impressions (for Awareness/Video View goals). Use realistic conversion rates.

Example Logic:
- **Google Search, Traffic Goal:** High CPC, High CTR. Spend $10 -> ~10-20 clicks -> ~10-20 results (link clicks).
- **Facebook, Awareness Goal:** Low CPM, Low CTR. Spend $10 -> ~2000-5000 impressions -> ~10-30 clicks -> ~2000-5000 results (impressions).
- **TikTok, Video Views Goal:** Very Low CPV. Spend $10 -> ~3000-7000 impressions -> ~15-40 clicks -> ~1000-2000 results (video views).

Provide ONLY the JSON output with the four simulated metrics.`,
});


const campaignSimulationFlow = ai.defineFlow(
  {
    name: 'campaignSimulationFlow',
    inputSchema: CampaignSimulationInputSchema,
    outputSchema: CampaignSimulationOutputSchema,
  },
  async (input) => {
    // If the target daily spend is greater than the budget, just spend the rest of the budget.
    if (input.dailySpend >= input.remainingBudget) {
      // In this edge case, we'll just simulate the spend and let the AI figure out the rest in a follow-up or have a simplified logic.
      // For now, let's create a plausible "final day" scenario.
       const finalSpend = input.remainingBudget;
       const { output } = await prompt({...input, dailySpend: finalSpend });

       // Ensure spend is exactly the remaining budget in this case.
       if (output) {
          output.simulatedSpend = finalSpend;
          return output;
       }
       // Fallback if AI fails
       return { 
          simulatedSpend: finalSpend,
          simulatedImpressions: 0,
          simulatedClicks: 0,
          simulatedResults: 0
       };
    }
    
    const { output } = await prompt(input);

    // Final safeguards to ensure logical consistency, as AI might make mistakes.
    if (output) {
        if (output.simulatedSpend > input.remainingBudget) {
            output.simulatedSpend = input.remainingBudget;
        }
        if (output.simulatedClicks > output.simulatedImpressions) {
            output.simulatedClicks = output.simulatedImpressions;
        }
    }
    
    return output!;
  }
);
