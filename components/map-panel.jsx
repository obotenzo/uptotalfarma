'use client';

import { useEffect, useMemo, useRef } from 'react';

const BLUE = '#0b2545';
const GREEN = '#1e9e1e';
const RED = '#d63b3b';

function parsePreco(text) {
  const m = String(text || '').match(/[\d]+[,.]\d+/);
  return m ? Number(m[0].replace(',', '.')) : Number.POSITIVE_INFINITY;
}

function divIcon(color, bigger = false) {
  const size = bigger ? 22 : 16;
  return window.L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 0 7px rgba(0,0,0,.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapPanel({ units, viewMode, activeUnitId }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const activeUnits = useMemo(() => {
    if (viewMode === 'all') return units;
    return units.filter((u) => u.id === activeUnitId);
  }, [units, viewMode, activeUnitId]);

  useEffect(() => {
    if (!elRef.current || !window.L || mapRef.current) return;
    const center = activeUnits[0] ? [activeUnits[0].lat, activeUnits[0].lon] : [-23.6, -46.74];
    mapRef.current = window.L.map(elRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(center, 13);
    window.L.tileLayer('/tiles/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 12,
      attribution: '© OpenStreetMap',
    }).addTo(mapRef.current);
  }, [activeUnits]);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const points = [];
    activeUnits.forEach((unit) => {
      const unitMarker = window.L.marker([unit.lat, unit.lon], { icon: divIcon(BLUE, true) })
        .addTo(mapRef.current)
        .bindPopup(`<b>${unit.nome}</b><br>${unit.endereco}<br>${unit.telefone || '—'}`);
      markersRef.current.push(unitMarker);
      points.push([unit.lat, unit.lon]);

      const allPrices = unit.concorrentes.map((c) => parsePreco(c.preco)).filter((n) => Number.isFinite(n));
      const min = allPrices.length ? Math.min(...allPrices) : Number.POSITIVE_INFINITY;

      unit.concorrentes.forEach((c) => {
        const color = parsePreco(c.preco) === min ? GREEN : RED;
        const marker = window.L.marker([c.lat, c.lon], { icon: divIcon(color, false) })
          .addTo(mapRef.current)
          .bindPopup(`<b>${c.nome}</b><br>${c.tel || '—'}<br>${c.preco || 'Consulte na loja'}<br><small>${c.end || ''}</small>`);
        markersRef.current.push(marker);
        points.push([c.lat, c.lon]);
      });
    });

    if (points.length > 1) mapRef.current.fitBounds(points, { padding: [32, 32] });
    else if (points.length === 1) mapRef.current.setView(points[0], 14);
  }, [activeUnits]);

  useEffect(() => {
    if (!mapRef.current) return;
    setTimeout(() => mapRef.current?.invalidateSize(), 50);
  }, [viewMode, activeUnitId]);

  return <div ref={elRef} className="map-shell" />;
}
