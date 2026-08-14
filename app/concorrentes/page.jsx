import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CompetitorsClient from '@/components/competitors-client';
import { COOKIE_NAME, isAuthenticated } from '@/lib/auth';
import { loadDashboardData } from '@/lib/load-data';

export default async function ConcorrentesPage() {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!isAuthenticated(cookie)) redirect('/login');

  const data = await loadDashboardData();
  const units = data?.uptotalfarma?.unidades || [];

  return (
    <main className="page-shell">
      <div className="dashboard competitors-dashboard">
        <section className="hero-card hero-card--executive hero-card--brand">
          <div className="hero-copy">
            <div className="brand-lockup">
              <img src="/uptotalfarma-logo.png" alt="Logo da Up Total Farma" className="brand-logo" />
              <div>
                <div className="eyebrow">Mapa por unidade</div>
                <h1>Concorrentes por unidade</h1>
              </div>
            </div>
            <p>
              Visão focada nos concorrentes dentro de 2 km da unidade selecionada, com mapa e
              lista em um layout limpo e consistente.
            </p>
          </div>

          <div className="hero-stats">
            <div>
              <strong>{units.length}</strong>
              <span>unidades</span>
            </div>
            <div>
              <strong>{units.reduce((acc, unit) => acc + unit.concorrentes.length, 0)}</strong>
              <span>concorrentes no raio</span>
            </div>
          </div>
        </section>

        <CompetitorsClient units={units} />
      </div>
    </main>
  );
}
