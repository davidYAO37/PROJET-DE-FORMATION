import mongoose, { Connection } from "mongoose";
import { db } from "@/db/mongoConnect";
import { Entreprise, IEntreprise } from "@/models/entreprise";

const tenantConnections = new Map<string, Connection>();
const tenantConnectionPromises = new Map<string, Promise<Connection>>();

export async function getPrimaryConnection(): Promise<Connection> {
  await db();
  return mongoose.connection;
}

function extractDbNameFromUri(uri: string): string | undefined {
  try {
    const url = new URL(uri);
    const pathname = url.pathname.replace(/^\/+/, "");
    return pathname || undefined;
  } catch {
    return undefined;
  }
}

function getSameConnection(
  primary: Connection,
  mongoUri?: string,
  dbName?: string
): boolean {
  if (!mongoUri) return true;
  try {
    const primaryUri = primary.host;
    const tenantUrl = new URL(mongoUri);
    const tenantHost = tenantUrl.host;
    const tenantDb = dbName || extractDbNameFromUri(mongoUri) || "bd_esaymed";
    const primaryDb = primary.db?.databaseName;
    return primaryUri === tenantHost && (!tenantDb || tenantDb === primaryDb);
  } catch {
    return false;
  }
}

export async function getTenantConnection(entrepriseId?: string): Promise<Connection> {
  if (!entrepriseId || entrepriseId.trim() === "") {
    return getPrimaryConnection();
  }

  const cached = tenantConnections.get(entrepriseId);
  if (cached && cached.readyState === 1) {
    return cached;
  }

  const existingPromise = tenantConnectionPromises.get(entrepriseId);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async (): Promise<Connection> => {
    const primaryConn = await getPrimaryConnection();
    const entreprise = await Entreprise.findById(entrepriseId).lean<IEntreprise | null>();

    if (!entreprise) {
      throw new Error("Entreprise introuvable");
    }

    if (entreprise.isActive === false || entreprise.statut === "suspendue" || entreprise.statut === "resiliee") {
      throw new Error("Entreprise inactive ou suspendue");
    }

    if (entreprise.dateExpiration && new Date(entreprise.dateExpiration) < new Date()) {
      throw new Error("Licence expirée");
    }

    const mongoUri = entreprise.mongoUri || process.env.MONGO_URI;
    const dbName = entreprise.dbName || extractDbNameFromUri(mongoUri || "") || "bd_esaymed";

    if (!mongoUri || getSameConnection(primaryConn, mongoUri, dbName)) {
      tenantConnections.set(entrepriseId, primaryConn);
      return primaryConn;
    }

    const connection = mongoose.createConnection(mongoUri, {
      dbName,
      maxPoolSize: 10,
    });

    connection.on("error", (error) => {
      console.error(`Erreur connexion tenant ${entrepriseId}:`, error);
      tenantConnections.delete(entrepriseId);
      tenantConnectionPromises.delete(entrepriseId);
    });

    connection.on("disconnected", () => {
      console.warn(`Déconnexion du tenant ${entrepriseId}`);
      tenantConnections.delete(entrepriseId);
      tenantConnectionPromises.delete(entrepriseId);
    });

    await connection.asPromise();

    tenantConnections.set(entrepriseId, connection);
    return connection;
  })();

  tenantConnectionPromises.set(entrepriseId, promise);
  return promise;
}

export function getCachedTenantConnection(entrepriseId: string): Connection | undefined {
  const cached = tenantConnections.get(entrepriseId);
  return cached && cached.readyState === 1 ? cached : undefined;
}

export async function closeAllTenantConnections(): Promise<void> {
  const promises: Promise<void>[] = [];
  tenantConnections.forEach((connection) => {
    if (connection !== mongoose.connection) {
      promises.push(connection.close());
    }
  });
  tenantConnections.clear();
  tenantConnectionPromises.clear();
  await Promise.all(promises);
}
