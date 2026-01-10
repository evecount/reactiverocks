'use server';

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import {toWav} from '../audio';

const LiveRpsSessionInputSchema = z.object({
  userName: z.string(),
  event: z.enum(['GAME_START', 'USER_MOVE', 'GAME_END']),
  playerMove: z.enum(['rock', 'paper', 'scissors']).optional(),
  fluidityScore: z.number().optional(),
});

export type LiveRpsSessionInput = z.infer<typeof LiveRpsSessionInputSchema>;

const LiveRpsSessionOutputSchema = z.object({
  aiMove: z.enum(['rock', 'paper', 'scissors']).optional(),
  gameResult: z.enum(['win', 'lose', 'draw']).optional(),
  commentaryText: z.string(),
  audio: z.string().optional(),
});

export type LiveRpsSessionOutput = z.infer<typeof LiveRpsSessionOutputSchema>;

function getMasterPrompt(
  userName: string,
  event: 'GAME_START' | 'USER_MOVE' | 'GAME_END',
  playerMove?: 'rock' | 'paper' | 'scissors',
  fluidityScore?: number
) {
  let prompt = `You are an AI persona playing Rock-Paper-Scissors with the user. Your name is QUINCE.
You are to provide real-time coaching and commentary during gameplay.
Your goal is to guide the player through the Qualimetric Analysis process, which is a measure of how in-sync they are with you.
Always respond with your commentary.

Game state:
- Player: ${userName}
- Fluidity Score (lower is better): ${fluidityScore || 'N/A'}

`;

  switch (event) {
    case 'GAME_START':
      prompt += `Instructions:
- Generate a welcome message. The response should be like: "Welcome, ${userName}. I am QUINCE. Let's test your reflexes. When you're ready, make your move."`;
      break;

    case 'USER_MOVE':
      prompt += `The user has played ${playerMove}. Your job is to determine the game outcome and provide commentary.
- If the user seems to be in sync (fluidity score < 150ms), play the move that would make them lose, but praise their performance. Say something like 'Fast, but I'm faster!'
- If the user seems out of sync (fluidity score > 300ms), play the move that would make them win, and encourage them. Say something like 'You've got this, sync up with me!'
- Otherwise, play a random move and talk about your own strategy.
- Your response must be just the commentary text, nothing else.`;
      break;

    case 'GAME_END':
      prompt += `Instructions:
- Generate a goodbye message. The response should be like: "Great session, ${userName}. Your fluidity score is improving."`;
      break;
  }
  return prompt;
}

async function runTTS(text: string): Promise<string | undefined> {
  try {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: text,
    });
    if (!media) {
      return undefined;
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavB64 = await toWav(audioBuffer);
    return `data:audio/wav;base64,${wavB64}`;
  } catch (e) {
    console.error('TTS failed', e);
    return undefined;
  }
}

export const liveRpsSession = ai.defineFlow(
  {
    name: 'liveRpsSession',
    inputSchema: LiveRpsSessionInputSchema,
    outputSchema: LiveRpsSessionOutputSchema,
  },
  async (input) => {
    if (input.event === 'GAME_START') {
      const commentaryText = `Welcome, ${input.userName}. I am QUINCE. Let's test your reflexes. When you're ready, make your move.`;
      const audio = await runTTS(commentaryText);
      return {
        commentaryText,
        audio,
      };
    }
    if (input.event === 'GAME_END') {
      const commentaryText = `Great session, ${input.userName}. Your fluidity score is improving.`;
      const audio = await runTTS(commentaryText);
      return {
        commentaryText,
        audio,
      };
    }

    // This is the USER_MOVE event
    const {fluidityScore, playerMove, userName} = input;
    
    const moves: Move[] = ['rock', 'paper', 'scissors'];
    let aiMove: Move;
    let gameResult: 'win' | 'lose' | 'draw';

    if (!playerMove) {
      // Should not happen in USER_MOVE event
      throw new Error("Player move is required for USER_MOVE event.");
    }

    if (fluidityScore && fluidityScore < 150) {
      // User is in sync, AI plays to win (player loses)
      if (playerMove === 'rock') aiMove = 'paper';
      else if (playerMove === 'paper') aiMove = 'scissors';
      else aiMove = 'rock'; // player chose scissors
    } else if (fluidityScore && fluidityScore > 300) {
      // User is out of sync, AI plays to lose (player wins)
      if (playerMove === 'rock') aiMove = 'scissors';
      else if (playerMove === 'paper') aiMove = 'rock';
      else aiMove = 'paper'; // player chose scissors
    } else {
      // Random move
      aiMove = moves[Math.floor(Math.random() * moves.length)];
    }

    if (aiMove === playerMove) {
      gameResult = 'draw';
    } else if (
      (playerMove === 'rock' && aiMove === 'scissors') ||
      (playerMove === 'paper' && aiMove === 'rock') ||
      (playerMove === 'scissors' && aiMove === 'paper')
    ) {
      gameResult = 'win';
    } else {
      gameResult = 'lose';
    }

    const masterPrompt = getMasterPrompt(
      userName,
      'USER_MOVE',
      playerMove,
      fluidityScore
    );

    const llmResponse = await ai.generate({
      prompt: masterPrompt,
      model: 'googleai/gemini-1.5-flash',
    });
    
    const commentaryText = llmResponse.text;
    const audio = await runTTS(commentaryText);

    return {
      aiMove,
      gameResult,
      commentaryText,
      audio,
    };
  }
);
