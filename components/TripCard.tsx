import Link from 'next/link';
import type { Trip } from '@/lib/content';

interface Props {
  trip: Trip;
  spotCount: number;
}

export default function TripCard({ trip, spotCount }: Props) {
  return (
    <Link
      href={`/trips/${trip.id}/`}
      className="block bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all duration-200 border-4 border-yellow-300"
    >
      <p className="text-2xl font-bold text-orange-500 mb-2">{trip.date}</p>
      <p className="text-4xl font-bold text-gray-800 mb-4">{trip.title}</p>
      <p className="text-xl text-gray-500">{spotCount}けんのこうほ</p>
    </Link>
  );
}
