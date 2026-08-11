import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard-client';
import { COOKIE_NAME, isAuthenticated } from '@/lib/auth';
import { loadDashboardData } from '@/lib/load-data';

export default async function DashboardPage() {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!isAuthenticated(cookie)) redirect('/login');

  const data = await loadDashboardData();
  const units = data?.uptotalfarma?.unidades || [];

  return (
    <main className="page-shell">
      <DashboardClient data={units} />
    </main>
  );
}
