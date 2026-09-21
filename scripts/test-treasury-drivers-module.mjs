// Automated test for Treasury Drivers Module
import http from "http";

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3005${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on("error", reject);
  });
}

async function runTests() {
  console.log("=== VÉRIFICATION DU MODULE TRÉSORERIE LIVREURS ===");

  // 1. Tester la route /tresorerie/livreurs
  console.log("\n1. Test de la page /tresorerie/livreurs...");
  const resList = await fetchUrl("/tresorerie/livreurs");
  console.log(`Status /tresorerie/livreurs: ${resList.status}`);
  if (resList.status !== 200) {
    throw new Error(`Échec du chargement de /tresorerie/livreurs (status ${resList.status})`);
  }
  if (!resList.body.includes("Situation financière des livreurs")) {
    throw new Error("Titre attendu non trouvé dans /tresorerie/livreurs");
  }
  console.log("✓ Route /tresorerie/livreurs accessible et rendue avec succès.");

  // 2. Tester la route /tresorerie/livreurs/liv-1
  console.log("\n2. Test de la page /tresorerie/livreurs/liv-1 (Rachad ADECHINA)...");
  const resDetail = await fetchUrl("/tresorerie/livreurs/liv-1");
  console.log(`Status /tresorerie/livreurs/liv-1: ${resDetail.status}`);
  if (resDetail.status !== 200) {
    throw new Error(`Échec du chargement de /tresorerie/livreurs/liv-1 (status ${resDetail.status})`);
  }
  if (!resDetail.body.includes("Rachad ADECHINA") && !resDetail.body.includes("liv-1")) {
    throw new Error("Livreur liv-1 non trouvé dans le contenu");
  }
  console.log("✓ Route /tresorerie/livreurs/liv-1 accessible et rendue avec succès.");

  // 3. Tester la route /tresorerie/ecarts/cmd_002
  console.log("\n3. Test de la page d'écart /tresorerie/ecarts/cmd_002...");
  const resEcart = await fetchUrl("/tresorerie/ecarts/cmd_002");
  console.log(`Status /tresorerie/ecarts/cmd_002: ${resEcart.status}`);
  if (resEcart.status !== 200) {
    throw new Error(`Échec du chargement de /tresorerie/ecarts/cmd_002 (status ${resEcart.status})`);
  }
  console.log("✓ Route /tresorerie/ecarts/[id] accessible et rendue avec succès.");

  console.log("\n==========================================");
  console.log("✓ TOUS LES TESTS HTTP DU MODULE SONT VALIDÉS");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
