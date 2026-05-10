import { create } from 'zustand';
import type { EmotionVector, WorldState, PlaybackState, InputMode, DrawingPoint, SpectrumData } from '../types';
import { VOID_WORLD, EMPTY_SPECTRUM } from '../types';
import { analyzeText } from '../core/emotion/analyzeText';
import { analyzeDrawing } from '../core/emotion/analyzeDrawing';
import { emotionToWorld } from '../core/world/generateWorld';

const DEFAULT_EMOTION: EmotionVector = { valence: 0, arousal: 0, tension: 0, warmth: 0 };

export interface SessionState {
  emotionVector: EmotionVector;
  worldState: WorldState;
  playbackState: PlaybackState;
  volume: number;
  inputMode: InputMode;
  spectrum: SpectrumData;

  submitText: (text: string) => void;
  submitDrawing: (points: DrawingPoint[][]) => void;
  togglePlayback: () => void;
  switchInputMode: (mode: InputMode) => void;
  clearWorld: () => void;
  setVolume: (v: number) => void;
  setPlaybackState: (s: PlaybackState) => void;
  setSpectrum: (s: SpectrumData) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  emotionVector: DEFAULT_EMOTION,
  worldState: VOID_WORLD,
  playbackState: 'idle',
  volume: 0.8,
  inputMode: 'text',
  spectrum: EMPTY_SPECTRUM,

  submitText: (text: string) => {
    if (!text.trim()) return;
    const result = analyzeText(text);
    const world = emotionToWorld(result.emotion);
    set({ emotionVector: result.emotion, worldState: world, playbackState: 'playing' });
  },

  submitDrawing: (strokes: DrawingPoint[][]) => {
    if (strokes.length === 0) return;
    const emotion = analyzeDrawing(strokes);
    const world = emotionToWorld(emotion);
    set({ emotionVector: emotion, worldState: world, playbackState: 'playing' });
  },

  togglePlayback: () => {
    const { playbackState } = get();
    if (playbackState === 'playing') set({ playbackState: 'paused' });
    else if (playbackState === 'paused' || playbackState === 'idle') set({ playbackState: 'playing' });
  },

  switchInputMode: (mode: InputMode) => set({ inputMode: mode }),

  clearWorld: () => set({
    emotionVector: DEFAULT_EMOTION,
    worldState: VOID_WORLD,
    playbackState: 'idle',
    spectrum: EMPTY_SPECTRUM,
  }),

  setVolume: (v: number) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setPlaybackState: (s: PlaybackState) => set({ playbackState: s }),
  setSpectrum: (s: SpectrumData) => set({ spectrum: s }),
}));
