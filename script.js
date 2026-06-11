/* ============================================================
   Hito — GPX + puntos de interés
   ============================================================ */

// ---------------------- Configuración ----------------------
const OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
];

const FILTERS = {
    "chk-aguabeber": {
        emoji: "💧", tipo: "Agua", sym: "Drinking Water",
        query: b => `node["amenity"~"drinking_water|water_point"](${b});node["natural"="spring"](${b});node["man_made"="water_tap"](${b});node["man_made"="water_well"]["pump"~"yes|manual|electric"](${b});`
    },
    "chk-servicios": {
        emoji: "🚽", tipo: "Aseos", sym: "Restroom",
        query: b => `node["amenity"="toilets"](${b});node["building"="toilets"](${b});`
    },
    "chk-ducha": {
        emoji: "🚿", tipo: "Duchas", sym: "Shower",
        query: b => `node["amenity"~"shower|public_bath"](${b});node["leisure"="sports_centre"](${b});`
    },
    "chk-termas": {
        emoji: "♨️", tipo: "Termas", sym: "Hot Spring",
        query: b => `node["natural"="hot_spring"](${b});`
    },
    "chk-camping": {
        emoji: "⛺", tipo: "Camping", sym: "Campground",
        query: b => `node["tourism"="camp_site"](${b});`
    },
    "chk-refugio": {
        emoji: "🛖", tipo: "Refugio", sym: "Lodge",
        query: b => `node["amenity"="shelter"](${b});node["building"="hut"](${b});node["tourism"~"alpine_hut|wilderness_hut"](${b});node["leisure"~"bird_hide|wildlife_hide"](${b});node["man_made"="cabin"](${b});`
    },
    "chk-comida": {
        emoji: "🛒", tipo: "Comida", sym: "Grocery Store",
        query: b => `node["shop"~"supermarket|convenience|bakery|grocery|greengrocer|farm|butcher|deli"](${b});node["amenity"="fuel"]["shop"~"convenience|yes"](${b});`
    },
    "chk-picnic": {
        emoji: "🥪", tipo: "Picnic", sym: "Picnic Area",
        query: b => `node["leisure"="picnic_table"](${b});node["tourism"="picnic_site"](${b});node["amenity"="kitchen"](${b});node["amenity"="bbq"](${b});`
    },
    "chk-cascada": {
        emoji: "🏞️", tipo: "Parajes", sym: "Scenic Area",
        query: b => `node["waterway"="waterfall"](${b});node["natural"="waterfall"](${b});node["natural"="cave_entrance"](${b});node["natural"="cliff"](${b});node["natural"~"^rock$|^stone$"](${b});`
    },
    "chk-belleza": {
        emoji: "📸", tipo: "Vistas", sym: "Scenic Area",
        query: b => `node["tourism"~"viewpoint|attraction"](${b});`
    },
    "chk-cultura": {
        emoji: "🏛️", tipo: "Cultura", sym: "Museum",
        query: b => `node["tourism"="museum"](${b});node["building"~"cathedral|monastery|castle"](${b});node["historic"](${b});node["tourism"="gallery"](${b});node["tourism"="artwork"](${b});`
    },
    "chk-biblioteca": {
        emoji: "📚", tipo: "Biblioteca", sym: "Library",
        query: b => `node["amenity"="library"](${b});`
    },
    "chk-bicicleta": {
        emoji: "🚲", tipo: "Tiendas", sym: "Shop",
        query: b => `node["amenity"="bicycle_repair_station"](${b});node["shop"~"bicycle|sports|outdoor|doityourself|hardware"](${b});`
    },
    "chk-atm": {
        emoji: "🏧", tipo: "Cajero", sym: "Bank",
        query: b => `node["amenity"="atm"](${b});`
    },
    "chk-salud": {
        emoji: "🏥", tipo: "Salud", sym: "Medical Facility",
        query: b => `node["amenity"~"pharmacy|hospital|clinic"](${b});node["emergency"="defibrillator"](${b});`
    },
    "chk-seguridad": {
        emoji: "🚔", tipo: "Seguridad", sym: "Safety",
        query: b => `node["amenity"~"police|fire_station"](${b});node["emergency"="mountain_rescue"](${b});`
    },
    "chk-carga": {
        emoji: "🔋", tipo: "Carga móvil", sym: "Charging Station",
        query: b => `node["amenity"="phone_booth"](${b});node["amenity"="bench"]["bench:charging"="yes"](${b});node["amenity"="charging_station"]["socket:usb"="yes"](${b});node["amenity"="charging_station"]["usb"="yes"](${b});node["amenity"="power_outlet"](${b});node["socket:schuko"="yes"](${b});node["socket:domestic"="yes"](${b});`
    }
};

