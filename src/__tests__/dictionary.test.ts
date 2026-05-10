import { describe, it, expect } from 'vitest';
import { lookupWord } from '../core/emotion/dictionary';

describe('Emotion Dictionary', () => {
  it('has ≥20 emotion words', () => {
    const emotionWords = ['快乐', '开心', '悲伤', '愤怒', '平静', '焦虑', '温柔', '孤独',
      '兴奋', '忧郁', '恐惧', '感动', '放松', '紧张', '浪漫', '思念', '希望', '绝望', '宁静', '热情'];
    let count = 0;
    for (const w of emotionWords) {
      if (lookupWord(w)) count++;
    }
    expect(count).toBeGreaterThanOrEqual(20);
  });

  it('has ≥10 scene words', () => {
    const sceneWords = ['森林', '海边', '夜晚', '雨天', '日出', '星空', '城市', '花园',
      'forest', 'ocean', 'night', 'sunrise'];
    let count = 0;
    for (const w of sceneWords) {
      if (lookupWord(w)) count++;
    }
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it('has ≥5 style words', () => {
    const styleWords = ['古典', '电子', '爵士', '摇滚', '民谣', 'classical', 'electronic', 'jazz', 'rock'];
    let count = 0;
    for (const w of styleWords) {
      if (lookupWord(w)) count++;
    }
    expect(count).toBeGreaterThanOrEqual(5);
  });

  it('all entries have 4 dimensions in [-1, 1]', () => {
    const allWords = ['快乐', '悲伤', '愤怒', '平静', '森林', '海边', '古典', '电子',
      'happy', 'sad', 'calm', 'forest', 'classical'];
    for (const w of allWords) {
      const entry = lookupWord(w);
      if (entry) {
        expect(entry).toHaveLength(4);
        for (const v of entry) {
          expect(v).toBeGreaterThanOrEqual(-1);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('case-insensitive English lookup', () => {
    expect(lookupWord('Happy')).toEqual(lookupWord('happy'));
    expect(lookupWord('CALM')).toEqual(lookupWord('calm'));
  });

  it('returns null for unknown words', () => {
    expect(lookupWord('xyzabc')).toBeNull();
    expect(lookupWord('')).toBeNull();
  });
});
