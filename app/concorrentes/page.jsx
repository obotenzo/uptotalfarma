import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MapPanel from '@/components/map-panel';
import { COOKIE_NAME, isAuthenticated } from '@/lib/auth';
import { loadDashboardData } from '@/lib/load-data';

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

function formatPrice(value) {
  if (!Number.isFinite(value)) return 'Sem preço online';
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
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

        {units.map((unit) => {
          const sortedCompetitors = sortByPrice(unit.concorrentes);
          const cheapest = sortedCompetitors.find((c) => Number.isFinite(parsePreco(c.preco)));

          return (
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
                  <strong>Menor preço</strong>
                  <span>{formatPrice(cheapest ? parsePreco(cheapest.preco) : Number.POSITIVE_INFINITY)}</span>
                </div>
                <div>
                  <strong>Concorrente líder</strong>
                  <span>{cheapest ? cheapest.nome : 'Sem preço online'}</span>
                </div>
              </div>

              <div className="competitor-layout">
                <div className="competitor-map">
                  <MapPanel units={[unit]} viewMode="one" activeUnitId={unit.id} />
                </div>

                <div className="competitor-list">
                  {sortedCompetitors.map((c) => {
                    const price = parsePreco(c.preco);
                    const isCheapest = cheapest && c.nome === cheapest.nome && c.lat === cheapest.lat && c.lon === cheapest.lon;

                    return (
                      <article key={`${unit.id}-${c.nome}-${c.lat}-${c.lon}`} className="summary-card summary-card--executive">
                        <div className="summary-card__top">
                          <h3>{c.nome}</h3>
                          {isCheapest ? <span className="badge">MAIS BARATO</span> : <span className="pill">{c.preco || 'Sem preço'}</span>}
                        </div>
                        <p>{c.end || 'Endereço não informado'}</p>
                        <div className="summary-meta">
                          <span>{c.tel || '—'}</span>
                          <span>{Number.isFinite(price) ? `Preço mapeado: ${c.preco}` : 'Preço indisponível'}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
