import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const categories = [
  { value: 'animaux', label: 'Animaux' },
  { value: 'films', label: 'Films' },
  { value: 'jeux-video', label: 'Jeux vidéo' },
  { value: 'personnages', label: 'Personnages célèbres' },
  { value: 'melange', label: 'Mélangé' },
];

const timesUpCategories = [
  { value: 'animaux', label: 'Animaux' },
  { value: 'films', label: 'Films' },
  { value: 'jeux-video', label: 'Jeux vidéo' },
  { value: 'personnages', label: 'Personnages célèbres' },
  { value: 'melange', label: 'Mélangé' },
];

export default function CreateRoom() {
  const { socket, setPlayer } = useSocket();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [gameType, setGameType] = useState('undercover');
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [misterWhiteCount, setMisterWhiteCount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState(['melange']);
  const [error, setError] = useState('');

  useEffect(() => {
    const pref = searchParams.get('game');
    if (pref === 'timesup' || pref === 'undercover') {
      setGameType(pref);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!socket) return;
    const handleJoined = (payload) => {
      setPlayer(payload.player);
      navigate('/lobby');
    };
    socket.on('joinedRoom', handleJoined);
    return () => socket.off('joinedRoom', handleJoined);
  }, [socket, navigate, setPlayer]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!socket) return setError('Connexion indisponible.');
    if (!playerName.trim()) return setError('Pseudo requis');

    setError('');
    socket.emit(
      'createRoom',
      {
        playerName: playerName.trim(),
        gameType,
        undercoverCount,
        misterWhiteCount,
        categories: selectedCategories,
      },
      (response) => {
        if (!response.success) {
          setError(response.message || 'Impossible de créer la partie.');
          return;
        }
        setPlayer(response.player);
        navigate('/lobby');
      }
    );
  };

  const handleCategoryToggle = (value) => {
    setSelectedCategories((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Créer une salle</p>
        <h1 className="text-3xl font-bold">Préparez la partie et invitez vos amis</h1>
        <p className="text-[var(--muted)]">Choisissez le jeu, les catégories, puis récupérez le code pour démarrer une partie multijoueur.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-[var(--muted)]">
            Votre pseudo
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex : Léa"
              className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
            />
          </label>
          <label className="space-y-2 text-sm text-[var(--muted)]">
            Choix du jeu
            <select value={gameType} onChange={(e) => setGameType(e.target.value)} className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)]">
              <option value="undercover">Undercover</option>
              <option value="timesup">Time's Up</option>
            </select>
          </label>
        </div>

        {gameType === 'undercover' ? (
          <div className="space-y-4">
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
                    onClick={() => setUndercoverCount((prev) => prev + 1)}
                    className="h-11 w-11 rounded-full bg-[var(--surface)] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
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
                    onClick={() => setMisterWhiteCount((prev) => prev + 1)}
                    className="h-11 w-11 rounded-full bg-[var(--surface)] text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)]">
              <p>Undercover : {undercoverCount}</p>
              <p>Mister White : {misterWhiteCount}</p>
              <p>Jouez toujours avec un nombre de joueurs supérieur à Undercover + Mister White.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm font-semibold text-[var(--text)]">Sélectionnez les catégories Time's Up</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {timesUpCategories.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleCategoryToggle(option.value)}
                  className={`rounded-3xl border px-4 py-3 text-sm transition ${selectedCategories.includes(option.value) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text)]' : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)]'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

        <button className="mx-auto rounded-full bg-[var(--primary)] px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5">
          Créer la salle
        </button>
      </form>
    </div>
  );
}
