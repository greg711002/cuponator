import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ─── GET: список купонов с фильтрацией ──────────────────────────────

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
	const skip = (page - 1) * limit;

	const storeId = searchParams.get("storeId");
	const status = searchParams.get("status");
	const discountType = searchParams.get("discountType");
	const search = searchParams.get("search");
	const sortField = searchParams.get("sortField") || "createdAt";
	const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

	// Build where clause
	const where: Prisma.CouponWhereInput = {};

	if (storeId) {
		where.storeId = BigInt(storeId);
	}
	if (status && Object.values(Prisma.CouponStatus).includes(status as Prisma.CouponStatus)) {
		where.status = status as Prisma.CouponStatus;
	}
	if (discountType && Object.values(Prisma.DiscountType).includes(discountType as Prisma.DiscountType)) {
		where.discountType = discountType as Prisma.DiscountType;
	}
	if (search) {
		where.OR = [
			{ title: { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
			{ code: { contains: search, mode: "insensitive" } },
		];
	}

	// Allowed sort fields
	const allowedSortFields = ["createdAt", "updatedAt", "title", "sortOrder", "priority", "clickCount", "expiresAt"];
	const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";

	try {
		const [coupons, total] = await Promise.all([
			prisma.coupon.findMany({
				where,
				orderBy: { [orderField]: sortOrder },
				skip,
				take: limit,
				include: { store: { select: { id: true, name: true, slug: true } } },
			}),
			prisma.coupon.count({ where }),
		]);

		// Convert BigInt to string for JSON serialization
		const serialized = coupons.map((c) => ({
			...c,
			id: c.id.toString(),
			storeId: c.storeId.toString(),
			minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
			clickCount: c.clickCount.toString(),
			store: {
				...c.store,
				id: c.store.id.toString(),
			},
		}));

		return NextResponse.json({
			coupons: serialized,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("GET /api/admin/coupons error:", error);
		return NextResponse.json({ error: "Ошибка при получении списка купонов" }, { status: 500 });
	}
}

// ─── POST: создать купон ────────────────────────────────────────────

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Basic validation
		if (!body.title || !body.storeId || !body.discountType || !body.discountValue) {
			return NextResponse.json(
				{ error: "Обязательные поля: title, storeId, discountType, discountValue" },
				{ status: 400 },
			);
		}

		const storeId = BigInt(body.storeId);

		// Verify store exists
		const store = await prisma.store.findUnique({ where: { id: storeId } });
		if (!store) {
			return NextResponse.json({ error: "Магазин не найден" }, { status: 404 });
		}

		const coupon = await prisma.coupon.create({
			data: {
				storeId,
				title: body.title,
				description: body.description || null,
				code: body.code || null,
				promoUrl: body.promoUrl || null,
				discountType: body.discountType,
				discountValue: body.discountValue,
				conditions: body.conditions || null,
				minOrderAmount: body.minOrderAmount ? new Prisma.Decimal(body.minOrderAmount) : null,
				startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
				expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
				isVerified: body.isVerified ?? false,
				sortOrder: body.sortOrder ?? 500,
				status: body.status || "active",
				priority: body.priority ?? 5,
				dataSource: body.dataSource || "manual",
				meta: body.meta || {},
			},
			include: { store: { select: { id: true, name: true, slug: true } } },
		});

		return NextResponse.json(
			{
				...coupon,
				id: coupon.id.toString(),
				storeId: coupon.storeId.toString(),
				minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
				clickCount: coupon.clickCount.toString(),
				store: { ...coupon.store, id: coupon.store.id.toString() },
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("POST /api/admin/coupons error:", error);
		return NextResponse.json({ error: "Ошибка при создании купона" }, { status: 500 });
	}
}