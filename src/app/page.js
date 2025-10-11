export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-dark-text">Welcome to NYC Chess Club</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-dark-text">Tournaments</h2>
          <p className="text-gray-600 dark:text-dark-muted mb-4">
            Join us for our upcoming tournaments and view past results.
          </p>
          <a
            href="/tournaments"
            className="inline-block text-blue-600 dark:text-chess-green hover:text-blue-800 dark:hover:text-chess-light font-medium"
          >
            Learn more →
          </a>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-dark-text">Player Rankings</h2>
          <p className="text-gray-600 dark:text-dark-muted mb-4">
            Check out the latest player ratings and rankings from recent tournaments.
          </p>
          <a
            href="/players"
            className="inline-block text-blue-600 dark:text-chess-green hover:text-blue-800 dark:hover:text-chess-light font-medium"
          >
            View rankings →
          </a>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-dark-text">Upcoming Events</h2>
          <p className="text-gray-600 dark:text-dark-muted mb-4">
            View our calendar for chess meetups, tournaments, and special events.
          </p>
          <a
            href="/calendar"
            className="inline-block text-blue-600 dark:text-chess-green hover:text-blue-800 dark:hover:text-chess-light font-medium"
          >
            See calendar →
          </a>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-dark-text">Join a Club</h2>
          <p className="text-gray-600 dark:text-dark-muted mb-4">
            Find a chess club near you and become part of our growing community.
          </p>
          <a
            href="/clubs"
            className="inline-block text-blue-600 dark:text-chess-green hover:text-blue-800 dark:hover:text-chess-light font-medium"
          >
            Find clubs →
          </a>
        </div>
      </div>
    </div>
  );
}