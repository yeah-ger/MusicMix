import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';

const MAX_CHARS = 500;

export function TextInput() {
  const [text, setText] = useState('');
  const submitText = useSessionStore((s) => s.submitText);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = text.trim().length === 0;

  const handleSubmit = () => {
    if (isEmpty || isOverLimit) return;
    submitText(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="text-input">
      <textarea
        className="text-input__textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="描述你的心情..."
        rows={3}
        aria-label="情绪文本输入"
      />
      <div className="text-input__footer">
        <span className={`text-input__count${isOverLimit ? ' text-input__count--over' : ''}`}>
          {charCount}/{MAX_CHARS}
        </span>
        <button className="btn btn--primary" onClick={handleSubmit} disabled={isEmpty || isOverLimit}>
          提交
        </button>
      </div>
    </div>
  );
}
