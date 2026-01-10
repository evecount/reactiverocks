
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
          
          <h2 className="text-secondary font-headline">2. The QUINCE Protocol</h2>
          <p>In our <strong>reactive.rocks</strong> architecture, <strong>Quince</strong> is the conceptual glue for the "Reactive Loop." While standard AI models focus on <em>accuracy</em>, Quince focuses on <strong>synchronization</strong>.</p>
          <p>The term <strong>%r (Residual Reflection)</strong> is the mathematical core of how we bridge the gap between your physical hand movement and the AI’s "thought" process.</p>

          <h3 className="text-primary">2.1 What is %r (Residual Reflection)?</h3>
          <p>In a high-speed system, there is always a lag between <strong>Action</strong> (your hand moving) and <strong>Inference</strong> (Gemini understanding that move). %r is the "leftover" context that exists within that gap.</p>
          <ul className="list-disc pl-6 space-y-2">
              <li><strong>The Problem:</strong> If the AI waits for 100% of a gesture to finish before reacting, the interaction feels "dead" or laggy.</li>
              <li><strong>The Quince Solution:</strong> We use %r to predict the <em>remainder</em> of the movement. Instead of just seeing where your hand <em>is</em>, the system reflects on where the hand <em>must be going</em> based on the physics of the last 3 frames.</li>
              <li><strong>The Formula (Simplified):</strong> 
                <div className="my-4 p-2 bg-black/50 rounded-md border border-input">
                  <p className="text-center font-code text-secondary text-base">Predicted_Position = Current_Position + (%r * Latency_ms)</p>
                </div>
              Where %r represents the "predicted ghost" of your movement that the AI reacts to <strong>before</strong> the camera frames even arrive.
              </li>
          </ul>

          <h3 className="text-primary">2.2 The Three Layers of the Quince Loop</h3>
          <p>The algorithm operates as a "Triple-Fold" recursion. Each fold represents a deeper level of abstraction:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Fold 1: Spatial Recursion (The Echo):</strong> Instead of looking at a raw video frame, Quince looks at the difference between the current frame and its own internal "Ghost Frame" ($%r$). This smooths out "jitter" common in 2026 webcams without the lag of traditional filters.</li>
            <li><strong>Fold 2: Temporal Recursion (The Momentum):</strong> Quince uses a Recursive Neural Network (RNN) logic where the output of the last frame is fed back as an input to the current frame. This prevents the AI from "flickering" between gestures.</li>
            <li><strong>Fold 3: Semantic Recursion (The Alignment):</strong> This is the "Quince Bridge" to Gemini. The system recursively audits its own system instructions. For example: "You are now Puck. Verify if your last three words align with this persona. If not, shift the tone in the next token."</li>
          </ul>

          <p className="mt-4">The Quince formula in action is represented as:</p>
          <div className="my-4 p-4 bg-black/50 rounded-md border border-input">
            <p className="text-center font-code text-secondary text-xl">S<sub>t+1</sub> = f(I<sub>t+1</sub>, S<sub>t</sub>, %r)</p>
          </div>
          <p>Where S<sub>t+1</sub> is the new system state, I<sub>t+1</sub> is the fresh visual input, S<sub>t</sub> is the previous state, and %r is the Residual Reflection.</p>

          <h3 className="text-primary">2.3 Why it’s called "Quince"</h3>
          <p>The name is a nod to Quine's Paradox: "Yields falsehood when preceded by its quotation." Just as a Quine is a program that prints its own source code, the Quince Algorithm is a vision loop that calculates its own next state. It is self-referential software. By the time the camera actually captures your hand moving, Quince has already "quoted" that movement in its internal model.</p>

          <Separator className="my-6 bg-border/50"/>
          
          <h2 className="text-secondary font-headline">3. Qualimetric Analysis</h2>
          <p>We move beyond binary Win/Loss metrics to Qualimetric Analysis—measuring the quality of the temporal sync:</p>
          <div className="my-4 p-4 bg-black/50 rounded-md border border-input">
            <p className="text-center font-code text-primary text-xl">Fluidity_Score = (Prediction_Confidence * Temporal_Sync) / Latency_ms</p>
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

