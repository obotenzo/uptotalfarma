'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const UNIT_COLOR = '#d6006e';
const OTHER_COLOR = '#5c6675';
const RADIUS_FILL = '#d6006e';
const DEFAULT_CENTER = [-23.6, -46.74];
const DEFAULT_RADIUS_KM = 5;

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

function radiusBoundsForPoint([lat, lon], radiusKm, L) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return L.latLngBounds(
    [lat - latDelta, lon - lonDelta],
    [lat + latDelta, lon + lonDelta]
  );
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

export default function MapPanel({ units, viewMode, activeUnitId, radiusKm = DEFAULT_RADIUS_KM }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const [leafletReady, setLeafletReady] = useState(false);

  const activeUnits = useMemo(() => {
    if (viewMode === 'all') return units;
    return units.filter((u) => u.id === activeUnitId);
  }, [units, viewMode, activeUnitId]);

  const activeAnchor = activeUnits[0] ? getValidPoint(activeUnits[0].lat, activeUnits[0].lon) : null;

  const mapPoints = useMemo(() => {
    const seen = new Set();
    const points = [];

    activeUnits.forEach((unit) => {
      const unitPoint = getValidPoint(unit.lat, unit.lon);
      if (unitPoint) {
        const unitKey = pointKey(unitPoint, unit.nome || unit.id || 'unit');
        if (!seen.has(unitKey)) {
          seen.add(unitKey);
          points.push({
            type: 'unit',
            point: unitPoint,
            data: unit,
            distanceKm: 0,
          });
        }
      }

      (unit.concorrentes || []).forEach((competitor) => {
        const competitorPoint = getValidPoint(competitor.lat, competitor.lon);
        if (!competitorPoint || !unitPoint) return;

        const distanceKm = haversineKm(unitPoint, competitorPoint);
        if (distanceKm > radiusKm) return;

        const competitorKey = pointKey(
          competitorPoint,
          competitor.nome || competitor.end || 'competitor'
        );
        if (seen.has(competitorKey)) return;

        seen.add(competitorKey);
        points.push({
          type: 'competitor',
          point: competitorPoint,
          data: competitor,
          distanceKm,
        });
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
    }).setView(activeAnchor || DEFAULT_CENTER, activeAnchor ? 14 : 13);

    window.L.tileLayer('/tiles/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 12,
      attribution: '© OpenStreetMap',
    }).addTo(mapRef.current);
  }, [leafletReady, activeAnchor]);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    overlaysRef.current.forEach((overlay) => overlay.remove());
    overlaysRef.current = [];

    if (mapPoints.length === 0) {
      mapRef.current.setView(activeAnchor || DEFAULT_CENTER, activeAnchor ? 14 : 12);
      return;
    }

    activeUnits.forEach((unit, index) => {
      const unitPoint = getValidPoint(unit.lat, unit.lon);
      if (!unitPoint) return;

      const radiusCircle = window.L.circle(unitPoint, {
        radius: radiusKm * 1000,
        color: UNIT_COLOR,
        weight: 1.5,
        fillColor: RADIUS_FILL,
        fillOpacity: 0.06,
        opacity: 0.55 + index * 0.05,
      }).addTo(mapRef.current);
      overlaysRef.current.push(radiusCircle);
    });

    mapPoints.forEach(({ type, point, data, distanceKm }) => {
      const marker = window.L
        .marker(point, {
          icon: divIcon(type === 'unit' ? UNIT_COLOR : OTHER_COLOR, type === 'unit'),
        })
        .addTo(mapRef.current);

      const popup =
        type === 'unit'
          ? `
            <div style="min-width:220px">
              <div style="font-weight:800;font-size:14px;color:#081d3f;margin-bottom:6px">${data.nome}</div>
              <div style="color:#475569;line-height:1.45">${data.endereco}</div>
              <div style="margin-top:8px;font-weight:700;color:#0f172a">${data.telefone || '—'}</div>
            </div>`
          : `
            <div style="min-width:220px">
              <div style="font-weight:800;font-size:14px;color:#081d3f;margin-bottom:6px">${data.nome}</div>
              <div style="color:#475569;line-height:1.45">${data.end || ''}</div>
              <div style="margin-top:8px;font-weight:700;color:#d6006e">${distanceKm.toFixed(2)} km da unidade</div>
              <div style="margin-top:4px;color:#64748b">${data.tel || '—'}</div>
            </div>`;

      marker.bindPopup(popup);
      markersRef.current.push(marker);
    });

    const pointsForBounds = mapPoints.map(({ point }) => point);
    const bounds = window.L.latLngBounds(pointsForBounds);

    activeUnits.forEach((unit) => {
      const unitPoint = getValidPoint(unit.lat, unit.lon);
      if (!unitPoint) return;
      bounds.extend(radiusBoundsForPoint(unitPoint, radiusKm, window.L));
    });

    if (bounds.isValid() && mapPoints.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [96, 96] });
    } else if (mapPoints.length === 1) {
      mapRef.current.setView(mapPoints[0].point, 14);
    }
  }, [mapPoints, activeUnits, activeAnchor, radiusKm]);

  useEffect(() => {
    if (!mapRef.current) return;

    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 50);

    return () => clearTimeout(timer);
  }, [viewMode, activeUnitId]);

  return <div ref={elRef} className="map-shell" />;
}
