import { google } from 'googleapis';

export async function getDriveData() {
  try {
    // Parse the service account key, handling escaped newlines
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    // Clean the key - remove surrounding quotes if present
    let cleanKey = serviceAccountKey.trim();
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      cleanKey = cleanKey.slice(1, -1);
    }
    if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
      cleanKey = cleanKey.slice(1, -1);
    }

    // Replace actual newlines/tabs/carriage returns with escaped versions for JSON parsing
    // This handles cases where the .env file has literal newlines in the JSON
    cleanKey = cleanKey
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');

    let credentials;
    try {
      // Parse the cleaned JSON
      credentials = JSON.parse(cleanKey);
    } catch (parseError) {
      // If that fails, try one more thing: maybe it had double-escaped newlines
      try {
        const keyWithNewlines = cleanKey.replace(/\\\\n/g, '\\n');
        credentials = JSON.parse(keyWithNewlines);
      } catch (secondParseError) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', parseError.message);
        throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Please check your environment variable.');
      }
    }

    // Now convert the escaped newlines in the private_key back to actual newlines for the auth library
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID;

    if (!rootFolderId) {
      throw new Error('DRIVE_ROOT_FOLDER_ID environment variable is not set');
    }

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
  } catch (error) {
    console.error('Error fetching legacy tournament data:', error.message);
    throw error;
  }
}

