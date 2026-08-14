import { db } from "@/db/mongoConnect";
import { LicencePlan } from "@/models/licencePlan";
import { DEFAULT_LICENCE_PLANS } from "@/lib/licenceDefaults";

async function main() {
  await db();

  for (const plan of DEFAULT_LICENCE_PLANS) {
    await LicencePlan.findOneAndUpdate(
      { code: plan.code },
      { $setOnInsert: plan },
      { upsert: true, new: true }
    );
    console.log(`Plan "${plan.code}" initialisé.`);
  }

  console.log("Initialisation des plans de licence terminée.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur initialisation plans licence:", err);
  process.exit(1);
});
