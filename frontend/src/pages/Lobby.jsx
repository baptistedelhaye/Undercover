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
    <div className="mx-auto max-w-5xl space-y-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
      <div className="relative overflow-hidden rounded-[2rem] bg-[var(--card)] p-8 shadow-glow">
        <div className="pointer-events-none absolute -right-8 top-8 h-32 w-32 rounded-full bg-[var(--accent)]/15 blur-3xl"></div>
        <div className="pointer-events-none absolute left-8 bottom-8 h-32 w-32 rounded-full bg-[var(--primary)]/15 blur-3xl"></div>
        <h1 className="text-3xl font-bold">Préparation de la partie</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">Ajoutez les joueurs, choisissez Undercover ou Time's Up, puis lancez une partie immédiatement.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setGameType('undercover')}
            className={`card-hover rounded-[2rem] border px-6 py-6 text-left transition ${gameType === 'undercover' ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Undercover</p>
            <h2 className="mt-4 text-2xl font-bold">Jeu de rôle secret</h2>
            <p className="mt-3 text-[var(--muted)]">Bluffez, devinez et éliminez les imposteurs avant qu’ils ne prennent le pouvoir.</p>
          </button>
          <button
            type="button"
            onClick={() => setGameType('timesup')}
            className={`card-hover rounded-[2rem] border px-6 py-6 text-left transition ${gameType === 'timesup' ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Time's Up</p>
            <h2 className="mt-4 text-2xl font-bold">Défis en temps limité</h2>
            <p className="mt-3 text-[var(--muted)]">Faites deviner, mimez et marquez des points le plus vite possible.</p>
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
          <h2 className="text-xl font-semibold">Joueurs</h2>
          <div className="mt-4 flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du joueur"
              className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none"
            />
            <button type="button" onClick={addPlayer} className="rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white">
              Ajouter
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <span>{player.name}</span>
                <button type="button" onClick={() => removePlayer(player.id)} className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-200">
                  Supprimer
                </button>
              </div>
            ))}
            {players.length === 0 && <p className="text-[var(--muted)]">Ajouter les noms des joueurs à tour de rôle.</p>}
          </div>
          {players.length > 0 && (
            <button type="button" onClick={resetPlayers} className="mt-4 rounded-full bg-red-500/20 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/30">
              Réinitialiser les joueurs
            </button>
          )}
        </div>

        <div className="rounded-[2rem] bg-[var(--card)] p-6 shadow-glow">
          <h2 className="text-xl font-semibold">Configuration</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Jeu sélectionné</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setGameType('undercover')}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${gameType === 'undercover' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
                  <p className="font-semibold">Undercover</p>
                  <p className="mt-2 text-sm">Rôles secrets et élimination progressive.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setGameType('timesup')}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${gameType === 'timesup' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]'}`}>
                  <p className="font-semibold">Time's Up</p>
                  <p className="mt-2 text-sm">Chrono, devinettes et points d’équipe.</p>
                </button>
              </div>
            </div>

            {gameType === 'undercover' ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Joueurs</p>
                    <p className="mt-4 text-4xl font-bold">{players.length}</p>
                  </div>
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Civils</p>
                    <p className="mt-4 text-4xl font-bold">{civilsCount}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-[var(--muted)]">
                    Nombre Undercover
                    <div className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
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
                    <div className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
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

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
                  <p>Undercover : {undercoverCount}</p>
                  <p>Mister White : {misterWhiteCount}</p>
                  <p>Civils : {civilsCount}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--muted)]">Choisissez les catégories Time's Up pour votre session.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {timesUpCategories.map((categoryOption) => (
                    <button
                      key={categoryOption.key}
                      type="button"
                      onClick={() => toggleCategory(categoryOption.key)}
                      className={`rounded-3xl border px-4 py-3 text-left text-sm transition ${selectedCategories.includes(categoryOption.key) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'}`}>
                      {categoryOption.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {error && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <button onClick={handleStart} className="rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5">
        Lancer la partie
      </button>
    </div>
  );
}
