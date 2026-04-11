import { useState, useCallback } from 'react';
import { Volume2 } from 'lucide-react';

interface SpeakButtonProps {
  text: string;
  speechLang: string;
  size?: 'sm' | 'md';
}

export default function SpeakButton({ text, speechLang, size = 'sm' }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = useCallback(() => {
    if (!text || speaking) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.9;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [text, speechLang, speaking]);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const btnSize = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={handleSpeak}
      className={`${btnSize} rounded-lg transition-all duration-200 flex-shrink-0 ${
        speaking
          ? 'text-rose-500 bg-rose-50 animate-pulse'
          : 'text-stone-400 hover:text-rose-500 hover:bg-rose-50'
      }`}
      type="button"
    >
      <Volume2 className={iconSize} />
    </button>
  );
}
