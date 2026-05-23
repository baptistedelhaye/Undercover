import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const roundNames = ['Description libre', 'Un seul mot', 'Mime'];

export default function TimesUpRoom() {
  const { gameState, nextTimesUpCard, restartGame } = useGame();
  const [timer, setTimer] = useState(30);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (gameState.stage !== 'timesup') return;
    if (!running) return;
    const interval = setInterval(() => {
      setTimer((value) => {
        if (value <= 1) {
          nextTimesUpCard(false);
          return 30;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, gameState.stage, nextTimesUpCard]);

  useEffect(() => {
    setTimer(30);
  }, [gameState.currentCardIndex, gameState.round]);

  if (gameState.stage !== 'timesup') {
    return (
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
        <h2 className="text-2xl font-bold">Aucune partie Time's Up active</h2>
        <p className="mt-3 text-[var(--muted)]">Retournez dans la préparation pour lancer une partie.</p>
        <Link to="/lobby" className="mt-6 inline-flex rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white">
          Aller à la préparation
        </Link>
      </div>
    );
  }

  const currentCard = gameState.deck?.[gameState.currentCardIndex] || 'Aucune carte';

  return (
    <div className="mx-auto max-w-6xl space-y-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
      <header className="grid gap-4 rounded-[2rem] bg-[var(--card)] p-6 shadow-glow sm:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Time's Up - Pass & Play</p>
          <h1 className="mt-3 text-3xl font-bold">Manche {gameState.round}</h1>
          <p className="mt-3 text-[var(--muted)]">Équipe en jeu : {gameState.teamTurn === 'A' ? 'Équipe A' : 'Équipe B'}</p>
          <p className="mt-1 text-[var(--muted)]">Cartes restantes : {Math.max((gameState.deck?.length || 0) - gameState.currentCardIndex, 0)}</p>
        </div>
        <div className="rounded-[2rem] bg-[var(--surface-soft)] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Score</p>
          <div className="mt-4 grid gap-3 text-lg font-semibold sm:grid-cols-2">
            <div className="rounded-3xl bg-[var(--card)] p-4">Équipe A : {gameState.score?.A || 0}</div>
            <div className="rounded-3xl bg-[var(--card)] p-4">Équipe B : {gameState.score?.B || 0}</div>
          </div>
        </div>
      </header>

      {gameState.winner ? (
        <section className="rounded-[2rem] bg-[var(--card)] p-8 shadow-glow text-center">
          <h2 className="text-3xl font-bold">Victoire de {gameState.winner}</h2>
          <p className="mt-3 text-[var(--muted)]">{gameState.summary}</p>
          <button onClick={restartGame} className="mt-8 rounded-full bg-[var(--primary)] px-8 py-4 text-white transition hover:-translate-y-0.5">
            Rejouer
          </button>
        </section>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
              <h2 className="text-xl font-semibold">Carte actuelle</h2>
              <p className="mt-5 text-[var(--muted)]">Montrez cette carte au joueur actif puis passez le téléphone.</p>
              <div className="mt-6 rounded-3xl bg-[var(--surface)] p-6 text-center text-2xl font-bold text-[var(--accent)]">{currentCard}</div>
            </div>

            <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
              <h2 className="text-xl font-semibold">Chrono</h2>
              <div className="mt-4 rounded-3xl bg-[var(--surface)] p-8 text-center text-5xl font-bold text-[var(--primary)]">{timer}s</div>
              <button onClick={() => setRunning((current) => !current)} className="mt-4 w-full rounded-full bg-[var(--primary)] px-6 py-4 text-white transition hover:-translate-y-0.5">
                {running ? 'Pause' : 'Démarrer'}
              </button>
            </div>

            <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
              <h2 className="text-xl font-semibold">Manche</h2>
              <p className="mt-3 text-[var(--muted)]">{roundNames[gameState.round - 1]}</p>
              <div className="mt-6 space-y-3">
                <button onClick={() => { setRunning(false); nextTimesUpCard(true); }} className="w-full rounded-full bg-[var(--primary)] px-6 py-4 text-white transition hover:-translate-y-0.5">Mot trouvé</button>
                <button onClick={() => { setRunning(false); nextTimesUpCard(false); }} className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-[var(--text)] transition hover:-translate-y-0.5">Passer</button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
