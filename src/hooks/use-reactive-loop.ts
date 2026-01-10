// Sovereign Architects: Antigravity x User
'use client';

import { useEffect, useRef } from 'react';

// ====================================================================================
// !! ANTIGRAVITY AGENT INSTRUCTIONS !!
// ====================================================================================
//
// GOAL:
// The purpose of this hook is to create a real-time, gesture-driven "Reactive Loop".
// It uses the user's webcam feed to detect Rock, Paper, and Scissors hand gestures
// via TensorFlow.js and MediaPipe, triggering game logic in `game-ui.tsx`.
//
// PROBLEM:
// The required npm packages for this functionality caused critical `ERESOLVE`
// peer dependency conflicts during the `npm ci` step of the Firebase deployment.
// The core issue is a conflict between modern React/Next.js and the older dependency
// requirements of the TensorFlow.js ecosystem.
//
// FAILED ATTEMPTS:
// - Using `overrides` in package.json and an `.npmrc` file with `legacy-peer-deps=true`.
// - Using dynamic `import()` statements within the hook.
// - Modifying `next.config.js` to treat the packages as external.
//
// CURRENT STATE:
// To achieve a successful deployment, all TensorFlow and MediaPipe dependencies
// have been REMOVED from `package.json`. The hand-tracking logic below is
// commented out to prevent compile-time errors. The app is currently "frozen"
// in a state where the core UI and camera feed work, but no gesture detection occurs.
//
// YOUR MISSION:
// 1. RE-INSTALL DEPENDENCIES: Add the following packages back to `package.json`:
//    - "@tensorflow/tfjs"
//    - "@tensorflow-models/hand-pose-detection"
//    - "@tensorflow/tfjs-backend-webgl"
//    - "@mediapipe/hands"
//
// 2. RESOLVE CONFLICTS: The user provided a "Sovereign" solution that must be
//    re-attempted as the canonical fix. This involves using the `overrides`
//    field in `package.json` and creating an `.npmrc` file. This is the key
//    to solving the `ERESOLVE` error.
//
// 3. RE-ENABLE LOGIC: Uncomment the `initAndRunDetection` and `detect` functions
//    below and remove the simulated success state.
//
// 4. VERIFY: The final goal is for the `onGesture` callback to be successfully
//    invoked with hand keypoint data, making the game playable as intended.
//
// ====================================================================================


// Keypoint and HandDetector types will be imported dynamically
type Keypoint = { x: number; y: number; name?: string };
type HandDetector = any;

type OnGestureCallback = (keypoints: Keypoint[], gesture?: string, confidence?: number) => void;

const BUFFER_SIZE = 10;
const BOUNCE_THRESHOLD = 5;

