import { cpSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
const backupDir = resolve(root, "backups/backup-homepage-guineego-before-redesign");

if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true });
}

// 1. Files to backup
const filesToBackup = [
  "src/app/page.tsx",
  "src/app/admin/site-public/page.tsx",
  "src/components/admin/MediaImagePicker.tsx",
  "src/lib/brand-config.types.ts",
  "src/lib/useBrandConfig.ts",
  "src/lib/server-db.ts",
  "src/app/api/brand-config/route.ts",
  "src/app/api/brand-config/upload/route.ts",
  "data/settings.json",
  "package.json",
];

for (const relPath of filesToBackup) {
  const srcPath = resolve(root, relPath);
  const destPath = resolve(backupDir, relPath);
  const destDir = resolve(destPath, "..");
  mkdirSync(destDir, { recursive: true });
  cpSync(srcPath, destPath);
  console.log(`Copied: ${relPath} -> backups/.../${relPath}`);
}

// 2. Write restore script
const restoreScript = `import { cpSync, existsSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
const backupDir = resolve(root, "backups/backup-homepage-guineego-before-redesign");

const filesToRestore = [
  "src/app/page.tsx",
  "src/app/admin/site-public/page.tsx",
  "src/components/admin/MediaImagePicker.tsx",
  "src/lib/brand-config.types.ts",
  "src/lib/useBrandConfig.ts",
  "src/lib/server-db.ts",
  "src/app/api/brand-config/route.ts",
  "src/app/api/brand-config/upload/route.ts",
  "data/settings.json",
  "package.json",
];

console.log("Restauration du point de sauvegarde...");
for (const relPath of filesToRestore) {
  const srcPath = resolve(backupDir, relPath);
  const destPath = resolve(root, relPath);
  if (existsSync(srcPath)) {
    cpSync(srcPath, destPath);
    console.log(\`Restored: \${relPath}\`);
  }
}
console.log("Restauration terminée avec succès !");
`;

writeFileSync(resolve(backupDir, "restore.mjs"), restoreScript, "utf-8");
console.log("Restore script written to backups/.../restore.mjs");
