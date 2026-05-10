import type { EmotionVector, DrawingPoint } from '../../types';

function clamp(v: number): number { return Math.max(-1, Math.min(1, v)); }

export function analyzeDrawing(strokes: DrawingPoint[][]): EmotionVector {
  if (strokes.length === 0) return { valence: 0, arousal: 0, tension: 0, warmth: 0 };

  let totalArousal = 0, totalTension = 0, totalValence = 0, totalWarmth = 0;

  for (const points of strokes) {
    if (points.length < 2) continue;

    // Speed → arousal
    let totalSpeed = 0;
    let totalCurvature = 0;
    let ySum = 0;
    let pressureSum = 0;

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dt = Math.max(1, points[i].timestamp - points[i - 1].timestamp);
      totalSpeed += Math.sqrt(dx * dx + dy * dy) / dt;
      ySum += points[i].y;
      pressureSum += points[i].pressure;

      if (i > 1) {
        const dx2 = points[i - 1].x - points[i - 2].x;
        const dy2 = points[i - 1].y - points[i - 2].y;
        const angle1 = Math.atan2(dy, dx);
        const angle2 = Math.atan2(dy2, dx2);
        totalCurvature += Math.abs(angle1 - angle2);
      }
    }

    const n = points.length - 1;
    const avgSpeed = totalSpeed / n;
    const avgCurvature = totalCurvature / Math.max(1, n - 1);
    const avgY = ySum / n;
    const avgPressure = pressureSum / n;

    // Map to emotion dimensions
    totalArousal += Math.min(1, avgSpeed / 2);  // fast = high arousal
    totalTension += Math.min(1, avgCurvature / Math.PI); // curvy = tense
    totalValence += 1 - (avgY / 300) * 2; // high position = positive (canvas ~300px)
    totalWarmth += avgPressure;
  }

  const count = strokes.length;
  return {
    valence: clamp(totalValence / count),
    arousal: clamp(totalArousal / count * 2 - 1),
    tension: clamp(totalTension / count * 2 - 1),
    warmth: clamp(totalWarmth / count * 2 - 1),
  };
}
