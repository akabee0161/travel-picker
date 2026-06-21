'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Spot } from '@/lib/content';
import { bubbleWidth, BUBBLE_HEIGHT } from '@/lib/labelLayout';
import { useLabelOffset } from './LabelLayoutProvider';

interface Props {
  spot: Spot;
  tripId: string;
}

export default function SpotMarker({ spot, tripId }: Props) {
  const map = useMap();
  // 重なり回避で再計算されたオフセット（未計算時は spot.labelOffset）
  const [dx, dy] = useLabelOffset(spot);

  useEffect(() => {
    const dotR = 6;
    const bubbleH = BUBBLE_HEIGHT;
    const pad = 6;
    // 文字数に応じて吹き出し幅を動的に決定（ひらがな1文字 ≈ 13px）
    const bubbleW = bubbleWidth(spot.ruby.length);

    // ドット相対座標で全要素のバウンディングボックスを計算し、SVGサイズを決定
    const minX = Math.min(-dotR, dx - bubbleW / 2);
    const maxX = Math.max(dotR, dx + bubbleW / 2);
    const minY = Math.min(-dotR, dy - bubbleH / 2);
    const maxY = Math.max(dotR, dy + bubbleH / 2);

    const svgW = maxX - minX + pad * 2;
    const svgH = maxY - minY + pad * 2;

    // ドット相対座標 → SVG座標への変換オフセット
    const offsetX = -minX + pad;
    const offsetY = -minY + pad;

    const dotX = offsetX;
    const dotY = offsetY;

    // 吹き出しの左上
    const bx = dx + offsetX - bubbleW / 2;
    const by = dy + offsetY - bubbleH / 2;

    // 引き出し線の終点（吹き出し中央）
    const lineX2 = dx + offsetX;
    const lineY2 = dy + offsetY;

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
        text-anchor="middle" font-size="13" font-weight="bold" fill="#333">
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
  }, [map, spot, tripId, dx, dy]);

  return null;
}
