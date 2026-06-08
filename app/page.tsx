import { getAllTrips, getSpots } from '@/lib/content';
import TripCard from '@/components/TripCard';

export default function TopPage() {
  const trips = getAllTrips();

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-200 to-yellow-100 p-8">
      <h1 className="text-5xl font-bold text-center text-sky-700 mb-4 drop-shadow">
        🌍 りょこうをえらぼう！
      </h1>
      <p className="text-2xl text-center text-gray-600 mb-12">いきたいりょこうをタップしてね</p>

      {trips.length === 0 ? (
        <p className="text-center text-xl text-gray-400">りょこうがまだないよ</p>
      ) : (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {trips.map((trip) => {
            const spots = getSpots(trip.id);
            return <TripCard key={trip.id} trip={trip} spotCount={spots.length} />;
          })}
        </div>
      )}
    </main>
  );
}
