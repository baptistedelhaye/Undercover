import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const instance = io('http://localhost:5174', {
      transports: ['websocket'],
    });

    instance.on('connect', () => setStatus('connected'));
    instance.on('disconnect', () => setStatus('disconnected'));
    instance.on('roomData', (payload) => setRoom(payload));
    instance.on('joinedRoom', (payload) => setRoom(payload));
    instance.on('leftRoom', () => {
      setRoom(null);
      setPlayer(null);
    });
    instance.on('playerInfo', (playerProfile) => setPlayer(playerProfile));
    instance.on('gameEnded', (payload) => setRoom(payload));

    setSocket(instance);
    return () => {
      instance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, room, setRoom, player, setPlayer, status }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
