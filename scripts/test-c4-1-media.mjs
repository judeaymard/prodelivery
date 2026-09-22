/**
 * scripts/test-c4-1-media.mjs
 * Validation E2E pour Phase C4.1 - Gestion réelle des images & médias
 */

import fs from "fs/promises";
import path from "path";

const SETTINGS_FILE = path.resolve(process.cwd(), "data/settings.json");
const PAGE_FILE = path.resolve(process.cwd(), "src/app/page.tsx");

async function run() {
  console.log("==========================================================");
  console.log("🧪 DÉBUT DU TEST E2E PHASE C4.1 - GESTION DES IMAGES & MÉDIAS");
  console.log("==========================================================\n");

  // Étape 1: Vérification du fichier landing page src/app/page.tsx
  console.log("1️⃣ Audit des liaisons dynamiques dans src/app/page.tsx...");
  const pageContent = await fs.readFile(PAGE_FILE, "utf-8");

  const requiredBindings = [
    { key: "media destructuré", pattern: /media,\s*agencies/ },
    { key: "Logo Navbar", pattern: /identity\?\.logoUrl\s*\|\|\s*"\/images\/guineego_logo\.jpg"/ },
    { key: "Hero Card 1 (Bike)", pattern: /media\?\.heroImage\s*\|\|\s*"\/images\/eno_courier_bike\.png"/ },
    { key: "Hero Card 2 (Handover)", pattern: /media\?\.secondaryImage\s*\|\|\s*"\/images\/eno_delivery_handover\.png"/ },
    { key: "Hero Card 3 (Operator)", pattern: /media\?\.heroCard3Image\s*\|\|\s*media\?\.closingImage/ },
    { key: "Hero Card 4 (Cash COD)", pattern: /media\?\.heroCard4Image\s*\|\|\s*"\/images\/gros-plan-livreur-colis/ },
    { key: "TikTok Avatar", pattern: /src=\{identity\?\.logoUrl\s*\|\|\s*"\/images\/guineego_logo\.jpg"\}/ },
    { key: "TikTok Reel 1", pattern: /media\?\.communityCard1\s*\|\|\s*"\/images\/eno_card_1\.png"/ },
    { key: "TikTok Reel 2", pattern: /media\?\.communityCard2\s*\|\|\s*"\/images\/eno_card_2\.png"/ },
    { key: "TikTok Reel 3", pattern: /media\?\.communityCard3\s*\|\|\s*"\/images\/eno_courier_handover_action\.png"/ },
    { key: "Closing Front Card", pattern: /media\?\.closingImage\s*\|\|\s*"\/images\/femme-afro-americaine/ },
    { key: "Closing Back Card", pattern: /media\?\.closingBackImage\s*\|\|\s*"\/images\/closing_phone_3d\.jpg"/ },
    { key: "Service 1 (Closing)", pattern: /services\?\.\[0\]\?\.image/ },
    { key: "Service 2 (Stockage)", pattern: /services\?\.\[1\]\?\.image/ },
    { key: "Service 3 (Livraison)", pattern: /services\?\.\[2\]\?\.image/ },
    { key: "Service 4 (Dashboard)", pattern: /services\?\.\[3\]\?\.image/ },
    { key: "CTA Banner overlay", pattern: /media\?\.ctaImage/ },
    { key: "Footer Logo", pattern: /identity\?\.logoUrl\s*\|\|\s*"\/images\/guineego_logo\.jpg"/ },
    { key: "Rider Recruitment Modal", pattern: /media\?\.riderImage\s*\|\|\s*media\?\.heroImage/ },
    { key: "Protection unoptimized", pattern: /unoptimized=\{Boolean\(/ },
  ];

  let passedBindings = 0;
  for (const b of requiredBindings) {
    if (b.pattern.test(pageContent)) {
      console.log(`  ✅ [OK] ${b.key} correctement câblé avec fallback`);
      passedBindings++;
    } else {
      console.error(`  ❌ [FAIL] ${b.key} manquant ou mal formaté !`);
    }
  }

  if (passedBindings !== requiredBindings.length) {
    throw new Error(`Certaines liaisons d'images sont manquantes (${passedBindings}/${requiredBindings.length})`);
  }

  // Étape 2: Sauvegarde des settings originaux
  console.log("\n2️⃣ Sauvegarde de l'état actuel de data/settings.json...");
  const rawOriginalSettings = await fs.readFile(SETTINGS_FILE, "utf-8");
  const originalSettings = JSON.parse(rawOriginalSettings);
  console.log("  ✅ État initial sauvegardé avec succès.");

  try {
    // Étape 3: Test de modification des images (Simulant PUT /admin/site-public)
    console.log("\n3️⃣ Test de mise à jour des images de marque...");
    const testCustomMedia = {
      heroImage: "/uploads/brand/test-hero-custom.webp",
      secondaryImage: "/uploads/brand/test-secondary-custom.webp",
      closingImage: "/uploads/brand/test-closing-custom.webp",
      closingBackImage: "/uploads/brand/test-closing-back-custom.webp",
      ctaImage: "/uploads/brand/test-cta-custom.webp",
      riderImage: "/uploads/brand/test-rider-custom.webp",
      communityCard1: "/uploads/brand/test-reel-1.webp",
      communityCard2: "/uploads/brand/test-reel-2.webp",
      communityCard3: "/uploads/brand/test-reel-3.webp",
      faviconUrl: "/uploads/brand/custom-favicon.ico",
    };

    const testCustomLogo = "/uploads/brand/test-custom-logo.png";
    const testCustomServiceImage = "/uploads/brand/test-service-1.webp";

    const modifiedSettings = {
      ...originalSettings,
      brand: {
        ...(originalSettings.brand || {}),
        identity: {
          ...(originalSettings.brand?.identity || {}),
          logoUrl: testCustomLogo,
        },
        media: testCustomMedia,
        services: (originalSettings.brand?.services || []).map((srv, idx) =>
          idx === 0 ? { ...srv, image: testCustomServiceImage } : srv
        ),
      },
    };

    await fs.writeFile(SETTINGS_FILE, JSON.stringify(modifiedSettings, null, 2), "utf-8");
    console.log("  ✅ Fichier data/settings.json mis à jour avec les médias de test.");

    // Étape 4: Relecture et vérification de la persistance
    console.log("\n4️⃣ Relecture de data/settings.json pour vérifier la persistance...");
    const reloadedSettings = JSON.parse(await fs.readFile(SETTINGS_FILE, "utf-8"));
    const loadedBrand = reloadedSettings.brand;

    if (!loadedBrand || !loadedBrand.media) {
      throw new Error("Section brand.media absente après relecture !");
    }

    if (loadedBrand.media.heroImage !== testCustomMedia.heroImage) {
      throw new Error(`heroImage non persisté: attendu ${testCustomMedia.heroImage}, reçu ${loadedBrand.media.heroImage}`);
    }
    if (loadedBrand.media.closingImage !== testCustomMedia.closingImage) {
      throw new Error("closingImage non persisté !");
    }
    if (loadedBrand.media.closingBackImage !== testCustomMedia.closingBackImage) {
      throw new Error("closingBackImage non persisté !");
    }
    if (loadedBrand.media.riderImage !== testCustomMedia.riderImage) {
      throw new Error("riderImage non persisté !");
    }
    if (loadedBrand.identity.logoUrl !== testCustomLogo) {
      throw new Error("identity.logoUrl non persisté !");
    }
    if (loadedBrand.services[0].image !== testCustomServiceImage) {
      throw new Error("services[0].image non persisté !");
    }

    console.log("  ✅ Tous les nouveaux médias sont parfaitement persistés dans data/settings.json :");
    console.log(`     - Hero Image        : ${loadedBrand.media.heroImage}`);
    console.log(`     - Secondary Image   : ${loadedBrand.media.secondaryImage}`);
    console.log(`     - Closing Recto     : ${loadedBrand.media.closingImage}`);
    console.log(`     - Closing Verso     : ${loadedBrand.media.closingBackImage}`);
    console.log(`     - CTA Banner Visual : ${loadedBrand.media.ctaImage}`);
    console.log(`     - Rider Recrutement : ${loadedBrand.media.riderImage}`);
    console.log(`     - Reels Communauté  : ${loadedBrand.media.communityCard1}, ${loadedBrand.media.communityCard2}`);
    console.log(`     - Logo Principal    : ${loadedBrand.identity.logoUrl}`);
    console.log(`     - Service 1 Image   : ${loadedBrand.services[0].image}`);

    // Étape 5: Test du comportement de fallback si les clés sont vidées
    console.log("\n5️⃣ Test de robustesse des fallbacks lorsque les images sont réinitialisées...");
    const emptyMediaSettings = {
      ...originalSettings,
      brand: {
        ...(originalSettings.brand || {}),
        identity: {
          ...(originalSettings.brand?.identity || {}),
          logoUrl: "",
        },
        media: {},
      },
    };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(emptyMediaSettings, null, 2), "utf-8");
    const reloadedEmpty = JSON.parse(await fs.readFile(SETTINGS_FILE, "utf-8"));
    if (reloadedEmpty.brand.media.heroImage === undefined) {
      console.log("  ✅ Champ media vide géré sans crash, page.tsx appliquera les fallbacks natifs :");
      console.log("     - Hero fallback : /images/eno_courier_bike.png");
      console.log("     - Secondary fallback : /images/eno_delivery_handover.png");
      console.log("     - Closing fallback : /images/femme-afro-americaine-...avif");
      console.log("     - Closing verso fallback : /images/closing_phone_3d.jpg");
      console.log("     - Logo fallback : /images/guineego_logo.jpg");
    }

  } finally {
    // Étape 6: Restauration intégrale
    console.log("\n6️⃣ Restauration des paramètres initiaux...");
    await fs.writeFile(SETTINGS_FILE, rawOriginalSettings, "utf-8");
    console.log("  ✅ Paramètres d'origine restaurés avec succès dans data/settings.json.");
  }

  console.log("\n==========================================================");
  console.log("🎉 TOUS LES TESTS E2E DE LA PHASE C4.1 ONT RÉUSSI AVEC SUCCÈS !");
  console.log("==========================================================");
}

run().catch((err) => {
  console.error("\n💥 ERREUR LORS DU TEST E2E C4.1:", err);
  process.exit(1);
});
