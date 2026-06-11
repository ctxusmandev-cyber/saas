import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, restaurantsTable, ridersTable, couponsTable } from "@workspace/db";
import { z } from "zod";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  ListOrdersQueryParams,
} from "@workspace/api-zod";
import {
  notifyOrderPlaced,
  notifyOrderStatusChanged,
  notifyPaymentConfirmed,
} from "../lib/notifications";

const UpdateOrderPaymentStatusParams = z.object({ id: z.coerce.number() });
const UpdateOrderPaymentStatusBody = z.object({ paymentStatus: z.enum(["pending", "confirmed", "not_required"]) });

const router: IRouter = Router();

function rid(req: any): number | null {
  return (req as any).restaurantId ?? null;
}

async function getRestaurantName(restaurantId: number | null | undefined): Promise<string> {
  if (!restaurantId) return "Restaurant";
  const [r] = await db.select({ name: restaurantsTable.name }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
  return r?.name ?? "Restaurant";
}

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderId));

  let riderName: string | null = null;
  let riderPhone: string | null = null;
  if (order.riderId) {
    const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.id, order.riderId));
    riderName = rider?.name ?? null;
    riderPhone = rider?.phone ?? null;
  }

  return {
    ...order,
    total: Number(order.total),
    discountAmount: Number(order.discountAmount ?? 0),
    couponCode: order.couponCode ?? null,
    createdAt: order.createdAt.toISOString(),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    riderId: order.riderId ?? null,
    riderName,
    riderPhone,
    items: items.map((i) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
  };
}

const AssignRiderBody = z.object({ riderId: z.number().nullable() });

router.get("/orders", async (req, res): Promise<void> => {
  const queryParsed = ListOrdersQueryParams.safeParse(req.query);
  const filters: ReturnType<typeof eq>[] = [];

  const restaurantId = rid(req);
  if (restaurantId !== null) {
    filters.push(eq(ordersTable.restaurantId, restaurantId));
  }

  if (queryParsed.success) {
    const { status, dateFrom, dateTo } = queryParsed.data as any;

    if (status) {
      filters.push(eq(ordersTable.status, status as typeof ordersTable.status._.data));
    }

    if (dateFrom) {
      filters.push(gte(ordersTable.createdAt, new Date(dateFrom + "T00:00:00Z")));
    }

    if (dateTo) {
      filters.push(lte(ordersTable.createdAt, new Date(dateTo + "T23:59:59Z")));
    }
  }

  let query = db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).$dynamic();
  if (filters.length > 0) {
    query = query.where(and(...filters));
  }

  const orders = await query;
  const result = await Promise.all(orders.map((o) => getOrderWithItems(o.id)));
  res.json(result.filter(Boolean));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items: orderItems, ...orderData } = parsed.data;
  const restaurantId = rid(req) ?? undefined;

  // Handle optional coupon code passed outside the generated schema
  const couponCode = typeof req.body.couponCode === "string" ? req.body.couponCode.toUpperCase().trim() : null;

  let subtotal = 0;
  const resolvedItems: { menuItemId: number; name: string; quantity: number; unitPrice: number }[] = [];

  for (const item of orderItems) {
    const [menuItem] = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, item.menuItemId));

    if (!menuItem) {
      res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
      return;
    }

    const unitPrice = Number(menuItem.price);
    subtotal += unitPrice * item.quantity;
    resolvedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice,
    });
  }

  // Validate coupon if provided
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;
  if (couponCode && restaurantId) {
    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(and(
        eq(couponsTable.restaurantId, restaurantId),
        eq(couponsTable.code, couponCode),
      ));

    if (
      coupon &&
      coupon.active &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
      (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount))
    ) {
      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((subtotal * Number(coupon.discountValue)) / 100 * 100) / 100;
      } else {
        discountAmount = Math.min(Number(coupon.discountValue), subtotal);
      }
      appliedCouponCode = coupon.code;
      // Increment used count
      await db.update(couponsTable)
        .set({ usedCount: coupon.usedCount + 1 })
        .where(eq(couponsTable.id, coupon.id));
    }
  }

  const total = Math.max(0, subtotal - discountAmount);
  const paymentStatus = orderData.paymentMethod === "cash_on_delivery" ? "not_required" : "pending";

  const userId: number | undefined = (req as any).userId ?? undefined;

  const [order] = await db.insert(ordersTable).values({
    ...orderData,
    restaurantId,
    total: String(total),
    discountAmount: String(discountAmount),
    couponCode: appliedCouponCode,
    status: "pending",
    paymentStatus,
    userId: userId ?? null,
  }).returning();

  await db.insert(orderItemsTable).values(
    resolvedItems.map((i) => ({
      orderId: order.id,
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: String(i.unitPrice),
    }))
  );

  const fullOrder = await getOrderWithItems(order.id);
  res.status(201).json(fullOrder);

  // Fire-and-forget notification
  if (fullOrder && fullOrder.customerPhone) {
    const restaurantName = await getRestaurantName(restaurantId);
    notifyOrderPlaced(
      fullOrder.customerPhone,
      fullOrder.id,
      restaurantName,
      fullOrder.total,
      fullOrder.paymentMethod,
    ).catch(() => {});
  }
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(order);
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status as typeof ordersTable.status._.data })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const fullOrder = await getOrderWithItems(order.id);
  res.json(fullOrder);

  // Fire-and-forget notification
  if (fullOrder && fullOrder.customerPhone) {
    const restaurantName = await getRestaurantName(fullOrder.restaurantId);
    notifyOrderStatusChanged(
      fullOrder.customerPhone,
      fullOrder.id,
      restaurantName,
      fullOrder.status,
    ).catch(() => {});
  }
});

router.patch("/orders/:id/payment", async (req, res): Promise<void> => {
  const params = UpdateOrderPaymentStatusParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderPaymentStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ paymentStatus: parsed.data.paymentStatus as typeof ordersTable.paymentStatus._.data })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const fullOrder = await getOrderWithItems(order.id);
  res.json(fullOrder);

  // Fire-and-forget notification
  if (fullOrder && fullOrder.customerPhone && parsed.data.paymentStatus === "confirmed") {
    const restaurantName = await getRestaurantName(fullOrder.restaurantId);
    notifyPaymentConfirmed(
      fullOrder.customerPhone,
      fullOrder.id,
      restaurantName,
    ).catch(() => {});
  }
});

router.patch("/orders/:id/rider", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AssignRiderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [order] = await db
    .update(ordersTable)
    .set({ riderId: parsed.data.riderId })
    .where(eq(ordersTable.id, id))
    .returning();

  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const fullOrder = await getOrderWithItems(order.id);
  res.json(fullOrder);
});

export default router;
