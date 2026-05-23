import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wordsPath = path.join(__dirname, '../data/words.json');
const roomsPath = path.join(__dirname, '../data/rooms.json');

const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
let rooms = loadRooms();

function loadRooms() {
  try {
    const file = fs.readFileSync(roomsPath, 'utf8');
    return file.trim() ? JSON.parse(file) : {};
  } catch (error) {
    return {};
  }
}

function saveRooms() {
  fs.writeFileSync(roomsPath, JSON.stringify(rooms, null, 2), 'utf8');
}

function generateRoomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return rooms[code] ? generateRoomCode() : code;
}

function shuffle(array) {
  const list = [...array];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function getUndercoverPairs() {
  return Object.entries(wordsData)
    .filter(([key]) => key !== 'timesup')
    .flatMap(([, entries]) => (Array.isArray(entries) ? entries : []))
    .filter((entry) => entry && typeof entry === 'object' && 'civil' in entry && 'undercover' in entry);
}

function sanitizeRoom(room) {
  const safePlayers = room.players.map(({ id, name, alive }) => ({ id, name, alive }));
  return {
    id: room.id,
    code: room.code,
    hostId: room.hostId,
    hostName: room.hostName,
    gameType: room.gameType,
    category: room.category,
    categories: room.categories,
    undercoverCount: room.undercoverCount || 1,
    misterWhiteCount: room.misterWhiteCount || 0,
    misterWhite: room.misterWhite,
    status: room.status,
    players: safePlayers,
    turnOrder: room.turnOrder,
    currentTurnIndex: room.currentTurnIndex,
    history: room.history,
    score: room.score,
    teamTurn: room.teamTurn,
    round: room.round,
    cardQueue: room.cardQueue,
    currentCardIndex: room.currentCardIndex,
    winner: room.winner,
    summary: room.summary,
  };
}

function getRoomByCode(roomCode) {
  return rooms[roomCode] || null;
}

function assignUndercoverSecretWords(room) {
  const pairs = getUndercoverPairs();
  const pair = pairs.length ? pairs[Math.floor(Math.random() * pairs.length)] : { civil: 'Civils', undercover: 'Méchants' };
  const alivePlayers = room.players.filter((player) => player.alive);
  const undercoverCount = Math.max(1, Math.min(room.undercoverCount || 1, alivePlayers.length - 1));
  const misterWhiteCount = Math.max(0, Math.min(room.misterWhiteCount || 0, alivePlayers.length - undercoverCount));
  const playerIndexes = alivePlayers.map((_, index) => index);
  const shuffledIndexes = shuffle(playerIndexes);
  const undercoverIndexes = shuffledIndexes.slice(0, undercoverCount);
  const misterWhiteIndexes = shuffledIndexes.slice(undercoverCount, undercoverCount + misterWhiteCount);

  room.secrets = {};
  room.civilWord = pair.civil;
  room.undercoverWord = pair.undercover;

  alivePlayers.forEach((player, index) => {
    const isUndercover = undercoverIndexes.includes(index);
    const isMisterWhite = misterWhiteIndexes.includes(index);
    const role = isUndercover ? 'undercover' : isMisterWhite ? 'mister' : 'civil';
    room.secrets[player.id] = {
      role,
      word: role === 'civil' ? pair.civil : role === 'undercover' ? pair.undercover : 'Aucun mot',
    };
  });
  room.turnOrder = alivePlayers.map((player) => player.id);
  room.currentTurnIndex = 0;
  room.history = [];
  room.winner = null;
  room.summary = '';
}

function buildTimesUpDeck(room) {
  const voteCards = [];
  room.categories.forEach((category) => {
    if (wordsData[category]) {
      voteCards.push(...wordsData[category].map((item) => (typeof item === 'string' ? item : item.civil || item)));
    }
  });
  const cards = shuffle(voteCards);
  return cards.slice(0, Math.max(8, Math.min(30, cards.length)));
}

function createRoomData({ playerName, gameType, category, misterWhite, categories, undercoverCount, misterWhiteCount }, socket) {
  const code = generateRoomCode();
  const room = {
    id: code,
    code,
    hostId: socket.id,
    hostName: playerName,
    gameType,
    category,
    categories: categories?.length ? categories : ['melange'],
    undercoverCount: Math.max(1, Number(undercoverCount) || 1),
    misterWhiteCount: Math.max(0, Number(misterWhiteCount) || (misterWhite ? 1 : 0)),
    misterWhite: !!misterWhite,
    status: 'waiting',
    players: [{ id: socket.id, name: playerName, alive: true }],
    turnOrder: [],
    currentTurnIndex: 0,
    history: [],
    score: { A: 0, B: 0 },
    teamTurn: 'A',
    round: 1,
    cardQueue: [],
    currentCardIndex: 0,
    secrets: {},
    winner: null,
    summary: '',
  };
  rooms[code] = room;
  saveRooms();
  return room;
}

function updateRoom(room, io) {
  rooms[room.code] = room;
  saveRooms();
  io.to(room.code).emit('roomData', sanitizeRoom(room));
}

function removePlayerFromRoom(socket, io) {
  const room = Object.values(rooms).find((item) => item.players.some((player) => player.id === socket.id));
  if (!room) return;
  room.players = room.players.filter((player) => player.id !== socket.id);
  room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
  if (room.hostId === socket.id && room.players.length > 0) {
    room.hostId = room.players[0].id;
    room.hostName = room.players[0].name;
  }
  if (room.players.length === 0) {
    delete rooms[room.code];
  } else {
    updateRoom(room, io);
  }
}

function nextAliveIndex(room, index) {
  const alive = room.turnOrder.filter((playerId) => room.players.find((player) => player.id === playerId)?.alive);
  if (!alive.length) return 0;
  const current = alive.indexOf(room.turnOrder[index]);
  return room.turnOrder.indexOf(alive[(current + 1) % alive.length]);
}

function endUndercoverIfNeeded(room) {
  if (room.status === 'ended') return;
  const alivePlayers = room.players.filter((player) => player.alive);
  const undercoverAlive = alivePlayers.filter((p) => room.secrets[p.id]?.role === 'undercover').length;
  const misterAlive = alivePlayers.filter((p) => room.secrets[p.id]?.role === 'mister').length;
  const civilsAlive = alivePlayers.filter((p) => room.secrets[p.id]?.role === 'civil').length;

  if (undercoverAlive === 0 && misterAlive === 0) {
    room.status = 'ended';
    room.winner = 'Civils';
    room.summary = 'Tous les Undercover et Mister White ont été éliminés.';
    return;
  }

  if (undercoverAlive >= civilsAlive) {
    room.status = 'ended';
    room.winner = 'Undercover';
    room.summary = 'Les Undercover sont désormais au moins aussi nombreux que les civils.';
  }
}

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('createRoom', (payload, callback) => {
      const room = createRoomData(payload, socket);
      socket.join(room.code);
      callback({ success: true, player: { id: socket.id, name: payload.playerName, role: 'host' }, room: sanitizeRoom(room) });
      io.to(room.code).emit('joinedRoom', { player: { id: socket.id, name: payload.playerName }, room: sanitizeRoom(room) });
    });

    socket.on('joinRoom', ({ playerName, roomCode }, callback) => {
      const room = getRoomByCode(roomCode);
      if (!room) {
        callback({ success: false, message: 'Salle introuvable.' });
        return;
      }
      if (room.status !== 'waiting') {
        callback({ success: false, message: 'La salle a déjà démarré.' });
        return;
      }
      if (room.players.some((player) => player.name.toLowerCase() === playerName.toLowerCase())) {
        callback({ success: false, message: 'Ce pseudo est déjà utilisé.' });
        return;
      }
      const player = { id: socket.id, name: playerName, alive: true };
      room.players.push(player);
      socket.join(room.code);
      updateRoom(room, io);
      callback({ success: true, player, room: sanitizeRoom(room) });
      io.to(room.code).emit('joinedRoom', { player, room: sanitizeRoom(room) });
    });

    socket.on('startGame', ({ roomId }, callback) => {
      const room = getRoomByCode(roomId);
      if (!room || room.hostId !== socket.id) {
        callback({ success: false, message: 'Vous n’êtes pas l’hôte ou la salle est introuvable.' });
        return;
      }
      if (room.players.length < 3) {
        callback({ success: false, message: 'Il faut au moins 3 joueurs pour commencer.' });
        return;
      }
      if (room.gameType === 'undercover') {
        const totalSpecial = (room.undercoverCount || 1) + (room.misterWhiteCount || 0);
        if (totalSpecial >= room.players.length) {
          callback({ success: false, message: 'Le nombre d’Undercover et Mister White doit être inférieur au nombre de joueurs.' });
          return;
        }
      }
      room.status = 'started';
      if (room.gameType === 'undercover') {
        assignUndercoverSecretWords(room);
      } else {
        room.cardQueue = buildTimesUpDeck(room);
        room.score = { A: 0, B: 0 };
        room.teamTurn = 'A';
        room.round = 1;
        room.currentCardIndex = 0;
      }
      updateRoom(room, io);
      room.players.forEach((player) => {
        const secret = room.secrets?.[player.id] || { role: 'player', word: null };
        const socketId = player.id;
        const socketInstance = io.sockets.sockets.get(socketId);
        if (socketInstance) {
          socketInstance.emit('playerInfo', { id: player.id, name: player.name, role: secret.role, word: secret.word });
        }
      });
      callback({ success: true });
    });

    socket.on('requestWord', ({ roomId }, callback) => {
      const room = getRoomByCode(roomId);
      const secret = room?.secrets?.[socket.id];
      if (!room || !secret) {
        const message = 'Vous ne pouvez pas voir le mot.';
        if (callback) callback({ success: false, message });
        socket.emit('playerWord', { success: false, message });
        return;
      }
      socket.emit('playerWord', { success: true, word: secret.word });
      if (callback) callback({ success: true });
    });

    socket.on('votePlayer', ({ roomId, voterId, targetId }, callback) => {
      const room = getRoomByCode(roomId);
      if (!room || room.status !== 'started') {
        callback({ success: false, message: 'Vote impossible.' });
        return;
      }
      const voter = room.players.find((player) => player.id === voterId && player.alive);
      const target = room.players.find((player) => player.id === targetId && player.alive);
      if (!voter || !target) {
        callback({ success: false, message: 'Vote invalide.' });
        return;
      }
      room.history.push({ voterId, voterName: voter.name, targetId, targetName: target.name, eliminated: false });
      target.alive = false;
      room.history[room.history.length - 1].eliminated = true;
      endUndercoverIfNeeded(room);
      updateRoom(room, io);
      callback({ success: true });
    });

    socket.on('nextUndercoverTurn', ({ roomId }, callback) => {
      const room = getRoomByCode(roomId);
      if (!room || room.gameType !== 'undercover') {
        callback({ success: false, message: 'Action impossible.' });
        return;
      }
      if (!room.turnOrder.length) {
        callback({ success: false, message: 'Aucun ordre défini.' });
        return;
      }
      room.currentTurnIndex = nextAliveIndex(room, room.currentTurnIndex);
      updateRoom(room, io);
      callback({ success: true });
    });

    socket.on('misterGuess', ({ roomId, playerId, guess }, callback) => {
      const room = getRoomByCode(roomId);
      if (!room || room.gameType !== 'undercover') {
        callback({ success: false, message: 'Action impossible.' });
        return;
      }
      const secret = room.secrets?.[playerId];
      if (!secret || secret.role !== 'mister') {
        callback({ success: false, message: 'Vous n’êtes pas Mister White.' });
        return;
      }
      if (guess.toLowerCase() === room.civilWord.toLowerCase()) {
        room.status = 'ended';
        room.winner = 'Méchants';
        room.summary = `Mister White a deviné le mot ${room.civilWord}.`;
        updateRoom(room, io);
        callback({ success: true });
      } else {
        callback({ success: false, message: 'Mauvaise proposition.' });
      }
    });

    socket.on('timesupAction', ({ roomId, action }, callback) => {
      const room = getRoomByCode(roomId);
      if (!room || room.gameType !== 'timesup' || room.status !== 'started') {
        callback({ success: false, message: 'Action impossible.' });
        return;
      }
      if (!room.cardQueue || room.cardQueue.length === 0) {
        callback({ success: false, message: 'Aucune carte disponible.' });
        return;
      }
      if (action === 'found') {
        room.score = { ...room.score, [room.teamTurn]: (room.score[room.teamTurn] || 0) + 1 };
        room.currentCardIndex += 1;
      } else if (action === 'pass') {
        room.currentCardIndex += 1;
      } else if (action === 'nextRound') {
        if (room.round >= 3) {
          room.status = 'ended';
          room.winner = room.score.A > room.score.B ? 'Équipe A' : room.score.B > room.score.A ? 'Équipe B' : 'Match nul';
          room.summary = `Score final ${room.score.A} - ${room.score.B}`;
          updateRoom(room, io);
          callback({ success: true });
          return;
        }
        room.round += 1;
        room.currentCardIndex = 0;
      }
      if (room.currentCardIndex >= room.cardQueue.length) {
        room.currentCardIndex = 0;
        room.teamTurn = room.teamTurn === 'A' ? 'B' : 'A';
        if (room.round === 3) {
          room.status = 'ended';
          room.winner = room.score.A > room.score.B ? 'Équipe A' : room.score.B > room.score.A ? 'Équipe B' : 'Match nul';
          room.summary = `Score final ${room.score.A} - ${room.score.B}`;
        }
      }
      updateRoom(room, io);
      callback({ success: true });
    });

    socket.on('restartGame', ({ roomId }, callback) => {
      const room = getRoomByCode(roomId);
      if (!room || room.hostId !== socket.id) {
        callback({ success: false, message: 'Action impossible.' });
        return;
      }
      room.status = 'waiting';
      room.players = room.players.map((player) => ({ ...player, alive: true }));
      room.turnOrder = [];
      room.currentTurnIndex = 0;
      room.history = [];
      room.score = { A: 0, B: 0 };
      room.teamTurn = 'A';
      room.round = 1;
      room.currentCardIndex = 0;
      room.cardQueue = [];
      room.winner = null;
      room.summary = '';
      updateRoom(room, io);
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      removePlayerFromRoom(socket, io);
    });
  });
}

export { setupSocket };
