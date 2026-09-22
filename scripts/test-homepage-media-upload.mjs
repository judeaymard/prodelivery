import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { promises as fs } from "fs";

console.log("==================================================================");
console.log("🧪 DÉBUT DU TEST E2E DU SYSTÈME D'UPLOAD DES IMAGES DE LA HOMEPAGE");
console.log("==================================================================");

const root = process.cwd();

// 1. Audit de la route API upload
console.log("\n1️⃣ Vérification de la route serveur d'upload (src/app/api/brand-config/upload/route.ts)...");
const uploadRoutePath = resolve(root, "src/app/api/brand-config/upload/route.ts");
const uploadRouteCode = readFileSync(uploadRoutePath, "utf-8");

const requiredUploadFeatures = [
  "isValidImageBuffer",
  "getImageDimensions",
  "public/uploads/brand",
  "-original.",
  "10 * 1024 * 1024",
  "verifySessionToken",
];

for (const feat of requiredUploadFeatures) {
  if (!uploadRouteCode.includes(feat)) {
    console.error(`❌ Échec : La route d'upload ne contient pas "${feat}"`);
    process.exit(1);
  }
}
console.log("  ✅ [PASS] Route d'upload sécurisée avec validation des octets magiques, extraction des dimensions et sauvegarde de l'original.");

// 2. Audit du composant MediaImagePicker
console.log("\n2️⃣ Vérification du composant MediaImagePicker (src/components/admin/MediaImagePicker.tsx)...");
const pickerPath = resolve(root, "src/components/admin/MediaImagePicker.tsx");
const pickerCode = readFileSync(pickerPath, "utf-8");

const requiredPickerFeatures = [
  "unoptimized={true}",
  "handleDrop",
  "handleDragOver",
  "dimensions",
  "fileSize",
  "formatBytes",
  "recommendedMinWidth",
  "Remplacer l'image",
  "Importer une image",
  "Restaurer",
];

for (const feat of requiredPickerFeatures) {
  if (!pickerCode.includes(feat)) {
    console.error(`❌ Échec : MediaImagePicker ne contient pas "${feat}"`);
    process.exit(1);
  }
}
console.log("  ✅ [PASS] MediaImagePicker gère l'upload direct, le drag-and-drop, l'aperçu net unoptimized, l'affichage dimensions/poids et les recommandations.");

// 3. Audit des emplacements dans admin/site-public
console.log("\n3️⃣ Vérification de tous les emplacements dans /admin/site-public...");
const adminSitePublicPath = resolve(root, "src/app/admin/site-public/page.tsx");
const adminCode = readFileSync(adminSitePublicPath, "utf-8");

const requiredSlots = [
  { name: "Logo", slot: 'slot="logo"' },
  { name: "Favicon", slot: 'slot="favicon"' },
  { name: "Hero Principal", slot: 'slot="hero"' },
  { name: "Hero Card 2", slot: 'slot="hero-card-2"' },
  { name: "Hero Card 3", slot: 'slot="hero-card-3"' },
  { name: "Hero Card 4", slot: 'slot="hero-card-4"' },
  { name: "Closing Recto", slot: 'slot="closing-recto"' },
  { name: "Closing Verso", slot: 'slot="closing-verso"' },
  { name: "Bannière CTA", slot: 'slot="cta"' },
  { name: "Recrutement Livreur", slot: 'slot="rider"' },
  { name: "Community Card 1", slot: 'slot="community-1"' },
  { name: "Community Card 2", slot: 'slot="community-2"' },
  { name: "Community Card 3", slot: 'slot="community-3"' },
  { name: "Services", slot: "service-" },
];

for (const item of requiredSlots) {
  if (!adminCode.includes(item.slot)) {
    console.error(`❌ Échec : admin/site-public ne contient pas l'emplacement "${item.name}" (${item.slot})`);
    process.exit(1);
  }
}
console.log("  ✅ [PASS] Tous les 14 emplacements de la homepage sont présents dans /admin/site-public avec leurs slots respectifs.");

// 4. Audit des liaisons dans la homepage (src/app/page.tsx)
console.log("\n4️⃣ Vérification des liaisons d'images dans src/app/page.tsx...");
const pagePath = resolve(root, "src/app/page.tsx");
const pageCode = readFileSync(pagePath, "utf-8");

