import { getDriveData } from '@/lib/googleDrive';

export async function GET() {
  try {
    const data = await getDriveData();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}