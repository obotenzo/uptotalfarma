'use client';

import { useMemo, useState } from 'react';
import MapPanel from './map-panel';

function parsePreco(text) {
  const m = String(text || '').match(/[\d]+[,.]\d+/);
  return m ? Number(m[0].replace(',', '.')) : Number.POSITIVE_INFINITY;
}

export default function DashboardClient({ data }) {
  const [viewMode, setViewMode] = useState('all');
  const [activeUnitId, setActiveUnitId] = useState(data[0]?.id || '');
  const activeUnit = useMemo(() => data.find((u) => u.id === activeUnitId) || data[0], [data, activeUnitId]);

  const stats = useMemo(() => {
    const allCompetitors = data.flatMap((u) => u.concorrentes);
    const prices = allCompetitors.map((c) => parsePreco(c.preco)).filter((n) => Number.isFinite(n));
    return {
      units: data.length,
      competitors: allCompetitors.length,
      minPrice: prices.length ? Math.min(...prices) : null,
    };
  }, [data]);

  const visibleUnits = viewMode === 'all' ? data : data.filter((u) => u.id === activeUnitId);

  function renderPriceTable(unit) {
    const competitors = [...unit.concorrentes].sort((a, b) => {
      const pa = parsePreco(a.preco);
      const pb = parsePreco(b.preco);
      if (Number.isFinite(pa) && Number.isFinite(pb)) return pa - pb;
      if (Number.isFinite(pa)) return -1;
      if (Number.isFinite(pb)) return 1;
      return 0;
    });
    const prices = competitors.map((c) => parsePreco(c.preco)).filter((n) => Number.isFinite(n));
    const min = prices.length ? Math.min(...prices) : null;

    return (
      <div className="unit-card" key={unit.id}>
        <div className="unit-card__header">
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
            <strong>Coord.</strong>
            <span>
              {unit.lat.toFixed(5)}, {unit.lon.toFixed(5)}
            </span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Concorrente</th>
                <th>Preço de produtos</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => {
                const isMin = min !== null && parsePreco(c.preco) === min;
                return (
                  <tr key={`${unit.id}-${c.nome}-${c.lat}-${c.lon}`} className={isMin ? 'row-highlight' : ''}>
                    <td>{c.nome}</td>
                    <td>
                      {c.preco}
                      {isMin ? <span className="badge">MAIS BARATO</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <section className="hero-card">
        <div>
          <div className="eyebrow">Dashboard Up Total Farma</div>
          <h1>{viewMode === 'all' ? 'Todas as unidades' : activeUnit?.nome || 'Unidade'}</h1>
          <p>Mapa de concorrentes, preços de concorrentes e visão consolidada das três unidades.</p>
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
            <strong>{stats.minPrice ? `R$ ${stats.minPrice.toFixed(2).replace('.', ',')}` : '—'}</strong>
            <span>menor preço</span>
          </div>
        </div>
      </section>

      <section className="controls-card">
        <button className={viewMode === 'all' ? 'control active' : 'control'} onClick={() => setViewMode('all')}>
          Ver as 3 juntas
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
      </section>

      <section className="map-card">
        <MapPanel units={data} viewMode={viewMode} activeUnitId={activeUnitId} />
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Resumo por unidade</h2>
          <p>Dados migrados do site atual, já prontos para evoluir para Supabase.</p>
        </div>
        <div className="grid-units">
          {visibleUnits.map((u) => (
            <article key={u.id} className="summary-card">
              <h3>{u.nome}</h3>
              <p>{u.endereco}</p>
              <div className="summary-meta">
                <span>{u.telefone || '—'}</span>
                <span>{u.concorrentes.length} concorrentes</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Preço do Vonau Flash 4mg</h2>
          <p>Verde = mais barato. Farmácias de bairro sem e-commerce ficam como "Consulte na loja".</p>
        </div>
        {viewMode === 'all' ? data.map((u) => renderPriceTable(u)) : renderPriceTable(activeUnit)}
      </section>
    </div>
  );
}
