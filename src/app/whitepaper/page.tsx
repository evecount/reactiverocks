import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function WhitepaperPage() {
  return (
    <div className="container mx-auto py-20">
      <Card className="bg-card/80 backdrop-blur-sm neon-glow">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary">THE UNDERSTANDING RESOURCE</CardTitle>
          <CardDescription className="text-xl">reactive.rocks (BPM Sparring)</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-lg">
          <h2 className="text-secondary font-headline">I. The Core Innovation: Reactive AI vs. Autonomous AI</h2>
          <p>The fundamental shift in this project is from Autonomous (Passive) to Reactive (Live) logic. Reactive AI operates in the "Zero-Frame," sensing human intent through a Temporal Vision Loop that analyzes the velocity and acceleration of movement. Success is measured not just by the outcome, but by the <strong className="text-primary">Fluidity Score</strong> (a sub-100ms sync) achieved during the human-machine interaction.</p>
          
          <Separator className="my-6 bg-border/50"/>
          
          <h2 className="text-secondary font-headline">II. Technical Pillars & Machine Learning Pipeline</h2>
          <p>The <strong className="text-primary">%r (Residual Reflection)</strong> is the core feedback variable. It represents the delta between the AI's predicted movement and the user's final gesture. Minimizing %r in real-time is the primary objective.</p>
          <p>We have replaced traditional quantitative metrics (Win/Loss) with a Qualimetric Schema: <code className="text-secondary bg-black/50 p-2 rounded">Qual_Score = (Inference_Confidence * Temporal_Sync) / Latency_ms</code>. This measures the quality of the connection, rewarding an "honest" sparring rhythm.</p>
          
          <Separator className="my-6 bg-border/50"/>

          <h2 className="text-secondary font-headline">III. The QUINCE Protocol (Self-Referential Quine)</h2>
          <p>The AI uses Quine logic to periodically generate <strong className="text-primary">"Reflex Snapshots"</strong>—code-based reflections of its own updated weights and biases tailored to a specific user's tempo. This allows the system to evolve its "reflexes" without manual retraining, creating a self-improving digital nervous system.</p>

          <Separator className="my-6 bg-border/50"/>

          <h2 className="text-secondary font-headline">IV. Front-End & Backend "Handshake"</h2>
          <p>The interface is a 90s Cyber-Arcade experience. It utilizes a bidirectional multimodal stream (Gemini Live API) to maintain state and provide real-time verbal coaching. Data Schema (playerName, fluidityScore, reflexWeights) are stored in Firestore under an anonymous userID for progress tracking.</p>

          <Separator className="my-6 bg-border/50"/>

          <h2 className="text-secondary font-headline">V. Cryptographic Attestation (Prior Art)</h2>
          <p>This project is formally attested to establish "prior art" in Reactive AI as of January 10, 2026.</p>
          <p className="font-code text-sm text-muted-foreground">SHA-256 Identifier: 97f26d36e760c38217d85c88b4383a8b4b73b22f0365778a946d3e35a09e075c</p>
        </CardContent>
      </Card>
    </div>
  );
}