function clasificarPOI(tags) {
    if (tags.amenity === "drinking_water" || tags.natural === "spring" || tags.man_made === "water_tap" ||
        (tags.man_made === "water_well" && ["yes","manual","electric"].includes(tags.pump)))
        return FILTERS["chk-aguabeber"];
    if (tags.amenity === "toilets" || tags.building === "toilets")
        return FILTERS["chk-servicios"];
    if (tags.amenity === "shower" || tags.amenity === "public_bath" || tags.leisure === "sports_centre")
        return FILTERS["chk-ducha"];
    if (tags.natural === "hot_spring")
        return FILTERS["chk-termas"];
    if (tags.tourism === "camp_site")
        return FILTERS["chk-camping"];
    if (tags.amenity === "shelter" || tags.tourism === "alpine_hut" ||
        tags.tourism === "wilderness_hut" || tags.building === "hut" ||
        tags.leisure === "bird_hide" || tags.leisure === "wildlife_hide" ||
        tags.man_made === "cabin")
        return FILTERS["chk-refugio"];
    if ((tags.shop && ["supermarket","convenience","bakery","grocery","greengrocer","farm","butcher","deli"].includes(tags.shop)) ||
        (tags.amenity === "fuel" && (tags.shop === "convenience" || tags.shop === "yes")))
        return FILTERS["chk-comida"];
    if (tags.leisure === "picnic_table" || tags.tourism === "picnic_site" || tags.amenity === "kitchen" || tags.amenity === "bbq")
        return FILTERS["chk-picnic"];
    if (tags.waterway === "waterfall" || tags.natural === "waterfall" || tags.natural === "cave_entrance" ||
        tags.natural === "cliff" || tags.natural === "rock" || tags.natural === "stone")
        return FILTERS["chk-cascada"];
    if (tags.tourism === "viewpoint" || tags.tourism === "attraction")
        return FILTERS["chk-belleza"];
    if (tags.historic || tags.tourism === "museum" || tags.tourism === "gallery" || tags.tourism === "artwork" ||
        ["cathedral", "monastery", "castle"].includes(tags.building))
        return FILTERS["chk-cultura"];
    if (tags.amenity === "library")
        return FILTERS["chk-biblioteca"];
    if (tags.amenity === "bicycle_repair_station" ||
        (tags.shop && ["bicycle","sports","outdoor","doityourself","hardware"].includes(tags.shop)))
        return FILTERS["chk-bicicleta"];
    if (tags.amenity === "atm")
        return FILTERS["chk-atm"];
    if (tags.amenity === "pharmacy" || tags.amenity === "hospital" || tags.amenity === "clinic" ||
        tags.emergency === "defibrillator")
        return FILTERS["chk-salud"];
    if (tags.amenity === "police" || tags.amenity === "fire_station" ||
        tags.emergency === "mountain_rescue")
        return FILTERS["chk-seguridad"];
    if (tags.amenity === "phone_booth" || tags.amenity === "power_outlet" ||
        (tags.amenity === "bench" && tags["bench:charging"] === "yes") ||
        (tags.amenity === "charging_station" && (tags["socket:usb"] === "yes" || tags.usb === "yes")) ||
        tags["socket:schuko"] === "yes" || tags["socket:domestic"] === "yes")
        return FILTERS["chk-carga"];
    return { emoji: "📍", tipo: "Interés", sym: "Waypoint" };
}

// Categoría genérica para puntos manuales cuyo tipo no es uno de los estipulados.
const GENERIC = { emoji: "📍", tipo: "Punto", sym: "Waypoint" };

// ---------------------- Estado ----------------------
let routePoints = [];
let pois = [];
let originalXml = null;
let trackLayer = null;
let baseFileName = "ruta";

// ---------------------- Mapa ----------------------
const map = L.map('map', { zoomControl: false }).setView([40.41, -3.70], 6);

// Capas base: mapa y satélite
const capaMapa = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
});
const capaSatelite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics', maxZoom: 19
    });
capaMapa.addTo(map);

