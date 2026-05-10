import { describe, it, expect } from 'vitest';
import { emotionToWorld } from '../core/world/generateWorld';
import { lerpWorld, VOID_WORLD } from '../types';
import type { EmotionVector } from '../types';

describe('emotionToWorld', () => {
  it('produces valid WorldState with all values in [0, 1]', () => {
    const emotions: EmotionVector[] = [
      { valence: 0, arousal: 0, tension: 0, warmth: 0 },
      { valence: 1, arousal: 1, tension: 1, warmth: 1 },
      { valence: -1, arousal: -1, tension: -1, warmth: -1 },
      { valence: 0.5, arousal: -0.5, tension: 0.3, warmth: -0.7 },
    ];

    for (const e of emotions) {
      const w = emotionToWorld(e);
      expect(w.hue).toBeGreaterThanOrEqual(0);
      expect(w.hue).toBeLessThanOrEqual(1);
      expect(w.saturation).toBeGreaterThanOrEqual(0);
      expect(w.saturation).toBeLessThanOrEqual(1);
      expect(w.brightness).toBeGreaterThanOrEqual(0);
      expect(w.brightness).toBeLessThanOrEqual(1);
      expect(w.particleDensity).toBeGreaterThanOrEqual(0);
      expect(w.particleDensity).toBeLessThanOrEqual(1);
      expect(w.motionSpeed).toBeGreaterThanOrEqual(0);
      expect(w.motionSpeed).toBeLessThanOrEqual(1);
    }
  });

  it('high valence produces higher brightness', () => {
    const happy = emotionToWorld({ valence: 0.8, arousal: 0, tension: 0, warmth: 0 });
    const sad = emotionToWorld({ valence: -0.8, arousal: 0, tension: 0, warmth: 0 });
    expect(happy.brightness).toBeGreaterThan(sad.brightness);
  });

  it('high arousal produces higher motionSpeed and particleDensity', () => {
    const high = emotionToWorld({ valence: 0, arousal: 0.8, tension: 0, warmth: 0 });
    const low = emotionToWorld({ valence: 0, arousal: -0.8, tension: 0, warmth: 0 });
    expect(high.motionSpeed).toBeGreaterThan(low.motionSpeed);
    expect(high.particleDensity).toBeGreaterThan(low.particleDensity);
  });

  it('warm emotion produces warm hue (low value)', () => {
    const warm = emotionToWorld({ valence: 0, arousal: 0, tension: 0, warmth: 0.8 });
    const cold = emotionToWorld({ valence: 0, arousal: 0, tension: 0, warmth: -0.8 });
    expect(warm.hue).toBeLessThan(cold.hue);
  });

  it('different emotions produce distinguishable worlds (≥3 dimensions differ >10%)', () => {
    const e1: EmotionVector = { valence: 0.8, arousal: 0.5, tension: -0.3, warmth: 0.7 };
    const e2: EmotionVector = { valence: -0.6, arousal: -0.4, tension: 0.8, warmth: -0.5 };
    const w1 = emotionToWorld(e1);
    const w2 = emotionToWorld(e2);

    const keys = Object.keys(w1) as (keyof typeof w1)[];
    let diffCount = 0;
    for (const k of keys) {
      if (Math.abs(w1[k] - w2[k]) > 0.1) diffCount++;
    }
    expect(diffCount).toBeGreaterThanOrEqual(3);
  });
});

describe('lerpWorld', () => {
  it('t=0 returns first world', () => {
    const a = emotionToWorld({ valence: 0.5, arousal: 0.5, tension: 0.5, warmth: 0.5 });
    const b = emotionToWorld({ valence: -0.5, arousal: -0.5, tension: -0.5, warmth: -0.5 });
    const result = lerpWorld(a, b, 0);
    expect(result.hue).toBeCloseTo(a.hue);
    expect(result.brightness).toBeCloseTo(a.brightness);
  });

  it('t=1 returns second world', () => {
    const a = emotionToWorld({ valence: 0.5, arousal: 0.5, tension: 0.5, warmth: 0.5 });
    const b = emotionToWorld({ valence: -0.5, arousal: -0.5, tension: -0.5, warmth: -0.5 });
    const result = lerpWorld(a, b, 1);
    expect(result.hue).toBeCloseTo(b.hue);
    expect(result.brightness).toBeCloseTo(b.brightness);
  });

  it('t=0.5 returns midpoint', () => {
    const a = VOID_WORLD;
    const b = emotionToWorld({ valence: 1, arousal: 1, tension: 1, warmth: 1 });
    const result = lerpWorld(a, b, 0.5);
    expect(result.brightness).toBeCloseTo((a.brightness + b.brightness) / 2);
  });

  it('clamps t to [0, 1]', () => {
    const a = VOID_WORLD;
    const b = emotionToWorld({ valence: 1, arousal: 1, tension: 0, warmth: 1 });
    const over = lerpWorld(a, b, 2);
    const under = lerpWorld(a, b, -1);
    expect(over.brightness).toBeCloseTo(b.brightness);
    expect(under.brightness).toBeCloseTo(a.brightness);
  });
});
