import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../stores/appStore';
import { useSessionStore } from '../stores/sessionStore';
import { VOID_WORLD } from '../types';
import type { DrawingPoint } from '../types';

describe('State Machine - complete flow', () => {
  beforeEach(() => {
    useAppStore.setState({ phase: 'void', isTransitioning: false });
    useSessionStore.setState({
      emotionVector: { valence: 0, arousal: 0, tension: 0, warmth: 0 },
      worldState: VOID_WORLD,
      playbackState: 'idle',
      volume: 0.8,
      inputMode: 'text',
    });
  });

  it('full flow: void → emerging → emerged → void', () => {
    vi.useFakeTimers();
    const app = useAppStore.getState();

    // Start in void
    expect(useAppStore.getState().phase).toBe('void');

    // Begin emergence
    app.beginEmergence();
    expect(useAppStore.getState().phase).toBe('emerging');
    expect(useAppStore.getState().isTransitioning).toBe(true);

    // After 1s, should be emerged
    vi.advanceTimersByTime(1000);
    expect(useAppStore.getState().phase).toBe('emerged');
    expect(useAppStore.getState().isTransitioning).toBe(false);

    // Return to void
    useAppStore.getState().returnToVoid();
    expect(useAppStore.getState().phase).toBe('void');

    vi.useRealTimers();
  });

  it('cannot begin emergence during transition', () => {
    useAppStore.getState().beginEmergence();
    expect(useAppStore.getState().isTransitioning).toBe(true);
    // Try again during transition
    useAppStore.getState().beginEmergence();
    expect(useAppStore.getState().phase).toBe('emerging');
  });

  it('cannot return to void during transition', () => {
    vi.useFakeTimers();
    useAppStore.getState().beginEmergence();
    // Try to return during transition
    useAppStore.getState().returnToVoid();
    expect(useAppStore.getState().phase).toBe('emerging');
    vi.useRealTimers();
  });

  it('cannot return to void when already in void', () => {
    useAppStore.getState().returnToVoid();
    expect(useAppStore.getState().phase).toBe('void');
  });
});

describe('Session - text input flow', () => {
  beforeEach(() => {
    useSessionStore.setState({
      emotionVector: { valence: 0, arousal: 0, tension: 0, warmth: 0 },
      worldState: VOID_WORLD,
      playbackState: 'idle',
      volume: 0.8,
      inputMode: 'text',
    });
  });

  it('submitText with emotion word triggers full pipeline', () => {
    useSessionStore.getState().submitText('快乐');
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('playing');
    expect(state.emotionVector.valence).toBeGreaterThan(0);
    expect(state.worldState.brightness).toBeGreaterThan(VOID_WORLD.brightness);
  });

  it('submitText with unrecognized text still sets playing state', () => {
    useSessionStore.getState().submitText('xyz123');
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('playing');
    // Neutral emotion → neutral world
    expect(state.emotionVector).toEqual({ valence: 0, arousal: 0, tension: 0, warmth: 0 });
  });

  it('different emotions produce different worlds', () => {
    useSessionStore.getState().submitText('快乐');
    const happyWorld = { ...useSessionStore.getState().worldState };

    useSessionStore.getState().submitText('悲伤');
    const sadWorld = useSessionStore.getState().worldState;

    expect(happyWorld.brightness).not.toEqual(sadWorld.brightness);
  });

  it('submitText with empty string still processes (no crash)', () => {
    useSessionStore.getState().submitText('');
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('playing');
  });
});

describe('Session - drawing input flow', () => {
  beforeEach(() => {
    useSessionStore.setState({
      emotionVector: { valence: 0, arousal: 0, tension: 0, warmth: 0 },
      worldState: VOID_WORLD,
      playbackState: 'idle',
      volume: 0.8,
      inputMode: 'drawing',
    });
  });

  it('submitDrawing with valid strokes triggers full pipeline', () => {
    const strokes: DrawingPoint[][] = [[
      { x: 0, y: 50, pressure: 0.5, timestamp: 0 },
      { x: 100, y: 50, pressure: 0.5, timestamp: 100 },
      { x: 200, y: 100, pressure: 0.5, timestamp: 200 },
    ]];
    useSessionStore.getState().submitDrawing(strokes);
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('playing');
    expect(state.worldState).not.toEqual(VOID_WORLD);
  });

  it('submitDrawing with empty array still sets playing', () => {
    useSessionStore.getState().submitDrawing([]);
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('playing');
  });
});

