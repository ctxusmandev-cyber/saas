import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const CATEGORIES = [
  { name: "Burgers",   slug: "burgers",  sortOrder: 1 },
  { name: "Pizza",     slug: "pizza",    sortOrder: 2 },
  { name: "Deals",     slug: "deals",    sortOrder: 3 },
  { name: "Sides",     slug: "sides",    sortOrder: 4 },
  { name: "Drinks",    slug: "drinks",   sortOrder: 5 },
];

const ITEMS: Record<string, { name: string; description: string; price: number; imageUrl: string; featured?: boolean; prepTimeMinutes?: number }[]> = {
  Burgers: [
    {
      name: "Classic Beef Burger",
      description: "Juicy 150g beef patty, iceberg lettuce, vine tomato, cheddar cheese and our signature sauce in a toasted sesame bun.",
      price: 450,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      featured: true,
      prepTimeMinutes: 12,
    },
    {
      name: "Zinger Crispy Chicken",
      description: "Double-crunch fried chicken fillet, house coleslaw and smoky zinger mayo stacked in a brioche bun.",
      price: 550,
      imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80",
      featured: true,
      prepTimeMinutes: 14,
    },
    {
      name: "Double Smash Burger",
      description: "Two smash-style beef patties with caramelised onions, pickles, mustard and American cheese.",
      price: 750,
      imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
      featured: false,
      prepTimeMinutes: 15,
    },
    {
      name: "BBQ Smoky Burger",
      description: "Grilled beef patty glazed with smoky BBQ sauce, crispy jalapeño strips and beer-battered onion rings.",
      price: 650,
      imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80",
      prepTimeMinutes: 13,
    },
    {
      name: "Mushroom Swiss Burger",
      description: "Beef patty topped with pan-sautéed mushrooms, melted Swiss cheese and roasted garlic aioli.",
      price: 700,
      imageUrl: "https://images.unsplash.com/photo-1589927986089-35812378533a?w=600&q=80",
      prepTimeMinutes: 14,
    },
  ],
  Pizza: [
    {
      name: "Margherita Classic",
      description: "San Marzano tomato base, fresh fior di latte mozzarella, basil and extra-virgin olive oil. Large 12\".",
      price: 900,
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
      featured: true,
      prepTimeMinutes: 18,
    },
    {
      name: "BBQ Chicken Pizza",
      description: "Smoky BBQ sauce base, chargrilled chicken strips, red onion, mixed peppers and mozzarella. Large 12\".",
      price: 1100,
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
      featured: true,
      prepTimeMinutes: 20,
    },
    {
      name: "Pepperoni Feast",
      description: "Double layer of premium pepperoni on a rich tomato base with stretchy mozzarella. Large 12\".",
      price: 1050,
      imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
      prepTimeMinutes: 18,
    },
    {
      name: "Veggie Supreme",
      description: "Mushrooms, capsicum, black olives, red onion and sun-dried tomatoes on herbed tomato sauce. Medium 9\".",
      price: 750,
      imageUrl: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80",
      prepTimeMinutes: 16,
    },
    {
      name: "Chicken Tikka Pizza",
      description: "Spiced chicken tikka, green chutney base, caramelised red onion and mozzarella. Large 12\".",
      price: 1150,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80",
      featured: false,
      prepTimeMinutes: 22,
    },
  ],
  Deals: [
    {
      name: "Burger + Drink Combo",
      description: "Any classic burger paired with a chilled regular soft drink. Save Rs 80.",
      price: 599,
      imageUrl: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80",
      featured: true,
      prepTimeMinutes: 14,
    },
    {
      name: "Family Pizza Deal",
      description: "2 Large Pizzas (any flavour) + 1.5L soft drink. Perfect for 4-6 people.",
      price: 1999,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
      featured: true,
      prepTimeMinutes: 25,
    },
    {
      name: "Party Platter",
      description: "4 Classic Burgers + 4 Regular Fries + 4 Soft Drinks. Ideal for group hangouts.",
      price: 2499,
      imageUrl: "https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?w=600&q=80",
      prepTimeMinutes: 30,
    },
    {
      name: "Student Deal",
      description: "Zinger Crispy Chicken + Regular Fries + Regular Drink. Value combo at a student-friendly price.",
      price: 699,
      imageUrl: "https://images.unsplash.com/photo-1598182198871-d3f4ab4fd181?w=600&q=80",
      prepTimeMinutes: 16,
    },
  ],
  Sides: [
    {
      name: "Classic Fries",
      description: "Golden crispy fries seasoned with premium sea salt. Perfectly crunchy every time.",
      price: 200,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
      prepTimeMinutes: 8,
    },
    {
      name: "Loaded Cheese Fries",
      description: "Crispy fries smothered in warm cheddar cheese sauce with pickled jalapeños and chives.",
      price: 320,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&q=80",
      featured: true,
      prepTimeMinutes: 10,
    },
    {
      name: "Onion Rings",
      description: "Beer-battered golden onion rings served with chipotle dipping sauce.",
      price: 280,
      imageUrl: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80",
      prepTimeMinutes: 9,
    },
    {
      name: "Coleslaw",
      description: "Creamy house-made coleslaw with a hint of apple cider vinegar and fresh dill.",
      price: 120,
      imageUrl: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=80",
      prepTimeMinutes: 3,
    },
    {
      name: "Garlic Bread",
      description: "Toasted ciabatta slices with herbed garlic butter and a sprinkle of parmesan. 4 pieces.",
      price: 160,
      imageUrl: "https://images.unsplash.com/photo-1619531040576-f9416740661d?w=600&q=80",
      prepTimeMinutes: 7,
    },
  ],
  Drinks: [
    {
      name: "Soft Drink (Can)",
      description: "Pepsi, 7UP or Mirinda — choose your favourite chilled can (330ml).",
      price: 80,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
      prepTimeMinutes: 1,
    },
    {
      name: "Fresh Lemon Soda",
      description: "House-made lemon soda with fresh mint, a pinch of chat masala and crushed ice.",
      price: 150,
      imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80",
      prepTimeMinutes: 4,
    },
    {
      name: "Mango Smoothie",
      description: "Real Sindhri mango blended with yoghurt, honey and a pinch of cardamom.",
      price: 250,
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a90a3abe?w=600&q=80",
      featured: true,
      prepTimeMinutes: 5,
    },
    {
      name: "Mineral Water",
      description: "Chilled 500ml mineral water bottle.",
      price: 60,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
      prepTimeMinutes: 1,
    },
    {
      name: "Chocolate Milkshake",
      description: "Thick and indulgent chocolate milkshake made with premium ice cream and Belgian cocoa.",
      price: 300,
      imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80",
      featured: true,
      prepTimeMinutes: 6,
    },
  ],
};

