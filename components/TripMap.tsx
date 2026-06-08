'use client';

import dynamic from 'next/dynamic';
import type { Spot } from '@/lib/content';

const MapInner = dynamic(() => import('./TripMapInner'), { ssr: false });

interface Props {
  tripId: string;
  spots: Spot[];
}

export default function TripMap({ tripId, spots }: Props) {
  return (
    <div className="w-full flex justify-center">
      <div
        style={{ width: 480, maxWidth: '100%', height: 720 }}
        className="shadow-xl border-4 border-sky-300"
      >
        <MapInner tripId={tripId} spots={spots} />
      </div>
    </div>
  );
}
