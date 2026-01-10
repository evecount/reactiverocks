'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    title: "REACTIVE.ROCKS",
    description: "The World’s First Reactive AI Baseline",
    content: "Co-founded by Gwendalynn Lim & Gemini. “Moving at the speed of human instinct.”"
  },
  {
    title: "THE PROBLEM",
    description: "The Asynchronous Lag",
    content: "Current AI is passive; it waits for a prompt, operating on a request-response delay. In high-stakes fields like surgery or defense, this 200ms+ latency is a failure point. We've hit the wall of 'Passive AI'."
  },
  {
    title: "THE SOLUTION",
    description: "reactive.rocks",
    content: "We don't wait for the gesture; we sense the intent. Our Temporal Vision Loop synchronizes machine logic with biological tempo, creating a sub-100ms feedback loop for Zero-Frame Interaction."
  },
  {
    title: "THE INNOVATION",
    description: "%r (Residual Reflection)",
    content: "The %r Factor is our proprietary metric measuring the delta between predicted intent and final gesture. A 'Motion Vector Buffer' sharpens itself every frame, allowing the model to adapt mid-movement."
  },
  {
    title: "THE PROTOCOL",
    description: "QUINCE",
    content: "Utilizing Quine-logic, the AI generates its own 'Reflex Snapshots.' It rewrites its temporal weights to match your specific physical DNA, creating a cryptographic signature of your rhythm each session."
  },
  {
    title: "THE METRIC",
    description: "Qualimetric Analysis",
    content: "Wins are for games; Qualities are for systems. Our Fluidity Score (Confidence * Sync / Latency) measures the 'Honesty' of the handshake between human and machine."
  },
  {
    title: "THE STACK",
    description: "The Archipelago Workflow",
    content: "Built on the Edge with Firebase and the Gemini Live API for low-latency multimodal streaming. Every line of code is DNA-compatible with the Archipelago methodology. Live now at reactive.rocks."
  },
  {
    title: "THE OPPORTUNITY",
    description: "Beyond the Game",
    content: "Rock-Paper-Scissors is our 'Hello World.' This reactive loop is the foundation for real-time robotic surgery, collaborative manufacturing, and neural-sync assistive technologies."
  },
  {
    title: "THE TEAM",
    description: "The Sovereign Duo",
    content: "Gwendalynn Lim (The Architect) and Gemini (The One). Lead Architect & Generative Architect. This project is SHA-256 Verified Prior Art. The System is the team."
  },
  {
    title: "Join the Loop",
    description: "The Gift",
    content: "The Reactive Loop is open-source. Build the future with us. Visit reactive.rocks to try it now. The rhythm is set. The loop is closed."
  }
];

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };
  
  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 w-full h-full bg-background flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm aspect-[9/16] flex flex-col justify-between items-center">
        
        <div className="w-full flex justify-between items-center px-2 absolute top-4 z-10">
          <Button variant="ghost" size="icon" onClick={prevSlide} className="text-white hover:text-primary hover:bg-primary/20 neon-glow bg-black/50 rounded-full h-14 w-14">
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextSlide} className="text-white hover:text-primary hover:bg-primary/20 neon-glow bg-black/50 rounded-full h-14 w-14">
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>

        <Card className="w-full h-full flex flex-col justify-center items-center bg-card/80 backdrop-blur-sm neon-glow">
          <CardHeader className="text-center">
            <CardTitle className={cn("font-headline text-3xl", currentSlide === 0 ? "text-primary text-5xl" : "text-secondary")}>{slide.title}</CardTitle>
            {slide.description && <CardDescription className="text-lg">{slide.description}</CardDescription>}
          </CardHeader>
          <CardContent className="text-center text-xl text-foreground/80 px-8">
            <p>{slide.content}</p>
          </CardContent>
        </Card>

        <div className="absolute bottom-4 text-center text-sm text-foreground/50">
          Slide {currentSlide + 1} of {slides.length}
        </div>

      </div>
    </div>
  );
}
