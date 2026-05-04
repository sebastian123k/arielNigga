const API_URL = "http://localhost:3000/api/videos";
const PLAYLIST_API = "http://localhost:3000/api/playlists";
const USER_ID = 1;
let currentVideoId = null;
let currentPlaylistId = null;
let saveInterval = null;
let editingVideoId = null;

// --- 1. INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  fetchVideos();
  fetchPlaylists();
  setupSearch();
  setupForms();
  setupNavigation();
});

// --- 2. GESTIÓN DEL CATÁLOGO (READ) ---
async function fetchVideos(search = "") {
  try {
    const res = await fetch(`${API_URL}?search=${search}`);
    const videos = await res.json();
    renderVideos(videos);
  } catch (err) {
    console.error("Error al cargar la colección:", err);
  }
}

function renderVideos(videos) {
    const grid = document.getElementById("videoGrid");
    if (videos.length === 0) {
        grid.innerHTML = `<p class="empty-msg">No archives found.</p>`;
        return;
    }

    grid.innerHTML = videos.map(v => {
        const deleteAction = currentPlaylistId
            ? `removeFromPlaylist(${v.id})`
            : `deleteVideo(${v.id})`;
        const deleteLabel = currentPlaylistId ? "Remove" : "Delete";

        return `
        <div class="video-item">
            <div class="item-thumb" onclick="openPlayer(${v.id}, '${v.url_video}', '${v.titulo}')">
                <div class="thumb-overlay">
                    <div class="play-dot">▶</div>
                </div>
            </div>
            <div class="item-meta">
                <span class="category-tag">${v.categoria || "General"}</span>
                <h4 class="item-title">${v.titulo}</h4>
                <p class="item-desc">${v.descripcion || ""}</p>
            </div>
            <div class="item-actions">
                <button onclick="promptAddToPlaylist(${v.id})" class="action-btn action-accent">+ List</button>
                <button onclick="openEditor(${v.id})" class="action-btn">Edit</button>
                <button onclick="${deleteAction}" class="action-btn action-danger">${deleteLabel}</button>
            </div>
        </div>`;
    }).join("");
}
// --- 3. REPRODUCTOR Y CHECKPOINTS ---
async function openPlayer(id, url, titulo) {
  currentVideoId = id;
  document.getElementById("playingTitle").innerText = titulo;
  const player = document.getElementById("videoPlayer");
  const playerOverlay = document.getElementById("playerOverlay");

  player.src = url;

  let time = 0;

  // Intentar recuperar desde el backend (Redis)
  try {
    const res = await fetch(`${API_URL}/checkpoint/${USER_ID}/${id}`);
    if (res.ok) {
      const { timestamp } = await res.json();
      time = parseFloat(timestamp) || 0;
    }
  } catch (err) {}

  // Si el backend no devolvió un tiempo válido, usar localStorage como respaldo
  if (!time) {
    time = parseFloat(localStorage.getItem(`ckpt_${id}`)) || 0;
  }

  if (time > 5) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    document.getElementById("resumeTimeLabel").innerText =
      `${min}:${sec < 10 ? "0" : ""}${sec}`;
    document.getElementById("resumeModal").classList.remove("hidden");

    document.getElementById("btnResume").onclick = () => {
      player.currentTime = time;
      startPlayback();
    };
    document.getElementById("btnDismiss").onclick = () => startPlayback();
  } else {
    startPlayback();
  }

  function startPlayback() {
    document.getElementById("resumeModal").classList.add("hidden");
    playerOverlay.classList.remove("hidden");
    player.play();
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(() => saveProgress(player.currentTime), 5000);
  }
}

function closePlayer() {
  const player = document.getElementById("videoPlayer");
  saveProgress(player.currentTime);
  player.pause();
  clearInterval(saveInterval);
  document.getElementById("playerOverlay").classList.add("hidden");
}

