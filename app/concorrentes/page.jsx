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
  const activeUnit = units[0] || null;
  const nearby = activeUnit ? getNearbyCompetitors(activeUnit) : [];

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
              <strong>{units.reduce((acc, unit) => acc + getNearbyCompetitors(unit).length, 0)}</strong>
              <span>concorrentes no raio</span>
            </div>
          </div>
        </section>

        <section className="section-card section-card--tight">
          <div className="section-head competitors-head">
            <div>
              <h2>Unidade ativa</h2>
              <p>Comece pela unidade em destaque e avance para os pontos ao redor.</p>
            </div>
            <Link className="control control--secondary" href="/dashboard">
              Voltar ao dashboard
            </Link>
          </div>

          <div className="controls-card controls-card--clean">
            <div className="controls-group controls-group--left">
              <button className="control active" type="button">
                {activeUnit ? activeUnit.nome.replace('UP Total Farma - ', '') : 'Sem unidade'}
              </button>
            </div>
          </div>
        </section>

        {activeUnit ? (
          <>
            <section className="section-card">
              <div className="section-head">
                <div>
                  <h2>{activeUnit.nome}</h2>
                  <p>{activeUnit.endereco}</p>
                </div>
                <span className="pill">{nearby.length} concorrentes no raio</span>
              </div>

              <div className="unit-mini-grid">
                <div>
                  <strong>Telefone</strong>
                  <span>{activeUnit.telefone || '—'}</span>
                </div>
                <div>
                  <strong>Localização</strong>
                  <span>
                    {activeUnit.lat.toFixed(5)}, {activeUnit.lon.toFixed(5)}
                  </span>
                </div>
                <div>
                  <strong>Raio</strong>
                  <span>2 km</span>
                </div>
              </div>
            </section>

            <section className="map-card">
              <div className="section-head">
                <div>
                  <h2>Mapa de contexto</h2>
                  <p>Concorrentes dentro do raio de 2 km da unidade selecionada.</p>
                </div>
              </div>
              <MapPanel units={[activeUnit]} viewMode="one" activeUnitId={activeUnit.id} radiusKm={2} />
            </section>

            <section className="section-card">
              <div className="section-head">
                <div>
                  <h2>Lista de concorrentes</h2>
                  <p>Cards compactos com os pontos encontrados no raio.</p>
                </div>
              </div>

              <div className="competitor-list">
                {nearby.length > 0 ? (
                  nearby.map((competitor) => (
                    <article
                      key={`${activeUnit.id}-${competitor.nome}-${competitor.lat}-${competitor.lon}`}
                      className="summary-card summary-card--executive"
                    >
                      <div className="summary-card__top">
                        <h3>{competitor.nome}</h3>
                        <span className="pill">{competitor.distanceKm.toFixed(2)} km</span>
                      </div>
                      <p>{competitor.end || 'Endereço não informado'}</p>
                      <div className="summary-meta">
                        <span>{competitor.tel || '—'}</span>
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
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
