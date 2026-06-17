'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Spot } from '@/lib/content';
import * as L from 'leaflet';

import SpotMarker from './SpotMarker';
import HomeMarker from './HomeMarker';

// ── 表示範囲の調整はここだけ ──────────────────────────────
// center: 地図の中心点 [緯度, 経度]
//   緯度: 大きいほど北。日本は約 24〜46
//   経度: 大きいほど東。日本は約 123〜154
// zoom: ズームレベル（0.1刻みで指定可能）
//   小さいほど広域（5 = 日本全体が見える程度）
//   大きいほど拡大（6 = 関東だけ、など）
//   ※ OSMタイルは整数のみ配信だが Leaflet がスケーリングして補間する
const MAP_CENTER: [number, number] = [35.5, 136.5];
const MAP_ZOOM = 5.2;
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
        [141.7,45.8],[145.7,44.5],[146.1,43.4],[142.1,40.8],
        [142.4,38.7],[140.8,34.9],[132.3,32.4],[128.0,25.6],
        [127.0,26.1],[129.9,30.8],[129.0,33.3],[132.4,35.8],
        [135.4,36.1],[136.6,37.8],[138.7,38.9],[139.6,43.2],
        [141.7,45.8]
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
        fillColor: '#333333',
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
      zoomSnap={0.1}
      dragging={true}
      zoomControl={false}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      touchZoom={true}
      keyboard={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <JapanOverlay />
      <MapReadyNotifier />
      <HomeMarker />
      {spots.map((spot) => (
        <SpotMarker key={spot.id} spot={spot} tripId={tripId} />
      ))}
    </MapContainer>
  );
}
