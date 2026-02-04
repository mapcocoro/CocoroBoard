import { useState, useEffect } from 'react';

export type ViewMode = 'card' | 'list';

interface ViewToggleProps {
  storageKey: string;
  defaultView?: ViewMode;
  onChange?: (mode: ViewMode) => void;
}

export function useViewMode(storageKey: string, defaultView: ViewMode = 'card'): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(`viewMode_${storageKey}`);
    return (saved as ViewMode) || defaultView;
  });

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(`viewMode_${storageKey}`, mode);
  };

  return [viewMode, setMode];
}

export function ViewToggle({ storageKey, defaultView = 'card', onChange }: ViewToggleProps) {
  const [viewMode, setViewMode] = useViewMode(storageKey, defaultView);

  useEffect(() => {
    onChange?.(viewMode);
  }, [viewMode, onChange]);

  return (
    <div className="flex border border-[var(--color-border)] rounded-md overflow-hidden">
      <button
        onClick={() => setViewMode('card')}
        className={`px-2 py-1.5 text-sm transition-colors ${
          viewMode === 'card'
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-white text-[var(--color-text-muted)] hover:bg-gray-50'
        }`}
        title="カード表示"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`px-2 py-1.5 text-sm transition-colors ${
          viewMode === 'list'
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-white text-[var(--color-text-muted)] hover:bg-gray-50'
        }`}
        title="リスト表示"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
