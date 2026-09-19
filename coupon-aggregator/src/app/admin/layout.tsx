import Link from "next/link";
import "./admin.css";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="admin-layout">
			{/* Sidebar */}
			<aside className="admin-sidebar">
				<div className="admin-sidebar-header">
					<Link href="/admin/coupons" className="admin-logo">
						⚙️ Админка
					</Link>
				</div>
				<nav className="admin-nav">
					<Link
						href="/admin/coupons"
						className="admin-nav-link admin-nav-active"
					>
						🏷️ Купоны
					</Link>
					<Link href="/" className="admin-nav-link" target="_blank">
						🌐 На сайт
					</Link>
				</nav>
				<div className="admin-sidebar-footer">
					<Link href="/" className="admin-back-link">
						← Вернуться на сайт
					</Link>
				</div>
			</aside>

			{/* Main content */}
			<main className="admin-main">{children}</main>
		</div>
	);
}
