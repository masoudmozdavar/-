import React, { useState } from 'react';
import { GRAPHIC_CHARACTERS, GraphicCharacter } from '../../utils/graphicAvatars';
import { GraphicAvatar } from './GraphicAvatar';
import { Check, Sparkles } from 'lucide-react';

interface GraphicCharacterPickerProps {
  selectedId: string;
  onSelect: (characterId: string) => void;
  language?: 'fa' | 'en';
}

export const GraphicCharacterPicker: React.FC<GraphicCharacterPickerProps> = ({
  selectedId,
  onSelect,
  language = 'fa',
}) => {
  const isFa = language === 'fa';
  const [filterTag, setFilterTag] = useState<'all' | 'family' | 'pro'>('all');

  const filteredCharacters = GRAPHIC_CHARACTERS.filter((c) => {
    if (filterTag === 'all') return true;
    if (filterTag === 'family') return ['head', 'spouse', 'child', 'parent'].includes(c.tag);
    if (filterTag === 'pro') return c.tag === 'pro';
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setFilterTag('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
            filterTag === 'all'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isFa ? 'همه کاراکترها (۱۲)' : 'All (12)'}
        </button>
        <button
          type="button"
          onClick={() => setFilterTag('family')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
            filterTag === 'family'
              ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isFa ? 'اعضای خانواده' : 'Family Members'}
        </button>
        <button
          type="button"
          onClick={() => setFilterTag('pro')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
            filterTag === 'pro'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isFa ? 'شخصیت‌های حرفه‌ای' : 'Specialists'}
        </button>
      </div>

      {/* Grid of Graphic Characters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto p-1 pr-1.5 no-scrollbar">
        {filteredCharacters.map((char: GraphicCharacter) => {
          const isSelected = selectedId === char.id;
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => onSelect(char.id)}
              className={`relative flex items-center gap-2.5 p-2 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.01]'
              }`}
            >
              <div className="relative">
                <GraphicAvatar
                  avatarId={char.id}
                  size="md"
                  ring={isSelected}
                  ringColor={char.accentColor}
                  showBadge={true}
                />
                {isSelected && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                  <span>{isFa ? char.nameFa : char.nameEn}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {isFa ? char.titleFa : char.titleEn}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
