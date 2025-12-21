/**
 * Redis Client Configuration with Development Fallback
 * Provides in-memory fallback when Redis is not available
 */

let redisClient = null;

try {
    const Redis = require('redis');
    
    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
    };

    redisClient = Redis.createClient(redisConfig);
    
    redisClient.on('error', (err) => {
        console.warn('⚠️  Redis connection error, falling back to memory store');
        redisClient = null;
    });

    redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });

    // Try to connect
    (async () => {
        try {
            await redisClient.connect();
        } catch (error) {
            console.warn('⚠️  Redis not available, using memory fallback');
            redisClient = null;
        }
    })();
    
} catch (error) {
    console.warn('⚠️  Redis client not available, using in-memory fallback');
    redisClient = null;
}

// In-memory fallback for development
if (!redisClient) {
    const memoryStore = new Map();
    
    redisClient = {
        get: async (key) => memoryStore.get(key) || null,
        set: async (key, value) => memoryStore.set(key, value),
        setex: async (key, ttl, value) => {
            memoryStore.set(key, value);
            setTimeout(() => memoryStore.delete(key), ttl * 1000);
        },
        del: async (key) => memoryStore.delete(key),
        exists: async (key) => memoryStore.has(key) ? 1 : 0,
        incr: async (key) => {
            const current = parseInt(memoryStore.get(key) || '0');
            const newValue = current + 1;
            memoryStore.set(key, newValue.toString());
            return newValue;
        },
        expire: async (key, ttl) => {
            setTimeout(() => memoryStore.delete(key), ttl * 1000);
        },
        ttl: async (key) => {
            return memoryStore.has(key) ? 300 : -1;
        },
        flushDb: async () => {
            memoryStore.clear();
        },
        info: async () => 'used_memory:1024\n',
        ping: async () => 'PONG',
        call: async (...args) => {
            const [command, ...params] = args;
            const cmd = command.toLowerCase();
            
            if (cmd === 'get') return memoryStore.get(params[0]) || null;
            if (cmd === 'set') return memoryStore.set(params[0], params[1]);
            if (cmd === 'del') return memoryStore.delete(params[0]);
            if (cmd === 'exists') return memoryStore.has(params[0]) ? 1 : 0;
            if (cmd === 'incr') {
                const current = parseInt(memoryStore.get(params[0]) || '0');
                const newValue = current + 1;
                memoryStore.set(params[0], newValue.toString());
                return newValue;
            }
            return null;
        },
        isReady: false,
        status: 'memory_fallback',
    };
}

module.exports = redisClient;