function saveProgress(time) {
  if (!currentVideoId || !time) return;
  // Guardar siempre en localStorage como respaldo confiable
  localStorage.setItem(`ckpt_${currentVideoId}`, time);
  // También intentar guardar en el backend si Redis está disponible
  fetch(`${API_URL}/checkpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: USER_ID,
      videoId: currentVideoId,
      timestamp: time,
    }),
  }).catch(() => {});
}

// --- 4. MODALES Y FORMULARIOS ---

// Modal de Carga (Nuevo)
function openModal() {
  document.getElementById("uploadForm").reset();
  document.getElementById("fileNameDisplay").innerText =
    "Click to browse or drag video here";
  document.getElementById("uploadModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("uploadModal").classList.add("hidden");
}

// Modal de Edición (Metadata)
async function openEditor(id) {
  editingVideoId = id;
  const res = await fetch(API_URL);
  const videos = await res.json();
  const video = videos.find((v) => v.id === id);

  if (video) {
    document.getElementById("editTitulo").value = video.titulo;
    document.getElementById("editDescripcion").value = video.descripcion;
    document.getElementById("editCategoria").value = video.categoria;
    document.getElementById("editUrl").value = video.url_video; // Solo lectura ahora
    document.getElementById("editorModal").classList.remove("hidden");
  }
}

function closeEditor() {
  document.getElementById("editorModal").classList.add("hidden");
}

function setupForms() {
  // A. Lógica para SUBIR NUEVO VIDEO (Usa FormData)
  document
    .getElementById("uploadForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append("titulo", document.getElementById("uploadTitle").value);
      formData.append(
        "categoria",
        document.getElementById("uploadCategory").value,
      );
      formData.append(
        "descripcion",
        document.getElementById("uploadDescription").value,
      );
      formData.append("video", document.getElementById("videoFile").files[0]);

      const xhr = new XMLHttpRequest();
      const progressContainer = document.getElementById("progressContainer");
      const progressBar = document.getElementById("progressBar");
      const progressPercent = document.getElementById("progressPercent");

      // 1. Mostrar la barra al iniciar
      progressContainer.classList.remove("hidden");

      // 2. Rastrear el progreso
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          progressBar.style.width = percentComplete + "%";
          progressPercent.innerText = percentComplete + "%";
        }
      };

      // 3. Manejar la respuesta
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          alert("¡Archivo indexado correctamente!");
          closeModal();
          fetchVideos();
        } else {
          alert("Error en el servidor: " + xhr.responseText);
        }
        progressContainer.classList.add("hidden");
      };

      xhr.onerror = () => {
        alert("Error de red o conexión fallida.");
        progressContainer.classList.add("hidden");
      };

      // 4. Enviar
      xhr.open("POST", API_URL);
      xhr.send(formData);
    });

  // B. Lógica para EDITAR METADATOS (Sigue siendo JSON)
  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Recolectamos todos los campos, incluyendo la URL (aunque sea readonly)
    const data = {
      titulo: document.getElementById("editTitulo").value,
      descripcion: document.getElementById("editDescripcion").value,
      categoria: document.getElementById("editCategoria").value,
      url_video: document.getElementById("editUrl").value, // ¡Esta es la línea clave!
    };

    try {
      await fetch(`${API_URL}/${editingVideoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      closeEditor();
      fetchVideos();
    } catch (err) {
      alert("Error al actualizar metadatos");
    }
  });

 // --- ACTUALIZAR EN setupForms() SECCIÓN C ---
document.getElementById("playlistForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("playlistName").value.trim();
    
    try {
        // 1. Validar duplicados localmente antes de enviar
        const res = await fetch(PLAYLIST_API);
        const playlists = await res.json();
        
        const existe = playlists.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());
        if (existe) {
            alert("Ya existe una playlist con ese nombre. Elige otro.");
            return;
        }

        // 2. Si no existe, crear
        await fetch(PLAYLIST_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, usuario_id: USER_ID }),
        });
        
        closePlaylistModal();
        fetchPlaylists();
    } catch (err) {
        alert("Error al procesar la playlist");
    }
});

// --- AÑADIR ESTA FUNCIÓN NUEVA ---
async function deletePlaylist(id, e) {
    e.stopPropagation(); // Evita que se abra la playlist al hacer clic en borrar
    if (confirm("¿Borrar esta playlist? (Los videos seguirán en la librería)")) {
        try {
            await fetch(`${PLAYLIST_API}/${id}`, { method: "DELETE" });
            if (currentPlaylistId === id) {
                currentPlaylistId = null;
                document.getElementById("sectionTitle").innerText = "Video Library";
                fetchVideos();
            }
            fetchPlaylists();
        } catch (err) {
            alert("Error al borrar la playlist");
        }
    }
 }
}

// --- 5. OTROS EVENTOS ---
async function deleteVideo(id) {
  if (confirm("¿Estás seguro de que deseas eliminar este activo?")) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchVideos();
    } catch (err) {
      console.error(err);
    }
  }
}

function setupSearch() {
  document
    .getElementById("searchInput")
    .addEventListener("input", (e) => fetchVideos(e.target.value));
}

