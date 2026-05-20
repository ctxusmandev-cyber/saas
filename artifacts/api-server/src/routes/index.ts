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

const router: IRouter = Router();

// Restaurant context middleware — reads X-Restaurant-ID header
router.use((req: Request, _res: Response, next: NextFunction) => {
  const rid = req.headers["x-restaurant-id"];
  if (rid && !isNaN(Number(rid))) {
    (req as any).restaurantId = Number(rid);
  }
  next();
});

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
