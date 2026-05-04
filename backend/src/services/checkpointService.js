const redisClient = require("../config/redis");

const CheckpointService = {
  // Guardar el segundo exacto donde se quedó el usuario
  async saveCheckpoint(userId, videoId, timestamp) {
    const key = `checkpoint:user:${userId}:video:${videoId}`;
    await redisClient.set(key, timestamp);
    return { message: "Checkpoint guardado" };
  },

  // Recuperar el segundo para reanudar
  async getCheckpoint(userId, videoId) {
    const key = `checkpoint:user:${userId}:video:${videoId}`;
    const timestamp = await redisClient.get(key);
    return timestamp || 0; // Si no hay registro, empieza en 0
  },
};

module.exports = CheckpointService;
