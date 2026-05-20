import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, couponsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

function rid(req: any): number | null {
  return (req as any).restaurantId ?? null;
}

function computeDiscount(coupon: typeof couponsTable.$inferSelect, orderTotal: number): number {
  if (coupon.discountType === "percentage") {
    return Math.round((orderTotal * Number(coupon.discountValue)) / 100 * 100) / 100;
  }
  return Math.min(Number(coupon.discountValue), orderTotal);
}

router.get("/coupons", async (req, res): Promise<void> => {
  const restaurantId = rid(req);
  if (!restaurantId) { res.status(400).json({ error: "Restaurant context required" }); return; }

  const coupons = await db
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.restaurantId, restaurantId))
    .orderBy(couponsTable.createdAt);

  res.json(coupons.map((c) => ({
    ...c,
    discountValue: Number(c.discountValue),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/coupons/validate", async (req, res): Promise<void> => {
  const restaurantId = rid(req);
  if (!restaurantId) { res.status(400).json({ valid: false, error: "Restaurant context required" }); return; }

  const body = z.object({ code: z.string(), orderTotal: z.number() }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ valid: false, error: "Invalid request" }); return; }

  const { code, orderTotal } = body.data;

  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(and(
      eq(couponsTable.restaurantId, restaurantId),
      eq(couponsTable.code, code.toUpperCase().trim()),
    ));

  if (!coupon) { res.json({ valid: false, error: "Invalid coupon code" }); return; }
  if (!coupon.active) { res.json({ valid: false, error: "This coupon is no longer active" }); return; }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) { res.json({ valid: false, error: "This coupon has expired" }); return; }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) { res.json({ valid: false, error: "This coupon has reached its usage limit" }); return; }
  if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
    res.json({ valid: false, error: `Minimum order of Rs ${Number(coupon.minOrderAmount).toFixed(0)} required` });
    return;
  }

  const discountAmount = computeDiscount(coupon, orderTotal);
  res.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      description: coupon.description,
    },
    discountAmount,
  });
});

router.post("/coupons", async (req, res): Promise<void> => {
  const restaurantId = rid(req);
  if (!restaurantId) { res.status(400).json({ error: "Restaurant context required" }); return; }

  const body = z.object({
    code: z.string().min(1),
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    active: z.boolean().optional(),
    expiresAt: z.string().nullable().optional(),
  }).safeParse(req.body);

  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { expiresAt, ...rest } = body.data;
  const [coupon] = await db.insert(couponsTable).values({
    ...rest,
    restaurantId,
    code: rest.code.toUpperCase().trim(),
    discountValue: String(rest.discountValue),
    minOrderAmount: rest.minOrderAmount ? String(rest.minOrderAmount) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  }).returning();

  res.status(201).json({
    ...coupon,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    createdAt: coupon.createdAt.toISOString(),
  });
});

router.patch("/coupons/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const restaurantId = rid(req);

  const body = z.object({
    code: z.string().min(1).optional(),
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]).optional(),
    discountValue: z.number().positive().optional(),
    minOrderAmount: z.number().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    active: z.boolean().optional(),
    expiresAt: z.string().nullable().optional(),
  }).safeParse(req.body);

  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { expiresAt, discountValue, minOrderAmount, code, ...rest } = body.data;
  const updateData: Record<string, any> = { ...rest };
  if (code) updateData.code = code.toUpperCase().trim();
  if (discountValue !== undefined) updateData.discountValue = String(discountValue);
  if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount ? String(minOrderAmount) : null;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

  const whereClause = restaurantId
    ? and(eq(couponsTable.id, id), eq(couponsTable.restaurantId, restaurantId))
    : eq(couponsTable.id, id);

  const [coupon] = await db.update(couponsTable).set(updateData).where(whereClause!).returning();
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }

  res.json({
    ...coupon,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    createdAt: coupon.createdAt.toISOString(),
  });
});

router.delete("/coupons/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const restaurantId = rid(req);

  const whereClause = restaurantId
    ? and(eq(couponsTable.id, id), eq(couponsTable.restaurantId, restaurantId))
    : eq(couponsTable.id, id);

  const [deleted] = await db.delete(couponsTable).where(whereClause!).returning();
  if (!deleted) { res.status(404).json({ error: "Coupon not found" }); return; }
  res.json({ success: true });
});

export { computeDiscount };
export default router;
