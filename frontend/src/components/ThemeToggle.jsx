import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, themePalette } = useTheme();
  const selected = themePalette.find((item) => item.id === theme) || themePalette[0];

  return (
    <button type="button" onClick={toggleTheme} className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface-soft)]">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] transition-all duration-200 group-hover:bg-[var(--accent)]/15">☀️</span>
      <span className="text-sm font-semibold">{selected.label}</span>
    </button>
  );
}
