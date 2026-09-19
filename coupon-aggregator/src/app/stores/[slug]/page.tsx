import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import CouponCard from "@/components/CouponCard";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      category: true,
      coupons: {
        where: { status: "active", expiresAt: { gte: new Date() } },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: { store: true },
      },
    },
  });

  if (!store || !store.isActive) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Store header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-[#fff9f0] flex items-center justify-center text-4xl border border-gray-100 shrink-0">
          {getStoreEmoji(slug)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {store.category.icon} {store.category.name}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
          {store.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">{store.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-gray-500">
              {store.coupons.length > 0
                ? `${store.coupons.length} ${declineWord(store.coupons.length, ["активный купон", "активных купона", "активных купонов"])}`
                : "Нет активных купонов"}
            </span>
          </div>
        </div>
      </div>

      {/* Coupons */}
      {store.coupons.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Купоны и промокоды</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg mb-2">Пока нет активных купонов</p>
          <p className="text-gray-400 text-sm">
            Скоро здесь появятся промокоды для {store.name}
          </p>
        </div>
      )}
    </div>
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