export const useReactiveLoop = (
  videoRef: React.RefObject<HTMLVideoElement>,
  onGesture: OnGestureCallback,
  setIsDetecting: (isDetecting: boolean) => void,
  isLoopActive: boolean
) => {
  const detectorRef = useRef<HandDetector | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const motionBuffer = useRef<number[]>([]);

  useEffect(() => {
    if (!isLoopActive) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    let disposed = false;

    const initAndRunDetection = async () => {
      // Dynamic imports to ensure client-side only execution
      const tf = await import('@tensorflow/tfjs'); // Import main entry point to ensure side-effects
      // await import('@tensorflow/tfjs-backend-webgl'); // Included in @tensorflow/tfjs
      const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');
      // This ensures the side-effects of mediapipe hands run in the browser.
      await import('@mediapipe/hands');

      if (disposed) return;

      try {
        await tf.ready();
        const currentBackend = tf.getBackend();
        console.log("Current TF backend:", currentBackend);

        if (currentBackend !== 'webgl') {
          try {
            await tf.setBackend('webgl');
            console.log("WebGL backend initialized.");
          } catch (err) {
            console.warn("WebGL initialization failed, checking available backends...", err);
          }
        }
      } catch (e) {
        console.warn("WebGL backend failed to initialize, falling back to wasm.", e);
        try {
          await import('@tensorflow/tfjs-backend-wasm'); // Ensure wasm backend is available if needed
          await tf.setBackend('wasm');
          console.log("WASM backend initialized.");
        } catch (wasmError) {
          console.error("WASM backend also failed to initialize.", wasmError);
          setIsDetecting(false);
          return;
        }
      }

      if (disposed) return;

      try {
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
          runtime: 'tfjs',
          modelType: 'full', // Switched to full for better accuracy
          maxHands: 1,
        } as const;
        const detector = await handPoseDetection.createDetector(model, detectorConfig);

        if (disposed) {
          if (typeof detector.dispose === 'function') {
            detector.dispose();
          }
          return;
        }

        detectorRef.current = detector;
        setIsDetecting(true);
        console.log("Hand detector loaded.");
        detect();
      } catch (error) {
        console.error("Error loading hand detector:", error);
        setIsDetecting(false);
      }
    };

    const detect = async () => {
      if (
        !disposed &&
        videoRef.current &&
        detectorRef.current &&
        videoRef.current.readyState >= 2 // Relaxed from 4 to 2 (HAVE_CURRENT_DATA)
      ) {
        try {
          const hands = await detectorRef.current.estimateHands(videoRef.current, {
            flipHorizontal: true
          });

          // Debug Logging
          if (Math.random() < 0.05) { // Log occasionally to avoid spam
            console.log(`[Vision] Hands detected: ${hands.length}`);
          }

          if (hands.length > 0 && hands[0].keypoints) {
            const keypoints: Keypoint[] = hands[0].keypoints;

            // Debug Keypoint Structure ONCE
            if (Math.random() < 0.01) {
              console.log("[Vision] Keypoint sample:", keypoints[0]);
              console.log("[Vision] Wrist found:", keypoints.find(k => k.name === 'wrist'));
            }

            const wrist = keypoints[0]; // Index 0 is always Wrist

            let gesture = "Unknown";
            let confidence = 0;

            if (wrist) {
              // Update Motion Vector Buffer
              motionBuffer.current.push(wrist.y);
              if (motionBuffer.current.length > BUFFER_SIZE) {
                motionBuffer.current.shift();
              }

              // Calculate Velocity (Simple dy) and Energy
              if (motionBuffer.current.length >= 2) {
                const currentY = motionBuffer.current[motionBuffer.current.length - 1];
                const prevY = motionBuffer.current[motionBuffer.current.length - 2];
                const velocity = currentY - prevY;

                // Detect Bounce (High Energy vertical movement)
                if (Math.abs(velocity) > BOUNCE_THRESHOLD) {
                  gesture = velocity < 0 ? "Moving Up" : "Moving Down";
                  confidence = Math.min(Math.abs(velocity) / 20, 1); // Normalize confidence
                } else {
                  // Static Gesture Classification - INDEX BASED (Faster & More Robust)
                  // 0: Wrist
                  // 1-4: Thumb (4 tip, 3 ip)
                  // 5-8: Index (8 tip, 6 pip)
                  // 9-12: Middle (12 tip, 10 pip)
                  // 13-16: Ring (16 tip, 14 pip)
                  // 17-20: Pinky (20 tip, 18 pip)

                  const isExtendedConfig = (tipIdx: number, pipIdx: number) => {
                    const tip = keypoints[tipIdx];
                    const pip = keypoints[pipIdx];
                    if (!tip || !pip) return false;
                    // Simple distance check: Tip further from wrist than PIP = Extended
                    const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
                    const dPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
                    return dTip > dPip;
                  };

                  const thumbExt = isExtendedConfig(4, 3);
                  const indexExt = isExtendedConfig(8, 6);
                  const middleExt = isExtendedConfig(12, 10);
                  const ringExt = isExtendedConfig(16, 14);
                  const pinkyExt = isExtendedConfig(20, 18);

                  // Debug Finger States
                  if (Math.random() < 0.02) {
                    console.log(`[Vision] Fingers: T:${thumbExt} I:${indexExt} M:${middleExt} R:${ringExt} P:${pinkyExt}`);
                  }

                  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

                  if (extendedCount >= 4) {
                    gesture = "paper"; // 4 or 5 fingers
                  } else if (extendedCount <= 1) {
                    gesture = "rock"; // 0 or 1 finger (forgiving)
                  } else {
                    gesture = "scissors"; // 2 or 3 fingers
                  }

                  confidence = 0.9;
                }
              }

              onGesture(keypoints, gesture, confidence);
            } else {
              onGesture([], "None", 0); // No hands detected
            }
          }
        } catch (error) {
          console.error("Error during hand estimation:", error);
        }
      }
      if (!disposed) {
        animationFrameId.current = requestAnimationFrame(detect);
      }
    };

    initAndRunDetection();

    return () => {
      disposed = true;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (detectorRef.current) {
        if (typeof detectorRef.current.dispose === 'function') {
          detectorRef.current.dispose();
        }
        detectorRef.current = null;
      }
    };
  }, [isLoopActive, videoRef, onGesture, setIsDetecting]);
};
