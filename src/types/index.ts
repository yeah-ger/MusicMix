export interface EmotionVector {
  valence: number;
  arousal: number;
  tension: number;
  warmth: number;
}

export interface WorldState {
  hue: number;
  saturation: number;
  brightness: number;
  colorVariance: number;
  colorTemperature: number;
  colorDepth: number;
  particleDensity: number;
  motionSpeed: number;
  turbulence: number;
  scale: number;
  symmetry: number;
  complexity: number;
}

export const VOID_WORLD: WorldState = {
  hue: 0, saturation: 0, brightness: 0,
  colorVariance: 0, colorTemperature: 0, colorDepth: 0,
  particleDensity: 0, motionSpeed: 0, turbulence: 0,
  scale: 0, symmetry: 0, complexity: 0,
};

export function lerpWorld(a: WorldState, b: WorldState, t: number): WorldState {
  const u = Math.min(1, Math.max(0, t));
  const l = (x: number, y: number) => x + (y - x) * u;
  return {
    hue: l(a.hue, b.hue), saturation: l(a.saturation, b.saturation),
    brightness: l(a.brightness, b.brightness), colorVariance: l(a.colorVariance, b.colorVariance),
    colorTemperature: l(a.colorTemperature, b.colorTemperature), colorDepth: l(a.colorDepth, b.colorDepth),
    particleDensity: l(a.particleDensity, b.particleDensity), motionSpeed: l(a.motionSpeed, b.motionSpeed),
    turbulence: l(a.turbulence, b.turbulence), scale: l(a.scale, b.scale),
    symmetry: l(a.symmetry, b.symmetry), complexity: l(a.complexity, b.complexity),
  };
}

export interface SpectrumData {
  low: number;
  mid: number;
  high: number;
  beatPhase: number;
}

export const EMPTY_SPECTRUM: SpectrumData = { low: 0, mid: 0, high: 0, beatPhase: 0 };

export interface DrawingPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'buffering';
export type InputMode = 'text' | 'drawing';
export type AppPhase = 'void' | 'emerging' | 'emerged';
