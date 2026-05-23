import { useNavigate } from 'react-router-dom';

const gameCards = [
  {
    type: 'undercover',
    title: '🎭 Undercover',
    description: 'Cachez votre mot, bluffez et éliminez les imposteurs avant qu’ils prennent le pouvoir.',
    accent: 'bg-[var(--accent)]/10',
    emoji: '🕵️‍♂️',
  },
  {
    type: 'timesup',
    title: "🎉 Time's Up",
    description: 'Faites deviner avec style, accumulez des points et faites vibrer la soirée.',
    accent: 'bg-[var(--primary)]/10',
    emoji: '⏱️',
  },
];

export default function Home() {
  const navigate = useNavigate();

  const chooseGame = (type) => {
    localStorage.setItem('undercover-gameType', type);
    navigate('/lobby');
  };

  return (
    <section className="mx-auto max-w-7xl space-y-8 py-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-10 shadow-soft">
        <div className="pointer-events-none absolute -right-16 top-10 h-36 w-36 rounded-full bg-[var(--accent)]/20 blur-3xl"></div>
        <div className="pointer-events-none absolute left-8 top-20 h-24 w-24 rounded-full bg-[var(--primary)]/15 blur-3xl"></div>
        <div className="relative z-10 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[var(--accent)]">✨ Jouez entre amis avec un seul téléphone</span>
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl">🎉 Party Games</h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">Un endroit moderne, fun et élégant pour préparer vos parties Undercover et Time's Up. Le jeu commence en quelques secondes, sans passer par des écrans vides.</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => chooseGame('undercover')} className="btn-animated inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-4 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:shadow-xl">
              🎭 Jouer à Undercover
            </button>
            <button type="button" onClick={() => chooseGame('timesup')} className="btn-animated inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface-soft)]">
              🎊 Jouer à Time's Up
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {gameCards.map((card) => (
          <article key={card.type} className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: card.type === 'undercover' ? 'rgba(192,38,211,0.25)' : 'rgba(59,130,246,0.18)' }} />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3 text-3xl">
                <span>{card.emoji}</span>
                <h2 className="text-3xl font-bold">{card.title}</h2>
              </div>
              <p className="text-[var(--muted)]">{card.description}</p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm">Jeu rapide</span>
                <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm">Parties fun</span>
                <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm">Sans installation</span>
              </div>
              <button onClick={() => chooseGame(card.type)} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                Choisir {card.title}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
