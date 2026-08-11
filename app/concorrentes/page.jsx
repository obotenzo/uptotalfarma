import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MapPanel from '@/components/map-panel';
import { COOKIE_NAME, isAuthenticated } from '@/lib/auth';
import { loadDashboardData } from '@/lib/load-data';

export default async function ConcorrentesPage() {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!isAuthenticated(cookie)) redirect('/login');

  const data = await loadDashboardData();
  const units = data?.uptotalfarma?.unidades || [];

  return (
    <main className="page-shell">
      <div className="dashboard">
        <section className="hero-card hero-card--executive">
          <div className="hero-copy">
            <div className="brand-lockup">
              <img src="/uptotalfarma-logo.png" alt="Logo da Up Total Farma" className="brand-logo" />
              <div className="eyebrow">Mapa por unidade</div>
            </div>
            <h1>Concorrentes mapeados por unidade</h1>
            <p>
              Uma visão dedicada para analisar cada unidade separadamente, com o mapa e a
              lista dos concorrentes mais próximos.
            </p>
          </div>

          <div className="hero-stats">
            <div>
              <strong>{units.length}</strong>
              <span>unidades</span>
            </div>
            <div>
              <strong>{units.reduce((acc, unit) => acc + unit.concorrentes.length, 0)}</strong>
              <span>concorrentes</span>
            </div>
          </div>
        </section>

        <section className="section-card section-card--tight">
          <div className="section-head">
            <div>
              <h2>Unidades</h2>
              <p>Cada bloco abaixo mostra a unidade, seus concorrentes e o mapa dedicado.</p>
            </div>
            <Link className="control" href="/dashboard">
              Voltar ao dashboard
            </Link>
          </div>
        </section>

        {units.map((unit) => (
          <section key={unit.id} className="section-card competitor-section">
            <div className="section-head">
              <div>
                <h2>{unit.nome}</h2>
                <p>{unit.endereco}</p>
              </div>
              <span className="pill">{unit.concorrentes.length} concorrentes</span>
            </div>

            <div className="unit-mini-grid">
              <div>
                <strong>Telefone</strong>
                <span>{unit.telefone || '—'}</span>
              </div>
              <div>
                <strong>Localização</strong>
                <span>
                  {unit.lat.toFixed(5)}, {unit.lon.toFixed(5)}
                </span>
              </div>
              <div>
                <strong>Visão</strong>
                <span>Somente concorrentes mapeados</span>
              </div>
            </div>

            <div className="competitor-layout">
              <div className="competitor-map">
                <MapPanel units={[unit]} viewMode="one" activeUnitId={unit.id} />
              </div>

              <div className="competitor-list">
                {unit.concorrentes.map((c) => (
                  <article key={`${unit.id}-${c.nome}-${c.lat}-${c.lon}`} className="summary-card summary-card--executive">
                    <div className="summary-card__top">
                      <h3>{c.nome}</h3>
                      <span className="pill">Ponto mapeado</span>
                    </div>
                    <p>{c.end || 'Endereço não informado'}</p>
                    <div className="summary-meta">
                      <span>{c.tel || '—'}</span>
                      <span>{c.preco_fonte || 'Fonte não informada'}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
