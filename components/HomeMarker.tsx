'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const HOME_LATLNG: [number, number] = [35.363963, 136.727574];

export default function HomeMarker() {
  const map = useMap();

  useEffect(() => {
    const r = 13;
    const pad = 3;
    const size = (r + pad) * 2;
    const cx = size / 2;
    const cy = size / 2;

    const wallTop  = cy - r * 0.05;
    const wallBot  = cy + r * 0.78;
    const wallL    = cx - r * 0.58;
    const wallR    = cx + r * 0.58;
    const roofPeak = cy - r * 0.88;
    const roofL    = wallL - r * 0.12;
    const roofR    = wallR + r * 0.12;
    const doorW    = r * 0.42;
    const doorH    = r * 0.52;
    const doorX    = cx - doorW / 2;
    const doorY    = wallBot - doorH;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <!-- ドロップシャドウ -->
  <circle cx="${cx + 1}" cy="${cy + 1.5}" r="${r}" fill="rgba(0,0,0,0.2)"/>
  <!-- 白背景円 -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#2563eb" stroke-width="2.5"/>
  <!-- 屋根（青塗り） -->
  <polygon points="${cx},${roofPeak} ${roofL},${wallTop} ${roofR},${wallTop}" fill="#2563eb"/>
  <!-- 壁（青塗り） -->
  <rect x="${wallL}" y="${wallTop}" width="${wallR - wallL}" height="${wallBot - wallTop}" fill="#2563eb"/>
  <!-- ドア（白抜き） -->
  <rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" rx="1.5" fill="white"/>
</svg>`;

    const icon = L.divIcon({
      html: svg,
      className: '',
      iconSize: [size, size],
      iconAnchor: [cx, cy],
    });

    const marker = L.marker(HOME_LATLNG, { icon }).addTo(map);

    return () => {
      map.removeLayer(marker);
    };
  }, [map]);

  return null;
}
