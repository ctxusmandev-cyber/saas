import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ridersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

function rid(req: any): number | null {
  return (req as any).restaurantId ?? null;
}

const CreateRiderBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
});

const UpdateRiderBody = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

router.get("/riders", async (req, res): Promise<void> => {
  const restaurantId = rid(req);
  const filters = restaurantId !== null ? [eq(ridersTable.restaurantId, restaurantId)] : [];
  const rows = await db
    .select()
    .from(ridersTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(ridersTable.name);
  res.json(rows);
});

router.post("/riders", async (req, res): Promise<void> => {
  const parsed = CreateRiderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const restaurantId = rid(req) ?? undefined;
  const [rider] = await db
    .insert(ridersTable)
    .values({ ...parsed.data, restaurantId })
    .returning();
  res.status(201).json(rider);
});

router.patch("/riders/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateRiderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [rider] = await db
    .update(ridersTable)
    .set(parsed.data)
    .where(eq(ridersTable.id, id))
    .returning();

  if (!rider) { res.status(404).json({ error: "Rider not found" }); return; }
  res.json(rider);
});

router.delete("/riders/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [rider] = await db.delete(ridersTable).where(eq(ridersTable.id, id)).returning();
  if (!rider) { res.status(404).json({ error: "Rider not found" }); return; }
  res.json({ success: true });
});

export default router;
