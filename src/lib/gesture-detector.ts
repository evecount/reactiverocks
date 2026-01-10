
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

type Move = 'rock' | 'paper' | 'scissors' | 'none';

// Function to calculate the distance between two keypoints
const getDistance = (p1: Keypoint, p2: Keypoint): number => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const detectGesture = (keypoints: Keypoint[]): Move => {
    if (keypoints.length === 0) {
        return 'none';
    }

    // Finger landmarks indices from MediaPipe
    const landmarks = {
        wrist: 0,
        thumb: { tip: 4, ip: 3, mcp: 2, cmc: 1 },
        index: { tip: 8, dip: 7, pip: 6, mcp: 5 },
        middle: { tip: 12, dip: 11, pip: 10, mcp: 9 },
        ring: { tip: 16, dip: 15, pip: 14, mcp: 13 },
        pinky: { tip: 20, dip: 19, pip: 18, mcp: 17 },
    };

    const fingersUp = {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false,
    };

    // Simple heuristic: check if finger tip is "above" its PIP joint (lower y value)
    if (keypoints[landmarks.thumb.tip].x < keypoints[landmarks.thumb.ip].x) {
        fingersUp.thumb = true;
    }
    if (keypoints[landmarks.index.tip].y < keypoints[landmarks.index.pip].y) {
        fingersUp.index = true;
    }
    if (keypoints[landmarks.middle.tip].y < keypoints[landmarks.middle.pip].y) {
        fingersUp.middle = true;
    }
    if (keypoints[landmarks.ring.tip].y < keypoints[landmarks.ring.pip].y) {
        fingersUp.ring = true;
    }
    if (keypoints[landmarks.pinky.tip].y < keypoints[landmarks.pinky.pip].y) {
        fingersUp.pinky = true;
    }

    const allFingersUp = Object.values(fingersUp).every(v => v === true);
    const noFingersUp = Object.values(fingersUp).every(v => v === false);

    if (allFingersUp) {
        return 'paper';
    }

    if (noFingersUp) {
        return 'rock';
    }

    if (fingersUp.index && fingersUp.middle && !fingersUp.ring && !fingersUp.pinky) {
        return 'scissors';
    }

    return 'none';
};
