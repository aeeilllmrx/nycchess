export default function PlayersPage() {
    // Note: Replace this URL with your actual published Google Sheets URL
    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-BVrlSzBGwS4UtFbndn_XG6KhvbkvO219caOb6RPD9MH1RUfkENq53NokjYc2aDReybTuEp-RliZ-/pubhtml?gid=0&single=true&chrome=false&widget=true";
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Player Rankings</h1>
          <p className="text-gray-600 mt-2">
            Current chess ratings for NYC club players. Updated after each tournament.
          </p>
        </div>
  
        {/* Responsive iframe container */}
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '75%' }}>
          <iframe
            src={SHEET_URL}
            className="absolute top-0 left-0 w-full h-full border-0 rounded-lg shadow"
            title="NYC Chess Player Rankings"
          />
        </div>
  
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">About Rankings</h2>
          <ul className="text-blue-700 space-y-1 list-disc list-inside">
            <li>Rankings are updated within 24 hours after each tournament</li>
            <li>Ratings are calculated using the Glicko-2 formula</li>
          </ul>
        </div>
      </div>
    );
  }