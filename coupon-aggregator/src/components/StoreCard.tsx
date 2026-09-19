import Link from "next/link";
import type { Store } from "@prisma/client";

interface StoreCardProps {
	store: Store;
	couponCount?: number;
}

export default function StoreCard({ store, couponCount }: StoreCardProps) {
	return (
		<Link
			href={`/stores/${store.slug}`}
			className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-[#ff6b35]/30 hover:shadow-md transition-all"
		>
			<div className="flex items-center gap-4 mb-3">
				<div className="w-14 h-14 rounded-full bg-[#fff9f0] flex items-center justify-center text-2xl border border-gray-100 shrink-0">
					{getStoreEmoji(store.slug)}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-gray-900">{store.name}</h3>
					{couponCount !== undefined && (
						<p className="text-sm text-gray-500">
							{couponCount > 0
								? `${couponCount} ${declineWord(couponCount, ["купон", "купона", "купонов"])}`
								: "Нет активных купонов"}
						</p>
					)}
				</div>
				<span className="text-gray-400">→</span>
			</div>
			{store.description && (
				<p className="text-sm text-gray-600 line-clamp-2">
					{store.description}
				</p>
			)}
		</Link>
	);
}

function getStoreEmoji(slug: string): string {
	const emojis: Record<string, string> = {
		"yandex-eda": "🍜",
		kuper: "🛍️",
		vkusvill: "🥗",
		samokat: "🛵",
		pyaterochka: "⭐",
	};
	return emojis[slug] || "🏪";
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
