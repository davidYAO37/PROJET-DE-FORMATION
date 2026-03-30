import mongoose from "mongoose";

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

/* // lib/db.ts
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
}; */