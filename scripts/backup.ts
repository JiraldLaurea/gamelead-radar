import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const source = path.join(process.cwd(), "data", "gamelead-radar.sqlite");
  const backupDir = path.join(process.cwd(), "backups", "db");
  await fs.mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
  await fs.copyFile(source, path.join(backupDir, `gamelead-radar-${stamp}.sqlite`));
  console.log(`Backup created: backups/db/gamelead-radar-${stamp}.sqlite`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
