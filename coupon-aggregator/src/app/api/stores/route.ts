import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const limit = Math.min(
		200,
		Math.max(1, Number(searchParams.get("limit")) || 100),
	);

	try {
		const stores = await prisma.store.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: "asc" },
			select: { id: true, name: true, slug: true },
			take: limit,
		});

		return NextResponse.json({
			stores: stores.map((s) => ({
				...s,
				id: s.id.toString(),
			})),
		});
	} catch (error) {
		console.error("GET /api/stores error:", error);
		return NextResponse.json(
			{ error: "Ошибка при получении магазинов" },
			{ status: 500 },
		);
	}
}
