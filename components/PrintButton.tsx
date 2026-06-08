'use client';

interface Props {
  tripId: string;
}

export default function PrintButton({ tripId }: Props) {
  return (
    <a
      href={`/pdf/${tripId}.pdf`}
      download
      className="inline-block bg-green-500 hover:bg-green-600 text-white text-2xl font-bold px-8 py-4 rounded-2xl shadow-lg transition-colors"
    >
      🖨️ いんさつする
    </a>
  );
}
