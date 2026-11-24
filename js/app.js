/* =========================================================
   UMONGE · Lógica principal
   1. Sesión   2. Tema   3. Utilidades UM (modal, toast, archivos)
   4. Navegación entre módulos   5. Menú de usuario   6. Eventos
   ========================================================= */
(function () {

/* 1. SESIÓN ------------------------------------------------ */
// Modo demostración: el login guarda la sesión en localStorage.
const SESION = JSON.parse(localStorage.getItem("umonge_session") || "null");
if (!SESION) { location.replace("pages/login.html"); return; }

const ahora = new Date().toISOString();
if (!localStorage.getItem("umonge_first")) localStorage.setItem("umonge_first", ahora);
if (!sessionStorage.getItem("umonge_visit")) {            // un registro por visita
    localStorage.setItem("umonge_prev", localStorage.getItem("umonge_last") || ahora);
    localStorage.setItem("umonge_last", ahora);
    sessionStorage.setItem("umonge_visit", "1");
}

const pageContent = document.getElementById("pageContent");
const pageTitle   = document.getElementById("pageTitle");
const sidebar     = document.getElementById("sidebar");
const layout      = document.querySelector(".layout");

/* 2. TEMA (claro / oscuro) -------------------------------- */
const THEME_KEY = "umonge_theme";   // misma clave que usa el login

function getTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#0a0a0d" : "#d9d9df";

    // Marca la opción activa si la pantalla de Configuración está abierta
    document.querySelectorAll("[data-theme-option]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.themeOption === theme);
    });
}

setTheme(getTheme());

/* 3. UTILIDADES COMPARTIDAS (window.UM) ------------------- */
const TITULOS = { portal: "Inicio", dashboard: "Mis cursos", usuarios: "Usuarios", academias: "Academias", cursos: "Cursos", materiales: "Materiales",
    actividades: "Actividades", evaluaciones: "Evaluaciones", seguimiento: "Seguimiento", calendario: "Calendario", comunicados: "Comunicados",
    reportes: "Reportes", administracion: "Administración", configuracion: "Configuración", curso: "Curso", perfil: "Perfil", archivos: "Archivos privados" };
const PADRE = { curso: "cursos" };   // qué botón del menú se marca como activo

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const usuario = SESION.usuario || "Comunicación Nicaragua";
const U0 = window.UMUsers.actual();
const ROL = SESION.rol || U0.rol || "admin";              // administrador | profesor | estudiante
const ROLES = { admin: "Administrador", profesor: "Profesor", estudiante: "Estudiante" };
const nombreCompleto = U0.id ? (U0.nombre + " " + U0.apellido).trim() : usuario;

