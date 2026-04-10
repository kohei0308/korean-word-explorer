import { useState } from 'react';
import { BookOpen, Table2, Sparkles, MessageCircle, Mic, Link2, Lock } from 'lucide-react';
import type { WordResult } from '../types/word';
import BasicTab from './tabs/BasicTab';
import ConjugationTab from './tabs/ConjugationTab';
import GrammarTab from './tabs/GrammarTab';
import PhrasesTab from './tabs/PhrasesTab';
import CultureTab from './tabs/CultureTab';
import RelatedTab from './tabs/RelatedTab';

interface ResultTabsProps {
  result: WordResult;
  isPremium: boolean;
  onUpgradeClick: () => void;
}

interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  premium: boolean;
}

const tabs: TabDef[] = [
  { id: 'basic', label: '基本', icon: <BookOpen className="w-4 h-4" />, premium: false },
  { id: 'conjugation', label: '活用', icon: <Table2 className="w-4 h-4" />, premium: false },
  { id: 'grammar', label: '文法', icon: <Sparkles className="w-4 h-4" />, premium: false },
  { id: 'phrases', label: 'フレーズ', icon: <MessageCircle className="w-4 h-4" />, premium: false },
  { id: 'culture', label: 'ネイティブの声', icon: <Mic className="w-4 h-4" />, premium: true },
  { id: 'related', label: '関連語', icon: <Link2 className="w-4 h-4" />, premium: true },
];

export default function ResultTabs({ result, isPremium, onUpgradeClick }: ResultTabsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const handleTabClick = (tab: TabDef) => {
    if (tab.premium && !isPremium) {
      onUpgradeClick();
      return;
    }
    setActiveTab(tab.id);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-4 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLocked = tab.premium && !isPremium;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-white shadow-sm text-stone-800 border border-stone-200/80'
                  : isLocked
                    ? 'text-stone-400 hover:text-stone-500 bg-stone-100/50'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {isLocked && (
                <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-stone-50/50 rounded-2xl p-5 border border-stone-100/80 min-h-[300px]">
        {activeTab === 'basic' && <BasicTab data={result.basic} />}
        {activeTab === 'conjugation' && <ConjugationTab data={result.conjugation} />}
        {activeTab === 'grammar' && <GrammarTab data={result.grammar} />}
        {activeTab === 'phrases' && <PhrasesTab data={result.phrases} />}
        {activeTab === 'culture' && isPremium && <CultureTab data={result.culture} />}
        {activeTab === 'related' && isPremium && <RelatedTab data={result.related} />}
      </div>
    </div>
  );
}
