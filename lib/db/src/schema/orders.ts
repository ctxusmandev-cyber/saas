import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { restaurantsTable } from "./restaurants";
import { ridersTable } from "./riders";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { menuItemsTable } from "./menu-items";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash_on_delivery",
  "jazz_cash",
  "easy_paisa",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "not_required",
  "pending",
  "confirmed",
]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  status: orderStatusEnum("status").notNull().default("pending"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash_on_delivery"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("not_required"),
  riderId: integer("rider_id").references(() => ridersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItemsTable.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