const UM = {
    params: {}, usuario, esc, rol: ROL, ROLES, nombre: nombreCompleto, yo: U0,
    /* Permisos: admin todo; profesor según lo que le habilite el administrador */
    puede(accion) {
        const subir = ROL === "admin" || (ROL === "profesor" && (U0.id ? U0.permisoSubir : true));
        return ({ subir, calificar: ROL !== "estudiante", reportes: ROL !== "estudiante", usuarios: ROL === "admin", editarEvaluacion: ROL !== "estudiante" })[accion] || false;
    },
    iniciales: n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "US",
    fecha: (d, o = { day: "numeric", month: "long", year: "numeric" }) => new Date(d).toLocaleDateString("es-NI", o),

    toast(msg) {
        const t = document.createElement("div");
        t.className = "um-toast"; t.textContent = msg; document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add("show"));
        setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2600);
    },

    /* Ventana modal: UM.modal({ titulo, html, ancho }) → { el, cerrar } */
    modal({ titulo = "", html = "", ancho = 560 } = {}) {
        const o = document.createElement("div");
        o.className = "um-modal";
        o.innerHTML = `<div class="um-modal-box" style="max-width:${ancho}px" role="dialog" aria-modal="true">
            <div class="um-modal-head"><h3>${esc(titulo)}</h3><button type="button" class="um-x" aria-label="Cerrar">✕</button></div>
            <div class="um-modal-body">${html}</div></div>`;
        document.body.appendChild(o);
        const cerrar = () => { o.remove(); document.removeEventListener("keydown", tecla); };
        const tecla = e => { if (e.key === "Escape") cerrar(); };
        o.addEventListener("click", e => { if (e.target === o || e.target.closest(".um-x")) cerrar(); });
        document.addEventListener("keydown", tecla);
        return { el: o, cerrar };
    },

    /* Abre un archivo: PDF e imágenes en visor; el resto se descarga.  f = { nombre, tipo, url | blob } */
    abrir(f) {
        const url = f.url || URL.createObjectURL(f.blob), tipo = (f.tipo || "").toUpperCase();
        if (tipo === "PDF") {
            UM.modal({ titulo: f.nombre, ancho: 980, html: `<iframe class="um-viewer" src="${url}"></iframe>
                <p class="um-note"><a href="${url}" download="${esc(f.nombre)}" class="um-btn">⇩ Descargar</a></p>` });
        } else if (tipo === "VIDEO") {
            UM.modal({ titulo: f.nombre, ancho: 900, html: `<video src="${url}" controls style="width:100%;border-radius:8px;background:#000"></video>` });
        } else if (tipo === "IMG") {
            UM.modal({ titulo: f.nombre, ancho: 900, html: `<img class="um-img" src="${url}" alt="${esc(f.nombre)}">` });
        } else {
            const a = document.createElement("a"); a.href = url; a.download = f.nombre; document.body.appendChild(a); a.click(); a.remove();
            UM.toast("Descargando " + f.nombre);
        }
    },

    /* Lista unificada de materiales: data/materiales.json + archivos subidos desde el navegador */
    async materiales() {
        let fijos = [];
        try { const r = await fetch("data/materiales.json", { cache: "no-store" }); if (r.ok) fijos = await r.json(); } catch (e) { /* sin lista */ }
        const lista = fijos.map((m, i) => ({ origen: "carpeta", id: "f" + i, titulo: m.titulo, categoria: m.categoria || "General", curso: m.curso ?? "",
            nombre: m.archivo.split("/").pop(), tipo: window.UMStore.tipoDe(m.archivo), url: m.archivo, size: m.tamano || "", fecha: m.fecha || "" }));
        try { (await window.UMStore.list("material")).forEach(f => lista.push({ origen: "local", id: f.id, titulo: f.titulo, categoria: f.categoria || "General",
            curso: f.curso ?? "", nombre: f.nombre, tipo: f.tipo, blob: f.blob, size: window.UMStore.size(f.size), fecha: f.fecha })); } catch (e) { /* IndexedDB no disponible */ }
        if (ROL === "estudiante") {   // el estudiante solo ve materiales de los cursos en que está inscrito
            const D = window.UMData, mios = D.todos().filter(c => D.estaInscrito(c.id));
            return lista.filter(m => mios.some(c => UM.esDeCurso(m, c)));
        }
        return lista;
    },
    /* ¿Este material pertenece al curso? (el campo curso puede ser el id o parte del título) */
    esDeCurso(m, c) { const k = String(m.curso ?? "").trim(); return !!k && (k === String(c.id) || c.titulo.toLowerCase().includes(k.toLowerCase())); },


    /* Subida de archivos: UM.subir({ ambito: "material" | "privado", curso, onDone }) */
    subir({ ambito = "material", curso = "", onDone } = {}) {
        const cursos = window.UMData.catalogo(), esMat = ambito === "material";
        const m = UM.modal({ titulo: esMat ? "Agregar material" : "Subir archivos", ancho: 520, html: `
            <div class="um-drop" id="umDrop">Arrastra archivos aquí o haz clic para elegirlos<br><small>PDF, PPT, PPTX, DOC, XLS, imágenes…</small>
                <input type="file" id="umFile" multiple hidden></div><div id="umSel" class="um-note"></div>
            ${esMat ? `<div class="um-field"><label for="umTit">Título (opcional)</label><input id="umTit" placeholder="Si lo dejas vacío se usa el nombre del archivo"></div>
            <div class="um-field"><label for="umCur">Curso</label><select id="umCur"><option value="">Material general</option>
                ${cursos.map(c => `<option value="${c.id}" ${String(c.id) === String(curso) ? "selected" : ""}>${esc(c.titulo)}</option>`).join("")}</select></div>
            <div class="um-field"><label for="umCat">Categoría</label><input id="umCat" placeholder="Ej.: Cumplimiento"></div>` : ""}
            <button type="button" class="um-btn" id="umGuardar">Guardar</button>` });
        const drop = m.el.querySelector("#umDrop"), input = m.el.querySelector("#umFile"), sel = m.el.querySelector("#umSel"); let files = [];
        const mostrar = () => sel.innerHTML = files.map(f => `📄 ${esc(f.name)} <small>(${window.UMStore.size(f.size)})</small>`).join("<br>");
        drop.addEventListener("click", () => input.click());
        input.addEventListener("change", () => { files = [...input.files]; mostrar(); });
        ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
        ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
        drop.addEventListener("drop", e => { files = [...e.dataTransfer.files]; mostrar(); });
        m.el.querySelector("#umGuardar").addEventListener("click", async () => {
            if (!files.length) { UM.toast("Elige al menos un archivo"); return; }
            const val = id => (m.el.querySelector(id) || {}).value || "";
            try {
                for (const f of files) await window.UMStore.add({ ambito, titulo: (files.length === 1 && val("#umTit")) || f.name.replace(/\.[^.]+$/, ""), curso: val("#umCur"), categoria: val("#umCat") || "General" }, f);
                UM.toast(files.length > 1 ? files.length + " archivos guardados" : "Archivo guardado"); m.cerrar(); if (onDone) onDone();
            } catch (e) { UM.toast("No se pudo guardar el archivo en este navegador"); }
        });
    },

    /* Administración (país) activa */
    pais: () => window.UMData.pais(), paisNombre: () => window.UMData.paisNombre(),
    setPais(c) { window.UMData.setPais(c); actualizarChip(); },

    open(page, params = {}, titulo) { return cargar(page, titulo || TITULOS[page] || page, params); },
    setTitulo(t) { pageTitle.textContent = t; }
};
window.UM = UM;

