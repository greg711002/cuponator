import Link from "next/link";

export default function Footer() {
	return (
		<footer className="bg-gray-900 text-gray-300 mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Brand */}
					<div className="md:col-span-2">
						<Link href="/" className="flex items-center gap-2 mb-4">
							<span className="text-2xl">🍽️</span>
							<span className="text-xl font-bold text-white">Купонатор</span>
						</Link>
						<p className="text-sm text-gray-400 max-w-md">
							Все промокоды и скидки на доставку продуктов и еды в одном месте.
							Экономьте на каждом заказе с проверенными купонами.
						</p>
					</div>

					{/* Links */}
					<div>
						<h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
							Сервисы
						</h3>
						<ul className="space-y-2">
							<li>
								<Link
									href="/stores/yandex-eda"
									className="text-sm hover:text-[#ff6b35] transition-colors"
								>
									Яндекс Еда
								</Link>
							</li>
							<li>
								<Link
									href="/stores/kuper"
									className="text-sm hover:text-[#ff6b35] transition-colors"
								>
									Kuper
								</Link>
							</li>
							<li>
								<Link
									href="/stores/vkusvill"
									className="text-sm hover:text-[#ff6b35] transition-colors"
								>
									ВкусВилл
								</Link>
							</li>
							<li>
								<Link
									href="/stores/samokat"
									className="text-sm hover:text-[#ff6b35] transition-colors"
								>
									Самокат
								</Link>
							</li>
							<li>
								<Link
									href="/stores/pyaterochka"
									className="text-sm hover:text-[#ff6b35] transition-colors"
								>
									Пятёрочка
								</Link>
							</li>
						</ul>
					</div>

					{/* Info */}
					<div>
						<h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
							Информация
						</h3>
						<ul className="space-y-2">
							<li>
								<Link
									href="/coupons"
									className="text-sm hover:text-[#ff6b35] transition-colors"
								>
									Все купоны
								</Link>
							</li>
							<li>
								<Link
									href="/stores"
									className="text-sm hover:text-[#ff6b35] transition-colors"
								>
									Все магазины
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-8 pt-8 border-t border-gray-800">
					<p className="text-xs text-gray-500 text-center">
						© {new Date().getFullYear()} Купонатор. Информационный сервис. Все
						товарные знаки принадлежат их правообладателям.
					</p>
				</div>
			</div>
		</footer>
	);
}