const RIDERS = [
  { name: "Ahmed Raza",    phone: "0300-1234567", active: true },
  { name: "Bilal Khan",    phone: "0311-9876543", active: true },
  { name: "Usman Ali",     phone: "0333-4561234", active: true },
  { name: "Hamza Sheikh",  phone: "0321-7654321", active: false },
];

function daysAgo(n: number, offsetHours = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(offsetHours, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function seed() {
  console.log("🌱 Starting DEMO seed for Terra restaurant...\n");

  const [restaurant] = await db
    .select()
    .from(schema.restaurantsTable)
    .where(eq(schema.restaurantsTable.slug, "terra"))
    .limit(1);

  if (!restaurant) {
    console.error("❌ Restaurant 'terra' not found. Run the server first.");
    process.exit(1);
  }

  console.log(`✅ Found restaurant: ${restaurant.name} (ID: ${restaurant.id})\n`);

  // ── 1. Update restaurant profile ─────────────────────────────────────────
  await db
    .update(schema.restaurantsTable)
    .set({
      name: "Terra",
      description: "Authentic flavors from the heart of the earth — premium burgers, stone-baked pizzas and more, delivered fresh to your door.",
      phone: "+92-42-3500-0000",
      address: "12-B, MM Alam Road, Gulberg III, Lahore, Pakistan",
      themeColor: "#c2410c",
      heroTitle: "Nourish Your Body. Delight Your Soul.",
      heroSubtitle: "Authentic flavors from the heart of the earth",
      heroImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80",
      jazzCashNumber: "0300-1234567",
      easyPaisaNumber: "0311-9876543",
    })
    .where(eq(schema.restaurantsTable.id, restaurant.id));

  console.log("✅ Restaurant profile updated\n");

  // ── 2. Clear existing data ────────────────────────────────────────────────
  const existingCats = await db
    .select()
    .from(schema.categoriesTable)
    .where(eq(schema.categoriesTable.restaurantId, restaurant.id));

  if (existingCats.length > 0) {
    console.log(`⚠️  Clearing ${existingCats.length} existing categories (and related data)…`);
    // Delete orders first (FK constraints)
    const existingOrders = await db
      .select()
      .from(schema.ordersTable)
      .where(eq(schema.ordersTable.restaurantId, restaurant.id));
    for (const order of existingOrders) {
      await db.delete(schema.orderItemsTable).where(eq(schema.orderItemsTable.orderId, order.id));
    }
    await db.delete(schema.ordersTable).where(eq(schema.ordersTable.restaurantId, restaurant.id));
    await db.delete(schema.menuItemsTable).where(eq(schema.menuItemsTable.restaurantId, restaurant.id));
    for (const cat of existingCats) {
      await db.delete(schema.categoriesTable).where(eq(schema.categoriesTable.id, cat.id));
    }
    await db.delete(schema.ridersTable).where(eq(schema.ridersTable.restaurantId, restaurant.id));
    console.log("   ✓ Cleared\n");
  }

  // ── 3. Seed categories + menu items ──────────────────────────────────────
  const categoryMap: Record<string, number> = {};
  const itemMap: Record<string, number> = {};

  for (const cat of CATEGORIES) {
    const [inserted] = await db
      .insert(schema.categoriesTable)
      .values({ name: cat.name, slug: cat.slug, restaurantId: restaurant.id })
      .returning();

    categoryMap[cat.name] = inserted.id;
    console.log(`📁 Category: ${inserted.name}`);

    const items = ITEMS[cat.name] ?? [];
    for (const item of items) {
      const [mi] = await db
        .insert(schema.menuItemsTable)
        .values({
          name: item.name,
          description: item.description,
          price: String(item.price),
          imageUrl: item.imageUrl,
          available: true,
          featured: item.featured ?? false,
          prepTimeMinutes: item.prepTimeMinutes ?? 15,
          categoryId: inserted.id,
          restaurantId: restaurant.id,
        })
        .returning();
      itemMap[item.name] = mi.id;
      console.log(`   ✓ ${item.name} — Rs ${item.price}`);
    }
    console.log();
  }

  // ── 4. Seed riders ────────────────────────────────────────────────────────
  const riderIds: number[] = [];
  for (const r of RIDERS) {
    const [rider] = await db
      .insert(schema.ridersTable)
      .values({ ...r, restaurantId: restaurant.id })
      .returning();
    riderIds.push(rider.id);
    console.log(`🛵 Rider: ${rider.name} (${rider.phone})`);
  }
  console.log();

  // ── 5. Seed demo orders ───────────────────────────────────────────────────
  const ORDERS: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
    paymentMethod: "cash_on_delivery" | "jazz_cash" | "easy_paisa";
    paymentStatus: "not_required" | "pending" | "confirmed";
    notes?: string;
    riderId?: number;
    createdAt: Date;
    items: { name: string; quantity: number }[];
  }[] = [
    // ── Today — active orders ──────────────────────────────────────────────
    {
      customerName: "Sara Malik",
      customerPhone: "0301-1122334",
      customerAddress: "House 5, Street 12, DHA Phase 4, Lahore",
      status: "pending",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      createdAt: daysAgo(0, 19),
      items: [
        { name: "Double Smash Burger", quantity: 2 },
        { name: "Loaded Cheese Fries", quantity: 2 },
        { name: "Chocolate Milkshake", quantity: 2 },
      ],
    },
    {
      customerName: "Fahad Mirza",
      customerPhone: "0312-5544332",
      customerAddress: "Flat 7B, Johar Town, Lahore",
      status: "confirmed",
      paymentMethod: "jazz_cash",
      paymentStatus: "confirmed",
      notes: "Please ring bell twice",
      createdAt: daysAgo(0, 18),
      items: [
        { name: "Family Pizza Deal", quantity: 1 },
        { name: "Garlic Bread", quantity: 1 },
      ],
    },
    {
      customerName: "Zainab Qureshi",
      customerPhone: "0333-9988776",
      customerAddress: "Plot 22, Bahria Town Phase 7, Rawalpindi",
      status: "preparing",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      createdAt: daysAgo(0, 17),
      items: [
        { name: "Zinger Crispy Chicken", quantity: 1 },
        { name: "Student Deal", quantity: 1 },
        { name: "Mango Smoothie", quantity: 2 },
      ],
    },
    {
      customerName: "Omar Farooq",
      customerPhone: "0345-6677889",
      customerAddress: "Model Town, Ext Block C, Lahore",
      status: "ready",
      paymentMethod: "easy_paisa",
      paymentStatus: "confirmed",
      riderId: riderIds[0],
      createdAt: daysAgo(0, 16),
      items: [
        { name: "BBQ Chicken Pizza", quantity: 1 },
        { name: "Classic Fries", quantity: 2 },
        { name: "Soft Drink (Can)", quantity: 2 },
      ],
    },
    // ── Yesterday ─────────────────────────────────────────────────────────
    {
      customerName: "Ayesha Khan",
      customerPhone: "0300-2233445",
      customerAddress: "Street 4, F-7/2, Islamabad",
      status: "delivered",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      riderId: riderIds[1],
      createdAt: daysAgo(1, 20),
      items: [
        { name: "Burger + Drink Combo", quantity: 3 },
        { name: "Onion Rings", quantity: 2 },
      ],
    },
    {
      customerName: "Hassan Siddiqui",
      customerPhone: "0321-4455667",
      customerAddress: "Gulshan-e-Iqbal, Block 13, Karachi",
      status: "delivered",
      paymentMethod: "jazz_cash",
      paymentStatus: "confirmed",
      riderId: riderIds[0],
      createdAt: daysAgo(1, 18),
      items: [
        { name: "Margherita Classic", quantity: 1 },
        { name: "Pepperoni Feast", quantity: 1 },
        { name: "Chocolate Milkshake", quantity: 2 },
        { name: "Garlic Bread", quantity: 1 },
      ],
    },
    {
      customerName: "Nimra Baig",
      customerPhone: "0333-1122334",
      customerAddress: "Blue Area, G-7, Islamabad",
      status: "cancelled",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      notes: "Customer unreachable",
      createdAt: daysAgo(1, 14),
      items: [
        { name: "Classic Beef Burger", quantity: 2 },
        { name: "Classic Fries", quantity: 2 },
      ],
    },
    // ── 2 days ago ────────────────────────────────────────────────────────
    {
      customerName: "Ali Raza",
      customerPhone: "0311-3344556",
      customerAddress: "Cavalry Ground, Lahore Cantt",
      status: "delivered",
      paymentMethod: "easy_paisa",
      paymentStatus: "confirmed",
      riderId: riderIds[2],
      createdAt: daysAgo(2, 21),
      items: [
        { name: "Party Platter", quantity: 1 },
        { name: "Fresh Lemon Soda", quantity: 4 },
      ],
    },
    {
      customerName: "Hira Noor",
      customerPhone: "0301-9988776",
      customerAddress: "Wapda Town, Phase 1, Lahore",
      status: "delivered",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      riderId: riderIds[1],
      createdAt: daysAgo(2, 19),
      items: [
        { name: "Chicken Tikka Pizza", quantity: 1 },
        { name: "Coleslaw", quantity: 2 },
        { name: "Soft Drink (Can)", quantity: 2 },
      ],
    },
    {
      customerName: "Bilal Ahmed",
      customerPhone: "0345-8899001",
      customerAddress: "Samanabad, Lahore",
      status: "delivered",
      paymentMethod: "jazz_cash",
      paymentStatus: "confirmed",
      riderId: riderIds[0],
      createdAt: daysAgo(2, 17),
      items: [
        { name: "Double Smash Burger", quantity: 1 },
        { name: "Mushroom Swiss Burger", quantity: 1 },
        { name: "Loaded Cheese Fries", quantity: 2 },
        { name: "Mineral Water", quantity: 2 },
      ],
    },
    // ── 3 days ago ────────────────────────────────────────────────────────
    {
      customerName: "Sana Javed",
      customerPhone: "0312-6677889",
      customerAddress: "Garden Town, Lahore",
      status: "delivered",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      riderId: riderIds[2],
      createdAt: daysAgo(3, 20),
      items: [
        { name: "BBQ Smoky Burger", quantity: 2 },
        { name: "Student Deal", quantity: 1 },
        { name: "Mango Smoothie", quantity: 3 },
      ],
    },
    {
      customerName: "Umar Sheikh",
      customerPhone: "0321-5566778",
      customerAddress: "Askari 10, Lahore Cantt",
      status: "delivered",
      paymentMethod: "easy_paisa",
      paymentStatus: "confirmed",
      riderId: riderIds[1],
      createdAt: daysAgo(3, 18),
      items: [
        { name: "Family Pizza Deal", quantity: 1 },
        { name: "Onion Rings", quantity: 2 },
        { name: "Garlic Bread", quantity: 1 },
      ],
    },
    {
      customerName: "Maryam Tahir",
      customerPhone: "0300-4455667",
      customerAddress: "Iqbal Town, Lahore",
      status: "cancelled",
      paymentMethod: "jazz_cash",
      paymentStatus: "pending",
      notes: "Duplicate order — customer cancelled",
      createdAt: daysAgo(3, 15),
      items: [
        { name: "Zinger Crispy Chicken", quantity: 2 },
        { name: "Classic Fries", quantity: 2 },
      ],
    },
    // ── 4 days ago ────────────────────────────────────────────────────────
    {
      customerName: "Junaid Alam",
      customerPhone: "0333-7788990",
      customerAddress: "Shadman, Lahore",
      status: "delivered",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      riderId: riderIds[0],
      createdAt: daysAgo(4, 21),
      items: [
        { name: "Classic Beef Burger", quantity: 4 },
        { name: "Loaded Cheese Fries", quantity: 4 },
        { name: "Soft Drink (Can)", quantity: 4 },
      ],
    },
    {
      customerName: "Rabia Chaudhry",
      customerPhone: "0311-2233445",
      customerAddress: "Township, Lahore",
      status: "delivered",
      paymentMethod: "jazz_cash",
      paymentStatus: "confirmed",
      riderId: riderIds[2],
      createdAt: daysAgo(4, 19),
      items: [
        { name: "Veggie Supreme", quantity: 1 },
        { name: "Margherita Classic", quantity: 1 },
        { name: "Fresh Lemon Soda", quantity: 2 },
        { name: "Chocolate Milkshake", quantity: 1 },
      ],
    },
    // ── 5 days ago ────────────────────────────────────────────────────────
    {
      customerName: "Kamran Hussain",
      customerPhone: "0301-6677889",
      customerAddress: "Gulberg II, Lahore",
      status: "delivered",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      riderId: riderIds[1],
      createdAt: daysAgo(5, 20),
      items: [
        { name: "Party Platter", quantity: 1 },
        { name: "Veggie Supreme", quantity: 1 },
        { name: "Mango Smoothie", quantity: 2 },
      ],
    },
    {
      customerName: "Amna Sarfraz",
      customerPhone: "0312-8899001",
      customerAddress: "Johar Town, Lahore",
      status: "delivered",
      paymentMethod: "easy_paisa",
      paymentStatus: "confirmed",
      riderId: riderIds[0],
      createdAt: daysAgo(5, 17),
      items: [
        { name: "BBQ Chicken Pizza", quantity: 2 },
        { name: "Garlic Bread", quantity: 2 },
        { name: "Soft Drink (Can)", quantity: 4 },
      ],
    },
    // ── 6 days ago ────────────────────────────────────────────────────────
    {
      customerName: "Faisal Nawaz",
      customerPhone: "0345-3344556",
      customerAddress: "Allama Iqbal Town, Lahore",
      status: "delivered",
      paymentMethod: "jazz_cash",
      paymentStatus: "confirmed",
      riderId: riderIds[2],
      createdAt: daysAgo(6, 21),
      items: [
        { name: "Burger + Drink Combo", quantity: 4 },
        { name: "Onion Rings", quantity: 3 },
        { name: "Coleslaw", quantity: 2 },
      ],
    },
    {
      customerName: "Nadia Islam",
      customerPhone: "0321-1122334",
      customerAddress: "Gulshan-e-Ravi, Lahore",
      status: "delivered",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "not_required",
      riderId: riderIds[1],
      createdAt: daysAgo(6, 18),
      items: [
        { name: "Chicken Tikka Pizza", quantity: 1 },
        { name: "Pepperoni Feast", quantity: 1 },
        { name: "Classic Fries", quantity: 2 },
        { name: "Mineral Water", quantity: 2 },
      ],
    },
    // ── 7 days ago ────────────────────────────────────────────────────────
    {
      customerName: "Tariq Mehmood",
      customerPhone: "0300-7788990",
      customerAddress: "Cantt, Lahore",
      status: "delivered",
      paymentMethod: "easy_paisa",
      paymentStatus: "confirmed",
      riderId: riderIds[0],
      createdAt: daysAgo(7, 20),
      items: [
        { name: "Double Smash Burger", quantity: 3 },
        { name: "Loaded Cheese Fries", quantity: 3 },
        { name: "Chocolate Milkshake", quantity: 3 },
      ],
    },
  ];

  let orderCount = 0;
  for (const o of ORDERS) {
    // Calculate total
    let total = 0;
    const resolvedItems: { menuItemId: number; name: string; quantity: number; unitPrice: number }[] = [];
    for (const oi of o.items) {
      const miId = itemMap[oi.name];
      if (!miId) {
        console.warn(`   ⚠️ Item not found: ${oi.name}`);
        continue;
      }
      // Look up price from ITEMS
      const price = Object.values(ITEMS)
        .flat()
        .find((i) => i.name === oi.name)?.price ?? 0;
      total += price * oi.quantity;
      resolvedItems.push({ menuItemId: miId, name: oi.name, quantity: oi.quantity, unitPrice: price });
    }

    const [order] = await db
      .insert(schema.ordersTable)
      .values({
        restaurantId: restaurant.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        status: o.status,
        total: String(total),
        notes: o.notes,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        riderId: o.riderId ?? null,
        createdAt: o.createdAt,
      })
      .returning();

    for (const oi of resolvedItems) {
      await db.insert(schema.orderItemsTable).values({
        orderId: order.id,
        menuItemId: oi.menuItemId,
        name: oi.name,
        quantity: oi.quantity,
        unitPrice: String(oi.unitPrice),
      });
    }

    orderCount++;
    console.log(`🛒 Order #${order.id}: ${o.customerName} — Rs ${total} [${o.status}]`);
  }

  console.log(`\n✅ Seeded ${orderCount} demo orders\n`);
  console.log("🎉 Terra is now demo-ready!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   Admin URL  : /r/terra/admin/login");
  console.log("   Password   : terra@admin2024");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
