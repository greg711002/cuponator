import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl">🍽️</span>
            <div>
              <span className="text-xl font-bold gradient-text">
                КупоныЕды
              </span>
              <span className="hidden sm:block text-xs text-gray-400 -mt-1">
                Скидки на доставку
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/stores"
              className="text-sm font-medium text-gray-600 hover:text-[#ff6b35] transition-colors"
            >
              Магазины
            </Link>
            <Link
              href="/coupons"
              className="text-sm font-medium text-gray-600 hover:text-[#ff6b35] transition-colors"
            >
              Все купоны
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/search" className="btn-outline text-sm py-2 px-4 hidden sm:flex">
              🔍 Поиск
            </Link>
            <Link href="/coupons" className="btn-primary text-sm py-2 px-4">
              🔥 Скидки
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}