// Referencias a elementos de reproduccion: audio oculto, video visible y arte de audio.
const audio = document.querySelector("#audioPlayer");
const video = document.querySelector("#videoPlayer");
const audioArtwork = document.querySelector("#audioArtwork");
const videoPlaceholder = document.querySelector("#videoPlaceholder");

// Referencias a controles de fuente local y busqueda.
const pickFolderBtn = document.querySelector("#pickFolder");
const fileFallback = document.querySelector("#fileFallback");
const rescanFolderBtn = document.querySelector("#rescanFolder");
const titleSearchInput = document.querySelector("#titleSearchInput");
const artistSearchInput = document.querySelector("#artistSearchInput");
const folderSearchInput = document.querySelector("#folderSearchInput");
const sortSelect = document.querySelector("#sortSelect");

// Referencias a la tabla, artistas, cola y resumen de biblioteca.
const tableHead = document.querySelector("#tableHead");
const trackList = document.querySelector("#trackList");
const artistList = document.querySelector("#artistList");
const folderList = document.querySelector("#folderList");
const typeList = document.querySelector("#typeList");
const queueList = document.querySelector("#queueList");
const emptyState = document.querySelector("#emptyState");
const folderName = document.querySelector("#folderName");
const trackCount = document.querySelector("#trackCount");
const durationTotal = document.querySelector("#durationTotal");
const heroTitle = document.querySelector("#heroTitle");
const heroSubtitle = document.querySelector("#heroSubtitle");
const nowTitle = document.querySelector("#nowTitle");
const nowArtist = document.querySelector("#nowArtist");
const coverArt = document.querySelector("#coverArt");

// Referencias a controles principales del reproductor.
const playBtn = document.querySelector("#playBtn");
const playIcon = document.querySelector("#playIcon");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const back10Btn = document.querySelector("#back10Btn");
const back5Btn = document.querySelector("#back5Btn");
const forward5Btn = document.querySelector("#forward5Btn");
const forward10Btn = document.querySelector("#forward10Btn");
const shuffleBtn = document.querySelector("#shuffleBtn");
const repeatBtn = document.querySelector("#repeatBtn");
const progress = document.querySelector("#progress");
const currentTime = document.querySelector("#currentTime");
const durationTime = document.querySelector("#durationTime");
const volumeRange = document.querySelector("#volumeRange");
const volumePercent = document.querySelector("#volumePercent");
const clearQueueBtn = document.querySelector("#clearQueue");

// Menu contextual que aparece con clic derecho sobre una fila.
const contextMenu = document.querySelector("#contextMenu");
const contextPlay = document.querySelector("#contextPlay");
const contextLoop = document.querySelector("#contextLoop");
const contextMini = document.querySelector("#contextMini");
const contextHide = document.querySelector("#contextHide");

// Minireproductor flotante y sus controles.
const miniPlayer = document.querySelector("#miniPlayer");
const miniTitle = document.querySelector("#miniTitle");
const miniMeta = document.querySelector("#miniMeta");
const miniCurrent = document.querySelector("#miniCurrent");
const miniDuration = document.querySelector("#miniDuration");
const miniProgressBar = document.querySelector("#miniProgressBar");
const miniClose = document.querySelector("#miniClose");
const miniPlay = document.querySelector("#miniPlay");
const miniPlayIcon = document.querySelector("#miniPlayIcon");
const miniBack5 = document.querySelector("#miniBack5");
const miniForward5 = document.querySelector("#miniForward5");
const miniPrev = document.querySelector("#miniPrev");
const miniNext = document.querySelector("#miniNext");

// Panel de organizaciones guardadas/importadas como CSV.
const organizationSelect = document.querySelector("#organizationSelect");
const organizationName = document.querySelector("#organizationName");
const columnPicker = document.querySelector("#columnPicker");
const saveOrganization = document.querySelector("#saveOrganization");
const exportOrganizations = document.querySelector("#exportOrganizations");
const importOrganizations = document.querySelector("#importOrganizations");
const restoreHidden = document.querySelector("#restoreHidden");

// Extensiones que se aceptan al recorrer carpetas locales.
const audioExtensions = new Set([
  "mp3", "wav", "ogg", "oga", "flac", "m4a", "m4b", "m4p", "aac", "opus", "webm", "wma", "aiff", "aif", "amr", "mid", "midi", "caf", "au", "snd", "ra", "ram", "ape", "alac", "mka"
]);
const videoExtensions = new Set([
  "mp4", "m4v", "mov", "webm", "mkv", "avi", "wmv", "flv", "3gp", "3g2", "ogv", "mpeg", "mpg", "mpe", "mpv", "ts", "m2ts", "mts", "vob", "asf", "divx", "rm", "rmvb", "h264", "h265", "hevc"
]);

// Configuracion de la "base CSV" de organizaciones guardada en localStorage.
const organizationStorageKey = "localMixOrganizationCsv";
const hiddenTracksStorageKey = "localMixHiddenTracks";
const defaultFolderName = "Vídeos";
const defaultOrganization = {
  id: "default",
  name: "Predeterminado",
  columns: ["index", "title", "artist", "kind", "folder", "duration"]
};

// Organizacion integrada para nombres tipo: numero. titulo (album) - artista [youtubeId].
const tobyFoxOrganization = {
  id: "toby-fox",
  name: "Toby Fox",
  columns: ["index", "title", "artist", "kind", "folder", "duration"]
};

// Organizaciones que siempre deben existir aunque se importe un CSV.
const builtInOrganizations = [defaultOrganization, tobyFoxOrganization];

// Definicion central de columnas disponibles para la tabla dinamica.
// Para agregar mas columnas:
// 1. Anade una clave aqui con label y width.
// 2. Asegurate de que createTrack() guarde ese dato en cada pista.
// 3. Agrega el caso correspondiente en renderTrackCell().
// 4. Si quieres ordenarla desde el selector, agrega una <option> en index.html.
const columnDefinitions = {
  index: { label: "#", width: "46px" },
  title: { label: "Titulo", width: "minmax(170px, 1.2fr)" },
  artist: { label: "Artista", width: "minmax(120px, 0.7fr)" },
  kind: { label: "Tipo", width: "82px" },
  folder: { label: "Carpeta", width: "minmax(120px, 0.8fr)" },
  duration: { label: "Duracion", width: "74px" }
};
const allColumnKeys = Object.keys(columnDefinitions);

