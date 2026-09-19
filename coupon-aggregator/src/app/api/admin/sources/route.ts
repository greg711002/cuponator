import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/sources
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = Math.max(1, Number(searchParams.get("page")) || 1);
		const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
		const typeFilter = searchParams.get("type") || "";

		const where: Record<string, unknown> = {};
		if (typeFilter) where.type = typeFilter;

		const [sources, total] = await Promise.all([
			prisma.source.findMany({
				where,
				include: { store: { select: { id: true, name: true, slug: true } } },
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.source.count({ where }),
		]);

		return NextResponse.json({
			sources: sources.map((s) => ({
				...s,
				id: String(s.id),
				storeId: s.storeId ? String(s.storeId) : null,
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (err) {
		console.error("GET /api/admin/sources error:", err);
		return NextResponse.json({ error: "Ошибка загрузки источников" }, { status: 500 });
	}
}

// POST /api/admin/sources
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, type, storeId, config } = body;

		if (!name || !type) {
			return NextResponse.json(
				{ error: "Название и тип источника обязательны" },
				{ status: 400 }
			);
		}

		const source = await prisma.source.create({
			data: {
				name,
				type,
				storeId: storeId ? BigInt(storeId) : null,
				config: config || {},
				isActive: true,
			},
			include: { store: { select: { id: true, name: true, slug: true } } },
		});

		return NextResponse.json({
			...source,
			id: String(source.id),
			storeId: source.storeId ? String(source.storeId) : null,
		});
	} catch (err) {
		console.error("POST /api/admin/sources error:", err);
		return NextResponse.json({ error: "Ошибка создания источника" }, { status: 500 });
	}
}
