'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Camera, Mic, MicOff, Square, User, Bot, RefreshCcw, Play } from 'lucide-react';
import { GameState } from '@/types/game';
import { encode, decode, decodeAudioData } from '@/lib/audio-utils';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const FRAME_RATE = 10; // frames per second
const JPEG_QUALITY = 0.6;

const UnifiedGame: React.FC = () => {
    // Game State
    const [gameState, setGameState] = useState<GameState>({
        userGesture: 'unknown',
        aiGesture: 'unknown',
        winner: null,
        isThinking: false,
        status: 'idle',
    });

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Permissions
    const [hasPermissions, setHasPermissions] = useState(false);
    const [permissionConfig, setPermissionConfig] = useState({ camera: true, microphone: true });

    // UI State
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [round, setRound] = useState(1);
    const [playerName, setPlayerName] = useState('');
    const [hasName, setHasName] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [commentary, setCommentary] = useState("Initializing Protocol...");
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const sessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const streamRef = useRef<MediaStream | null>(null);
    const frameIntervalRef = useRef<number | null>(null);

    // Cleanup
    const stopAllMedia = useCallback(() => {
        console.log("Stopping all media and connection...");
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch (e) { /* ignore */ }
            sessionRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();

        // Don't fully reset state if we just want to restart connection, but here we do soft reset
        setIsConnected(false);
        setIsConnecting(false);
    }, []);

    // Init Audio Context (Output only for now to reduce complexity)
    const initAudioOutput = () => {
        if (!outputAudioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            outputAudioCtxRef.current = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });
        }
        if (outputAudioCtxRef.current.state === 'suspended') {
            outputAudioCtxRef.current.resume();
        }
    };

    // Connection Logic
    const connectToGemini = async () => {
        if (isConnecting) return;

        try {
            console.log("Starting connection sequence...");
            setIsConnecting(true);
            setError(null);
            setCommentary("Establishing Neural Link...");

            initAudioOutput();

            // validation
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!apiKey || apiKey.length < 10) {
                throw new Error("Invalid API Key in environment");
            }

            // Get Media Stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false, // Start simple: No audio input to prevent echo/feedback loops
                video: { width: 320, height: 240 }
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Init Client
            const ai = new GoogleGenAI({ apiKey });

            // Connect
            const session = await ai.live.connect({
                model: 'models/gemini-2.0-flash-exp',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: {
                        parts: [{
                            text: `You are a Rock Paper Scissors referee.
user video is provided.
When you see the user gesture or receive "Start Round", start the game.
1. Say "Ready? Rock... Paper... Scissors... SHOOT!"
2. Detect the user's hand at "SHOOT".
3. Pick your move randomly.
4. Call 'reportGameResult' tool with the winner.
5. If no hand seen, declare DRAW.`
                        }]
                    },
                    tools: [{
                        functionDeclarations: [{
                            name: 'reportGameResult',
                            description: 'Report the result of the round',
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    userMove: { type: Type.STRING, enum: ['rock', 'paper', 'scissors', 'unknown'] },
                                    aiMove: { type: Type.STRING, enum: ['rock', 'paper', 'scissors'] },
                                    winner: { type: Type.STRING, enum: ['user', 'ai', 'draw'] },
                                    commentary: { type: Type.STRING }
                                },
                                required: ['userMove', 'aiMove', 'winner', 'commentary']
                            }
                        }]
                    }]
                },
                callbacks: {
                    onopen: () => {
                        console.log("Socket Open");
                        setIsConnecting(false);
                        setIsConnected(true);
                        setCommentary("Link Stable. Waiting for signal.");
                        startVideoStreaming(stream);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Audio Handling
                        try {
                            const data = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (data && outputAudioCtxRef.current && !isMuted) {
                                const ctx = outputAudioCtxRef.current;
                                const buffer = await decodeAudioData(decode(data), ctx, OUTPUT_SAMPLE_RATE, 1);

                                // Simple queueing
                                const now = ctx.currentTime;
                                const start = Math.max(nextStartTimeRef.current, now);

                                const source = ctx.createBufferSource();
                                source.buffer = buffer;
                                source.connect(ctx.destination);
                                source.start(start);

                                nextStartTimeRef.current = start + buffer.duration;
                                sourcesRef.current.add(source);
                                source.onended = () => sourcesRef.current.delete(source);
                            }
                        } catch (e) {
                            console.error("Audio error", e);
                        }

                        // Tool Handling
                        if (message.toolCall) {
                            const fc = message.toolCall.functionCalls.find(f => f.name === 'reportGameResult');
                            if (fc) {
                                const args = fc.args as any;
                                setGameState(prev => ({
                                    ...prev,
                                    userGesture: args.userMove,
                                    aiGesture: args.aiMove,
                                    winner: args.winner,
                                    status: 'result'
                                }));
                                setCommentary(args.commentary);
                                setResultMessage(args.winner === 'user' ? "YOU WIN" : args.winner === 'ai' ? "YOU LOSE" : "DRAW");

                                if (args.winner === 'user') setPlayerScore(s => s + 1);
                                if (args.winner === 'ai') setAiScore(s => s + 1);

                                session.sendToolResponse({
                                    functionResponses: {
                                        name: fc.name,
                                        id: fc.id,
                                        response: { result: "ok" }
                                    }
                                });

                                setTimeout(() => {
                                    setResultMessage(null);
                                    setGameState(prev => ({ ...prev, status: 'playing', userGesture: 'unknown', aiGesture: 'unknown' }));
                                    setRound(r => r + 1);
                                }, 3000);
                            }
                        }
                    },
                    onclose: (event: any) => {
                        console.log("Close Event", event);
                        // Only show error if we weren't intending to close
                        if (streamRef.current) {
                            setCommentary("Link Lost. Reconnecting...");
                            setIsConnected(false);
                            // Optional: Auto-reconnect or just let user click
                        }
                    },
                    onerror: (err: any) => {
                        console.error("Session Error", err);
                        setError(`Protocol Error: ${err.message || "Unknown"}`);
                    }
                }
            });

            console.log("Session created", session);
            sessionRef.current = session;

        } catch (err: any) {
            console.error("Setup Error", err);
            setIsConnecting(false);
            setError(err.message || "Failed to connect");
            setCommentary("Connection Failed.");
        }
    };

    const startVideoStreaming = (stream: MediaStream) => {
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);

        frameIntervalRef.current = window.setInterval(() => {
            if (!sessionRef.current || !videoRef.current || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 320;
                canvas.height = 240;
                ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
                sessionRef.current.sendRealtimeInput({
                    media: { mimeType: 'image/jpeg', data: base64 }
                });
            }
        }, 100); // 10 FPS for better responsiveness
    };

    const startRound = () => {
        if (sessionRef.current) {
            sessionRef.current.sendRealtimeInput({ text: "Start Round" });
            setCommentary("Starting...");
        }
    };

    const handleInstructionsReady = () => {
        requestPermissions().then(() => {
            setHasName(true);
            connectToGemini();
        });
    };

    const requestPermissions = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setHasPermissions(true);
        } catch (e) {
            setError("Camera/Mic access denied");
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black">
            {/* Use full screen video background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanner Overlay - Makes it clear the AI is "watching" */}
                {isConnected && (
                    <div className="absolute inset-0 z-10">
                        {/* Scanning Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[scan_3s_ease-in-out_infinite]" />

                        {/* Vision Label */}
                        <div className="absolute top-40 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 px-4 py-1 rounded-full border border-cyan-500/30 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase">AI VISION FEED LIVE</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="absolute inset-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,black_90%)]"></div>

            {/* Error Display */}
            {error && (
                <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <div className="bg-destructive/80 text-white px-4 py-2 rounded-full border border-red-500 font-mono text-sm animate-in fade-in slide-in-from-top-4">
                        {error}
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {!hasPermissions && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-50 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="max-w-md w-full mx-4 border border-zinc-800 bg-zinc-950 rounded-xl p-8 flex flex-col gap-8 shadow-2xl">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-medium text-white">Allow this app to request access to:</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <div className="flex items-center gap-3">
                                    <Camera className="w-6 h-6 text-zinc-400" />
                                    <Label htmlFor="camera-toggle" className="text-lg text-zinc-200">Camera</Label>
                                </div>
                                <Switch
                                    id="camera-toggle"
                                    checked={permissionConfig.camera}
                                    onCheckedChange={(c) => setPermissionConfig(prev => ({ ...prev, camera: c }))}
                                />
                            </div>

                            <div className="flex items-center justify-between px-4">
                                <div className="flex items-center gap-3">
                                    <Mic className="w-6 h-6 text-zinc-400" />
                                    <Label htmlFor="mic-toggle" className="text-lg text-zinc-200">Microphone</Label>
                                </div>
                                <Switch
                                    id="mic-toggle"
                                    checked={permissionConfig.microphone}
                                    onCheckedChange={(c) => setPermissionConfig(prev => ({ ...prev, microphone: c }))}
                                />
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                className="w-full py-3 bg-[hsl(240,6%,10%)] text-white hover:bg-zinc-800 transition-colors rounded-full font-medium"
                                onClick={requestPermissions}
                            >
                                Allow
                            </button>
                            <p className="mt-4 text-xs text-zinc-500">
                                The app may not work properly without these permissions.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Name / Init */}
            {hasPermissions && !hasName && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="max-w-2xl w-full mx-4 border-2 border-[hsl(180,100%,50%)] shadow-[0_0_50px_rgba(0,255,255,0.2)] bg-black/80 rounded-xl p-8 flex flex-col items-center gap-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl md:text-5xl font-headline text-white neon-glow">COMBAT PROTOCOLS</h2>
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

            {/* Connecting State & Reconnect */}
            {hasPermissions && hasName && !isConnected && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center flex-col gap-4 z-20">
                    {isConnecting ? (
                        <div className="w-16 h-16 border-4 border-[hsl(180,100%,50%)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <button
                            onClick={connectToGemini}
                            className="flex items-center gap-2 px-8 py-4 bg-[hsl(180,100%,50%)] text-black font-mono font-bold rounded-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                        >
                            <RefreshCcw className="w-6 h-6" />
                            RE-ESTABLISH LINK
                        </button>
                    )}
                    <p className="text-[hsl(180,100%,50%)] font-mono text-center max-w-md">{commentary}</p>
                </div>
            )}

            {/* Main HUD */}
            {isConnected && (
                <div className="absolute inset-0 pt-24 md:pt-32 flex flex-col justify-between p-4 md:p-8">
                    {/* Status Bar (Ported from LiveGameUI) */}
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-6 bg-black/60 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                            <span className="text-xs font-mono uppercase text-white/50">{isConnected ? "ONLINE" : "OFFLINE"}</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-4">
                            {/* Vision Indicator */}
                            <div className="flex items-center gap-2" title="Vision Active">
                                <span className={cn("transition-all duration-500", isConnected ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" : "text-white/20")}>
                                    <Camera className="w-5 h-5" />
                                </span>
                                {isConnected && <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" />}
                            </div>
                            {/* Audio Output Indicator (Mic is input, but we use it for status) */}
                            <div className="flex items-center gap-2" title="Audio Link">
                                <span className={cn("transition-all duration-500", isConnected ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" : "text-white/20")}>
                                    <Mic className="w-5 h-5" />
                                </span>
                                {isConnected && <div className="w-1 h-1 bg-green-400 rounded-full animate-ping delay-75" />}
                            </div>
                        </div>
                    </div>

                    {/* Header: Scores */}
                    <div className="relative flex justify-between items-start gap-4 z-[60] mt-12">
                        <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow">
                            <User className="w-8 h-8 text-[hsl(180,100%,50%)]" />
                            <div className="flex-1 w-24">
                                <p className="font-mono text-[hsl(180,100%,50%)] truncate">{playerName}</p>
                                <p className="font-bold text-4xl digital-font text-white">{playerScore}</p>
                            </div>
                        </div>

                        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center pointer-events-auto cursor-pointer group" onClick={startRound}>
                            <div className="relative">
                                <div className={cn("digital-font text-7xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all",
                                    gameState.status === 'playing' && "group-hover:scale-110 group-hover:text-[hsl(180,100%,50%)]"

                                )}>
                                    {round}
                                </div>
                                {gameState.status === 'playing' && (
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[hsl(180,100%,50%)] animate-bounce font-mono text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4 fill-current" /> CLICK TO START
                                    </div>
                                )}
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
                                <div className={cn("text-[200px] leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] animate-bounce",
                                    gameState.aiGesture === 'rock' ? "text-red-500" :
                                        gameState.aiGesture === 'paper' ? "text-blue-500" : "text-purple-500"
                                )} style={{ textShadow: '0 0 50px currentColor' }}>
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

                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => setShowHelp(true)}
                                className="p-4 bg-black/50 neon-glow rounded-full text-white hover:bg-white/10"
                                title="How to Play"
                            >
                                <span className="font-mono font-bold text-lg">?</span>
                            </button>

                            <button onClick={() => setIsMuted(!isMuted)} className="p-4 bg-black/50 neon-glow rounded-full text-white hover:bg-white/10">
                                {isMuted ? <MicOff /> : <Mic />}
                            </button>

                            {/* Visual Start Button - Always visible when connected so user can start whenever */}
                            <button
                                onClick={startRound}
                                className="px-8 py-4 bg-[hsl(180,100%,50%)] text-black font-mono font-bold rounded-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] flex items-center gap-2"
                            >
                                <Play className="w-5 h-5" /> PLAY ROUND
                            </button>

                            <button onClick={stopAllMedia} className="p-4 bg-red-900/50 border-2 border-red-500 text-white rounded-full hover:bg-red-800">
                                <Square />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="max-w-md w-full mx-4 bg-zinc-950 border border-zinc-800 rounded-xl p-8 shadow-2xl space-y-6">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white font-mono mb-2">HOW TO PLAY</h3>
                            <p className="text-zinc-400">Interact with the AI using gestures and voice.</p>
                        </div>

                        <div className="space-y-4 font-mono text-sm text-zinc-300">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">1</div>
                                <p>Ensure <span className="text-white font-bold">Sound is ON</span>. The AI will speak to you.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">2</div>
                                <p>Click <span className="text-white font-bold">START ROUND</span> or ask the AI to play.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">3</div>
                                <p>Listen for "Ready? Rock, Paper, Scissors, <span className="text-red-400 font-bold">SHOOT!</span>"</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">4</div>
                                <p>Show your hand clearly to the camera at "SHOOT".</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowHelp(false)}
                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono transition-colors"
                        >
                            GOT IT
                        </button>
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
