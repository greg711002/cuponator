"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminSourcesPageWrapper() {
	return (
		<Suspense fallback={<div className="admin-empty"><p>Загрузка...</p></div>}>
			<AdminSourcesPage />
		</Suspense>
	);
}

// ─── Types ──────────────────────────────────────────────────────────

interface Store {
	id: string;
	name: string;
	slug: string;
}

interface Source {
	id: string;
	name: string;
	type: string;
	storeId: string | null;
	store: Store | null;
	config: Record<string, unknown>;
	isActive: boolean;
	lastSyncAt: string | null;
	createdAt: string;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

const SOURCE_TYPES = [
	{ value: "manual", label: "📝 Ручное добавление" },
	{ value: "cpa_feed", label: "📡 CPA-фид (JSON)" },
	{ value: "api_custom", label: "🔌 Свой API" },
	{ value: "csv_import", label: "📄 CSV-импорт" },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const TYPE_LABELS: Record<string, string> = {
	manual: "📝 Ручное",
	cpa_feed: "📡 CPA-фид",
	api_custom: "🔌 API",
	csv_import: "📄 CSV",
};

// ─── Component ─────────────────────────────────────────────────────

function AdminSourcesPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [stores, setStores] = useState<Store[]>([]);
	const [sources, setSources] = useState<Source[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Modal state
	const [modal, setModal] = useState<{
		mode: "add" | "edit" | "test" | "delete";
		source?: Source;
	} | null>(null);
	const [form, setForm] = useState({
		name: "",
		type: "cpa_feed",
		storeId: "",
		config: "",
	});
	const [saving, setSaving] = useState(false);
	const [testResult, setTestResult] = useState<string | null>(null);
	const [testing, setTesting] = useState(false);

	const page = Number(searchParams.get("page")) || 1;
	const typeFilter = searchParams.get("type") || "";

	// ─── Load sources & stores ────────────────────────────────────

	const loadSources = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const params = new URLSearchParams();
			params.set("page", String(page));
			if (typeFilter) params.set("type", typeFilter);

			const [sourcesRes, storesRes] = await Promise.all([
				fetch(`/api/admin/sources?${params}`),
				fetch("/api/stores"),
			]);

			if (!sourcesRes.ok) throw new Error("Ошибка загрузки источников");

			const sourcesData = await sourcesRes.json();
			setSources(sourcesData.sources || []);
			setPagination(sourcesData.pagination || null);

			if (storesRes.ok) {
				const storesData = await storesRes.json();
				setStores(storesData.stores || []);
			}
		} catch (err) {
			setError("Не удалось загрузить источники");
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [page, typeFilter]);

	useEffect(() => {
		loadSources();
	}, [loadSources]);

	// ─── Filters ──────────────────────────────────────────────────

	function setFilter(key: string, value: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (value) params.set(key, value);
		else params.delete(key);
		params.delete("page");
		router.push(`/admin/sources?${params}`);
	}

	// ─── Save source ──────────────────────────────────────────────

	async function handleSave() {
		if (!form.name.trim()) return;
		setSaving(true);

		let config: Record<string, unknown> = {};
		if (form.config.trim()) {
			try {
				config = JSON.parse(form.config);
			} catch {
				setError("Ошибка в JSON конфигурации");
				setSaving(false);
				return;
			}
		}

		try {
			const method = modal?.mode === "edit" ? "PATCH" : "POST";
			const url =
				modal?.mode === "edit" && modal.source
					? `/api/admin/sources/${modal.source.id}`
					: "/api/admin/sources";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: form.name,
					type: form.type,
					storeId: form.storeId || null,
					config: Object.keys(config).length > 0 ? config : {},
				}),
			});

			if (!res.ok) throw new Error("Ошибка сохранения");

			setModal(null);
			setForm({ name: "", type: "cpa_feed", storeId: "", config: "" });
			loadSources();
		} catch (err) {
			setError("Не удалось сохранить источник");
			console.error(err);
		} finally {
			setSaving(false);
		}
	}

	// ─── Test source ──────────────────────────────────────────────

	async function handleTest() {
		setTesting(true);
		setTestResult(null);

		// Simulate a test — проверяем, что конфиг парсится и показываем информацию
		let config: Record<string, unknown> = {};
		if (form.config.trim()) {
			try {
				config = JSON.parse(form.config);
			} catch {
				setTestResult("❌ Ошибка: невалидный JSON в конфигурации");
				setTesting(false);
				return;
			}
		}

		// Для CPA-фида проверяем URL
		if (form.type === "cpa_feed" && config.url) {
			try {
				const testRes = await fetch(config.url as string, { signal: AbortSignal.timeout(10000) });
				if (testRes.ok) {
					const text = await testRes.text();
					const preview = text.slice(0, 200);
					setTestResult(
						`✅ URL доступен (HTTP ${testRes.status})\n\nПервые 200 символов ответа:\n${preview}`
					);
				} else {
					setTestResult(`❌ URL ответил с ошибкой: HTTP ${testRes.status}`);
				}
			} catch (e) {
				setTestResult(
					`❌ Не удалось подключиться: ${e instanceof Error ? e.message : "неизвестная ошибка"}`
				);
			}
		} else if (form.type === "cpa_feed" && !config.url) {
			setTestResult("⚠️ Для CPA-фида укажите URL в конфигурации ({\"url\": \"https://...\"})");
		} else {
			setTestResult("✅ Конфигурация валидна. Подключение можно будет проверить после сохранения.");
		}
		setTesting(false);
	}

	// ─── Delete source ────────────────────────────────────────────

	async function handleDelete() {
		if (!modal?.source) return;
		setSaving(true);

		try {
			const res = await fetch(`/api/admin/sources/${modal.source.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Ошибка удаления");

			setModal(null);
			loadSources();
		} catch (err) {
			setError("Не удалось удалить источник");
			console.error(err);
		} finally {
			setSaving(false);
		}
	}

	// ─── Open edit modal ──────────────────────────────────────────

	function openEdit(source: Source) {
		setForm({
			name: source.name,
			type: source.type,
			storeId: source.storeId || "",
			config: JSON.stringify(source.config, null, 2),
		});
		setTestResult(null);
		setModal({ mode: "edit", source });
	}

	function openAdd() {
		setForm({ name: "", type: "cpa_feed", storeId: "", config: "" });
		setTestResult(null);
		setModal({ mode: "add" });
	}

	// ─── Render ───────────────────────────────────────────────────

	return (
		<div>
			{/* Page header */}
			<div className="admin-page-header">
				<h1>🔌 API-подключения ({pagination?.total ?? "..."})</h1>
				<button className="admin-add-btn" onClick={openAdd}>
					+ Новый источник
				</button>
			</div>

			{/* Filters */}
			<div className="admin-filters">
				<select
					value={typeFilter}
					onChange={(e) => setFilter("type", e.target.value)}
				>
					<option value="">Все типы</option>
					{SOURCE_TYPES.map((t) => (
						<option key={t.value} value={t.value}>
							{t.label}
						</option>
					))}
				</select>

				{typeFilter && (
					<button
						className="admin-filter-btn"
						onClick={() => router.push("/admin/sources")}
					>
						✕ Сбросить
					</button>
				)}
			</div>

			{/* Error */}
			{error && <div className="admin-alert admin-alert-error">{error}</div>}

			{/* Loading / Empty */}
			{loading ? (
				<div className="admin-table-wrap">
					<div className="admin-empty"><p>Загрузка источников...</p></div>
				</div>
			) : sources.length === 0 ? (
				<div className="admin-table-wrap">
					<div className="admin-empty">
						<p>🔌 Нет API-подключений</p>
						<button className="admin-add-btn" onClick={openAdd}>
							+ Добавить источник
						</button>
					</div>
				</div>
			) : (
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Название</th>
								<th>Тип</th>
								<th>Магазин</th>
								<th>Статус</th>
								<th>Последняя синхр.</th>
								<th>Дата создания</th>
								<th>Действия</th>
							</tr>
						</thead>
						<tbody>
							{sources.map((source) => (
								<tr key={source.id}>
									<td className="font-medium text-gray-900">{source.name}</td>
									<td>
										<span className="text-sm text-gray-600">
											{TYPE_LABELS[source.type] || source.type}
										</span>
									</td>
									<td>
										{source.store ? (
											<span className="text-sm text-gray-600">
												{source.store.name}
											</span>
										) : (
											<span className="text-sm text-gray-400">—</span>
										)}
									</td>
									<td>
										<span
											className={`admin-status ${source.isActive ? "admin-status-active" : "admin-status-paused"}`}
										>
											{source.isActive ? "Активен" : "Отключён"}
										</span>
									</td>
									<td className="text-sm text-gray-600">
										{formatDate(source.lastSyncAt)}
									</td>
									<td className="text-sm text-gray-500">
										{formatDate(source.createdAt)}
									</td>
									<td>
										<div className="admin-actions">
											<button
												className="admin-action-btn"
												onClick={() => openEdit(source)}
												title="Редактировать"
											>
												✏️
											</button>
											<button
												className="admin-action-btn"
												onClick={() => {
													setForm({
														name: source.name,
														type: source.type,
														storeId: source.storeId || "",
														config: JSON.stringify(source.config, null, 2),
													});
													setTestResult(null);
													setModal({ mode: "test", source });
												}}
												title="Проверить подключение"
											>
												🧪
											</button>
											<button
												className="admin-action-btn admin-action-btn-delete"
												onClick={() => setModal({ mode: "delete", source })}
												title="Удалить"
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
								.filter(
									(p) =>
										p === 1 ||
										p === pagination.totalPages ||
										Math.abs(p - pagination.page) <= 2
								)
								.map((p, idx, arr) => (
									<span key={p}>
										{idx > 0 && arr[idx - 1] !== p - 1 && (
											<span className="text-gray-400 px-1">...</span>
										)}
										<button
											className={p === pagination.page ? "admin-page-active" : ""}
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
			)}

			{/* ─── Add/Edit Modal ─────────────────────────────────── */}
			{(modal?.mode === "add" || modal?.mode === "edit") && (
				<div className="admin-overlay" onClick={() => setModal(null)}>
					<div
						className="admin-modal"
						style={{ maxWidth: "600px" }}
						onClick={(e) => e.stopPropagation()}
					>
						<h3>
							{modal.mode === "add" ? "➕ Новый источник" : "✏️ Редактировать источник"}
						</h3>

						<div className="admin-form">
							<label className="admin-form-label">
								Название
								<input
									type="text"
									className="admin-form-input"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									placeholder="Например: CPA Shopee"
								/>
							</label>

							<label className="admin-form-label">
								Тип источника
								<select
									className="admin-form-input"
									value={form.type}
									onChange={(e) => setForm({ ...form, type: e.target.value })}
								>
									{SOURCE_TYPES.map((t) => (
										<option key={t.value} value={t.value}>
											{t.label}
										</option>
									))}
								</select>
							</label>

							<label className="admin-form-label">
								Магазин (необязательно)
								<select
									className="admin-form-input"
									value={form.storeId}
									onChange={(e) => setForm({ ...form, storeId: e.target.value })}
								>
									<option value="">— Без магазина —</option>
									{stores.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
							</label>

							<label className="admin-form-label">
								Конфигурация (JSON)
								<textarea
									className="admin-form-textarea"
									rows={6}
									value={form.config}
									onChange={(e) => setForm({ ...form, config: e.target.value })}
									placeholder='{"url": "https://api.cpa-network.com/feed", "api_key": "..."}'
								/>
							</label>

							<div className="admin-form-actions">
								<button
									className="admin-btn-secondary"
									onClick={() => setModal(null)}
								>
									Отмена
								</button>
								<button
									className="admin-btn-secondary"
									onClick={handleTest}
									disabled={testing}
								>
									{testing ? "⏳ Проверка..." : "🧪 Проверить"}
								</button>
								<button
									className="admin-btn-primary"
									onClick={handleSave}
									disabled={saving || !form.name.trim()}
								>
									{saving ? "⏳ Сохранение..." : "💾 Сохранить"}
								</button>
							</div>

							{testResult && (
								<div
									className={`admin-alert ${
										testResult.startsWith("✅") || testResult.startsWith("⚠️")
											? "admin-alert-success"
											: "admin-alert-error"
									}`}
								>
									<pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ─── Test Modal ──────────────────────────────────────── */}
			{modal?.mode === "test" && modal.source && (
				<div className="admin-overlay" onClick={() => setModal(null)}>
					<div
						className="admin-modal"
						style={{ maxWidth: "500px" }}
						onClick={(e) => e.stopPropagation()}
					>
						<h3>🧪 Проверка подключения: {modal.source.name}</h3>

						<div className="admin-form">
							<div className="text-sm text-gray-600 mb-4">
								<strong>Тип:</strong> {TYPE_LABELS[modal.source.type] || modal.source.type}
								<br />
								<strong>Магазин:</strong> {modal.source.store?.name || "—"}
								<br />
								<strong>Активен:</strong> {modal.source.isActive ? "✅ Да" : "❌ Нет"}
								<br />
								<strong>Последняя синхр.:</strong> {formatDate(modal.source.lastSyncAt)}
							</div>

							{!!modal.source.config && !!((modal.source.config as Record<string, unknown>).url) && (
								<button
									className="admin-btn-primary"
									onClick={async () => {
										setTesting(true);
										setTestResult(null);
										try {
											const url = (modal.source!.config as Record<string, unknown>).url as string;
											const testRes = await fetch(url, {
												signal: AbortSignal.timeout(10000),
											});
											if (testRes.ok) {
												const text = await testRes.text();
												setTestResult(
													`✅ URL доступен (HTTP ${testRes.status})\n\nПервые 200 символов:\n${text.slice(0, 200)}`
												);
											} else {
												setTestResult(`❌ HTTP ${testRes.status}`);
											}
										} catch (e) {
											setTestResult(
												`❌ Ошибка: ${e instanceof Error ? e.message : "неизвестная"}`
											);
										}
										setTesting(false);
									}}
									disabled={testing}
								>
									{testing ? "⏳ Проверка..." : "🔗 Проверить URL"}
								</button>
							)}

							{testResult && (
								<div
									className={`admin-alert ${
										testResult.startsWith("✅")
											? "admin-alert-success"
											: "admin-alert-error"
									}`}
								>
									<pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
								</div>
							)}

							<div className="admin-form-actions">
								<button
									className="admin-btn-secondary"
									onClick={() => setModal(null)}
								>
									Закрыть
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ─── Delete Confirm ──────────────────────────────────── */}
			{modal?.mode === "delete" && modal.source && (
				<div className="admin-overlay" onClick={() => setModal(null)}>
					<div
						className="admin-confirm"
						onClick={(e) => e.stopPropagation()}
					>
						<h3>🗑️ Удалить источник</h3>
						<p>
							Удалить источник «<strong>{modal.source.name}</strong>»? Данные
							купонов, полученные из этого источника, останутся.
						</p>
						<div className="admin-confirm-actions">
							<button
								className="admin-btn-secondary"
								onClick={() => setModal(null)}
								disabled={saving}
							>
								Отмена
							</button>
							<button
								className="admin-btn-primary"
								style={{ background: "#ef4444" }}
								onClick={handleDelete}
								disabled={saving}
							>
								{saving ? "Удаление..." : "Удалить"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}