// Estado principal de biblioteca, reproduccion y filtros.
let tracks = [];
let queue = [];
let currentIndex = -1;
let currentUrl = null;
let directoryHandle = null;
let isShuffle = false;
let repeatMode = "off";
let contextTargetIndex = -1;
let activeArtistFilter = "all";
let activeArtistInitial = "";
let activeFolderFilter = "all";
let activeFolderInitial = "";
let activeTypeFilter = "all";
let activeTypeInitial = "";
let hiddenTrackIds = loadHiddenTrackIds();

// Estado de organizaciones activas: se inicializa leyendo el CSV guardado.
let organizationViews = loadOrganizationViews();
let activeOrganizationId = organizationViews[0]?.id || defaultOrganization.id;
let activeColumns = [...(organizationViews[0]?.columns || defaultOrganization.columns)];

// Volumen inicial compartido entre audio y video.
audio.volume = Number(volumeRange.value);
video.volume = Number(volumeRange.value);

// Eventos de fuente local y filtros de biblioteca.
pickFolderBtn.addEventListener("click", pickFolder);
fileFallback.addEventListener("change", (event) => loadFromFiles([...event.target.files], "Archivos importados"));
rescanFolderBtn.addEventListener("click", rescanFolder);
titleSearchInput.addEventListener("input", renderLibrary);
artistSearchInput.addEventListener("input", () => {
  renderArtists();
  renderLibrary();
});
folderSearchInput.addEventListener("input", () => {
  renderFolders();
  renderLibrary();
});
sortSelect.addEventListener("change", renderLibrary);

// Eventos de reproduccion y saltos temporales.
playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", previousTrack);
nextBtn.addEventListener("click", () => nextTrack());
back10Btn.addEventListener("click", () => seekBy(-10));
back5Btn.addEventListener("click", () => seekBy(-5));
forward5Btn.addEventListener("click", () => seekBy(5));
forward10Btn.addEventListener("click", () => seekBy(10));
shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
});
repeatBtn.addEventListener("click", cycleRepeatMode);
volumeRange.addEventListener("input", () => {
  audio.volume = Number(volumeRange.value);
  video.volume = Number(volumeRange.value);
  updateVolumePercent();
});

// Eventos de progreso y limpieza de cola.
progress.addEventListener("input", () => {
  const media = getActiveMedia();
  if (Number.isFinite(media.duration)) {
    media.currentTime = (Number(progress.value) / 100) * media.duration;
  }
});
clearQueueBtn.addEventListener("click", () => {
  queue = currentIndex >= 0 ? [currentIndex] : [];
  renderQueue();
});
document.querySelector("[data-focus-search]").addEventListener("click", () => titleSearchInput.focus());

// Acciones del menu contextual de las filas.
contextPlay.addEventListener("click", () => {
  if (contextTargetIndex >= 0) playTrack(contextTargetIndex);
  hideContextMenu();
});
contextLoop.addEventListener("click", () => {
  if (currentIndex === contextTargetIndex && repeatMode === "one") {
    setRepeatMode("off");
  } else {
    setRepeatForTrack(contextTargetIndex);
  }
  hideContextMenu();
});
contextMini.addEventListener("click", () => {
  openMiniPlayer(contextTargetIndex);
  hideContextMenu();
});
contextHide.addEventListener("click", () => {
  toggleTrackHidden(contextTargetIndex);
  hideContextMenu();
});

// Acciones del minireproductor.
miniClose.addEventListener("click", () => miniPlayer.classList.add("hidden"));
miniPlay.addEventListener("click", togglePlay);
miniBack5.addEventListener("click", () => seekBy(-5));
miniForward5.addEventListener("click", () => seekBy(5));
miniPrev.addEventListener("click", previousTrack);
miniNext.addEventListener("click", () => nextTrack());

// Acciones del panel de organizaciones CSV.
organizationSelect.addEventListener("change", () => {
  applyOrganization(organizationSelect.value);
});
saveOrganization.addEventListener("click", saveCurrentOrganization);
exportOrganizations.addEventListener("click", exportOrganizationCsv);
importOrganizations.addEventListener("change", importOrganizationCsv);
restoreHidden.addEventListener("click", restoreHiddenTracks);

// Eventos globales: cerrar menu contextual, atajos y scroll.
document.addEventListener("click", (event) => {
  if (!contextMenu.contains(event.target)) hideContextMenu();
});
document.addEventListener("keydown", handleKeyboardShortcuts);
window.addEventListener("scroll", hideContextMenu, true);

// Eventos compartidos por audio y video.
for (const media of [audio, video]) {
  media.addEventListener("timeupdate", updateProgress);
  media.addEventListener("durationchange", updateNowPlayingDuration);
  media.addEventListener("ended", () => {
    if (repeatMode === "one") {
      media.currentTime = 0;
      media.play();
      return;
    }
    nextTrack(true);
  });
  media.addEventListener("play", renderPlayIcon);
  media.addEventListener("pause", renderPlayIcon);
  media.addEventListener("error", () => showToast("Este formato no se puede reproducir en este navegador"));
}

// Render inicial de controles sin necesidad de haber cargado una carpeta.
folderName.textContent = defaultFolderName;
heroTitle.textContent = defaultFolderName;
renderRepeatMode();
renderOrganizationControls();
updateVolumePercent();

// Abre el selector moderno de carpetas si existe; si no, usa el input fallback.
async function pickFolder() {
  if ("showDirectoryPicker" in window) {
    try {
      directoryHandle = await openVideosDirectoryPicker();
      const files = await collectMediaFiles(directoryHandle);
      await loadFromFiles(files, directoryHandle.name);
      if (directoryHandle.name.toUpperCase() !== defaultFolderName) {
        showToast(`Carpeta abierta: ${directoryHandle.name}`);
      }
      return;
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("No se pudo leer la carpeta");
      }
      return;
    }
  }

  fileFallback.click();
}

// Abre el selector empezando en la carpeta Videos del sistema cuando el navegador lo soporta.
async function openVideosDirectoryPicker() {
  try {
    return await window.showDirectoryPicker({ mode: "read", startIn: "videos" });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    return window.showDirectoryPicker({ mode: "read" });
  }
}

