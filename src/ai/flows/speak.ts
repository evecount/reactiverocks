
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { toWav } from '../audio';

export const speakFlow = ai.defineFlow(
  {
    name: 'speakFlow',
    inputSchema: z.string(),
    outputSchema: z.string().nullable(),
  },
  async (text) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: text,
      });
      if (!media) {
        return null;
      }
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      const wavB64 = await toWav(audioBuffer);
      return `data:audio/wav;base64,${wavB64}`;
    } catch (e) {
      console.error('TTS failed', e);
      return null;
    }
  }
);

export async function speak(text: string): Promise<string | null | undefined> {
  return speakFlow(text);
}

