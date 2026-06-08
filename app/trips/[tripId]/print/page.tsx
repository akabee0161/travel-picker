import { notFound } from 'next/navigation';
import { getAllTrips, getTrip, getSpots } from '@/lib/content';
import SpotDetail from '@/components/SpotDetail';
import TripMap from '@/components/TripMap';

export async function generateStaticParams() {
  const trips = getAllTrips();
  return trips.map((t) => ({ tripId: t.id }));
}

interface Props {
  params: Promise<{ tripId: string }>;
}

export default async function PrintPage({ params }: Props) {
  const { tripId } = await params;
  const trip = getTrip(tripId);
  if (!trip) notFound();

  const spots = getSpots(tripId);

  return (
    <main className="bg-white">
      {/* 1ページ目：地図 */}
      <section
        style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
        className="p-8 min-h-screen flex flex-col"
      >
        <div className="text-center mb-6">
          <p className="text-2xl text-orange-500 font-bold">{trip.date}</p>
          <h1 className="text-5xl font-bold text-gray-800 mb-2">{trip.title}</h1>
          <p className="text-3xl text-sky-600">{trip.message}</p>
        </div>
        <TripMap tripId={tripId} spots={spots} />
      </section>

      {/* 候補ごとに詳細ページ */}
      {spots.map((spot, i) => (
        <section
          key={spot.id}
          style={i < spots.length - 1 ? { breakAfter: 'page', pageBreakAfter: 'always' } : {}}
          className="p-8"
        >
          <SpotDetail spot={spot} tripId={tripId} />
        </section>
      ))}
    </main>
  );
}
