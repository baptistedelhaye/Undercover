import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { label: 'Accueil', path: '/' },
  { label: 'Préparer', path: '/lobby' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3 rounded-3xl bg-[var(--card)] px-4 py-3 text-sm font-semibold shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">🦄</span>
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Party Games</p>
            <p className="text-base font-semibold">Pass & Play</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`rounded-full px-4 py-2 text-sm transition ${location.pathname === item.path ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]'}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-sm text-[var(--muted)] md:flex">
          <span className="font-semibold text-[var(--accent)]">Thème</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
