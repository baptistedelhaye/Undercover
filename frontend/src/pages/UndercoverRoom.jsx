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
    <div className="mx-auto max-w-6xl space-y-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
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
          <p className="mt-3 text-[var(--muted)]">Joueurs vivants : {alivePlayers.length}</p>
          <p className="mt-2 text-[var(--muted)]">Undercover : {gameState.undercoverCount || 0} · Mister White : {gameState.misterWhiteCount || 0} · Civils : {Math.max(0, (gameState.players?.length || 0) - (gameState.undercoverCount || 0) - (gameState.misterWhiteCount || 0))}</p>
        </div>
        <div className="rounded-[2rem] bg-[var(--surface-soft)] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Prochaine action</p>
          <p className="mt-4 text-3xl font-semibold">{gameState.phase === 'reveal' ? 'Voir votre mot' : gameState.phase === 'round' ? `Round ${gameState.round || 1}` : gameState.phase === 'vote' ? 'Sélectionner éliminé' : gameState.phase === 'misterGuess' ? "Tentative de devinette" : 'Résultat'}</p>
          <p className="mt-2 text-[var(--muted)]">
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
        <section className="rounded-[2rem] bg-[var(--card)] p-8 shadow-glow text-center">
          <h2 className="text-3xl font-bold">{winnerLabel}</h2>
          <p className="mt-3 text-[var(--muted)]">{gameState.summary}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[var(--surface)] p-6 text-left">
              <h3 className="font-semibold">Rôles et mots</h3>
              <div className="mt-3 space-y-2 text-[var(--muted)]">
                {gameState.players.map((p) => {
                  const secret = gameState.secrets?.[p.id] || {};
                  const roleLabel = secret.role === 'mister' ? 'Mister White' : secret.role === 'undercover' ? 'Undercover' : 'Civil';
                  const word = secret.role === 'mister' ? 'Aucun mot' : (secret.word || '-');
                  return (
                    <div key={p.id} className="flex items-center justify-between">
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

            <div className="rounded-3xl bg-[var(--surface)] p-6 text-left">
              <h3 className="font-semibold">Historique & éliminés</h3>
              <div className="mt-3 text-[var(--muted)]">
                <p>Nombre de rounds : {gameState.round || 1}</p>
                <div className="mt-3 space-y-2">
                  {gameState.history.length ? (
                    gameState.history.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="font-semibold">Tour {i + 1}</div>
                        <div className="text-sm text-[var(--muted)]">Éliminé : {entry.targetName}</div>
                      </div>
                    ))
                  ) : (
                    <p>Aucun vote enregistré pour le moment.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={replayUndercover} className="rounded-full bg-[var(--primary)] px-8 py-4 text-white transition hover:-translate-y-0.5">
              Rejouer mêmes joueurs
            </button>
            <button onClick={restartGame} className="rounded-full border border-[var(--border)] px-6 py-4 text-[var(--text)] transition hover:-translate-y-0.5">
              Retour à l'accueil
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
              <h2 className="text-xl font-semibold">Passer le téléphone</h2>
              <p className="mt-3 text-[var(--muted)]">Donnez le téléphone à :</p>
                  {gameState.phase === 'reveal' ? (
                <>
                  <div className="mt-4 rounded-[2rem] bg-[var(--surface)] p-8 text-center text-4xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                    {currentPlayer?.name}
                  </div>
                  <div className="mt-6 space-y-4">
                    <p className="text-[var(--muted)]">Cliquez pour voir votre mot secret une seule fois.</p>
                    {!gameState.revealed ? (
                      <button onClick={handleRevealWord} className="w-full rounded-full bg-[var(--primary)] px-6 py-4 text-white text-lg font-semibold transition hover:-translate-y-0.5">
                        Voir ma carte
                      </button>
                    ) : null}
                    {gameState.revealed && (
                      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-2xl font-bold text-[var(--accent)]">
                        {gameState.currentWord}
                      </div>
                    )}
                    {gameState.revealed && (
                      <button onClick={handleHideWord} className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-[var(--text)] text-lg font-semibold transition hover:-translate-y-0.5">
                        J'ai mémorisé
                      </button>
                    )}
                  </div>
                </>
              ) : gameState.phase === 'round' ? (
                <>
                  <div className="mt-4 rounded-[2rem] bg-[var(--surface)] p-8 text-center text-4xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                    Round {gameState.round || 1}
                  </div>
                  <div className="mt-6 space-y-4">
                    <p className="text-[var(--muted)]">Ordre de parole :</p>
                    <ol className="mt-3 space-y-2 list-decimal list-inside text-lg font-semibold">
                      {(() => {
                        const alive = gameState.players.filter((p) => p.alive);
                        const startPlayerId = gameState.roundStartPlayerId;
                        const startIdx = alive.findIndex((p) => p.id === startPlayerId);
                        const start = startIdx >= 0 ? startIdx : 0;
                        const ordered = [...alive.slice(start), ...alive.slice(0, start)];
                        return ordered.map((p) => <li key={p.id}>{p.name}</li>);
                      })()}
                    </ol>
                    <p className="text-[var(--muted)]">Consigne : chaque joueur dit un mot ou une courte phrase dans cet ordre.</p>
                    <button onClick={() => startVote()} className="w-full rounded-full bg-[var(--primary)] px-6 py-4 text-white text-lg font-semibold">
                      Après le vote réel — sélectionner l'éliminé
                    </button>
                  </div>
                </>
              ) : gameState.phase === 'vote' ? (
                <>
                  <div className="mt-4 rounded-[2rem] bg-[var(--surface)] p-8 text-center text-4xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                    Vote
                  </div>
                  <div className="mt-6 space-y-4">
                    <p className="text-[var(--muted)]">Joueurs vivants : {alivePlayers.length}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {alivePlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleEliminateClick(player.id, player.name)}
                          className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-left text-sm text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--primary)]/10"
                        >
                          <p className="font-semibold">{player.name}</p>
                          <p className="mt-1 text-[var(--muted)]">Éliminer</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : gameState.phase === 'misterGuess' ? (
                <>
                  <div className="mt-4 rounded-[2rem] bg-[var(--surface)] p-8 text-center text-4xl font-extrabold uppercase tracking-[0.2em] text-[var(--accent)] shadow-soft">
                    Tentative de devinette
                  </div>
                  <div className="mt-6 space-y-4">
                    <p className="text-[var(--muted)]">Le joueur éliminé peut tenter de deviner le mot :</p>
                    <div className="mt-4 flex gap-3">
                      <input
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Proposition"
                        className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none"
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
                        className="rounded-full bg-[var(--accent)] px-6 py-3 text-white font-semibold transition hover:-translate-y-0.5"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-6 text-[var(--muted)]">Tous les joueurs ont vu leur mot. Passez au vote.</p>
              )}
            </div>
          </section>


          <section className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
            <h2 className="text-xl font-semibold">Historique</h2>
            <div className="mt-4 space-y-3 text-[var(--muted)]">
              {gameState.history.length ? (
                gameState.history.map((entry, index) => (
                  <div key={index} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="font-semibold">Tour {index + 1}</p>
                    <p>Éliminé : {entry.targetName}</p>
                  </div>
                ))
              ) : (
                <p>Aucun vote enregistré pour le moment.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