/* 4. NAVEGACIÓN ------------------------------------------- */
// Los <script> dentro de un módulo no corren con innerHTML; se recrean aquí.
function ejecutarScripts(contenedor) {
    contenedor.querySelectorAll("script").forEach(old => {
        const s = document.createElement("script");
        s.textContent = old.textContent;
        old.replaceWith(s);
    });
}

const SOLO = { usuarios: ["admin"], administracion: ["admin"], reportes: ["admin", "profesor"], cursos: ["admin", "profesor"], academias: ["admin", "profesor"] };
const NECESITAN_CATALOGO = ["cursos", "academias", "reportes"];   // páginas que no tienen sentido sin cursos en el país actual

async function cargar(page, title, params = {}) {
    if (SOLO[page] && !SOLO[page].includes(ROL)) { UM.toast("Tu rol (" + ROLES[ROL] + ") no tiene acceso a este módulo"); if (page !== "portal") return cargar("portal", "Inicio"); }
    UM.params = params;
    if (NECESITAN_CATALOGO.includes(page) && !window.UMData.catalogo().length) {
        pageContent.innerHTML = `<article class="settings-card" style="text-align:center;padding:36px"><h2>Aún no hay contenido para ${esc(window.UMData.paisNombre())}</h2>
            <p style="margin:10px 0 18px">Esta administración todavía no tiene cursos cargados.</p><button class="um-btn" data-go="portal">Volver al inicio</button></article>`;
        pageTitle.textContent = title; document.body.dataset.page = page; return;
    }
    pageContent.innerHTML = '<div class="loading">Cargando módulo...</div>';

    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) throw new Error("No se pudo encontrar el módulo.");

        pageContent.innerHTML = await response.text();
        ejecutarScripts(pageContent);
        pageTitle.textContent = title;
        document.body.dataset.page = page;   // permite estilos propios por módulo

        const activo = PADRE[page] || page;
        document.querySelectorAll("[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === activo));

        setTheme(getTheme());          // refresca botones de tema del módulo
        sidebar.classList.remove("open");
        window.scrollTo({ top: 0 });

    } catch (error) {
        pageContent.innerHTML = `
            <article class="settings-card">
                <h2>No se pudo cargar este módulo</h2>
                <p>Comprueba que el archivo exista dentro de la carpeta pages.</p>
            </article>`;
        console.error(error);
    }
}