// Vuelve a leer la carpeta seleccionada previamente para actualizar cambios.
async function rescanFolder() {
  if (!directoryHandle) {
    fileFallback.click();
    return;
  }

  const files = await collectMediaFiles(directoryHandle);
  await loadFromFiles(files, directoryHandle.name, true);
  showToast("Biblioteca actualizada");
}

// Recorre recursivamente una carpeta y devuelve archivos de audio/video aceptados.
async function collectMediaFiles(rootHandle, path = "") {
  const files = [];

  for await (const [name, handle] of rootHandle.entries()) {
    if (handle.kind === "file") {
      const file = await handle.getFile();
      if (isMediaFile(file)) {
        file.relativePath = path ? `${path}/${name}` : name;
        files.push(file);
      }
    }

    if (handle.kind === "directory") {
      const nestedPath = path ? `${path}/${name}` : name;
      files.push(...await collectMediaFiles(handle, nestedPath));
    }
  }

  return files;
}

// Carga archivos seleccionados, reinicia estado visual y vuelve a renderizar biblioteca.
async function loadFromFiles(files, sourceName, keepCurrent = false) {
  const mediaFiles = files.filter((file) => isMediaFile(file));

  cleanupCurrentUrl();
  stopMedia();
  resetNowPlaying();
  toggleVideoStage(false);
  tracks = mediaFiles.map((file, index) => createTrack(file, index));
  queue = tracks.map((_, index) => index);
  currentIndex = -1;
  activeArtistFilter = "all";
  activeArtistInitial = "";
  activeFolderFilter = "all";
  activeFolderInitial = "";
  activeTypeFilter = "all";
  activeTypeInitial = "";

  folderName.textContent = sourceName || "Biblioteca local";
  heroTitle.textContent = sourceName || "Biblioteca local";
  heroSubtitle.textContent = tracks.length
    ? `${tracks.length} archivos listos para sonar o verse desde tu equipo.`
    : "No encontre audio o video compatible en esa seleccion.";

  await hydrateDurations();
  renderArtists();
  renderFolders();
  renderTypes();
  renderLibrary();
  renderQueue();
  renderStats();

  if (tracks.length) {
    showToast(`${tracks.length} archivos cargados`);
  }
}

// Convierte un File del navegador en un objeto de pista con metadatos normalizados.
function createTrack(file, index) {
  const rawPath = file.relativePath || file.webkitRelativePath || file.name;
  const pathParts = rawPath.split(/[\\/]/);
  const filename = pathParts.pop() || file.name;
  const baseName = filename.replace(/\.[^/.]+$/, "").trim();
  const tobyFox = parseTobyFoxFileName(baseName);
  const namedArtist = tobyFox.artist || getArtistFromFileName(baseName);
  const titleSource = tobyFox.titleSource || getTitleFromFileName(baseName);
  const youtubeLink = tobyFox.youtubeLink || getYoutubeLinkFromTitle(titleSource);
  const title = (tobyFox.title || stripBracketedText(titleSource)).replace(/[_-]+/g, " ").trim();
  const folder = pathParts.length ? pathParts.join(" / ") : "Raiz";
  const kind = getMediaKind(file);
  const artist = namedArtist || inferArtist(title, folder);

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    title,
    youtubeLink,
    artist,
    namedArtist,
    tobyFox,
    kind,
    kindLabel: kind === "video" ? "Video" : "Audio",
    folder,
    duration: 0,
    objectUrl: null
  };
}

// Obtiene un artista generico desde titulo o carpeta cuando no hay patron de artista.
function inferArtist(title, folder) {
  if (title.includes(" - ")) {
    return title.split(" - ")[0].trim();
  }
  const folderBits = folder.split(" / ").filter(Boolean);
  return folderBits.at(-1) && folderBits.at(-1) !== "Raiz" ? folderBits.at(-1) : "Archivo local";
}

// Extrae artista de nombres "Artista - Titulo".
function getArtistFromFileName(baseName) {
  if (!baseName.includes(" - ")) return "";
  return baseName.split(" - ")[0].trim();
}

// Extrae titulo de nombres "Artista - Titulo"; conserva guiones internos posteriores.
function getTitleFromFileName(baseName) {
  if (!baseName.includes(" - ")) return baseName;
  return baseName.split(" - ").slice(1).join(" - ").trim();
}

// Construye enlace de YouTube desde texto entre corchetes del titulo.
function getYoutubeLinkFromTitle(titleSource) {
  const match = titleSource.match(/\[([^\]]+)\]/);
  if (!match) return "";
  const videoId = match[1].trim().replace(/\s+/g, "_");
  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "";
}

// Elimina segmentos entre corchetes para que no aparezcan en el titulo visible.
function stripBracketedText(titleSource) {
  return titleSource.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
}

// Parser especial para la organizacion "Toby Fox".
function parseTobyFoxFileName(baseName) {
  const match = baseName.match(/^\s*(\d+)\.\s*(.*?)\s*(?:\(([^)]*)\))?\s*-\s*(.*?)\s*(?:\[([^\]]+)\])?\s*$/);
  if (!match) {
    return {};
  }

  const [, number, rawTitle, rawAlbum = "", rawArtist = "", rawVideoId = ""] = match;
  const videoId = rawVideoId.trim().replace(/\s+/g, "_");

  return {
    number,
    title: rawTitle.trim(),
    titleSource: rawTitle.trim(),
    album: rawAlbum.trim(),
    artist: rawArtist.trim(),
    youtubeLink: videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : ""
  };
}

// Lee duraciones de hasta 300 archivos usando elementos media temporales.
async function hydrateDurations() {
  const probes = tracks.slice(0, 300).map((track) => readDuration(track));
  await Promise.allSettled(probes);
}

// Obtiene la duracion de un archivo sin reproducirlo en la UI.
function readDuration(track) {
  return new Promise((resolve) => {
    const probe = document.createElement(track.kind === "video" ? "video" : "audio");
    const url = URL.createObjectURL(track.file);
    probe.preload = "metadata";
    probe.src = url;
    probe.addEventListener("loadedmetadata", () => {
      track.duration = Number.isFinite(probe.duration) ? probe.duration : 0;
      URL.revokeObjectURL(url);
      resolve();
    }, { once: true });
    probe.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve();
    }, { once: true });
  });
}

