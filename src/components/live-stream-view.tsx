"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GeminiLiveClient } from '@/lib/gemini-live-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, Mic, MicOff, Video, VideoOff, RefreshCw, AlertCircle, User, Bot, ScanFace } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RockIcon } from '@/components/icons/rock-icon';
import { PaperIcon } from '@/components/icons/paper-icon';
import { ScissorsIcon } from '@/components/icons/scissors-icon';
import { cn } from '@/lib/utils'; // Assuming utils exists

// Move Icons Map
const moveIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    ROCK: RockIcon,
    PAPER: PaperIcon,
    SCISSORS: ScissorsIcon,
};

// System Instruction for the AI
const SYSTEM_INSTRUCTION = `
You are the logic engine for a high-stakes Rock Paper Scissors match.
You see the user's video feed. Watch for their hand gesture.
The user will count down: "Three, Two, One, Shoot!".
AT THE MOMENT OF "SHOOT", analyze the frame.
1. Identify the user's move (Rock, Paper, or Scissors).
2. IMMEDIATELY call the "declare_match_result" tool.
3. Choose your own move to WIN or LOSE based on your whims or random chance, but be decisive.
4. Provide a witty, short, punchy commentary.
If you don't see a clear hand, say so in commentary but default to DRAW.
`;

export default function LiveStreamView() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [client, setClient] = useState<GeminiLiveClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Game State
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [round, setRound] = useState(1);

    // Game State from AI
    const [aiMove, setAiMove] = useState<string | null>(null);
    const [userMove, setUserMove] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [commentary, setCommentary] = useState<string>("Waiting for Link...");

    const { toast } = useToast();

    // Initialize Client
    useEffect(() => {
        setIsMounted(true);
        // Fetch API Key safely (In prod, use the Proxy Route, but here we likely need a key)
        // For Hackathon speed, we might rely on env var if client-side visible, OR better:
        // Use the proxy we will build next.
        // For now, let's assume we pass a placeholder or token.
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

        const newClient = new GeminiLiveClient({
            apiKey: apiKey,
            systemInstruction: SYSTEM_INSTRUCTION
        });

        newClient.on('connected', () => {
            setIsConnected(true);
            setCommentary("Neural Link Established. Ready.");
            toast({ title: "Connected to Gemini Live" });
        });

        newClient.on('disconnected', () => {
            setIsConnected(false);
            setCommentary("Link Lost.");
        });

        newClient.on('match_result', (data: any) => {
            // { user_move, ai_move, result, commentary }
            setUserMove(data.user_move);
            setAiMove(data.ai_move);
            setResult(data.result);
            setCommentary(data.commentary);

            // Update Scores
            if (data.result === 'WIN') {
                setPlayerScore(prev => prev + 1);
            } else if (data.result === 'LOSE') {
                setAiScore(prev => prev + 1);
            }

            // Auto-reset after 3 seconds
            setTimeout(() => {
                setAiMove(null);
                setUserMove(null);
                setResult(null);
                setCommentary("Ready.");
                setRound(prev => prev + 1);
            }, 3000);
        });

        newClient.on('audio', (base64Audio: string) => {
            // Play Audio chunk
            const audio = new Audio("data:audio/pcm;base64," + base64Audio); // Note: Simple PCM playback might need decoding logic
            // Or use header-less wav container trick.
            // For now, let's assume the client handles basic playback or we ignore audio for MVP.
        });

        setClient(newClient);

        return () => {
            newClient.disconnect();
        };
    }, [toast]);

    const connect = () => {
        client?.connect();
    };

    const disconnect = () => {
        client?.disconnect();
    };

    // Capture & Stream Loop
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const startStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 },
                    audio: true
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setHasPermission(true);

                // Start Frame Pump
                intervalId = setInterval(() => {
                    if (isConnected && client && videoRef.current && canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                            // Low quality JPEG for speed
                            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                            client.sendVideoChunk(base64);
                        }
                    }
                }, 100); // 10 FPS

            } catch (err) {
                console.error("Media Error", err);
                setHasPermission(false);
            }
        };

        if (isMounted) {
            startStream();
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [isMounted, isConnected, client]);

    // Render
    return (
        <div className="fixed inset-0 bg-black text-white font-mono">
            {/* Video Background */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-50"
            />
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />

            {/* HUD Layer */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8">

                {/* TOP HEADER: SCORES */}
                <div className="flex justify-between items-start">

                    {/* PLAYER SCORE */}
                    <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg border border-cyan-500/30">
                        <User className="w-8 h-8 text-cyan-400" />
                        <div className="flex-1 w-24">
                            <p className="font-bold text-cyan-400 truncate">PLAYER</p>
                            <p className="font-bold text-4xl text-white">{playerScore}</p>
                        </div>
                    </div>

                    {/* ROUND COUNTER (Center) */}
                    <div className="flex flex-col items-center">
                        <div className="text-6xl font-black text-white/20">
                            {round}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={cn("w-3 h-3 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                            <span className="text-xs uppercase tracking-widest text-white/60">{isConnected ? "ONLINE" : "OFFLINE"}</span>
                        </div>
                    </div>

                    {/* AI SCORE */}
                    <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg border border-purple-500/30">
                        <div className="flex-1 text-right w-24">
                            <p className="font-bold text-purple-400 truncate">HIVE</p>
                            <p className="font-bold text-4xl text-white">{aiScore}</p>
                        </div>
                        <Bot className="w-8 h-8 text-purple-400" />
                    </div>
                </div>

                {/* Massive Result Overlay */}
                {aiMove && (
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                        <div className="animate-in zoom-in-0 duration-300 flex flex-col items-center">
                            <div className={cn("text-[200px] drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] leading-none",
                                aiMove === 'ROCK' ? "text-red-500" :
                                    aiMove === 'PAPER' ? "text-blue-500" : "text-purple-500"
                            )}>
                                {aiMove === 'ROCK' && "✊"}
                                {aiMove === 'PAPER' && "✋"}
                                {aiMove === 'SCISSORS' && "✌️"}
                            </div>
                            <h2 className="text-6xl font-black uppercase mt-4 text-white drop-shadow-lg">{result}</h2>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="pointer-events-auto flex flex-col items-center gap-4">
                    <div className="bg-black/80 px-6 py-3 rounded-full border border-cyan-500/50">
                        <p className="text-cyan-400 text-lg typewriter">{commentary}</p>
                    </div>

                    <div className="flex gap-4">
                        {!isConnected ? (
                            <Button onClick={connect} className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-xl font-bold">
                                CONNECT TO HIVE MIND
                            </Button>
                        ) : (
                            <Button onClick={disconnect} variant="destructive" className="px-8 py-6 text-xl font-bold">
                                DISCONNECT
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
