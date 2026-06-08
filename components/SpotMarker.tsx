'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Spot } from '@/lib/content';

interface Props {
  spot: Spot;
  tripId: string;
}

export default function SpotMarker({ spot, tripId }: Props) {
  const map = useMap();

  useEffect(() => {
    const [dx, dy] = spot.labelOffset;

    // 丸の半径・吹き出しのサイズ
    const dotR = 7;
    const bubbleW = 120;
    const bubbleH = 44;
    const pad = 10; // SVG のマージン

    // SVG 全体のサイズ（引き出し線が収まるように余白を取る）
    const svgW = Math.abs(dx) + bubbleW + pad * 2;
    const svgH = Math.abs(dy) + bubbleH + pad * 2;

    // 丸の位置（アンカー＝latlng の位置）
    const dotX = dx >= 0 ? pad : pad + Math.abs(dx);
    const dotY = dy >= 0 ? pad : pad + Math.abs(dy);

    // 吹き出しの左上
    const bx = dotX + dx - bubbleW / 2;
    const by = dotY + dy - bubbleH / 2;

    // 引き出し線の終点（吹き出し中央）
    const lineX2 = dotX + dx;
    const lineY2 = dotY + dy;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">
  <!-- 引き出し線 -->
  <line x1="${dotX}" y1="${dotY}" x2="${lineX2}" y2="${lineY2}"
        stroke="#555" stroke-width="2" stroke-dasharray="4 2"/>
  <!-- 実際の場所を示す丸 -->
  <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="#e74c3c" stroke="white" stroke-width="2"/>
  <!-- 吹き出し（クリッカブルにするためラベルとして描画）-->
  <rect x="${bx}" y="${by}" width="${bubbleW}" height="${bubbleH}"
        rx="12" ry="12" fill="#fff176" stroke="#f9a825" stroke-width="2.5"/>
  <text x="${bx + bubbleW / 2}" y="${by + bubbleH / 2 + 6}"
        text-anchor="middle" font-size="16" font-weight="bold" fill="#333">
    ${spot.ruby}
  </text>
</svg>`;

    const icon = L.divIcon({
      html: `<a href="/trips/${tripId}/spots/${spot.id}/" style="display:block;line-height:0">${svg}</a>`,
      className: '',
      iconSize: [svgW, svgH],
      iconAnchor: [dotX, dotY],
    });

    const marker = L.marker([spot.latlng[0], spot.latlng[1]], { icon }).addTo(map);

    return () => {
      map.removeLayer(marker);
    };
  }, [map, spot, tripId]);

  return null;
}
