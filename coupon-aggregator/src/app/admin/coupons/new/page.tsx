"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
	dataSource: string;
}

const initialState: FormData = {
	storeId: "",
	title: "",
	description: "",
	code: "",
	promoUrl: "",
	discountType: "percentage",
	discountValue: "",
	conditions: "",
	minOrderAmount: "",
	startsAt: new Date().toISOString().slice(0, 10),
	expiresAt: "",
	isVerified: false,
	sortOrder: 500,
	status: "active",
	priority: 5,
	dataSource: "manual",
};

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
	{ value: "paused", label: "Приостановлен" },
	{ value: "expired", label: "Просрочен" },
	{ value: "rejected", label: "Отклонён" },
	{ value: "archived", label: "В архиве" },
];

// ─── Component ─────────────────────────────────────────────────────

export default function NewCouponPage() {
	const router = useRouter();
	const [form, setForm] = useState<FormData>(initialState);
	const [stores, setStores] = useState<Store[]>([]);
	const [saving, setSaving] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const [success, setSuccess] = useState("");

	// Load stores
	useEffect(() => {
		async function loadStores() {
			try {
				const res = await fetch("/api/stores?limit=100");
				if (res.ok) {
					const data = await res.json();
					setStores(data.stores || []);
				}
			} catch {
				// fallback — try CSV approach
			}
		}
		loadStores();
	}, []);

	// Update form field
	function update<K extends keyof FormData>(key: K, value: FormData[K]) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	// Validate
	function validate(): boolean {
		const errs: string[] = [];
		if (!form.storeId) errs.push("Выберите магазин");
		if (!form.title.trim()) errs.push("Введите название купона");
		if (!form.discountValue.trim()) errs.push("Введите значение скидки");
		if (!form.startsAt) errs.push("Укажите дату начала действия");
		return setErrors(errs), errs.length === 0;
	}

	// Submit
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validate()) return;

		setSaving(true);
		setErrors([]);
		setSuccess("");

		try {
			const res = await fetch("/api/admin/coupons", {
				method: "POST",
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

			setSuccess("Купон создан! ✅");
			setForm(initialState);

			// Redirect to edit after short delay
			setTimeout(() => {
				router.push("/admin/coupons");
			}, 1000);
		} catch (err) {
			setErrors([err instanceof Error ? err.message : "Ошибка при сохранении"]);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div>
			<div className="admin-page-header">
				<h1>➕ Новый купон</h1>
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
							{!stores.length && (
								<span className="admin-hint">Загрузка магазинов...</span>
							)}
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
								placeholder="Скидка 20% на первый заказ"
							/>
						</div>

						<div className="admin-form-group admin-form-grid-full">
							<label htmlFor="description">Описание</label>
							<textarea
								id="description"
								value={form.description}
								onChange={(e) => update("description", e.target.value)}
								placeholder="Подробное описание условий акции..."
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
								placeholder="20%, 500₽, 2+1=3..."
							/>
						</div>

						<div className="admin-form-group">
							<label htmlFor="code">Промокод</label>
							<input
								id="code"
								type="text"
								value={form.code}
								onChange={(e) => update("code", e.target.value)}
								placeholder="PROMO2025"
							/>
							<span className="admin-hint">
								Оставьте пустым, если скидка по ссылке
							</span>
						</div>

						<div className="admin-form-group">
							<label htmlFor="promoUrl">Ссылка на акцию</label>
							<input
								id="promoUrl"
								type="url"
								value={form.promoUrl}
								onChange={(e) => update("promoUrl", e.target.value)}
								placeholder="https://..."
							/>
						</div>

						<div className="admin-form-group admin-form-grid-full">
							<label htmlFor="conditions">Условия акции</label>
							<textarea
								id="conditions"
								value={form.conditions}
								onChange={(e) => update("conditions", e.target.value)}
								placeholder="Минимальная сумма заказа, категории товаров..."
							/>
						</div>
					</div>
				</div>

				{/* Dates & settings */}
				<div className="admin-form-card">
					<h2>Даты и настройки</h2>
					<div className="admin-form-grid">
						<div className="admin-form-group">
							<label htmlFor="startsAt">Начало действия *</label>
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
							<span className="admin-hint">
								Оставьте пустым, если бессрочно
							</span>
						</div>

						<div className="admin-form-group">
							<label htmlFor="minOrderAmount">Мин. сумма заказа</label>
							<input
								id="minOrderAmount"
								type="number"
								step="0.01"
								value={form.minOrderAmount}
								onChange={(e) => update("minOrderAmount", e.target.value)}
								placeholder="1000"
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
							<span className="admin-hint">Выше = важнее (0–10)</span>
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
						{saving ? "Сохранение..." : "💾 Создать купон"}
					</button>
					<Link href="/admin/coupons" className="admin-btn-secondary">
						Отмена
					</Link>
				</div>
			</form>
		</div>
	);
}
