const db = require("../config/db");

const VideoService = {
  // BUSCADOR: Filtra por título si existe el parámetro 'search'
  async getAll(search = "") {
    const query = "SELECT * FROM videos WHERE titulo ILIKE $1 ORDER BY id DESC";
    const values = [`%${search}%` || "%%"];
    const { rows } = await db.query(query, values);
    return rows;
  },

  async create(data) {
    const { titulo, descripcion, categoria, url_video } = data;
    const query =
      "INSERT INTO videos (titulo, descripcion, categoria, url_video) VALUES ($1, $2, $3, $4) RETURNING *";
    const { rows } = await db.query(query, [
      titulo,
      descripcion,
      categoria,
      url_video,
    ]);
    return rows[0];
  },

  // UPDATE: Edita un video existente
  async update(id, data) {
    const { titulo, descripcion, categoria, url_video } = data;
    const query = `
      UPDATE videos 
      SET titulo = $1, descripcion = $2, categoria = $3, url_video = $4 
      WHERE id = $5 RETURNING *`;
    const { rows } = await db.query(query, [
      titulo,
      descripcion,
      categoria,
      url_video,
      id,
    ]);
    return rows[0];
  },

  // DELETE: Elimina un video
  async delete(id) {
    const query = "DELETE FROM videos WHERE id = $1";
    await db.query(query, [id]);
    return { message: "Video eliminado correctamente" };
  },
};

module.exports = VideoService;
