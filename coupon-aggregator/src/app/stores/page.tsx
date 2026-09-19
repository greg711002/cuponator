import Link from "next/link";
import prisma from "@/lib/prisma";
import StoreCard from "@/components/StoreCard";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { coupons: { where: { status: "active" } } } } },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏪 Магазины и сервисы</h1>
        <p className="text-gray-500 mt-2">
          Все сервисы доставки продуктов и еды с актуальными купонами
        </p>
      </div>

      {stores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              couponCount={store._count.coupons}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Список магазинов скоро пополнится</p>
        </div>
      )}
    </div>
  );
}