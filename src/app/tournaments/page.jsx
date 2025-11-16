"use client";

import { useState, useEffect } from 'react';
import { PastTournaments } from './components/PastTournaments';
import { LegacyTournaments } from './components/LegacyTournaments';

export default function TournamentsPage() {
  const [clubsData, setClubsData] = useState([]);
  const [legacyClubsData, setLegacyClubsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLegacy, setLoadingLegacy] = useState(false);
  const [error, setError] = useState(null);
  const [showLegacy, setShowLegacy] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/tournaments');
        const data = await response.json();
        
        // Check if the response is an error object
        if (data.error) {
          setError(data.error);
        } else if (Array.isArray(data)) {
          setClubsData(data);
        } else {
          setError('Invalid data format received');
        }
      } catch (error) {
        console.error('Failed to load tournaments:', error.message);
        setError('Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const fetchLegacyTournaments = async () => {
    if (legacyClubsData.length > 0) {
      // Already loaded
      setShowLegacy(!showLegacy);
      return;
    }

    setLoadingLegacy(true);
    try {
      const response = await fetch('/api/drive');
      const data = await response.json();
      
      if (data.error) {
        console.error('Failed to load legacy tournaments:', data.error);
      } else {
        setLegacyClubsData(data);
        setShowLegacy(true);
      }
    } catch (error) {
      console.error('Failed to fetch legacy tournaments:', error.message);
    } finally {
      setLoadingLegacy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tournaments</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          View past tournament results by club
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading tournament data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          <PastTournaments clubsData={clubsData} />

          {/* Legacy Tournaments Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={fetchLegacyTournaments}
              disabled={loadingLegacy}
              className="w-full mb-6 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📚</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {loadingLegacy 
                    ? 'Loading Legacy Tournaments...' 
                    : showLegacy 
                      ? 'Hide Legacy Tournaments' 
                      : 'Show Legacy Tournaments'}
                </span>
              </div>
              {!showLegacy && !loadingLegacy && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  View historical tournaments stored in Google Sheets
                </p>
              )}
            </button>

            {showLegacy && (
              <LegacyTournaments clubsData={legacyClubsData} />
            )}
          </div>
        </>
      )}
    </div>
  );
}