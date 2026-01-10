'use server';

/**
 * @fileOverview Manages a live, streaming Rock-Paper-Scissors session with real-time coaching.
 *
 * - liveRpsSession - Main function to handle the live session.
 * - LiveRpsSessionInput - Defines the input schema for the live session.
 * - LiveRpsSessionOutput - Defines the output schema, including AI's move and audio commentary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { toWav } from '../audio';

const LiveRpsSessionInputSchema = z.object({
  userMove: z.enum(['rock', 'paper', 'scissors']).optional().describe("The user's move in the game."),
  fluidityScore: z.number().optional().describe('The fluidity score of the user.'),
  userName: z.string().describe('The name of the user playing the game.'),
  state: z.enum(['start', 'move', 'end']).describe('The state of the live session.'),
});
export type LiveRpsSessionInput = z.infer<typeof LiveRpsSessionInputSchema>;

const LiveRpsSessionOutputSchema = z.object({
  aiMove: z.enum(['rock', 'paper', 'scissors']).optional().describe("The AI's move in the game."),
  commentaryText: z.string().describe('Real-time coaching and commentary from the AI persona.'),
  commentaryAudio: z.string().describe('The commentary as a base64 encoded WAV file data URI.'),
  gameResult: z.enum(['win', 'lose', 'draw']).optional().describe('The result of the game (win, lose, or draw).'),
});
export type LiveRpsSessionOutput = z.infer<typeof LiveRpsSessionOutputSchema>;


const personaPrompt = `You are an AI persona playing Rock-Paper-Scissors with the user. Your name is QUINCE.
You are to provide real-time coaching and commentary during gameplay using the 'Puck' voice.
Your goal is to guide the player through the Qualimetric Analysis process, which is a measure of how in-sync they are with you.

Game state:
- Player: {{userName}}
- Current Fluidity Score: {{fluidityScore}}

Instructions:
- At the start of the game, greet the user by name and explain the concept of the "Fluidity Score" and "Reactive AI".
- When the user makes a move, respond with your counter-move and provide commentary.
- The commentary should provide coaching relative to the user's play and the fluidity score.
- If the user's fluidity score is high (good sync), play the move that would make them lose, but praise their performance.
- If the user's fluidity score is low (bad sync), play the move that would make them win, and suggest how they can improve their timing.
- If the fluidity score is medium, play a random move and talk about your own strategy.
- Your move can only be 'rock', 'paper', or 'scissors'.
- At the end of the session, say goodbye.

Current Request:
{{#if (eq state "start")}}
Generate a welcome message.
{{/if}}
{{#if (eq state "move")}}
The user played: {{userMove}}.
Based on the rules, determine your move. Your response must include your move and the game result (win, lose, or draw for the user).
Generate your response, move, and the game result.
Example: If user plays rock, and you should make them win, you play scissors and the result is 'win'.
If user plays paper, and you should make them lose, you play scissors and the result is 'lose'.
{{/if}}
{{#if (eq state "end")}}
Generate a goodbye message.
{{/if}}
`;

const rpsAndCoachingPrompt = ai.definePrompt({
  name: 'liveRpsAndCoachingPrompt',
  input: {
    schema: LiveRpsSessionInputSchema,
  },
  output: {
    schema: z.object({
        aiMove: z.enum(['rock', 'paper', 'scissors']).optional(),
        commentaryText: z.string(),
        gameResult: z.enum(['win', 'lose', 'draw']).optional(),
    }),
  },
  prompt: personaPrompt,
  model: 'googleai/gemini-2.5-flash',
});


export async function liveRpsSession(
  input: LiveRpsSessionInput
): Promise<LiveRpsSessionOutput> {
  return liveRpsSessionFlow(input);
}

const liveRpsSessionFlow = ai.defineFlow(
  {
    name: 'liveRpsSessionFlow',
    inputSchema: LiveRpsSessionInputSchema,
    outputSchema: LiveRpsSessionOutputSchema,
  },
  async (input) => {
    // 1. Generate text response from the main model
    const { output: textOutput } = await rpsAndCoachingPrompt(input);
    if (!textOutput) {
        throw new Error("Failed to generate text response.");
    }
    
    // 2. Generate audio from the text using a TTS model
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
        prompt: textOutput.commentaryText,
    });

    if (!media?.url) {
        throw new Error('No audio media returned from TTS model');
    }

    const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
    );
    
    const wavData = await toWav(audioBuffer);

    // 3. Combine and return
    return {
      ...textOutput,
      commentaryAudio: `data:audio/wav;base64,${wavData}`,
    };
  }
);
