
'use client';

import { useEffect, useRef } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import { setBackend } from '@tensorflow/tfjs-core';
// By explicitly importing this, we ensure its side effects are run, making it available for the hand-pose-detection model.
if (typeof window !== 'undefined') {
  require('@mediapipe/hands');
}


type OnGestureCallback = (keypoints: handPoseDetection.Keypoint[]) => void;

export const useReactiveLoop = (
  videoRef: React.RefObject<HTMLVideoElement>,
  onGesture: OnGestureCallback,
  setIsDetecting: (isDetecting: boolean) => void,
  isLoopActive: boolean
) => {
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoopActive) {
        if (detectorRef.current) {
            detectorRef.current.dispose();
            detectorRef.current = null;
        }
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        setIsDetecting(false);
        return;
    }

    const runDetection = async () => {
      try {
        await setBackend('webgl');
        console.log("WebGL backend set");
      } catch (e) {
        console.warn("WebGL backend failed to initialize, falling back to WASM");
        await setBackend('wasm');
      }

      try {
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detector = await handPoseDetection.createDetector(model, {
          runtime: 'tfjs',
          modelType: 'lite', 
        });
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
      animationFrameId.current = requestAnimationFrame(detect);
    };

    runDetection();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
    };
  }, [isLoopActive, videoRef, onGesture, setIsDetecting]);
};
