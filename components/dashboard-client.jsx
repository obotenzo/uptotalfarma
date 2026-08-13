'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import MapPanel from './map-panel';

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

export default function DashboardClient({ data }) {
  const [viewMode, setViewMode] = useState('all');
  const [activeUnitId, setActiveUnitId] = useState(data[0]?.id || '');

  const activeUnit = useMemo(
    () => data.find((u) => u.id === activeUnitId) || data[0],
    [data, activeUnitId]
  );

  const stats = useMemo(() => {
    const allCompetitors = data.flatMap((u) => u.concorrentes);
    return {
      units: data.length,
      competitors: allCompetitors.length,
    };
  }, [data]);

  const visibleUnits = viewMode === 'all' ? data : data.filter((u) => u.id === activeUnitId);
  const selectedUnit = viewMode === 'all' ? null : activeUnit;

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
            Um painel mais simples para entender rapidamente o desempenho das unidades,
            os concorrentes ao redor e o contexto de operação.
          </p>
        </div>

        <div className="hero-stats">
          <div>
            <strong>{stats.units}</strong>
            <span>unidades</span>
          </div>
          <div>
            <strong>{stats.competitors}</strong>
            <span>concorrentes</span>
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
            const cheapest = sortByPrice(u.concorrentes).find((c) => Number.isFinite(parsePreco(c.preco)));
            return (
              <article key={u.id} className="summary-card summary-card--executive">
                <div className="summary-card__top">
                  <h3>{u.nome}</h3>
                  <span className="pill">{u.concorrentes.length} concorrentes</span>
                </div>
                <p>{u.endereco}</p>
                <div className="summary-meta">
                  <span>{u.telefone || '—'}</span>
                  {cheapest ? <span>Menor preço: {cheapest.preco}</span> : null}
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
            <p>Use o mapa como apoio visual para localizar unidades e concorrentes.</p>
          </div>
        </div>
        <MapPanel units={data} viewMode={viewMode} activeUnitId={activeUnitId} />
      </section>
    </div>
  );
}
