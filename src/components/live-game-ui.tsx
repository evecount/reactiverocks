"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Bot, Loader, User, Send, Mic, MicOff, AlertCircle, Trophy, HomeIcon, ScanFace, Pause, Play, Plus, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { CircularProgress } from './ui/progress';
import { GeminiLiveClient } from '@/lib/gemini-live-client';

// Icons need to be mocked or imported if they exist. 
// Assuming they exist from previous file read.
import { RockIcon } from '@/components/icons/rock-icon';
import { PaperIcon } from '@/components/icons/paper-icon';
import { ScissorsIcon } from '@/components/icons/scissors-icon';

type Move = 'rock' | 'paper' | 'scissors' | 'none';
type GameState = 'idle' | 'starting' | 'instructions' | 'playing' | 'ending';

const DEFAULT_ROUND_TIME = 3;

// Emojis for AI as requested
const moveIcons: Record<string, string> = {
    ROCK: "✊",
    PAPER: "✋",
    SCISSORS: "✌️",
};

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

export default function LiveGameUI() {
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [round, setRound] = useState(1);
    const [commentary, setCommentary] = useState("Initializing Neural Link...");
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [hasName, setHasName] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isMuted, setIsMuted] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [countdown, setCountdown] = useState(DEFAULT_ROUND_TIME);

    // Client State
    const [client, setClient] = useState<GeminiLiveClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [aiMove, setAiMove] = useState<string | null>(null); // AI choice
    const [result, setResult] = useState<string | null>(null);

    const [roundDuration, setRoundDuration] = useState(DEFAULT_ROUND_TIME);
    const [isPaused, setIsPaused] = useState(false);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [isMounted, setIsMounted] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Play Audio Helper
    const playText = useCallback(async (text: string) => {
        // For now, rely on Gemini's audio output or browser TTS if needed.
        // But preserving the hook structure.
        if (isMuted) return;
        // Simple Browser TTS fallback for countdowns
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }, [isMuted]);


    // Initialize Gemini Client
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

        const newClient = new GeminiLiveClient({
            apiKey: apiKey,
            systemInstruction: SYSTEM_INSTRUCTION
        });

        newClient.on('connected', () => {
            setIsConnected(true);
            setCommentary("Neural Link Established. Ready.");
            toast({ title: "Connected to Hive Mind" });
        });

        newClient.on('disconnected', () => {
            setIsConnected(false);
            setCommentary("Link Lost.");
        });

        newClient.on('error', (err) => {
            console.error(err);
            setCommentary("Connection Error.");
        });

        newClient.on('match_result', (data: any) => {
            // { user_move, ai_move, result, commentary }
            setAiMove(data.ai_move);
            setResult(data.result);
            setCommentary(data.commentary);
            setResultMessage(data.result === 'WIN' ? "YOU WIN" : data.result === 'LOSE' ? "YOU LOSE" : "DRAW");

            // Update Scores
            if (data.result === 'WIN') setPlayerScore(s => s + 1);
            if (data.result === 'LOSE') setAiScore(s => s + 1);

            setGameState('ending');

            // Auto-reset
            setTimeout(() => {
                setAiMove(null);
                setResult(null);
                setResultMessage(null);
                setRound(r => r + 1);
                setGameState('playing');
                setCountdown(roundDuration); // Reset countdown
                setCommentary("Next Round...");
            }, 3000);
        });

        setClient(newClient);

        return () => newClient.disconnect();
    }, [toast, roundDuration]);

    // Connect/Disconnect
    const toggleConnection = () => {
        if (isConnected) client?.disconnect();
        else client?.connect();
    };

    // Video Stream Logic
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
                setHasCameraPermission(true);

                // Pump Frames
                intervalId = setInterval(() => {
                    if (isConnected && client && videoRef.current && canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                            // Moderate quality for balance
                            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
                            client.sendVideoChunk(base64);
                        }
                    }
                }, 100); // 10 FPS
            } catch (err) {
                console.error("Media Error", err);
                setHasCameraPermission(false);
            }
        };

        if (isMounted) startStream();
        return () => clearInterval(intervalId);
    }, [isMounted, isConnected, client]);


    // Timer Logic (Visual Only - Logic driven by AI reaction, but we need to prompt user)
    const lastSpokenRef = useRef<number | null>(null);

    useEffect(() => {
        if (gameState === 'playing' && !isPaused && !resultMessage) {
            // Decrement
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 0) return 0; // Stay at 0
                    return prev - 0.1; // Smooth decrement
                });
            }, 100);
            return () => clearInterval(timer);
        }
    }, [gameState, isPaused, resultMessage]);

    useEffect(() => {
        if (gameState === 'playing' && !isPaused && !resultMessage) {
            const ceiled = Math.ceil(countdown);
            if (ceiled <= 3 && ceiled > 0 && lastSpokenRef.current !== ceiled) {
                playText(ceiled.toString());
                lastSpokenRef.current = ceiled;
            } else if (countdown <= 0.1 && lastSpokenRef.current !== 0) {
                playText("Shoot!");
                lastSpokenRef.current = 0;
            }
        }
        // Reset ref on reset
        if (countdown > 3) lastSpokenRef.current = null;
    }, [countdown, gameState, isPaused, resultMessage, playText]);


    // Form Handling
    const handleNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (playerName.trim()) {
            setHasName(true);
            setGameState('instructions');
            playText("Welcome.");
        }
    };

    const handleInstructionsReady = () => {
        setGameState('playing');
        setCountdown(roundDuration);
        if (!isConnected) client?.connect(); // Auto-connect
    };

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 w-full h-full bg-black pt-14 text-white">
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                ></video>
                <canvas
                    ref={canvasRef}
                    className="hidden" // Hidden canvas for processing
                    width="640"
                    height="480"
                />
            </div>
            <div className="absolute inset-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,black_80%)]"></div>

            {/* Permissions Alert */}
            {!hasCameraPermission && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <Alert variant="destructive" className="max-w-md neon-glow">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            <Button onClick={() => window.location.reload()} className="mt-4 w-full">Retry</Button>
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Instructions */}
            {gameState === 'instructions' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 backdrop-blur-sm animate-in fade-in">
                    <Card className="max-w-2xl w-full bg-black/80 border-primary shadow-lg p-8 neon-glow">
                        <h2 className="text-4xl text-center font-bold text-primary mb-8">LIVE PROTOCOLS</h2>
                        <div className="text-center space-y-4">
                            <p>1. Ensure you are connected.</p>
                            <p>2. Keep your hand visible.</p>
                            <p>3. Wait for "SHOOT!".</p>
                            <Button size="lg" className="w-full text-xl mt-8" onClick={handleInstructionsReady}>
                                CONNECT TO HIVE MIND
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Main HUD */}
            <div className="absolute inset-0 pt-20 flex flex-col justify-between p-4 md:p-8">

                {/* Status Bar */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 bg-black/50 px-4 py-1 rounded-full backdrop-blur-md border border-white/10">
                    <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className="text-xs font-mono uppercase text-white/70">{isConnected ? "LIVE SIGNAL" : "OFFLINE"}</span>
                </div>

                {/* Scoreboard and Timer */}
                <div className="relative flex justify-between items-start gap-4 z-[60]">
                    {/* Player */}
                    <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow border border-primary/30">
                        <User className="w-8 h-8 text-primary" />
                        <div>
                            <p className="font-bold text-primary">PLAYER</p>
                            <p className="font-bold text-4xl">{playerScore}</p>
                        </div>
                    </div>

                    {/* Timer Logic */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            {gameState === 'playing' ? (
                                <CircularProgress value={Math.max(0, countdown)} max={roundDuration} className="absolute inset-0" />
                            ) : null}
                            <div className="text-6xl font-black digital-font">
                                {Math.ceil(countdown)}
                            </div>
                        </div>
                        <p className="text-white/50 text-xs tracking-widest mt-2">{resultMessage || "ROUND " + round}</p>
                    </div>

                    {/* Hive */}
                    <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow border border-accent/30">
                        <div className="text-right">
                            <p className="font-bold text-accent">HIVE</p>
                            <p className="font-bold text-4xl">{aiScore}</p>
                        </div>
                        <Bot className="w-8 h-8 text-accent" />
                    </div>
                </div>

                {/* Center Stage: AI Move Reveal */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[50]">
                    {aiMove && resultMessage && (
                        <div className="animate-in zoom-in-0 duration-300 flex flex-col items-center">
                            {/* Background Burst */}
                            <div className={cn("absolute inset-0 blur-[100px] opacity-40 rounded-full w-96 h-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                                aiMove === 'ROCK' ? "bg-red-500" : aiMove === 'PAPER' ? "bg-blue-500" : "bg-purple-500"
                            )} />

                            <div className={cn("text-[200px] leading-none drop-shadow-[0_0_50px_rgba(255,255,255,1)]",
                                aiMove === 'ROCK' ? "text-red-500" : aiMove === 'PAPER' ? "text-blue-500" : "text-purple-500"
                            )}>
                                {moveIcons[aiMove] || aiMove}
                            </div>
                        </div>
                    )}
                </div>

                {/* Commentary Footer */}
                <div className="relative w-full max-w-2xl mx-auto">
                    <Card className="bg-black/60 backdrop-blur-md border border-white/10">
                        <CardContent className="p-4 flex items-center gap-4">
                            {isPending ? <Loader className="animate-spin text-primary" /> : <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                            <p className="font-mono text-primary text-lg truncate w-full">{commentary}</p>

                            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Name Input Overlay */}
                {!hasName && (
                    <div className="absolute inset-0 bg-black/90 z-[80] flex items-center justify-center p-4">
                        <form onSubmit={handleNameSubmit} className="flex flex-col gap-4 w-full max-w-md text-center">
                            <h1 className="text-4xl font-bold text-primary mb-4 neon-glow">IDENTIFY YOURSELF</h1>
                            <Input
                                value={playerName} onChange={e => setPlayerName(e.target.value)}
                                className="bg-black border-primary text-center text-2xl h-16 neon-glow"
                                placeholder="CODENAME"
                            />
                            <Button type="submit" size="lg" className="w-full h-16 text-xl">ENTER DOJO</Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
