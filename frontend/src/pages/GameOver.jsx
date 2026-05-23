import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function GameOver() {
  const { gameState, restartGame } = useGame();
  const navigate = useNavigate();

  const handleRestart = () => {
    restartGame();
    navigate('/', { replace: true });
  };

  if (gameState.stage !== 'end') {
    return (
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
        <h2 className="text-2xl font-bold">Aucun résultat de partie</h2>
        <p className="mt-3 text-[var(--muted)]">Retournez à l'accueil pour lancer une nouvelle session.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const winnerLabel = gameState.winner === 'Civils'
    ? 'Victoire des civils'
    : gameState.winner === 'Undercover'
    ? 'Victoire des Undercover'
    : gameState.winner === 'Mister White'
    ? 'Victoire de Mister White'
    : `Victoire de ${gameState.winner}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
      <section className="rounded-[2rem] bg-[var(--card)] p-8 text-center shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Fin de partie</p>
        <h1 className="mt-4 text-4xl font-bold">{winnerLabel}</h1>
        <p className="mt-4 text-[var(--muted)]">{gameState.summary || 'Bravo à tous les joueurs !'}</p>
        <button onClick={handleRestart} className="mt-8 rounded-full bg-[var(--primary)] px-8 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5">
          Rejouer
        </button>
      </section>

      <section className="grid gap-4 rounded-[2rem] bg-[var(--card)] p-6 shadow-glow sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Rôles et mots</h2>
          <ul className="mt-4 space-y-3 text-[var(--muted)]">
            {gameState.players?.map((player) => {
              const secret = gameState.secrets?.[player.id] || {};
              const roleLabel = secret.role === 'mister' ? 'Mister White' : secret.role === 'undercover' ? 'Undercover' : 'Civil';
              const wordLabel = secret.role === 'mister' ? 'Aucun mot' : secret.word || '-';
              return (
                <li key={player.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="font-semibold">{player.name}</p>
                  <p className="text-sm">{roleLabel} — {wordLabel}</p>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Résumé</h2>
          <div className="mt-4 space-y-3 text-[var(--muted)]">
            <p>Mode : {gameState.game === 'undercover' ? 'Undercover' : "Time's Up"}</p>
            <p>Nombre de rounds : {gameState.round || 1}</p>
            {gameState.game === 'undercover' ? (
              <p>Historique de votes : {gameState.history?.length || 0}</p>
            ) : (
              <>
                <p>Score A : {gameState.score?.A || 0}</p>
                <p>Score B : {gameState.score?.B || 0}</p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
