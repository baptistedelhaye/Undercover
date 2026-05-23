import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const timesUpCategories = [
  { key: 'animaux', label: 'Animaux' },
  { key: 'films', label: 'Films' },
  { key: 'jeux-video', label: 'Jeux vidéo' },
  { key: 'personnages', label: 'Personnages célèbres' },
  { key: 'melange', label: 'Mélangé' },
];

export default function Lobby() {
  const navigate = useNavigate();
  const { gameState, initializeUndercover, startTimesUp } = useGame();
  const [name, setName] = useState('');
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('undercover-players');
    return saved ? JSON.parse(saved) : (gameState.players || []);
  });
  const [gameType, setGameType] = useState(() => localStorage.getItem('undercover-gameType') || 'undercover');
  const [undercoverCount, setUndercoverCount] = useState(() => {
    const saved = localStorage.getItem('undercover-undercoverCount');
    return saved ? Number(saved) : 1;
  });
  const [misterWhiteCount, setMisterWhiteCount] = useState(() => {
    const saved = localStorage.getItem('undercover-misterWhiteCount');
    return saved ? Number(saved) : 1;
  });
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem('undercover-categories');
    return saved ? JSON.parse(saved) : ['melange'];
  });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('undercover-players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('undercover-gameType', gameType);
  }, [gameType]);

  useEffect(() => {
    localStorage.setItem('undercover-undercoverCount', undercoverCount.toString());
  }, [undercoverCount]);

  useEffect(() => {
    localStorage.setItem('undercover-misterWhiteCount', misterWhiteCount.toString());
  }, [misterWhiteCount]);

  useEffect(() => {
    localStorage.setItem('undercover-categories', JSON.stringify(selectedCategories));
  }, [selectedCategories]);

  useEffect(() => {
    const maxSpecial = Math.max(0, players.length - 1);
    if (undercoverCount > maxSpecial) {
      setUndercoverCount(maxSpecial);
    }
    if (misterWhiteCount > maxSpecial - Math.min(undercoverCount, maxSpecial)) {
      setMisterWhiteCount(Math.max(0, maxSpecial - Math.min(undercoverCount, maxSpecial)));
    }
  }, [players.length, undercoverCount, misterWhiteCount]);

  const addPlayer = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ce nom existe déjà.');
      return;
    }
    setPlayers((prev) => [...prev, { id: prev.length + 1, name: trimmed }]);
    setName('');
    setError('');
  };

  const removePlayer = (id) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id).map((player, index) => ({ ...player, id: index + 1 })));
  };

  const resetPlayers = () => {
    if (window.confirm('Êtes-vous sûr ? Cette action vide la liste des joueurs.')) {
      setPlayers([]);
      localStorage.removeItem('undercover-players');
      setError('');
    }
  };

  const toggleCategory = (key) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const clampTotalSpecials = () => Math.max(0, players.length - undercoverCount - misterWhiteCount);
  const civilsCount = clampTotalSpecials();
  const canAddUndercover = players.length - (undercoverCount + misterWhiteCount) > 1;
  const canAddMisterWhite = players.length - (undercoverCount + misterWhiteCount) > 0;

  const handleStart = () => {
    if (players.length < 3) {
      setError('Ajoutez au moins 3 joueurs pour commencer.');
      return;
    }
    if (gameType === 'undercover') {
      if (undercoverCount < 1) {
        setError('Choisissez au moins 1 Undercover.');
        return;
      }
      if (undercoverCount + misterWhiteCount >= players.length) {
        setError('Trop de rôles spéciaux. Réduisez le nombre d’Undercover ou de Mister White.');
        return;
      }
      setError('');
      initializeUndercover({ players: players.map((p) => p.name), undercoverCount, misterWhiteCount });
      navigate('/undercover');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('Choisissez au moins une catégorie Time’s Up.');
      return;
    }
    setError('');
    startTimesUp({ players: players.map((p) => p.name), categories: selectedCategories });
    navigate('/timesup');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-[2rem] bg-[var(--card)] p-6 shadow-glow sm:p-8">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-2 text-base font-semibold text-[var(--accent)]">Préparez la partie</span>
          <h1 className="text-3xl font-bold sm:text-4xl">Préparation rapide</h1>
          <p className="text-base leading-7 text-[var(--muted)]">Ajoutez les joueurs, choisissez le mode puis lancez directement le jeu sur le même téléphone.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setGameType('undercover')}
            className={`rounded-[2rem] border px-5 py-5 text-left text-base font-semibold transition ${gameType === 'undercover' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
            <p className="uppercase tracking-[0.25em] text-[var(--muted)]">Undercover</p>
            <p className="mt-3 text-xl font-semibold">Jeu de rôle secret</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Bluffez, devinez et éliminez les imposteurs avant la fin.</p>
          </button>

          <button
            type="button"
            onClick={() => setGameType('timesup')}
            className={`rounded-[2rem] border px-5 py-5 text-left text-base font-semibold transition ${gameType === 'timesup' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
            <p className="uppercase tracking-[0.25em] text-[var(--muted)]">Time's Up</p>
            <p className="mt-3 text-xl font-semibold">Défis chronométrés</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Faites deviner, marquez des points et passez le téléphone.</p>
          </button>
        </div>
      </div>

      <div className="grid gap-6 pt-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow sm:p-8">
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Joueurs</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom du joueur"
                  className="flex-1 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-base text-[var(--text)] outline-none"
                />
                <button type="button" onClick={addPlayer} className="rounded-[1.75rem] bg-[var(--primary)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5">
                  Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {players.length ? (
                  players.map((player) => (
                    <div key={player.id} className="flex flex-col gap-3 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-base font-semibold">{player.name}</span>
                      <button type="button" onClick={() => removePlayer(player.id)} className="rounded-full bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20">
                        Supprimer
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-base text-[var(--muted)]">Ajouter les noms des joueurs à tour de rôle.</p>
                )}
              </div>
            </div>
            {players.length > 0 && (
              <button type="button" onClick={resetPlayers} className="rounded-[1.75rem] bg-red-500/20 px-5 py-4 text-base font-semibold text-red-200 transition hover:bg-red-500/30">
                Réinitialiser les joueurs
              </button>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow sm:p-8">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Configuration</h2>
              <p className="mt-2 text-base leading-7 text-[var(--muted)]">Choisissez un mode et ajustez les rôles selon le nombre de joueurs.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setGameType('undercover')}
                className={`rounded-[1.75rem] border px-4 py-4 text-left text-base font-semibold transition ${gameType === 'undercover' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
                Undercover
              </button>
              <button
                type="button"
                onClick={() => setGameType('timesup')}
                className={`rounded-[1.75rem] border px-4 py-4 text-left text-base font-semibold transition ${gameType === 'timesup' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
                Time's Up
              </button>
            </div>

            {gameType === 'undercover' ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Joueurs</p>
                    <p className="mt-4 text-4xl font-bold">{players.length}</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Civils</p>
                    <p className="mt-4 text-4xl font-bold">{civilsCount}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-[var(--muted)]">
                    Nombre Undercover
                    <div className="flex items-center gap-3 rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setUndercoverCount((prev) => Math.max(1, prev - 1))}
                        className="h-11 w-11 rounded-full bg-[var(--surface)] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                        disabled={undercoverCount <= 1}
                      >
                        −
                      </button>
                      <span className="text-xl font-semibold">{undercoverCount}</span>
                      <button
                        type="button"
                        onClick={() => setUndercoverCount((prev) => Math.min(prev + 1, Math.max(1, players.length - misterWhiteCount)))}
                        className="h-11 w-11 rounded-full bg-[var(--surface)] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                        disabled={!canAddUndercover}
                      >
                        +
                      </button>
                    </div>
                  </label>
                  <label className="space-y-2 text-sm text-[var(--muted)]">
                    Nombre Mister White
                    <div className="flex items-center gap-3 rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setMisterWhiteCount((prev) => Math.max(0, prev - 1))}
                        className="h-11 w-11 rounded-full bg-[var(--surface)] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                        disabled={misterWhiteCount <= 0}
                      >
                        −
                      </button>
                      <span className="text-xl font-semibold">{misterWhiteCount}</span>
                      <button
                        type="button"
                        onClick={() => setMisterWhiteCount((prev) => Math.min(prev + 1, Math.max(0, players.length - undercoverCount)))}
                        className="h-11 w-11 rounded-full bg-[var(--surface)] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                        disabled={!canAddMisterWhite}
                      >
                        +
                      </button>
                    </div>
                  </label>
                </div>

                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
                  <p>Undercover : {undercoverCount}</p>
                  <p>Mister White : {misterWhiteCount}</p>
                  <p>Civils : {civilsCount}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted)]">Choisissez les catégories Time's Up pour votre session.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {timesUpCategories.map((categoryOption) => (
                    <button
                      key={categoryOption.key}
                      type="button"
                      onClick={() => toggleCategory(categoryOption.key)}
                      className={`rounded-[1.75rem] border px-4 py-4 text-left text-sm font-semibold transition ${selectedCategories.includes(categoryOption.key) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
                      {categoryOption.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="rounded-[1.75rem] bg-red-500/10 px-4 py-4 text-base text-red-200">{error}</p>}

      <button onClick={handleStart} className="w-full rounded-[1.75rem] bg-[var(--accent)] px-6 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5">
        Lancer la partie
      </button>
    </div>
  );
}
