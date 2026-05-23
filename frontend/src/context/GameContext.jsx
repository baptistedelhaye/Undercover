import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import wordsData from '../data/words.json';

const GameContext = createContext();

const sampleWords = {
  animaux: [
    { civil: 'Chat', undercover: 'Tigre' },
    { civil: 'Chien', undercover: 'Loup' },
    { civil: 'Lapin', undercover: 'Renard' },
  ],
  films: [
    { civil: 'Cinéphile', undercover: 'Réalisateur' },
    { civil: 'Oscar', undercover: 'Blockbuster' },
    { civil: 'Scène', undercover: 'Coulisse' },
  ],
  'jeux-video': [
    { civil: 'Quête', undercover: 'Boss' },
    { civil: 'Niveau', undercover: 'Pixel' },
    { civil: 'Chemin', undercover: 'Mana' },
  ],
  personnages: [
    { civil: 'Musicien', undercover: 'Acteur' },
    { civil: 'Explorateur', undercover: 'Voyageur' },
    { civil: 'Héros', undercover: 'Anti-héros' },
  ],
  melange: [
    { civil: 'Fête', undercover: 'Secret' },
    { civil: 'Lumière', undercover: 'Ombre' },
    { civil: 'Carte', undercover: 'Mystère' },
  ],
};

const timesUpCards = [
  'Arc-en-ciel',
  'Dragon',
  'Indiana Jones',
  'Guitare',
  'Chat botté',
  'Fast and Furious',
  'Fortnite',
  'Lion',
  'Marie Curie',
  'Mario',
  'Licorne',
  'Super-héros',
  'Médaille',
];

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getRandomIndices(count, length) {
  const indices = Array.from({ length }, (_, index) => index);
  const selected = [];
  for (let i = 0; i < count && indices.length > 0; i += 1) {
    const randomIndex = Math.floor(Math.random() * indices.length);
    selected.push(indices.splice(randomIndex, 1)[0]);
  }
  return selected;
}

function getAliveRoleCounts(players, secrets) {
  const counts = { undercover: 0, misterWhite: 0, civil: 0 };
  players.forEach((player) => {
    if (!player.alive) return;
    const role = secrets?.[player.id]?.role;
    if (role === 'undercover') counts.undercover += 1;
    else if (role === 'mister') counts.misterWhite += 1;
    else counts.civil += 1;
  });
  return counts;
}

function computeWinner(counts) {
  if (counts.undercover === 0 && counts.misterWhite === 0) {
    return 'Civils';
  }
  if (counts.undercover >= counts.civil) {
    return 'Undercover';
  }
  return null;
}

function findNextAlivePlayerId(players, eliminatedId) {
  const alive = players.filter((player) => player.alive && player.id !== eliminatedId);
  if (!alive.length) return null;
  const order = players.map((player) => player.id);
  const eliminatedIndex = order.indexOf(eliminatedId);
  let nextIndex = eliminatedIndex + 1;
  while (nextIndex < order.length) {
    const nextId = order[nextIndex];
    if (alive.some((player) => player.id === nextId)) return nextId;
    nextIndex += 1;
  }
  return alive[0].id;
}

