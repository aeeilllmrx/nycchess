export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Welcome to NYC Chess Clubs</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Tournaments</h2>
          <p className="text-gray-600">
            Join us for our upcoming tournaments and view past results.
          </p>
          <a
            href="/tournaments"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Learn more →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Player Rankings</h2>
          <p className="text-gray-600">
            Check out the latest player ratings and rankings from recent tournaments.
          </p>
          <a
            href="/players"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            View rankings →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Upcoming Events</h2>
          <p className="text-gray-600">
            View our calendar for chess meetups, tournaments, and special events.
          </p>
          <a
            href="/calendar"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            See calendar →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Join a Club</h2>
          <p className="text-gray-600">
            Find a chess club near you and become part of our growing community.
          </p>
          <a
            href="/clubs"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Find clubs →
          </a>
        </div>
      </div>
    </div>
  );
}