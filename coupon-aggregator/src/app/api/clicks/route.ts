import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const { couponId, referrer } = await request.json();

		if (!couponId) {
			return NextResponse.json(
				{ error: "couponId is required" },
				{ status: 400 },
			);
		}

		const coupon = await prisma.coupon.findUnique({
			where: { id: BigInt(couponId) },
			include: { store: true },
		});

		if (!coupon) {
			return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
		}

		// Generate unique click ID
		const clickId = `click_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

		// Record click
		await prisma.click.create({
			data: {
				couponId: coupon.id,
				clickId,
				referrer: referrer || null,
				ipAddress:
					request.headers.get("x-forwarded-for") ||
					request.headers.get("x-real-ip"),
				userAgent: request.headers.get("user-agent"),
			},
		});

		// Increment click count
		await prisma.coupon.update({
			where: { id: coupon.id },
			data: { clickCount: { increment: 1 } },
		});

		// Build redirect URL
		const promoUrl = coupon.promoUrl || coupon.store.websiteUrl;
		const separator = promoUrl?.includes("?") ? "&" : "?";
		const redirectUrl = `${promoUrl}${separator}subid=${clickId}&utm_source=coupon_aggregator`;

		return NextResponse.json({
			success: true,
			clickId,
			code: coupon.code,
			redirectUrl,
		});
	} catch (error) {
		console.error("Click tracking error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
