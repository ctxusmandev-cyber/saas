import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";

const router: IRouter = Router();

const SUPER_ADMIN_PASSWORD_ENV = process.env.SUPER_ADMIN_PASSWORD ?? "";

const SETTINGS_KEYS = {
  COMMON_PASSWORD: "common_admin_password",
  SUPER_ADMIN_PASSWORD: "super_admin_password_override",
};

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

export async function getEffectiveSuperAdminPassword(): Promise<string> {
  const override = await getSetting(SETTINGS_KEYS.SUPER_ADMIN_PASSWORD);
  return override ?? SUPER_ADMIN_PASSWORD_ENV;
}

export async function getCommonPassword(): Promise<string | null> {
  return getSetting(SETTINGS_KEYS.COMMON_PASSWORD);
}

async function verifySuperAdmin(password: string): Promise<boolean> {
  const effective = await getEffectiveSuperAdminPassword();
  return password === effective;
}

router.post("/super-admin/login", async (req, res): Promise<void> => {
  const { password } = req.body ?? {};
  const valid = await verifySuperAdmin(password);
  if (valid) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.post("/super-admin/change-password", async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  const valid = await verifySuperAdmin(currentPassword);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  await setSetting(SETTINGS_KEYS.SUPER_ADMIN_PASSWORD, newPassword);
  res.json({ ok: true });
});

router.post("/super-admin/common-password", async (req, res): Promise<void> => {
  const { superAdminPassword, newCommonPassword } = req.body ?? {};
  if (!superAdminPassword || newCommonPassword === undefined) {
    res.status(400).json({ error: "superAdminPassword and newCommonPassword are required" });
    return;
  }
  const valid = await verifySuperAdmin(superAdminPassword);
  if (!valid) {
    res.status(401).json({ error: "Super admin password is incorrect" });
    return;
  }
  if (newCommonPassword === "") {
    await db.delete(settingsTable).where(eq(settingsTable.key, SETTINGS_KEYS.COMMON_PASSWORD));
    res.json({ ok: true, cleared: true });
    return;
  }
  if (newCommonPassword.length < 6) {
    res.status(400).json({ error: "Common password must be at least 6 characters" });
    return;
  }
  await setSetting(SETTINGS_KEYS.COMMON_PASSWORD, newCommonPassword);
  res.json({ ok: true });
});

router.get("/super-admin/common-password-status", async (_req, res): Promise<void> => {
  const pwd = await getCommonPassword();
  res.json({ isSet: pwd !== null });
});

export default router;
