import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function JoinRoom() {
  const { socket, setPlayer } = useSocket();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!socket) return setError('Connexion indisponible.');
    if (!playerName.trim() || !roomCode.trim()) return setError('Pseudo et code de salle requis.');

    setError('');
    socket.emit(
      'joinRoom',
      { playerName: playerName.trim(), roomCode: roomCode.trim().toUpperCase() },
      (response) => {
        if (!response.success) {
          setError(response.message || 'Impossible de rejoindre la salle.');
          return;
        }
        setPlayer(response.player);
        navigate('/lobby');
      }
    );
  };

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-soft">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Rejoindre une partie</p>
        <h1 className="text-3xl font-bold">Entrez le code et rejoignez vos amis</h1>
        <p className="text-[var(--muted)]">Un pseudo est obligatoire pour chaque salle. Les mises à jour se font en direct.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <label className="space-y-2 text-sm text-[var(--muted)]">
          Pseudo
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ex : Alex"
            className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
          />
        </label>
        <label className="space-y-2 text-sm text-[var(--muted)]">
          Code de salle
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="ABCDE"
            className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--text)] uppercase outline-none transition focus:border-[var(--primary)]"
          />
        </label>

        {error && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

        <button className="rounded-full bg-[var(--secondary)] px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5">
          Rejoindre la salle
        </button>
      </form>
    </div>
  );
}
