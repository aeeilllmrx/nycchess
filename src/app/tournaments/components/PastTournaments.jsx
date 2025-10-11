import { useState } from 'react';
import { TournamentList } from './TournamentList';

export const PastTournaments = ({ clubsData }) => {
  const [selectedClub, setSelectedClub] = useState(null);
  console.log("clubs data: ", clubsData)
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4">
        {clubsData.map((club) => (
          <button
            key={club.name}
            onClick={() => setSelectedClub(club.name)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors
              ${selectedClub === club.name
            ? 'bg-blue-50 dark:bg-blue-900'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          >
            {club.name}
          </button>
        ))}
      </div>

      {selectedClub && clubsData.find(club => club.name === selectedClub) && (
        <div className="md:col-span-2">
          <TournamentList
            clubData={clubsData.find(club => club.name === selectedClub)}
          />
        </div>
      )}
    </div>
  );
};

