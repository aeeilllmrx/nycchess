import Papa from 'papaparse';

export async function fetchUpcomingTournaments() {
  // Replace this URL with your Google Sheet CSV export URL
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-BVrlSzBGwS4UtFbndn_XG6KhvbkvO219caOb6RPD9MH1RUfkENq53NokjYc2aDReybTuEp-RliZ-/pub?gid=1154230581&single=true&output=csv";

  try {
    const response = await fetch(SHEET_URL);
    const csvData = await response.text();
    
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically convert numbers
    });

    return parsed.data.map(tournament => ({
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
      paypalButton: tournament.paypalButton,
      status: tournament.status
    }));
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    return [];
  }
}