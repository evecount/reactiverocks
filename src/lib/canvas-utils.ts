import { Keypoint } from '@tensorflow-models/hand-pose-detection';

const FINGER_JOINTS = [
    [0, 1, 2, 3, 4], // Thumb
    [0, 5, 6, 7, 8], // Index
    [0, 9, 10, 11, 12], // Middle
    [0, 13, 14, 15, 16], // Ring
    [0, 17, 18, 19, 20], // Pinky
];

const STYLE_RED = 'rgba(255, 0, 0, 0.8)';
const STYLE_BLUE = 'rgba(0, 255, 0, 0.8)';
const STYLE_WHITE = 'rgba(255, 255, 255, 1)';

export const drawHand = (
    ctx: CanvasRenderingContext2D,
    keypoints: Keypoint[],
    color: string = STYLE_BLUE
) => {
    if (keypoints.length === 0) return;

    // Draw Path (Bones)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    for (let i = 0; i < FINGER_JOINTS.length; i++) {
        const finger = FINGER_JOINTS[i];
        ctx.beginPath();
        for (let j = 0; j < finger.length; j++) {
            const k = keypoints[finger[j]];
            if (j === 0) {
                ctx.moveTo(k.x, k.y);
            } else {
                ctx.lineTo(k.x, k.y);
            }
        }
        ctx.stroke();
    }

    // Draw Joints (Latent Points)
    ctx.fillStyle = STYLE_WHITE;
    for (let i = 0; i < keypoints.length; i++) {
        const k = keypoints[i];
        ctx.beginPath();
        ctx.arc(k.x, k.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
};
