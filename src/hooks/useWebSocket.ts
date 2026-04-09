import { useState, useEffect, useRef, useCallback } from 'react';

export type GamePhase = 'lobby' | 'playing' | 'guessing' | 'scoring' | 'finished';

export interface Role {
  name: string;
  color: string;
  score: number;
  mustReveal?: boolean;
  isTarget?: boolean;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Card {
  playerId: string;
  role: string;
  revealed: boolean;
}

export interface GameConfig {
  maxPlayers: number;
  rounds: number;
  roles: Record<string, Role>;
  roleDistribution: string[];
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  cards: Card[];
  scores: Record<string, number>;
  policePlayerId: string | null;
  currentGuess: string | null;
  roundResults: any[];
}

export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  config: GameConfig;
  gameState: GameState;
}

export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket('https://thirudan-police.onrender.com');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
        ws.send(JSON.stringify({ type: 'join' }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'player_id':
            setPlayerId(message.playerId);
            break;
            
          case 'room_created':
          case 'player_joined':
          case 'player_left':
            setRoom(message.room);
            break;
            
          case 'game_started':
          case 'game_update':
            setRoom(prev => prev ? { ...prev, gameState: message.gameState } : null);
            break;
            
          case 'police_revealed':
            setRoom(prev => prev ? { ...prev, gameState: message.gameState } : null);
            break;
            
          case 'guess_made':
            setRoom(prev => prev ? { ...prev, gameState: message.gameState } : null);
            break;
            
          case 'config_updated':
            setRoom(prev => prev ? { ...prev, config: message.config } : null);
            break;
            
          case 'error':
            setError(message.message);
            break;
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setSocket(null);
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };
      
      setSocket(ws);
    } catch (err) {
      setError('Failed to connect to server');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, connected]);

  const createRoom = useCallback((playerName: string, config: Partial<GameConfig>) => {
    sendMessage({
      type: 'create_room',
      playerName,
      config
    });
  }, [sendMessage]);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    sendMessage({
      type: 'join_room',
      roomId: roomId.toUpperCase(),
      playerName
    });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage({ type: 'start_game' });
  }, [sendMessage]);

  const makeGuess = useCallback((guessedPlayerId: string) => {
    sendMessage({
      type: 'make_guess',
      guessedPlayerId
    });
  }, [sendMessage]);

  const updateConfig = useCallback((config: Partial<GameConfig>) => {
    sendMessage({
      type: 'update_config',
      config
    });
  }, [sendMessage]);

  return {
    connected,
    playerId,
    room,
    error,
    createRoom,
    joinRoom,
    startGame,
    makeGuess,
    updateConfig,
    clearError: () => setError(null)
  };
};