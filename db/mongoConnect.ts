// lib/db.ts
import mongoose from "mongoose";

let isConnected = false;

export const db = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: "bd_esaymed", // Nom de ta base
    });
    isConnected = true;
    console.log("✅ Connecté à MongoDB");
  } catch (error) {
    console.error("❌ Erreur MongoDB:", error);
    throw new Error("Impossible de se connecter à MongoDB");
  }
};



/* import mongoose from "mongoose";

let isConnected = false;

export const db = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: "bd_esaymed",
    });
    isConnected = true;
    console.log("✅ Connexion MongoDB réussie");
  } catch (error) {
    console.error("❌ Erreur connexion MongoDB:", error);
    throw new Error("Impossible de se connecter à MongoDB");
  }
};
 */
