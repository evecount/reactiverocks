import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-20">
      <Card className="bg-card/80 backdrop-blur-sm neon-glow">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">About Reactive Rocks</CardTitle>
          <CardDescription>The Instructional DNA of BPM Sparring</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is Reactive AI?</AccordionTrigger>
              <AccordionContent>
                This project demonstrates a shift from traditional, passive AI to a Reactive AI. Instead of just playing a game, our AI operates in the "Zero-Frame," sensing human intent through a Temporal Vision Loop. It analyzes the velocity and acceleration of your movements to create a real-time, fluid sparring partner. Success is measured not just by winning, but by achieving a high "Fluidity Score" through a deep sync with the machine.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What is Qualimetric Analysis?</AccordionTrigger>
              <AccordionContent>
                We've moved beyond simple Win/Loss metrics. Our system uses Qualimetric Analysis to measure the quality of the human-machine connection. The "Fluidity Score" is calculated as: `(Inference_Confidence * Temporal_Sync) / Latency_ms`. This rewards a smooth, honest sparring rhythm over just trying to beat the AI. The core feedback variable in our ML pipeline is the `%r (Residual Reflection)`, which is the delta between the AI's predicted movement and your actual gesture.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What is the QUINCE Protocol?</AccordionTrigger>
              <AccordionContent>
                QUINCE (a Self-Referential Quine) is our protocol for long-term AI evolution. The AI uses Quine logic to periodically generate "Reflex Snapshots"—code-based reflections of its own updated weights and biases, tailored to your specific tempo. This allows the system to evolve its "reflexes" without manual retraining, creating a self-improving digital nervous system.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-4">
              <AccordionTrigger>What is the technical vision?</AccordionTrigger>
              <AccordionContent>
                The experience is powered by the Gemini Live API, using a bidirectional multimodal stream to maintain state and provide real-time verbal coaching. User data, including `playerName`, `fluidityScore`, and `reflexWeights` (the Quine snapshots), are stored in Firestore under an anonymous userID to track progress and personalize the AI's evolution.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
