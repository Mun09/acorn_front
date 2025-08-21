import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Acorn 🌰
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Modern social platform for financial discussions
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>

      {/* 기능 소개 섹션 */}
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">💬 Social Feed</h3>
          <p className="text-gray-600">
            Share your thoughts and engage with the community
          </p>
        </div>
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">📈 Market Insights</h3>
          <p className="text-gray-600">
            Discuss stocks, crypto, and market trends
          </p>
        </div>
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">🤝 Trust Network</h3>
          <p className="text-gray-600">
            Build connections with verified traders
          </p>
        </div>
      </div>
    </main>
  );
}
