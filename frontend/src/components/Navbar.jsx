import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { label: 'Accueil', path: '/' },
  { label: 'Préparer', path: '/lobby' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 rounded-3xl bg-[var(--card)] px-3 py-2 text-sm font-semibold shadow-soft transition hover:-translate-y-0.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">🦄</span>
          <div className="hidden sm:block">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-[var(--muted)]">Party Games</p>
            <p className="text-sm font-semibold">Pass & Play</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMenu}
              className={`rounded-full px-4 py-2 text-sm transition ${location.pathname === item.path ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-sm text-[var(--muted)] md:flex">
          <span className="font-semibold text-[var(--accent)]">Thème</span>
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-soft)] md:hidden"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl transition duration-300">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6 px-6 pb-8 pt-24">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={`block rounded-3xl border border-[var(--border)] bg-[var(--card)] px-6 py-5 text-center text-xl font-semibold transition hover:-translate-y-0.5 ${location.pathname === item.path ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]' : 'text-[var(--text)] hover:bg-[var(--surface-soft)]'}`}
              >
                {item.label}
              </Link>
            ))}

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Thème</p>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
