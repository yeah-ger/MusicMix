import type { EmotionVector, WorldState } from '../../types';

function norm(v: number): number { return (v + 1) / 2; } // [-1,1] → [0,1]

export function emotionToWorld(e: EmotionVector): WorldState {
  return {
    hue: e.warmth > 0 ? 0.05 + e.warmth * 0.1 : 0.55 + Math.abs(e.warmth) * 0.1,
    saturation: 0.3 + 0.5 * norm(e.arousal),
    brightness: 0.25 + 0.55 * norm(e.valence),
    colorVariance: 0.2 + 0.6 * Math.abs(e.tension),
    colorTemperature: norm(e.warmth),
    colorDepth: 0.3 + 0.4 * norm(e.valence),
    particleDensity: 0.2 + 0.6 * norm(e.arousal),
    motionSpeed: 0.1 + 0.8 * norm(e.arousal),
    turbulence: 0.1 + 0.7 * Math.abs(e.tension),
    scale: 0.3 + 0.5 * (1 - Math.abs(e.tension)),
    symmetry: 0.5 + 0.4 * (1 - Math.abs(e.tension)),
    complexity: norm(e.tension),
  };
}
