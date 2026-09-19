import prisma from "@/lib/prisma";
import CouponCard from "@/components/CouponCard";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
	const coupons = await prisma.coupon.findMany({
		where: { status: "active", expiresAt: { gte: new Date() } },
		orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
		include: { store: true },
	});

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">🔥 Все купоны</h1>
				<p className="text-gray-500 mt-2">
					{coupons.length > 0
						? `${coupons.length} ${declineWord(coupons.length, ["актуальный промокод", "актуальных промокода", "актуальных промокодов"])}`
						: "Проверенные промокоды на доставку еды"}
				</p>
			</div>

			{coupons.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{coupons.map((coupon) => (
						<CouponCard key={coupon.id} coupon={coupon} />
					))}
				</div>
			) : (
				<div className="text-center py-20 bg-gray-50 rounded-xl">
					<p className="text-gray-500 text-lg mb-2">Купоны скоро появятся</p>
					<p className="text-gray-400 text-sm">
						Сейчас мы собираем актуальные промокоды для вас
					</p>
				</div>
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
