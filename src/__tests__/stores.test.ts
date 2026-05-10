import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../stores/appStore';
import { useSessionStore } from '../stores/sessionStore';
import { VOID_WORLD } from '../types';

describe('AppState store - state machine', () => {
  beforeEach(() => {
    useAppStore.setState({ phase: 'void', isTransitioning: false });
  });

  it('starts in void phase', () => {
    expect(useAppStore.getState().phase).toBe('void');
    expect(useAppStore.getState().isTransitioning).toBe(false);
  });

  it('transitions void → emerging on beginEmergence', () => {
    useAppStore.getState().beginEmergence();
    expect(useAppStore.getState().phase).toBe('emerging');
    expect(useAppStore.getState().isTransitioning).toBe(true);
  });

  it('transitions emerging → emerged after 1s', () => {
    vi.useFakeTimers();
    useAppStore.getState().beginEmergence();
    vi.advanceTimersByTime(1000);
    expect(useAppStore.getState().phase).toBe('emerged');
    expect(useAppStore.getState().isTransitioning).toBe(false);
    vi.useRealTimers();
  });

  it('ignores beginEmergence when not in void', () => {
    useAppStore.setState({ phase: 'emerged', isTransitioning: false });
    useAppStore.getState().beginEmergence();
    expect(useAppStore.getState().phase).toBe('emerged');
  });

  it('returnToVoid resets to void from emerged', () => {
    useAppStore.setState({ phase: 'emerged', isTransitioning: false });
    useAppStore.getState().returnToVoid();
    expect(useAppStore.getState().phase).toBe('void');
  });
});

describe('SessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      emotionVector: { valence: 0, arousal: 0, tension: 0, warmth: 0 },
      worldState: VOID_WORLD,
      playbackState: 'idle',
      volume: 0.8,
      inputMode: 'text',
    });
  });

  it('submitText updates emotion and world, starts playing', () => {
    useSessionStore.getState().submitText('快乐');
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('playing');
    expect(state.emotionVector.valence).toBeGreaterThan(0);
  });

  it('submitDrawing updates emotion and world, starts playing', () => {
    useSessionStore.getState().submitDrawing([
      [
        { x: 0, y: 0, pressure: 0.5, timestamp: 0 },
        { x: 100, y: 50, pressure: 0.5, timestamp: 100 },
      ],
    ]);
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('playing');
  });

  it('togglePlayback: idle → playing', () => {
    useSessionStore.getState().togglePlayback();
    expect(useSessionStore.getState().playbackState).toBe('playing');
  });

  it('togglePlayback: playing → paused', () => {
    useSessionStore.setState({ playbackState: 'playing' });
    useSessionStore.getState().togglePlayback();
    expect(useSessionStore.getState().playbackState).toBe('paused');
  });

  it('switchInputMode changes mode', () => {
    useSessionStore.getState().switchInputMode('drawing');
    expect(useSessionStore.getState().inputMode).toBe('drawing');
  });

  it('clearWorld resets to defaults', () => {
    useSessionStore.getState().submitText('快乐');
    useSessionStore.getState().clearWorld();
    const state = useSessionStore.getState();
    expect(state.playbackState).toBe('idle');
    expect(state.emotionVector).toEqual({ valence: 0, arousal: 0, tension: 0, warmth: 0 });
  });

  it('setVolume clamps to [0, 1]', () => {
    useSessionStore.getState().setVolume(1.5);
    expect(useSessionStore.getState().volume).toBe(1);
    useSessionStore.getState().setVolume(-0.5);
    expect(useSessionStore.getState().volume).toBe(0);
  });
});
