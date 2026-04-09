import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const wss = new WebSocketServer({ port: 8080 });

// Game state
const rooms = new Map();
const players = new Map();

// Default roles with their properties
const DEFAULT_ROLES = {
  police: { name: 'Police', color: 'blue', score: 10, mustReveal: true },
  thief: { name: 'Thief', color: 'red', score: 15, isTarget: true },
  citizen: { name: 'Citizen', color: 'green', score: 5 },
  detective: { name: 'Detective', color: 'purple', score: 8 },
  merchant: { name: 'Merchant', color: 'orange', score: 7 }
};

function createRoom(roomId, hostId, config) {
  const room = {
    id: roomId,
    hostId,
    players: [],
    config: {
      maxPlayers: config.maxPlayers || 6,
      rounds: config.rounds || 3,
      roles: config.roles || DEFAULT_ROLES,
      roleDistribution: config.roleDistribution || ['police', 'thief', 'citizen', 'citizen']
    },
    gameState: {
      phase: 'lobby', // lobby, playing, guessing, scoring, finished
      currentRound: 0,
      cards: [],
      scores: {},
      policePlayerId: null,
      currentGuess: null,
      roundResults: []
    }
  };
  
  rooms.set(roomId, room);
  return room;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function startNewRound(room) {
  const { players, config } = room;
  
  // Create deck based on role distribution
  let deck = [...config.roleDistribution];
  
  // Fill remaining slots with citizens if needed
  while (deck.length < players.length) {
    deck.push('citizen');
  }
  
  // Shuffle and distribute
  const shuffledDeck = shuffleArray(deck.slice(0, players.length));
  
  room.gameState.cards = [];
  room.gameState.policePlayerId = null;
  room.gameState.currentGuess = null;
  
  players.forEach((player, index) => {
    const role = shuffledDeck[index];
    room.gameState.cards.push({
      playerId: player.id,
      role: role,
      revealed: false
    });
    
    if (role === 'police') {
      room.gameState.policePlayerId = player.id;
    }
  });
  
  room.gameState.phase = 'playing';
  room.gameState.currentRound++;
  
  // Auto-reveal police after 2 seconds
  setTimeout(() => {
    if (room.gameState.phase === 'playing') {
      revealPolice(room);
    }
  }, 2000);
}

function revealPolice(room) {
  const policeCard = room.gameState.cards.find(card => card.role === 'police');
  if (policeCard) {
    policeCard.revealed = true;
    room.gameState.phase = 'guessing';
    broadcastToRoom(room.id, {
      type: 'police_revealed',
      policePlayerId: policeCard.playerId,
      gameState: room.gameState
    });
  }
}

function processGuess(room, guessedPlayerId) {
  const thiefCard = room.gameState.cards.find(card => card.role === 'thief');
  const policeCard = room.gameState.cards.find(card => card.role === 'police');
  
  const correct = thiefCard && thiefCard.playerId === guessedPlayerId;
  
  // Initialize scores if needed
  room.players.forEach(player => {
    if (!room.gameState.scores[player.id]) {
      room.gameState.scores[player.id] = 0;
    }
  });
  
  // Award points
  if (correct && policeCard) {
    room.gameState.scores[policeCard.playerId] += room.config.roles.police.score;
  } else if (thiefCard) {
    room.gameState.scores[thiefCard.playerId] += room.config.roles.thief.score;
  }
  
  // Award points to other roles
  room.gameState.cards.forEach(card => {
    if (card.role !== 'police' && card.role !== 'thief') {
      const roleScore = room.config.roles[card.role]?.score || 0;
      room.gameState.scores[card.playerId] += roleScore;
    }
  });
  
  room.gameState.roundResults.push({
    round: room.gameState.currentRound,
    correct,
    policePlayerId: policeCard?.playerId,
    thiefPlayerId: thiefCard?.playerId,
    guessedPlayerId
  });
  
  room.gameState.phase = 'scoring';
  
  // Reveal all cards
  room.gameState.cards.forEach(card => {
    card.revealed = true;
  });
  
  setTimeout(() => {
    if (room.gameState.currentRound >= room.config.rounds) {
      room.gameState.phase = 'finished';
    } else {
      startNewRound(room);
    }
    broadcastToRoom(room.id, {
      type: 'game_update',
      gameState: room.gameState
    });
  }, 5000);
}

function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.players.forEach(player => {
    const playerWs = players.get(player.id);
    if (playerWs && playerWs.readyState === 1) {
      playerWs.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join':
          const playerId = randomUUID();
          players.set(playerId, ws);
          ws.playerId = playerId;
          ws.send(JSON.stringify({
            type: 'player_id',
            playerId
          }));
          break;
          
        case 'create_room':
          const roomId = randomUUID().substring(0, 6).toUpperCase();
          const room = createRoom(roomId, ws.playerId, message.config);
          
          room.players.push({
            id: ws.playerId,
            name: message.playerName,
            isHost: true
          });
          
          room.gameState.scores[ws.playerId] = 0;
          ws.roomId = roomId;
          
          ws.send(JSON.stringify({
            type: 'room_created',
            roomId,
            room: {
              ...room,
              players: room.players,
              config: room.config,
              gameState: room.gameState
            }
          }));
          break;
          
        case 'join_room':
          const targetRoom = rooms.get(message.roomId);
          if (!targetRoom) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room not found'
            }));
            break;
          }
          
          if (targetRoom.players.length >= targetRoom.config.maxPlayers) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room is full'
            }));
            break;
          }
          
          targetRoom.players.push({
            id: ws.playerId,
            name: message.playerName,
            isHost: false
          });
          
          targetRoom.gameState.scores[ws.playerId] = 0;
          ws.roomId = message.roomId;
          
          broadcastToRoom(message.roomId, {
            type: 'player_joined',
            room: {
              ...targetRoom,
              players: targetRoom.players,
              config: targetRoom.config,
              gameState: targetRoom.gameState
            }
          });
          break;
          
        case 'start_game':
          const gameRoom = rooms.get(ws.roomId);
          if (!gameRoom || gameRoom.hostId !== ws.playerId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not authorized to start game'
            }));
            break;
          }
          
          if (gameRoom.players.length < 4) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Need at least 4 players to start'
            }));
            break;
          }
          
          startNewRound(gameRoom);
          broadcastToRoom(ws.roomId, {
            type: 'game_started',
            gameState: gameRoom.gameState
          });
          break;
          
        case 'make_guess':
          const currentRoom = rooms.get(ws.roomId);
          if (!currentRoom || currentRoom.gameState.policePlayerId !== ws.playerId) {
            break;
          }
          
          processGuess(currentRoom, message.guessedPlayerId);
          broadcastToRoom(ws.roomId, {
            type: 'guess_made',
            gameState: currentRoom.gameState,
            guessedPlayerId: message.guessedPlayerId
          });
          break;
          
        case 'update_config':
          const configRoom = rooms.get(ws.roomId);
          if (!configRoom || configRoom.hostId !== ws.playerId) {
            break;
          }
          
          configRoom.config = { ...configRoom.config, ...message.config };
          broadcastToRoom(ws.roomId, {
            type: 'config_updated',
            config: configRoom.config
          });
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.playerId) {
      players.delete(ws.playerId);
      
      if (ws.roomId) {
        const room = rooms.get(ws.roomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== ws.playerId);
          
          if (room.players.length === 0) {
            rooms.delete(ws.roomId);
          } else {
            // Transfer host if needed
            if (room.hostId === ws.playerId && room.players.length > 0) {
              room.hostId = room.players[0].id;
              room.players[0].isHost = true;
            }
            
            broadcastToRoom(ws.roomId, {
              type: 'player_left',
              room: {
                ...room,
                players: room.players,
                config: room.config,
                gameState: room.gameState
              }
            });
          }
        }
      }
    }
    console.log('WebSocket connection closed');
  });
});

console.log('WebSocket server running on port 8080');