import fs from 'fs/promises';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'dashboard-data.json');

function stripSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map(stripSensitiveFields);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'preco' && key !== 'preco_fonte')
      .map(([key, entry]) => [key, stripSensitiveFields(entry)])
  );
}

export async function loadDashboardData() {
  const raw = await fs.readFile(dataPath, 'utf8');
  return stripSensitiveFields(JSON.parse(raw));
}
