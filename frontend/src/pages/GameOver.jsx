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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
          <h2 className="text-2xl font-bold">Aucun résultat de partie</h2>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">Retournez à l'accueil pour lancer une nouvelle session.</p>
          <Link to="/" className="mt-6 inline-flex w-full justify-center rounded-[1.75rem] bg-[var(--primary)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5 sm:w-auto">
            Retour à l'accueil
          </Link>
        </div>
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <section className="rounded-[2rem] bg-[var(--card)] p-6 text-center shadow-glow sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Fin de partie</p>
        <h1 className="mt-4 text-4xl font-bold">{winnerLabel}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">{gameState.summary || 'Bravo à tous les joueurs !'}</p>
        <button onClick={handleRestart} className="mt-8 w-full rounded-[1.75rem] bg-[var(--primary)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5 sm:w-auto">
          Rejouer
        </button>
      </section>

      <section className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
          <h2 className="text-xl font-semibold">Rôles et mots</h2>
          <div className="mt-4 space-y-3 text-[var(--muted)]">
            {gameState.players?.map((player) => {
              const secret = gameState.secrets?.[player.id] || {};
              const roleLabel = secret.role === 'mister' ? 'Mister White' : secret.role === 'undercover' ? 'Undercover' : 'Civil';
              const wordLabel = secret.role === 'mister' ? 'Aucun mot' : secret.word || '-';
              return (
                <div key={player.id} className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="font-semibold text-lg">{player.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{roleLabel} — {wordLabel}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
          <h2 className="text-xl font-semibold">Résumé</h2>
          <div className="mt-4 space-y-3 text-[var(--muted)]">
            <p className="text-base">Mode : {gameState.game === 'undercover' ? 'Undercover' : "Time's Up"}</p>
            <p className="text-base">Nombre de rounds : {gameState.round || 1}</p>
            {gameState.game === 'undercover' ? (
              <p className="text-base">Historique de votes : {gameState.history?.length || 0}</p>
            ) : (
              <>
                <p className="text-base">Score A : {gameState.score?.A || 0}</p>
                <p className="text-base">Score B : {gameState.score?.B || 0}</p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
