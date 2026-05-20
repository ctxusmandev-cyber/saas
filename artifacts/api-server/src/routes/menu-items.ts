import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, menuItemsTable, categoriesTable } from "@workspace/db";
import {
  CreateItemBody,
  UpdateItemBody,
  GetItemParams,
  UpdateItemParams,
  DeleteItemParams,
  ListItemsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function rid(req: any): number | null {
  return (req as any).restaurantId ?? null;
}

function formatItem(item: typeof menuItemsTable.$inferSelect, categoryName?: string | null) {
  return {
    ...item,
    price: Number(item.price),
    categoryName: categoryName ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/items", async (req, res): Promise<void> => {
  const queryParsed = ListItemsQueryParams.safeParse(req.query);
  const filters: ReturnType<typeof eq>[] = [];

  const restaurantId = rid(req);
  if (restaurantId !== null) {
    filters.push(eq(menuItemsTable.restaurantId, restaurantId));
  }

  if (queryParsed.success) {
    if (queryParsed.data.categoryId != null) {
      filters.push(eq(menuItemsTable.categoryId, queryParsed.data.categoryId));
    }
    if (queryParsed.data.featured != null) {
      filters.push(eq(menuItemsTable.featured, queryParsed.data.featured));
    }
  }

  const items = await db
    .select({
      item: menuItemsTable,
      categoryName: categoriesTable.name,
    })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(menuItemsTable.name);

  res.json(items.map(({ item, categoryName }) => formatItem(item, categoryName)));
});

router.post("/items", async (req, res): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const restaurantId = rid(req) ?? undefined;
  const [item] = await db.insert(menuItemsTable).values({
    ...parsed.data,
    restaurantId,
    price: String(parsed.data.price),
  }).returning();

  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, item.categoryId));
  res.status(201).json(formatItem(item, cat?.name));
});

router.get("/items/:id", async (req, res): Promise<void> => {
  const params = GetItemParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ item: menuItemsTable, categoryName: categoriesTable.name })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(eq(menuItemsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(formatItem(row.item, row.categoryName));
});

router.patch("/items/:id", async (req, res): Promise<void> => {
  const params = UpdateItemParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) {
    updateData.price = String(parsed.data.price);
  }

  const [item] = await db.update(menuItemsTable).set(updateData).where(eq(menuItemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, item.categoryId));
  res.json(formatItem(item, cat?.name));
});

router.delete("/items/:id", async (req, res): Promise<void> => {
  const params = DeleteItemParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.delete(menuItemsTable).where(eq(menuItemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
