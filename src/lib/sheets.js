import Papa from 'papaparse';

export async function fetchUpcomingTournaments() {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSck3PaG0ib-qXuHNSY_IolL_jvLQT0yjtH2goI1Lb_LC4pnf5iOynA4lGm99P1EM76pzwqBstux6uH/pub?gid=966763818&single=true&output=csv";

  try {
    const response = await fetch(SHEET_URL);
    const csvData = await response.text();
    
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return parsed.data
      .filter(tournament => {
        const tournamentDate = new Date(tournament.date);
        return tournamentDate >= today;
      })
      .map(tournament => ({
        id: tournament.id,
        name: tournament.name,
        date: tournament.date,
        time: tournament.time,
        location: tournament.location,
        format: tournament.format,
        timeControl: tournament.timeControl,
        entryFee: tournament.entryFee,
        prizes: tournament.prizes,
        registration: tournament.registrationDeadline,
        status: tournament.status
      }));
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    return [];
  }
}