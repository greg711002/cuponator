"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────

interface Store {
	id: string;
	name: string;
}

interface FormData {
	storeId: string;
	title: string;
	description: string;
	code: string;
	promoUrl: string;
	discountType: string;
	discountValue: string;
	conditions: string;
	minOrderAmount: string;
	startsAt: string;
	expiresAt: string;
	isVerified: boolean;
	sortOrder: number;
	status: string;
	priority: number;
}

const DISCOUNT_TYPES = [
	{ value: "percentage", label: "Процент (%)" },
	{ value: "fixed_amount", label: "Фиксированная сумма (₽)" },
	{ value: "free_delivery", label: "Бесплатная доставка 🚚" },
	{ value: "bonus", label: "Бонус 🎁" },
	{ value: "gift", label: "Подарок" },
	{ value: "other", label: "Другое" },
];

const COUPON_STATUSES = [
	{ value: "active", label: "Активен" },
	{ value: "imported", label: "Импортирован" },
	{ value: "pending_check", label: "На проверке" },
	{ value: "duplicate", label: "Дубликат" },
	{ value: "paused", label: "Приостановлен" },
	{ value: "expired", label: "Просрочен" },
	{ value: "rejected", label: "Отклонён" },
	{ value: "archived", label: "В архиве" },
];

function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "";
	return new Date(dateStr).toISOString().slice(0, 10);
}

// ─── Component ─────────────────────────────────────────────────────

