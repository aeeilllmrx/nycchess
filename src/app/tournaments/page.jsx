"use client";

import { useState, useEffect } from 'react';
import { fetchUpcomingTournaments } from '@/lib/sheets';
import { PayPalButton } from '@/components/paypal/PayPalButton';
import { PastTournaments } from './pastTournaments';

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [clubsData, setClubsData] = useState([]);
  
  useEffect(() => {
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&components=buttons&enable-funding=venmo&currency=USD`;

    script.addEventListener('load', () => {
      setPaypalLoaded(true);
    });

    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    async function loadTournaments() {
      try {
        const data = await fetchUpcomingTournaments();
        setTournaments(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load tournament data');
        setLoading(false);
      }
    }

    loadTournaments();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/drive');
        const data = await response.json();
        setClubsData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (activeTab === 'past') {
      fetchData();
    }
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tournaments</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Register for upcoming tournaments or view past results
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            Upcoming Tournaments
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            Past Results
          </button>
        </div>
      </div>

      {/* Upcoming Tournaments Section */}
      {activeTab === 'upcoming' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading tournament data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">{tournament.name}</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Date & Time</h3>
                        <p className="text-gray-600">{tournament.date}</p>
                        <p className="text-gray-600">{tournament.time}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Location</h3>
                        <p className="text-gray-600">{tournament.location}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Format</h3>
                        <p className="text-gray-600">{tournament.format}</p>
                        <p className="text-gray-600">{tournament.timeControl}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Entry Fee</h3>
                        <p className="text-gray-600">${tournament.entryFee}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Prizes</h3>
                        <p className="text-gray-600">{tournament.prizes}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Registration</h3>
                        <p className="text-gray-600">{tournament.registration}</p>
                        {tournament.status === 'Open' && paypalLoaded && (
                          <PayPalButton
                            tournamentId={tournament.id}
                            amount={tournament.entryFee}
                            name={tournament.name}
                          />
                        )}
                        {tournament.status === 'Closed' && (
                          <p className="mt-4 text-red-600">Registration Closed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {tournaments.length === 0 && !loading && !error && (
                <div className="text-center py-12 text-gray-500">
                  No upcoming tournaments scheduled at this time.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Past Results Section */}
      {activeTab === 'past' && <PastTournaments clubsData={clubsData} />}
    </div>
  );
}