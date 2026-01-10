'use server';

/**
 * @fileOverview Calculates and displays the 'Fluidity Score' in real-time.
 *
 * - calculateAndDisplayFluidityScore - A function that calculates the fluidity score.
 * - CalculateAndDisplayFluidityScoreInput - The input type for the calculateAndDisplayFluidityScore function.
 * - CalculateAndDisplayFluidityScoreOutput - The return type for the calculateAndDisplayFluidityScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateAndDisplayFluidityScoreInputSchema = z.object({
  userActionTimestamp: z.number().describe('The timestamp of the user action.'),
  aiResponseTimestamp: z.number().describe('The timestamp of the AI response.'),
});
export type CalculateAndDisplayFluidityScoreInput = z.infer<typeof CalculateAndDisplayFluidityScoreInputSchema>;

const CalculateAndDisplayFluidityScoreOutputSchema = z.object({
  fluidityScore: z.number().describe('The calculated fluidity score in milliseconds.'),
  commentary: z.string().describe('A commentary on the fluidity score.'),
});
export type CalculateAndDisplayFluidityScoreOutput = z.infer<typeof CalculateAndDisplayFluidityScoreOutputSchema>;

export async function calculateAndDisplayFluidityScore(
  input: CalculateAndDisplayFluidityScoreInput
): Promise<CalculateAndDisplayFluidityScoreOutput> {
  return calculateAndDisplayFluidityScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateAndDisplayFluidityScorePrompt',
  input: {schema: CalculateAndDisplayFluidityScoreInputSchema},
  output: {schema: CalculateAndDisplayFluidityScoreOutputSchema},
  prompt: `You are an AI that calculates the Fluidity Score between a user action and your response, and provides commentary.

The Fluidity Score is the absolute difference in milliseconds between the userActionTimestamp and the aiResponseTimestamp.

Based on the fluidityScore, provide a short, encouraging commentary.  If the score is below 50ms, praise the user's excellent sync.  If it is between 50ms and 100ms, provide encouraging feedback.  If it is above 100ms, suggest ways to improve sync.

User Action Timestamp: {{{userActionTimestamp}}}
AI Response Timestamp: {{{aiResponseTimestamp}}}

Fluidity Score: {{expression evaluate="Math.abs(userActionTimestamp - aiResponseTimestamp)"}}
Commentary: `,
});

const calculateAndDisplayFluidityScoreFlow = ai.defineFlow(
  {
    name: 'calculateAndDisplayFluidityScoreFlow',
    inputSchema: CalculateAndDisplayFluidityScoreInputSchema,
    outputSchema: CalculateAndDisplayFluidityScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
