import { describe, it, expect } from 'vitest';
import { analyzeText } from '../core/emotion/analyzeText';
import { analyzeDrawing } from '../core/emotion/analyzeDrawing';
import type { DrawingPoint } from '../types';

describe('analyzeText', () => {
  it('returns neutral emotion + suggestions for unrecognized text', () => {
    const result = analyzeText('asdfghjkl');
    expect(result.emotion).toEqual({ valence: 0, arousal: 0, tension: 0, warmth: 0 });
    expect(result.matchedWords).toHaveLength(0);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });

  it('returns neutral emotion for empty string', () => {
    const result = analyzeText('');
    expect(result.emotion).toEqual({ valence: 0, arousal: 0, tension: 0, warmth: 0 });
    expect(result.matchedWords).toHaveLength(0);
  });

  it('recognizes Chinese emotion words', () => {
    const result = analyzeText('快乐');
    expect(result.matchedWords).toContain('快乐');
    expect(result.emotion.valence).toBeGreaterThan(0.5);
  });

  it('recognizes English emotion words', () => {
    const result = analyzeText('happy');
    expect(result.matchedWords).toContain('happy');
    expect(result.emotion.valence).toBeGreaterThan(0.5);
  });

  it('recognizes scene words', () => {
    const result = analyzeText('森林');
    expect(result.matchedWords).toContain('森林');
    expect(result.emotion.valence).toBeGreaterThan(0);
  });

  it('recognizes style words', () => {
    const result = analyzeText('电子');
    expect(result.matchedWords).toContain('电子');
    expect(result.emotion.arousal).toBeGreaterThan(0.5);
  });

  it('handles mixed Chinese and English', () => {
    const result = analyzeText('我感到happy和快乐');
    expect(result.matchedWords.length).toBeGreaterThanOrEqual(2);
    expect(result.emotion.valence).toBeGreaterThan(0.5);
  });

  it('clamps all emotion values to [-1, 1]', () => {
    const result = analyzeText('快乐 开心 兴奋 热情 希望');
    const { valence, arousal, tension, warmth } = result.emotion;
    expect(valence).toBeGreaterThanOrEqual(-1);
    expect(valence).toBeLessThanOrEqual(1);
    expect(arousal).toBeGreaterThanOrEqual(-1);
    expect(arousal).toBeLessThanOrEqual(1);
    expect(tension).toBeGreaterThanOrEqual(-1);
    expect(tension).toBeLessThanOrEqual(1);
    expect(warmth).toBeGreaterThanOrEqual(-1);
    expect(warmth).toBeLessThanOrEqual(1);
  });

  it('different emotions produce distinguishable vectors', () => {
    const happy = analyzeText('快乐');
    const sad = analyzeText('悲伤');
    expect(happy.emotion.valence).toBeGreaterThan(sad.emotion.valence);
  });

  it('handles very long text (500 chars)', () => {
    const longText = '快乐'.repeat(250);
    const result = analyzeText(longText);
    expect(result.emotion.valence).toBeGreaterThan(0);
    // Should not throw or hang
  });

  it('handles text with only punctuation/numbers', () => {
    const result = analyzeText('12345!@#$%');
    expect(result.emotion).toEqual({ valence: 0, arousal: 0, tension: 0, warmth: 0 });
  });
});