// Renderiza tabla segun filtros, orden y columnas de la organizacion activa.
function renderLibrary() {
  const visible = getVisibleTracks();
  renderTableHead();
  trackList.innerHTML = "";
  emptyState.classList.toggle("hidden", tracks.length > 0);

  visible.forEach(({ track, index }, rowNumber) => {
    const row = document.createElement("div");
    row.className = `track-row${index === currentIndex ? " playing" : ""}`;
    row.style.gridTemplateColumns = getGridTemplate();
    row.setAttribute("role", "row");
    row.tabIndex = 0;
    row.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      playTrack(index);
    });
    row.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      showContextMenu(event, index);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        playTrack(index);
      }
    });
    row.innerHTML = activeColumns.map((columnKey) => renderTrackCell(columnKey, track, rowNumber)).join("");
    trackList.appendChild(row);
  });
}

// Renderiza el encabezado de tabla segun columnas activas.
function renderTableHead() {
  tableHead.style.gridTemplateColumns = getGridTemplate();
  tableHead.innerHTML = activeColumns
    .map((columnKey) => `<span data-column="${escapeAttribute(columnKey)}">${escapeHtml(columnDefinitions[columnKey].label)}</span>`)
    .join("");
}

// Renderiza una celda concreta de la tabla segun el tipo de columna.
function renderTrackCell(columnKey, track, rowNumber) {
  if (columnKey === "index") {
    return `
      <span class="row-index" data-column="index">
        <span class="row-number">${escapeHtml(getTrackIndexLabel(track, rowNumber))}</span>
        <span class="play-dot" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        </span>
      </span>
    `;
  }

  if (columnKey === "title") {
    return `<span class="track-main" data-column="title">${renderTrackTitle(track)}</span>`;
  }

  if (columnKey === "artist") {
    return `<span class="artist-cell" data-column="artist">${escapeHtml(track.artist)}</span>`;
  }

  if (columnKey === "kind") {
    return `<span class="kind-cell" data-column="kind"><span class="kind-pill">${escapeHtml(track.kindLabel)}</span></span>`;
  }

  if (columnKey === "folder") {
    return `<span class="folder-cell" data-column="folder">${escapeHtml(track.folder)}</span>`;
  }

  if (columnKey === "duration") {
    return `<span class="duration-cell" data-column="duration">${formatTime(track.duration)}</span>`;
  }

  return "";
}

// Decide que valor se muestra en la columna #.
function getTrackIndexLabel(track, rowNumber) {
  if (activeOrganizationId === tobyFoxOrganization.id && track.tobyFox?.number) {
    return track.tobyFox.number;
  }
  return String(rowNumber + 1);
}

// Crea el grid-template CSS que corresponde a las columnas activas.
function getGridTemplate() {
  return activeColumns.map((columnKey) => columnDefinitions[columnKey].width).join(" ");
}

// Renderiza chips de artistas detectados desde nombres de archivo.
function renderArtists() {
  const artists = getFilteredValues("artist");

  if (activeArtistFilter !== "all" && !artists.includes(activeArtistFilter)) {
    activeArtistFilter = "all";
  }

  artistList.innerHTML = "";
  renderGroupedFilter(artistList, artists, activeArtistInitial, activeArtistFilter, (value) => {
    if (value === "all") activeArtistInitial = "";
    activeArtistFilter = value;
    renderArtists();
    renderLibrary();
  }, (initial) => {
    activeArtistInitial = activeArtistInitial === initial ? "" : initial;
    activeArtistFilter = "all";
    renderArtists();
    renderLibrary();
  });
}

// Renderiza chips de carpetas con agrupacion por inicial.
function renderFolders() {
  const folders = getFilteredValues("folder");
  if (activeFolderFilter !== "all" && !folders.includes(activeFolderFilter)) {
    activeFolderFilter = "all";
  }

  folderList.innerHTML = "";
  renderGroupedFilter(folderList, folders, activeFolderInitial, activeFolderFilter, (value) => {
    if (value === "all") activeFolderInitial = "";
    activeFolderFilter = value;
    renderFolders();
    renderLibrary();
  }, (initial) => {
    activeFolderInitial = activeFolderInitial === initial ? "" : initial;
    activeFolderFilter = "all";
    renderFolders();
    renderLibrary();
  });
}

// Renderiza chips de tipo (Audio/Video) con agrupacion por inicial.
function renderTypes() {
  const types = getFilteredValues("kindLabel");
  if (activeTypeFilter !== "all" && !types.includes(activeTypeFilter)) {
    activeTypeFilter = "all";
  }

  typeList.innerHTML = "";
  renderGroupedFilter(typeList, types, activeTypeInitial, activeTypeFilter, (value) => {
    if (value === "all") activeTypeInitial = "";
    activeTypeFilter = value;
    renderTypes();
    renderLibrary();
  }, (initial) => {
    activeTypeInitial = activeTypeInitial === initial ? "" : initial;
    activeTypeFilter = "all";
    renderTypes();
    renderLibrary();
  });
}

// Obtiene valores unicos para filtros laterales, aplicando buscadores de texto.
function getFilteredValues(key) {
  const query = key === "artist"
    ? artistSearchInput.value.trim().toLowerCase()
    : key === "folder"
      ? folderSearchInput.value.trim().toLowerCase()
      : "";
  return [...new Set(tracks.filter((track) => !isTrackHidden(track)).map((track) => track[key]).filter(Boolean))]
    .filter((value) => !query || value.toLowerCase().includes(query))
    .sort((a, b) => new Intl.Collator("es", { sensitivity: "base" }).compare(a, b));
}

