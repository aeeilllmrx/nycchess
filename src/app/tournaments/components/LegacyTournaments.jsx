import { useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDown, ExternalLink } from 'lucide-react';

export const LegacyTournaments = ({ clubsData }) => {
  const [selectedClub, setSelectedClub] = useState(null);

  if (!clubsData || clubsData.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        No legacy tournaments found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ <strong>Legacy Tournaments:</strong> These are historical tournaments from before our rating system migration. 
          Results are stored in Google Sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          {clubsData.map((club) => (
            <button
              key={club.name}
              onClick={() => setSelectedClub(club.name)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors
                ${selectedClub === club.name
              ? 'bg-blue-50 dark:bg-blue-900/50 border-2 border-blue-300 dark:border-blue-700'
              : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{club.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {club.tournaments.length} tournament{club.tournaments.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>

        {selectedClub && clubsData.find(club => club.name === selectedClub) && (
          <div className="md:col-span-2">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {selectedClub}
              </h2>
              {clubsData.find(club => club.name === selectedClub).tournaments.map((tournament, idx) => (
                <Disclosure key={idx}>
                  {({ open }) => (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <Disclosure.Button className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {tournament.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Legacy - Google Sheets
                          </span>
                        </div>
                        <ChevronDown className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-gray-500`} />
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <a
                          href={tournament.sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Results in Google Sheets
                        </a>
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

