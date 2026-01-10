
'use server';

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import {toWav} from '../audio';

export const speakFlow = ai.defineFlow(
  {
    name: 'speakFlow',
    inputSchema: z.string(),
    outputSchema: z.string().optional(),
  },
  async (text) => {
    try {
      const {media} = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
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
);

export async function speak(text: string): Promise<string | undefined> {
    return speakFlow(text);
}
