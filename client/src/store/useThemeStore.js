// store/useThemeStore.js — Dark/light mode toggle with persistence
import { create } from 'zustand';

const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initial = saved || (prefersDark ? 'dark' : 'light');

// Apply theme to <html> element
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

applyTheme(initial); // Apply on load before React renders

const useThemeStore = create((set) => ({
  theme: initial,
  toggle: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return { theme: next };
  }),
}));

export default useThemeStore;
