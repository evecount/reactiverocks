'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Camera, Mic, MicOff, Square, User, Bot } from 'lucide-react';
import { GameState } from '@/types/game';
import { encode, decode, decodeAudioData } from '@/lib/audio-utils';
import { cn } from '@/lib/utils';

// Constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const FRAME_RATE = 2; // frames per second
const JPEG_QUALITY = 0.6;
const DEFAULT_ROUND_TIME = 3;

const UnifiedGame: React.FC = () => {
    // Game State (Merged Logic + UI)
    const [gameState, setGameState] = useState<GameState>({
        userGesture: 'unknown',
        aiGesture: 'unknown',
        winner: null,
        isThinking: false,
        status: 'idle',
    });

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI Specific State
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [round, setRound] = useState(1);
    const [playerName, setPlayerName] = useState('');
    const [hasName, setHasName] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [commentary, setCommentary] = useState("Initializing Neural Link...");
    const [resultMessage, setResultMessage] = useState<string | null>(null);

    // Refs for Audio/Video
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputAudioCtxRef = useRef<AudioContext | null>(null);
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const sessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const streamRef = useRef<MediaStream | null>(null);
    const frameIntervalRef = useRef<number | null>(null);

    // --- AUDIO INIT ---
    const initAudio = () => {
        if (!inputAudioCtxRef.current) {
            inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
        }
        if (!outputAudioCtxRef.current) {
            outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
        }
    };

    const stopAllMedia = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        if (sessionRef.current) {
            sessionRef.current.close?.();
            sessionRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        setIsConnected(false);
        setGameState(prev => ({ ...prev, status: 'idle' }));
        setCommentary("Link Lost. Reconnecting...");
    }, []);

    const connectToGemini = async () => {
        try {
            initAudio();
            setError(null);
            setCommentary("Connecting...");

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
            if (!apiKey) console.warn("API Key might be invalid or missing");

            const ai = new GoogleGenAI({ apiKey });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: {
                        parts: [{
                            text: `You are the logic engine for a high-stakes Rock Paper Scissors match.
                            You see the user's video feed. Watch for their hand gesture.
                            The user will count down: "Three, Two, One, Shoot!".
                            AT THE MOMENT OF "SHOOT", analyze the frame.
                            1. Identify the user's move (Rock, Paper, or Scissors).
                            2. IMMEDIATELY call the "reportGameResult" tool.
                            3. Choose your own move to WIN or LOSE based on your whims or random chance, but be decisive.
                            4. Provide a witty, short, punchy commentary.
                            If you don't see a clear hand, say so in commentary but default to DRAW.`
                        }]
                    },
                    tools: [{
                        functionDeclarations: [{
                            name: 'reportGameResult',
                            description: 'Updates the UI with the final moves and winner of a round.',
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    userMove: { type: Type.STRING, enum: ['rock', 'paper', 'scissors'], description: 'What the user played' },
                                    aiMove: { type: Type.STRING, enum: ['rock', 'paper', 'scissors'], description: 'What the AI played' },
                                    winner: { type: Type.STRING, enum: ['user', 'ai', 'draw'], description: 'Who won the round' },
                                    commentary: { type: Type.STRING, description: 'Short witty commentary' }
                                },
                                required: ['userMove', 'aiMove', 'winner', 'commentary']
                            }
                        }]
                    }],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                    }
                },
                callbacks: {
                    onopen: () => {
                        setIsConnected(true);
                        setGameState(prev => ({ ...prev, status: 'playing' }));
                        setCommentary("Neural Link Established.");
                        startStreaming(stream);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'reportGameResult') {
                                    const { userMove, aiMove, winner, commentary } = fc.args as any;
                                    setGameState(prev => ({
                                        ...prev,
                                        userGesture: userMove,
                                        aiGesture: aiMove,
                                        winner: winner,
                                        status: 'result'
                                    }));
                                    setCommentary(commentary || "Result Processed.");

                                    const msg = (winner || 'draw').toUpperCase();
                                    setResultMessage(msg === 'USER' ? "YOU WIN" : msg === 'AI' ? "YOU LOSE" : "DRAW");

                                    if (winner === 'user') setPlayerScore(s => s + 1);
                                    else if (winner === 'ai') setAiScore(s => s + 1);

                                    // Send confirmation
                                    sessionRef.current?.sendToolResponse({
                                        functionResponses: {
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: "ok" }
                                        }
                                    });

                                    // Auto Reset
                                    setTimeout(() => {
                                        setResultMessage(null);
                                        setGameState(prev => ({ ...prev, userGesture: 'unknown', aiGesture: 'unknown', status: 'playing', winner: null }));
                                        setRound(r => r + 1);
                                        // Trigger AI new round
                                        sessionRef.current?.sendRealtimeInput({
                                            text: "Start the next round countdown now."
                                        });
                                    }, 4000);
                                }
                            }
                        }

                        // Audio
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioCtxRef.current && !isMuted) {
                            const ctx = outputAudioCtxRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, OUTPUT_SAMPLE_RATE, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.onended = () => sourcesRef.current.delete(source);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (err) => {
                        console.error("Gemini Error:", err);
                        setError("Connection error.");
                        stopAllMedia();
                    },
                    onclose: () => stopAllMedia()
                }
            });

            sessionRef.current = await sessionPromise;
        } catch (err: any) {
            console.error("Init Error:", err);
            setError(err.message || "Failed to access camera or microphone via API Key.");
            setCommentary("System Error: Connection Failed");
        }
    };

    const startStreaming = (stream: MediaStream) => {
        const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
            if (isMuted) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            sessionRef.current?.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
        };
        source.connect(processor);
        processor.connect(inputAudioCtxRef.current!.destination);

        frameIntervalRef.current = window.setInterval(() => {
            if (videoRef.current && canvasRef.current && sessionRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.width = 320; canvas.height = 240;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64 = (reader.result as string).split(',')[1];
                                sessionRef.current?.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                            };
                            reader.readAsDataURL(blob);
                        }
                    }, 'image/jpeg', JPEG_QUALITY);
                }
            }
        }, 1000 / FRAME_RATE);
    };

    const handleInstructionsReady = () => {
        setHasName(true);
        connectToGemini();
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black">
            {/* Use full screen video background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="absolute inset-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,black_85%)]"></div>

            {/* Error / Init */}
            {!hasName && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="max-w-2xl w-full mx-4 border-2 border-[hsl(180,100%,50%)] shadow-[0_0_50px_rgba(0,255,255,0.2)] bg-black/80 rounded-xl p-8 flex flex-col items-center gap-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl md:text-5xl digital-font text-white neon-glow">COMBAT PROTOCOLS</h2>
                            <p className="text-xl text-[hsl(180,100%,50%)] font-mono">ENTER YOUR DESIGNATION</p>
                        </div>
                        <div className="w-full flex gap-2">
                            <input
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                placeholder="PLAYER NAME..."
                                className="font-mono bg-black/50 neon-glow border-none text-lg text-center flex-1 py-4 text-white uppercase"
                            />
                        </div>
                        <button
                            className="w-full text-xl py-6 font-mono tracking-widest bg-[hsl(180,100%,50%)] text-black hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,255,255,0.4)] rounded-lg font-bold"
                            onClick={() => { if (playerName) handleInstructionsReady(); }}
                        >
                            INITIATE LINK
                        </button>
                    </div>
                </div>
            )}

            {/* Connecting State */}
            {hasName && !isConnected && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center flex-col gap-4 z-20">
                    <div className="w-16 h-16 border-4 border-[hsl(180,100%,50%)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[hsl(180,100%,50%)] font-mono">{commentary}</p>
                </div>
            )}

            {/* Main HUD */}
            {isConnected && (
                <div className="absolute inset-0 pt-24 md:pt-32 flex flex-col justify-between p-4 md:p-8">
                    {/* Header: Scores */}
                    <div className="relative flex justify-between items-start gap-4 z-[60]">
                        <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow">
                            <User className="w-8 h-8 text-[hsl(180,100%,50%)]" />
                            <div className="flex-1 w-24">
                                <p className="font-mono text-[hsl(180,100%,50%)] truncate">{playerName}</p>
                                <p className="font-bold text-4xl digital-font text-white">{playerScore}</p>
                            </div>
                        </div>

                        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center">
                            <div className="digital-font text-7xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                {round}
                            </div>
                            <span className="text-xs text-white/50 tracking-widest font-mono">ROUND</span>
                        </div>

                        <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow">
                            <div className="flex-1 text-right w-24">
                                <p className="font-mono text-[hsl(271,83%,53%)] truncate">HIVE</p>
                                <p className="font-bold text-4xl digital-font text-white">{aiScore}</p>
                            </div>
                            <Bot className="w-8 h-8 text-[hsl(271,83%,53%)]" />
                        </div>
                    </div>

                    {/* Move Display */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-between items-center px-4 md:px-16 pointer-events-none">
                        <div className="w-32 h-32 flex items-center justify-center">
                            {(gameState.userGesture !== 'unknown') && (
                                <div className="text-8xl drop-shadow-[0_0_20px_hsl(var(--primary))] animate-in fade-in zoom-in-50">
                                    {gameState.userGesture === 'rock' ? "✊" : gameState.userGesture === 'paper' ? "✋" : "✌️"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Reveal */}
                    {(gameState.status === 'result' && gameState.aiGesture !== 'unknown') && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[80]">
                            <div className="relative animate-in zoom-in-0 duration-300 ease-out-back text-center">
                                <div className={cn("absolute inset-0 blur-[100px] opacity-50",
                                    gameState.aiGesture === 'rock' ? "bg-red-500" :
                                        gameState.aiGesture === 'paper' ? "bg-blue-500" : "bg-purple-500")}
                                />
                                <div className={cn("text-[200px] leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]",
                                    gameState.aiGesture === 'rock' ? "text-red-500" :
                                        gameState.aiGesture === 'paper' ? "text-blue-500" : "text-purple-500"
                                )}>
                                    {gameState.aiGesture === 'rock' ? "✊" : gameState.aiGesture === 'paper' ? "✋" : "✌️"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Comments */}
                    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
                        <div className="w-full bg-black/60 backdrop-blur-sm neon-glow rounded-xl p-4 overflow-hidden">
                            <div className="whitespace-nowrap overflow-hidden">
                                <p className="text-2xl md:text-3xl font-mono tracking-widest text-[#00ff00] uppercase animate-pulse">
                                    {commentary}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setIsMuted(!isMuted)} className="p-4 bg-black/50 neon-glow rounded-full text-white hover:bg-white/10">
                                {isMuted ? <MicOff /> : <Mic />}
                            </button>
                            <button onClick={stopAllMedia} className="p-4 bg-red-900/50 border-2 border-red-500 text-white rounded-full hover:bg-red-800">
                                <Square />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {resultMessage && (
                <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[100] text-center">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"></div>
                    <h2 className={cn("text-8xl font-bold font-mono animate-in fade-in zoom-in-50 drop-shadow-[0_0_50px_currentColor]",
                        resultMessage === 'YOU WIN' && 'text-[hsl(180,100%,50%)]',
                        resultMessage === 'YOU LOSE' && 'text-[hsl(0,84%,60%)]',
                        resultMessage === 'DRAW' && 'text-white'
                    )}>
                        {resultMessage}
                    </h2>
                </div>
            )}
        </div>
    );
};

export default UnifiedGame;
