import { Router, type IRouter } from "express";
import { eq, isNull, or } from "drizzle-orm";
import { db, restaurantsTable, categoriesTable, menuItemsTable, ordersTable } from "@workspace/db";
import { getCommonPassword } from "./settings";

const router: IRouter = Router();

// ─── List all restaurants (super admin) ─────────────────────────────────────

router.get("/restaurants", async (_req, res): Promise<void> => {
  const rows = await db.select().from(restaurantsTable).orderBy(restaurantsTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), adminPassword: undefined })));
});

// ─── Create restaurant ───────────────────────────────────────────────────────

router.post("/restaurants", async (req, res): Promise<void> => {
  const { name, slug, adminPassword, description, phone, address, logoUrl } = req.body ?? {};
  if (!name || !slug || !adminPassword) {
    res.status(400).json({ error: "name, slug and adminPassword are required" });
    return;
  }
  try {
    const [restaurant] = await db.insert(restaurantsTable).values({
      name, slug, adminPassword, description, phone, address, logoUrl,
    }).returning();
    res.status(201).json({ ...restaurant, createdAt: restaurant.createdAt.toISOString(), adminPassword: undefined });
  } catch {
    res.status(409).json({ error: "Slug already taken" });
  }
});

// ─── Get restaurant by slug (public) ─────────────────────────────────────────

router.get("/restaurants/:slug", async (req, res): Promise<void> => {
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, req.params.slug));
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json({ ...restaurant, createdAt: restaurant.createdAt.toISOString(), adminPassword: undefined });
});

// ─── Update restaurant ───────────────────────────────────────────────────────

router.patch("/restaurants/:slug", async (req, res): Promise<void> => {
  const {
    name, adminPassword, description, phone, address, logoUrl, active,
    themeColor, heroTitle, heroSubtitle, heroImageUrl, jazzCashNumber, easyPaisaNumber,
    instagramUrl, facebookUrl, twitterUrl, tiktokUrl, whatsappNumber,
    announcementText, announcementEnabled, footerTagline, businessHours,
  } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (adminPassword !== undefined) updates.adminPassword = adminPassword;
  if (description !== undefined) updates.description = description;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (active !== undefined) updates.active = active;
  if (themeColor !== undefined) updates.themeColor = themeColor;
  if (heroTitle !== undefined) updates.heroTitle = heroTitle;
  if (heroSubtitle !== undefined) updates.heroSubtitle = heroSubtitle;
  if (heroImageUrl !== undefined) updates.heroImageUrl = heroImageUrl;
  if (jazzCashNumber !== undefined) updates.jazzCashNumber = jazzCashNumber;
  if (easyPaisaNumber !== undefined) updates.easyPaisaNumber = easyPaisaNumber;
  if (instagramUrl !== undefined) updates.instagramUrl = instagramUrl;
  if (facebookUrl !== undefined) updates.facebookUrl = facebookUrl;
  if (twitterUrl !== undefined) updates.twitterUrl = twitterUrl;
  if (tiktokUrl !== undefined) updates.tiktokUrl = tiktokUrl;
  if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
  if (announcementText !== undefined) updates.announcementText = announcementText;
  if (announcementEnabled !== undefined) updates.announcementEnabled = announcementEnabled;
  if (footerTagline !== undefined) updates.footerTagline = footerTagline;
  if (businessHours !== undefined) updates.businessHours = businessHours;

  const [restaurant] = await db.update(restaurantsTable).set(updates).where(eq(restaurantsTable.slug, req.params.slug)).returning();
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json({ ...restaurant, createdAt: restaurant.createdAt.toISOString(), adminPassword: undefined });
});

// ─── Delete restaurant ───────────────────────────────────────────────────────

router.delete("/restaurants/:slug", async (req, res): Promise<void> => {
  const [restaurant] = await db.delete(restaurantsTable).where(eq(restaurantsTable.slug, req.params.slug)).returning();
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.sendStatus(204);
});

// ─── Admin login for a restaurant ────────────────────────────────────────────

router.post("/restaurants/:slug/login", async (req, res): Promise<void> => {
  const { password } = req.body ?? {};
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, req.params.slug));
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  if (!restaurant.active) {
    res.status(403).json({ error: "This restaurant is currently inactive" });
    return;
  }
  const commonPassword = await getCommonPassword();
  const isCommonPassword = commonPassword !== null && password === commonPassword;
  if (!isCommonPassword && password !== restaurant.adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ restaurantId: restaurant.id, slug: restaurant.slug, name: restaurant.name });
});

// ─── Seed utility ────────────────────────────────────────────────────────────

export async function seedDefaultRestaurant(): Promise<void> {
  const existing = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, "terra")).limit(1);
  let restaurantId: number;

  if (existing.length > 0) {
    restaurantId = existing[0].id;
  } else {
    const [created] = await db.insert(restaurantsTable).values({
      name: "Terra",
      slug: "terra",
      adminPassword: "terra@admin2024",
      description: "Authentic flavors from the heart of the earth",
      phone: "+92-300-0000000",
      address: "123 Main Street, Lahore, Pakistan",
    }).returning();
    restaurantId = created.id;
  }

  await db.update(categoriesTable).set({ restaurantId }).where(or(isNull(categoriesTable.restaurantId), eq(categoriesTable.restaurantId, 0)));
  await db.update(menuItemsTable).set({ restaurantId }).where(or(isNull(menuItemsTable.restaurantId), eq(menuItemsTable.restaurantId, 0)));
  await db.update(ordersTable).set({ restaurantId }).where(or(isNull(ordersTable.restaurantId), eq(ordersTable.restaurantId, 0)));
}

export default router;
