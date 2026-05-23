import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import UndercoverRoom from './pages/UndercoverRoom';
import TimesUpRoom from './pages/TimesUpRoom';
import GameOver from './pages/GameOver';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <Navbar />
      <main className="px-4 py-6 sm:px-6 lg:px-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/undercover" element={<UndercoverRoom />} />
          <Route path="/timesup" element={<TimesUpRoom />} />
          <Route path="/end" element={<GameOver />} />
        </Routes>
      </main>
    </div>
  );
}