describe('analyzeDrawing', () => {
  it('returns neutral emotion for empty strokes', () => {
    const result = analyzeDrawing([]);
    expect(result).toEqual({ valence: 0, arousal: 0, tension: 0, warmth: 0 });
  });

  it('returns neutral for single-point strokes', () => {
    const result = analyzeDrawing([[{ x: 50, y: 50, pressure: 0.5, timestamp: 0 }]]);
    // Single point stroke is skipped (< 2 points)
    expect(result.valence).toBeDefined();
  });

  it('fast strokes produce higher arousal', () => {
    const fastStroke: DrawingPoint[] = [
      { x: 0, y: 150, pressure: 0.5, timestamp: 0 },
      { x: 200, y: 150, pressure: 0.5, timestamp: 50 },
    ];
    const slowStroke: DrawingPoint[] = [
      { x: 0, y: 150, pressure: 0.5, timestamp: 0 },
      { x: 200, y: 150, pressure: 0.5, timestamp: 2000 },
    ];
    const fast = analyzeDrawing([fastStroke]);
    const slow = analyzeDrawing([slowStroke]);
    expect(fast.arousal).toBeGreaterThan(slow.arousal);
  });

  it('curvy strokes produce higher tension', () => {
    const curvy: DrawingPoint[] = [
      { x: 0, y: 0, pressure: 0.5, timestamp: 0 },
      { x: 50, y: 100, pressure: 0.5, timestamp: 100 },
      { x: 100, y: 0, pressure: 0.5, timestamp: 200 },
      { x: 150, y: 100, pressure: 0.5, timestamp: 300 },
    ];
    const straight: DrawingPoint[] = [
      { x: 0, y: 150, pressure: 0.5, timestamp: 0 },
      { x: 50, y: 150, pressure: 0.5, timestamp: 100 },
      { x: 100, y: 150, pressure: 0.5, timestamp: 200 },
      { x: 150, y: 150, pressure: 0.5, timestamp: 300 },
    ];
    const curvyResult = analyzeDrawing([curvy]);
    const straightResult = analyzeDrawing([straight]);
    expect(curvyResult.tension).toBeGreaterThan(straightResult.tension);
  });

  it('high position (low y) produces higher valence', () => {
    const highStroke: DrawingPoint[] = [
      { x: 0, y: 10, pressure: 0.5, timestamp: 0 },
      { x: 100, y: 10, pressure: 0.5, timestamp: 100 },
    ];
    const lowStroke: DrawingPoint[] = [
      { x: 0, y: 290, pressure: 0.5, timestamp: 0 },
      { x: 100, y: 290, pressure: 0.5, timestamp: 100 },
    ];
    const high = analyzeDrawing([highStroke]);
    const low = analyzeDrawing([lowStroke]);
    expect(high.valence).toBeGreaterThan(low.valence);
  });

  it('clamps all values to [-1, 1]', () => {
    const extremeStroke: DrawingPoint[] = [
      { x: 0, y: 0, pressure: 1, timestamp: 0 },
      { x: 1000, y: 1000, pressure: 1, timestamp: 1 },
    ];
    const result = analyzeDrawing([extremeStroke]);
    expect(result.valence).toBeGreaterThanOrEqual(-1);
    expect(result.valence).toBeLessThanOrEqual(1);
    expect(result.arousal).toBeGreaterThanOrEqual(-1);
    expect(result.arousal).toBeLessThanOrEqual(1);
    expect(result.tension).toBeGreaterThanOrEqual(-1);
    expect(result.tension).toBeLessThanOrEqual(1);
    expect(result.warmth).toBeGreaterThanOrEqual(-1);
    expect(result.warmth).toBeLessThanOrEqual(1);
  });

  it('handles multiple strokes (up to 4)', () => {
    const stroke: DrawingPoint[] = [
      { x: 0, y: 50, pressure: 0.5, timestamp: 0 },
      { x: 100, y: 50, pressure: 0.5, timestamp: 100 },
    ];
    const result = analyzeDrawing([stroke, stroke, stroke, stroke]);
    expect(result.valence).toBeDefined();
  });

  it('short stroke (< 10px) still processes if points exist', () => {
    const shortStroke: DrawingPoint[] = [
      { x: 0, y: 0, pressure: 0.5, timestamp: 0 },
      { x: 3, y: 4, pressure: 0.5, timestamp: 100 },
    ];
    // analyzeDrawing doesn't filter short strokes - that's DrawingCanvas's job
    const result = analyzeDrawing([shortStroke]);
    expect(result).toBeDefined();
  });
});
