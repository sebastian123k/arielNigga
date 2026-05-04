const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const videoController = require("../controllers/videoController");
const CheckpointService = require("../services/checkpointService");

// --- RUTAS DE CATÁLOGO ---
// Usamos el objeto videoController para todas las rutas
router.get("/", videoController.getAllVideos);
router.post("/", upload.single("video"), videoController.createVideo);
router.put("/:id", videoController.updateVideo);
router.delete("/:id", videoController.deleteVideo);

// --- RUTAS DE CHECKPOINTS (Estado en Redis) ---
router.post("/checkpoint", async (req, res) => {
  try {
    const { userId, videoId, timestamp } = req.body;
    await CheckpointService.saveCheckpoint(userId, videoId, timestamp);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/checkpoint/:userId/:videoId", async (req, res) => {
  try {
    const { userId, videoId } = req.params;
    const timestamp = await CheckpointService.getCheckpoint(userId, videoId);
    res.json({ timestamp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
