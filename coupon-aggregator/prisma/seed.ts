import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	// Create categories
	const categories = await Promise.all(
		[
			{
				name: "Доставка продуктов",
				slug: "grocery-delivery",
				icon: "🛒",
				sortOrder: 100,
			},
			{
				name: "Доставка готовой еды",
				slug: "food-delivery",
				icon: "🍕",
				sortOrder: 200,
			},
			{ name: "Фастфуд", slug: "fastfood", icon: "🍔", sortOrder: 300 },
			{ name: "Рестораны", slug: "restaurants", icon: "🍽️", sortOrder: 400 },
			{
				name: "Кофе и напитки",
				slug: "coffee-drinks",
				icon: "☕",
				sortOrder: 500,
			},
			{
				name: "Сладости и десерты",
				slug: "sweets",
				icon: "🍰",
				sortOrder: 600,
			},
		].map((cat) => prisma.category.create({ data: cat })),
	);
	console.log(`✅ ${categories.length} categories created`);

	// Create stores
	const groceryDelivery = categories.find(
		(c) => c.slug === "grocery-delivery",
	)!;
	const foodDelivery = categories.find((c) => c.slug === "food-delivery")!;

	const stores = await Promise.all(
		[
			{
				name: "Яндекс Еда",
				slug: "yandex-eda",
				description:
					"Доставка готовой еды из ресторанов и корнеров. Быстро, удобно, большой выбор.",
				websiteUrl: "https://eda.yandex.ru",
				categoryId: foodDelivery.id,
				cpaNetwork: "Яндекс Еда CPA",
				isFeatured: true,
				sortOrder: 100,
			},
			{
				name: "Kuper",
				slug: "kuper",
				description:
					"Доставка продуктов из супермаркетов за 60 минут. Свежие продукты, широкий ассортимент.",
				websiteUrl: "https://kuper.ru",
				categoryId: groceryDelivery.id,
				cpaNetwork: "Kuper CPA",
				isFeatured: true,
				sortOrder: 200,
			},
			{
				name: "ВкусВилл",
				slug: "vkusvill",
				description:
					"Продукты для здорового питания. Свежие овощи, молочка, мясо, готовая еда и десерты.",
				websiteUrl: "https://vkusvill.ru",
				categoryId: groceryDelivery.id,
				cpaNetwork: "ВкусВилл CPA",
				isFeatured: true,
				sortOrder: 300,
			},
			{
				name: "Самокат",
				slug: "samokat",
				description:
					"Доставка продуктов за 30 минут. Всё необходимое для дома по приятным ценам.",
				websiteUrl: "https://samokat.ru",
				categoryId: groceryDelivery.id,
				cpaNetwork: "Самокат CPA",
				isFeatured: true,
				sortOrder: 400,
			},
			{
				name: "Пятёрочка",
				slug: "pyaterochka",
				description:
					"Скидки и акции в самой популярной сети магазинов у дома. Продукты по выгодным ценам.",
				websiteUrl: "https://pyaterochka.ru",
				categoryId: groceryDelivery.id,
				cpaNetwork: "Пятёрочка CPA",
				isFeatured: true,
				sortOrder: 500,
			},
		].map((store) => prisma.store.create({ data: store })),
	);
	console.log(`✅ ${stores.length} stores created`);

	console.log("🎉 Seeding complete!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
