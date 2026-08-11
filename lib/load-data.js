import fs from 'fs/promises';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'dashboard-data.json');

export async function loadDashboardData() {
  const raw = await fs.readFile(dataPath, 'utf8');
  return JSON.parse(raw);
}
