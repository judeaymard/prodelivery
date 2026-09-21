/**
 * Service de Sauvegarde & Reprise d'Activité (Backup & Recovery)
 * GuinéeGo LAT 2027 — Phase 5 Security Hardening
 * 
 * Assure des snapshots locaux atomiques, horodatés et non destructifs
 * de l'ensemble du répertoire `data/*.json` avec rotation automatique.
 */

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUPS_ROOT = path.join(DATA_DIR, "backups");
const MAX_SNAPSHOTS_RETAINED = 10;

export interface BackupSnapshotInfo {
  id: string;
  timestamp: string;
  directoryName: string;
  filesCount: number;
  totalSizeBytes: number;
  files: string[];
}

/**
 * Crée un snapshot complet et non-destructif de data/*.json
 */
export async function createLocalBackupSnapshot(triggeredBy: string = "SYSTEM"): Promise<BackupSnapshotInfo> {
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
  const copiedFiles: string[] = [];

  for (const filename of jsonFiles) {
    const srcPath = path.join(DATA_DIR, filename);
    const destPath = path.join(targetDir, filename);

    const stat = await fs.stat(srcPath);
    totalSizeBytes += stat.size;

    // Lecture et écriture atomique du contenu
    const content = await fs.readFile(srcPath, "utf-8");
    await fs.writeFile(destPath, content, "utf-8");
    copiedFiles.push(filename);
  }

  // Écriture des métadonnées du snapshot
  const metadata = {
    id: `bkp_${Date.now()}`,
    createdAt: now.toISOString(),
    triggeredBy,
    filesCount: copiedFiles.length,
    totalSizeBytes,
    files: copiedFiles,
  };

  await fs.writeFile(
    path.join(targetDir, "_manifest.json"),
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );

  // Rotation automatique : garder les MAX_SNAPSHOTS_RETAINED derniers
  await pruneOldSnapshots();

  return {
    id: metadata.id,
    timestamp: now.toISOString(),
    directoryName: snapshotDirName,
    filesCount: copiedFiles.length,
    totalSizeBytes,
    files: copiedFiles,
  };
}

/**
 * Liste les snapshots de sauvegarde existants
 */
export async function listLocalBackupSnapshots(): Promise<BackupSnapshotInfo[]> {
  try {
    await fs.mkdir(BACKUPS_ROOT, { recursive: true });
    const entries = await fs.readdir(BACKUPS_ROOT, { withFileTypes: true });
    const snapshotDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith("snapshot_"));

    const list: BackupSnapshotInfo[] = [];

    for (const dir of snapshotDirs) {
      const manifestPath = path.join(BACKUPS_ROOT, dir.name, "_manifest.json");
      try {
        const content = await fs.readFile(manifestPath, "utf-8");
        const meta = JSON.parse(content);
        list.push({
          id: meta.id || dir.name,
          timestamp: meta.createdAt || dir.name.replace("snapshot_", ""),
          directoryName: dir.name,
          filesCount: meta.filesCount || 0,
          totalSizeBytes: meta.totalSizeBytes || 0,
          files: meta.files || [],
        });
      } catch {
        list.push({
          id: dir.name,
          timestamp: dir.name.replace("snapshot_", ""),
          directoryName: dir.name,
          filesCount: 0,
          totalSizeBytes: 0,
          files: [],
        });
      }
    }

    // Trier du plus récent au plus ancien
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error("Erreur listLocalBackupSnapshots:", error);
    return [];
  }
}

/**
 * Supprime les anciens snapshots au-delà de MAX_SNAPSHOTS_RETAINED
 */
async function pruneOldSnapshots(): Promise<void> {
  try {
    const snapshots = await listLocalBackupSnapshots();
    if (snapshots.length > MAX_SNAPSHOTS_RETAINED) {
      const toDelete = snapshots.slice(MAX_SNAPSHOTS_RETAINED);
      for (const snap of toDelete) {
        const dirToDelete = path.join(BACKUPS_ROOT, snap.directoryName);
        await fs.rm(dirToDelete, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error("Erreur pruneOldSnapshots:", error);
  }
}
