'use client';

import { useState } from 'react';

export default function RatingPreview({ changes, tournamentName, tournamentType, onApply, onCancel, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('change'); // 'change', 'name', 'oldRating'

  const filteredChanges = changes.changes
    .filter(c => c.playerName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'change') {
        return Math.abs(b.ratingChange) - Math.abs(a.ratingChange);
      } else if (sortBy === 'name') {
        return a.playerName.localeCompare(b.playerName);
      } else {
        return b.oldRating - a.oldRating;
      }
    });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">
          {tournamentName} <span className="text-sm font-normal text-blue-700">({tournamentType})</span>
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">{changes.summary.totalPlayers}</div>
            <div className="text-sm text-blue-800">Players</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">{changes.summary.roundsPlayed}</div>
            <div className="text-sm text-blue-800">Rounds</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">±{changes.summary.averageChange}</div>
            <div className="text-sm text-blue-800">Avg Change</div>
          </div>
        </div>
      </div>

      {/* New Players Created */}
      {changes.newPlayersCreated && changes.newPlayersCreated.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
            <span className="text-xl mr-2">🆕</span>
            New Players Created ({changes.newPlayersCreated.length})
          </h4>
          <div className="space-y-2">
            {changes.newPlayersCreated.map((player) => (
              <div key={player.assignedId} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded p-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">{player.name}</span>
                <span className="font-mono bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded font-semibold">
                  {player.assignedId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Sort */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="change">Sort by Change</option>
          <option value="name">Sort by Name</option>
          <option value="oldRating">Sort by Rating</option>
        </select>
      </div>

      {/* Changes Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Player</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Old Rating</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">New Rating</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredChanges.map((change) => (
                <tr key={change.playerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {change.playerName}
                      {change.isNewPlayer && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs">{change.playerId}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{change.oldRating}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{change.newRating}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span className={`font-semibold ${
                      change.ratingChange > 0 ? 'text-green-600' : change.ratingChange < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {change.ratingChange > 0 && '+'}{change.ratingChange}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biggest Winners/Losers */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-700 mb-3">Top Gainers</h4>
          <div className="space-y-2">
            {changes.changes
              .sort((a, b) => b.ratingChange - a.ratingChange)
              .slice(0, 5)
              .map((c, idx) => (
                <div key={c.playerId} className="flex justify-between text-sm">
                  <span>{idx + 1}. {c.playerName}</span>
                  <span className="font-semibold text-green-600">+{c.ratingChange}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-700 mb-3">Biggest Drops</h4>
          <div className="space-y-2">
            {changes.changes
              .sort((a, b) => a.ratingChange - b.ratingChange)
              .slice(0, 5)
              .map((c, idx) => (
                <div key={c.playerId} className="flex justify-between text-sm">
                  <span>{idx + 1}. {c.playerName}</span>
                  <span className="font-semibold text-red-600">{c.ratingChange}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-6 border-t">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-md font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onApply}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-md font-semibold ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {loading ? 'Applying...' : 'Apply Changes to Database'}
        </button>
      </div>
    </div>
  );
}