describe('Session - playback controls', () => {
  beforeEach(() => {
    useSessionStore.setState({ playbackState: 'idle', volume: 0.8 });
  });

  it('toggle: idle → playing → paused → playing', () => {
    useSessionStore.getState().togglePlayback();
    expect(useSessionStore.getState().playbackState).toBe('playing');

    useSessionStore.getState().togglePlayback();
    expect(useSessionStore.getState().playbackState).toBe('paused');

    useSessionStore.getState().togglePlayback();
    expect(useSessionStore.getState().playbackState).toBe('playing');
  });

  it('toggle does nothing in buffering state', () => {
    useSessionStore.setState({ playbackState: 'buffering' });
    useSessionStore.getState().togglePlayback();
    expect(useSessionStore.getState().playbackState).toBe('buffering');
  });

  it('volume clamps to [0, 1]', () => {
    useSessionStore.getState().setVolume(0.5);
    expect(useSessionStore.getState().volume).toBe(0.5);

    useSessionStore.getState().setVolume(2);
    expect(useSessionStore.getState().volume).toBe(1);

    useSessionStore.getState().setVolume(-1);
    expect(useSessionStore.getState().volume).toBe(0);
  });

  it('volume accepts boundary values', () => {
    useSessionStore.getState().setVolume(0);
    expect(useSessionStore.getState().volume).toBe(0);

    useSessionStore.getState().setVolume(1);
    expect(useSessionStore.getState().volume).toBe(1);
  });
});

describe('Session - input mode switching', () => {
  beforeEach(() => {
    useSessionStore.setState({ inputMode: 'text', playbackState: 'playing' });
  });

  it('switches from text to drawing', () => {
    useSessionStore.getState().switchInputMode('drawing');
    expect(useSessionStore.getState().inputMode).toBe('drawing');
  });

  it('switches from drawing to text', () => {
    useSessionStore.setState({ inputMode: 'drawing' });
    useSessionStore.getState().switchInputMode('text');
    expect(useSessionStore.getState().inputMode).toBe('text');
  });

  it('mode switch does not interrupt playback', () => {
    useSessionStore.getState().switchInputMode('drawing');
    expect(useSessionStore.getState().playbackState).toBe('playing');
  });
});

describe('Session - clear world', () => {
  it('clearWorld resets all session state', () => {
    useSessionStore.getState().submitText('快乐');
    expect(useSessionStore.getState().playbackState).toBe('playing');

    useSessionStore.getState().clearWorld();
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('idle');
    expect(state.emotionVector).toEqual({ valence: 0, arousal: 0, tension: 0, warmth: 0 });
    expect(state.worldState).toEqual(VOID_WORLD);
  });
});

describe('Edge cases - rapid operations', () => {
  beforeEach(() => {
    useSessionStore.setState({
      emotionVector: { valence: 0, arousal: 0, tension: 0, warmth: 0 },
      worldState: VOID_WORLD,
      playbackState: 'idle',
      volume: 0.8,
      inputMode: 'text',
    });
  });

  it('rapid submitText calls do not crash', () => {
    for (let i = 0; i < 100; i++) {
      useSessionStore.getState().submitText('快乐');
    }
    expect(useSessionStore.getState().playbackState).toBe('playing');
  });

  it('rapid togglePlayback calls maintain consistent state', () => {
    useSessionStore.setState({ playbackState: 'playing' });
    for (let i = 0; i < 50; i++) {
      useSessionStore.getState().togglePlayback();
    }
    // 50 toggles from playing: should end at playing (even number)
    expect(useSessionStore.getState().playbackState).toBe('playing');
  });

  it('rapid volume changes do not crash', () => {
    for (let i = 0; i < 100; i++) {
      useSessionStore.getState().setVolume(Math.random() * 2 - 0.5);
    }
    const vol = useSessionStore.getState().volume;
    expect(vol).toBeGreaterThanOrEqual(0);
    expect(vol).toBeLessThanOrEqual(1);
  });

  it('rapid mode switches do not crash', () => {
    for (let i = 0; i < 100; i++) {
      useSessionStore.getState().switchInputMode(i % 2 === 0 ? 'drawing' : 'text');
    }
    expect(['text', 'drawing']).toContain(useSessionStore.getState().inputMode);
  });
});
