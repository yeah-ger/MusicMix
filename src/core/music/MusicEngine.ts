import type * as ToneNs from 'tone';
import type { EmotionVector, SpectrumData } from '../../types';

type ToneLib = typeof ToneNs;
let _tone: ToneLib | null = null;
const loadTone = async (): Promise<ToneLib> => {
  if (!_tone) _tone = await import('tone');
  return _tone;
};
const T = (): ToneLib => _tone!;

type MusicStyle = 'ambient' | 'classical' | 'electronic' | 'jazz' | 'pop';

interface MusicParams {
  bpm: number;
  key: string;
  style: MusicStyle;
  volume: number;
}

function emotionToMusicParams(e: EmotionVector): MusicParams {
  const bpm = Math.round(60 + 120 * ((e.arousal + 1) / 2));
  const style: MusicStyle = e.arousal > 0.3 ? (e.tension > 0.3 ? 'electronic' : 'pop')
    : e.warmth > 0.3 ? 'jazz' : e.valence < -0.3 ? 'classical' : 'ambient';
  const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const key = e.valence >= 0 ? keys[Math.floor(Math.abs(e.valence) * 6)] : keys[Math.floor(Math.abs(e.valence) * 6)] + 'm';
  return { bpm, key: key ?? 'C', style, volume: 0.8 };
}

const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

export class MusicEngine {
  private synth: ToneNs.PolySynth | null = null;
  private padSynth: ToneNs.PolySynth | null = null;
  private analyser: ToneNs.Analyser | null = null;
  private loopId: number | null = null;
  private spectrumCb: ((data: SpectrumData) => void) | null = null;
  private params: MusicParams = { bpm: 90, key: 'C', style: 'ambient', volume: 0.8 };
  private _isPlaying = false;
  private scheduledUntil = 0;
  private lastPitch = 60;

  async start(emotion: EmotionVector): Promise<void> {
    const Tone = await loadTone();
    await Tone.start();
    this.params = emotionToMusicParams(emotion);

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8 },
    }).toDestination();

    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.3, decay: 0.5, sustain: 0.6, release: 1.0 },
    }).toDestination();

    this.analyser = new Tone.Analyser('fft', 256);
    this.synth.connect(this.analyser);
    this.padSynth.connect(this.analyser);

    this.synth.volume.value = Tone.gainToDb(this.params.volume);
    this.padSynth.volume.value = Tone.gainToDb(this.params.volume * 0.5);

    Tone.getTransport().bpm.value = this.params.bpm;
    this.scheduledUntil = 0;
    this.scheduleMusic();
    Tone.getTransport().start();
    this._isPlaying = true;
    this.startSpectrumLoop();
  }

  updateEmotion(emotion: EmotionVector): void {
    this.params = emotionToMusicParams(emotion);
    T().getTransport().bpm.value = this.params.bpm;
  }

  pause(): void {
    T().getTransport().pause();
    this._isPlaying = false;
    this.stopSpectrumLoop();
  }

  resume(): void {
    T().getTransport().start();
    this._isPlaying = true;
    this.startSpectrumLoop();
  }

  stop(): void {
    T().getTransport().stop();
    T().getTransport().cancel();
    this._isPlaying = false;
    this.stopSpectrumLoop();
    this.scheduledUntil = 0;
  }

  setVolume(v: number): void {
    this.params.volume = Math.max(0, Math.min(1, v));
    if (this.synth) this.synth.volume.value = T().gainToDb(this.params.volume);
    if (this.padSynth) this.padSynth.volume.value = T().gainToDb(this.params.volume * 0.5);
  }

  onSpectrum(cb: (data: SpectrumData) => void): void { this.spectrumCb = cb; }
  get isPlaying(): boolean { return this._isPlaying; }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.padSynth?.dispose();
    this.analyser?.dispose();
    this.synth = null;
    this.padSynth = null;
    this.analyser = null;
  }

  private scheduleMusic(): void {
    const Tone = T();
    const beatDur = 60 / this.params.bpm;
    const isMinor = this.params.key.includes('m');
    const scale = isMinor ? SCALES.minor : (this.params.style === 'ambient' ? SCALES.pentatonic : SCALES.major);
    const rootNote = this.getRoot();

    // Schedule 8 beats of melody
    for (let i = 0; i < 8; i++) {
      const time = this.scheduledUntil + i * beatDur;
      if (Math.random() < 0.7) {
        const pitch = this.nextPitch(scale, rootNote);
        const freq = Tone.Frequency(pitch, 'midi').toFrequency();
        const dur = beatDur * (Math.random() < 0.3 ? 2 : 1);
        Tone.getTransport().schedule((t) => {
          this.synth?.triggerAttackRelease(freq, dur * 0.8, t, 0.6 + Math.random() * 0.3);
        }, time);
      }
    }

    // Schedule chord every 4 beats
    for (let i = 0; i < 2; i++) {
      const time = this.scheduledUntil + i * 4 * beatDur;
      const chordRoot = rootNote + scale[Math.floor(Math.random() * scale.length)] - 12;
      const chord = [chordRoot, chordRoot + (scale[2] || 4), chordRoot + (scale[4] || 7)];
      const freqs = chord.map(n => Tone.Frequency(n, 'midi').toFrequency());
      Tone.getTransport().schedule((t) => {
        this.padSynth?.triggerAttackRelease(freqs, beatDur * 3.5, t, 0.3);
      }, time);
    }

    this.scheduledUntil += 8 * beatDur;

    // Schedule next batch
    if (this._isPlaying) {
      setTimeout(() => { if (this._isPlaying) this.scheduleMusic(); }, (8 * beatDur * 1000) * 0.7);
    }
  }

  private nextPitch(scale: number[], root: number): number {
    const scaleNotes: number[] = [];
    for (let oct = 4; oct <= 6; oct++) {
      for (const s of scale) scaleNotes.push(root + (oct - 4) * 12 + s);
    }
    // Step motion
    const idx = scaleNotes.reduce((best, n, i) =>
      Math.abs(n - this.lastPitch) < Math.abs(scaleNotes[best] - this.lastPitch) ? i : best, 0);
    const step = Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : -1) : (Math.random() < 0.5 ? -3 : 3);
    const newIdx = Math.max(0, Math.min(scaleNotes.length - 1, idx + step));
    this.lastPitch = scaleNotes[newIdx];
    return this.lastPitch;
  }

  private getRoot(): number {
    const key = this.params.key.replace('m', '');
    const map: Record<string, number> = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 };
    return map[key] ?? 60;
  }

  private startSpectrumLoop(): void {
    this.loopId = window.setInterval(() => {
      if (!this.analyser || !this.spectrumCb) return;
      const values = this.analyser.getValue() as Float32Array;
      const binCount = values.length;
      let low = 0, mid = 0, high = 0;
      const third = Math.floor(binCount / 3);
      for (let i = 0; i < third; i++) low += Math.pow(10, (values[i] as number) / 20);
      for (let i = third; i < third * 2; i++) mid += Math.pow(10, (values[i] as number) / 20);
      for (let i = third * 2; i < binCount; i++) high += Math.pow(10, (values[i] as number) / 20);
      low = Math.min(1, (low / third) * 5);
      mid = Math.min(1, (mid / third) * 5);
      high = Math.min(1, (high / third) * 8);
      const beatPhase = (T().getTransport().seconds % (60 / this.params.bpm)) / (60 / this.params.bpm);
      this.spectrumCb({ low, mid, high, beatPhase });
    }, 50);
  }

  private stopSpectrumLoop(): void {
    if (this.loopId !== null) { clearInterval(this.loopId); this.loopId = null; }
  }
}