export default function EditCouponPage() {
	const router = useRouter();
	const params = useParams();
	const couponId = params.id as string;

	const [form, setForm] = useState<FormData | null>(null);
	const [stores, setStores] = useState<Store[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const [success, setSuccess] = useState("");

	const couponInfo = couponId ? `Купон #${couponId}` : "Купон";

	// Load coupon data and stores
	useEffect(() => {
		let ignore = false;

		async function load() {
			setLoading(true);
			try {
				const [couponRes, storesRes] = await Promise.all([
					fetch(`/api/admin/coupons/${couponId}`),
					fetch("/api/stores?limit=100"),
				]);

				if (ignore) return;

				if (!couponRes.ok) {
					throw new Error("Купон не найден");
				}

				const coupon = await couponRes.json();
				if (storesRes.ok) {
					const storesData = await storesRes.json();
					setStores(storesData.stores || []);
				}

				setForm({
					storeId: coupon.storeId,
					title: coupon.title,
					description: coupon.description || "",
					code: coupon.code || "",
					promoUrl: coupon.promoUrl || "",
					discountType: coupon.discountType,
					discountValue: coupon.discountValue,
					conditions: coupon.conditions || "",
					minOrderAmount: coupon.minOrderAmount
						? String(coupon.minOrderAmount)
						: "",
					startsAt: formatDate(coupon.startsAt),
					expiresAt: formatDate(coupon.expiresAt),
					isVerified: coupon.isVerified,
					sortOrder: coupon.sortOrder,
					status: coupon.status,
					priority: coupon.priority,
				});
			} catch (err) {
				if (!ignore) {
					setErrors([
						err instanceof Error ? err.message : "Ошибка загрузки купона",
					]);
				}
			} finally {
				if (!ignore) setLoading(false);
			}
		}

		load();
		return () => {
			ignore = true;
		};
	}, [couponId]);

	// Update form field
	function update<K extends keyof FormData>(key: K, value: FormData[K]) {
		setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
	}

	// Validate
	function validate(): boolean {
		if (!form) return false;
		const errs: string[] = [];
		if (!form.storeId) errs.push("Выберите магазин");
		if (!form.title.trim()) errs.push("Введите название купона");
		if (!form.discountValue.trim()) errs.push("Введите значение скидки");
		return setErrors(errs), errs.length === 0;
	}

	// Submit update
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!form || !validate()) return;

		setSaving(true);
		setErrors([]);
		setSuccess("");

		try {
			const res = await fetch(`/api/admin/coupons/${couponId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...form,
					minOrderAmount: form.minOrderAmount || null,
					expiresAt: form.expiresAt || null,
				}),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || `Ошибка ${res.status}`);
			}

			setSuccess(`✅ Купон #${couponId} обновлён!`);
		} catch (err) {
			setErrors([err instanceof Error ? err.message : "Ошибка при сохранении"]);
		} finally {
			setSaving(false);
		}
	}

	// Loading state
	if (loading) {
		return (
			<div>
				<div className="admin-page-header">
					<h1>✏️ Редактирование {couponInfo}</h1>
				</div>
				<div className="admin-form-card">
					<div className="admin-empty">
						<p>Загрузка...</p>
					</div>
				</div>
			</div>
		);
	}

	// Not found
	if (!form) {
		return (
			<div>
				<div className="admin-page-header">
					<h1>✏️ Купон не найден</h1>
				</div>
				<div className="admin-alert admin-alert-error">
					Купон #{couponId} не существует или был удалён.
				</div>
				<Link href="/admin/coupons" className="admin-btn-secondary">
					← Назад к списку
				</Link>
			</div>
		);
	}

	return (
		<div>
			<div className="admin-page-header">
				<h1>✏️ Редактирование купона #{couponId}</h1>
				<Link href="/admin/coupons" className="admin-btn-secondary">
					← Назад к списку
				</Link>
			</div>

			{/* Messages */}
			{success && (
				<div className="admin-alert admin-alert-success">{success}</div>
			)}
			{errors.length > 0 && (
				<div className="admin-alert admin-alert-error">
					{errors.map((e, i) => (
						<div key={i}>{e}</div>
					))}
				</div>
			)}

			<form className="admin-form" onSubmit={handleSubmit}>
				{/* Basic info */}
				<div className="admin-form-card">
					<h2>Основная информация</h2>
					<div className="admin-form-grid">
						<div className="admin-form-group">
							<label htmlFor="storeId">Магазин *</label>
							<select
								id="storeId"
								value={form.storeId}
								onChange={(e) => update("storeId", e.target.value)}
							>
								<option value="">Выберите магазин</option>
								{stores.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</select>
						</div>

						<div className="admin-form-group">
							<label htmlFor="status">Статус</label>
							<select
								id="status"
								value={form.status}
								onChange={(e) => update("status", e.target.value)}
							>
								{COUPON_STATUSES.map((s) => (
									<option key={s.value} value={s.value}>
										{s.label}
									</option>
								))}
							</select>
						</div>

						<div className="admin-form-group admin-form-grid-full">
							<label htmlFor="title">Название купона *</label>
							<input
								id="title"
								type="text"
								value={form.title}
								onChange={(e) => update("title", e.target.value)}
							/>
						</div>

						<div className="admin-form-group admin-form-grid-full">
							<label htmlFor="description">Описание</label>
							<textarea
								id="description"
								value={form.description}
								onChange={(e) => update("description", e.target.value)}
							/>
						</div>
					</div>
				</div>

				{/* Discount info */}
				<div className="admin-form-card">
					<h2>Скидка и промокод</h2>
					<div className="admin-form-grid">
						<div className="admin-form-group">
							<label htmlFor="discountType">Тип скидки *</label>
							<select
								id="discountType"
								value={form.discountType}
								onChange={(e) => update("discountType", e.target.value)}
							>
								{DISCOUNT_TYPES.map((d) => (
									<option key={d.value} value={d.value}>
										{d.label}
									</option>
								))}
							</select>
						</div>

						<div className="admin-form-group">
							<label htmlFor="discountValue">Значение скидки *</label>
							<input
								id="discountValue"
								type="text"
								value={form.discountValue}
								onChange={(e) => update("discountValue", e.target.value)}
							/>
						</div>

						<div className="admin-form-group">
							<label htmlFor="code">Промокод</label>
							<input
								id="code"
								type="text"
								value={form.code}
								onChange={(e) => update("code", e.target.value)}
							/>
						</div>

						<div className="admin-form-group">
							<label htmlFor="promoUrl">Ссылка на акцию</label>
							<input
								id="promoUrl"
								type="url"
								value={form.promoUrl}
								onChange={(e) => update("promoUrl", e.target.value)}
							/>
						</div>

						<div className="admin-form-group admin-form-grid-full">
							<label htmlFor="conditions">Условия акции</label>
							<textarea
								id="conditions"
								value={form.conditions}
								onChange={(e) => update("conditions", e.target.value)}
							/>
						</div>
					</div>
				</div>

				{/* Dates & settings */}
				<div className="admin-form-card">
					<h2>Даты и настройки</h2>
					<div className="admin-form-grid">
						<div className="admin-form-group">
							<label htmlFor="startsAt">Начало действия</label>
							<input
								id="startsAt"
								type="date"
								value={form.startsAt}
								onChange={(e) => update("startsAt", e.target.value)}
							/>
						</div>

						<div className="admin-form-group">
							<label htmlFor="expiresAt">Окончание действия</label>
							<input
								id="expiresAt"
								type="date"
								value={form.expiresAt}
								onChange={(e) => update("expiresAt", e.target.value)}
							/>
						</div>

						<div className="admin-form-group">
							<label htmlFor="minOrderAmount">Мин. сумма заказа</label>
							<input
								id="minOrderAmount"
								type="number"
								step="0.01"
								value={form.minOrderAmount}
								onChange={(e) => update("minOrderAmount", e.target.value)}
							/>
						</div>

						<div className="admin-form-group">
							<label htmlFor="priority">Приоритет</label>
							<input
								id="priority"
								type="number"
								min="0"
								max="10"
								value={form.priority}
								onChange={(e) => update("priority", Number(e.target.value))}
							/>
						</div>

						<div className="admin-form-group">
							<label htmlFor="sortOrder">Порядок сортировки</label>
							<input
								id="sortOrder"
								type="number"
								value={form.sortOrder}
								onChange={(e) => update("sortOrder", Number(e.target.value))}
							/>
						</div>

						<div className="admin-form-group">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={form.isVerified}
									onChange={(e) => update("isVerified", e.target.checked)}
									className="w-4 h-4"
								/>
								<span>Проверен</span>
							</label>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="admin-form-actions">
					<button type="submit" className="admin-btn-primary" disabled={saving}>
						{saving ? "Сохранение..." : "💾 Сохранить изменения"}
					</button>
					<Link href={`/admin/coupons`} className="admin-btn-secondary">
						Отмена
					</Link>
				</div>
			</form>
		</div>
	);
}
