export default function CalendarPage() {
  const CALENDAR_URL = "https://calendar.google.com/calendar/embed?src=c49e1a168ff7f7638fc3fb7dc0abeb76318b4ed14272e1cb86d01c8cd9267cc9%40group.calendar.google.com&ctz=America%2FNew_York&showTitle=0&showNav=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1";
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chess Events Calendar</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
            Upcoming tournaments, club meetings, and special events
        </p>
      </div>
  
      {/* Calendar iframe container with 3:2 aspect ratio */}
      <div className="relative w-full overflow-hidden rounded-lg shadow" style={{ paddingTop: '66.67%' }}>
        <iframe
          src={CALENDAR_URL}
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Chess Club Events Calendar"
        />
      </div>
  
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Popular Events</h2>
          <ul className="text-green-700 space-y-2">
            <li>• Nook Club: Every other Tuesday 7-10pm</li>
          </ul>
        </div>
  
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Event Information</h2>
          <ul className="text-blue-700 space-y-2">
            <li>• Click any event for details.</li>
            <li>• Tournament entry fees vary by event</li>
          </ul>
        </div>
      </div>
    </div>
  );
}