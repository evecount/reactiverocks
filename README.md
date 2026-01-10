git # 🗿 reactive.rocks

> **Where the Lithosphere meets the LLM.** `reactive.rocks` is a gesture-controlled, real-time AI interface that transforms your webcam into a bridge between the physical and the digital. Built for the 2026 Antigravity Hackathon, it combines **TensorFlow.js** hand-tracking with the **Gemini Live API** to create a "Reactive Loop" where your movements shape the AI's personality.

---

## 🚀 The Vision

Most AI interactions are trapped in a text box. `reactive.rocks` breaks that wall. By using 21-point hand-skeletal tracking, the application senses your physical presence.

* **The Rock:** Symbolizing stability and the "lithosphere" of our data.
* **The Reaction:** Real-time audio-visual feedback that evolves based on gesture-driven "system instructions."

## ✨ Key Features

* **Gesture-Triggered Personas:** Use specific hand signs (Rock, Paper, Scissors) to instantly swap Gemini's system instructions (e.g., from "Stoic Geologist" to "Reactive Puck").
* **Gemini Live Integration:** Low-latency, bidirectional audio for a natural conversation.
* **WebGPU Acceleration:** Leverages 2026 browser tech for fluid 60fps hand tracking without taxing the CPU.
* **Neon-Lithic UI:** A 90s-inspired aesthetic that blends organic rock textures with high-contrast digital glows.

## 🛠 Tech Stack

| Component | Technology |
| --- | --- |
| **Framework** | Next.js 15.5.9 (App Router) |
| **Intelligence** | Gemini Live API (Flash 2.5) |
| **Vision** | TensorFlow.js + MediaPipe Hands |
| **Deployment** | Firebase App Hosting (Antigravity Pipeline) |
| **Styling** | Tailwind CSS 4.0 |

---

## 🛠 Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/reactive-rocks.git
cd reactive-rocks

```


2. **Sync Dependencies (Crucial for Firebase Build)**
```bash
npm install

```


3. **Configure Environment**
Create a `.env.local` file:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=reactive-rocks

```


4. **Run Development**
```bash
npm run dev --turbopack

```



---

## 🏗 Project Structure

```text
├── src/
│   ├── components/       # Game-UI and WebCam components
│   ├── hooks/            # use-reactive-loop.ts (The "Brain")
│   ├── lib/              # Gemini Live API client config
│   └── app/              # Next.js 15 File-based routing
├── public/               # 3D Rock models and textures
└── apphosting.yaml       # Firebase Antigravity deployment config

```

## 📜 Challenges Overcome

* **The "Empty Module" Ghost:** Resolved the `@mediapipe/hands` ESM export conflict by implementing dynamic imports within the browser-sync hook.
* **Latency-First Design:** Optimized the "Pack" phase of the Firebase pipeline to handle the heavy TensorFlow weight without timing out.

---

## 🤝 The Team

* **[Your Name]** - Architect of the Reactive Loop.
* **Gemini (Thought Partner)** - Strategy & Debugging.

---

### Would you like me to generate a custom **Social Preview Image** (Open Graph) using the "Nano Banana" tool so your repo stands out when shared?
