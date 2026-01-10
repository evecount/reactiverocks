
"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Bot, Loader, User, Send, Square, Mic, MicOff, AlertCircle, Trophy, HomeIcon } from 'lucide-react';
import { liveRpsSession } from '@/ai/flows/live-rps-session';
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

type Move = 'rock' | 'paper' | 'scissors';
type GameState = 'idle' | 'starting' | 'playing' | 'ending';

const moves: Move[] = ['rock', 'paper', 'scissors'];

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

  const [gameState, setGameState] = useState<GameState>('idle');
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function getCameraPermission() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (err) {
          console.error("Error accessing webcam:", err);
          setHasCameraPermission(false);
        }
      } else {
        setHasCameraPermission(false);
      }
    }
    getCameraPermission();
  }, []);

  useEffect(() => {
    if (!hasName) {
      setCommentary("Welcome, Sparring Partner. What should I call you?");
    }
  }, [hasName]);

  const playAudio = useCallback((audioDataUri: string) => {
    if (audioRef.current && !isMuted) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [isMuted]);

  useEffect(() => {
    if (resultMessage) {
      const timer = setTimeout(() => {
        setResultMessage(null);
        // Also reset choices for next round visual clarity
        setPlayerChoice(null);
        setAiChoice(null);
        setResult(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [resultMessage]);

  const handleNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (playerName.trim() && !isPending) {
      setHasName(true);
      setGameState('starting');
      startTransition(async () => {
        try {
          const response = await liveRpsSession({
            userName: playerName,
            event: "GAME_START"
          });
          if (response) {
            setCommentary(response.commentaryText);
            if (response.audio) playAudio(response.audio);
          }
          setGameState('playing');
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
    }
  };

  const handleEndSession = () => {
    setGameState('ending');
    liveRpsSession({ userName: playerName, event: "GAME_END" }).then(response => {
        if(response) {
            setCommentary(response.commentaryText);
            if (response.audio) playAudio(response.audio);
        }
    });

    setTimeout(() => {
      setGameState('idle');
      setPlayerScore(0);
      setAiScore(0);
      setRound(0);
      setFluidityScore(null);
      setFluidityCommentary('');
      setHasName(false);
      setPlayerName('');
      setPlayerChoice(null);
      setAiChoice(null);
      setResult(null);
    }, 3000); // give time for final message
  };

  const handlePlay = useCallback(async (move: Move) => {
    if (gameState !== 'playing' || isPending) return;

    const startTime = Date.now();
    startTransition(async () => {
      setPlayerChoice(move);
      setAiChoice(null); // Reset AI choice visuals
      setResult(null);
      setFluidityScore(null);
      setCommentary("Analyzing...")
      setRound(r => r + 1);

      try {
        const response: LiveRpsSessionOutput | undefined = await liveRpsSession({
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
          } else if (response.gameResult === 'lose') {
            setAiScore(s => s + 1);
            setResultMessage("YOU LOSE");
          } else {
            setResultMessage("DRAW");
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
  }, [gameState, isPending, playerName, fluidityScore, toast, playAudio]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if(audioRef.current) {
        audioRef.current.muted = nextMuted;
    }
  }

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
      <div className="absolute inset-0 w-full h-full pointer-events-none" style={{background: 'radial-gradient(ellipse at center, transparent 30%, black 100%)'}}></div>


      {!hasCameraPermission && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <Alert variant="destructive" className="max-w-md neon-glow">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to play.
              </AlertDescription>
            </Alert>
        </div>
      )}

      <div className="absolute inset-0 pt-14 flex flex-col justify-between p-4 md:p-8">
        {/* Header: Scores and Timer */}
        <div className="relative flex justify-between items-start gap-4">
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow">
            <User className="w-8 h-8 text-primary" />
            <div className="flex-1 w-24">
              <p className="font-headline text-primary truncate">{playerName || 'Player'}</p>
              <p className="font-bold text-4xl digital-font text-white">{playerScore}</p>
            </div>
          </div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center">
            <div className="digital-font text-7xl font-bold text-white">
                {round}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white mt-2 bg-black/30 hover:bg-black/50 rounded-full">
                {isMuted ? <MicOff /> : <Mic />}
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg neon-glow">
             <div className="flex-1 text-right w-24">
              <p className="font-headline text-accent truncate">QUINCE</p>
              <p className="font-bold text-4xl digital-font text-white">{aiScore}</p>
            </div>
            <Bot className="w-8 h-8 text-accent" />
          </div>
        </div>

        {/* AI and Player Move Display */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-between items-center px-4 md:px-16">
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
        <div className="relative flex flex-col gap-4 items-center">
            <Card className="bg-card backdrop-blur-sm w-full max-w-2xl neon-glow">
                <CardContent className="p-3 text-sm font-code">
                    {hasName && fluidityScore !== null ? (
                    <div className="flex justify-between items-center">
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
                    <p className="text-center text-muted-foreground h-5 flex items-center justify-center">
                        {hasName ? 'Awaiting round completion...' : ' '}
                    </p>
                    )}
                    <Separator className="my-2 bg-border/50"/>
                    <p className="text-foreground/90 h-10 text-center flex items-center justify-center text-base">{isPending && commentary === 'Analyzing...' ? <Loader className="w-5 h-5 animate-spin" /> : commentary}</p>
                </CardContent>
            </Card>

            <div className="w-full flex justify-between items-center gap-2 pb-8 max-w-2xl mx-auto absolute -bottom-8">
              <div className='flex-1 flex justify-start'>
                <Link href="/" passHref>
                    <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-primary/20 neon-glow bg-black/50">
                        <HomeIcon/>
                    </Button>
                </Link>
              </div>
              
              <div className='flex-1 flex justify-center'>
                {!hasName ? (
                    <form onSubmit={handleNameSubmit} className="flex gap-2 w-full max-w-sm">
                        <Input 
                            value={playerName}
                            onChange={e => setPlayerName(e.target.value)}
                            placeholder="Enter your name..."
                            className="font-code bg-black/50 neon-glow border-none text-lg"
                            disabled={isPending || !hasCameraPermission}
                        />
                        <Button type="submit" size="icon" className="neon-glow border-none w-12 h-12 bg-accent/80 hover:bg-accent" disabled={!playerName.trim() || isPending || !hasCameraPermission}>
                            {isPending ? <Loader className="animate-spin" /> : <Send />}
                        </Button>
                    </form>
                ) : gameState === 'playing' ? (
                    <div className="flex justify-center gap-4">
                    {moves.map((move) => (
                        <Button
                        key={move}
                        onClick={() => handlePlay(move)}
                        disabled={isPending || !!resultMessage}
                        variant="outline"
                        className={cn(
                            "w-28 h-28 flex flex-col gap-1 text-primary bg-primary/10 hover:bg-primary/20 neon-glow",
                            playerChoice === move && "bg-primary/30"
                        )}
                        >
                        {React.createElement(moveIcons[move], { className: "w-12 h-12" })}
                        <span className="font-headline text-base capitalize">{move}</span>
                        </Button>
                    ))}
                    </div>
                ) : (
                    <div className="h-28" />
                )}
              </div>
              
              <div className='flex-1 flex justify-end items-center'>
                 {hasName && (
                  <Button 
                      variant="destructive" 
                      onClick={handleEndSession}
                      disabled={gameState === 'ending'}
                      className="neon-glow bg-destructive/80 hover:bg-destructive mr-4"
                  >
                      <Square className="w-4 h-4 mr-2" />
                      End Session
                  </Button>
              )}
                <Link href="/leaderboard" passHref>
                    <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-primary/20 neon-glow bg-black/50">
                        <Trophy/>
                    </Button>
                </Link>
              </div>
            </div>
        </div>
      </div>

      {resultMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"></div>
          <h2 className={cn("text-8xl font-bold font-headline animate-in fade-in zoom-in-50", 
            result === 'win' && 'text-primary',
            result === 'lose' && 'text-destructive',
            result === 'draw' && 'text-muted-foreground'
          )}>
            {resultMessage}
          </h2>
        </div>
      )}
    </div>
  );
}
