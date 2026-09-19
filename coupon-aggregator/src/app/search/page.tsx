import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CouponCard from "@/components/CouponCard";
import StoreCard from "@/components/StoreCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q } = await searchParams;

	if (!q || q.trim().length === 0) {
		return (
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
				<h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Поиск</h1>
				<form action="/search" method="GET" className="max-w-lg mx-auto">
					<div className="flex gap-3">
						<input
							type="text"
							name="q"
							placeholder="Например: Яндекс Еда, Самокат, скидка..."
							className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
						/>
						<button type="submit" className="btn-primary">
							Найти
						</button>
					</div>
				</form>
			</div>
		);
	}

	const query = q.trim().toLowerCase();

	const [stores, coupons] = await Promise.all([
		prisma.store.findMany({
			where: {
				isActive: true,
				OR: [
					{ name: { contains: query, mode: "insensitive" } },
					{ description: { contains: query, mode: "insensitive" } },
				],
			},
			orderBy: { sortOrder: "asc" },
			include: {
				_count: { select: { coupons: { where: { status: "active" } } } },
			},
		}),
		prisma.coupon.findMany({
			where: {
				status: "active",
				expiresAt: { gte: new Date() },
				OR: [
					{ title: { contains: query, mode: "insensitive" } },
					{ description: { contains: query, mode: "insensitive" } },
					{ code: { contains: query, mode: "insensitive" } },
					{ store: { name: { contains: query, mode: "insensitive" } } },
				],
			},
			orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
			take: 20,
			include: { store: true },
		}),
	]);

	const totalResults = stores.length + coupons.length;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="mb-8">
				<form action="/search" method="GET" className="max-w-xl">
					<div className="flex gap-3">
						<input
							type="text"
							name="q"
							defaultValue={q}
							placeholder="Например: Яндекс Еда, Самокат, скидка..."
							className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
						/>
						<button type="submit" className="btn-primary">
							Найти
						</button>
					</div>
				</form>
				<p className="text-sm text-gray-500 mt-3">
					{totalResults > 0
						? `Найдено ${totalResults} ${declineWord(totalResults, ["результат", "результата", "результатов"])} по запросу «${q}»`
						: `Ничего не найдено по запросу «${q}»`}
				</p>
			</div>

			{totalResults === 0 && (
				<div className="text-center py-16 bg-gray-50 rounded-xl">
					<p className="text-gray-500 text-lg mb-2">Ничего не нашлось</p>
					<p className="text-gray-400 text-sm">
						Попробуйте изменить запрос или посмотрите все доступные магазины
					</p>
				</div>
			)}

			{stores.length > 0 && (
				<section className="mb-12">
					<h2 className="text-xl font-bold text-gray-900 mb-4">🏪 Магазины</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{stores.map((store) => (
							<StoreCard
								key={store.id}
								store={store}
								couponCount={store._count.coupons}
							/>
						))}
					</div>
				</section>
			)}

			{coupons.length > 0 && (
				<section>
					<h2 className="text-xl font-bold text-gray-900 mb-4">🔥 Купоны</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{coupons.map((coupon) => (
							<CouponCard key={coupon.id} coupon={coupon} />
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function declineWord(n: number, forms: [string, string, string]): string {
	const absN = Math.abs(n);
	const lastDigit = absN % 10;
	const lastTwoDigits = absN % 100;
	if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return forms[2];
	if (lastDigit === 1) return forms[0];
	if (lastDigit >= 2 && lastDigit <= 4) return forms[1];
	return forms[2];
}
