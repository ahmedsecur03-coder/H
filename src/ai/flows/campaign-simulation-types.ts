
import { z } from 'zod';

/**
 * @fileOverview This file defines the types and schemas for the campaign simulation flow.
 *
 * - CampaignSimulationInputSchema - The Zod schema for the input.
 * - CampaignSimulationInput - The TypeScript type inferred from the schema.
 * - CampaignSimulationOutputSchema - The Zod schema for the output.
 * - CampaignSimulationOutput - The TypeScript type inferred from the schema.
 */

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
