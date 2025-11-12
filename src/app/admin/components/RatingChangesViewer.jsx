'use client';

import { useState, useEffect } from 'react';

export default function RatingChangesViewer() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tournamentType, setTournamentType] = useState('both');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('change'); // 'change', 'name', 'tournaments'
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const fetchRatingChanges = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('tournamentType', tournamentType);

      const response = await fetch(`/api/admin/rating-changes?${params}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch rating changes');
      } else {
        setData(result);
      }
    } catch (err) {
      setError('Failed to fetch rating changes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set default date range to last 30 days on mount
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const getFilteredPlayers = () => {
    if (!data?.players) return [];

    return data.players
      .filter(p => {
        // Filter by search query
        if (searchQuery && !p.playerName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        // Filter by tournament type (only show players with data for that type)
        if (tournamentType === 'rapid' && !p.rapid) return false;
        if (tournamentType === 'blitz' && !p.blitz) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.playerName.localeCompare(b.playerName);
        } else if (sortBy === 'tournaments') {
          const aCount = (a.rapid?.tournamentCount || 0) + (a.blitz?.tournamentCount || 0);
          const bCount = (b.rapid?.tournamentCount || 0) + (b.blitz?.tournamentCount || 0);
          return bCount - aCount;
        } else {
          // Sort by absolute change
          const aChange = Math.abs(a.rapid?.totalChange || 0) + Math.abs(a.blitz?.totalChange || 0);
          const bChange = Math.abs(b.rapid?.totalChange || 0) + Math.abs(b.blitz?.totalChange || 0);
          return bChange - aChange;
        }
      });
  };

  const filteredPlayers = getFilteredPlayers();

  const exportToCSV = () => {
    if (!data?.players) return;

    // Create CSV header
    const headers = ['Player ID', 'Player Name'];
    if (tournamentType === 'both' || tournamentType === 'rapid') {
      headers.push('Rapid Change', 'Rapid Start', 'Rapid End', 'Rapid Tournaments');
    }
    if (tournamentType === 'both' || tournamentType === 'blitz') {
      headers.push('Blitz Change', 'Blitz Start', 'Blitz End', 'Blitz Tournaments');
    }

    // Create CSV rows
    const rows = filteredPlayers.map(player => {
      const row = [player.playerId, player.playerName];
      
      if (tournamentType === 'both' || tournamentType === 'rapid') {
        row.push(
          player.rapid?.totalChange || 0,
          player.rapid?.startingRating || '-',
          player.rapid?.endingRating || '-',
          player.rapid?.tournamentCount || 0
        );
      }
      
      if (tournamentType === 'both' || tournamentType === 'blitz') {
        row.push(
          player.blitz?.totalChange || 0,
          player.blitz?.startingRating || '-',
          player.blitz?.endingRating || '-',
          player.blitz?.tournamentCount || 0
        );
      }
      
      return row;
    });

    // Combine into CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rating-changes-${startDate || 'all'}-to-${endDate || 'present'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportDetailedCSV = () => {
    if (!data?.players) return;

    // Create detailed CSV with one row per tournament per player
    const headers = ['Player ID', 'Player Name', 'Tournament Type', 'Tournament Name', 'Tournament Date', 'Old Rating', 'New Rating', 'Change'];
    
    const rows = [];
    filteredPlayers.forEach(player => {
      // Add rapid tournaments
      if (player.rapid?.tournamentHistory && (tournamentType === 'both' || tournamentType === 'rapid')) {
        player.rapid.tournamentHistory.forEach(t => {
          rows.push([
            player.playerId,
            player.playerName,
            'Rapid',
            t.tournament_name,
            new Date(t.tournament_date).toLocaleDateString(),
            t.old_rating,
            t.new_rating,
            t.change
          ]);
        });
      }
      
      // Add blitz tournaments
      if (player.blitz?.tournamentHistory && (tournamentType === 'both' || tournamentType === 'blitz')) {
        player.blitz.tournamentHistory.forEach(t => {
          rows.push([
            player.playerId,
            player.playerName,
            'Blitz',
            t.tournament_name,
            new Date(t.tournament_date).toLocaleDateString(),
            t.old_rating,
            t.new_rating,
            t.change
          ]);
        });
      }
    });

    // Sort by date
    rows.sort((a, b) => new Date(a[4]) - new Date(b[4]));

    // Combine into CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rating-changes-detailed-${startDate || 'all'}-to-${endDate || 'present'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Rating Changes Report</h2>
        
        {data && (
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold text-sm flex items-center gap-2"
              title="Export summary table"
            >
              📊 Export CSV
            </button>
            <button
              onClick={exportDetailedCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-sm flex items-center gap-2"
              title="Export detailed tournament-by-tournament history"
            >
              📋 Detailed CSV
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Rating Type
            </label>
            <select
              value={tournamentType}
              onChange={(e) => setTournamentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
            >
              <option value="both">Both</option>
              <option value="rapid">Rapid</option>
              <option value="blitz">Blitz</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchRatingChanges}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md font-semibold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading ? 'Loading...' : 'Get Report'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.summary.totalPlayers}</div>
              <div className="text-sm text-blue-800 dark:text-blue-300">Total Players</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.summary.rapidCount}</div>
              <div className="text-sm text-green-800 dark:text-green-300">Rapid Players</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.summary.blitzCount}</div>
              <div className="text-sm text-purple-800 dark:text-purple-300">Blitz Players</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ±{Math.round((data.summary.avgRapidChange + data.summary.avgBlitzChange) / 2)}
              </div>
              <div className="text-sm text-orange-800 dark:text-orange-300">Avg Change</div>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
            >
              <option value="change">Sort by Change</option>
              <option value="name">Sort by Name</option>
              <option value="tournaments">Sort by Tournaments</option>
            </select>
          </div>

          {/* Players Table */}
          <div className="bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-hover sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Player</th>
                    {(tournamentType === 'both' || tournamentType === 'rapid') && (
                      <>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-dark-text">Rapid Change</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-dark-text">Rapid Tournaments</th>
                      </>
                    )}
                    {(tournamentType === 'both' || tournamentType === 'blitz') && (
                      <>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-dark-text">Blitz Change</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-dark-text">Blitz Tournaments</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-dark-text">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                  {filteredPlayers.map((player) => (
                    <tr key={player.playerId} className="hover:bg-gray-50 dark:hover:bg-dark-hover">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-dark-text">{player.playerName}</div>
                        <div className="text-gray-500 dark:text-dark-muted text-xs">{player.playerId}</div>
                      </td>
                      {(tournamentType === 'both' || tournamentType === 'rapid') && (
                        <>
                          <td className="px-4 py-3 text-center text-sm">
                            {player.rapid ? (
                              <span className={`font-semibold ${
                                player.rapid.totalChange > 0 ? 'text-green-600 dark:text-green-400' : 
                                  player.rapid.totalChange < 0 ? 'text-red-600 dark:text-red-400' : 
                                    'text-gray-600 dark:text-gray-400'
                              }`}>
                                {player.rapid.totalChange > 0 && '+'}{player.rapid.totalChange}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-dark-text">
                            {player.rapid?.tournamentCount || '—'}
                          </td>
                        </>
                      )}
                      {(tournamentType === 'both' || tournamentType === 'blitz') && (
                        <>
                          <td className="px-4 py-3 text-center text-sm">
                            {player.blitz ? (
                              <span className={`font-semibold ${
                                player.blitz.totalChange > 0 ? 'text-green-600 dark:text-green-400' : 
                                  player.blitz.totalChange < 0 ? 'text-red-600 dark:text-red-400' : 
                                    'text-gray-600 dark:text-gray-400'
                              }`}>
                                {player.blitz.totalChange > 0 && '+'}{player.blitz.totalChange}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-dark-text">
                            {player.blitz?.tournamentCount || '—'}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center text-sm">
                        <button
                          onClick={() => setSelectedPlayer(player)}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-dark-muted">
              No players found matching your criteria.
            </div>
          )}
        </>
      )}

      {/* Player Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{selectedPlayer.playerName}</h3>
                  <p className="text-gray-500 dark:text-dark-muted text-sm">ID: {selectedPlayer.playerId}</p>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Rapid History */}
              {selectedPlayer.rapid && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-dark-text">🚀 Rapid</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-800 dark:text-blue-300">Total Change:</span>
                      <span className={`font-semibold ${selectedPlayer.rapid.totalChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedPlayer.rapid.totalChange > 0 && '+'}{selectedPlayer.rapid.totalChange}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-800 dark:text-blue-300">Range:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {selectedPlayer.rapid.startingRating} → {selectedPlayer.rapid.endingRating}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedPlayer.rapid.tournamentHistory.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-dark-hover p-2 rounded">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-dark-text">{t.tournament_name}</div>
                          <div className="text-gray-500 dark:text-dark-muted text-xs">{new Date(t.tournament_date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-700 dark:text-dark-text">{t.old_rating} → {t.new_rating}</div>
                          <div className={`font-semibold ${t.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {t.change > 0 && '+'}{t.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blitz History */}
              {selectedPlayer.blitz && (
                <div>
                  <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-dark-text">⚡ Blitz</h4>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-800 dark:text-purple-300">Total Change:</span>
                      <span className={`font-semibold ${selectedPlayer.blitz.totalChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedPlayer.blitz.totalChange > 0 && '+'}{selectedPlayer.blitz.totalChange}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-800 dark:text-purple-300">Range:</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-200">
                        {selectedPlayer.blitz.startingRating} → {selectedPlayer.blitz.endingRating}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedPlayer.blitz.tournamentHistory.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-dark-hover p-2 rounded">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-dark-text">{t.tournament_name}</div>
                          <div className="text-gray-500 dark:text-dark-muted text-xs">{new Date(t.tournament_date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-700 dark:text-dark-text">{t.old_rating} → {t.new_rating}</div>
                          <div className={`font-semibold ${t.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {t.change > 0 && '+'}{t.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