// Zoom arriba a la derecha (para no chocar con el botón del menú en móvil)
L.control.zoom({ position: 'topright' }).addTo(map);
// Selector de capa abajo a la derecha
L.control.layers({ "Mapa": capaMapa, "Satélite": capaSatelite }, null, { position: 'bottomright' }).addTo(map);
// Atribución abajo a la izquierda
map.attributionControl.setPosition('bottomleft');

// ---------------------- Utilidades de interfaz ----------------------
const statusBox = document.getElementById('status');
const btnDownload = document.getElementById('btnDownload');

function setStatus(msg, isError = false) {
    statusBox.textContent = msg || "";
    statusBox.classList.toggle('error', !!isError && !!msg);
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ---------------------- Persistencia de filtros ----------------------
function guardarPreferencias() {
    try {
        const estado = {};
        Object.keys(FILTERS).forEach(id => {
            const el = document.getElementById(id);
            if (el) estado[id] = el.checked;
        });
        estado.radius = document.getElementById('radius').value;
        localStorage.setItem('hito_prefs', JSON.stringify(estado));
    } catch (e) { /* sin localStorage: no pasa nada */ }
}

function cargarPreferencias() {
    try {
        const guardado = JSON.parse(localStorage.getItem('hito_prefs'));
        if (!guardado) return;
        Object.keys(FILTERS).forEach(id => {
            const el = document.getElementById(id);
            if (el && typeof guardado[id] === 'boolean') el.checked = guardado[id];
        });
        if (guardado.radius) document.getElementById('radius').value = guardado.radius;
    } catch (e) { /* nada */ }
}

// ---------------------- Carga del GPX ----------------------
document.getElementById('gpxFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    baseFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    const reader = new FileReader();
    reader.onload = function (event) {
        // Actualizar la etiqueta del input personalizado
        const fileLabel = document.getElementById('fileLabel');
        fileLabel.textContent = file.name;
        fileLabel.style.color = 'var(--fg)';
        originalXml = event.target.result;
        const xml = new DOMParser().parseFromString(originalXml, "text/xml");

        const trk = Array.from(xml.getElementsByTagName("trkpt"));
        const rte = Array.from(xml.getElementsByTagName("rtept"));
        const pts = trk.length ? trk : rte;

        routePoints = pts
            .map(p => [parseFloat(p.getAttribute("lat")), parseFloat(p.getAttribute("lon"))])
            .filter(p => !isNaN(p[0]) && !isNaN(p[1]));

        if (!routePoints.length) {
            setStatus("No se encontraron puntos de ruta en el archivo.", true);
            return;
        }

        if (trackLayer) map.removeLayer(trackLayer);
        trackLayer = L.polyline(routePoints, { color: '#000000', weight: 4 }).addTo(map);
        map.fitBounds(trackLayer.getBounds());
        setStatus(`Ruta cargada (${routePoints.length} puntos).`);
    };
    reader.readAsText(file);
});

