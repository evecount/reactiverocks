
/**
 * QuinceState: The self-referential memory of the Reactive Loop.
 */
export interface QuinceState {
  // Fold 1: Spatial Recursion
  spatial: {
    lastKeypoints: Array<{ x: number; y: number; z: number }>;
    residualVector: number[]; // The %r calculation
    confidence: number;       // Current tracking fidelity
  };

  // Fold 2: Temporal Recursion
  temporal: {
    gestureHistory: string[]; // Last 5 detected frames to prevent "flicker"
    activePersona: 'STOIC' | 'PUCK' | 'LITHIC'; 
    momentum: number;         // How "locked in" the current gesture is
  };

  // Fold 3: Semantic Recursion
  semantic: {
    lastAiToken: string;      // The last word Gemini spoke
    personaDrift: number;     // 0 to 1: How far the AI has moved from its baseline
    syncEntropy: number;      // Measurement of human-machine biological lag
  };
}
