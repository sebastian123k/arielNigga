const db = require("../config/db");

const PlaylistService = {
  // Obtener todas las playlists
  async getAllPlaylists() {
    const query = "SELECT * FROM playlists ORDER BY id DESC";
    const { rows } = await db.query(query);
    return rows;
  },

  // Crear una nueva lista
  async createPlaylist(nombre, usuario_id) {
    const query =
      "INSERT INTO playlists (nombre, usuario_id) VALUES ($1, $2) RETURNING *";
    const { rows } = await db.query(query, [nombre, usuario_id]);
    return rows[0];
  },

  // Agregar un video a una lista (Relación Muchos a Muchos)
  async addVideoToPlaylist(playlistId, videoId) {
    const query =
      "INSERT INTO playlist_videos (playlist_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING";
    await db.query(query, [playlistId, videoId]);
    return { message: "Video agregado a la playlist" };
  },

  // Obtener una playlist con todos sus videos
  async getPlaylistWithVideos(playlistId) {
    const query = `
      SELECT p.nombre as playlist_nombre, v.* FROM playlists p
      JOIN playlist_videos pv ON p.id = pv.playlist_id
      JOIN videos v ON pv.video_id = v.id
      WHERE p.id = $1
    `;
    const { rows } = await db.query(query, [playlistId]);
    return rows;
  },

  // --- NUEVAS FUNCIONES ---

  // Borrar la playlist completa (primero limpia la tabla intermedia)
  async deletePlaylist(id) {
    // 1. Borrar referencias en la tabla intermedia para que no de error de llave foránea
    await db.query("DELETE FROM playlist_videos WHERE playlist_id = $1", [id]);
    // 2. Borrar la playlist
    const query = "DELETE FROM playlists WHERE id = $1";
    return await db.query(query, [id]);
  },

  // Quitar un video de la playlist (Solo borra la relación, NO el video)
  async removeVideoFromPlaylist(playlistId, videoId) {
    const query = "DELETE FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2";
    return await db.query(query, [playlistId, videoId]);
  }
};

module.exports = PlaylistService;