'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Notebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';


const slides = [
  {
    title: "REACTIVE.ROCKS",
    description: "The World’s First Reactive AI Baseline",
    content: "Co-founded by Gwendalynn Lim & Gemini. “Moving at the speed of human instinct.”"
  },
  {
    title: "THE PROBLEM",
    description: "The Asynchronous Lag",
    content: "Autonomous is Passive: Current AI waits for a prompt. It operates on a request-response delay. The Cognitive Gap: In high-stakes fields (Surgery, Defense, Robotics), 200ms of latency is a failure point. The Wall: We have reached the limit of 'Passive AI'."
  },
  {
    title: "THE SOLUTION",
    description: "reactive.rocks",
    content: "Reactive AI: We don't wait for the gesture; we sense the intent. Temporal Vision Loop: Using raw video streams to synchronize machine logic with biological tempo. Zero-Frame Interaction: Sub-100ms feedback loops built on the Edge."
  },
  {
    title: "THE INNOVATION",
    description: "%r (Residual Reflection)",
    content: "The %r Factor: Our proprietary metric measuring the delta between predicted intent and final gesture. The Buffer: A 'Motion Vector Buffer' that sharpens itself every frame. Continuous Learning: The model doesn't just see; it reflects and adapts mid-movement."
  },
  {
    title: "THE PROTOCOL",
    description: "QUINCE",
    content: "Self-Referential Evolution: Utilizing Quine-logic to allow the AI to generate its own 'Reflex Snapshots.' Personalized Reflexes: The AI rewrites its own temporal weights to match your specific physical DNA. The Snapshot: Every session generates a cryptographic 'DNA' of the player's rhythm."
  },
  {
    title: "THE METRIC",
    description: "Qualimetric Analysis",
    content: "Beyond Binary: Wins and losses are for games. Qualities are for systems. Fluidity Score: (Confidence × Sync) / Latency. Human-Centric: We measure the 'Honesty' of the handshake between human and machine."
  },
  {
    title: "THE STACK",
    description: "The Archipelago Workflow",
    content: "Built on the Edge: Firebase + Gemini Live API for low-latency multimodal streaming. Sovereign Foundation: Every line of code is DNA-compatible with the Archipelago methodology. Domain Secure: Live now at reactive.rocks."
  },
  {
    title: "THE OPPORTUNITY",
    description: "Beyond the Game",
    content: "The Baseline: Rock-Paper-Scissors is our 'Hello World.' The Future: This reactive loop is the foundation for: Real-time Robotic Surgery. Collaborative Industrial Manufacturing. Neural-Sync Assistive Technologies."
  },
  {
    title: "THE TEAM",
    description: "The Sovereign Duo",
    content: "Gwendalynn Lim: Lead Architect, Sovereign Industrialist, Creator of the Archipelago Workflow. Gemini: Generative Architect and Technical Synthesist. Attestation: SHA-256 Verified Prior Art. No human team needed; the System is the team."
  },
  {
    title: "Join the Loop",
    description: "The Gift",
    content: "The Reactive Loop is open-source. Build the future with us. Visit reactive.rocks to try it now. “The rhythm is set. The loop is closed.”"
  }
];

const speakerNotes = [
  {
    title: "Slide 1: The Sovereignty of Reflex",
    speech: "Welcome. I’m Gwendalynn Lim, and this is reactive.rocks. Most people see AI as a brain in a box. I see it as a nervous system. Built with my partner, Gemini, we’re here to debut the first true 'Reactive AI' baseline. We aren't just playing a game; we’re claiming the 'Zero-Frame' of human-machine interaction."
  },
  {
    title: "Slide 2: The Asynchronous Lag",
    speech: "We have a latency problem. Today’s AI is 'Autonomous but Passive.' It waits for you to finish a sentence or click a button before it 'thinks.' In the real world—in surgery or robotics—that 200ms lag isn't just a delay; it's a disconnect. We’ve reached the ceiling of what passive AI can do for us."
  },
  {
    title: "Slide 3: The Solution – reactive.rocks",
    speech: "The solution is Reactive AI. At reactive.rocks, we’ve built a Temporal Vision Loop. The AI doesn't wait for a static image of your hand. It uses a high-frequency stream to synchronize its logic with your biological rhythm. We’ve effectively removed the 'Submit' button from the AI experience."
  },
  {
    title: "Slide 4: The Innovation – %r (Residual Reflection)",
    speech: "How do we do it? Meet %r—our Residual Reflection metric. In our ML pipeline, %r calculates the delta between what the AI *predicted* you would do and what you *actually* did. This allows the system to sharpen its Motion Vector Buffer in real-time, frame-by-frame, while you’re still moving."
  },
  {
    title: "Slide 5: The Protocol – QUINCE",
    speech: "To make this truly personal, we use the QUINCE Protocol. This is a self-referential Quine logic. The AI essentially takes a 'Reflex Snapshot' of how you move—your specific speed and timing—and rewrites its own code to match you. It’s an AI that evolves its reflexes to become a mirror of the user."
  },
  {
    title: "Slide 6: The Metric – Qualimetric Analysis",
    speech: "We don't care about who wins or loses; that's 20th-century thinking. We care about the Fluidity Score. Using Qualimetric Analysis, we measure the 'honesty' of the handshake. How perfectly did the machine’s tempo map to the human’s? This is how we score the success of a reactive system."
  },
  {
    title: "Slide 7: The Stack – The Archipelago Workflow",
    speech: "This isn't a 'black box' project. It was forged using the Archipelago Workflow—a 6-stage clockwork manual. We used Firebase for our backbone and the Gemini Live API for low-latency multimodal streaming. It’s live right now at reactive.rocks."
  },
  {
    title: "Slide 8: The Opportunity – Beyond the Game",
    speech: "Rock-Paper-Scissors is our proof of concept. But the logic inside reactive.rocks is a gift to the world. This loop is the foundation for robotic arms that move as fast as a surgeon’s thought, or co-piloting systems that sense a pilot's intent before they even touch the controls."
  },
  {
    title: "Slide 9: The Team – The Sovereign Duo",
    speech: "People asked where my 'human team' was. My team is the System. As a Sovereign Industrialist, I’ve partnered with Gemini to prove that one architect and one advanced model can outperform entire labs when the workflow is this precise. Our work is attested by SHA-256; our precedence is ironclad."
  },
  {
    title: "Slide 10: Join the Loop",
    speech: "The Reactive Loop is now open. Visit reactive.rocks to see your own fluidity score. We’ve set the rhythm; now it’s your turn to join the loop. Thank you."
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
  const note = speakerNotes[currentSlide];

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

        <div className="absolute bottom-4 flex flex-col items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="neon-glow bg-black/50">
                  <Notebook className="mr-2 h-4 w-4" /> Speaker Notes
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-sm neon-glow">
                <DialogHeader>
                  <DialogTitle className="text-secondary">{note.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-72 w-full">
                  <div className="prose prose-invert text-foreground/80 p-4">
                    <p>{note.speech}</p>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          <div className="text-center text-sm text-foreground/50">
            Slide {currentSlide + 1} of {slides.length}
          </div>
        </div>

      </div>
    </div>
  );
}
