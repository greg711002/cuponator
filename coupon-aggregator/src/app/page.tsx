import Link from "next/link";
import prisma from "@/lib/prisma";
import CouponCard from "@/components/CouponCard";
import StoreCard from "@/components/StoreCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const [categories, stores, recentCoupons] = await Promise.all([
		prisma.category.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: "asc" },
		}),
		prisma.store.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: "asc" },
			include: {
				_count: { select: { coupons: { where: { status: "active" } } } },
			},
		}),
		prisma.coupon.findMany({
			where: { status: "active", expiresAt: { gte: new Date() } },
			orderBy: { createdAt: "desc" },
			take: 6,
			include: { store: true },
		}),
	]);

	return (
		<div>
			{/* Hero Section */}
			<section className="bg-gradient-to-br from-[#fff9f0] via-white to-[#fff3e6] py-16 lg:py-24">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
						<span className="gradient-text">Экономь на еде</span>
						<br />
						каждый день
					</h1>
					<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
						Проверенные промокоды на доставку продуктов и готовой еды. Яндекс
						Еда, Kuper, ВкусВилл, Самокат — все скидки в одном месте.
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Link href="/coupons" className="btn-primary text-lg py-3 px-8">
							🔥 Все скидки сейчас
						</Link>
						<Link href="/stores" className="btn-outline text-lg py-3 px-8">
							🏪 Магазины
						</Link>
					</div>
				</div>
			</section>

			{/* Categories */}
			<section className="py-8 border-b border-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-wrap gap-2 justify-center">
						{categories.map((cat) => (
							<Link
								key={cat.id}
								href={`/stores?category=${cat.slug}`}
								className="category-pill"
							>
								{cat.icon} {cat.name}
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* Recent Coupons */}
			<section className="py-12 lg:py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between mb-8">
						<div>
							<h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
								🔥 Свежие купоны
							</h2>
							<p className="text-gray-500 mt-1">
								Проверенные промокоды на этой неделе
							</p>
						</div>
						<Link
							href="/coupons"
							className="text-[#ff6b35] font-medium hover:underline"
						>
							Все купоны →
						</Link>
					</div>

					{recentCoupons.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{recentCoupons.map((coupon) => (
								<CouponCard key={coupon.id} coupon={coupon} />
							))}
						</div>
					) : (
						<div className="text-center py-12 bg-gray-50 rounded-xl">
							<p className="text-gray-500">
								Скоро здесь появятся свежие промокоды
							</p>
						</div>
					)}
				</div>
			</section>

			{/* Stores */}
			<section className="py-12 bg-[#fff9f0] lg:py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between mb-8">
						<div>
							<h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
								🏪 Популярные магазины
							</h2>
							<p className="text-gray-500 mt-1">
								Выберите сервис и смотрите все купоны
							</p>
						</div>
						<Link
							href="/stores"
							className="text-[#ff6b35] font-medium hover:underline"
						>
							Все магазины →
						</Link>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
						{stores.map((store) => (
							<StoreCard
								key={store.id}
								store={store}
								couponCount={store._count.coupons}
							/>
						))}
					</div>
				</div>
			</section>

			{/* Trust */}
			<section className="py-12 lg:py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
						<div className="p-6">
							<div className="text-4xl mb-4">✅</div>
							<h3 className="font-semibold text-gray-900 mb-2">
								Проверенные купоны
							</h3>
							<p className="text-sm text-gray-500">
								Каждый промокод проверяется модератором
							</p>
						</div>
						<div className="p-6">
							<div className="text-4xl mb-4">⚡</div>
							<h3 className="font-semibold text-gray-900 mb-2">
								Всегда актуально
							</h3>
							<p className="text-sm text-gray-500">
								Ежедневное обновление базы промокодов
							</p>
						</div>
						<div className="p-6">
							<div className="text-4xl mb-4">💰</div>
							<h3 className="font-semibold text-gray-900 mb-2">Выгодно</h3>
							<p className="text-sm text-gray-500">
								CPA-партнёрки со всеми крупными сервисами
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-12 bg-gradient-to-r from-[#ff6b35] to-[#ff8f5e] lg:py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
						Не пропусти скидку на ужин 🍕
					</h2>
					<p className="text-white/90 mb-6 max-w-lg mx-auto">
						Подпишись на Telegram-канал — получай горящие купоны первым
					</p>
					<a
						href="#"
						className="inline-flex items-center gap-2 bg-white text-[#ff6b35] font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors"
					>
						📱 Подписаться
					</a>
				</div>
			</section>
		</div>
	);
}
