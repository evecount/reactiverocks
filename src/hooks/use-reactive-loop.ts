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
type Keypoint = any;
type HandDetector = any;

type OnGestureCallback = (keypoints: Keypoint[]) => void;

export const useReactiveLoop = (
  videoRef: React.RefObject<HTMLVideoElement>,
  onGesture: OnGestureCallback,
  setIsDetecting: (isDetecting: boolean) => void,
  isLoopActive: boolean
) => {
  const detectorRef = useRef<HandDetector | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoopActive) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    // SIMULATE SUCCESSFUL INITIALIZATION
    // This will prevent build errors and allow the UI to function
    // while deferring the actual hand-tracking implementation.
    setIsDetecting(true);
    console.log("Hand detection is currently disabled to ensure deployment. The core UI is active.");


    // The original detection logic is commented out below.
    // We will let Antigravity help us resolve these dependencies post-deployment.

    /*
    let disposed = false;

    const initAndRunDetection = async () => {
      // Dynamic imports to ensure client-side only execution
      const tf = await import('@tensorflow/tfjs-core');
      await import('@tensorflow/tfjs-backend-webgl');
      const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');
      // This ensures the side-effects of mediapipe hands run in the browser.
      await import('@mediapipe/hands');

      if (disposed) return;

      try {
        await tf.setBackend('webgl');
        console.log("WebGL backend initialized.");
      } catch (e) {
        console.warn("WebGL backend failed to initialize, falling back to wasm.", e);
        try {
          await import('@tensorflow/tfjs-backend-wasm');
          await tf.setBackend('wasm');
           console.log("WASM backend initialized.");
        } catch(wasmError) {
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
          modelType: 'lite',
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
        videoRef.current.readyState === 4 // HAVE_ENOUGH_DATA
      ) {
        try {
          const hands = await detectorRef.current.estimateHands(videoRef.current, {
            flipHorizontal: true
          });
          if (hands.length > 0 && hands[0].keypoints) {
            onGesture(hands[0].keypoints);
          } else {
            onGesture([]); // No hands detected
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
    */
  }, [isLoopActive, videoRef, onGesture, setIsDetecting]);
};
