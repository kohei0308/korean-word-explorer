import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

interface CopyButtonProps {
  text: string;
  onCopied?: () => void;
}

export default function CopyButton({ text, onCopied }: CopyButtonProps) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
        copied
          ? 'text-teal-500 bg-teal-50'
          : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
      }`}
      title={t('copy')}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}
