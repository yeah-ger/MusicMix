import type { EmotionVector } from '../../types';
import { lookupWord } from './dictionary';

export interface TextAnalysisResult {
  emotion: EmotionVector;
  matchedWords: string[];
  suggestions?: string[];
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const chineseMatches = text.match(/[\u4e00-\u9fff]+/g) || [];
  for (const segment of chineseMatches) {
    let i = 0;
    while (i < segment.length) {
      let matched = false;
      for (let len = Math.min(4, segment.length - i); len >= 2; len--) {
        const sub = segment.slice(i, i + len);
        if (lookupWord(sub)) { tokens.push(sub); i += len; matched = true; break; }
      }
      if (!matched) i++;
    }
  }
  const englishMatches = text.match(/[a-zA-Z]+/g) || [];
  tokens.push(...englishMatches.map(w => w.toLowerCase()));
  return tokens;
}

function clamp(v: number): number { return Math.max(-1, Math.min(1, v)); }

export function analyzeText(text: string): TextAnalysisResult {
  const tokens = tokenize(text);
  const matchedWords: string[] = [];
  const sum: [number, number, number, number] = [0, 0, 0, 0];

  for (const token of tokens) {
    const entry = lookupWord(token);
    if (entry) { matchedWords.push(token); sum[0] += entry[0]; sum[1] += entry[1]; sum[2] += entry[2]; sum[3] += entry[3]; }
  }

  if (matchedWords.length === 0) {
    return { emotion: { valence: 0, arousal: 0, tension: 0, warmth: 0 }, matchedWords: [], suggestions: ['试试输入情绪词如"快乐"、"悲伤"，或场景词如"海边"、"森林"'] };
  }

  const n = matchedWords.length;
  return { emotion: { valence: clamp(sum[0] / n), arousal: clamp(sum[1] / n), tension: clamp(sum[2] / n), warmth: clamp(sum[3] / n) }, matchedWords };
}
