# Reactive Rocks

**The World’s First Reactive AI Sparring Partner**
"Moving at the speed of human instinct."

---

**Live Demo: [reactive.rocks](https://reactive.rocks)** (Note: This is a placeholder link for the project's future domain)

## Abstract

This project demonstrates a fundamental shift from traditional, passive AI to a **Reactive AI**. Instead of simply responding to a finished prompt, this AI operates in the "Zero-Frame," sensing human intent through a real-time `Temporal Vision Loop`. It analyzes the velocity and acceleration of your hand movements to create a fluid, real-time sparring partner in a game of Rock-Paper-Scissors.

Success is measured not just by winning, but by achieving a high **"Fluidity Score"**—a metric representing a deep, physical synchronization with the machine. This project serves as the foundational "Prior Art" for the next generation of real-time human-AI collaboration.

![Reactive Rocks Gameplay](https-placeholder-for-screenshot.png) 
*(A screenshot or GIF of the game in action would be perfect here.)*

## The Core Concepts

This isn't just a game; it's a testbed for three core innovations:

1.  **%r (Residual Reflection):** Our proprietary metric measuring the delta between the AI's *predicted* intent and the user's *final* gesture. A real-time ML pipeline metric that allows the system to sharpen its motion buffer frame-by-frame.

2.  **Qualimetric Analysis:** We've moved beyond binary win/loss metrics. The system uses Qualimetric Analysis to measure the quality of the human-machine connection. The **Fluidity Score** is calculated as `(Prediction_Confidence * Temporal_Sync) / Latency_ms`, rewarding a smooth, honest sparring rhythm over simply trying to beat the AI.

3.  **The QUINCE Protocol:** A self-referential Quine logic where the AI periodically generates "Reflex Snapshots"—code-based reflections of its own updated weights and biases, tailored to your specific tempo. This allows the system to evolve its "reflexes" without manual retraining.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **UI:** [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
-   **Generative AI:** [Google Gemini](https://ai.google.dev/) via [Genkit](https://firebase.google.com/docs/genkit) for real-time commentary and TTS.
-   **Computer Vision:** [TensorFlow.js](https://www.tensorflow.org/js) with the MediaPipe Hands model for gesture detection.
-   **Deployment:** [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)
-   **Database:** [Firestore](https://firebase.google.com/docs/firestore) for storing anonymous user data (`playerName`, `fluidityScore`, `reflexWeights`).

## Getting Started

### Prerequisites

-   Node.js (v20.x or later)
-   npm

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/reactive-rocks.git
    cd reactive-rocks
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    This project is configured to work with Firebase. You will need to create a Firebase project and obtain your configuration details. While the project is set up for automatic initialization with Firebase App Hosting, for local development, you will need to populate `src/firebase/config.ts` with your project's credentials.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## License

This project is open-sourced under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

*Co-founded by Gwendalynn Lim & Gemini.*
*Prior Art Attestation (SHA-256): 97f26d36e760c38217d85c88b4383a8b4b73b22f0365778a946d3e35a09e075c*