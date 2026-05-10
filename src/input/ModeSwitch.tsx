import { useSessionStore } from '../stores/sessionStore';
import type { InputMode } from '../types';

export function ModeSwitch() {
  const inputMode = useSessionStore((s) => s.inputMode);
  const switchInputMode = useSessionStore((s) => s.switchInputMode);

  const modes: { key: InputMode; label: string }[] = [
    { key: 'text', label: '文字' },
    { key: 'drawing', label: '画线' },
  ];

  return (
    <div className="mode-switch" role="tablist" aria-label="输入模式切换">
      {modes.map((m) => (
        <button
          key={m.key} role="tab" aria-selected={inputMode === m.key}
          className={`mode-switch__tab${inputMode === m.key ? ' mode-switch__tab--active' : ''}`}
          onClick={() => switchInputMode(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
