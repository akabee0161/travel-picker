import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllTrips, getTrip, getSpots } from '@/lib/content';
import TripMap from '@/components/TripMap';
import PrintButton from '@/components/PrintButton';

export async function generateStaticParams() {
  const trips = getAllTrips();
  return trips.map((t) => ({ tripId: t.id }));
}

interface Props {
  params: Promise<{ tripId: string }>;
}

export default async function TripPage({ params }: Props) {
  const { tripId } = await params;
  const trip = getTrip(tripId);
  if (!trip) notFound();

  const spots = getSpots(tripId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <p className="text-xl text-orange-500 font-bold">{trip.date}</p>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{trip.title}</h1>
          <p className="text-2xl text-sky-600">{trip.message}</p>
        </div>

        {/* 地図 */}
        <TripMap tripId={tripId} spots={spots} />

        {/* ボタン */}
        <div className="flex flex-wrap gap-4 justify-center mt-6 no-print">
          <Link
            href="/"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xl font-bold px-6 py-3 rounded-2xl transition-colors"
          >
            ← もどる
          </Link>
          <PrintButton tripId={tripId} />
        </div>
      </div>
    </main>
  );
}
