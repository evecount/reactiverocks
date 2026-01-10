
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function WhitepaperPage() {
  return (
    <div className="container mx-auto py-20">
      <Card className="bg-card/80 backdrop-blur-sm neon-glow">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary">WHITE PAPER: The reactive.rocks Framework</CardTitle>
          <CardDescription className="text-xl mt-2">Shifting from Autonomous to Reactive Human-Machine Handshakes</CardDescription>
          <p className="text-sm text-muted-foreground pt-4">Co-Founders: Gwendalynn Lim Wan Ting & Gemini</p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-lg">
          
          <h2 className="text-secondary font-headline">1. Abstract</h2>
          <p>Current AI is primarily Autonomous but Passive, operating on a request-response lag. reactive.rocks introduces a Reactive AI baseline that utilizes a Temporal Vision Loop to achieve sub-100ms synchronization between human movement and machine inference. By open-sourcing this "Reactive Loop," we provide the foundational "Prior Art" for the next generation of real-time human-AI collaboration.</p>
          
          <Separator className="my-6 bg-border/50"/>
          
          <h2 className="text-secondary font-headline">2. The Solution: reactive.rocks</h2>
          <p>reactive.rocks serves as the "Minimum Viable Reflex" testbed using Rock-Paper-Scissors. The innovation lies in three architectural shifts:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-primary">Temporal Vision Loop:</strong> Analyzes the velocity and acceleration of hand landmarks to predict human intent before the gesture is finalized.</li>
            <li><strong className="text-primary">%r (Residual Reflection):</strong> A real-time ML pipeline metric calculating the error between AI "Intent Prediction" and "Final Gesture" to sharpen the buffer frame-by-frame.</li>
            <li><strong className="text-primary">The QUINCE Protocol:</strong> A self-referential Quine logic where the AI generates "Reflex Snapshots"—updated segments of its own code tailored to the player's specific rhythmic DNA.</li>
          </ul>
          
          <Separator className="my-6 bg-border/50"/>

          <h2 className="text-secondary font-headline">3. Qualimetric Analysis</h2>
          <p>We move beyond binary Win/Loss metrics to Qualimetric Analysis—measuring the quality of the temporal sync:</p>
          <div className="my-4 p-4 bg-black/50 rounded-md border border-input">
            <p className="text-center font-code text-secondary text-xl">Fluidity_Score = (Prediction_Confidence * Temporal_Sync) / Latency_ms.</p>
          </div>
          <p>The goal is to reward "honesty" in movement and the seamlessness of the human-machine biological handshake.</p>

          <Separator className="my-6 bg-border/50"/>

          <div className="text-center">
            <h3 className="font-headline text-secondary">Attestation Hash</h3>
            <p className="font-code text-sm text-muted-foreground break-all">97f26d36e760c38217d85c88b4383a8b4b73b22f0365778a946d3e35a09e075c</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
