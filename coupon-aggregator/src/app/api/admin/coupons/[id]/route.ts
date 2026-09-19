import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ─── GET: один купон ───────────────────────────────────────────────

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	try {
		const coupon = await prisma.coupon.findUnique({
			where: { id: BigInt(id) },
			include: { store: true },
		});

		if (!coupon) {
			return NextResponse.json({ error: "Купон не найден" }, { status: 404 });
		}

		return NextResponse.json({
			...coupon,
			id: coupon.id.toString(),
			storeId: coupon.storeId.toString(),
			minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
			clickCount: coupon.clickCount.toString(),
			store: {
				...coupon.store,
				id: coupon.store.id.toString(),
			},
		});
	} catch (error) {
		console.error("GET /api/admin/coupons/[id] error:", error);
		return NextResponse.json({ error: "Ошибка при получении купона" }, { status: 500 });
	}
}

// ─── PUT: обновить купон ────────────────────────────────────────────

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const couponId = BigInt(id);

	try {
		const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
		if (!existing) {
			return NextResponse.json({ error: "Купон не найден" }, { status: 404 });
		}

		const body = await request.json();
		const data: Prisma.CouponUpdateInput = {};

		// Only update provided fields
		const fields = [
			"title", "description", "code", "promoUrl",
			"discountType", "discountValue", "conditions",
			"startsAt", "expiresAt", "isVerified",
			"sortOrder", "status", "priority", "dataSource", "sourceUrl",
		] as const;

		const dateFields = new Set(["startsAt", "expiresAt", "verifiedAt"]);

		for (const field of fields) {
			if (body[field] !== undefined) {
				if (dateFields.has(field)) {
					(data as Record<string, unknown>)[field] = body[field] ? new Date(body[field]) : null;
				} else {
					(data as Record<string, unknown>)[field] = body[field];
				}
			}
		}

		if (body.storeId !== undefined) {
			data.store = { connect: { id: BigInt(body.storeId) } };
		}

		if (body.minOrderAmount !== undefined) {
			data.minOrderAmount = body.minOrderAmount
				? new Prisma.Decimal(body.minOrderAmount)
				: null;
		}

		if (body.meta !== undefined) {
			data.meta = body.meta;
		}

		const coupon = await prisma.coupon.update({
			where: { id: couponId },
			data,
			include: { store: { select: { id: true, name: true, slug: true } } },
		});

		return NextResponse.json({
			...coupon,
			id: coupon.id.toString(),
			storeId: coupon.storeId.toString(),
			minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
			clickCount: coupon.clickCount.toString(),
			store: { ...coupon.store, id: coupon.store.id.toString() },
		});
	} catch (error) {
		console.error("PUT /api/admin/coupons/[id] error:", error);
		return NextResponse.json({ error: "Ошибка при обновлении купона" }, { status: 500 });
	}
}

// ─── DELETE: удалить купон ──────────────────────────────────────────

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	try {
		const existing = await prisma.coupon.findUnique({ where: { id: BigInt(id) } });
		if (!existing) {
			return NextResponse.json({ error: "Купон не найден" }, { status: 404 });
		}

		// Delete related clicks first
		await prisma.click.deleteMany({ where: { couponId: existing.id } });

		await prisma.coupon.delete({ where: { id: existing.id } });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("DELETE /api/admin/coupons/[id] error:", error);
		return NextResponse.json({ error: "Ошибка при удалении купона" }, { status: 500 });
	}
}