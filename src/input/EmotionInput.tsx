import { useSessionStore } from '../stores/sessionStore';
import { ModeSwitch } from './ModeSwitch';
import { TextInput } from './TextInput';
import { DrawingCanvas } from './DrawingCanvas';

export function EmotionInput() {
  const inputMode = useSessionStore((s) => s.inputMode);

  return (
    <div className="emotion-input">
      <ModeSwitch />
      <div className="emotion-input__panel" key={inputMode}>
        {inputMode === 'text' ? <TextInput /> : <DrawingCanvas />}
      </div>
    </div>
  );
}
