import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const couponId = BigInt(id);

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: { store: true },
  });

  if (!coupon || coupon.status !== "active") {
    notFound();
  }

  const isExpired =
    coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

  const discountLabel =
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}`
      : coupon.discountType === "fixed_amount"
        ? `${coupon.discountValue}`
        : coupon.discountType === "free_delivery"
          ? "Бесплатная доставка 🚚"
          : coupon.discountValue;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href={`/stores/${coupon.store.slug}`}
        className="text-sm text-gray-500 hover:text-[#ff6b35] mb-6 inline-block"
      >
        ← Назад к {coupon.store.name}
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#fff9f0] flex items-center justify-center text-3xl border border-gray-100">
            🏪
          </div>
          <div>
            <p className="text-sm text-gray-500">{coupon.store.name}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {coupon.title}
            </h1>
          </div>
        </div>

        {/* Discount badge */}
        <div className="inline-block discount-badge text-lg mb-6">
          {discountLabel}
        </div>

        {/* Description */}
        {coupon.description && (
          <p className="text-gray-600 text-lg mb-6">{coupon.description}</p>
        )}

        {/* Code reveal */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
          {coupon.code ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">Промокод:</p>
              <div className="code-reveal text-center text-2xl select-all">
                {coupon.code}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Скопируйте код и вставьте при оформлении заказа
              </p>
            </div>
          ) : (
            <div className="text-center">
              <a
                href={`${coupon.promoUrl || coupon.store.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-lg py-3 px-8 inline-block"
              >
                Перейти и получить скидку →
              </a>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {coupon.expiresAt && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Действует до</p>
              <p className="font-semibold text-gray-900">
                {new Date(coupon.expiresAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {isExpired && (
                  <span className="text-red-500 ml-2 text-sm">(истёк)</span>
                )}
              </p>
            </div>
          )}
          {coupon.minOrderAmount && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Мин. сумма заказа</p>
              <p className="font-semibold text-gray-900">
                {Number(coupon.minOrderAmount).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          )}
          {coupon.conditions && (
            <div className="bg-gray-50 rounded-lg p-4 sm:col-span-2">
              <p className="text-sm text-gray-500 mb-1">Условия</p>
              <p className="text-gray-900">{coupon.conditions}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <a
          href={`${coupon.promoUrl || coupon.store.websiteUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center py-4 text-lg"
        >
          Перейти в {coupon.store.name} →
        </a>
      </div>
    </div>
  );
}