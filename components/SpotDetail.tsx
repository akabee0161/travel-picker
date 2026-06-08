import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Spot } from '@/lib/content';

interface Props {
  spot: Spot;
  tripId: string;
}

export default function SpotDetail({ spot, tripId }: Props) {
  return (
    <article className="bg-white rounded-3xl shadow-lg p-6 mb-8">
      {/* 名前 */}
      <h2 className="text-4xl font-bold text-gray-800 mb-1">
        <ruby>
          {spot.name}
          <rt className="text-lg font-normal text-gray-500">{spot.ruby}</rt>
        </ruby>
      </h2>
      <p className="text-xl text-gray-500 mb-4">📍 {spot.area}</p>

      {/* 写真 */}
      {spot.photos.length > 0 && (
        <div className="flex flex-col gap-4 mb-6">
          {spot.photos.map((src, i) => (
            <div key={i} className="relative w-full aspect-video rounded-2xl overflow-hidden">
              <Image
                src={src}
                alt={`${spot.ruby}のしゃしん ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            </div>
          ))}
        </div>
      )}

      {/* 説明文 */}
      {spot.content && (
        <div className="text-xl leading-loose text-gray-700 mb-6 prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{spot.content}</ReactMarkdown>
        </div>
      )}

      {/* おすすめポイント */}
      {spot.points.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-orange-500 mb-2">⭐ おすすめポイント</h3>
          <ul className="flex flex-col gap-2">
            {spot.points.map((pt, i) => (
              <li key={i} className="text-xl text-gray-700 flex items-start gap-2">
                <span>・</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 追加情報 */}
      {spot.extras.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-sky-600 mb-2">📋 くわしい情報</h3>
          <ul className="flex flex-col gap-2">
            {spot.extras.map((ex, i) => (
              <li key={i} className="text-xl text-gray-700 flex items-start gap-2">
                <span>・</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
