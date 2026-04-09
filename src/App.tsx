import React, { useEffect, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { JoinRoom } from './components/JoinRoom';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_CONFIG = {
  maxPlayers: 6,
  rounds: 3,
  roles: {
    police: { name: 'Police', color: 'blue', score: 10, mustReveal: true },
    thief: { name: 'Thief', color: 'red', score: 15, isTarget: true },
    citizen: { name: 'Citizen', color: 'green', score: 5 },
    detective: { name: 'Detective', color: 'purple', score: 8 },
    merchant: { name: 'Merchant', color: 'orange', score: 7 }
  },
  roleDistribution: ['police', 'thief', 'citizen', 'citizen']
};

function App() {
  const {
    connected,
    playerId,
    room,
    error,
    createRoom,
    joinRoom,
    startGame,
    makeGuess,
    updateConfig,
    clearError
  } = useWebSocket();

  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleCreateRoom = (playerName: string) => {
    createRoom(playerName, DEFAULT_CONFIG);
  };

  const handleJoinRoom = (roomId: string, playerName: string) => {
    joinRoom(roomId, playerName);
  };

  const getGamePhase = () => {
    if (!room) return 'join';
    if (room.gameState.phase === 'lobby') return 'lobby';
    return 'game';
  };

  const renderContent = () => {
    switch (getGamePhase()) {
      case 'join':
        return (
          <JoinRoom 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        );
      
      case 'lobby':
        return playerId && room ? (
          <Lobby
            room={room}
            playerId={playerId}
            onStartGame={startGame}
            onUpdateConfig={updateConfig}
          />
        ) : null;
      
      case 'game':
        return playerId && room ? (
          <GameBoard
            room={room}
            playerId={playerId}
            onMakeGuess={makeGuess}
          />
        ) : null;
      
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        {connected ? (
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg shadow-lg">
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Disconnected</span>
            </div>
            <div className="animate-spin">
              <RefreshCw className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {showError && error && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-md">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => {
                setShowError(false);
                clearError();
              }}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;