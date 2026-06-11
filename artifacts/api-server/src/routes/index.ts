import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import menuItemsRouter from "./menu-items";
import ordersRouter from "./orders";
import dashboardRouter from "./dashboard";
import restaurantsRouter from "./restaurants";
import ridersRouter from "./riders";
import settingsRouter from "./settings";
import storageRouter from "./storage";
import couponsRouter from "./coupons";
import authRouter, { verifyToken } from "./auth";
import { db, restaurantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Restaurant context middleware — reads X-Restaurant-ID or X-Restaurant-Slug header
router.use(async (req: Request, _res: Response, next: NextFunction) => {
  const rid = req.headers["x-restaurant-id"];
  if (rid && !isNaN(Number(rid))) {
    (req as any).restaurantId = Number(rid);
    return next();
  }
  const slug = req.headers["x-restaurant-slug"] as string | undefined;
  if (slug) {
    const [r] = await db.select({ id: restaurantsTable.id }).from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
    if (r) (req as any).restaurantId = r.id;
  }
  next();
});

// Customer auth middleware — extracts userId from Bearer token
router.use((req: Request, _res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const payload = verifyToken(auth.slice(7));
    if (payload) (req as any).userId = payload.userId;
  }
  next();
});

router.use(authRouter);
router.use(settingsRouter);
router.use(restaurantsRouter);
router.use(healthRouter);
router.use(categoriesRouter);
router.use(menuItemsRouter);
router.use(ordersRouter);
router.use(ridersRouter);
router.use(dashboardRouter);
router.use(storageRouter);
router.use(couponsRouter);

export default router;
