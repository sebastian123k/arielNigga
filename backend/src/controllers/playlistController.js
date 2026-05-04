const PlaylistService = require("../services/playlistService");

const getAllPlaylists = async (req, res) => {
  try {
    const playlists = await PlaylistService.getAllPlaylists();
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las listas" });
  }
};

const createPlaylist = async (req, res) => {
  try {
    const { nombre, usuario_id } = req.body;
    const playlist = await PlaylistService.createPlaylist(nombre, usuario_id);
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la playlist" });
  }
};

const addVideo = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;
    await PlaylistService.addVideoToPlaylist(playlistId, videoId);
    res.json({ message: "Video vinculado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al vincular video" });
  }
};

const getPlaylistContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await PlaylistService.getPlaylistWithVideos(id);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contenido" });
  }
};

// --- NUEVAS FUNCIONES ---

const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    await PlaylistService.deletePlaylist(id);
    res.json({ message: "Playlist eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la playlist" });
  }
};

const removeVideoFromPlaylist = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;
    await PlaylistService.removeVideoFromPlaylist(playlistId, videoId);
    res.json({ message: "Video removido de la playlist" });
  } catch (error) {
    res.status(500).json({ error: "Error al remover el video" });
  }
};

module.exports = {
  getAllPlaylists,
  createPlaylist,
  addVideo,
  getPlaylistContent,
  deletePlaylist,            // <--- Exportada
  removeVideoFromPlaylist,    // <--- Exportada
};