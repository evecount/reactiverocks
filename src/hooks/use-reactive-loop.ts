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

  const lastRunTime = useRef<number>(0);

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
      const tf = await import('@tensorflow/tfjs');
      const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');
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
          await import('@tensorflow/tfjs-backend-wasm');
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
          modelType: 'full',
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
      if (disposed) return;

      const now = Date.now();
      // Throttling: Check if enough time has passed (50ms = ~20 FPS)
      if (now - lastRunTime.current >= 50) {
        if (
          videoRef.current &&
          detectorRef.current &&
          videoRef.current.readyState >= 2
        ) {
          try {
            const hands = await detectorRef.current.estimateHands(videoRef.current, {
              flipHorizontal: true
            });

            if (hands.length > 0 && hands[0].keypoints) {
              const keypoints: Keypoint[] = hands[0].keypoints;
              const wrist = keypoints[0];

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

                  // Detect Bounce
                  if (Math.abs(velocity) > BOUNCE_THRESHOLD) {
                    gesture = velocity < 0 ? "Moving Up" : "Moving Down";
                    confidence = Math.min(Math.abs(velocity) / 20, 1);
                  } else {
                    // Static Gesture Classification
                    const isExtendedConfig = (tipIdx: number, pipIdx: number) => {
                      const tip = keypoints[tipIdx];
                      const pip = keypoints[pipIdx];
                      if (!tip || !pip) return false;
                      const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
                      const dPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
                      return dTip > dPip;
                    };

                    const indexExt = isExtendedConfig(8, 6);
                    const middleExt = isExtendedConfig(12, 10);
                    const ringExt = isExtendedConfig(16, 14);
                    const pinkyExt = isExtendedConfig(20, 18);

                    const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

                    if (extendedCount >= 3) {
                      gesture = "paper";
                    } else if (extendedCount === 2) {
                      gesture = "scissors";
                    } else {
                      gesture = "rock";
                    }

                    confidence = 0.9;
                  }
                }

                onGesture(keypoints, gesture, confidence);
              } else {
                onGesture([], "None", 0);
              }
            }
          } catch (error) {
            console.error("Error during hand estimation:", error);
          }
        }
        lastRunTime.current = now;
      }

      animationFrameId.current = requestAnimationFrame(detect);
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
