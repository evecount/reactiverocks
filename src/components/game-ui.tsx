"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Bot, Loader, User } from 'lucide-react';

import { aiPlaysRpsAndCoachesUser, type AIPlaysRpsAndCoachesUserOutput } from '@/ai/flows/ai-plays-rps-and-coaches-user';
import { calculateAndDisplayFluidityScore, type CalculateAndDisplayFluidityScoreOutput } from '@/ai/flows/calculate-and-display-fluidity-score';
import { adaptAIToUserRhythm } from '@/ai/flows/adapt-ai-to-user-rhythm';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaperIcon } from '@/components/icons/paper-icon';
import { RockIcon } from '@/components/icons/rock-icon';
import { ScissorsIcon } from '@/components/icons/scissors-icon';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Move = 'rock' | 'paper' | 'scissors';

const moves: Move[] = ['rock', 'paper', 'scissors'];

const moveIcons: Record<Move, React.ComponentType<{ className?: string }>> = {
  rock: RockIcon,
  paper: PaperIcon,
  scissors: ScissorsIcon,
};

const resultColors = {
  win: 'text-accent',
  lose: 'text-destructive',
  draw: 'text-muted-foreground',
};

const getResult = (playerMove: Move, aiMove: Move): 'win' | 'lose' | 'draw' => {
  if (playerMove === aiMove) return 'draw';
  if (
    (playerMove === 'rock' && aiMove === 'scissors') ||
    (playerMove === 'scissors' && aiMove === 'paper') ||
    (playerMove === 'paper' && aiMove === 'rock')
  ) {
    return 'win';
  }
  return 'lose';
};

export default function GameUI() {
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerChoice, setPlayerChoice] = useState<Move | null>(null);
  const [aiChoice, setAiChoice] = useState<Move | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [round, setRound] = useState(0);
  const [commentary, setCommentary] = useState("Welcome, Sparring Partner. Ready to test your reflexes? Make your move.");
  const [fluidityScoreData, setFluidityScoreData] = useState<CalculateAndDisplayFluidityScoreOutput | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (resultMessage) {
      const timer = setTimeout(() => setResultMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [resultMessage]);

  const handlePlay = useCallback(async (move: Move) => {
    startTransition(async () => {
      setPlayerChoice(move);
      setAiChoice(null);
      setResult(null);
      setFluidityScoreData(null);
      setCommentary("Analyzing...")

      const userActionTimestamp = Date.now();
      
      try {
        const aiResult = await aiPlaysRpsAndCoachesUser({
          userMove: move,
          gameState: JSON.stringify({ playerScore, aiScore, round }),
          fluidityScore: fluidityScoreData?.fluidityScore,
        });

        const aiResponseTimestamp = Date.now();
        
        const gameResult = getResult(move, aiResult.aiMove);
        
        setAiChoice(aiResult.aiMove);
        setCommentary(aiResult.commentary);
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
        
        const fluidityResult = await calculateAndDisplayFluidityScore({ userActionTimestamp, aiResponseTimestamp });
        setFluidityScoreData(fluidityResult);

        await adaptAIToUserRhythm({
            reflexSnapshot: `Round ${round + 1}: Player chose ${move}, AI chose ${aiResult.aiMove}. Result: ${gameResult}. Fluidity: ${fluidityResult.fluidityScore}ms.`,
            fluidityScore: fluidityResult.fluidityScore,
            userId: 'user_12345',
        });

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
  }, [round, playerScore, aiScore, fluidityScoreData, toast]);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 relative">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-accent">Reactive Rock Paper Scissors</h1>
        <p className="text-muted-foreground mt-2">A Demonstration of a Bio-Sync Digital Nervous System</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex-row items-center gap-4 space-y-0">
            <User className="w-8 h-8 text-primary"/>
            <div>
              <CardTitle className="font-headline">You</CardTitle>
              <CardDescription>Score: {playerScore}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-md overflow-hidden border-2 border-primary/50 flex items-center justify-center">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex-row items-center gap-4 space-y-0">
            <Bot className="w-8 h-8 text-accent"/>
            <div>
              <CardTitle className="font-headline">Sparring Partner</CardTitle>
              <CardDescription>Score: {aiScore}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-md overflow-hidden border-2 border-accent/50 flex items-center justify-center">
              {isPending && !aiChoice ? (
                <Loader className="w-16 h-16 animate-spin text-accent" />
              ) : aiChoice ? (
                React.createElement(moveIcons[aiChoice], { className: "w-24 h-24 text-accent transition-all duration-300 animate-in fade-in zoom-in-50" })
              ) : (
                 <div className="text-center text-muted-foreground">
                    <Bot className="w-16 h-16 mx-auto" />
                    <p>Awaiting your move...</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-headline text-lg text-primary">Qualimetric Analysis</h3>
            <Separator className="my-2 bg-primary/20"/>
            {fluidityScoreData ? (
                <div className="font-code text-sm space-y-2">
                    <p>
                        <span className="text-muted-foreground">Fluidity Score: </span>
                        <span className="text-accent font-bold">{fluidityScoreData.fluidityScore.toFixed(0)}ms</span>
                    </p>
                    <p>
                        <span className="text-muted-foreground">Sync Grade: </span>
                        <span>{fluidityScoreData.commentary}</span>
                    </p>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground font-code">Awaiting round completion...</p>
            )}
          </div>
          <div>
            <h3 className="font-headline text-lg text-accent">System Commentary</h3>
            <Separator className="my-2 bg-accent/20"/>
            <p className="text-sm font-code text-foreground/90 h-16">{commentary}</p>
          </div>
        </CardContent>
      </Card>

      <footer className="flex flex-col items-center gap-4">
        <p className="font-headline text-lg">Make Your Move</p>
        <div className="flex items-center justify-center gap-4">
          {moves.map((move) => (
            <Button
              key={move}
              onClick={() => handlePlay(move)}
              disabled={isPending}
              size="lg"
              variant="outline"
              className={cn(
                "w-24 h-24 md:w-32 md:h-32 flex flex-col gap-2 border-2 text-primary hover:bg-primary/10 hover:text-primary-foreground hover:border-primary",
                playerChoice === move && "bg-primary/20 border-primary"
              )}
            >
              {React.createElement(moveIcons[move], { className: "w-10 h-10 md:w-12 md:h-12" })}
              <span className="font-headline text-base capitalize">{move}</span>
            </Button>
          ))}
        </div>
      </footer>
      
      {resultMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in"></div>
          <h2 className={cn("text-7xl md:text-9xl font-bold font-headline animate-in fade-in zoom-in-50", result && resultColors[result])}>
            {resultMessage}
          </h2>
        </div>
      )}
    </div>
  );
}
