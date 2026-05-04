const redis = require("redis");

// Si process.env.REDIS_PORT es undefined, usará 6379 por defecto
const host = process.env.REDIS_HOST || "redis-cache";
const port = process.env.REDIS_PORT || 6379;

const client = redis.createClient({
  url: `redis://${host}:${port}`,
});

client.on("error", (err) => console.error("❌ Error en Redis:", err));
client.on("connect", () => console.log("✅ Conectado a Redis"));

client.connect().catch((err) => {
  console.error("No se pudo conectar a Redis al inicio:", err);
});

module.exports = client;
