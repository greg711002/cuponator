"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Export a wrapped version that provides Suspense for useSearchParams
export default function AdminCouponsPageWrapper() {
	return (
		<Suspense
			fallback={
				<div className="admin-empty">
					<p>Загрузка...</p>
				</div>
			}
		>
			<AdminCouponsPage />
		</Suspense>
	);
}

// ─── Types ──────────────────────────────────────────────────────────

interface Store {
	id: string;
	name: string;
	slug: string;
}

interface Coupon {
	id: string;
	storeId: string;
	title: string;
	description: string | null;
	code: string | null;
	discountType: string;
	discountValue: string;
	status: string;
	priority: number;
	isVerified: boolean;
	clickCount: string;
	sortOrder: number;
	expiresAt: string | null;
	createdAt: string;
	store: Store;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
	active: "Активен",
	imported: "Импортирован",
	pending_check: "На проверке",
	duplicate: "Дубликат",
	paused: "Приостановлен",
	expired: "Просрочен",
	rejected: "Отклонён",
	archived: "В архиве",
};

const DISCOUNT_LABELS: Record<string, string> = {
	percentage: "%",
	fixed_amount: "₽",
	free_delivery: "🚚",
	bonus: "🎁",
	gift: "Подарок",
	other: "Другое",
};

const COUPON_STATUSES = [
	"active",
	"imported",
	"pending_check",
	"duplicate",
	"paused",
	"expired",
	"rejected",
	"archived",
] as const;

const DISCOUNT_TYPES = [
	"percentage",
	"fixed_amount",
	"free_delivery",
	"bonus",
	"gift",
	"other",
] as const;

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// ─── Component ─────────────────────────────────────────────────────

function AdminCouponsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [loading, setLoading] = useState(true);
	const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");

	// Read filters from URL
	const page = Number(searchParams.get("page")) || 1;
	const search = searchParams.get("search") || "";
	const statusFilter = searchParams.get("status") || "";
	const storeFilter = searchParams.get("storeId") || "";
	const discountFilter = searchParams.get("discountType") || "";

	// ─── Fetch coupons when filters change ────────────────────────

	useEffect(() => {
		let ignore = false;
		const doFetch = async () => {
			setLoading(true);
			setError("");
			try {
				const params = new URLSearchParams();
				params.set("page", String(page));
				params.set("limit", "30");
				if (search) params.set("search", search);
				if (statusFilter) params.set("status", statusFilter);
				if (storeFilter) params.set("storeId", storeFilter);
				if (discountFilter) params.set("discountType", discountFilter);

				const res = await fetch(`/api/admin/coupons?${params}`);
				if (!res.ok) throw new Error("Ошибка загрузки");
				if (ignore) return;

				const data = await res.json();
				setCoupons(data.coupons || []);
				setPagination(data.pagination || null);
			} catch (err) {
				if (!ignore) {
					setError("Не удалось загрузить купоны");
					console.error(err);
				}
			} finally {
				if (!ignore) setLoading(false);
			}
		};
		doFetch();
		return () => {
			ignore = true;
		};
	}, [page, search, statusFilter, storeFilter, discountFilter]);

	// ─── Filter helpers ───────────────────────────────────────────

	function setFilter(key: string, value: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		params.delete("page"); // reset to page 1
		router.push(`/admin/coupons?${params}`);
	}

	// ─── Delete coupon ────────────────────────────────────────────

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);

		try {
			const res = await fetch(`/api/admin/coupons/${deleteTarget.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Ошибка удаления");

			setDeleteTarget(null);
			// Refresh the list by navigating with same params
			router.push(`/admin/coupons?${searchParams.toString()}`);
		} catch (err) {
			setError("Не удалось удалить купон");
			console.error(err);
		} finally {
			setDeleting(false);
		}
	}

	// ─── Render ───────────────────────────────────────────────────

	return (
		<div>
			{/* Page header */}
			<div className="admin-page-header">
				<h1>🏷️ Купоны ({pagination?.total ?? "..."})</h1>
				<Link href="/admin/coupons/new" className="admin-add-btn">
					+ Новый купон
				</Link>
			</div>

			{/* Filters */}
			<div className="admin-filters">
				<input
					type="text"
					placeholder="🔍 Поиск по названию, описанию, коду..."
					defaultValue={search}
					onChange={(e) => {
						const val = e.target.value;
						// Debounce via URL change
						const params = new URLSearchParams(searchParams.toString());
						if (val) params.set("search", val);
						else params.delete("search");
						params.delete("page");
						router.push(`/admin/coupons?${params}`);
					}}
				/>

				<select
					value={statusFilter}
					onChange={(e) => setFilter("status", e.target.value)}
				>
					<option value="">Все статусы</option>
					{COUPON_STATUSES.map((s) => (
						<option key={s} value={s}>
							{STATUS_LABELS[s]}
						</option>
					))}
				</select>

				<select
					value={discountFilter}
					onChange={(e) => setFilter("discountType", e.target.value)}
				>
					<option value="">Все типы скидок</option>
					{DISCOUNT_TYPES.map((d) => (
						<option key={d} value={d}>
							{DISCOUNT_LABELS[d]}
						</option>
					))}
				</select>

				{(search || statusFilter || storeFilter || discountFilter) && (
					<button
						className="admin-filter-btn"
						onClick={() => router.push("/admin/coupons")}
					>
						✕ Сбросить
					</button>
				)}
			</div>

			{/* Error */}
			{error && <div className="admin-alert admin-alert-error">{error}</div>}

			{/* Loading */}
			{loading ? (
				<div className="admin-table-wrap">
					<div className="admin-empty">
						<p>Загрузка купонов...</p>
					</div>
				</div>
			) : coupons.length === 0 ? (
				<div className="admin-table-wrap">
					<div className="admin-empty">
						<p>🤷 Купоны не найдены</p>
						<Link href="/admin/coupons/new" className="admin-add-btn">
							+ Создать первый купон
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Table */}
					<div className="admin-table-wrap">
						<table className="admin-table">
							<thead>
								<tr>
									<th>ID</th>
									<th>Название</th>
									<th>Магазин</th>
									<th>Скидка</th>
									<th>Статус</th>
									<th>Приоритет</th>
									<th>Действует до</th>
									<th>Клики</th>
									<th>Действия</th>
								</tr>
							</thead>
							<tbody>
								{coupons.map((coupon) => (
									<tr key={coupon.id}>
										<td className="font-mono text-xs text-gray-400">
											#{coupon.id}
										</td>
										<td>
											<div className="font-medium text-gray-900 max-w-[250px] truncate">
												{coupon.title}
											</div>
											{coupon.code && (
												<div className="text-xs text-gray-400 font-mono mt-0.5">
													Код: {coupon.code}
												</div>
											)}
										</td>
										<td>
											<span className="text-gray-600">{coupon.store.name}</span>
										</td>
										<td>
											<span className="admin-discount">
												{coupon.discountValue}
											</span>
											<span className="text-xs text-gray-400 ml-1">
												{DISCOUNT_LABELS[coupon.discountType]}
											</span>
										</td>
										<td>
											<span
												className={`admin-status admin-status-${coupon.status}`}
											>
												{STATUS_LABELS[coupon.status] || coupon.status}
											</span>
											{coupon.isVerified && (
												<span className="ml-1 text-green-600 text-xs">✓</span>
											)}
										</td>
										<td>
											<span className="text-sm">{coupon.priority}</span>
										</td>
										<td>
											<span
												className={`text-sm ${coupon.expiresAt && new Date(coupon.expiresAt) < new Date() ? "text-red-500" : "text-gray-600"}`}
											>
												{formatDate(coupon.expiresAt)}
											</span>
										</td>
										<td>
											<span className="text-sm text-gray-600">
												{coupon.clickCount}
											</span>
										</td>
										<td>
											<div className="admin-actions">
												<Link
													href={`/admin/coupons/${coupon.id}`}
													className="admin-action-btn admin-action-btn-edit"
												>
													✏️
												</Link>
												<button
													className="admin-action-btn admin-action-btn-delete"
													onClick={() => setDeleteTarget(coupon)}
												>
													🗑️
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{/* Pagination */}
						{pagination && pagination.totalPages > 1 && (
							<div className="admin-pagination">
								<button
									disabled={pagination.page <= 1}
									onClick={() => setFilter("page", String(pagination.page - 1))}
								>
									← Назад
								</button>

								{Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
									.filter((p) => {
										// Show first, last, and pages around current
										const current = pagination.page;
										return (
											p === 1 ||
											p === pagination.totalPages ||
											Math.abs(p - current) <= 2
										);
									})
									.map((p, idx, arr) => (
										<span key={p}>
											{idx > 0 && arr[idx - 1] !== p - 1 && (
												<span className="text-gray-400 px-1">...</span>
											)}
											<button
												className={
													p === pagination.page ? "admin-page-active" : ""
												}
												onClick={() => setFilter("page", String(p))}
											>
												{p}
											</button>
										</span>
									))}

								<button
									disabled={pagination.page >= pagination.totalPages}
									onClick={() => setFilter("page", String(pagination.page + 1))}
								>
									Вперёд →
								</button>
							</div>
						)}
					</div>
				</>
			)}

			{/* Delete confirmation */}
			{deleteTarget && (
				<div className="admin-overlay" onClick={() => setDeleteTarget(null)}>
					<div className="admin-confirm" onClick={(e) => e.stopPropagation()}>
						<h3>🗑️ Удалить купон</h3>
						<p>
							Вы уверены, что хотите удалить купон «{deleteTarget.title}»? Это
							также удалит все связанные клики. Действие необратимо.
						</p>
						<div className="admin-confirm-actions">
							<button
								className="admin-btn-secondary"
								onClick={() => setDeleteTarget(null)}
								disabled={deleting}
							>
								Отмена
							</button>
							<button
								className="admin-btn-primary"
								style={{ background: "#ef4444" }}
								onClick={confirmDelete}
								disabled={deleting}
							>
								{deleting ? "Удаление..." : "Удалить"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
