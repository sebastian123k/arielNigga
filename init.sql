-- Tabla de Videos (Requerimiento: Título, Desc, Categoría)
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    url_video TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Playlists
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario_id INT -- Para identificar quién la creó
);

-- Tabla Intermedia (Relación Muchos a Muchos)
CREATE TABLE IF NOT EXISTS playlist_videos (
    playlist_id INT REFERENCES playlists(id) ON DELETE CASCADE,
    video_id INT REFERENCES videos(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, video_id)
);