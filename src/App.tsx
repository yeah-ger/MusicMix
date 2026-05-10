import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from './stores/appStore';
import { useSessionStore } from './stores/sessionStore';
import { EmotionInput } from './input/EmotionInput';
import { MusicEngine } from './core/music/MusicEngine';
import './app.css';

const VisualizerCanvas = lazy(() => import('./visual/VisualizerCanvas'));

function ControlBar() {
  const playbackState = useSessionStore((s) => s.playbackState);
  const volume = useSessionStore((s) => s.volume);
  const togglePlayback = useSessionStore((s) => s.togglePlayback);
  const setVolume = useSessionStore((s) => s.setVolume);

  return (
    <div className="control-bar">
      <button className="btn btn--icon" onClick={togglePlayback} aria-label={playbackState === 'playing' ? '暂停' : '播放'}>
        {playbackState === 'playing' ? '⏸' : '▶'}
      </button>
      <input
        type="range" min="0" max="100" value={Math.round(volume * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        className="control-bar__volume" aria-label="音量"
      />
      <span className="control-bar__volume-label">{Math.round(volume * 100)}%</span>
    </div>
  );
}

function ClearWorldButton() {
  const [confirming, setConfirming] = useState(false);
  const clearWorld = useSessionStore((s) => s.clearWorld);
  const returnToVoid = useAppStore((s) => s.returnToVoid);

  const handleClear = () => {
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return; }
    clearWorld();
    returnToVoid();
    setConfirming(false);
  };

  return (
    <button className={`btn btn--danger${confirming ? ' btn--confirming' : ''}`} onClick={handleClear}>
      {confirming ? '确认清空？' : '清空世界'}
    </button>
  );
}

function VoidView() {
  const beginEmergence = useAppStore((s) => s.beginEmergence);
  const submitText = useSessionStore((s) => s.submitText);
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    beginEmergence();
    submitText(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="void-view">
      <h1 className="void-view__title">Music Palace</h1>
      <p className="void-view__subtitle">输入你的情绪，让音乐涌现</p>
      <div className="void-view__input">
        <input
          type="text" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你此刻的心情..."
          className="void-view__field" aria-label="情绪输入"
        />
        <button className="btn btn--primary" onClick={handleSubmit} disabled={!text.trim()}>
          开始
        </button>
      </div>
    </div>
  );
}

function EmergingView() {
  return (
    <div className="emerging-view">
      <div className="emerging-view__pulse" />
      <p className="emerging-view__text">世界正在涌现...</p>
    </div>
  );
}

function EmergedView() {
  return (
    <div className="emerged-view">
      <div className="emerged-view__top">
        <ClearWorldButton />
      </div>
      <div className="emerged-view__bottom">
        <EmotionInput />
        <ControlBar />
      </div>
    </div>
  );
}

export default function App() {
  const phase = useAppStore((s) => s.phase);
  const playbackState = useSessionStore((s) => s.playbackState);
  const emotionVector = useSessionStore((s) => s.emotionVector);
  const volume = useSessionStore((s) => s.volume);
  const setSpectrum = useSessionStore((s) => s.setSpectrum);
  const engineRef = useRef<MusicEngine | null>(null);

  // Music engine lifecycle
  const prevPlayback = useRef(playbackState);
  useEffect(() => {
    const prev = prevPlayback.current;
    prevPlayback.current = playbackState;

    if (playbackState === 'playing') {
      if (!engineRef.current) {
        engineRef.current = new MusicEngine();
        engineRef.current.onSpectrum(setSpectrum);
        engineRef.current.start(emotionVector);
      } else if (prev === 'paused') {
        engineRef.current.resume();
      } else {
        engineRef.current.updateEmotion(emotionVector);
      }
    } else if (playbackState === 'paused' && engineRef.current) {
      engineRef.current.pause();
    } else if (playbackState === 'idle' && engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  }, [playbackState, emotionVector, setSpectrum]);

  // Volume sync
  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  return (
    <div className="app">
      <div className="app__canvas">
        <Suspense fallback={null}>
          <VisualizerCanvas />
        </Suspense>
      </div>
      <div className={`app__ui app__ui--${phase}`}>
        {phase === 'void' && <VoidView />}
        {phase === 'emerging' && <EmergingView />}
        {phase === 'emerged' && <EmergedView />}
      </div>
    </div>
  );
}
