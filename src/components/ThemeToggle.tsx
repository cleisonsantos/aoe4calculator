import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'aoe4-theme';

type Theme = 'light' | 'dark';

const getTheme = (): Theme => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    setTheme(getTheme());
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = isDark ? 'light' : 'dark';
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 transition-all hover:text-slate-800"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="relative flex h-6 w-11 items-center rounded-full border border-slate-200 bg-white">
        <span
          className={`absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--civ-primary)] text-white transition-transform ${
            isDark ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </span>
      </span>
      <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
};
