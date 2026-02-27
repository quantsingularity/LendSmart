/**
 * Redis Client Configuration with Development Fallback
 * Provides in-memory fallback when Redis is not available
 */

// In-memory fallback for development
const memoryStore = new Map();

const memoryClient = {
  get: async (key) => memoryStore.get(key) || null,
  set: async (key, value) => {
    memoryStore.set(key, value);
    return "OK";
  },
  setEx: async (key, ttl, value) => {
    memoryStore.set(key, value);
    setTimeout(() => memoryStore.delete(key), ttl * 1000);
    return "OK";
  },
  setex: async (key, ttl, value) => {
    memoryStore.set(key, value);
    setTimeout(() => memoryStore.delete(key), ttl * 1000);
    return "OK";
  },
  del: async (key) => {
    const deleted = memoryStore.delete(key);
    return deleted ? 1 : 0;
  },
  exists: async (key) => (memoryStore.has(key) ? 1 : 0),
  incr: async (key) => {
    const current = parseInt(memoryStore.get(key) || "0");
    const newValue = current + 1;
    memoryStore.set(key, newValue.toString());
    return newValue;
  },
  expire: async (key, ttl) => {
    if (memoryStore.has(key)) {
      setTimeout(() => memoryStore.delete(key), ttl * 1000);
      return 1;
    }
    return 0;
  },
  ttl: async (key) => {
    return memoryStore.has(key) ? 300 : -1;
  },
  flushDb: async () => {
    memoryStore.clear();
    return "OK";
  },
  info: async () => "used_memory:1024\n",
  ping: async () => "PONG",
  call: async (...args) => {
    const [command, ...params] = args;
    const cmd = command.toLowerCase();

    if (cmd === "get") return memoryStore.get(params[0]) || null;
    if (cmd === "set") {
      memoryStore.set(params[0], params[1]);
      return "OK";
    }
    if (cmd === "del") return memoryStore.delete(params[0]) ? 1 : 0;
    if (cmd === "exists") return memoryStore.has(params[0]) ? 1 : 0;
    if (cmd === "incr") {
      const current = parseInt(memoryStore.get(params[0]) || "0");
      const newValue = current + 1;
      memoryStore.set(params[0], newValue.toString());
      return newValue;
    }
    return null;
  },
  isReady: true,
  status: "memory_fallback",
};

let redisClient = null;

// Try to connect to real Redis if configured
if (
  process.env.REDIS_HOST &&
  process.env.REDIS_HOST !== "localhost" &&
  process.env.SKIP_DB_CONNECTION !== "true"
) {
  try {
    const Redis = require("redis");

    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    };

    redisClient = Redis.createClient(redisConfig);

    redisClient.on("error", (err) => {
      console.warn("⚠️  Redis connection error, using memory fallback");
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });

    // Try to connect (don't await to prevent blocking)
    redisClient.connect().catch((error) => {
      console.warn("⚠️  Redis connection failed, using memory fallback");
      redisClient = memoryClient;
    });
  } catch (error) {
    console.warn(
      "⚠️  Redis client initialization failed, using memory fallback",
    );
    redisClient = memoryClient;
  }
} else {
  console.warn(
    "⚠️  Redis not configured or DB connection skipped, using memory fallback",
  );
  redisClient = memoryClient;
}

// Export memory client by default, will be replaced if Redis connects
module.exports = redisClient || memoryClient;
