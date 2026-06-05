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
        query: b => `node["amenity"~"drinking_water|water_point"](${b});node["natural"="spring"](${b});node["man_made"="water_tap"](${b});`
    },
    "chk-servicios": {
        emoji: "🚽", tipo: "Aseos", sym: "Restroom",
        query: b => `node["amenity"="toilets"](${b});node["building"="toilets"](${b});`
    },
    "chk-ducha": {
        emoji: "🚿", tipo: "Duchas", sym: "Shower",
        query: b => `node["amenity"~"shower|public_bath"](${b});`
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
        query: b => `node["amenity"="shelter"](${b});node["building"="hut"](${b});node["tourism"~"alpine_hut|wilderness_hut"](${b});node["leisure"~"bird_hide|wildlife_hide"](${b});`
    },
    "chk-comida": {
        emoji: "🛒", tipo: "Comida", sym: "Grocery Store",
        query: b => `node["shop"~"supermarket|convenience|bakery|grocery"](${b});`
    },
    "chk-picnic": {
        emoji: "🥪", tipo: "Picnic", sym: "Picnic Area",
        query: b => `node["leisure"="picnic_table"](${b});node["tourism"="picnic_site"](${b});node["amenity"="kitchen"](${b});`
    },
    "chk-cascada": {
        emoji: "🌊", tipo: "Cascada", sym: "Waterfall",
        query: b => `node["waterway"="waterfall"](${b});`
    },
    "chk-belleza": {
        emoji: "📸", tipo: "Vistas", sym: "Scenic Area",
        query: b => `node["tourism"~"viewpoint|attraction"](${b});`
    },
    "chk-cultura": {
        emoji: "🏛️", tipo: "Cultura", sym: "Museum",
        query: b => `node["tourism"="museum"](${b});node["building"~"cathedral|monastery|castle"](${b});node["historic"](${b});`
    },
    "chk-biblioteca": {
        emoji: "📚", tipo: "Biblioteca", sym: "Library",
        query: b => `node["amenity"="library"](${b});`
    },
    "chk-bicicleta": {
        emoji: "🚲", tipo: "Bicis", sym: "Bike Trail",
        query: b => `node["amenity"="bicycle_repair_station"](${b});node["shop"="bicycle"](${b});`
    },
    "chk-atm": {
        emoji: "🏧", tipo: "Cajero", sym: "Bank",
        query: b => `node["amenity"="atm"](${b});`
    }
};

function clasificarPOI(tags) {
    if (tags.amenity === "drinking_water" || tags.natural === "spring" || tags.man_made === "water_tap")
        return FILTERS["chk-aguabeber"];
    if (tags.amenity === "toilets" || tags.building === "toilets")
        return FILTERS["chk-servicios"];
    if (tags.amenity === "shower" || tags.amenity === "public_bath")
        return FILTERS["chk-ducha"];
    if (tags.natural === "hot_spring")
        return FILTERS["chk-termas"];
    if (tags.tourism === "camp_site")
        return FILTERS["chk-camping"];
    if (tags.amenity === "shelter" || tags.tourism === "alpine_hut" ||
        tags.tourism === "wilderness_hut" || tags.building === "hut" ||
        tags.leisure === "bird_hide" || tags.leisure === "wildlife_hide")
        return FILTERS["chk-refugio"];
    if (tags.shop && ["supermarket", "convenience", "bakery", "grocery"].includes(tags.shop))
        return FILTERS["chk-comida"];
    if (tags.leisure === "picnic_table" || tags.tourism === "picnic_site" || tags.amenity === "kitchen")
        return FILTERS["chk-picnic"];
    if (tags.waterway === "waterfall")
        return FILTERS["chk-cascada"];
    if (tags.tourism === "viewpoint" || tags.tourism === "attraction")
        return FILTERS["chk-belleza"];
    if (tags.historic || tags.tourism === "museum" ||
        ["cathedral", "monastery", "castle"].includes(tags.building))
        return FILTERS["chk-cultura"];
    if (tags.amenity === "library")
        return FILTERS["chk-biblioteca"];
    if (tags.amenity === "bicycle_repair_station" || tags.shop === "bicycle")
        return FILTERS["chk-bicicleta"];
    if (tags.amenity === "atm")
        return FILTERS["chk-atm"];
    return { emoji: "📍", tipo: "Interés", sym: "Waypoint" };
}

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
const summaryBox = document.getElementById('summary');
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
        summaryBox.innerHTML = "";
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
    const conteo = {};

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
        const cat = clasificarPOI(tags);
        conteo[cat.tipo] = (conteo[cat.tipo] || 0) + 1;

        const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div>${cat.emoji}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        const marker = L.marker([lat, lon], { icon }).addTo(map);
        const gmaps = `https://www.google.com/maps?q=${lat},${lon}`;
        const nombre = tags.name || cat.tipo;

        marker.bindPopup(
            `<div class="popup-title"><b>${escapeXml(nombre)}</b></div>` +
            `<div class="popup-type">${cat.emoji} ${cat.tipo}</div>` +
            `<a href="${gmaps}" target="_blank" rel="noopener" class="popup-link">Ver en Google Maps</a><br>` +
            `<button class="popup-btn-del" onclick="window.borrarPOI(${el.id})">Eliminar punto</button>`
        );

        pois.push({ id: el.id, lat, lon, nombre, sym: cat.sym, emoji: cat.emoji, marker });
    });

    const filas = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .map(([tipo, n]) => `<li><span>${tipo}</span><span>${n}</span></li>`)
        .join("");
    summaryBox.innerHTML = filas ? `<ul>${filas}</ul>` : "";

    setStatus(`Encontrados ${pois.length} puntos.`);
    btnDownload.disabled = pois.length === 0;
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

// ---------------------- Inicio ----------------------
cargarPreferencias();

// En móvil, abre el menú al cargar para que se vea la app y se pueda subir el GPX.
if (window.matchMedia('(max-width: 768px)').matches) {
    abrirMenu();
}