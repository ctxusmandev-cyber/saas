import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "terra_jwt_secret_dev_only_change_in_prod";
const JWT_EXPIRES = "30d";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    return payload;
  } catch {
    return null;
  }
}

function rid(req: any): number | null {
  return (req as any).restaurantId ?? null;
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, phone } = req.body;
  const restaurantId = rid(req);

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(
      restaurantId
        ? and(eq(usersTable.email, email.toLowerCase()), eq(usersTable.restaurantId, restaurantId))
        : eq(usersTable.email, email.toLowerCase())
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name,
    email: email.toLowerCase(),
    passwordHash,
    phone: phone ?? null,
    restaurantId: restaurantId ?? undefined,
  }).returning();

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  const restaurantId = rid(req);

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db.select()
    .from(usersTable)
    .where(
      restaurantId
        ? and(eq(usersTable.email, email.toLowerCase()), eq(usersTable.restaurantId, restaurantId))
        : eq(usersTable.email, email.toLowerCase())
    )
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Incorrect email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Incorrect email or password" });
    return;
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt.toISOString() },
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt.toISOString() });
});

router.patch("/auth/profile", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" }); return;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }

  const { name, phone } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, payload.userId)).returning();
  res.json({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone });
});

router.get("/auth/orders", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" }); return;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }

  const { db, ordersTable, orderItemsTable } = await import("@workspace/db");
  const { eq, desc } = await import("drizzle-orm");

  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, payload.userId))
    .orderBy(desc(ordersTable.createdAt));

  const result = await Promise.all(orders.map(async (order) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      discountAmount: Number(order.discountAmount ?? 0),
      couponCode: order.couponCode ?? null,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
    };
  }));

  res.json(result);
});

export default router;
