"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Bot, Loader, User, Send, Play, Square } from 'lucide-react';

import { adaptAIToUserRhythm } from '@/ai/flows/adapt-ai-to-user-rhythm';
import { liveRpsSession, LiveRpsSessionOutput } from '@/ai/flows/live-rps-session';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  
  const [gameState, setGameState] = useState<GameState>('idle');
  const [sessionAudio, setSessionAudio] = useState<HTMLAudioElement | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function setupWebcam() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing webcam:", err);
          toast({
            variant: "destructive",
            title: "Webcam Error",
            description: "Could not access your webcam. Please check permissions and try again.",
          });
        }
      }
    }
    setupWebcam();
  }, [toast]);
  
  useEffect(() => {
    if(!hasName) {
        setCommentary("Welcome, Sparring Partner. What should I call you?");
    }
  }, [hasName]);

  useEffect(() => {
    if (resultMessage) {
      const timer = setTimeout(() => setResultMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [resultMessage]);

  const handleNameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (playerName.trim()) {
      setHasName(true);
      setGameState('starting');
      // Here you would also handle anonymous login and storing the user ID
      
      startTransition(async () => {
        try {
          const response = await liveRpsSession({
            userName: playerName,
            state: 'start'
          });
          setCommentary(response.commentaryText);
          const audio = new Audio(response.commentaryAudio);
          audio.play();
          setSessionAudio(audio);
          setGameState('playing');
        } catch (error) {
          console.error("Error starting session:", error);
          toast({
            variant: "destructive",
            title: "AI Error",
            description: "Could not start the session.",
          });
          setGameState('idle');
        }
      });
    }
  };

  const handleEndSession = async () => {
    if (!playerName) return;

    setGameState('ending');
    startTransition(async () => {
        try {
            const response = await liveRpsSession({
                userName: playerName,
                state: 'end'
            });
            setCommentary(response.commentaryText);
            if (sessionAudio) {
                sessionAudio.pause();
            }
            const audio = new Audio(response.commentaryAudio);
            audio.play();
            setSessionAudio(null);
            setGameState('idle');
            // Reset scores or other states if needed
            setPlayerScore(0);
            setAiScore(0);
            setRound(0);
            setFluidityScore(null);
            setFluidityCommentary('');
        } catch (error) {
            console.error("Error ending session:", error);
            toast({
                variant: "destructive",
                title: "AI Error",
                description: "Could not end the session properly.",
            });
            setGameState('playing'); // Revert to playing if end fails
        }
    });
};

  const handlePlay = useCallback(async (move: Move) => {
    if (gameState !== 'playing') return;

    startTransition(async () => {
      setPlayerChoice(move);
      setAiChoice(null);
      setResult(null);
      setFluidityScore(null);
      setCommentary("Analyzing...")

      const userActionTimestamp = Date.now();
      
      try {
        const aiResult = await liveRpsSession({
          userMove: move,
          userName: playerName,
          state: 'move',
          fluidityScore: fluidityScore,
        });

        const aiResponseTimestamp = Date.now();
        
        if (aiResult.aiMove && aiResult.gameResult) {
            const gameResult = aiResult.gameResult;
            
            setAiChoice(aiResult.aiMove);
            setCommentary(aiResult.commentaryText);
            setResult(gameResult);
            setRound(r => r + 1);

            if (gameResult === 'win') {
                setPlayerScore(s => s + 1);
                setResultMessage("YOU WIN");
            } else if (gameResult === 'lose') {
                setAiScore(s => s + 1);
                setResultMessage("YOU LOSE");
            } else {
                setResultMessage("DRAW");
            }
            
            const currentFluidity = Math.abs(aiResponseTimestamp - userActionTimestamp);
            setFluidityScore(currentFluidity);
            if (currentFluidity < 50) {
              setFluidityCommentary("Excellent Sync!");
            } else if (currentFluidity < 100) {
              setFluidityCommentary("Good timing.");
            } else {
              setFluidityCommentary("Out of sync.");
            }

            // Play new commentary
            if (sessionAudio) sessionAudio.pause();
            const audio = new Audio(aiResult.commentaryAudio);
            audio.play();
            setSessionAudio(audio);
            
            if ((round + 1) % 3 === 0) {
                await adaptAIToUserRhythm({
                    reflexSnapshot: `Round ${round + 1}: Player chose ${move}, AI chose ${aiResult.aiMove}. Result: ${gameResult}. Fluidity: ${currentFluidity}ms.`,
                    fluidityScore: currentFluidity,
                    userId: 'user_12345', // Replace with actual anonymous user ID
                });
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
  }, [round, playerName, fluidityScore, toast, gameState, sessionAudio]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-50"
      ></video>

      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-8">
        {/* Header: Scores and Timer */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <User className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <p className="font-headline text-primary truncate">{playerName || 'Player'}</p>
              <div className="h-4 bg-primary/20 rounded-full w-full">
                <div className="h-full bg-primary rounded-full" style={{ width: `${playerScore * 10}%` }}></div>
              </div>
            </div>
          </div>
          <div className="font-headline text-5xl font-bold text-white">
            {round}
          </div>
          <div className="flex items-center gap-4">
             <div className="flex-1 text-right">
              <p className="font-headline text-accent truncate">Sparring Partner</p>
              <div className="h-4 bg-accent/20 rounded-full w-full">
                <div className="h-full bg-accent rounded-full" style={{ width: `${aiScore * 10}%` }}></div>
              </div>
            </div>
            <Bot className="w-8 h-8 text-accent" />
          </div>
        </div>

        {/* AI Move Display */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            {isPending && !aiChoice && gameState === 'playing' ? (
              <Loader className="w-24 h-24 animate-spin text-accent" />
            ) : aiChoice ? (
              React.createElement(moveIcons[aiChoice], {
                className: 'w-40 h-40 text-accent drop-shadow-[0_0_15px_hsl(var(--accent))] transition-all duration-300 animate-in fade-in zoom-in-50',
              })
            ) : null}
        </div>

        {/* Footer: Controls and Commentary */}
        <div className="flex flex-col gap-4 items-center">
            <Card className="bg-card/80 backdrop-blur-sm w-full max-w-2xl">
                <CardContent className="p-3 text-sm font-code">
                    {hasName && fluidityScore !== null ? (
                    <div className="flex justify-between items-center">
                        <p>
                            <span className="text-muted-foreground">Fluidity: </span>
                            <span className="text-accent font-bold">{fluidityScore.toFixed(0)}ms</span>
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
                    <p className="text-foreground/90 h-10 text-center flex items-center justify-center">{isPending ? <Loader className="w-4 h-4 animate-spin" /> : commentary}</p>
                </CardContent>
            </Card>

            {!hasName ? (
                <form onSubmit={handleNameSubmit} className="flex gap-2 w-full max-w-sm">
                    <Input 
                        value={playerName}
                        onChange={e => setPlayerName(e.target.value)}
                        placeholder="Enter your name..."
                        className="font-code"
                    />
                    <Button type="submit" size="icon" disabled={!playerName.trim() || isPending}>
                        <Send />
                    </Button>
                </form>
            ) : gameState === 'playing' ? (
                <div className="flex justify-center gap-4">
                {moves.map((move) => (
                    <Button
                    key={move}
                    onClick={() => handlePlay(move)}
                    disabled={isPending}
                    variant="outline"
                    className={cn(
                        "w-24 h-24 flex flex-col gap-1 border-4 text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary-foreground hover:border-primary",
                        playerChoice === move && "bg-primary/30 border-primary"
                    )}
                    >
                    {React.createElement(moveIcons[move], { className: "w-10 h-10" })}
                    <span className="font-headline text-sm capitalize">{move}</span>
                    </Button>
                ))}
                </div>
            ) : (
                <div className="h-24" />
            )}
            
            {hasName && (
                <Button 
                    variant="destructive" 
                    onClick={handleEndSession}
                    disabled={gameState !== 'playing'}
                    className="w-full max-w-sm"
                >
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                </Button>
            )}
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
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
