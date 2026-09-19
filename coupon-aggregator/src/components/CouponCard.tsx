import Link from "next/link";
import type { Coupon, Store, Category } from "@prisma/client";

interface CouponCardProps {
  coupon: Coupon & { store: Store };
}

export default function CouponCard({ coupon }: CouponCardProps) {
  const isExpired =
    coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const discountLabel = coupon.discountType === "percentage"
    ? `${coupon.discountValue}`
    : coupon.discountType === "fixed_amount"
      ? `${coupon.discountValue}`
      : coupon.discountType === "free_delivery"
        ? "Бесплатная доставка 🚚"
        : coupon.discountValue;

  return (
    <Link
      href={`/coupons/${coupon.id}`}
      className={`coupon-card block bg-white rounded-xl border border-gray-100 p-5 ${
        isExpired ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#fff9f0] flex items-center justify-center text-lg shrink-0 border border-gray-100">
          {coupon.store.logoUrl || "🏪"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">
            {coupon.store.name}
          </p>
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">
            {coupon.title}
          </h3>
        </div>
        <div className="shrink-0">
          <span className="discount-badge">{discountLabel}</span>
        </div>
      </div>

      {coupon.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {coupon.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {coupon.expiresAt && (
            <span className="text-xs text-gray-400">
              до {new Date(coupon.expiresAt).toLocaleDateString("ru-RU")}
            </span>
          )}
          {coupon.isVerified && (
            <span className="text-xs text-green-600 font-medium">
              ✓ Проверен
            </span>
          )}
        </div>
        <span className="btn-primary text-xs py-1.5 px-3">
          {coupon.code ? "Показать код" : "Получить скидку"}
        </span>
      </div>
    </Link>
  );
}