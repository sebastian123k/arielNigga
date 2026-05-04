const VideoService = require("../services/videoService");

const getAllVideos = async (req, res) => {
  try {
    const { search } = req.query;
    const videos = await VideoService.getAll(search);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener videos" });
  }
};

const createVideo = async (req, res) => {
  try {
    // CAMBIO CLAVE: Extraemos 'titulo' y 'categoria' (nombres en español que envía el form)
    const { titulo, categoria, descripcion } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No se seleccionó ningún archivo de video" });
    }

    const videoUrl = `/uploads/${req.file.filename}`;

    // Enviamos al servicio con los nombres exactos que espera el objeto
    const newVideo = await VideoService.create({
      titulo: titulo, // Ahora sí tendrá valor
      descripcion: descripcion || "Sin descripción",
      categoria: categoria || "General",
      url_video: videoUrl,
    });

    res.status(201).json(newVideo);
  } catch (error) {
    console.error("Error en createVideo:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateVideo = async (req, res) => {
  try {
    // req.body ahora contiene { titulo, descripcion, categoria, url_video }
    const video = await VideoService.update(req.params.id, req.body);

    if (!video) return res.status(404).json({ error: "Video no encontrado" });
    res.json(video);
  } catch (error) {
    console.error("Error en updateVideo:", error);
    res.status(500).json({ error: "Error al actualizar video" });
  }
};

const deleteVideo = async (req, res) => {
  try {
    await VideoService.delete(req.params.id);
    res.json({ message: "Video eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar video" });
  }
};

module.exports = { getAllVideos, createVideo, updateVideo, deleteVideo };
