'use client';

import { useMemo, useState } from 'react';
import MapPanel from '@/components/map-panel';

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

export default function CompetitorsClient({ units }) {
  const [activeUnitId, setActiveUnitId] = useState(units[0]?.id || '');

  const activeUnit = useMemo(
    () => units.find((unit) => unit.id === activeUnitId) || units[0],
    [units, activeUnitId]
  );

  const nearby = useMemo(() => (activeUnit ? getNearbyCompetitors(activeUnit) : []), [activeUnit]);

  return (
    <>
      <section className="section-card section-card--tight">
        <div className="section-head competitors-head">
          <div>
            <h2>Selecionar unidade</h2>
            <p>Escolha uma unidade para analisar os concorrentes próximos.</p>
          </div>
          <a className="control control--secondary" href="/dashboard">
            Voltar ao dashboard
          </a>
        </div>

        <div className="controls-card controls-card--clean">
          <div className="controls-group controls-group--left">
            {units.map((unit) => (
              <button
                key={unit.id}
                className={activeUnitId === unit.id ? 'control active' : 'control'}
                type="button"
                onClick={() => setActiveUnitId(unit.id)}
              >
                {unit.nome.replace('UP Total Farma - ', '')}
              </button>
            ))}
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
    </>
  );
}
