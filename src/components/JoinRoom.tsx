import React, { useState } from 'react';
import { Users, ArrowRight, Plus } from 'lucide-react';

interface JoinRoomProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (mode === 'join') {
      if (!roomId.trim()) {
        setError('Please enter a room ID');
        return;
      }
      onJoinRoom(roomId.trim(), playerName.trim());
    } else {
      onCreateRoom(playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Card Detective</h1>
          <p className="text-blue-100">Multiplayer role-based card game</p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white bg-opacity-20 rounded-lg p-1 mb-6 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setMode('join')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'join'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => setMode('create')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'create'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Create Room
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'join' && (
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character room ID"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg"
                />
              </div>
            )}

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
            >
              {mode === 'join' ? (
                <>
                  <ArrowRight className="h-5 w-5" />
                  <span>Join Room</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </form>

          {/* Game Preview */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Rules</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Police (Reveals)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Thief (Hidden)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Citizens</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Special Roles</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Police must guess the Thief to score points. Other roles have their own scoring system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};