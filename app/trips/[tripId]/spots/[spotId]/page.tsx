import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllTrips, getTrip, getSpots, getSpot } from '@/lib/content';
import SpotDetail from '@/components/SpotDetail';
import PrintButton from '@/components/PrintButton';

export async function generateStaticParams() {
  const trips = getAllTrips();
  const params: { tripId: string; spotId: string }[] = [];
  for (const trip of trips) {
    const spots = getSpots(trip.id);
    for (const spot of spots) {
      params.push({ tripId: trip.id, spotId: spot.id });
    }
  }
  return params;
}

interface Props {
  params: Promise<{ tripId: string; spotId: string }>;
}

export default async function SpotPage({ params }: Props) {
  const { tripId, spotId } = await params;
  const trip = getTrip(tripId);
  if (!trip) notFound();

  const spot = getSpot(tripId, spotId);
  if (!spot) notFound();

  const spots = getSpots(tripId);
  const idx = spots.findIndex((s) => s.id === spotId);
  const prevSpot = idx > 0 ? spots[idx - 1] : null;
  const nextSpot = idx < spots.length - 1 ? spots[idx + 1] : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 戻るリンク */}
        <div className="mb-4 no-print">
          <Link
            href={`/trips/${tripId}/`}
            className="text-sky-600 text-xl font-bold hover:underline"
          >
            ← ちずにもどる
          </Link>
        </div>

        <SpotDetail spot={spot} tripId={tripId} />

        {/* 前後ナビ + 印刷ボタン */}
        <div className="flex flex-wrap gap-4 justify-between items-center mt-4 no-print">
          <div className="flex gap-3">
            {prevSpot && (
              <Link
                href={`/trips/${tripId}/spots/${prevSpot.id}/`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg px-5 py-3 rounded-2xl transition-colors"
              >
                ← {prevSpot.ruby}
              </Link>
            )}
            {nextSpot && (
              <Link
                href={`/trips/${tripId}/spots/${nextSpot.id}/`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg px-5 py-3 rounded-2xl transition-colors"
              >
                {nextSpot.ruby} →
              </Link>
            )}
          </div>
          <PrintButton tripId={tripId} />
        </div>
      </div>
    </main>
  );
}
