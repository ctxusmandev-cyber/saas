import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { restaurantsTable } from "./restaurants";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ridersTable = pgTable("riders", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiderSchema = createInsertSchema(ridersTable).omit({ id: true, createdAt: true });
export type InsertRider = z.infer<typeof insertRiderSchema>;
export type Rider = typeof ridersTable.$inferSelect;