function pickUndercoverWords() {
  const pairs = Array.isArray(wordsData.undercover) && wordsData.undercover.length
    ? wordsData.undercover
    : sampleWords.melange;
  return pairs[Math.floor(Math.random() * pairs.length)];
}

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(() => {
    const saved = window.localStorage.getItem('party-games-state');
    return saved ? JSON.parse(saved) : { stage: 'home', theme: 'dark' };
  });

  useEffect(() => {
    window.localStorage.setItem('party-games-state', JSON.stringify(gameState));
  }, [gameState]);

  const initializeUndercover = ({ players, undercoverCount = 1, misterWhiteCount = 0 }) => {
    const secretPair = pickUndercoverWords();
    const order = players.map((player, index) => ({ id: index + 1, name: player.trim(), alive: true, seen: false }));
    const maxUndercover = Math.max(1, Math.min(undercoverCount, Math.max(1, order.length - 1)));
    const maxMisterWhite = Math.max(0, Math.min(misterWhiteCount, order.length - maxUndercover));
    const undercoverIndices = getRandomIndices(maxUndercover, order.length);
    const remainingIndices = order.map((_, index) => index).filter((index) => !undercoverIndices.includes(index));
    const misterWhiteIndices = getRandomIndices(maxMisterWhite, remainingIndices.length).map(
      (remainingIndex) => remainingIndices[remainingIndex]
    );

    const secrets = order.reduce((acc, player, index) => {
      const role = undercoverIndices.includes(index)
        ? 'undercover'
        : misterWhiteIndices.includes(index)
        ? 'mister'
        : 'civil';
      acc[player.id] = {
        role,
        word: role === 'civil' ? secretPair.civil : role === 'undercover' ? secretPair.undercover : 'Aucun mot',
      };
      return acc;
    }, {});

    let revealIndex = 0;
    const nonMisterIdx = order.findIndex((p) => secrets[p.id].role !== 'mister');
    revealIndex = nonMisterIdx >= 0 ? nonMisterIdx : 0;

    setGameState({
      stage: 'undercover',
      game: 'undercover',
      players: order,
      secretPair,
      undercoverCount: maxUndercover,
      misterWhiteCount: maxMisterWhite,
      secrets,
      revealIndex,
      roundStartPlayerId: order[revealIndex].id,
      phase: 'reveal',
      round: 1,
      history: [],
      revealed: false,
      viewedBy: null,
      currentWord: null,
      awaitingNext: false,
      pendingMister: null,
      winner: null,
      summary: null,
    });
  };

  const startTimesUp = ({ players, categories }) => {
    const cardPool = categories.length > 0
      ? categories.flatMap((cat) => (wordsData[cat] || sampleWords[cat] || []).map((item) => (typeof item === 'string' ? item : item.civil || '')))
      : timesUpCards;
    const deck = shuffle(cardPool.length ? cardPool : timesUpCards).slice(0, 30);
    setGameState({
      stage: 'timesup',
      game: 'timesup',
      players: players.map((player, index) => ({ id: index + 1, name: player.trim() })),
      categories,
      round: 1,
      teamTurn: 'A',
      score: { A: 0, B: 0 },
      deck,
      currentCardIndex: 0,
      phase: 'play',
      winner: null,
      summary: null,
    });
  };

  const revealPlayerWord = (playerId) => {
    const secret = gameState.secrets?.[playerId];
    if (!secret) return;
    setGameState((prev) => {
      const playerIdx = prev.players.findIndex((p) => p.id === playerId);
      const player = prev.players[playerIdx];
      // if player already saw their word in a previous round, do NOT reveal again
      if (player?.seen) {
        const players = prev.players.map((p) => (p.id === playerId ? { ...p, seen: true } : p));
        return {
          ...prev,
          players,
          revealed: false,
          viewedBy: playerId,
          currentWord: null,
          awaitingNext: true,
        };
      }
      const players = prev.players.map((p) => (p.id === playerId ? { ...p, seen: true } : p));
      return {
        ...prev,
        players,
        revealed: true,
        viewedBy: playerId,
        currentWord: secret.role === 'mister'
          ? "Vous n'avez aucun mot secret. Improvisez votre description."
          : secret.word,
      };
    });
  };

  const hideWord = () => {
    setGameState((prev) => ({
      ...prev,
      revealed: false,
      viewedBy: null,
      currentWord: null,
      awaitingNext: true,
    }));
  };

  const passToNextPlayer = () => {
    setGameState((prev) => {
      if (!prev.players) return prev;
      const revealIndex = prev.revealIndex ?? 0;
      const nextIndex = revealIndex + 1;
      const allPlayers = prev.players.filter((p) => p.alive);
      const isLastReveal = nextIndex >= allPlayers.length;
      return {
        ...prev,
        awaitingNext: false,
        revealIndex: isLastReveal ? 0 : nextIndex,
        phase: isLastReveal ? 'round' : 'reveal',
      };
    });
  };

  const eliminatePlayer = (targetId) => {
    setGameState((prev) => {
      if (!prev.players || !prev.secrets) return prev;
      const players = prev.players.map((player) => (
        player.id === targetId ? { ...player, alive: false } : player
      ));
      const history = [...prev.history, { targetId, targetName: players.find((p) => p.id === targetId)?.name }];
      const aliveCounts = getAliveRoleCounts(players, prev.secrets);
      const eliminatedRole = prev.secrets[targetId]?.role;
      const nextRoundStarterId = findNextAlivePlayerId(players, targetId);

      if (eliminatedRole === 'mister') {
        return {
          ...prev,
          players,
          history,
          pendingMister: {
            id: targetId,
            name: players.find((p) => p.id === targetId)?.name,
            nextRoundStarterId,
          },
          phase: 'misterGuess',
          revealIndex: 0,
          roundStartPlayerId: nextRoundStarterId,
          winner: null,
          summary: null,
        };
      }

      const winner = computeWinner(aliveCounts);
      const summary = winner === 'Civils'
        ? 'Tous les Undercover et Mister White ont été éliminés.'
        : winner === 'Undercover'
        ? 'Les Undercover ont pris le dessus.'
        : null;

      return {
        ...prev,
        players,
        history,
        pendingMister: null,
        roundStartPlayerId: nextRoundStarterId,
        revealIndex: 0,
        round: winner ? prev.round : (prev.round || 1) + 1,
        phase: winner ? 'end' : 'round',
        stage: winner ? 'end' : prev.stage,
        winner,
        summary,
      };
    });
  };

  const guessMisterWord = (guess) => {
    setGameState((prev) => {
      if (!prev.secretPair) return prev;
      const pending = prev.pendingMister;
      const success = guess.trim().toLowerCase() === (prev.secretPair.civil || '').toLowerCase();
      if (pending) {
        if (success) {
          return {
            ...prev,
            winner: 'Mister White',
            summary: `Mister White a deviné le mot ${prev.secretPair.civil}.`,
            phase: 'end',
            stage: 'end',
            pendingMister: null,
          };
        }

        const aliveCounts = getAliveRoleCounts(prev.players, prev.secrets);
        const winner = computeWinner(aliveCounts);
        const summary = winner === 'Civils'
          ? 'Tous les Undercover et Mister White ont été éliminés.'
          : winner === 'Undercover'
          ? 'Les Undercover ont pris le dessus.'
          : null;

        return {
          ...prev,
          pendingMister: null,
          roundStartPlayerId: pending.nextRoundStarterId || prev.roundStartPlayerId || null,
          revealIndex: 0,
          phase: winner ? 'end' : 'round',
          stage: winner ? 'end' : prev.stage,
          round: winner ? prev.round : (prev.round || 1) + 1,
          winner,
          summary,
        };
      }

      return prev;
    });
  };

  const startVote = () => {
    setGameState((prev) => ({ ...prev, phase: 'vote' }));
  };

  const nextTimesUpCard = (found) => {
    setGameState((prev) => {
      if (!prev.deck) return prev;
      const nextIndex = prev.currentCardIndex + 1;
      const score = { ...prev.score };
      if (found) {
        score[prev.teamTurn] += 1;
      }
      if (nextIndex >= prev.deck.length) {
        const nextRound = prev.round + 1;
        if (nextRound > 3) {
          const winner = score.A > score.B ? 'Équipe A' : score.B > score.A ? 'Équipe B' : 'Match nul';
          const summary = `Score final ${score.A} - ${score.B}`;
          return { ...prev, score, winner, summary, phase: 'end', stage: 'end' };
        }
        return { ...prev, round: nextRound, currentCardIndex: 0, teamTurn: prev.teamTurn === 'A' ? 'B' : 'A', score, phase: 'play' };
      }
      return { ...prev, currentCardIndex: nextIndex, score, phase: 'play' };
    });
  };

  const restartGame = () => {
    setGameState({ stage: 'home' });
  };

  const replayUndercover = () => {
    if (!gameState.players) return;
    const names = gameState.players.map((p) => p.name);
    initializeUndercover({ players: names, undercoverCount: gameState.undercoverCount, misterWhiteCount: gameState.misterWhiteCount });
  };

  const value = useMemo(
    () => ({
      gameState,
      initializeUndercover,
      startTimesUp,
      revealPlayerWord,
      hideWord,
      eliminatePlayer,
      passToNextPlayer,
      startVote,
      replayUndercover,
      guessMisterWord,
      nextTimesUpCard,
      restartGame,
    }),
    [gameState]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
