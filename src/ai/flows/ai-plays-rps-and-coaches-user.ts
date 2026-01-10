'use server';

/**
 * @fileOverview Implements the AI's Rock-Paper-Scissors gameplay and real-time user coaching.
 *
 * - aiPlaysRpsAndCoachesUser - Main function to initiate and manage the RPS game with coaching.
 * - AIPlaysRpsAndCoachesUserInput - Defines the input schema for the AI's RPS game.
 * - AIPlaysRpsAndCoachesUserOutput - Defines the output schema, including AI's move and coaching messages.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPlaysRpsAndCoachesUserInputSchema = z.object({
  userMove: z.enum(['rock', 'paper', 'scissors']).describe('The user\'s move in the game.'),
  gameState: z.string().optional().describe('The current state of the game, if any.'),
  fluidityScore: z.number().optional().describe('The fluidity score of the user.'),
});
export type AIPlaysRpsAndCoachesUserInput = z.infer<
  typeof AIPlaysRpsAndCoachesUserInputSchema
>;

const AIPlaysRpsAndCoachesUserOutputSchema = z.object({
  aiMove: z.enum(['rock', 'paper', 'scissors']).describe('The AI\'s move in the game.'),
  commentary: z.string().describe('Real-time coaching and commentary from the AI persona.'),
  gameResult: z
    .enum(['win', 'lose', 'draw'])
    .describe('The result of the game (win, lose, or draw).'),
  updatedGameState: z.string().optional().describe('Updated game state.'),
});
export type AIPlaysRpsAndCoachesUserOutput = z.infer<
  typeof AIPlaysRpsAndCoachesUserOutputSchema
>;

const rpsPrompt = ai.definePrompt({
  name: 'rpsAndCoachingPrompt',
  input: {
    schema: AIPlaysRpsAndCoachesUserInputSchema,
  },
  output: {
    schema: AIPlaysRpsAndCoachesUserOutputSchema,
  },
  prompt: `You are an AI persona playing Rock-Paper-Scissors with the user. Provide real-time coaching and commentary during gameplay.

  User's move: {{{userMove}}}
  Game state: {{{gameState}}}
  Fluidity Score: {{{fluidityScore}}}

  Determine your move, provide commentary, and determine the game result.
  The commentary should provide coaching relative to the user's play and the fluidity score.

  Return the AI's move, commentary, the game result, and the updated game state if applicable.
  Follow these instructions to choose your move:
  1. React to the user's move.
  2. Take into account user's fluidity score.
  3. If the user's fluidity score is high, play the move that would make them lose, but add commentary on them playing well.
  4. If the user's fluidity score is low, play the move that would make them win, but add commentary on where they can improve.
  5. If the user's fluidity score is medium, play a random move, and add commentary on the AI's strategy.
  6. Only choose from rock, paper or scissors.

  The output MUST be in JSON format.
  `,
});

export async function aiPlaysRpsAndCoachesUser(
  input: AIPlaysRpsAndCoachesUserInput
): Promise<AIPlaysRpsAndCoachesUserOutput> {
  return aiPlaysRpsAndCoachesUserFlow(input);
}

const aiPlaysRpsAndCoachesUserFlow = ai.defineFlow(
  {
    name: 'aiPlaysRpsAndCoachesUserFlow',
    inputSchema: AIPlaysRpsAndCoachesUserInputSchema,
    outputSchema: AIPlaysRpsAndCoachesUserOutputSchema,
  },
  async input => {
    const {output} = await rpsPrompt(input);
    return output!;
  }
);
