import "server-only";
import mongoose from "mongoose";
import { env } from "./env";

// Mémoire de la connexion, conservée entre les rechargements de Next.js
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};
globalForMongoose.mongooseCache = cache;

/**
 * Ouvre la connexion à MongoDB (une seule fois) et la réutilise ensuite.
 * À appeler au début de toute fonction qui lit ou écrit dans la base.
 */
export async function connectDB() {
  // 1. Déjà connecté : on réutilise
  if (cache.conn) return cache.conn;

  // 2. Pas encore de connexion en cours : on la lance
  if (!cache.promise) {
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false, // erreur immédiate si la base n'est pas connectée
      serverSelectionTimeoutMS: 5000, // abandonne après 5 secondes si MongoDB ne répond pas
    });
  }

  // 3. On attend la fin de la connexion
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // en cas d'échec, on pourra réessayer la prochaine fois
    throw error;
  }

  return cache.conn;
}
