import mongoose from "mongoose";

// Importer tous les modèles pour garantir leur enregistrement
import "../models";

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI non défini dans .env");
}

// cache global (important pour Next.js)
let cached = (global as any).mongoose || { conn: null, promise: null };

export const db = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      dbName: "bd_esaymed",
    }).then((mongooseInstance) => {
      console.log("✅ Connecté à MongoDB");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("❌ Erreur MongoDB:", error);
    throw error;
  }

  return cached.conn;
};