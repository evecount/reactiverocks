// Sovereign Architects: Antigravity x User
'use client';

import { useEffect, useRef } from 'react';
import { initializeFirebase } from '@/firebase/index';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ====================================================================================
// !! ANTIGRAVITY AGENT INSTRUCTIONS !!
// ====================================================================================
//
// STATUS:
// - TensorFlow.js dependencies: ENABLED
// - Recursive Residuals: ENABLED
// - Low-Pass Filter: ENABLED
// - Latent Event Stream: ENABLED
//
// ====================================================================================

// Define Keypoint type locally to avoid importing from the library in the type definition if possible,
// but for the hook usage we will use the implied types from the dynamic import or 'any' for simplicity during prototyping.
type Keypoint = { x: number; y: number; name?: string };
type HandDetector = any;

type OnGestureCallback = (keypoints: Keypoint[], gesture?: string, confidence?: number) => void;

const BUFFER_SIZE = 10;
const BOUNCE_THRESHOLD = 5;
const RESIDUAL_GAIN = 0.85; // 'r' coefficient

// 1. The Low-Pass Filter (Zero-Jitter)
class LowPassFilter {
  private alpha: number;
  private prevValue: number | null = null;

  constructor(alpha: number = 0.5) {
    this.alpha = alpha;
  }

  filter(value: number): number {
    if (this.prevValue === null) {
      this.prevValue = value;
      return value;
    }
    const smoothed = this.alpha * value + (1 - this.alpha) * this.prevValue;
    this.prevValue = smoothed;
    return smoothed;
  }

  reset() {
    this.prevValue = null;
  }
}

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
  const lastLoggedGesture = useRef<string>("None");

  // Filters for Wrist X/Y
  const filterX = useRef(new LowPassFilter(0.4)); // 0.4 = stronger smoothing
  const filterY = useRef(new LowPassFilter(0.4));

  // Initialize Firebase Firestore for Latent Stream
  const { firestore } = initializeFirebase();

  const pushToLatentEvents = async (gesture: string, confidence: number, vector: number[]) => {
    try {
      await addDoc(collection(firestore, 'Latent_Events'), {
        architect_id: 'user-001', // Static for prototype
        timestamp: serverTimestamp(),
        type: 'GESTURE_ENTROPY',
        metadata: {
          source: 'TensorFlow.js_FrontEnd',
          confidence_score: confidence,
          r_coefficient: RESIDUAL_GAIN,
        },
        payload: {
          unstructured_data: {
            raw_vector: vector,
            active_project: 'Reactive.rocks'
          }
        }
      });
    } catch (e) {
      console.warn("Failed to push Latent Event:", e);
    }
  };

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
      // Dynamic imports enabled
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
          } catch (err) {
            console.warn("WebGL initialization failed, using default.", err);
          }
        }
      } catch (e) {
        console.warn("TF Ready check failed or setup error", e);
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
      // Throttling: 50ms = ~20 FPS
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
              const rawKeypoints: Keypoint[] = hands[0].keypoints;
              const wrist = rawKeypoints[0];

              // 2. Apply Low-Pass Filter
              const smoothedWrist = {
                x: filterX.current.filter(wrist.x),
                y: filterY.current.filter(wrist.y),
                name: wrist.name
              };

              // Replace raw wrist in keypoints for the callback
              const keypoints = [...rawKeypoints];
              keypoints[0] = smoothedWrist;

              let gesture = "Unknown";
              let confidence = 0;

              if (smoothedWrist) {
                // Update Motion Vector Buffer
                motionBuffer.current.push(smoothedWrist.y);
                if (motionBuffer.current.length > BUFFER_SIZE) {
                  motionBuffer.current.shift();
                }

                // Calculate Velocity (Simple dy)
                if (motionBuffer.current.length >= 2) {
                  const currentY = motionBuffer.current[motionBuffer.current.length - 1];
                  const prevY = motionBuffer.current[motionBuffer.current.length - 2];
                  const velocity = currentY - prevY;

                  // 3. Speculative Prediction (Antigravity)
                  // I_(t+1) = I_t + r * (I_t - I_(t-1))
                  // We treat 'velocity' as the delta (I_t - I_(t-1))
                  const predictedY = currentY + (RESIDUAL_GAIN * velocity);

                  // Detect Bounce using Predicted State
                  // If prediction indicates a massive move, we trigger early
                  const predictedVelocity = predictedY - currentY;

                  if (Math.abs(predictedVelocity) > BOUNCE_THRESHOLD) {
                    gesture = predictedVelocity < 0 ? "Moving Up" : "Moving Down";
                    // Confidence scales with the "Aggression" of the move
                    confidence = Math.min(Math.abs(predictedVelocity) / 15, 1);
                  } else {
                    // Static Gesture Classification
                    const isExtendedConfig = (tipIdx: number, pipIdx: number) => {
                      const tip = keypoints[tipIdx];
                      const pip = keypoints[pipIdx];
                      if (!tip || !pip) return false;
                      const dTip = Math.hypot(tip.x - smoothedWrist.x, tip.y - smoothedWrist.y);
                      const dPip = Math.hypot(pip.x - smoothedWrist.x, pip.y - smoothedWrist.y);
                      return dTip > dPip;
                    };

                    const indexExt = isExtendedConfig(8, 6);
                    const middleExt = isExtendedConfig(12, 10);
                    const ringExt = isExtendedConfig(16, 14);
                    const pinkyExt = isExtendedConfig(20, 18);

                    // Count extended fingers (excluding thumb for core RPS logic)
                    const fingersExtended = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

                    // SCISSORS: Strictly Index & Middle UP. Ring & Pinky DOWN.
                    // We IGNORE the Thumb. Whether it's tucked or out, it's still Scissors.
                    if (indexExt && middleExt && !ringExt && !pinkyExt) {
                      gesture = "scissors";
                    } else if (fingersExtended >= 3) {
                      // 3+ fingers (excluding thumb) is definitely Paper
                      gesture = "paper";
                    } else if (fingersExtended === 0) {
                      // 0 fingers (excluding thumb) is definitely Rock
                      gesture = "rock";
                    } else {
                      // Ambiguous state (e.g. 1 finger) - Do NOT guess.
                      // Better to do nothing than to incorrectly guess Rock.
                      gesture = "none";
                    }

                    confidence = 0.95;
                  }
                }

                onGesture(keypoints, gesture, confidence);

                // Push to Latent_Events in Firestore
                if (confidence > 0.9 && gesture !== "None" && gesture !== lastLoggedGesture.current) {
                  pushToLatentEvents(gesture, confidence, [smoothedWrist.x, smoothedWrist.y]);
                  lastLoggedGesture.current = gesture;
                }
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

