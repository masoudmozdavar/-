import React from 'react';
import { Save, Check, Trash2, Clock } from 'lucide-react';

interface AutoSaveIndicatorProps {
  hasDraft: boolean;
  lastSavedAt: Date | null;
  onClearDraft?: () => void;
  isFa: boolean;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  hasDraft,
  lastSavedAt,
  onClearDraft,
  isFa,
  className = '',
}) => {
  if (!hasDraft && !lastSavedAt) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-medium ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
        <span>{isFa ? 'ذخیره خودکار فعال' : 'Auto-save active'}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-800 transition-all ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>

      <span className="flex items-center gap-1">
        <Check className="w-3 h-3 text-emerald-600" />
        <span>{isFa ? 'پیش‌نویس ذخیره شد' : 'Draft saved'}</span>
      </span>

      {onClearDraft && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClearDraft();
          }}
          className="text-[10px] text-emerald-700/70 hover:text-rose-600 underline cursor-pointer transition-colors mr-1"
          title={isFa ? 'حذف پیش‌نویس و شروع مجدد' : 'Discard draft'}
        >
          {isFa ? 'پاک کردن' : 'Discard'}
        </button>
      )}
    </div>
  );
};
