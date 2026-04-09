import React from 'react';
import { Crown, Eye, EyeOff, User, Target } from 'lucide-react';
import { Room, Card } from '../hooks/useWebSocket';

interface GameBoardProps {
  room: Room;
  playerId: string;
  onMakeGuess: (guessedPlayerId: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  room,
  playerId,
  onMakeGuess
}) => {
  const { gameState, players, config } = room;
  const myCard = gameState.cards.find(card => card.playerId === playerId);
  const isPolice = gameState.policePlayerId === playerId;
  const canGuess = isPolice && gameState.phase === 'guessing';

  const getPlayerCard = (playerIdToCheck: string): Card | undefined => {
    return gameState.cards.find(card => card.playerId === playerIdToCheck);
  };

  const getRoleColor = (role: string) => {
    const roleConfig = config.roles[role];
    if (!roleConfig) return 'gray';
    
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };
    
    return colorMap[roleConfig.color] || 'bg-gray-500';
  };

  const getPhaseTitle = () => {
    switch (gameState.phase) {
      case 'playing':
        return 'Cards Distributed';
      case 'guessing':
        return 'Police is Guessing';
      case 'scoring':
        return 'Round Results';
      case 'finished':
        return 'Game Finished';
      default:
        return '';
    }
  };

  const getPhaseDescription = () => {
    switch (gameState.phase) {
      case 'playing':
        return 'The Police will reveal their identity soon...';
      case 'guessing':
        return isPolice ? 'Choose who you think has the Thief card!' : 'The Police is deciding who to accuse...';
      case 'scoring':
        return 'Round complete! See the results below.';
      case 'finished':
        return 'All rounds completed! Check the final scores.';
      default:
        return '';
    }
  };

  const sortedScores = Object.entries(gameState.scores)
    .sort(([, a], [, b]) => b - a)
    .map(([playerId, score]) => ({
      playerId,
      score,
      player: players.find(p => p.id === playerId)
    }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Game Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{getPhaseTitle()}</h1>
            <p className="text-gray-600">{getPhaseDescription()}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Round</div>
            <div className="text-2xl font-bold text-blue-600">
              {gameState.currentRound} / {config.rounds}
            </div>
          </div>
        </div>

        {/* Phase-specific indicators */}
        {gameState.phase === 'playing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Waiting for Police to reveal...</span>
            </div>
          </div>
        )}

        {gameState.phase === 'guessing' && isPolice && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                You are the Police! Choose who you think has the Thief card.
              </span>
            </div>
          </div>
        )}

        {gameState.phase === 'guessing' && !isPolice && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">
                The Police is deciding... Wait for their choice.
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Players and Cards */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Players & Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {players.map((player) => {
                const card = getPlayerCard(player.id);
                const isRevealed = card?.revealed || false;
                const isMe = player.id === playerId;
                const isPoliceRevealed = gameState.policePlayerId === player.id && gameState.phase !== 'playing';

                return (
                  <div
                    key={player.id}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      isMe 
                        ? 'border-blue-300 bg-blue-50' 
                        : canGuess && !isPoliceRevealed
                        ? 'border-gray-300 bg-white hover:border-yellow-300 hover:bg-yellow-50 cursor-pointer'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => {
                      if (canGuess && !isMe && !isPoliceRevealed) {
                        onMakeGuess(player.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          player.isHost ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}>
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{player.name}</p>
                          <p className="text-xs text-gray-500">
                            {isMe ? 'You' : 'Player'}
                            {player.isHost && <Crown className="inline h-3 w-3 ml-1" />}
                          </p>
                        </div>
                      </div>
                      
                      {isPoliceRevealed && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <Eye className="h-3 w-3" />
                          <span>POLICE</span>
                        </div>
                      )}
                    </div>

                    {/* Card Display */}
                    <div className="mt-3">
                      {card && (isRevealed || isMe) ? (
                        <div className={`p-3 rounded-lg text-white text-center font-medium ${getRoleColor(card.role)}`}>
                          <div className="text-lg capitalize">{config.roles[card.role]?.name || card.role}</div>
                          <div className="text-sm opacity-90">{config.roles[card.role]?.score} points</div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-gray-200 text-center">
                          <div className="flex items-center justify-center space-x-2 text-gray-600">
                            <EyeOff className="h-4 w-4" />
                            <span className="text-sm">Hidden Card</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Guess Button Overlay */}
                    {canGuess && !isMe && !isPoliceRevealed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-yellow-100 bg-opacity-90 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                        <button className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors">
                          Accuse as Thief
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Scoreboard
          </h2>
          <div className="space-y-3">
            {sortedScores.map((entry, index) => (
              <div
                key={entry.playerId}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  entry.playerId === playerId 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50'
                } ${index === 0 && gameState.phase === 'finished' ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                  }`}>
                    {index === 0 && gameState.phase === 'finished' ? '👑' : index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {entry.player?.name || 'Unknown'}
                    </p>
                    {entry.playerId === playerId && (
                      <p className="text-xs text-blue-600">You</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-800">{entry.score}</p>
                  <p className="text-xs text-gray-600">points</p>
                </div>
              </div>
            ))}
          </div>

          {gameState.phase === 'finished' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <h3 className="font-bold text-yellow-800 mb-2">🎉 Game Complete!</h3>
              <p className="text-sm text-yellow-700">
                {sortedScores[0]?.player?.name} wins with {sortedScores[0]?.score} points!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Round Results */}
      {gameState.phase === 'scoring' && gameState.roundResults.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Round Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameState.roundResults.slice(-3).map((result, index) => {
              const policePlayer = players.find(p => p.id === result.policePlayerId);
              const thiefPlayer = players.find(p => p.id === result.thiefPlayerId);
              const guessedPlayer = players.find(p => p.id === result.guessedPlayerId);

              return (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  result.correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Round {result.round}
                    </span>
                    <span className={`text-sm font-bold ${
                      result.correct ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Police:</strong> {policePlayer?.name}</p>
                    <p><strong>Thief:</strong> {thiefPlayer?.name}</p>
                    <p><strong>Accused:</strong> {guessedPlayer?.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};