// Renderiza las letras en una fila y, debajo, los valores de la letra seleccionada.
function renderGroupedFilter(container, values, activeInitial, activeValue, onValue, onInitial) {
  const letterRow = document.createElement("div");
  letterRow.className = "filter-letter-row";
  const optionRow = document.createElement("div");
  optionRow.className = "filter-option-row";

  letterRow.appendChild(createFilterButton("Todos", "all", activeValue === "all" && !activeInitial, onValue));
  const initials = [...new Set(values.map((value) => getInitial(value)))];
  initials.forEach((initial) => {
    const letterButton = createFilterButton(initial, initial, activeInitial === initial, onInitial);
    letterButton.classList.add("letter-chip");
    letterRow.appendChild(letterButton);
  });

  container.appendChild(letterRow);
  container.appendChild(optionRow);

  if (!activeInitial) return;
  values
    .filter((value) => getInitial(value) === activeInitial)
    .forEach((value) => optionRow.appendChild(createFilterButton(value, value, activeValue === value, onValue)));
}

// Crea un chip de filtro reutilizable para artista, carpeta o tipo.
function createFilterButton(label, value, active, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `artist-chip${active ? " active" : ""}`;
  button.textContent = label;
  button.title = label;
  button.addEventListener("click", () => onClick(value));
  return button;
}

// Devuelve inicial visible para agrupar filtros alfabeticamente.
function getInitial(value) {
  return String(value).trim().charAt(0).toUpperCase() || "#";
}

// Renderiza el titulo como texto o como enlace de YouTube si existe id.
function renderTrackTitle(track) {
  const title = escapeHtml(track.title || "Sin titulo");
  if (!track.youtubeLink) {
    return `<span class="track-title">${title}</span>`;
  }

  return `<a class="track-title title-link" href="${escapeAttribute(track.youtubeLink)}" target="_blank" rel="noreferrer">${title}</a>`;
}

// Aplica busqueda, filtro de artista y orden a la biblioteca.
function getVisibleTracks() {
  const titleQuery = titleSearchInput.value.trim().toLowerCase();
  const collator = new Intl.Collator("es", { sensitivity: "base" });

  return tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => {
      if (isTrackHidden(track)) return false;
      if (activeArtistFilter !== "all" && track.artist !== activeArtistFilter) return false;
      if (activeFolderFilter !== "all" && track.folder !== activeFolderFilter) return false;
      if (activeTypeFilter !== "all" && track.kindLabel !== activeTypeFilter) return false;
      if (titleQuery && !track.title.toLowerCase().includes(titleQuery)) return false;
      return true;
    })
    .sort((a, b) => {
      const key = sortSelect.value;
      if (key === "duration") return (a.track.duration || 0) - (b.track.duration || 0);
      return collator.compare(a.track[key], b.track[key]);
    });
}

// Renderiza la cola de reproduccion a partir del archivo actual y el resto.
function renderQueue() {
  queueList.innerHTML = "";
  const playable = getPlayableIndices();
  const list = (queue.length ? queue : playable).filter((trackIndex) => playable.includes(trackIndex));

  list.slice(0, 12).forEach((trackIndex) => {
    const track = tracks[trackIndex];
    if (!track) return;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "queue-item";
    item.addEventListener("click", () => playTrack(trackIndex));
    item.innerHTML = `
      <span class="queue-thumb">
        ${track.kind === "video" ? videoIcon() : audioIcon()}
      </span>
      <span>
        <span class="queue-title">${escapeHtml(track.title)}</span>
        <span class="queue-meta">${escapeHtml(track.kindLabel)} - ${escapeHtml(track.artist)}</span>
      </span>
    `;
    queueList.appendChild(item);
  });
}

// Actualiza contador de archivos y duracion total.
function renderStats() {
  const visibleTracks = tracks.filter((track) => !isTrackHidden(track));
  trackCount.textContent = visibleTracks.length;
  durationTotal.textContent = formatTime(visibleTracks.reduce((sum, track) => sum + (track.duration || 0), 0), true);
}

// Carga organizaciones desde localStorage; si falla usa las integradas.
function loadOrganizationViews() {
  try {
    const savedCsv = localStorage.getItem(organizationStorageKey);
    if (!savedCsv) return [defaultOrganization];
    return normalizeOrganizationViews(parseOrganizationCsv(savedCsv));
  } catch {
    return [defaultOrganization];
  }
}

// Sincroniza selector, nombre, columnas y encabezado con la organizacion activa.
function renderOrganizationControls() {
  organizationViews = normalizeOrganizationViews(organizationViews);
  const activeView = organizationViews.find((view) => view.id === activeOrganizationId) || organizationViews[0];
  activeOrganizationId = activeView.id;
  activeColumns = [...activeView.columns];

  organizationSelect.innerHTML = organizationViews
    .map((view) => `<option value="${escapeAttribute(view.id)}"${view.id === activeOrganizationId ? " selected" : ""}>${escapeHtml(view.name)}</option>`)
    .join("");
  organizationName.value = activeView.name;
  renderColumnPicker();
  renderTableHead();
}

// Pinta checkboxes y botones de orden para todas las columnas disponibles.
function renderColumnPicker() {
  const orderedKeys = [...activeColumns, ...allColumnKeys.filter((key) => !activeColumns.includes(key))];
  columnPicker.innerHTML = orderedKeys.map((columnKey) => {
    const selected = activeColumns.includes(columnKey);
    const index = activeColumns.indexOf(columnKey);
    return `
      <div class="column-option">
        <label>
          <input type="checkbox" data-column-toggle="${escapeAttribute(columnKey)}"${selected ? " checked" : ""}>
          <strong>${escapeHtml(columnDefinitions[columnKey].label)}</strong>
        </label>
        <button type="button" data-column-up="${escapeAttribute(columnKey)}"${!selected || index <= 0 ? " disabled" : ""}>^</button>
        <button type="button" data-column-down="${escapeAttribute(columnKey)}"${!selected || index === activeColumns.length - 1 ? " disabled" : ""}>v</button>
      </div>
    `;
  }).join("");

  columnPicker.querySelectorAll("[data-column-toggle]").forEach((input) => {
    input.addEventListener("change", () => toggleOrganizationColumn(input.dataset.columnToggle, input.checked));
  });
  columnPicker.querySelectorAll("[data-column-up]").forEach((button) => {
    button.addEventListener("click", () => moveOrganizationColumn(button.dataset.columnUp, -1));
  });
  columnPicker.querySelectorAll("[data-column-down]").forEach((button) => {
    button.addEventListener("click", () => moveOrganizationColumn(button.dataset.columnDown, 1));
  });
}

