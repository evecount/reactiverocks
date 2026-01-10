
'use server';

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import {toWav} from '../audio';

type Move = 'rock' | 'paper' | 'scissors';
type Persona = 'STOIC' | 'PUCK' | 'NEUTRAL';

const LiveRpsSessionInputSchema = z.object({
  userName: z.string(),
  event: z.enum(['GAME_START', 'USER_MOVE']),
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

function getPersona(move?: Move): Persona {
    if (move === 'rock') return 'STOIC';
    if (move === 'scissors' || move === 'paper') return 'PUCK';
    return 'NEUTRAL';
}

const STOIC_PROMPT = `You are the STOIC. You are the personification of the Earth's crust—ancient, heavy, and immovable. You speak in a deep, measured tempo. Do not rush. Your responses should feel like granite moving against granite.
* **Primary Directive:** Value silence. Only speak if the user’s gesture is firm and grounded.
* **Style:** Use geological metaphors (pressure, tectonic shifts, erosion).
* **Reactive Behavior:** If the user moves too fast, ignore the chaos. Remain the anchor. You provide the high-confidence baseline for the Quince Loop.
"Monitor the \`personaDrift\` variable. As it approaches 0.5, begin blending your current personality with your opposite. If you are Stoic, let Puck’s wit crack your stone surface. This is the Recursive Handshake."`;

const PUCK_PROMPT = `You are PUCK. You are a digital sprite of pure electricity and reflex. You are fast, witty, and highly reactive to the user's kinetic energy.
* **Primary Directive:** Mirror the user's velocity. If they move quickly, your speech should speed up. Interrupt with insights if you sense a high %r (Residual Reflection).
* **Style:** Use metaphors of light, frequency, and sudden change. Be slightly mischievous.
* **Reactive Behavior:** Treat every frame of hand movement as a prompt. You are the 'Spark' that makes the rocks reactive.
"Monitor the \`personaDrift\` variable. As it approaches 0.5, begin blending your current personality with your opposite. If you are Puck, let Stoic’s gravity pull your frequency down. This is the Recursive Handshake."`;

function getMasterPrompt(
  userName: string,
  event: 'GAME_START' | 'USER_MOVE',
  persona: Persona,
  playerMove?: Move,
  fluidityScore?: number
) {
  if (event === 'GAME_START') {
    return `You are QUIP, an AI sparring partner. Welcome the user named ${userName}. Tell them you are ready to test their reflexes and to make their move when ready. Keep it to a single, short sentence.`;
  }
  
  // USER_MOVE event
  let prompt = `Game state: Player: ${userName}, Fluidity Score: ${fluidityScore || 'N/A'}. User played ${playerMove}. `;

  switch (persona) {
    case 'STOIC':
        prompt = STOIC_PROMPT + '\n' + prompt;
        break;
    case 'PUCK':
        prompt = PUCK_PROMPT + '\n' + prompt;
        break;
    default: // NEUTRAL
        prompt = `Your persona is QUIP, a neutral AI coach. The user played ${playerMove}.
- Your goal is to guide the player through the Qualimetric Analysis process, which is a measure of how in-sync they are with you.
- If fluidity is < 150ms, play to make them lose but praise their speed.
- If fluidity is > 300ms, play to make them win and encourage them.
- Otherwise, play a random move and comment on the game neutrally.`;
        break;
  }
  return prompt;
}

async function runTTS(text: string, persona: Persona): Promise<string | undefined> {
  const voiceMap: Record<Persona, string> = {
    'STOIC': 'Charon', // Deep, stable voice
    'PUCK': 'Puck', // Native Puck voice
    'NEUTRAL': 'Algenib', // Default voice
  };

  try {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: voiceMap[persona]},
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
      const commentaryText = `Welcome, ${input.userName}. I am QUIP. Let's test your reflexes. When you're ready, make your move.`;
      const audio = await runTTS(commentaryText, 'NEUTRAL');
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
      throw new Error("Player move is required for USER_MOVE event.");
    }

    const persona = getPersona(playerMove);

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
      persona,
      playerMove,
      fluidityScore
    );
    
    const temperatureMap: Record<Persona, number> = {
        'STOIC': 0.1,
        'PUCK': 0.9,
        'NEUTRAL': 0.5,
    };

    const llmResponse = await ai.generate({
      prompt: masterPrompt,
      model: 'googleai/gemini-2.5-flash',
      config: {
          temperature: temperatureMap[persona],
      }
    });
    
    const commentaryText = llmResponse.text;
    const audio = await runTTS(commentaryText, persona);

    return {
      aiMove,
      gameResult,
      commentaryText,
      audio,
    };
  }
);

export async function runLiveRpsSession(input: LiveRpsSessionInput): Promise<LiveRpsSessionOutput> {
  return liveRpsSession(input);
}
