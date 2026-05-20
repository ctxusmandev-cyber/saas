import { Router, type IRouter } from "express";
import { eq, and, isNull, or } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  GetCategoryParams,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function rid(req: any): number | null {
  return (req as any).restaurantId ?? null;
}

function restaurantFilter(req: any) {
  const r = rid(req);
  if (r === null) return undefined;
  return eq(categoriesTable.restaurantId, r);
}

router.get("/categories", async (req, res): Promise<void> => {
  const filter = restaurantFilter(req);
  const categories = await db.select().from(categoriesTable)
    .where(filter)
    .orderBy(categoriesTable.name);
  res.json(categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const restaurantId = rid(req) ?? undefined;
  const [category] = await db.insert(categoriesTable).values({ ...parsed.data, restaurantId }).returning();
  res.status(201).json({ ...category, createdAt: category.createdAt.toISOString() });
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json({ ...category, createdAt: category.createdAt.toISOString() });
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [category] = await db.update(categoriesTable).set(parsed.data).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json({ ...category, createdAt: category.createdAt.toISOString() });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [category] = await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
