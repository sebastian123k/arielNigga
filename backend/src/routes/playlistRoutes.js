const express = require("express");
const router = express.Router();
const {
  getAllPlaylists,
  createPlaylist,
  addVideo,
  getPlaylistContent,
  deletePlaylist, // <--- NUEVO
  removeVideoFromPlaylist // <--- NUEVO
} = require("../controllers/playlistController");

router.get("/", getAllPlaylists);
router.post("/", createPlaylist);
router.post("/add-video", addVideo);
router.get("/:id", getPlaylistContent);

// --- ESTAS SON LAS QUE FALTABAN ---
router.delete("/remove-video", removeVideoFromPlaylist); // Quitar video de lista
router.delete("/:id", deletePlaylist); // Borrar la lista completa

module.exports = router;