function actualizarChip() { const c = document.getElementById("paisChip"); if (c) c.textContent = window.UMData.paisNombre().toUpperCase(); }
document.getElementById("paisChip").addEventListener("click", () => cargar("portal", "Inicio"));
actualizarChip();

/* 5. MENÚ DE USUARIO -------------------------------------- */
const avatarBtn = document.getElementById("avatarBtn"), dropdown = document.getElementById("userDropdown");
avatarBtn.textContent = UM.iniciales(nombreCompleto);
document.getElementById("udName").textContent = nombreCompleto;
document.getElementById("udRole").textContent = ROLES[ROL] + " · Nicaragua";
document.querySelectorAll("[data-roles]").forEach(el => { if (!el.dataset.roles.split(",").includes(ROL)) el.hidden = true; });

document.getElementById("rolBtn").addEventListener("click", () => {
    alternarMenu(false);
    const m = UM.modal({ titulo: "Cambiar rol (demostración)", ancho: 400, html: `<p style="margin-bottom:12px">Para probar la plataforma con cada tipo de usuario.</p><div class="um-list">
        ${Object.entries(ROLES).map(([k, v]) => `<button class="um-opt ${k === ROL ? "on" : ""}" data-rol="${k}">${v}${k === ROL ? "<small>actual</small>" : ""}</button>`).join("")}</div>` });
    m.el.addEventListener("click", e => { const b = e.target.closest("[data-rol]"); if (!b) return;
        localStorage.setItem("umonge_session", JSON.stringify({ ...SESION, rol: b.dataset.rol })); location.reload(); });
});

const alternarMenu = abrir => {
    const v = abrir ?? dropdown.hidden;
    dropdown.hidden = !v; avatarBtn.setAttribute("aria-expanded", String(v));
};
avatarBtn.addEventListener("click", e => { e.stopPropagation(); alternarMenu(); });
document.addEventListener("click", e => { if (!e.target.closest("#userMenu")) alternarMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape") alternarMenu(false); });

document.getElementById("langBtn").addEventListener("click", () => {
    alternarMenu(false);
    UM.modal({ titulo: "Idioma", ancho: 380, html: `<div class="um-list"><button class="um-opt on">Español <small>activo</small></button>
        <button class="um-opt" disabled>English <small>próximamente</small></button></div>` });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("umonge_session");
    sessionStorage.removeItem("umonge_visit");
    location.href = "pages/login.html";
});

/* 6. EVENTOS GENERALES ------------------------------------ */
document.querySelectorAll(".navigation [data-page]").forEach(btn => {
    btn.addEventListener("click", () => cargar(btn.dataset.page, btn.dataset.title));
});

// Cualquier elemento con data-go="pagina" (y data-params='{"id":3}') navega a ese módulo
document.addEventListener("click", event => {
    const go = event.target.closest("[data-go]");
    if (go) {
        alternarMenu(false);
        let p = {}; try { p = JSON.parse(go.dataset.params || "{}"); } catch (e) { /* sin parámetros */ }
        UM.open(go.dataset.go, p);
        return;
    }
    const option = event.target.closest("[data-theme-option]");
    if (option) setTheme(option.dataset.themeOption);
});

// Sidebar colapsable: en escritorio se oculta/muestra; en móvil se abre como panel
if (localStorage.getItem("umonge_sidebar") === "collapsed") layout.classList.add("collapsed");

document.getElementById("menuToggle").addEventListener("click", () => {
    if (window.innerWidth > 800) {
        layout.classList.toggle("collapsed");
        localStorage.setItem("umonge_sidebar", layout.classList.contains("collapsed") ? "collapsed" : "open");
    } else {
        sidebar.classList.toggle("open");
    }
});

cargar("portal", "Inicio");

})();
