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
  { name: "Burgers",     slug: "burgers",  sortOrder: 1 },
  { name: "Pizza",       slug: "pizza",    sortOrder: 2 },
  { name: "Deals",       slug: "deals",    sortOrder: 3 },
  { name: "Sides",       slug: "sides",    sortOrder: 4 },
  { name: "Drinks",      slug: "drinks",   sortOrder: 5 },
];

const ITEMS: Record<string, { name: string; description: string; price: number; available: boolean }[]> = {
  Burgers: [
    { name: "Classic Beef Burger",      description: "Juicy beef patty, lettuce, tomato, cheese and special sauce in a toasted sesame bun.",         price: 450,  available: true },
    { name: "Zinger Crispy Chicken",    description: "Crispy fried chicken fillet with coleslaw and zinger mayo, stacked in a brioche bun.",          price: 550,  available: true },
    { name: "Double Smash Burger",      description: "Two smash-style beef patties with caramelised onions, pickles and American cheese.",             price: 750,  available: true },
    { name: "BBQ Smoky Burger",         description: "Grilled beef patty glazed with smoky BBQ sauce, jalapeños, crispy onion rings.",                 price: 650,  available: true },
    { name: "Mushroom Swiss Burger",    description: "Beef patty topped with sautéed mushrooms, Swiss cheese and garlic aioli.",                       price: 700,  available: true },
  ],
  Pizza: [
    { name: "Margherita Classic",       description: "San Marzano tomato base, fresh mozzarella, basil and extra-virgin olive oil. (Large)",           price: 900,  available: true },
    { name: "BBQ Chicken Pizza",        description: "Smoky BBQ sauce base, grilled chicken strips, red onion, peppers and mozzarella. (Large)",       price: 1100, available: true },
    { name: "Pepperoni Feast",          description: "Double layer of premium pepperoni on a rich tomato base with mozzarella. (Large)",               price: 1050, available: true },
    { name: "Veggie Supreme",           description: "Mushrooms, capsicum, olives, onion and sun-dried tomatoes on herbed tomato sauce. (Medium)",     price: 750,  available: true },
    { name: "Chicken Tikka Pizza",      description: "Spiced chicken tikka, green chutney base, red onion and mozzarella. (Large)",                   price: 1150, available: true },
  ],
  Deals: [
    { name: "Burger + Drink Deal",      description: "Any classic burger paired with a regular soft drink. Great value combo!",                        price: 599,  available: true },
    { name: "Family Pizza Deal",        description: "2 Large Pizzas (any flavour) + 1.5L drink. Perfect for sharing.",                               price: 1999, available: true },
    { name: "Party Platter",            description: "4 Classic Burgers + 4 Fries + 4 Drinks — ideal for group hangouts.",                            price: 2499, available: true },
    { name: "Student Deal",             description: "Zinger burger + fries + drink at a student-friendly price.",                                     price: 699,  available: true },
  ],
  Sides: [
    { name: "Classic Fries",            description: "Golden crispy fries seasoned with sea salt. Perfectly crunchy.",                                 price: 200,  available: true },
    { name: "Loaded Cheese Fries",      description: "Crispy fries smothered in cheddar cheese sauce with jalapeños.",                                price: 320,  available: true },
    { name: "Onion Rings",              description: "Beer-battered onion rings with chipotle dipping sauce.",                                         price: 280,  available: true },
    { name: "Coleslaw",                 description: "Creamy house-made coleslaw with a hint of apple cider vinegar.",                                price: 120,  available: true },
    { name: "Garlic Bread",             description: "Toasted ciabatta with herbed garlic butter. 4 pieces.",                                         price: 160,  available: true },
  ],
  Drinks: [
    { name: "Soft Drink (Can)",         description: "Pepsi, 7UP, or Mirinda — your choice of chilled can.",                                          price: 80,   available: true },
    { name: "Fresh Lemon Soda",         description: "House-made fresh lemon soda with mint and chat masala.",                                        price: 150,  available: true },
    { name: "Mango Smoothie",           description: "Real mango blended with yoghurt and a pinch of cardamom.",                                      price: 250,  available: true },
    { name: "Mineral Water",            description: "500ml chilled mineral water.",                                                                   price: 60,   available: true },
    { name: "Chocolate Milkshake",      description: "Thick chocolate milkshake made with premium ice cream and cocoa.",                              price: 300,  available: true },
  ],
};

async function seed() {
  console.log("🌱 Starting seed for terra restaurant...\n");

  const [restaurant] = await db
    .select()
    .from(schema.restaurantsTable)
    .where(eq(schema.restaurantsTable.slug, "terra"))
    .limit(1);

  if (!restaurant) {
    console.error("❌ Restaurant 'terra' not found. Run the server first to auto-create it.");
    process.exit(1);
  }

  console.log(`✅ Found restaurant: ${restaurant.name} (ID: ${restaurant.id})\n`);

  const existingCategories = await db
    .select()
    .from(schema.categoriesTable)
    .where(eq(schema.categoriesTable.restaurantId, restaurant.id));

  if (existingCategories.length > 0) {
    console.log(`⚠️  Found ${existingCategories.length} existing categories. Skipping category seed to avoid duplicates.`);
    console.log("   Delete existing data first if you want a fresh seed.\n");
    await pool.end();
    return;
  }

  for (const cat of CATEGORIES) {
    const [inserted] = await db
      .insert(schema.categoriesTable)
      .values({ name: cat.name, slug: cat.slug, restaurantId: restaurant.id })
      .returning();

    console.log(`📁 Category: ${inserted.name} (ID: ${inserted.id})`);

    const items = ITEMS[cat.name] ?? [];
    for (const item of items) {
      await db.insert(schema.menuItemsTable).values({
        name: item.name,
        description: item.description,
        price: String(item.price),
        available: item.available,
        categoryId: inserted.id,
        restaurantId: restaurant.id,
      });
      console.log(`   ✓ ${item.name} — Rs ${item.price}`);
    }
    console.log();
  }

  console.log("🎉 Seed complete! Terra restaurant is demo-ready.\n");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
