'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import MapPanel from './map-panel';

const RADIUS_KM = 2;

function parsePreco(text) {
  const m = String(text || '').match(/[\d]+[,.]\d+/);
  return m ? Number(m[0].replace(',', '.')) : Number.POSITIVE_INFINITY;
}

function sortByPrice(items) {
  return [...items].sort((a, b) => {
    const pa = parsePreco(a.preco);
    const pb = parsePreco(b.preco);
    if (Number.isFinite(pa) && Number.isFinite(pb)) return pa - pb;
    if (Number.isFinite(pa)) return -1;
    if (Number.isFinite(pb)) return 1;
    return 0;
  });
}

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

export default function DashboardClient({ data }) {
  const [viewMode, setViewMode] = useState('all');
  const [activeUnitId, setActiveUnitId] = useState(data[0]?.id || '');

  const activeUnit = useMemo(
    () => data.find((u) => u.id === activeUnitId) || data[0],
    [data, activeUnitId]
  );

  const stats = useMemo(() => {
    const allCompetitors = data.flatMap((u) => u.concorrentes);
    const nearbyCompetitors = data.reduce((acc, unit) => acc + getNearbyCompetitors(unit).length, 0);
    return {
      units: data.length,
      competitors: allCompetitors.length,
      nearbyCompetitors,
    };
  }, [data]);

  const visibleUnits = viewMode === 'all' ? data : data.filter((u) => u.id === activeUnitId);
  const selectedUnit = viewMode === 'all' ? null : activeUnit;
  const summaryUnits = visibleUnits.map((unit) => {
    const nearby = getNearbyCompetitors(unit);
    return {
      ...unit,
      nearby,
      closest: nearby[0] || null,
      topNearby: nearby.slice(0, 3),
    };
  });

  return (
    <div className="dashboard">
      <section className="hero-card hero-card--executive">
        <div className="hero-copy">
          <div className="brand-lockup">
            <img src="/uptotalfarma-logo.png" alt="Logo da Up Total Farma" className="brand-logo" />
            <div className="eyebrow">Dashboard Up Total Farma</div>
          </div>
          <h1>{viewMode === 'all' ? 'Visão executiva das unidades' : selectedUnit?.nome || 'Unidade'}</h1>
          <p>
            Um painel para acompanhar as 3 unidades, visualizar os concorrentes dentro do raio de
            2 km e preparar a base para comparação de preços por produto.
          </p>
        </div>

        <div className="hero-stats">
          <div>
            <strong>{stats.units}</strong>
            <span>unidades</span>
          </div>
          <div>
            <strong>{stats.competitors}</strong>
            <span>concorrentes totais</span>
          </div>
          <div>
            <strong>{stats.nearbyCompetitors}</strong>
            <span>no raio de 2 km</span>
          </div>
        </div>
      </section>

      <section className="section-card section-card--tight">
        <div className="section-head">
          <div>
            <h2>Escolha o nível de leitura</h2>
            <p>Comece pela visão geral ou foque em uma unidade específica.</p>
          </div>
        </div>
        <div className="controls-card controls-card--clean">
          <button className={viewMode === 'all' ? 'control active' : 'control'} onClick={() => setViewMode('all')}>
            Visão geral
          </button>
          <Link className="control" href="/concorrentes">
            Ver concorrentes
          </Link>
          {data.map((u) => (
            <button
              key={u.id}
              className={viewMode !== 'all' && activeUnitId === u.id ? 'control active' : 'control'}
              onClick={() => {
                setActiveUnitId(u.id);
                setViewMode('one');
              }}
            >
              {u.nome.replace('UP Total Farma - ', '')}
            </button>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <div>
            <h2>Resumo executivo</h2>
            <p>Leitura rápida das unidades com concorrentes dentro do raio de 2 km.</p>
          </div>
        </div>

        <div className="grid-units">
          {summaryUnits.map((unit) => (
            <article key={unit.id} className="summary-card summary-card--executive">
              <div className="summary-card__top">
                <h3>{unit.nome}</h3>
                <span className="pill">{unit.nearby.length} no raio</span>
              </div>
              <p>{unit.endereco}</p>
              <div className="summary-meta">
                <span>{unit.telefone || '—'}</span>
                <span>{unit.closest ? `Mais próximo: ${unit.closest.distanceKm.toFixed(2)} km` : 'Sem concorrentes no raio'}</span>
              </div>
              <div className="summary-meta" style={{ marginTop: 8 }}>
                <span>{unit.nearby.length > 0 ? `Menor preço no raio: ${sortByPrice(unit.nearby)[0]?.preco || '—'}` : 'Preço ainda não consolidado'}</span>
              </div>
              <div className="summary-meta" style={{ marginTop: 8, display: 'grid' }}>
                <span>Top 3 mais próximos</span>
                {unit.topNearby.length > 0 ? (
                  unit.topNearby.map((competitor) => (
                    <span key={`${unit.id}-${competitor.nome}-${competitor.lat}-${competitor.lon}`}>
                      {competitor.nome} - {competitor.distanceKm.toFixed(2)} km
                    </span>
                  ))
                ) : (
                  <span>Nenhum concorrente dentro do raio</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <div>
            <h2>{viewMode === 'all' ? 'Resumo das unidades' : 'Resumo da unidade selecionada'}</h2>
            <p>
              {viewMode === 'all'
                ? 'Cartões mais curtos e objetivos, para leitura rápida.'
                : 'Informações essenciais da unidade ativa antes de abrir o mapa.'}
            </p>
          </div>
        </div>

        <div className="grid-units">
          {visibleUnits.map((u) => {
            const nearby = getNearbyCompetitors(u);
            const cheapest = sortByPrice(nearby).find((c) => Number.isFinite(parsePreco(c.preco)));
            return (
              <article key={u.id} className="summary-card summary-card--executive">
                <div className="summary-card__top">
                  <h3>{u.nome}</h3>
                  <span className="pill">{nearby.length} concorrentes no raio</span>
                </div>
                <p>{u.endereco}</p>
                <div className="summary-meta">
                  <span>{u.telefone || '—'}</span>
                  {cheapest ? <span>Menor preço: {cheapest.preco}</span> : null}
                </div>
                <div className="summary-meta" style={{ marginTop: 8 }}>
                  {nearby[0] ? (
                    <span>Mais próximo: {nearby[0].nome} • {nearby[0].distanceKm.toFixed(2)} km</span>
                  ) : (
                    <span>Nenhum concorrente dentro do raio</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="map-card">
        <div className="section-head">
          <div>
            <h2>Mapa de contexto</h2>
            <p>Use o mapa como apoio visual para localizar unidades e concorrentes dentro do raio.</p>
          </div>
        </div>
        <MapPanel units={data} viewMode={viewMode} activeUnitId={activeUnitId} />
      </section>
    </div>
  );
}
