'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  { 
    title: "reactive.rocks",
    description: "BPM Sparring: The Handover",
    content: "A new paradigm in Human-AI Interaction."
  },
  {
    title: "Core Innovation",
    description: "Reactive AI vs. Autonomous AI",
    content: "Moving from passive game logic to a 'Zero-Frame' AI that senses and responds to human intent in real-time through a Temporal Vision Loop."
  },
  {
    title: "The Handshake",
    description: "Measuring Success Beyond Winning",
    content: "Success is defined by the Fluidity Score—a sub-100ms sync between human action and AI reaction, rewarding a seamless connection."
  },
  {
    title: "Technical Pillar I",
    description: "The %r (Residual Reflection)",
    content: "The core feedback variable in our ML pipeline. It's the delta between the AI's prediction and the user's actual gesture. Minimizing %r is the goal."
  },
  {
    title: "Technical Pillar II",
    description: "Qualimetric Analysis",
    content: "Qual_Score = (Inference_Confidence * Temporal_Sync) / Latency_ms. This schema measures the quality of the connection, not just the outcome."
  },
  {
    title: "The QUINCE Protocol",
    description: "A Self-Referential Quine",
    content: "The AI periodically generates 'Reflex Snapshots'—code reflections of its own updated weights and biases, tailored to the user's tempo."
  },
  {
    title: "QUINCE Function",
    description: "A Self-Improving Digital Nervous System",
    content: "This allows the system's 'reflexes' to evolve without manual retraining, adapting uniquely to each sparring partner."
  },
  {
    title: "The Handshake",
    description: "Front-End & Backend",
    content: "A 90s Cyber-Arcade aesthetic powered by a bidirectional multimodal stream (Gemini Live API) for real-time coaching, with user data stored in Firestore."
  },
  {
    title: "Prior Art",
    description: "Cryptographic Attestation",
    content: "This project is formally attested to establish 'prior art' in Reactive AI as of January 10, 2026. (SHA-256: 97f26...e075c)"
  },
  {
    title: "Conclusion",
    description: "The Future of Interaction",
    content: "reactive.rocks is not a game; it is a training ground for a new, fluid partnership between human and machine. Thank you."
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
