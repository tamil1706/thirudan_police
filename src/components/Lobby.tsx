import React, { useState } from 'react';
import { Users, Settings, Play, Copy, Check } from 'lucide-react';
import { useWebSocket, Room, GameConfig } from '../hooks/useWebSocket';

interface LobbyProps {
  room: Room;
  playerId: string;
  onStartGame: () => void;
  onUpdateConfig: (config: Partial<GameConfig>) => void;
}

const DEFAULT_ROLES = {
  police: { name: 'Police', color: 'blue', score: 10, mustReveal: true },
  thief: { name: 'Thief', color: 'red', score: 15, isTarget: true },
  citizen: { name: 'Citizen', color: 'green', score: 5 },
  detective: { name: 'Detective', color: 'purple', score: 8 },
  merchant: { name: 'Merchant', color: 'orange', score: 7 }
};

export const Lobby: React.FC<LobbyProps> = ({
  room,
  playerId,
  onStartGame,
  onUpdateConfig
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState(room.config);

  const isHost = room.players.find(p => p.id === playerId)?.isHost || false;
  const canStart = room.players.length >= 4;

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = room.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateRoleDistribution = (roles: string[]) => {
    const newConfig = { ...config, roleDistribution: roles };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
  };

  const updateGameSettings = (updates: Partial<GameConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Room Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Game Lobby</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Room ID:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                {room.id}
              </span>
              <button
                onClick={copyRoomId}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Copy room ID"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {room.players.length} / {config.maxPlayers} players • {config.rounds} rounds
          </div>
          {isHost && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  canStart
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play className="h-4 w-4" />
                <span>Start Game</span>
              </button>
            </div>
          )}
        </div>

        {!canStart && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Need at least 4 players to start the game. Share the room ID with friends to join!
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Players ({room.players.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  player.id === playerId
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      player.isHost ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{player.name}</p>
                      <p className="text-xs text-gray-500">
                        {player.isHost ? 'Host' : 'Player'}
                        {player.id === playerId ? ' (You)' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">How to Play</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
              <p>Each player receives one card with a role</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
              <p>The Police player reveals their identity</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
              <p>Police must guess who has the Thief card</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
              <p>Points awarded based on correct/incorrect guess</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</div>
              <p>Highest score after all rounds wins!</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Roles & Scores</h3>
            <div className="space-y-2">
              {Object.entries(config.roles).map(([key, role]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded text-white capitalize ${
                    role.color === 'blue' ? 'bg-blue-500' :
                    role.color === 'red' ? 'bg-red-500' :
                    role.color === 'green' ? 'bg-green-500' :
                    role.color === 'purple' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}>
                    {role.name}
                  </span>
                  <span className="font-medium">{role.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && isHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Game Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Players
                      </label>
                      <input
                        type="number"
                        min="4"
                        max="10"
                        value={config.maxPlayers}
                        onChange={(e) => updateGameSettings({ maxPlayers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rounds
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.rounds}
                        onChange={(e) => updateGameSettings({ rounds: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Distribution */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Role Distribution</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure which roles are included in each round. Police and Thief are required.
                  </p>
                  <div className="space-y-3">
                    {config.roleDistribution.map((role, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-sm font-medium w-16">Slot {index + 1}:</span>
                        <select
                          value={role}
                          onChange={(e) => {
                            const newDistribution = [...config.roleDistribution];
                            newDistribution[index] = e.target.value;
                            updateRoleDistribution(newDistribution);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Object.entries(config.roles).map(([key, roleData]) => (
                            <option key={key} value={key}>
                              {roleData.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateRoleDistribution([...config.roleDistribution, 'citizen'])}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                      >
                        Add Slot
                      </button>
                      {config.roleDistribution.length > 4 && (
                        <button
                          onClick={() => updateRoleDistribution(config.roleDistribution.slice(0, -1))}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          Remove Slot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};