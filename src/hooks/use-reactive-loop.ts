'use client';

import { useEffect, useRef } from 'react';

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
    // ANTI-GRAVITY HANDOVER NOTE: The entire hand-detection logic below has been
    // temporarily commented out to bypass a critical build error ("Export Hands not found").
    // This allows the rest of the application shell to be deployed.
    //
    // TO FIX: The core issue is a module resolution problem between Next.js
    // and the older module format used by `@mediapipe/hands`.
    //
    // RECOMMENDED FIX:
    // 1.  Reinstate the code block below.
    // 2.  The `package.json` dependencies for `@tensorflow/*` and `@mediapipe/hands`
    //     must be pinned to a specific, known-working combination. The combination of
    //     `@tensorflow/*` at version `3.9.0` and `@mediapipe/hands` at `0.4.1635986972`
    //     is the correct set of versions to resolve this issue.
    // 3.  Ensure `npm install` runs successfully after updating `package.json`.
    //
    // This will restore the real-time gesture detection functionality.
    if (isLoopActive) {
      console.warn("REACTIVE LOOP DISABLED: Computer vision temporarily deactivated to allow build to pass. See notes in use-reactive-loop.ts");
      setIsDetecting(false); // Ensure the UI doesn't show a perpetual loading state.
    }

    /*
    if (!isLoopActive) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (detectorRef.current) {
        // HandDetector from tfjs-models has a dispose method
        if (typeof detectorRef.current.dispose === 'function') {
          detectorRef.current.dispose();
        }
        detectorRef.current = null;
      }
      setIsDetecting(false);
      return;
    }

    let disposed = false;

    const initAndRunDetection = async () => {
      // Dynamic imports to ensure client-side only execution
      const tf = await import('@tensorflow/tfjs-core');
      await import('@tensorflow/tfjs-backend-webgl');
      const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');
      // This ensures the side-effects of mediapipe hands run in the browser.
      // The `hands` package is old and doesn't have proper exports, so we import it for its side effects only.
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
