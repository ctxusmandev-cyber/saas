import { Router, type IRouter } from "express";
import { desc, count, sum, eq, gte, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, categoriesTable } from "@workspace/db";

const router: IRouter = Router();

function rid(req: any): number | null {
  return (req as any).restaurantId ?? null;
}

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const restaurantId = rid(req);
  const rFilter = restaurantId !== null ? eq(ordersTable.restaurantId, restaurantId) : undefined;
  const iFilter = restaurantId !== null ? eq(menuItemsTable.restaurantId, restaurantId) : undefined;
  const cFilter = restaurantId !== null ? eq(categoriesTable.restaurantId, restaurantId) : undefined;

  const [orderStats] = await db
    .select({ totalOrders: count(), totalRevenue: sum(ordersTable.total) })
    .from(ordersTable)
    .where(rFilter);

  const [pendingCount] = await db
    .select({ pendingOrders: count() })
    .from(ordersTable)
    .where(rFilter ? and(rFilter, eq(ordersTable.status, "pending")) : eq(ordersTable.status, "pending"));

  const [itemCount] = await db.select({ totalItems: count() }).from(menuItemsTable).where(iFilter);
  const [catCount] = await db.select({ totalCategories: count() }).from(categoriesTable).where(cFilter);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayStats] = await db
    .select({ todayOrders: count(), todayRevenue: sum(ordersTable.total) })
    .from(ordersTable)
    .where(rFilter ? and(rFilter, gte(ordersTable.createdAt, today)) : gte(ordersTable.createdAt, today));

  res.json({
    totalOrders: orderStats.totalOrders ?? 0,
    totalRevenue: Number(orderStats.totalRevenue ?? 0),
    pendingOrders: pendingCount.pendingOrders ?? 0,
    totalItems: itemCount.totalItems ?? 0,
    totalCategories: catCount.totalCategories ?? 0,
    todayOrders: todayStats.todayOrders ?? 0,
    todayRevenue: Number(todayStats.todayRevenue ?? 0),
  });
});

router.get("/dashboard/recent-orders", async (req, res): Promise<void> => {
  const restaurantId = rid(req);
  const rFilter = restaurantId !== null ? eq(ordersTable.restaurantId, restaurantId) : undefined;

  const orders = await db
    .select()
    .from(ordersTable)
    .where(rFilter)
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

  const result = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));

      return {
        ...order,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        })),
      };
    })
  );

  res.json(result);
});

router.get("/dashboard/top-items", async (req, res): Promise<void> => {
  const restaurantId = rid(req);

  const baseQuery = db
    .select({
      menuItemId: orderItemsTable.menuItemId,
      name: orderItemsTable.name,
      orderCount: count(),
      revenue: sum(orderItemsTable.unitPrice),
    })
    .from(orderItemsTable);

  const rows = restaurantId !== null
    ? await baseQuery
        .innerJoin(ordersTable, and(eq(orderItemsTable.orderId, ordersTable.id), eq(ordersTable.restaurantId, restaurantId)))
        .groupBy(orderItemsTable.menuItemId, orderItemsTable.name)
        .orderBy(desc(count()))
        .limit(10)
    : await baseQuery
        .groupBy(orderItemsTable.menuItemId, orderItemsTable.name)
        .orderBy(desc(count()))
        .limit(10);

  const result = await Promise.all(
    rows.map(async (row) => {
      const [item] = await db
        .select({ imageUrl: menuItemsTable.imageUrl })
        .from(menuItemsTable)
        .where(eq(menuItemsTable.id, row.menuItemId));

      return {
        id: row.menuItemId,
        name: row.name,
        orderCount: Number(row.orderCount ?? 0),
        revenue: Number(row.revenue ?? 0),
        imageUrl: item?.imageUrl ?? null,
      };
    })
  );

  res.json(result);
});

export default router;
