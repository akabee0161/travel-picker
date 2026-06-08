'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Spot } from '@/lib/content';
import * as L from 'leaflet';

import SpotMarker from './SpotMarker';

// ── 表示範囲の調整はここだけ ──────────────────────────────
// center: 地図の中心点 [緯度, 経度]
//   緯度: 大きいほど北。日本は約 24〜46
//   経度: 大きいほど東。日本は約 123〜154
// zoom: ズームレベル（整数・小数可）
//   小さいほど広域（5 = 日本全体が見える程度）
//   大きいほど拡大（6 = 関東だけ、など）
const MAP_CENTER: [number, number] = [35.5, 136.5];
const MAP_ZOOM = 5;
// ──────────────────────────────────────────────────────────

// 外枠矩形 + 日本3島の穴を持つポリゴン
// Leaflet の SVG は fill-rule: evenodd で描画するため、
// 外枠の内側かつ穴の外側（= 日本以外）がグレーで塗られる
const JAPAN_OVERLAY_GEOJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      // 外枠（反時計回り）
      [[100,0],[160,0],[160,60],[100,60],[100,0]],
      // 穴1: 本州+四国+九州（時計回り、簡略）
      [
        [130.7,31.0],[130.3,31.8],[129.5,33.0],[130.8,33.9],
        [131.0,33.6],[131.5,33.2],[132.0,32.8],[134.0,33.0],
        [135.0,33.4],[136.0,33.7],[136.9,34.2],[137.8,34.6],
        [139.0,34.9],[139.8,34.9],[140.5,35.1],[141.5,36.7],
        [141.8,38.3],[141.5,40.4],[141.3,41.4],[140.3,41.5],
        [139.5,40.7],[137.5,37.8],[136.2,36.7],[135.0,35.4],
        [134.0,35.0],[132.5,34.4],[130.5,33.8],[130.3,32.0],
        [130.7,31.0]
      ],
      // 穴2: 北海道（時計回り、簡略）
      [
        [141.3,41.4],[143.0,41.5],[145.0,43.0],[145.5,44.0],
        [145.0,44.4],[143.5,44.1],[141.7,45.4],[140.0,44.0],
        [139.5,42.8],[140.3,42.0],[141.3,41.4]
      ],
      // 穴3: 沖縄本島（時計回り、簡略）
      [
        [127.7,26.8],[128.3,26.7],[128.3,26.2],
        [127.7,26.0],[127.2,26.2],[127.7,26.8]
      ],
    ]
  }
};

// 日本以外にグレーオーバーレイを重ねるコンポーネント
function JapanOverlay() {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(JAPAN_OVERLAY_GEOJSON, {
      style: {
        fill: true,
        fillColor: '#666666',
        fillOpacity: 0.35,
        stroke: false,
        weight: 0,
      }
    }).addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map]);
  return null;
}

// PDF 生成時に地図の準備完了を window.__mapReady で通知する
function MapReadyNotifier() {
  const map = useMap();
  useEffect(() => {
    map.whenReady(() => {
      map.once('load', () => {
        (window as Window & { __mapReady?: boolean }).__mapReady = true;
      });
      // タイルが全部ロードされたら通知
      let tileCount = 0;
      map.on('tileloadstart', () => { tileCount++; });
      map.on('tileload', () => {
        tileCount--;
        if (tileCount <= 0) {
          (window as Window & { __mapReady?: boolean }).__mapReady = true;
        }
      });
      // タイルがなければ即通知
      setTimeout(() => {
        (window as Window & { __mapReady?: boolean }).__mapReady = true;
      }, 3000);
    });
  }, [map]);
  return null;
}

interface Props {
  tripId: string;
  spots: Spot[];
}

export default function TripMapInner({ tripId, spots }: Props) {
  return (
    <MapContainer
      style={{ width: '100%', height: '100%' }}
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      dragging={false}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <JapanOverlay />
      <MapReadyNotifier />
      {spots.map((spot) => (
        <SpotMarker key={spot.id} spot={spot} tripId={tripId} />
      ))}
    </MapContainer>
  );
}
