import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MapPanel from '@/components/map-panel';
import { COOKIE_NAME, isAuthenticated } from '@/lib/auth';
import { loadDashboardData } from '@/lib/load-data';

const RADIUS_KM = 2;

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getValidPoint(lat, lon) {
  const parsedLat = toFiniteNumber(lat);
  const parsedLon = toFiniteNumber(lon);
  if (parsedLat === null || parsedLon === null) return null;
  return [parsedLat, parsedLon];
}

function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function getNearbyCompetitors(unit) {
  const unitPoint = getValidPoint(unit.lat, unit.lon);
  if (!unitPoint) return [];

  return (unit.concorrentes || [])
    .map((competitor) => {
      const competitorPoint = getValidPoint(competitor.lat, competitor.lon);
      if (!competitorPoint) return null;
      const distanceKm = haversineKm(unitPoint, competitorPoint);
      if (distanceKm > RADIUS_KM) return null;
      return { ...competitor, distanceKm };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

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
            <h1>Concorrentes por unidade</h1>
            <p>
              Visualização dedicada para cada unidade, mostrando apenas os concorrentes dentro
              do raio de 2 km e a distância até o ponto da loja.
            </p>
          </div>

          <div className="hero-stats">
            <div>
              <strong>{units.length}</strong>
              <span>unidades</span>
            </div>
            <div>
              <strong>{units.reduce((acc, unit) => acc + getNearbyCompetitors(unit).length, 0)}</strong>
              <span>concorrentes no raio</span>
            </div>
          </div>
        </section>

        <section className="section-card section-card--tight">
          <div className="section-head">
            <div>
              <h2>Unidades</h2>
              <p>Cada bloco abaixo mostra a unidade, seus concorrentes no raio e o mapa dedicado.</p>
            </div>
            <Link className="control" href="/dashboard">
              Voltar ao dashboard
            </Link>
          </div>
        </section>

        {units.map((unit) => {
          const nearby = getNearbyCompetitors(unit);

          return (
            <section key={unit.id} className="section-card competitor-section">
              <div className="section-head">
                <div>
                  <h2>{unit.nome}</h2>
                  <p>{unit.endereco}</p>
                </div>
                <span className="pill">{nearby.length} concorrentes no raio</span>
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
                  <span>Somente concorrentes até 2 km</span>
                </div>
              </div>

              <div className="competitor-layout">
                <div className="competitor-map">
                  <MapPanel units={[unit]} viewMode="one" activeUnitId={unit.id} />
                </div>

                <div className="competitor-list">
                  {nearby.length > 0 ? (
                    nearby.map((c) => (
                      <article key={`${unit.id}-${c.nome}-${c.lat}-${c.lon}`} className="summary-card summary-card--executive">
                        <div className="summary-card__top">
                          <h3>{c.nome}</h3>
                          <span className="pill">{c.distanceKm.toFixed(2)} km</span>
                        </div>
                        <p>{c.end || 'Endereço não informado'}</p>
                        <div className="summary-meta">
                          <span>{c.tel || '—'}</span>
                          <span>{c.preco_fonte || c.fonte || 'Fonte não informada'}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="summary-card summary-card--executive">
                      <h3>Nenhum concorrente dentro do raio</h3>
                      <p>Esta unidade não possui pontos válidos dentro de 2 km no dataset atual.</p>
                    </article>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
