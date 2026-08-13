'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import MapPanel from './map-panel';

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

function getNetworkName(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('drogaria sao paulo') || value.includes('drogaria sÃ£o paulo')) return 'Drogaria SÃ£o Paulo';
  if (value.includes('drogasil')) return 'Drogasil';
  if (value.includes('droga raia')) return 'Droga Raia';
  if (value.includes('ultrafarma')) return 'Ultrafarma';
  return 'Outros';
}

function groupByNetwork(competitors) {
  return competitors.reduce((acc, competitor) => {
    const network = getNetworkName(competitor.nome);
    const current = acc[network] || { network, count: 0, closest: competitor.distanceKm };
    current.count += 1;
    current.closest = Math.min(current.closest, competitor.distanceKm);
    acc[network] = current;
    return acc;
  }, {});
}

function buildUnitCards(units) {
  return units.map((unit) => {
    const nearby = getNearbyCompetitors(unit);
    const networks = Object.values(groupByNetwork(nearby)).sort((a, b) => b.count - a.count);
    const hasPhone = Boolean(String(unit.telefone || '').trim() && unit.telefone !== 'â€”');

    return {
      ...unit,
      nearby,
      networks,
      closest: nearby[0] || null,
      topNearby: nearby.slice(0, 3),
      hasPhone,
    };
  });
}

function InfoList({ title, children }) {
  return (
    <div className="summary-list">
      <span className="summary-list__title">{title}</span>
      {children}
    </div>
  );
}

export default function DashboardClient({ data }) {
  const [viewMode, setViewMode] = useState('all');
  const [activeUnitId, setActiveUnitId] = useState(data[0]?.id || '');

  const activeUnit = useMemo(
    () => data.find((unit) => unit.id === activeUnitId) || data[0],
    [data, activeUnitId]
  );

  const visibleUnits = viewMode === 'all' ? data : data.filter((unit) => unit.id === activeUnitId);
  const selectedUnit = viewMode === 'all' ? null : activeUnit;
  const rankingUnits = useMemo(
    () =>
      buildUnitCards(data)
        .slice()
        .sort((a, b) => b.nearby.length - a.nearby.length),
    [data]
  );

  const counts = useMemo(() => {
    const nearbyCompetitors = data.reduce((acc, unit) => acc + getNearbyCompetitors(unit).length, 0);
    return {
      units: data.length,
      nearbyCompetitors,
    };
  }, [data]);

  return (
    <div className="dashboard">
      <section className="hero-card hero-card--executive hero-card--brand">
        <div className="hero-copy">
          <div className="brand-lockup">
            <img src="/uptotalfarma-logo.png" alt="Logo da Up Total Farma" className="brand-logo" />
            <div>
              <div className="eyebrow">Dashboard Up Total Farma</div>
              <h1>{viewMode === 'all' ? 'VisÃ£o executiva das unidades' : selectedUnit?.nome || 'Unidade'}</h1>
            </div>
          </div>
          <p>
            Painel para acompanhar as 3 unidades, visualizar os concorrentes dentro do raio de
            2 km e analisar a pressÃ£o competitiva por regiÃ£o.
          </p>
        </div>

        <div className="hero-stats">
          <div>
            <strong>{counts.units}</strong>
            <span>unidades</span>
          </div>
          <div>
            <strong>{counts.nearbyCompetitors}</strong>
            <span>concorrentes no raio</span>
          </div>
        </div>
      </section>

      <section className="section-card section-card--tight">
        <div className="section-head">
          <div>
            <h2>Escolha o nÃ­vel de leitura</h2>
            <p>Comece pela visÃ£o geral ou foque em uma unidade especÃ­fica.</p>
          </div>
        </div>
        <div className="controls-card controls-card--clean">
          <button className={viewMode === 'all' ? 'control active' : 'control'} onClick={() => setViewMode('all')}>
            VisÃ£o geral
          </button>
          <Link className="control" href="/concorrentes">
            Ver concorrentes
          </Link>
          {data.map((unit) => (
            <button
              key={unit.id}
              className={viewMode !== 'all' && activeUnitId === unit.id ? 'control active' : 'control'}
              onClick={() => {
                setActiveUnitId(unit.id);
                setViewMode('one');
              }}
            >
              {unit.nome.replace('UP Total Farma - ', '')}
            </button>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <div>
            <h2>Ranking de pressÃ£o competitiva</h2>
            <p>Unidades ordenadas pela quantidade de concorrentes dentro do raio de 2 km.</p>
          </div>
        </div>

        <div className="grid-units">
          {rankingUnits.map((unit, index) => (
            <article key={unit.id} className="summary-card summary-card--executive">
              <div className="summary-card__top">
                <h3>
                  #{index + 1} {unit.nome}
                </h3>
                <span className="pill">{unit.nearby.length} concorrentes</span>
              </div>
              <p>{unit.endereco}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="map-card">
        <div className="section-head">
          <div>
            <h2>Mapa de contexto</h2>
            <p>Use o mapa como apoio visual para localizar unidades e concorrentes dentro do raio.</p>
          </div>
        </div>
        <MapPanel units={data} viewMode={viewMode} activeUnitId={activeUnitId} radiusKm={RADIUS_KM} />
      </section>
    </div>
  );
}

