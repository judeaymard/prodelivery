/**
 * Script de Snapshot Local Automatique & Non Destructif
 * ENO Livraison 2027
 */

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUPS_ROOT = path.join(DATA_DIR, "backups");
const MAX_SNAPSHOTS_RETAINED = 10;

async function runBackup() {
  console.log("🚀 Démarrage de la sauvegarde locale sécurisée ENO Livraison...");
  await fs.mkdir(BACKUPS_ROOT, { recursive: true });

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-");
  const snapshotDirName = `snapshot_${dateStr}`;
  const targetDir = path.join(BACKUPS_ROOT, snapshotDirName);

  await fs.mkdir(targetDir, { recursive: true });

  const allEntries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  const jsonFiles = allEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name);

  let totalSizeBytes = 0;
  const copiedFiles = [];

  for (const filename of jsonFiles) {
    const srcPath = path.join(DATA_DIR, filename);
    const destPath = path.join(targetDir, filename);

    const stat = await fs.stat(srcPath);
    totalSizeBytes += stat.size;

    const content = await fs.readFile(srcPath, "utf-8");
    await fs.writeFile(destPath, content, "utf-8");
    copiedFiles.push(filename);
  }

  const metadata = {
    id: `bkp_${Date.now()}`,
    createdAt: now.toISOString(),
    triggeredBy: "CLI_SCRIPT",
    filesCount: copiedFiles.length,
    totalSizeBytes,
    files: copiedFiles,
  };

  await fs.writeFile(
    path.join(targetDir, "_manifest.json"),
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );

  console.log(`✅ Snapshot créé avec succès dans data/backups/${snapshotDirName}`);
  console.log(`📦 ${copiedFiles.length} fichiers sauvegardés (${totalSizeBytes} octets) :`);
  copiedFiles.forEach((f) => console.log(`   - ${f}`));

  // Rotation
  const entries = await fs.readdir(BACKUPS_ROOT, { withFileTypes: true });
  const snapshotDirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith("snapshot_"))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (snapshotDirs.length > MAX_SNAPSHOTS_RETAINED) {
    const toDelete = snapshotDirs.slice(MAX_SNAPSHOTS_RETAINED);
    for (const snap of toDelete) {
      await fs.rm(path.join(BACKUPS_ROOT, snap.name), { recursive: true, force: true });
      console.log(`🧹 Rotation : ancien snapshot supprimé : ${snap.name}`);
    }
  }

  console.log("🎉 Sauvegarde locale terminée avec succès !");
}

runBackup().catch((err) => {
  console.error("❌ Erreur lors du backup:", err);
  process.exit(1);
});
