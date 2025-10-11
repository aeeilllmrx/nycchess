import { google } from 'googleapis';

export async function getDriveData() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID;

  const clubFolders = await drive.files.list({
    q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
    fields: 'files(id, name)',
  });

  const clubsData = [];

  for (const folder of clubFolders.data.files || []) {
    const sheets = await drive.files.list({
      q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
      fields: 'files(id, name)',
      orderBy: 'createdTime desc',
    });
    const tournaments = sheets.data.files
      ?.filter(sheet => {
        // Check if the sheet name starts with a 4-digit year (2024, 2023, etc)
        const yearPattern = /^(19|20)\d{2}/;  // Matches years from 1900-2099
        return yearPattern.test(sheet.name || '');
      })
      .map(sheet => ({
        name: sheet.name || '',
        date: sheet.name?.split(' ')[1] || '',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.id}`,
      })) || [];

    clubsData.push({
      name: folder.name || '',
      tournaments,
    });
  }
  return clubsData;
}

