"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Bot, Loader, User, Send, Mic, MicOff, AlertCircle, Trophy, HomeIcon, ScanFace, Volume2, Pause, Play, Plus, Minus, Settings2, RefreshCw } from 'lucide-react';
import { runLiveRpsSession } from '@/ai/flows/live-rps-session';
import { speak } from '@/ai/flows/speak';
import type { LiveRpsSessionOutput } from '@/ai/flows/live-rps-session';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaperIcon } from '@/components/icons/paper-icon';
import { RockIcon } from '@/components/icons/rock-icon';
import { ScissorsIcon } from '@/components/icons/scissors-icon';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { CircularProgress } from './ui/progress';
import { useReactiveLoop } from '@/hooks/use-reactive-loop';
import { detectGesture } from '@/lib/gesture-detector';

type Move = 'rock' | 'paper' | 'scissors' | 'none'; // loosen type for debug
type GameState = 'idle' | 'starting' | 'instructions' | 'playing' | 'ending';

const DEFAULT_ROUND_TIME = 3;

const moveIcons: Record<Move, React.ComponentType<{ className?: string }>> = {
  rock: RockIcon,
  paper: PaperIcon,
  scissors: ScissorsIcon,
};

export default function GameUI() {
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerChoice, setPlayerChoice] = useState<Move | null>(null);
  const [aiChoice, setAiChoice] = useState<Move | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [round, setRound] = useState(0);
  const [commentary, setCommentary] = useState("");
  const [fluidityScore, setFluidityScore] = useState<number | null>(null);
  const [fluidityCommentary, setFluidityCommentary] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [hasName, setHasName] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isMuted, setIsMuted] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [countdown, setCountdown] = useState(DEFAULT_ROUND_TIME);
  const [lastDetectedMove, setLastDetectedMove] = useState<string | null>(null);
  const [lastMoveConfidence, setLastMoveConfidence] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState(false);

  const [roundDuration, setRoundDuration] = useState(DEFAULT_ROUND_TIME);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoveRef = useRef<Move | null>(null);

  const playAudio = useCallback((audioDataUri: string) => {
    if (audioRef.current && !isMuted) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [isMuted]);

  const playText = useCallback(async (text: string) => {
    if (isMuted) return;
    try {
      const audioData = await speak(text);
      if (audioData) {
        if (audioRef.current) {
          audioRef.current.src = audioData;
          await audioRef.current.play();
        }
      } else {
        // Fallback to Browser TTS if AI voice fails (Guarantee Audio)
        console.warn("AI Voice failed, falling back to browser TTS");
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("TTS failed for text:", text, e);
      // Ultimate Fallback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [isMuted, playAudio]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(roundDuration);
  }, [roundDuration]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Stay at 0 to trigger useEffect, but don't do side effects here
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);



  const handlePlay = useCallback(async (move: Move) => {
    if (gameState !== 'playing' || isPending || resultMessage || move === 'none') return;

    resetTimer();
    const startTime = Date.now();

    startTransition(async () => {
      // Adaptive Speed Logic: If player matches quickly (top half of the timer), speed up!
      const timeTaken = roundDuration - countdown;
      const isFast = timeTaken < (roundDuration / 2);

      if (isFast && roundDuration > 2) {
        setRoundDuration(prev => Math.max(2, prev - 1));
        setFluidityCommentary("Speeding up!");
      }

      setPlayerChoice(move);
      setAiChoice(null);
      setResult(null);
      setFluidityScore(null);
      setCommentary("Analyzing...")


      try {
        const response: LiveRpsSessionOutput | undefined = await runLiveRpsSession({
          userName: playerName,
          event: "USER_MOVE",
          playerMove: move,
          fluidityScore: fluidityScore ?? undefined,
        });

        if (response) {
          const endTime = Date.now();
          const currentFluidity = endTime - startTime;
          setFluidityScore(currentFluidity);
          setAiChoice(response.aiMove || null);
          setResult(response.gameResult || null);
          setCommentary(response.commentaryText);
          if (response.audio) playAudio(response.audio);

          if (response.gameResult === 'win') {
            setPlayerScore(s => s + 1);
            setResultMessage("YOU WIN");
            playText("You Win");
          } else if (response.gameResult === 'lose') {
            setAiScore(s => s + 1);
            setResultMessage("YOU LOSE");
            playText("You Lose");
          } else {
            setResultMessage("DRAW");
            playText("Draw");
          }

          if (currentFluidity < 150) {
            setFluidityCommentary("Excellent Sync!");
          } else if (currentFluidity < 300) {
            setFluidityCommentary("Good timing.");
          } else {
            setFluidityCommentary("Out of sync.");
          }
        }
      } catch (error) {
        console.error("Error during AI gameplay:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "An error occurred while communicating with the AI.",
        });
        setCommentary("Connection error. Please try again.");
      }
    });
  }, [gameState, isPending, playerName, fluidityScore, toast, playAudio, resetTimer, resultMessage, playText]);

  const onGesture = useCallback((keypoints: any, gesture?: string, confidence?: number) => {
    if (!keypoints || isPending || resultMessage) return;

    if (gesture) {
      setLastDetectedMove(gesture);
      setLastMoveConfidence(confidence || 0);
    }

    if (gesture && gesture !== 'none' && gesture !== 'Moving Up' && gesture !== 'Moving Down' && gesture !== 'Static' && gesture !== 'Unknown' && gesture !== lastMoveRef.current) {
      // Only trigger play on actual game moves (rock/paper/scissors) - logic to be refined for "Rhythm" later
      // For now, we mainly use this for visual feedback as per user request
      lastMoveRef.current = gesture;
      handlePlay(gesture as Move);
    }
  }, [isPending, resultMessage, handlePlay]);

  useReactiveLoop(videoRef, onGesture, setIsDetecting, hasCameraPermission && gameState === 'playing' && !isPaused);


  // Audio Cue for First Detection
  const hasSpokenDetectionRef = useRef(false);

  useEffect(() => {
    if (isDetecting && lastDetectedMove && lastDetectedMove !== "None" && !hasSpokenDetectionRef.current) {
      playText("I see you, player!");
      hasSpokenDetectionRef.current = true;
    }
  }, [isDetecting, lastDetectedMove, playText]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  useEffect(() => {
    if (!hasName) {
      setCommentary("Welcome, Sparring Partner. What should I call you?");
    }
  }, [hasName]);

  useEffect(() => {
    if (gameState === 'playing' && !resultMessage && !isPaused && isDetecting) {
      startTimer();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (gameState !== 'playing' || resultMessage) {
        resetTimer();
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, resultMessage, startTimer, resetTimer, isPaused, isDetecting]);


  useEffect(() => {
    if (countdown === 0 && gameState === 'playing' && !isPending && !resultMessage && !isPaused) {
      // "Wait" behavior as requested: Pause instead of Lose
      setIsPaused(true);
      playText("Time out. I will wait.");
      setCountdown(roundDuration); // Reset for next start
      setCommentary("Waiting... Hit Play when ready.");
    }
  }, [countdown, gameState, isPending, resultMessage, isPaused, playText, roundDuration]);


  useEffect(() => {
    if (resultMessage) {
      resetTimer();
      const timer = setTimeout(() => {
        setResultMessage(null);
        setPlayerChoice(null);
        setAiChoice(null);
        setResult(null);
        if (gameState === 'playing') {
          setRound(r => r + 1);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resultMessage, gameState, resetTimer]);

  const handleNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (playerName.trim() && !isPending) {
      setHasName(true);
      setGameState('instructions'); // Go to instructions first
      playText(`Welcome, ${playerName}. Prepare yourself.`);

      // We can preload the session here if we want, but let's wait for READY
    }
  };

  const handleInstructionsReady = () => {
    setGameState('starting');
    playText("Initiating neural link. Good luck.");
    startTransition(async () => {
      try {
        const response = await runLiveRpsSession({
          userName: playerName,
          event: "GAME_START"
        });
        if (response) {
          setCommentary(response.commentaryText);
          if (response.audio) playAudio(response.audio);
        }
        setGameState('playing');
        setRound(1);
      } catch (error) {
        console.error("Error starting session:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not start the session.",
        });
        setHasName(false);
        setGameState('idle');
      }
    });
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  }

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-black pt-14">
      <audio ref={audioRef} className="hidden" />
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-[0.07] crt-flicker"
      ></video>
      <div className="absolute inset-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,black_70%)]"></div>


      {!hasCameraPermission && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <Alert variant="destructive" className="max-w-md neon-glow">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>Please allow camera access to use this feature.</p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-black hover:bg-primary/80 font-bold"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retry Camera
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {hasName && !isDetecting && gameState === 'playing' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center flex-col gap-4 z-20">
          <Loader className="w-16 h-16 animate-spin text-primary" />
          <p className="text-primary font-headline">Loading Vision Core...</p>
        </div>
      )}

      {/* Instructions Overlay */}
      {gameState === 'instructions' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 backdrop-blur-sm animate-in fade-in duration-500">
          <Card className="max-w-2xl w-full mx-4 border-2 border-primary shadow-[0_0_50px_rgba(0,255,100,0.2)] bg-black/80">
            <CardContent className="flex flex-col items-center p-8 gap-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl md:text-5xl font-headline text-white neon-glow">COMBAT PROTOCOLS</h2>
                <p className="text-xl text-primary font-code">USER: {playerName.toUpperCase()}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center">
                <div className="flex flex-col items-center gap-2 p-4 border border-white/10 rounded-lg hover:border-primary/50 transition-colors">
                  <RockIcon className="w-16 h-16 text-white" />
                  <p className="text-primary font-bold">ROCK</p>
                  <p className="text-xs text-muted-foreground">Crushes Scissors</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 border border-white/10 rounded-lg hover:border-primary/50 transition-colors">
                  <PaperIcon className="w-16 h-16 text-white" />
                  <p className="text-primary font-bold">PAPER</p>
                  <p className="text-xs text-muted-foreground">Covers Rock</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 border border-white/10 rounded-lg hover:border-primary/50 transition-colors">
                  <ScissorsIcon className="w-16 h-16 text-white" />
                  <p className="text-primary font-bold">SCISSORS</p>
                  <p className="text-xs text-muted-foreground">Cuts Paper</p>
                </div>
              </div>

              <div className="space-y-4 text-center max-w-lg">
                <p className="text-white/80">
                  1. Show your hand clearly to the camera.<br />
                  2. Move on the countdown.<br />
                  3. Use <span className="text-primary">Spacebar</span> or the sidebar to Pause.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full text-xl py-8 font-headline tracking-widest bg-primary text-black hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,255,100,0.4)]"
                onClick={handleInstructionsReady}
              >
                INITIATE LINK
              </Button>
            </CardContent>
          </Card>
        </div>
      )}


      <div className="absolute inset-0 pt-36 md:pt-40 flex flex-col justify-between p-4 md:p-8">
        {/* Header: Scores and Timer */}
        {/* Vision Status Indicator - Explicit for User - MOVED TO TOP */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[70] pointer-events-none transition-all duration-300">
          {isDetecting ? (
            (lastDetectedMove && lastDetectedMove !== "None") ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/80 text-black font-bold rounded-full shadow-[0_0_20px_rgba(0,255,0,0.5)] animate-pulse">
                <ScanFace className="w-5 h-5" />
                <span>I SEE YOUR HAND: {lastDetectedMove.toUpperCase()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/80 text-white font-bold rounded-full shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                <ScanFace className="w-5 h-5" />
                <span>CANNOT SEE HAND</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/80 text-black font-bold rounded-full">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>STARTING VISION...</span>
            </div>
          )}
        </div>

        <div className="relative flex justify-between items-start gap-4 z-[60]">
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow">
            <User className="w-8 h-8 text-primary" />
            <div className="flex-1 w-24">
              <p className="font-headline text-primary truncate">{playerName || 'Player'}</p>
              <p className="font-bold text-4xl digital-font text-white">{playerScore}</p>
            </div>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center flex flex-col items-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {gameState === 'playing' && (
                <CircularProgress value={countdown} max={roundDuration} className="absolute inset-0" />
              )}
              <div className="digital-font text-7xl font-bold text-white">
                {round > 0 ? round : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow">
            <div className="flex-1 text-right w-24">
              <p className="font-headline text-accent truncate">QUIP</p>
              <p className="font-bold text-4xl digital-font text-white">{aiScore}</p>
            </div>
            <Bot className="w-8 h-8 text-accent" />
          </div>
        </div>

        {/* AI and Player Move Display */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-between items-center px-4 md:px-16 pointer-events-none">
          <div className="w-32 h-32 flex items-center justify-center">
            {playerChoice && React.createElement(moveIcons[playerChoice], {
              className: 'w-24 h-24 md:w-32 md:h-32 text-primary drop-shadow-[0_0_20px_hsl(var(--primary))] transition-all duration-300 animate-in fade-in zoom-in-50',
            })}
          </div>

          <div className="w-40 h-40 flex items-center justify-center">
            {isPending && !aiChoice && gameState === 'playing' ? (
              <Loader className="w-24 h-24 animate-spin text-white" />
            ) : aiChoice ? (
              React.createElement(moveIcons[aiChoice], {
                className: 'w-40 h-40 text-accent drop-shadow-[0_0_20px_hsl(var(--accent))] transition-all duration-300 animate-in fade-in zoom-in-50',
              })
            ) : null}
          </div>
        </div>

        {/* Footer: Controls and Commentary */}
        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
          <Card className="bg-card backdrop-blur-sm w-full neon-glow">
            <CardContent className="relative p-0 text-sm font-code">
              {hasName && fluidityScore !== null ? (
                <div className="flex justify-between items-center p-3">
                  <p>
                    <span className="text-muted-foreground">Fluidity: </span>
                    <span className="text-secondary font-bold digital-font">{fluidityScore.toFixed(0)}ms</span>
                  </p>
                  <p className="text-right">
                    <span className="text-muted-foreground">Sync: </span>
                    <span>{fluidityCommentary}</span>
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground h-[34px] flex items-center justify-center p-3">
                  {hasName ? 'Awaiting round completion...' : ''}
                </div>
              )}
              <Separator className="my-0 bg-border/50" />
              <div className="text-foreground/90 h-16 flex items-center bg-black/40 overflow-hidden relative">
                <style jsx>{`
                  @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                  }
                  .animate-marquee {
                    animation: marquee 15s linear infinite;
                    white-space: nowrap;
                  }
                `}</style>
                {isPending && commentary === 'Analyzing...' ?
                  <div className="w-full flex justify-center"><Loader className="w-5 h-5 animate-spin" /></div> :
                  <div className="w-full overflow-hidden">
                    <div className="animate-marquee text-2xl md:text-3xl font-code tracking-widest text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)] uppercase px-4 inline-block">
                      {commentary || "WAITING FOR SIGNAL... WAITING FOR SIGNAL... WAITING FOR SIGNAL..."}
                    </div>
                  </div>
                }
              </div>
              <Button variant="ghost" size="icon" onClick={toggleMute} className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 rounded-full h-10 w-10">
                {isMuted ? <MicOff /> : <Mic />}
              </Button>
            </CardContent>
          </Card>



          <div className="w-full flex justify-between items-center gap-4">
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-primary/20 neon-glow bg-black/50 w-12 h-12">
                <HomeIcon />
              </Button>
            </Link>

            <div className='flex-1'>
              {!hasName ? (
                <form onSubmit={handleNameSubmit} className="flex gap-2 w-full">
                  <Input
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="Enter your name to begin..."
                    className="font-code bg-black/50 neon-glow border-none text-lg text-center flex-1"
                    disabled={isPending || !hasCameraPermission}
                  />
                  <Button type="submit" size="icon" className="neon-glow border-none w-12 h-12 bg-accent/80 hover:bg-accent" disabled={!playerName.trim() || isPending || !hasCameraPermission}>
                    {isPending ? <Loader className="animate-spin" /> : <Send />}
                  </Button>
                </form>
              ) : (
                <div className="h-12" />
              )}
            </div>

            {/* Vision Status Indicator - Explicit for User */}


            {/* Controls: Vertical Sidebar on Right (Fixed Position) */}
            <div className="fixed top-1/2 right-4 -translate-y-1/2 flex flex-col items-center gap-6 bg-black/80 rounded-full py-6 px-2 border border-primary/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[90] backdrop-blur-md">
              {/* Pause/Play */}
              <Button
                variant={isPaused ? "destructive" : "secondary"}
                size="icon"
                className="h-14 w-14 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] border-2 border-white/10 hover:scale-105 transition-transform"
                onClick={() => {
                  if (isPaused) {
                    setIsPaused(false);
                    setCountdown(roundDuration);
                    playText("Resuming");
                  } else {
                    setIsPaused(true);
                    playText("Paused");
                  }
                }}
              >
                {isPaused ? <Play className="w-8 h-8 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
              </Button>

              <Separator className="w-8 bg-white/10" />

              {/* Speed Controls */}
              <div className="flex flex-col items-center gap-3">
                <Button
                  variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/20 hover:text-primary"
                  onClick={() => setRoundDuration(prev => Math.min(10, prev + 1))}
                >
                  <Plus className="w-6 h-6" />
                </Button>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-primary font-bold text-2xl leading-none digital-font">{roundDuration}</span>
                  <span className="text-[9px] text-muted-foreground font-code leading-none tracking-widest">SEC</span>
                </div>
                <Button
                  variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/20 hover:text-primary"
                  onClick={() => setRoundDuration(prev => Math.max(1, prev - 1))}
                >
                  <Minus className="w-6 h-6" />
                </Button>
              </div>
            </div>

            <div className='flex justify-end items-center'>
              <Link href="/leaderboard" passHref>
                <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-primary/20 neon-glow bg-black/50 w-12 h-12">
                  <Trophy />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Game Controls */}


      </div>

      {resultMessage && (
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-10 text-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"></div>
          <h2 className={cn("text-8xl font-bold font-headline animate-in fade-in zoom-in-50",
            result === 'win' && 'text-primary',
            result === 'lose' && 'text-destructive',
            resultMessage === 'TIMEOUT' && 'text-destructive',
            result === 'draw' && 'text-muted-foreground'
          )}>
            {resultMessage}
          </h2>
        </div>
      )}
    </div>
  );
}

