import mongoose, { Connection } from "mongoose";
import { db } from "@/db/mongoConnect";
import { Entreprise, IEntreprise } from "@/models/entreprise";
import { getLicenceStatus } from "@/lib/licence";

interface CachedTenantConnection {
  connection: Connection;
  lastUsedAt: number;
}

const tenantConnections = new Map<string, CachedTenantConnection>();
const tenantConnectionPromises = new Map<string, Promise<Connection>>();
const MAX_TENANT_CONNECTIONS = Math.max(1, Number(process.env.TENANT_CONNECTION_CACHE_MAX) || 100);
const TENANT_CONNECTION_IDLE_TTL_MS = Math.max(60_000, Number(process.env.TENANT_CONNECTION_IDLE_TTL_MS) || 15 * 60_000);
const MIN_IDLE_BEFORE_EVICTION_MS = 60_000;
let cleanupPromise: Promise<void> | null = null;

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

async function removeCachedConnection(entrepriseId: string, entry: CachedTenantConnection): Promise<void> {
  if (tenantConnections.get(entrepriseId) !== entry) return;
  tenantConnections.delete(entrepriseId);
  if (entry.connection !== mongoose.connection) {
    await entry.connection.close();
  }
}

async function cleanupTenantConnectionCache(): Promise<void> {
  if (cleanupPromise) return cleanupPromise;

  cleanupPromise = (async () => {
    const now = Date.now();
    const expired = [...tenantConnections.entries()]
      .filter(([entrepriseId, entry]) =>
        now - entry.lastUsedAt >= TENANT_CONNECTION_IDLE_TTL_MS &&
        !tenantConnectionPromises.has(entrepriseId)
      );

    for (const [entrepriseId, entry] of expired) {
      await removeCachedConnection(entrepriseId, entry);
    }

    if (tenantConnections.size < MAX_TENANT_CONNECTIONS) return;

    const leastRecentlyUsed = [...tenantConnections.entries()]
      .filter(([entrepriseId, entry]) =>
        !tenantConnectionPromises.has(entrepriseId) &&
        now - entry.lastUsedAt >= MIN_IDLE_BEFORE_EVICTION_MS
      )
      .sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt);

    while (tenantConnections.size >= MAX_TENANT_CONNECTIONS && leastRecentlyUsed.length > 0) {
      const [entrepriseId, entry] = leastRecentlyUsed.shift()!;
      await removeCachedConnection(entrepriseId, entry);
    }
  })().finally(() => {
    cleanupPromise = null;
  });

  return cleanupPromise;
}

export async function getTenantConnection(entrepriseId?: string): Promise<Connection> {
  if (!entrepriseId || entrepriseId.trim() === "") {
    return getPrimaryConnection();
  }

  // Le statut de licence est revérifié à CHAQUE appel, même si la connexion
  // tenant est déjà en cache : sans ça, une entreprise dont la connexion a été
  // établie avant son blocage (essai expiré, suspension, maintenance impayée)
  // continuerait d'accéder à ses données tant que le connection cache n'est
  // pas invalidé (ex: redémarrage serveur). Le message est le même que celui
  // utilisé partout ailleurs (bannière, login) pour rester cohérent.
  await getPrimaryConnection();
  const entreprise = await Entreprise.findById(entrepriseId).lean<IEntreprise | null>();

  if (!entreprise) {
    throw new Error("Entreprise introuvable");
  }

  const licenceStatus = getLicenceStatus(entreprise);
  if (licenceStatus.isBlocked) {
    const message = licenceStatus.alerts[0]?.message || "Licence invalide ou expirée";
    throw new Error(message);
  }

  const cached = tenantConnections.get(entrepriseId);
  if (cached?.connection.readyState === 1) {
    cached.lastUsedAt = Date.now();
    return cached.connection;
  }
  if (cached) {
    tenantConnections.delete(entrepriseId);
  }

  const existingPromise = tenantConnectionPromises.get(entrepriseId);
  if (existingPromise) {
    return existingPromise;
  }

  await cleanupTenantConnectionCache();

  const promise = (async (): Promise<Connection> => {
    const primaryConn = await getPrimaryConnection();
    const mongoUri = entreprise.mongoUri || process.env.MONGO_URI;
    const dbName = entreprise.dbName || extractDbNameFromUri(mongoUri || "") || "bd_esaymed";

    if (!mongoUri || getSameConnection(primaryConn, mongoUri, dbName)) {
      return primaryConn;
    }

    const connection = mongoose.createConnection(mongoUri, {
      dbName,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 10_000,
    });

    connection.on("error", (error) => {
      console.error(`Erreur connexion tenant ${entrepriseId}:`, error);
      if (tenantConnections.get(entrepriseId)?.connection === connection) {
        tenantConnections.delete(entrepriseId);
      }
      tenantConnectionPromises.delete(entrepriseId);
    });

    connection.on("disconnected", () => {
      console.warn(`Déconnexion du tenant ${entrepriseId}`);
      if (tenantConnections.get(entrepriseId)?.connection === connection) {
        tenantConnections.delete(entrepriseId);
      }
      tenantConnectionPromises.delete(entrepriseId);
    });

    await connection.asPromise();

    tenantConnections.set(entrepriseId, { connection, lastUsedAt: Date.now() });
    return connection;
  })();

  tenantConnectionPromises.set(entrepriseId, promise);
  try {
    return await promise;
  } finally {
    if (tenantConnectionPromises.get(entrepriseId) === promise) {
      tenantConnectionPromises.delete(entrepriseId);
    }
  }
}

export function getCachedTenantConnection(entrepriseId: string): Connection | undefined {
  const cached = tenantConnections.get(entrepriseId);
  if (cached?.connection.readyState !== 1) return undefined;
  cached.lastUsedAt = Date.now();
  return cached.connection;
}

export async function closeTenantConnection(entrepriseId: string): Promise<void> {
  const cached = tenantConnections.get(entrepriseId);
  tenantConnections.delete(entrepriseId);
  tenantConnectionPromises.delete(entrepriseId);
  if (cached?.connection && cached.connection !== mongoose.connection) {
    await cached.connection.close();
  }
}

export async function closeAllTenantConnections(): Promise<void> {
  const promises: Promise<void>[] = [];
  tenantConnections.forEach(({ connection }) => {
    if (connection !== mongoose.connection) {
      promises.push(connection.close());
    }
  });
  tenantConnections.clear();
  tenantConnectionPromises.clear();
  await Promise.all(promises);
}
