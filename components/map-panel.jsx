'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const UNIT_COLOR = '#d6006e';
const OTHER_COLOR = '#5c6675';
const DEFAULT_CENTER = [-23.6, -46.74];

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

function pointKey(point, label) {
  return `${point[0]}:${point[1]}:${label}`;
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
  const [leafletReady, setLeafletReady] = useState(false);

  const activeUnits = useMemo(() => {
    if (viewMode === 'all') return units;
    return units.filter((u) => u.id === activeUnitId);
  }, [units, viewMode, activeUnitId]);

  const mapPoints = useMemo(() => {
    const seen = new Set();
    const points = [];

    activeUnits.forEach((unit) => {
      const unitPoint = getValidPoint(unit.lat, unit.lon);
      if (unitPoint) {
        const key = pointKey(unitPoint, unit.nome || unit.id || 'unit');
        if (!seen.has(key)) {
          seen.add(key);
          points.push({ type: 'unit', point: unitPoint, data: unit });
        }
      }

      (unit.concorrentes || []).forEach((competitor) => {
        const competitorPoint = getValidPoint(competitor.lat, competitor.lon);
        if (!competitorPoint) return;

        const key = pointKey(
          competitorPoint,
          competitor.nome || competitor.end || 'competitor'
        );
        if (seen.has(key)) return;

        seen.add(key);
        points.push({ type: 'competitor', point: competitorPoint, data: competitor });
      });
    });

    return points;
  }, [activeUnits]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const timer = setInterval(() => {
      if (window.L) {
        setLeafletReady(true);
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!leafletReady || !elRef.current || !window.L || mapRef.current) return;

    mapRef.current = window.L.map(elRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(DEFAULT_CENTER, 13);

    window.L.tileLayer('/tiles/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 12,
      attribution: '© OpenStreetMap',
    }).addTo(mapRef.current);
  }, [leafletReady]);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (mapPoints.length === 0) {
      mapRef.current.setView(DEFAULT_CENTER, 12);
      return;
    }

    mapPoints.forEach(({ type, point, data }) => {
      const marker = window.L.marker(point, {
        icon: divIcon(type === 'unit' ? UNIT_COLOR : OTHER_COLOR, type === 'unit'),
      }).addTo(mapRef.current);

      const popup =
        type === 'unit'
          ? `<b>${data.nome}</b><br>${data.endereco}<br>${data.telefone || '—'}`
          : `<b>${data.nome}</b><br>${data.tel || '—'}<br><small>${data.end || ''}</small>`;

      marker.bindPopup(popup);
      markersRef.current.push(marker);
    });

    const bounds = window.L.latLngBounds(mapPoints.map(({ point }) => point));
    if (mapPoints.length > 1 && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [32, 32] });
    } else if (mapPoints.length === 1) {
      mapRef.current.setView(mapPoints[0].point, 14);
    }
  }, [mapPoints]);

  useEffect(() => {
    if (!mapRef.current) return;

    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 50);

    return () => clearTimeout(timer);
  }, [viewMode, activeUnitId]);

  return <div ref={elRef} className="map-shell" />;
}
