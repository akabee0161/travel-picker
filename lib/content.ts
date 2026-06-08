import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'content');

export interface Trip {
  id: string;
  date: string;
  title: string;
  message: string;
  order: number;
}

export interface Spot {
  id: string;
  tripId: string;
  name: string;
  ruby: string;
  area: string;
  order: number;
  latlng: [number, number];
  labelOffset: [number, number];
  photos: string[];
  points: string[];
  extras: string[];
  content: string;
}

export function getAllTrips(): Trip[] {
  const tripsDir = path.join(contentDir, 'trips');
  if (!fs.existsSync(tripsDir)) return [];

  const tripIds = fs.readdirSync(tripsDir).filter((name) => {
    return fs.statSync(path.join(tripsDir, name)).isDirectory();
  });

  const trips: Trip[] = tripIds
    .map((id) => getTrip(id))
    .filter((t): t is Trip => t !== null);

  return trips.sort((a, b) => a.order - b.order);
}

export function getTrip(id: string): Trip | null {
  const filePath = path.join(contentDir, 'trips', id, 'trip.md');
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);

  return {
    id: data.id ?? id,
    date: data.date ?? '',
    title: data.title ?? '',
    message: data.message ?? '',
    order: data.order ?? 0,
  };
}

export function getSpots(tripId: string): Spot[] {
  const spotsDir = path.join(contentDir, 'trips', tripId, 'spots');
  if (!fs.existsSync(spotsDir)) return [];

  const files = fs.readdirSync(spotsDir).filter((f) => f.endsWith('.md'));

  const spots: Spot[] = files
    .map((file) => {
      const spotId = file.replace(/\.md$/, '');
      return getSpot(tripId, spotId);
    })
    .filter((s): s is Spot => s !== null);

  return spots.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function getSpot(tripId: string, spotId: string): Spot | null {
  const filePath = path.join(contentDir, 'trips', tripId, 'spots', `${spotId}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    id: data.id ?? spotId,
    tripId,
    name: data.name ?? '',
    ruby: data.ruby ?? '',
    area: data.area ?? '',
    order: data.order ?? 0,
    latlng: data.latlng ?? [35.0, 135.0],
    labelOffset: data.labelOffset ?? [0, -40],
    photos: data.photos ?? [],
    points: data.points ?? [],
    extras: data.extras ?? [],
    content: content.trim(),
  };
}