// Activa o desactiva una columna dentro de la organizacion en edicion.
function toggleOrganizationColumn(columnKey, checked) {
  if (!columnDefinitions[columnKey]) return;
  if (checked && !activeColumns.includes(columnKey)) {
    activeColumns.push(columnKey);
  }
  if (!checked && activeColumns.length > 1) {
    activeColumns = activeColumns.filter((key) => key !== columnKey);
  }
  if (!activeColumns.length) {
    activeColumns = ["title"];
  }
  renderColumnPicker();
  renderLibrary();
}

// Mueve una columna arriba o abajo dentro de la organizacion en edicion.
function moveOrganizationColumn(columnKey, direction) {
  const index = activeColumns.indexOf(columnKey);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= activeColumns.length) return;
  const nextColumns = [...activeColumns];
  [nextColumns[index], nextColumns[targetIndex]] = [nextColumns[targetIndex], nextColumns[index]];
  activeColumns = nextColumns;
  renderColumnPicker();
  renderLibrary();
}

// Aplica una organizacion seleccionada en el desplegable.
function applyOrganization(id) {
  const view = organizationViews.find((item) => item.id === id);
  if (!view) return;
  activeOrganizationId = view.id;
  activeColumns = [...view.columns];
  organizationName.value = view.name;
  renderColumnPicker();
  renderLibrary();
}

// Guarda la organizacion actual en la base CSV dentro de localStorage.
function saveCurrentOrganization() {
  const name = organizationName.value.trim();
  if (!name) {
    showToast("Ponle un nombre a la organizacion");
    return;
  }

  const id = slugify(name);
  const view = { id, name, columns: sanitizeColumns(activeColumns) };
  const existingIndex = organizationViews.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    organizationViews[existingIndex] = view;
  } else {
    organizationViews.push(view);
  }

  activeOrganizationId = id;
  persistOrganizationViews();
  renderOrganizationControls();
  renderLibrary();
  showToast("Organizacion guardada en CSV");
}

// Escribe el CSV normalizado en localStorage.
function persistOrganizationViews() {
  try {
    localStorage.setItem(organizationStorageKey, createOrganizationCsv(organizationViews));
  } catch {
    showToast("No se pudo guardar la base CSV");
  }
}

// Descarga el CSV de organizaciones como archivo local.
function exportOrganizationCsv() {
  const blob = new Blob([createOrganizationCsv(organizationViews)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "local_mix_organizaciones.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// Importa un CSV de organizaciones elegido por el usuario.
function importOrganizationCsv(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    organizationViews = normalizeOrganizationViews(parseOrganizationCsv(String(reader.result || "")));
    activeOrganizationId = organizationViews[0].id;
    persistOrganizationViews();
    renderOrganizationControls();
    renderLibrary();
    showToast("CSV importado");
  });
  reader.readAsText(file);
  event.target.value = "";
}

// Convierte texto CSV en objetos de organizacion.
function parseOrganizationCsv(csvText) {
  return csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index) => !(index === 0 && line.toLowerCase().startsWith("nombre,")))
    .map((line) => {
      const [name = "", columns = ""] = parseCsvLine(line);
      return {
        id: slugify(name),
        name: name.trim(),
        columns: sanitizeColumns(columns.split("|"))
      };
    });
}

// Convierte organizaciones a texto CSV con cabecera nombre,columnas.
function createOrganizationCsv(views) {
  const rows = [["nombre", "columnas"], ...normalizeOrganizationViews(views).map((view) => [view.name, view.columns.join("|")])];
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

// Parser CSV simple con soporte de comillas dobles.
function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];
    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

// Escapa celdas CSV cuando contienen comas, comillas o saltos de linea.
function csvEscape(value) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

// Asegura que existan organizaciones integradas y columnas validas.
function normalizeOrganizationViews(views) {
  const cleanViews = views
    .map((view) => ({
      id: view.id || slugify(view.name),
      name: view.name?.trim(),
      columns: sanitizeColumns(view.columns || [])
    }))
    .filter((view) => view.name && view.columns.length);

  const builtInViews = builtInOrganizations.map((builtInView) => (
    cleanViews.find((view) => view.id === builtInView.id) || builtInView
  ));
  const customViews = cleanViews.filter((view) => !builtInOrganizations.some((builtInView) => builtInView.id === view.id));
  const merged = [...builtInViews, ...customViews];
  return merged.length ? merged : [defaultOrganization];
}

// Limpia columnas desconocidas y evita duplicados.
function sanitizeColumns(columns) {
  const uniqueColumns = [];
  columns.forEach((columnKey) => {
    if (columnDefinitions[columnKey] && !uniqueColumns.includes(columnKey)) {
      uniqueColumns.push(columnKey);
    }
  });
  return uniqueColumns.length ? uniqueColumns : [...defaultOrganization.columns];
}

// Crea ids estables para organizaciones a partir del nombre visible.
function slugify(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `org-${Date.now()}`;
}

// Reproduce una pista concreta y actualiza UI, cola y mini reproductor.
function playTrack(index) {
  const track = tracks[index];
  if (!track || isTrackHidden(track)) return;

  cleanupCurrentUrl();
  stopMedia();
  currentIndex = index;
  currentUrl = URL.createObjectURL(track.file);
  const media = track.kind === "video" ? video : audio;
  media.src = currentUrl;
  media.volume = Number(volumeRange.value);
  media.play().catch(() => showToast("El navegador bloqueo la reproduccion automatica"));

  nowTitle.textContent = track.title;
  nowArtist.textContent = `${track.kindLabel} - ${track.artist}`;
  coverArt.style.background = albumGradient(track.id);
  toggleVideoStage(track.kind === "video");
  queue = [index, ...getPlayableIndices().filter((trackIndex) => trackIndex !== index)];

  renderLibrary();
  renderQueue();
  updateMiniPlayer();
}

// Alterna play/pausa; si no hay archivo activo empieza por el primero.
function togglePlay() {
  const playable = getPlayableIndices();
  if (!playable.length) {
    pickFolder();
    return;
  }

  if (currentIndex < 0 || !playable.includes(currentIndex)) {
    playTrack(queue.find((trackIndex) => playable.includes(trackIndex)) ?? playable[0]);
    return;
  }

  const media = getActiveMedia();
  if (media.paused) {
    media.play();
  } else {
    media.pause();
  }
}

