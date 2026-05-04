require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const videoRoutes = require("./routes/videoRoutes");
const playlistRoutes = require("./routes/playlistRoutes");

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// 1. Servir archivos estáticos
// Al estar en backend/src/, subimos un nivel para encontrar backend/frontend/
// Ahora esto funcionará dentro de Docker porque el frontend se copiará al hacer el build.
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- RUTAS DE LA API ---
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor Video Cloud Hub funcionando con Frontend integrado",
  });
});

app.use("/api/videos", videoRoutes);
app.use("/api/playlists", playlistRoutes);

// 2. Manejador de rutas (SPA Friendly)
// Si el usuario refresca la página o entra a una ruta que no es de la API, servimos el index.html
app.use((req, res, next) => {
  if (!req.url.startsWith("/api")) {
    res.sendFile(path.join(frontendPath, "index.html"));
  } else {
    res.status(404).json({ error: "Ruta de API no encontrada" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
  console.log(`📂 Sirviendo frontend desde: ${frontendPath}`);
});
