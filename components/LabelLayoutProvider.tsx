'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import type { Spot } from '@/lib/content';
import {
  resolveLabelOffsets,
  bubbleWidth,
  BUBBLE_HEIGHT,
  type LabelBox,
} from '@/lib/labelLayout';

// spotId → 計算済みオフセット [dx, dy]
type OffsetMap = Map<string, [number, number]>;

const LabelLayoutContext = createContext<OffsetMap>(new Map());

/** SpotMarker から自身の計算済みオフセットを取得する（未計算ならフォールバック） */
export function useLabelOffset(spot: Spot): [number, number] {
  const offsets = useContext(LabelLayoutContext);
  return offsets.get(spot.id) ?? spot.labelOffset;
}

interface Props {
  spots: Spot[];
  children: ReactNode;
}

export default function LabelLayoutProvider({ spots, children }: Props) {
  const map = useMap();
  const [offsets, setOffsets] = useState<OffsetMap>(new Map());

  useEffect(() => {
    const recompute = () => {
      const items: LabelBox[] = spots.map((spot) => {
        const pt = map.latLngToContainerPoint([spot.latlng[0], spot.latlng[1]]);
        return {
          id: spot.id,
          dot: { x: pt.x, y: pt.y },
          preferred: spot.labelOffset,
          box: { w: bubbleWidth(spot.ruby.length), h: BUBBLE_HEIGHT },
        };
      });
      setOffsets(resolveLabelOffsets(items));
    };

    recompute();
    map.on('zoomend moveend resize', recompute);
    return () => {
      map.off('zoomend moveend resize', recompute);
    };
  }, [map, spots]);

  return (
    <LabelLayoutContext.Provider value={offsets}>
      {children}
    </LabelLayoutContext.Provider>
  );
}