// Reproduce la pista anterior con vuelta circular al final.
function previousTrack() {
  const playable = getPlayableIndices();
  if (!playable.length) return;
  const currentPlayableIndex = playable.indexOf(currentIndex);
  const target = currentPlayableIndex <= 0 ? playable.at(-1) : playable[currentPlayableIndex - 1];
  playTrack(target);
}

// Reproduce la siguiente pista; respeta aleatorio y bucle de lista.
function nextTrack(fromEnded = false) {
  const playable = getPlayableIndices();
  if (!playable.length) return;

  if (isShuffle) {
    let randomIndex = currentIndex;
    while (playable.length > 1 && randomIndex === currentIndex) {
      randomIndex = playable[Math.floor(Math.random() * playable.length)];
    }
    playTrack(randomIndex);
    return;
  }

  const currentPlayableIndex = playable.indexOf(currentIndex);
  if (fromEnded && currentPlayableIndex >= playable.length - 1 && repeatMode !== "all") {
    getActiveMedia().pause();
    renderPlayIcon();
    return;
  }

  const target = currentPlayableIndex >= playable.length - 1 || currentPlayableIndex < 0
    ? playable[0]
    : playable[currentPlayableIndex + 1];
  playTrack(target);
}

// Mueve la reproduccion unos segundos hacia atras o adelante.
function seekBy(seconds) {
  if (currentIndex < 0) return;
  const media = getActiveMedia();
  if (!Number.isFinite(media.duration)) return;
  media.currentTime = Math.min(Math.max(media.currentTime + seconds, 0), media.duration);
  updateProgress();
}

// Cambia modo de bucle: apagado -> lista -> archivo -> apagado.
function cycleRepeatMode() {
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  renderRepeatMode();
}

// Fuerza un modo de bucle concreto y refresca su estado visual.
function setRepeatMode(mode) {
  repeatMode = mode;
  renderRepeatMode();
}

// Activa bucle por archivo para una pista, reproduciendola si hace falta.
function setRepeatForTrack(index) {
  if (index < 0 || !tracks[index]) return;
  if (isTrackHidden(tracks[index])) {
    showToast("Ese archivo esta oculto");
    return;
  }
  if (currentIndex !== index) {
    playTrack(index);
  }
  setRepeatMode("one");
  showToast("Bucle por archivo activado");
}

// Devuelve indices que pueden participar en cola, bucles y reproduccion automatica.
function getPlayableIndices() {
  return tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => !isTrackHidden(track))
    .map(({ index }) => index);
}

// Carga ids ocultos desde localStorage.
function loadHiddenTrackIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(hiddenTracksStorageKey) || "[]"));
  } catch {
    return new Set();
  }
}

// Persiste ids ocultos para que sigan sin entrar en bucles al recargar.
function saveHiddenTrackIds() {
  localStorage.setItem(hiddenTracksStorageKey, JSON.stringify([...hiddenTrackIds]));
}

// Determina si una pista esta marcada como oculta.
function isTrackHidden(track) {
  return hiddenTrackIds.has(track.id);
}

// Oculta o restaura una pista desde el menu contextual.
function toggleTrackHidden(index) {
  const track = tracks[index];
  if (!track) return;

  if (hiddenTrackIds.has(track.id)) {
    hiddenTrackIds.delete(track.id);
    showToast("Archivo restaurado");
  } else {
    hiddenTrackIds.add(track.id);
    if (currentIndex === index) {
      const remaining = getPlayableIndices();
      if (remaining.length) {
        nextTrack();
      } else {
        stopMedia();
        currentIndex = -1;
        resetNowPlaying();
      }
    }
    showToast("Archivo oculto de bucles");
  }

  saveHiddenTrackIds();
  renderArtists();
  renderFolders();
  renderTypes();
  renderLibrary();
  renderQueue();
  renderStats();
}

// Restaura todos los archivos ocultos.
function restoreHiddenTracks() {
  hiddenTrackIds.clear();
  saveHiddenTrackIds();
  renderArtists();
  renderFolders();
  renderTypes();
  renderLibrary();
  renderQueue();
  renderStats();
  showToast("Archivos ocultos restaurados");
}

// Sincroniza boton de bucle y propiedad loop de audio/video.
function renderRepeatMode() {
  repeatBtn.classList.toggle("active", repeatMode !== "off");
  repeatBtn.classList.toggle("repeat-one", repeatMode === "one");
  audio.loop = repeatMode === "one";
  video.loop = repeatMode === "one";

  const label = repeatMode === "one"
    ? "Repetir archivo actual"
    : repeatMode === "all"
      ? "Repetir lista"
      : "Repetir desactivado";

  repeatBtn.title = label;
  repeatBtn.setAttribute("aria-label", label);
}

// Actualiza tiempo actual, slider principal y progreso del minireproductor.
function updateProgress() {
  const media = getActiveMedia();
  currentTime.textContent = formatTime(media.currentTime);
  if (Number.isFinite(media.duration) && media.duration > 0) {
    progress.value = String((media.currentTime / media.duration) * 100);
  } else {
    progress.value = "0";
  }
  updateMiniProgress();
}

// Actualiza duracion visible cuando el medio termina de leer metadatos.
function updateNowPlayingDuration() {
  durationTime.textContent = formatTime(getActiveMedia().duration);
  updateMiniPlayer();
}

// Cambia icono play/pausa tanto en barra principal como en minireproductor.
function renderPlayIcon() {
  const icon = getActiveMedia().paused
    ? '<path d="M8 5v14l11-7z"/>'
    : '<path d="M7 5h4v14H7zm6 0h4v14h-4z"/>';
  playIcon.innerHTML = icon;
  miniPlayIcon.innerHTML = icon;
}

