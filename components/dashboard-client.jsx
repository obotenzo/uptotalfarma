'use client';

import { useMemo, useState } from 'react';
import MapPanel from './map-panel';

function parsePreco(text) {
  const m = String(text || '').match(/[\d]+[,.]\d+/);
  return m ? Number(m[0].replace(',', '.')) : Number.POSITIVE_INFINITY;
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return '—';
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
    const prices = allCompetitors.map((c) => parsePreco(c.preco)).filter((n) => Number.isFinite(n));
    const cheapest = prices.length ? Math.min(...prices) : null;

    return {
      units: data.length,
      competitors: allCompetitors.length,
      cheapest,
      withPrice: allCompetitors.filter((c) => Number.isFinite(parsePreco(c.preco))).length,
    };
  }, [data]);

  const visibleUnits = viewMode === 'all' ? data : data.filter((u) => u.id === activeUnitId);
  const selectedUnit = viewMode === 'all' ? null : activeUnit;

  function renderPriceTable(unit) {
    const competitors = sortByPrice(unit.concorrentes);
    const prices = competitors.map((c) => parsePreco(c.preco)).filter((n) => Number.isFinite(n));
    const min = prices.length ? Math.min(...prices) : null;

    return (
      <section className="compact-card" key={unit.id}>
        <div className="compact-card__head">
          <div>
            <h3>{unit.nome}</h3>
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
            <strong>Coordenadas</strong>
            <span>
              {unit.lat.toFixed(5)}, {unit.lon.toFixed(5)}
            </span>
          </div>
          <div>
            <strong>Menor preço</strong>
            <span>{formatPrice(min)}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Concorrente</th>
                <th>Preço</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => {
                const price = parsePreco(c.preco);
                const isMin = min !== null && price === min;

                return (
                  <tr key={`${unit.id}-${c.nome}-${c.lat}-${c.lon}`} className={isMin ? 'row-highlight' : ''}>
                    <td>{c.nome}</td>
                    <td>{c.preco || 'Consulte na loja'}</td>
                    <td>{isMin ? <span className="badge">MAIS BARATO</span> : c.preco_fonte || c.end || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

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
            os concorrentes ao redor e o menor preço encontrado.
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
          <div>
            <strong>{formatPrice(stats.cheapest)}</strong>
            <span>menor preço</span>
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
                  <span>{cheapest ? `Menor preço: ${cheapest.preco}` : 'Sem preço online'}</span>
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

      <section className="section-card">
        <div className="section-head">
          <div>
            <h2>Comparativo de preços</h2>
            <p>Os itens são ordenados do menor para o maior preço em cada unidade.</p>
          </div>
        </div>
        {viewMode === 'all' ? data.map((u) => renderPriceTable(u)) : renderPriceTable(selectedUnit)}
      </section>
    </div>
  );
}