function setupNavigation() {
  document.getElementById("navLibrary").onclick = (e) => {
    e.preventDefault();
    currentPlaylistId = null;
    document.getElementById("sectionTitle").innerText = "Video Library";
    fetchVideos();
  };
}

// Reutilizamos tus funciones de Playlists existentes...
async function fetchPlaylists() {
  try {
    const res = await fetch(PLAYLIST_API);
    const playlists = await res.json();
    renderPlaylistSidebar(playlists);
  } catch (err) {
    console.error("Error al cargar playlists:", err);
  }
}

function renderPlaylistSidebar(playlists) {
    const container = document.getElementById("playlistSidebarList");
    container.innerHTML = playlists
        .map(p => `
            <a href="#" onclick="loadPlaylistContent(${p.id}, '${p.nombre}')" class="playlist-pill">
                <span class="pill-hash">#</span>${p.nombre}
                <button onclick="deletePlaylist(${p.id}, event)" class="pill-del">×</button>
            </a>
        `).join("");
}

async function loadPlaylistContent(id, nombre) {
  currentPlaylistId = id;
  document.getElementById("sectionTitle").innerText = nombre;
  try {
    const res = await fetch(`${PLAYLIST_API}/${id}`);
    const videos = await res.json();
    renderVideos(videos);
  } catch (err) {
    console.error("Error al cargar contenido de la playlist:", err);
  }
}

function openPlaylistModal() {
  document.getElementById("playlistModal").classList.remove("hidden");
}
function closePlaylistModal() {
  document.getElementById("playlistModal").classList.add("hidden");
}

// --- 6. GESTIÓN DE SELECCIÓN DE PLAYLIST (MODAL ESTILIZADO) ---

let pendingVideoId = null;

async function promptAddToPlaylist(videoId) {
  pendingVideoId = videoId;
  const modal = document.getElementById("selectPlaylistModal");
  const container = document.getElementById("playlistOptionsList");
  
  try {
    const res = await fetch(PLAYLIST_API);
    const playlists = await res.json();

    if (playlists.length === 0) {
      alert("No hay playlists creadas. Crea una en el panel lateral primero.");
      return;
    }

    container.innerHTML = playlists.map(p => `
      <button onclick="confirmAddToPlaylist(${p.id})" class="playlist-option">
        <span class="po-name"># ${p.nombre}</span>
        <span class="po-plus">+</span>
      </button>
    `).join("");

    modal.classList.remove("hidden");
  } catch (err) {
    console.error("Error al cargar playlists:", err);
  }
}

function closeSelectPlaylistModal() {
  document.getElementById("selectPlaylistModal").classList.add("hidden");
  pendingVideoId = null;
}

async function confirmAddToPlaylist(playlistId) {
  if (!pendingVideoId) return;

  try {
    const res = await fetch(`${PLAYLIST_API}/add-video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId, videoId: pendingVideoId }),
    });

    if (res.ok) {
      closeSelectPlaylistModal();
      alert("Added to playlist!");
    }
  } catch (err) {
    alert("Error vinculando el video.");
  }
}

async function removeFromPlaylist(videoId) {
    if (!currentPlaylistId) return;
    
    if (confirm("¿Quitar este video de la playlist? El video seguirá disponible en tu librería.")) {
        try {
            await fetch(`${PLAYLIST_API}/remove-video`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playlistId: currentPlaylistId, videoId: videoId }),
            });
            // Recargar el contenido de la playlist actual
            const nombreActual = document.getElementById("sectionTitle").innerText;
            loadPlaylistContent(currentPlaylistId, nombreActual);
        } catch (err) {
            alert("Error al quitar el video de la playlist");
        }
    }
}

async function deletePlaylist(id, e) {
    if (e) e.stopPropagation(); 
    
    console.log("Intentando borrar playlist con ID:", id); // Mira esto en la consola (F12)

    if (!confirm("¿Borrar esta playlist por completo?")) return;

    try {
        // Fíjate bien en la URL: PLAYLIST_API suele ser http://localhost:3000/api/playlists
        const res = await fetch(`${PLAYLIST_API}/${id}`, { 
            method: "DELETE" 
        });

        if (res.ok) {
            // Si estábamos viendo esa playlist, volvemos a la librería
            if (currentPlaylistId == id) {
                currentPlaylistId = null;
                document.getElementById("sectionTitle").innerText = "Video Library";
                fetchVideos();
            }
            // Refrescar el sidebar
            fetchPlaylists();
        } else {
            const errorText = await res.text();
            alert("Error del servidor: " + errorText);
        }
    } catch (err) {
        console.error("Error de red:", err);
    }
}
