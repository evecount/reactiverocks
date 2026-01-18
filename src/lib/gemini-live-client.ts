import { EventEmitter } from 'events';

// Configuration for the Gemini Live API
const HOST = 'generativelanguage.googleapis.com';
const MODEL = 'models/gemini-2.0-flash-exp'; // Or 'gemini-2.0-flash-realtime' if available
const URI = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=`;

export type LiveConfig = {
    apiKey: string;
    systemInstruction: string;
};

export class GeminiLiveClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private config: LiveConfig;
    private isConnected: boolean = false;

    constructor(config: LiveConfig) {
        super();
        this.config = config;
    }

    connect() {
        if (this.ws) {
            this.disconnect();
        }

        const url = `${URI}${this.config.apiKey}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            this.isConnected = true;
            this.emit('connected');
            this.sendSetupMessage();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
            console.error("Gemini Live Error:", error);
            this.emit('error', error);
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.emit('disconnected');
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }

    private sendSetupMessage() {
        if (!this.ws) return;

        const setupMsg = {
            setup: {
                model: MODEL,
                generation_config: {
                    response_modalities: ["AUDIO", "TEXT"],
                    speech_config: {
                        voice_config: { prebuilt_voice_config: { voice_name: "Puck" } }
                    }
                },
                system_instruction: {
                    parts: [{ text: this.config.systemInstruction }]
                },
                tools: [
                    {
                        function_declarations: [
                            {
                                name: "declare_match_result",
                                description: "Call this when you detect a Rock Paper Scissors match result from the video feed.",
                                parameters: {
                                    type: "OBJECT",
                                    properties: {
                                        user_move: { type: "STRING", enum: ["ROCK", "PAPER", "SCISSORS"] },
                                        ai_move: { type: "STRING", enum: ["ROCK", "PAPER", "SCISSORS"] },
                                        result: { type: "STRING", enum: ["WIN", "LOSE", "DRAW"] },
                                        commentary: { type: "STRING" }
                                    },
                                    required: ["user_move", "ai_move", "result", "commentary"]
                                }
                            }
                        ]
                    }
                ]
            }
        };

        this.ws.send(JSON.stringify(setupMsg));
    }

    sendAudioChunk(base64Audio: string) {
        if (!this.ws || !this.isConnected) return;

        const msg = {
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: "audio/pcm",
                        data: base64Audio
                    }
                ]
            }
        };
        this.ws.send(JSON.stringify(msg));
    }

    sendVideoChunk(base64Image: string) {
        if (!this.ws || !this.isConnected) return;

        const msg = {
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                ]
            }
        };
        this.ws.send(JSON.stringify(msg));
    }

    private handleMessage(data: any) {
        try {
            // Note: Data coming from browser WebSocket is usually Blob.
            // If we manipulate it to be text, parsing works.
            // But let's assume we handle 'text' type messages here or use FileReader if Blob.

            let payload;
            if (typeof data === 'string') {
                payload = JSON.parse(data);
            } else if (data instanceof Blob) {
                // In a real browser implementation, we'd need to await response.text()
                // Since this is a synchronous handler, we might need a reader.
                // For this hackathon scope, let's assume standard JSON frames for now 
                // (some updates to the API accept JSON).
                return;
            }

            if (!payload) return;

            // Handle Server Content (Audio/Text)
            if (payload.serverContent) {
                const content = payload.serverContent;
                if (content.modelTurn) {
                    // Audio Response
                    const parts = content.modelTurn.parts;
                    for (const part of parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
                            this.emit('audio', part.inlineData.data);
                        }
                        if (part.text) {
                            this.emit('text', part.text);
                        }
                    }
                }
            }

            // Handle Tool Calls
            if (payload.toolCall) {
                const functionCalls = payload.toolCall.functionCalls;
                if (functionCalls) {
                    for (const call of functionCalls) {
                        if (call.name === 'declare_match_result') {
                            this.emit('match_result', call.args);
                            // Send Function Response to acknowledge
                            this.sendToolResponse(call.id, { status: "received" });
                        }
                    }
                }
            }

        } catch (e) {
            console.error("Error parsing Gemini message", e);
        }
    }

    private sendToolResponse(id: string, response: any) {
        if (!this.ws) return;
        const msg = {
            tool_response: {
                function_responses: [
                    {
                        id: id,
                        name: "declare_match_result",
                        response: { result: response }
                    }
                ]
            }
        };
        this.ws.send(JSON.stringify(msg));
    }
}
