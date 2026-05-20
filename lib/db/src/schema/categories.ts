import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { restaurantsTable } from "./restaurants";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;
