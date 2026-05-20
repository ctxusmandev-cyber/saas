import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  adminPassword: text("admin_password").notNull(),
  description: text("description"),
  phone: text("phone"),
  address: text("address"),
  logoUrl: text("logo_url"),
  active: boolean("active").notNull().default(true),
  themeColor: text("theme_color"),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: text("hero_image_url"),
  jazzCashNumber: text("jazz_cash_number"),
  easyPaisaNumber: text("easy_paisa_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true, createdAt: true });
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;