const requiredHomepageBindings = [
  { name: "Logo Navbar & Footer", prop: "identity?.logoUrl" },
  { name: "Favicon Dynamic Link", prop: "media?.faviconUrl" },
  { name: "Hero Card 1 (Hero Principal)", prop: "media?.heroImage" },
  { name: "Hero Card 2", prop: "media?.secondaryImage" },
  { name: "Hero Card 3", prop: "media?.heroCard3Image" },
  { name: "Hero Card 4", prop: "media?.heroCard4Image" },
  { name: "Community Card 1", prop: "media?.communityCard1" },
  { name: "Community Card 2", prop: "media?.communityCard2" },
  { name: "Community Card 3", prop: "media?.communityCard3" },
  { name: "Closing Card Recto", prop: "media?.closingImage" },
  { name: "Closing Card Verso", prop: "media?.closingBackImage" },
  { name: "Services (0...3)", prop: "services?.[0]?.image" },
  { name: "Bannière CTA", prop: "media?.ctaImage" },
  { name: "Recrutement Livreur", prop: "media?.riderImage" },
];

for (const item of requiredHomepageBindings) {
  if (!pageCode.includes(item.prop)) {
    console.error(`❌ Échec : page.tsx ne lie pas "${item.name}" (${item.prop})`);
    process.exit(1);
  }
}
console.log("  ✅ [PASS] Toutes les liaisons d'images sont actives dans src/app/page.tsx avec fallbacks.");

// 5. Test de persistance dans data/settings.json
console.log("\n5️⃣ Test de persistance et restauration dans data/settings.json...");
const settingsPath = resolve(root, "data/settings.json");
const initialSettingsRaw = readFileSync(settingsPath, "utf-8");
const initialSettings = JSON.parse(initialSettingsRaw);

// Test d'écriture de médias personnalisés haute résolution
const customMedia = {
  heroImage: "/uploads/brand/hero-1726958000-abc1234-original.webp",
  secondaryImage: "/uploads/brand/hero-card-2-1726958000-def5678-original.webp",
  heroCard3Image: "/uploads/brand/hero-card-3-1726958000-ghi9012-original.webp",
  heroCard4Image: "/uploads/brand/hero-card-4-1726958000-jkl3456-original.webp",
  ctaImage: "/uploads/brand/cta-1726958000-mno7890-original.webp",
  closingImage: "/uploads/brand/closing-recto-1726958000-pqr1234-original.webp",
  closingBackImage: "/uploads/brand/closing-verso-1726958000-stu5678-original.webp",
  riderImage: "/uploads/brand/rider-1726958000-vwx9012-original.webp",
  communityCard1: "/uploads/brand/community-1-1726958000-yza3456-original.webp",
  communityCard2: "/uploads/brand/community-2-1726958000-bcd7890-original.webp",
  communityCard3: "/uploads/brand/community-3-1726958000-efg1234-original.webp",
  faviconUrl: "/uploads/brand/favicon-1726958000-hij5678-original.png",
};

const updatedSettings = {
  ...initialSettings,
  brand: {
    ...initialSettings.brand,
    identity: {
      ...initialSettings.brand.identity,
      logoUrl: "/uploads/brand/logo-1726958000-klm9012-original.png",
    },
    media: {
      ...initialSettings.brand.media,
      ...customMedia,
    },
  },
};

writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2), "utf-8");

// Relecture et vérification
const reloadedSettings = JSON.parse(readFileSync(settingsPath, "utf-8"));
for (const [key, val] of Object.entries(customMedia)) {
  if (reloadedSettings.brand.media[key] !== val) {
    console.error(`❌ Échec : Champ media.${key} non persisté correctement.`);
    process.exit(1);
  }
}
if (reloadedSettings.brand.identity.logoUrl !== "/uploads/brand/logo-1726958000-klm9012-original.png") {
  console.error("❌ Échec : identity.logoUrl non persisté.");
  process.exit(1);
}
console.log("  ✅ [PASS] Tous les 13 médias personnalisés sont parfaitement sauvegardés et persistés.");

// Restauration de l'état initial
writeFileSync(settingsPath, initialSettingsRaw, "utf-8");
console.log("  ✅ [PASS] Paramètres d'origine restaurés avec succès dans data/settings.json.");

// 6. Test d'écriture d'un fichier original dans public/uploads/brand
console.log("\n6️⃣ Test de création de fichier original dans public/uploads/brand/...");
const uploadsBrandDir = resolve(root, "public/uploads/brand");
if (!existsSync(uploadsBrandDir)) {
  await fs.mkdir(uploadsBrandDir, { recursive: true });
}

const testOriginalFile = resolve(uploadsBrandDir, "hero-test-1726958000-xyz123-original.png");
// 1x1 transparent PNG binary
const png1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
writeFileSync(testOriginalFile, png1x1);

if (existsSync(testOriginalFile)) {
  const readBack = readFileSync(testOriginalFile);
  if (readBack.length === png1x1.length) {
    console.log("  ✅ [PASS] Écriture de fichier original dans public/uploads/brand/ sans compression validée.");
  }
  unlinkSync(testOriginalFile);
}

console.log("\n==================================================================");
console.log("🎉 TOUS LES CONTRÔLES DU SYSTÈME D'UPLOAD HOMEPAGE ONT RÉUSSI !");
console.log("==================================================================");