// ---------------------- Búsqueda de POIs ----------------------
async function buscarPOIs() {
    if (!routePoints.length) {
        setStatus("Primero sube un archivo GPX de ruta.", true);
        return;
    }
    const radius = parseInt(document.getElementById('radius').value, 10);

    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    routePoints.forEach(([lat, lon]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
    });
    const margin = (radius / 111000) + 0.01;
    const bbox = `${minLat - margin},${minLon - margin},${maxLat + margin},${maxLon + margin}`;

    let filtros = "";
    Object.keys(FILTERS).forEach(id => {
        const el = document.getElementById(id);
        if (el && el.checked) filtros += FILTERS[id].query(bbox);
    });
    if (!filtros) {
        setStatus("Selecciona al menos un filtro.", true);
        return;
    }

    const query = `[out:json][timeout:90];(${filtros});out center;`;

    let data = null;
    for (const url of OVERPASS_SERVERS) {
        setStatus("Escaneando la ruta… (puede tardar unos segundos)");
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "data=" + encodeURIComponent(query)
            });
            if (res.ok) { data = await res.json(); break; }
        } catch (err) { console.log("Fallo en", url); }
    }

    if (!data || !data.elements) {
        setStatus("Error: los servidores están saturados, prueba de nuevo.", true);
        return;
    }

    setStatus("Filtrando resultados…");
    pois.forEach(p => map.removeLayer(p.marker));
    pois = [];

    // Agrupa picnics cercanos (≤200 m) y descarta los duplicados dentro de cada grupo.
    const esPicnic = t => t.leisure === "picnic_table" || t.tourism === "picnic_site" ||
                          t.amenity === "kitchen" || t.amenity === "bbq";
    const picnicDescartados = new Set();
    const picnicEls = data.elements.filter(el => esPicnic(el.tags || {}));
    picnicEls.forEach((el, i) => {
        if (picnicDescartados.has(el.id)) return;
        const lat1 = el.lat || (el.center && el.center.lat);
        const lon1 = el.lon || (el.center && el.center.lon);
        if (!lat1 || !lon1) return;
        picnicEls.slice(i + 1).forEach(el2 => {
            if (picnicDescartados.has(el2.id)) return;
            const lat2 = el2.lat || (el2.center && el2.center.lat);
            const lon2 = el2.lon || (el2.center && el2.center.lon);
            if (!lat2 || !lon2) return;
            if (getDistance(lat1, lon1, lat2, lon2) <= 200) picnicDescartados.add(el2.id);
        });
    });

    data.elements.forEach(el => {
        const lat = el.lat || (el.center && el.center.lat);
        const lon = el.lon || (el.center && el.center.lon);
        if (!lat || !lon) return;

        let isNear = false;
        const step = Math.max(1, Math.floor(routePoints.length / 400));
        for (let i = 0; i < routePoints.length; i += step) {
            if (getDistance(lat, lon, routePoints[i][0], routePoints[i][1]) <= radius) {
                isNear = true;
                break;
            }
        }
        if (!isNear) return;

        const tags = el.tags || {};
        if (tags.disused === "yes" || tags.abandoned === "yes" ||
            tags.access === "private" || tags.access === "no") return;
        if (esPicnic(tags) && picnicDescartados.has(el.id)) return;

        const cat = clasificarPOI(tags);
        crearPOI(el.id, lat, lon, tags.name || cat.tipo, cat);
    });

    setStatus(`Encontrados ${pois.length} puntos.`);
    btnDownload.disabled = pois.length === 0;
}

