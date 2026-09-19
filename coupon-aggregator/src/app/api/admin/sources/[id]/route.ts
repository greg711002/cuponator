import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getSource(id: string) {
	const source = await prisma.source.findUnique({
		where: { id: BigInt(id) },
		include: { store: { select: { id: true, name: true, slug: true } } },
	});
	return source;
}

// GET /api/admin/sources/[id]
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const source = await getSource(id);
		if (!source) {
			return NextResponse.json(
				{ error: "Источник не найден" },
				{ status: 404 }
			);
		}
		return NextResponse.json({
			...source,
			id: String(source.id),
			storeId: source.storeId ? String(source.storeId) : null,
		});
	} catch (err) {
		console.error("GET /api/admin/sources/[id] error:", err);
		return NextResponse.json({ error: "Ошибка загрузки источника" }, { status: 500 });
	}
}

// PATCH /api/admin/sources/[id]
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { name, type, storeId, config, isActive } = body;

		const existing = await getSource(id);
		if (!existing) {
			return NextResponse.json(
				{ error: "Источник не найден" },
				{ status: 404 }
			);
		}

		const updateData: Record<string, unknown> = {};
		if (name !== undefined) updateData.name = name;
		if (type !== undefined) updateData.type = type;
		if (storeId !== undefined)
			updateData.storeId = storeId ? BigInt(storeId) : null;
		if (config !== undefined) updateData.config = config;
		if (isActive !== undefined) updateData.isActive = isActive;

		const source = await prisma.source.update({
			where: { id: BigInt(id) },
			data: updateData,
			include: { store: { select: { id: true, name: true, slug: true } } },
		});

		return NextResponse.json({
			...source,
			id: String(source.id),
			storeId: source.storeId ? String(source.storeId) : null,
		});
	} catch (err) {
		console.error("PATCH /api/admin/sources/[id] error:", err);
		return NextResponse.json({ error: "Ошибка обновления источника" }, { status: 500 });
	}
}

// DELETE /api/admin/sources/[id]
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const existing = await getSource(id);
		if (!existing) {
			return NextResponse.json(
				{ error: "Источник не найден" },
				{ status: 404 }
			);
		}

		await prisma.source.delete({ where: { id: BigInt(id) } });
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("DELETE /api/admin/sources/[id] error:", err);
		return NextResponse.json({ error: "Ошибка удаления источника" }, { status: 500 });
	}
}
