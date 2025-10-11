import { Disclosure } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

export const TournamentList = ({ clubData }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold mb-4">{clubData.name}</h2>
      {clubData.tournaments.map((tournament) => (
        <Disclosure key={tournament.name}>
          {({ open }) => (
            <div className="border rounded-lg">
              <Disclosure.Button className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800">
                <span>{tournament.name}</span>
                <ChevronDown className={`${open ? 'transform rotate-180' : ''} w-5 h-5`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <a
                  href={tournament.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  View Results
                </a>
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  );
};

