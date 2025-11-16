import { useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

export const TournamentList = ({ clubData }) => {
  const [tournamentData, setTournamentData] = useState({});
  const [loadingTournaments, setLoadingTournaments] = useState({});

  const fetchTournamentDetails = async (tournamentId) => {
    if (tournamentData[tournamentId]) {
      return; // Already loaded
    }

    setLoadingTournaments(prev => ({ ...prev, [tournamentId]: true }));

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      const data = await response.json();

      if (data.error) {
        console.error('Failed to load tournament details:', data.error);
      } else {
        setTournamentData(prev => ({ ...prev, [tournamentId]: data }));
      }
    } catch (error) {
      console.error('Failed to fetch tournament details:', error.message);
    } finally {
      setLoadingTournaments(prev => ({ ...prev, [tournamentId]: false }));
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold mb-4">{clubData.name}</h2>
      {clubData.tournaments.map((tournament) => (
        <Disclosure key={tournament.id}>
          {({ open }) => (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Disclosure.Button 
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => fetchTournamentDetails(tournament.id)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{tournament.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tournament.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    tournament.type === 'rapid' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  }`}>
                    {tournament.type.charAt(0).toUpperCase() + tournament.type.slice(1)}
                  </span>
                  <ChevronDown className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-gray-500`} />
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                {loadingTournaments[tournament.id] ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Loading results...
                  </div>
                ) : tournamentData[tournament.id] ? (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white dark:bg-gray-900 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {tournamentData[tournament.id].summary.totalPlayers}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Players</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ±{tournamentData[tournament.id].summary.averageChange}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Avg Change</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {tournamentData[tournament.id].summary.topGainer ? 
                            `+${tournamentData[tournament.id].summary.topGainer.ratingChange}` : '-'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Top Gain</div>
                      </div>
                    </div>

                    {/* Top Performers */}
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-gray-900 rounded p-3">
                        <h4 className="font-semibold text-green-700 dark:text-green-400 text-sm mb-2">
                          🏆 Top Gainers
                        </h4>
                        <div className="space-y-1">
                          {tournamentData[tournament.id].changes
                            .filter(c => c.ratingChange > 0)
                            .slice(0, 3)
                            .map((c, idx) => (
                              <div key={c.playerId} className="flex justify-between text-xs">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {idx + 1}. {c.playerName}
                                </span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  +{c.ratingChange}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-900 rounded p-3">
                        <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm mb-2">
                          📉 Biggest Drops
                        </h4>
                        <div className="space-y-1">
                          {tournamentData[tournament.id].changes
                            .filter(c => c.ratingChange < 0)
                            .slice(-3)
                            .reverse()
                            .map((c, idx) => (
                              <div key={c.playerId} className="flex justify-between text-xs">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {idx + 1}. {c.playerName}
                                </span>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {c.ratingChange}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* All Results - Scrollable */}
                    <div className="bg-white dark:bg-gray-900 rounded p-3">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">
                        All Results ({tournamentData[tournament.id].changes.length} players)
                      </h4>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="text-left py-1 px-2">Player</th>
                              <th className="text-right py-1 px-2">Old</th>
                              <th className="text-right py-1 px-2">New</th>
                              <th className="text-right py-1 px-2">Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tournamentData[tournament.id].changes.map((c) => (
                              <tr key={c.playerId} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="py-1 px-2 text-gray-700 dark:text-gray-300">{c.playerName}</td>
                                <td className="py-1 px-2 text-right text-gray-600 dark:text-gray-400">{c.oldRating}</td>
                                <td className="py-1 px-2 text-right text-gray-900 dark:text-gray-100 font-medium">
                                  {c.newRating}
                                </td>
                                <td className={`py-1 px-2 text-right font-semibold ${
                                  c.ratingChange > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : c.ratingChange < 0 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {c.ratingChange > 0 && '+'}{c.ratingChange}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Click to view results
                  </div>
                )}
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  );
};

