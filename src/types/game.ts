
export type Gesture = 'rock' | 'paper' | 'scissors' | 'unknown';

export interface GameState {
    userGesture: Gesture;
    aiGesture: Gesture;
    winner: 'user' | 'ai' | 'draw' | null;
    isThinking: boolean;
    status: 'idle' | 'countdown' | 'playing' | 'result';
}

export interface AudioConfig {
    sampleRate: number;
    channels: number;
}
