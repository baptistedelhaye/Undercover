import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import ConfirmModal from '../components/ConfirmModal';

export default function UndercoverRoom() {
  const navigate = useNavigate();
  const { gameState, revealPlayerWord, hideWord, passToNextPlayer, startVote, eliminatePlayer, guessMisterWord, restartGame, replayUndercover } = useGame();
  const [guess, setGuess] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, playerId: null, playerName: '' });

  useEffect(() => {
    if (gameState.stage === 'end') {
      navigate('/end', { replace: true });
    }
  }, [gameState.stage, navigate]);

  if (gameState.stage !== 'undercover' || !gameState.players?.length) {
    return (
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
        <h2 className="text-2xl font-bold">Aucune partie Undercover active</h2>
        <p className="mt-3 text-[var(--muted)]">Retournez dans la préparation pour lancer une partie.</p>
        <Link to="/lobby" className="mt-6 inline-flex rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white">
          Aller à la préparation
        </Link>
      </div>
    );
  }

  const alivePlayers = gameState.players.filter((player) => player.alive);
  const currentPlayer = (gameState.phase === 'reveal' || gameState.phase === 'round')
    ? alivePlayers[gameState.revealIndex % alivePlayers.length]
    : null;

  const winnerLabel = gameState.winner === 'Civils'
    ? 'Victoire des civils'
    : gameState.winner === 'Undercover'
    ? 'Victoire des Undercover'
    : gameState.winner === 'Mister White'
    ? 'Victoire de Mister White'
    : `Victoire de ${gameState.winner}`;

  const handleRevealWord = () => {
    if (currentPlayer?.id) {
      revealPlayerWord(currentPlayer.id);
    }
  };

  const handleHideWord = () => {
    hideWord();
    passToNextPlayer();
  };

  const handleEliminateClick = (playerId, playerName) => {
    setConfirmModal({ isOpen: true, playerId, playerName });
  };

  const handleConfirmEliminate = () => {
    if (confirmModal.playerId) {
      eliminatePlayer(confirmModal.playerId);
      setConfirmModal({ isOpen: false, playerId: null, playerName: '' });
    }
  };

  const handleCancelEliminate = () => {
    setConfirmModal({ isOpen: false, playerId: null, playerName: '' });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Confirmer l'élimination"
        message={`Voulez-vous éliminer ${confirmModal.playerName} ?`}
        confirmText="Éliminer"
        cancelText="Annuler"
        onConfirm={handleConfirmEliminate}
        onCancel={handleCancelEliminate}
      />

      <header className="grid gap-4 rounded-[2rem] bg-[var(--card)] p-6 shadow-glow sm:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Undercover - Pass & Play</p>
          <h1 className="mt-3 text-3xl font-bold">Undercover</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">Joueurs vivants : {alivePlayers.length}</p>
          <p className="mt-2 text-base leading-7 text-[var(--muted)]">Undercover : {gameState.undercoverCount || 0} · Mister White : {gameState.misterWhiteCount || 0} · Civils : {Math.max(0, (gameState.players?.length || 0) - (gameState.undercoverCount || 0) - (gameState.misterWhiteCount || 0))}</p>
        </div>
        <div className="rounded-[2rem] bg-[var(--surface-soft)] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Prochaine action</p>
          <p className="mt-4 text-2xl font-semibold sm:text-3xl">
            {gameState.phase === 'reveal' ? 'Voir votre mot' : gameState.phase === 'round' ? `Round ${gameState.round || 1}` : gameState.phase === 'vote' ? 'Sélectionner éliminé' : gameState.phase === 'misterGuess' ? 'Tentative de devinette' : 'Résultat'}
          </p>
          <p className="mt-2 text-base leading-7 text-[var(--muted)]">
            {gameState.phase === 'reveal' || gameState.phase === 'round'
              ? `C'est au tour de ${currentPlayer?.name}`
              : gameState.phase === 'vote'
              ? 'Sélectionnez l’éliminé'
              : gameState.phase === 'misterGuess'
              ? 'Le joueur éliminé doit deviner'
              : ''}
          </p>
        </div>
      </header>

      {gameState.winner ? (
        <section className="mt-6 rounded-[2rem] bg-[var(--card)] p-6 shadow-glow text-center">
          <h2 className="text-3xl font-bold">{winnerLabel}</h2>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">{gameState.summary}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] bg-[var(--surface)] p-5 text-left">
              <h3 className="text-lg font-semibold">Rôles et mots</h3>
              <div className="mt-4 space-y-3 text-[var(--muted)]">
                {gameState.players.map((p) => {
                  const secret = gameState.secrets?.[p.id] || {};
                  const roleLabel = secret.role === 'mister' ? 'Mister White' : secret.role === 'undercover' ? 'Undercover' : 'Civil';
                  const word = secret.role === 'mister' ? 'Aucun mot' : (secret.word || '-');
                  return (
                    <div key={p.id} className="flex flex-col gap-1 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-[var(--muted)]">{roleLabel}</div>
                      </div>
                      <div className="text-sm text-[var(--muted)]">{word}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-[var(--surface)] p-5 text-left">
              <h3 className="text-lg font-semibold">Historique & éliminés</h3>
              <div className="mt-4 space-y-3 text-[var(--muted)]">
                <p className="text-base font-semibold">Rounds : {gameState.round || 1}</p>
                {gameState.history.length ? (
                  gameState.history.map((entry, i) => (
                    <div key={i} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="font-semibold">Tour {i + 1}</p>
                      <p className="text-sm text-[var(--muted)]">Éliminé : {entry.targetName}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-base leading-7">Aucun vote enregistré pour le moment.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button onClick={replayUndercover} className="w-full rounded-[1.75rem] bg-[var(--primary)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5 sm:w-auto">
              Rejouer mêmes joueurs
            </button>
            <button onClick={restartGame} className="w-full rounded-[1.75rem] border border-[var(--border)] px-6 py-4 text-lg font-semibold text-[var(--text)] transition hover:-translate-y-0.5 sm:w-auto">
              Retour à l'accueil
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-6 grid gap-6">
            <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
              <h2 className="text-xl font-semibold">Passe le téléphone</h2>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">C'est le tour de :</p>
              <div className="mt-4 rounded-[2rem] bg-[var(--surface)] p-8 text-center text-3xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                {currentPlayer?.name}
              </div>

              {gameState.phase === 'reveal' ? (
                <div className="mt-6 space-y-4">
                  <p className="text-base leading-7 text-[var(--muted)]">Le mot apparaît seulement ici. Ne laissez pas les autres regarder.</p>
                  {!gameState.revealed ? (
                    <button onClick={handleRevealWord} className="w-full rounded-[1.75rem] bg-[var(--primary)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5">
                      Voir ma carte
                    </button>
                  ) : null}
                  {gameState.revealed && (
                    <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-5xl font-bold text-[var(--accent)] sm:text-6xl">
                      {gameState.currentWord}
                    </div>
                  )}
                  {gameState.revealed && (
                    <button onClick={handleHideWord} className="w-full rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-lg font-semibold text-[var(--text)] transition hover:-translate-y-0.5">
                      J'ai mémorisé
                    </button>
                  )}
                </div>
              ) : gameState.phase === 'round' ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[2rem] bg-[var(--surface)] p-8 text-center text-3xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                    Round {gameState.round || 1}
                  </div>
                  <p className="text-base leading-7 text-[var(--muted)]">Chaque joueur parle à son tour. Passez le téléphone après chaque mot ou phrase.</p>
                  <div className="rounded-[2rem] bg-[var(--surface)] p-5">
                    <h3 className="text-lg font-semibold">Ordre de parole</h3>
                    <ol className="mt-3 space-y-3 list-decimal list-inside text-base font-semibold text-[var(--muted)]">
                      {(() => {
                        const alive = gameState.players.filter((p) => p.alive);
                        const startPlayerId = gameState.roundStartPlayerId;
                        const startIdx = alive.findIndex((p) => p.id === startPlayerId);
                        const start = startIdx >= 0 ? startIdx : 0;
                        const ordered = [...alive.slice(start), ...alive.slice(0, start)];
                        return ordered.map((p) => <li key={p.id}>{p.name}</li>);
                      })()}
                    </ol>
                  </div>
                  <button onClick={() => startVote()} className="w-full rounded-[1.75rem] bg-[var(--primary)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5">
                    Passer au vote
                  </button>
                </div>
              ) : gameState.phase === 'vote' ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[2rem] bg-[var(--surface)] p-8 text-center text-3xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                    Vote
                  </div>
                  <p className="text-base leading-7 text-[var(--muted)]">Choisissez le joueur à éliminer.</p>
                  <div className="grid gap-3">
                    {alivePlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleEliminateClick(player.id, player.name)}
                        className="w-full rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 text-left text-lg font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--primary)]/10"
                      >
                        <div>{player.name}</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">Éliminer</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : gameState.phase === 'misterGuess' ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[2rem] bg-[var(--surface)] p-8 text-center text-3xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                    Tentative de devinette
                  </div>
                  <p className="text-base leading-7 text-[var(--muted)]">Le joueur éliminé peut deviner le mot secret.</p>
                  <div className="space-y-3">
                    <input
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      placeholder="Proposition"
                      className="w-full rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-base text-[var(--text)] outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          guessMisterWord(guess);
                          setGuess('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        guessMisterWord(guess);
                        setGuess('');
                      }}
                      className="w-full rounded-[1.75rem] bg-[var(--accent)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-base leading-7 text-[var(--muted)]">Tous les joueurs ont vu leur mot. Passez au vote.</p>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
            <h2 className="text-xl font-semibold">Historique</h2>
            <div className="mt-4 space-y-3 text-[var(--muted)]">
              {gameState.history.length ? (
                gameState.history.map((entry, index) => (
                  <div key={index} className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="font-semibold">Tour {index + 1}</p>
                    <p className="text-base leading-7">Éliminé : {entry.targetName}</p>
                  </div>
                ))
              ) : (
                <p className="text-base leading-7">Aucun vote enregistré pour le moment.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