// Libera el object URL creado para reproducir archivos locales.
function cleanupCurrentUrl() {
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

// Detiene audio y video y limpia sus fuentes.
function stopMedia() {
  for (const media of [audio, video]) {
    media.pause();
    media.removeAttribute("src");
    media.load();
  }
}

// Devuelve la UI al estado de "nada sonando".
function resetNowPlaying() {
  nowTitle.textContent = "Nada sonando";
  nowArtist.textContent = "Selecciona un archivo";
  currentTime.textContent = "0:00";
  durationTime.textContent = "0:00";
  progress.value = "0";
  renderPlayIcon();
  updateMiniPlayer();
}

// Muestra el menu contextual junto al puntero sin salirse de la ventana.
function showContextMenu(event, index) {
  contextTargetIndex = index;
  const track = tracks[index];
  if (!track) return;

  contextLoop.textContent = currentIndex === index && repeatMode === "one"
    ? "Quitar bucle de archivo"
    : "Bucle de este archivo";
  contextHide.textContent = isTrackHidden(track) ? "Mostrar en bucles" : "Ocultar de bucles";

  contextMenu.classList.remove("hidden");
  const menuRect = contextMenu.getBoundingClientRect();
  const left = Math.min(event.clientX, window.innerWidth - menuRect.width - 8);
  const top = Math.min(event.clientY, window.innerHeight - menuRect.height - 8);
  contextMenu.style.left = `${Math.max(left, 8)}px`;
  contextMenu.style.top = `${Math.max(top, 8)}px`;
}

// Oculta el menu contextual.
function hideContextMenu() {
  contextMenu.classList.add("hidden");
}

// Abre el minireproductor y opcionalmente reproduce la pista elegida.
function openMiniPlayer(index = currentIndex) {
  if (index >= 0 && tracks[index] && currentIndex !== index) {
    playTrack(index);
  }
  miniPlayer.classList.remove("hidden");
  updateMiniPlayer();
}

// Sincroniza titulo, subtitulo y progreso del minireproductor.
function updateMiniPlayer() {
  const track = tracks[currentIndex];
  if (!track) {
    miniTitle.textContent = "Nada sonando";
    miniMeta.textContent = "Selecciona un archivo";
    miniCurrent.textContent = "0:00";
    miniDuration.textContent = "0:00";
    miniProgressBar.style.width = "0%";
    return;
  }

  miniTitle.textContent = track.title;
  miniMeta.textContent = `${track.kindLabel} - ${track.artist}`;
  updateMiniProgress();
}

// Actualiza la barra fina de progreso del minireproductor.
function updateMiniProgress() {
  const media = getActiveMedia();
  const duration = Number.isFinite(media.duration) ? media.duration : 0;
  const current = Number.isFinite(media.currentTime) ? media.currentTime : 0;
  miniCurrent.textContent = formatTime(current);
  miniDuration.textContent = formatTime(duration);
  miniProgressBar.style.width = duration > 0 ? `${Math.min((current / duration) * 100, 100)}%` : "0%";
}

// Muestra el volumen como porcentaje junto al slider.
function updateVolumePercent() {
  volumePercent.textContent = `${Math.round(Number(volumeRange.value) * 100)}%`;
}

// Gestiona atajos: Ctrl+S/J/L/B y espacio para play/pausa.
function handleKeyboardShortcuts(event) {
  const key = event.key.toLowerCase();
  const editable = isEditableTarget(event.target);

  if (event.ctrlKey && !event.altKey && !event.metaKey) {
    if (key === "s") {
      event.preventDefault();
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle("active", isShuffle);
      return;
    }

    if (key === "j") {
      event.preventDefault();
      previousTrack();
      return;
    }

    if (key === "l") {
      event.preventDefault();
      nextTrack();
      return;
    }

    if (key === "b") {
      event.preventDefault();
      cycleRepeatMode();
      return;
    }
  }

  if (!editable && event.code === "Space") {
    event.preventDefault();
    togglePlay();
  }

  if (event.key === "Escape") {
    hideContextMenu();
  }
}

// Evita que el espacio u otros atajos actuen mientras se escribe o se pulsa UI.
function isEditableTarget(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLButtonElement
    || target instanceof HTMLVideoElement
    || target instanceof HTMLAudioElement
    || target?.isContentEditable;
}

// Devuelve el elemento media activo segun el tipo de la pista actual.
function getActiveMedia() {
  return tracks[currentIndex]?.kind === "video" ? video : audio;
}

// Cambia entre arte de audio y reproductor de video en el hero.
function toggleVideoStage(showVideo) {
  video.classList.toggle("hidden", !showVideo);
  audioArtwork.classList.toggle("hidden", showVideo);
  videoPlaceholder.classList.add("hidden");
}

// Decide si un File es audio/video por MIME o extension.
function isMediaFile(file) {
  return file.type.startsWith("audio/") || file.type.startsWith("video/") || isMediaName(file.name);
}

// Comprueba si un nombre de archivo tiene extension multimedia soportada.
function isMediaName(name) {
  const extension = name.split(".").pop()?.toLowerCase();
  return audioExtensions.has(extension) || videoExtensions.has(extension);
}

// Clasifica un archivo como audio o video.
function getMediaKind(file) {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  const extension = file.name.split(".").pop()?.toLowerCase();
  return videoExtensions.has(extension) ? "video" : "audio";
}

// Formatea segundos como m:ss o h:mm:ss.
function formatTime(seconds, forceHours = false) {
  if (!Number.isFinite(seconds) || seconds <= 0) return forceHours ? "0:00:00" : "0:00";
  const rounded = Math.floor(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remaining = String(rounded % 60).padStart(2, "0");
  if (hours > 0 || forceHours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${remaining}`;
  }
  return `${minutes}:${remaining}`;
}

// Escapa HTML para insertar texto de usuario/nombres de archivo sin romper markup.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Escapa atributos HTML; separado para dejar clara la intencion al crear href/value.
function escapeAttribute(value) {
  return escapeHtml(value);
}

// Genera un gradiente estable por archivo para la portada sintetica.
function albumGradient(seed) {
  let hash = 0;
  for (const char of seed) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const secondHue = (hue + 74) % 360;
  return `linear-gradient(135deg, hsl(${hue} 74% 47%), hsl(${secondHue} 72% 55%))`;
}

// SVG inline de audio usado en cola.
function audioIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-2-2.83M21 16a3 3 0 1 1-2-2.83"/></svg>';
}

// SVG inline de video usado en cola.
function videoIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5zm6 3v7l6-3.5z"/></svg>';
}

// Muestra mensajes temporales al usuario.
function showToast(message) {
  const existing = document.querySelector(".toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2400);
}
