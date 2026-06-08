import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex flex-col items-center justify-center gap-6 p-8">
      <p className="text-6xl">😢</p>
      <h1 className="text-3xl font-bold text-gray-700">ページがみつかりません</h1>
      <Link
        href="/"
        className="bg-sky-500 hover:bg-sky-600 text-white text-xl font-bold px-8 py-4 rounded-2xl transition-colors"
      >
        トップにもどる
      </Link>
    </main>
  );
}
