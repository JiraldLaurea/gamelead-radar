import fs from "node:fs/promises";
import path from "node:path";
import { redirectTo } from "@/lib/http";

export async function POST() {
  const dbPath = path.join(process.cwd(), "prisma", "data", "gamelead-radar.sqlite");
  const fallbackDbPath = path.join(process.cwd(), "data", "gamelead-radar.sqlite");
  const source = await exists(dbPath) ? dbPath : fallbackDbPath;
  const backupDir = path.join(process.cwd(), "backups", "db");
  await fs.mkdir(backupDir, { recursive: true });
  if (await exists(source)) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
    await fs.copyFile(source, path.join(backupDir, `gamelead-radar-${stamp}.sqlite`));
  }
  return redirectTo("/settings");
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