// Crea un marcador de POI (lo usan tanto la búsqueda automática como el añadido manual).
function crearPOI(id, lat, lon, nombre, cat) {
    const icon = L.divIcon({
        className: 'custom-icon',
        html: `<div>${cat.emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
    const marker = L.marker([lat, lon], { icon }).addTo(map);
    const gmaps = `https://www.google.com/maps?q=${lat},${lon}`;
    const streetview = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;

    marker.bindPopup(
        `<div class="popup-title"><b>${escapeXml(nombre)}</b></div>` +
        `<div class="popup-type">${cat.emoji} ${cat.tipo}</div>` +
        `<a href="${gmaps}" target="_blank" rel="noopener" class="popup-link">Ver en Google Maps</a><br>` +
        `<a href="${streetview}" target="_blank" rel="noopener" class="popup-link">Street View (si hay imagen)</a><br>` +
        `<button class="popup-btn-del" onclick="window.borrarPOI(${id})">Eliminar punto</button>`
    );

    pois.push({ id, lat, lon, nombre, sym: cat.sym, emoji: cat.emoji, marker });
    return marker;
}

window.borrarPOI = function (id) {
    const idx = pois.findIndex(p => p.id === id);
    if (idx > -1) {
        map.removeLayer(pois[idx].marker);
        pois.splice(idx, 1);
        setStatus(`Quedan ${pois.length} puntos.`);
        btnDownload.disabled = pois.length === 0;
    }
};

// ---------------------- Exportar GPX ----------------------
function descargarGPX() {
    if (!pois.length) {
        setStatus("No hay puntos que exportar.", true);
        return;
    }
    const waypoints = pois.map(p =>
        `<wpt lat="${p.lat}" lon="${p.lon}"><name>${escapeXml(p.nombre)}</name><sym>${p.sym}</sym></wpt>`
    ).join("");

    const base = originalXml && originalXml.includes('</gpx>')
        ? originalXml
        : `<?xml version="1.0"?><gpx version="1.1"></gpx>`;
    const finalContent = base.replace('</gpx>', waypoints + '\n</gpx>');

    const blob = new Blob([finalContent], { type: 'application/gpx+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${baseFileName}_con_pois.gpx`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ---------------------- Interacción ----------------------
document.getElementById('btnSearch').addEventListener('click', buscarPOIs);
btnDownload.addEventListener('click', descargarGPX);

document.getElementById('toggleAll').addEventListener('click', () => {
    const ids = Object.keys(FILTERS);
    const algunoApagado = ids.some(id => !document.getElementById(id).checked);
    ids.forEach(id => { document.getElementById(id).checked = algunoApagado; });
    guardarPreferencias();
});

Object.keys(FILTERS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', guardarPreferencias);
});
document.getElementById('radius').addEventListener('change', guardarPreferencias);

// ---------------------- Ventana de info ----------------------
const infoModal = document.getElementById('infoModal');
document.getElementById('infoBtn').addEventListener('click', () => infoModal.classList.add('show'));
document.getElementById('infoClose').addEventListener('click', () => infoModal.classList.remove('show'));
infoModal.addEventListener('click', e => { if (e.target === infoModal) infoModal.classList.remove('show'); });

// ---------------------- Menú móvil (drawer) ----------------------
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');

function abrirMenu() {
    sidebar.classList.add('open');
    backdrop.classList.add('show');
    document.body.classList.add('menu-open'); // oculta el botón hamburguesa
}
function cerrarMenu() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
    document.body.classList.remove('menu-open');
    setTimeout(() => map.invalidateSize(), 300);
}

document.getElementById('menuToggle').addEventListener('click', abrirMenu);
document.getElementById('sidebarClose').addEventListener('click', cerrarMenu);
backdrop.addEventListener('click', cerrarMenu);

window.addEventListener('resize', () => map.invalidateSize());

// ---------------------- Añadir punto manual ----------------------
let modoAnadir = false;
let clickLatLng = null;
let manualId = -1; // ids negativos para no chocar con los de OpenStreetMap
const btnAdd = document.getElementById('btnAdd');
const mapEl = document.getElementById('map');
const editBar = document.getElementById('editBar');

// Opciones del selector: las mismas categorías que ya existen + "Otro".
const opcionesTipo =
    Object.keys(FILTERS).map(id => {
        const f = FILTERS[id];
        return `<option value="${id}">${f.emoji} ${f.tipo}</option>`;
    }).join("") +
    `<option value="otro">📍 Otro</option>`;

function setModoAnadir(activo) {
    modoAnadir = activo;
    btnAdd.classList.toggle('active', activo);
    mapEl.classList.toggle('crosshair', activo);
    editBar.classList.toggle('show', activo);
    document.body.classList.toggle('edit-mode', activo);
    if (!activo) map.closePopup();

    // En móvil: al activar se cierra el menú (para ver el mapa);
    // al salir con "Listo" se vuelve a abrir (para descargar sin buscar el botón).
    if (window.matchMedia('(max-width: 768px)').matches) {
        if (activo) cerrarMenu();
        else abrirMenu();
    }
}

btnAdd.addEventListener('click', () => setModoAnadir(!modoAnadir));
document.getElementById('editDone').addEventListener('click', () => setModoAnadir(false));

map.on('click', e => {
    if (!modoAnadir) return;
    clickLatLng = e.latlng;
    const form =
        `<div class="add-form">` +
        `<input id="add-name" type="text" placeholder="Nombre (opcional)">` +
        `<select id="add-type">${opcionesTipo}</select>` +
        `<button class="popup-btn-add" onclick="window.confirmarPunto()">Añadir punto</button>` +
        `</div>`;
    L.popup({ closeButton: true }).setLatLng(e.latlng).setContent(form).openOn(map);
});

// Confirmar el punto desde el formulario del popup (global: lo llama el HTML del popup).
window.confirmarPunto = function () {
    if (!clickLatLng) return;
    const nombre = (document.getElementById('add-name').value || "").trim();
    const tipo = document.getElementById('add-type').value;
    const cat = tipo === 'otro' ? GENERIC : FILTERS[tipo];
    const marker = crearPOI(manualId--, clickLatLng.lat, clickLatLng.lng, nombre || cat.tipo, cat);
    map.closePopup();
    clickLatLng = null;
    btnDownload.disabled = pois.length === 0;
    setStatus(`Punto añadido (${pois.length} en total).`);
    marker.openPopup();
};

// ---------------------- Inicio ----------------------
cargarPreferencias();

// En móvil, abre el menú al cargar para que se vea la app y se pueda subir el GPX.
if (window.matchMedia('(max-width: 768px)').matches) {
    abrirMenu();
}