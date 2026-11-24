/* =========================================================
   UMONGE · Datos de usuarios, roles, progreso y reportes
   Depende de js/catalogo.js. Expone window.UMUsers y window.UMData.
   Todo se guarda en localStorage (modo demostración).
   Cuando exista el backend, reemplazar cada función por su API
   (ver docs/ARQUITECTURA_REPORTES.md).
   ========================================================= */
(function () {
    const C = window.UM_CATALOGO || [];
    const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
    const J = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
    const S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const hoy = () => new Date().toISOString();
    const dmy = d => d ? new Date(d).toLocaleDateString("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

    /* ====================== USUARIOS ====================== */
    const NOM = ["Carlos", "María", "José", "Ana", "Luis", "Karla", "Marvin", "Elena", "Jorge", "Sofía", "Daniel", "Lucía", "Pedro", "Valeria", "Mario", "Daniela"];
    const APE = ["Mendoza", "López", "Rodríguez", "Castillo", "Pérez", "Gutiérrez", "Ramírez", "Flores", "Sánchez", "Obando", "Chávez", "Navarro", "Zeledón", "Aguilar", "Blandón", "Medina"];
    const DEPS = { "Ventas": ["Asesor de Ventas", "Administrador de Tienda", "Coordinador de Ventas"], "Crédito y Cobros": ["Analista de Crédito", "Gestor de Cobros", "Supervisor de Crédito"],
        "Logística y CEDI": ["Bodeguero", "Supervisor de CEDI"], "Talento Humano": ["Analista de Talento Humano"], "Contabilidad": ["Contador", "Asistente Contable"],
        "Cumplimiento": ["Oficial de Cumplimiento"], "Tecnología": ["Soporte Técnico"], "Talleres": ["Técnico de Taller"], "Atención al Cliente": ["Agente SAC"] };
    const UBIC = { "Managua": "Pacífico", "Masaya": "Pacífico", "Granada": "Pacífico", "León": "Occidente", "Chinandega": "Occidente", "Estelí": "Norte", "Matagalpa": "Norte", "Juigalpa": "Central" };
    const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    function semilla() {
        const deps = Object.keys(DEPS), ubs = Object.keys(UBIC), lista = [];
        const base = [["Comunicación", "Nicaragua", "admin", "comunicacion.ni", "becker.arauz@grupomonge.com", true], ["Marta", "Rizo Blandón", "profesor", "mrizo", null, true],
            ["Luis", "Téllez Obando", "profesor", "ltellez", null, false]];
        for (let i = 0; i < 96; i++) {
            const b = base[i];
            const nombre = b ? b[0] : NOM[i % 16], apellido = b ? b[1] : APE[(i * 7 + 3) % 16] + " " + APE[(i * 3 + 5) % 16];
            const dep = b && b[2] === "admin" ? "Tecnología" : deps[hash("d" + i) % deps.length], puestos = DEPS[dep], ub = ubs[hash("u" + i) % ubs.length];
            const dd = String(1 + hash("a" + i) % 28).padStart(2, "0"), mm = String(1 + hash("b" + i) % 12).padStart(2, "0"), yy = String(70 + hash("c" + i) % 30);
            const usuario = b ? b[3] : norm(nombre[0] + apellido.split(" ")[0]) + (i > 20 ? i : "");
            lista.push({ id: i + 1, nombre, apellido, cedula: `001-${dd}${mm}${yy}-${String(1000 + i).padStart(4, "0")}${"ABCDEFGHJKLMNPRSTUVWXYZ"[hash("l" + i) % 23]}`,
                usuario, correo: (b && b[4]) || usuario + "@grupomonge.com", departamento: dep, puesto: puestos[hash("p" + i) % puestos.length], ubicacion: ub, regional: UBIC[ub],
                idJefatura: "J-" + String(1 + hash("j" + dep + ub) % 12).padStart(3, "0"), rol: b ? b[2] : "estudiante", pais: "NI", activo: i % 17 !== 5, permisoSubir: b ? !!b[5] : false });
        }
        return lista;
    }
    const UKEY = "umonge_users";
    const load = () => { let u = J(UKEY, null); if (!u) { u = semilla(); S(UKEY, u); } return u; };

    const UMUsers = {
        DEPS, UBIC, campos: ["nombre", "apellido", "cedula", "departamento", "puesto", "ubicacion", "idJefatura", "regional", "usuario", "rol"],
        list: () => load(), get: id => load().find(u => u.id === +id),
        actual() { const s = J("umonge_session", {}), l = load();
            return l.find(u => u.usuario.toLowerCase() === (s.usuario || "").toLowerCase()) || { id: 0, nombre: s.usuario || "Invitado", apellido: "", usuario: s.usuario || "", rol: s.rol || "estudiante", pais: "NI", activo: true, permisoSubir: false, ubicacion: "Managua", departamento: "", puesto: "" }; },
        add(u) { const l = load(); u.id = Math.max(0, ...l.map(x => x.id)) + 1; u.activo = true; u.permisoSubir = !!u.permisoSubir; l.push(u); S(UKEY, l); return u; },
        update(id, patch) { const l = load(), u = l.find(x => x.id === +id); if (u) { Object.assign(u, patch); S(UKEY, l); } return u; },
        existeCedula: (c, excepto) => load().some(u => u.cedula === c && u.id !== excepto),
        plantillaCSV: () => "nombre,apellido,cedula,departamento,puesto,ubicacion,id_jefatura,regional,usuario,rol\nAna,Pérez López,001-150690-0001X,Ventas,Asesor de Ventas,Managua,J-001,Pacífico,aperez,estudiante\n",
        importarCSV(texto) { const lineas = texto.replace(/^\ufeff/, "").split(/\r?\n/).filter(l => l.trim()); const cab = lineas.shift().split(",").map(h => norm(h.trim()).replace(/\s+/g, ""));
            let ok = 0, dup = 0; lineas.forEach(l => { const v = l.split(",").map(x => x.trim().replace(/^"|"$/g, "")), g = n => v[cab.indexOf(n)] || "";
                const u = { nombre: g("nombre"), apellido: g("apellido"), cedula: g("cedula"), departamento: g("departamento"), puesto: g("puesto"), ubicacion: g("ubicacion"),
                    idJefatura: g("idjefatura") || g("id_jefatura"), regional: g("regional") || UBIC[g("ubicacion")] || "", usuario: g("usuario"), rol: ["admin", "profesor"].includes(norm(g("rol"))) ? norm(g("rol")) : "estudiante" };
                u.correo = u.usuario + "@grupomonge.com"; if (!u.nombre || !u.cedula) return; if (UMUsers.existeCedula(u.cedula)) { dup++; return; } UMUsers.add(u); ok++; });
            return { ok, dup }; }
    };

    /* ====================== PROGRESO DEL USUARIO ====================== */
    const PASA = 80, INTENTOS = 3;
    const RK = () => "umonge_rec_" + UMUsers.actual().id;   // progreso por usuario
    const byTitle = t => (C.find(c => c.titulo.startsWith(t)) || {}).id;
    const SEED = [["Capacitación Anual Debida Diligencia para el conocimiento del Proveedor", 2, true], ["Código de Ética GMG Comercial", 4, false],
        ["Capacitación Anual Reglamento Interno de Trabajo GMG Comercial", 3, false], ["Seguridad de la Información 2026 NI", 1, false],
        ["Prevención de Fraude GMG Comercial", 0, false], ["Capacitación Anual Prevención Lavado de Activos GMG Comercial", 2, true]];

    function recs() {
        let r = J(RK(), null);
        if (!r) { r = {}; const now = Date.now(), dia = 864e5;
            SEED.forEach(([t, st, fav], i) => { const id = byTitle(t); if (!id) return; const ab = new Date(now - (i + 2) * dia).toISOString(), x = { fav, acc: new Date(now - i * dia * 1.5).toISOString() };
                if (st >= 1) x.lectura = { abierta: ab };
                if (st >= 2) x.lectura.leida = new Date(+new Date(ab) + 7 * 60e3).toISOString(), x.lectura.seg = 420;
                if (st >= 3) x.conf = { fecha: new Date(+new Date(ab) + 9 * 60e3).toISOString() };
                if (st >= 4) x.intentos = [{ ini: new Date(+new Date(ab) + 12 * 60e3).toISOString(), fin: new Date(+new Date(ab) + 12 * 60e3 + 215e3).toISOString(), seg: 215, nota: 100 }];
                r[id] = x; });
            S(RK(), r); }
        return r;
    }
    const cambiar = (id, fn) => { const r = recs(); r[id] = r[id] || {}; fn(r[id]); r[id].acc = hoy(); S(RK(), r); return r[id]; };

    /* ====================== EVALUACIONES ====================== */
    const DEMO = { demo: true, aprobatoria: PASA, intentos: INTENTOS, preguntas: [
        { q: "¿Cuál es la calificación aprobatoria de las evaluaciones?", op: ["60%", "70%", "80%", "100%"], ok: 2 },
        { q: "¿Cuántos intentos se permiten en la evaluación?", op: ["1", "2", "3", "Ilimitados"], ok: 2 },
        { q: "¿En qué orden se deben visualizar las secciones del curso?", op: ["Evaluación, lectura y confirmación", "Lectura, confirmación de lectura y evaluación", "Confirmación, evaluación y lectura"], ok: 1 },
        { q: "Si realizas varios intentos, ¿qué calificación se toma?", op: ["La del primer intento", "La calificación más alta", "La del último intento", "El promedio"], ok: 1 },
        { q: "Al seleccionar «SI» en la confirmación de lectura, ¿qué sucede?", op: ["Aceptas el conocimiento del documento y la responsabilidad de aplicarlo", "Se reinicia el curso", "Se elimina tu progreso"], ok: 0 }] };
    let bancos = null;
    async function cargarBancos() { if (bancos) return bancos; try { const r = await fetch("data/evaluaciones.json", { cache: "no-store" }); bancos = r.ok ? await r.json() : {}; } catch (e) { bancos = {}; } return bancos; }

    const THUMB = { "Cursos Universidad Monge NI": ["#b5121b", "#3a0a0e", "◈"], "Políticas y Procedimientos NI": ["#5a5a64", "#1e1e23", "☰"],
        "Academias NI": ["#d90000", "#6e0b11", "★"], "Actividades Complementarias NI": ["#3d3d46", "#17171a", "✓"] };
    const COMP = { "Cursos Universidad Monge NI": ["Conoce y aplica la normativa vigente", "Identifica riesgos y señales de alerta", "Actúa según los procedimientos establecidos"],
        "Políticas y Procedimientos NI": ["Conoce la política oficial", "Aplica el procedimiento en su puesto", "Documenta correctamente su gestión"],
        "Academias NI": ["Domina las características del producto", "Comunica beneficios al cliente", "Aplica los pasos de la venta"],
        "Actividades Complementarias NI": ["Mantiene su información actualizada", "Cumple los requisitos de la empresa", "Confirma sus datos oficiales"] };
    const SIGLA = { "GMG Comercial": "CO", "GMG Servicios": "SE", "GMG Zona Franca": "ZF", "General": "UM" };

    const UMData = {
        PASA, INTENTOS, hash, dmy, todos: () => C, catalogo: () => C.filter(c => c.pais === UMData.pais()), curso: id => C.find(c => c.id === +id), competencias: c => COMP[c.categoria],
        rec: id => recs()[id] || {},
        estaInscrito: id => !!recs()[id],
        inscribir(id) { if (!recs()[id]) cambiar(id, x => { x.fav = false; }); },
        /* lectura → confirmación → evaluación (en ese orden) */
        abrirLectura(id) { cambiar(id, x => { if (!x.lectura) x.lectura = { abierta: hoy() }; }); },
        marcarLeido(id) { return cambiar(id, x => { x.lectura = x.lectura || { abierta: hoy() }; if (!x.lectura.leida) { x.lectura.leida = hoy(); x.lectura.seg = Math.max(1, Math.round((Date.now() - new Date(x.lectura.abierta)) / 1000)); } }); },
        confirmar(id) { return cambiar(id, x => { if (x.lectura && x.lectura.leida && !x.conf) x.conf = { fecha: hoy() }; }); },
        registrarIntento(id, ini, nota) { return cambiar(id, x => { x.intentos = x.intentos || []; x.intentos.push({ ini, fin: hoy(), seg: Math.round((Date.now() - new Date(ini)) / 1000), nota }); }); },
        mejor: id => { const i = (recs()[id] || {}).intentos || []; return i.length ? Math.max(...i.map(a => a.nota)) : null; },
        aprobado: id => (UMData.mejor(id) ?? -1) >= PASA,
        pasos: id => { const r = recs()[id] || {}; return { lectura: !!(r.lectura && r.lectura.leida), conf: !!r.conf, eval: UMData.aprobado(id) }; },
        avance: id => { const p = UMData.pasos(id); return Math.round(Object.values(p).filter(Boolean).length / 3 * 100); },
        favorito(id) { let v; cambiar(id, x => { x.fav = !x.fav; v = x.fav; }); return v; },
        esFav: id => !!(recs()[id] || {}).fav,
        tocar(id) { if (recs()[id]) cambiar(id, () => {}); },
        video(id, patch) { return cambiar(id, x => { x.video = { ...(x.video || {}), ...patch }; }); },
        misCursos: () => Object.entries(recs()).map(([id, v]) => ({ ...UMData.curso(id), avance: UMData.avance(id), fav: v.fav, acceso: v.acc })).filter(c => c.id && c.pais === UMData.pais()),
        eventos() { const base = new Date(); base.setHours(0, 0, 0, 0); const sig = { lectura: "Lectura de la política", conf: "Confirmación de lectura", eval: "Evaluación" };
            return UMData.misCursos().filter(c => c.avance < 100).map((c, i) => { const p = UMData.pasos(c.id), k = !p.lectura ? "lectura" : !p.conf ? "conf" : "eval";
                return { dias: 1 + i * 2, hora: "23:59", tipo: k === "eval" ? "Evaluación" : k === "conf" ? "Confirmación" : "Lectura", titulo: sig[k] + ": " + c.titulo, curso: c.id, fecha: new Date(+base + (1 + i * 2) * 864e5) }; })
                .sort((a, b) => a.dias - b.dias).slice(0, 6); },
        thumb(c, cls = "") { const [a, b, g] = THUMB[c.categoria] || THUMB["Cursos Universidad Monge NI"];
            return `<span class="thumb ${cls}" style="--t1:${a};--t2:${b}"><i>${g}</i><b>${SIGLA[c.empresa]}</b></span>`; },
        async evaluacion(id) { const c = UMData.curso(id), local = J("umonge_eval_" + id, null); if (local) return local;
            const b = await cargarBancos(), k = Object.keys(b).find(t => c.titulo.startsWith(t)); return k ? { ...b[k], aprobatoria: b[k].aprobatoria || PASA, intentos: b[k].intentos || INTENTOS } : DEMO; },
        guardarEvaluacion: (id, ev) => S("umonge_eval_" + id, ev),

        /* ---- países / administraciones ---- */
        paises: () => window.UM_PAISES || [],
        pais: () => localStorage.getItem("umonge_pais") || UMUsers.actual().pais || "NI",
        setPais: c => localStorage.setItem("umonge_pais", c),
        paisNombre: c => ((window.UM_PAISES || []).find(p => p.id === (c || UMData.pais())) || { nombre: "Nicaragua" }).nombre,
        paisesVisibles(rol, u) { const t = window.UM_PAISES || []; return rol === "admin" ? t : t.filter(p => p.id === ((u && u.pais) || "NI")); },

        /* ---- inscripciones (las hace el administrador o el profesor) ---- */
        inscribirUsuario(uid, cid) { const k = "umonge_rec_" + uid, r = J(k, null) || {}; if (!r[cid]) r[cid] = { fav: false, acc: hoy() }; S(k, r); },
        desinscribirUsuario(uid, cid) { const k = "umonge_rec_" + uid, r = J(k, null) || {}; delete r[cid]; S(k, r); },

        /* ---- notas puestas por el profesor y reporte por curso ---- */
        notas: id => J("umonge_notas", {})[id] || {},
        ponerNota(id, uid, nota) { const n = J("umonge_notas", {}); n[id] = n[id] || {}; if (nota === "" || nota === null) delete n[id][uid]; else n[id][uid] = { nota: +nota, fecha: hoy() }; S("umonge_notas", n); },
        participantes: id => UMUsers.list().filter(u => u.rol === "estudiante" && u.activo && hash(u.id + "|" + id) % 3 !== 0),
        reporteCurso(id) {
            const c = UMData.curso(id), ov = UMData.notas(id);
            return UMUsers.list().filter(u => u.rol === "estudiante" && u.activo && (u.pais || "NI") === c.pais).map(u => {
                const st = J("umonge_rec_" + u.id, null); let real = false, estado, nota = "", fin = "";
                if (st) {                                   // usuario con progreso propio: se calcula con sus registros
                    if (!st[id]) return null; real = true;
                    const ints = st[id].intentos || [], best = ints.length ? Math.max(...ints.map(a => a.nota)) : null, ok = best !== null && best >= PASA;
                    estado = ok ? "Completado" : ints.length >= INTENTOS ? "Reprobado" : st[id].lectura ? "Pendiente" : "Sin iniciar";
                    if (best !== null) nota = best; if (ok) fin = ints[ints.length - 1].fin;
                } else {                                     // usuario de demostración sin progreso propio
                    if (hash(u.id + "|" + id) % 3 === 0) return null;
                    const h = hash(u.id + "*" + id), r = h % 100;
                    if (r < 30) estado = "Sin iniciar"; else if (r < 55) estado = "Pendiente";
                    else if (r < 62) { estado = "Reprobado"; nota = 40 + h % 40; fin = new Date(2026, 9, 1 + h % 28); }
                    else { estado = "Completado"; nota = 80 + h % 21; fin = new Date(2026, 9, 1 + h % 28); }
                }
                if (ov[u.id]) { nota = ov[u.id].nota; estado = nota >= PASA ? "Completado" : "Reprobado"; fin = new Date(ov[u.id].fecha); }
                return { u, estado, nota, fin: dmy(fin), duracion: c.minutos + " min", codigo: c.codigo, real };
            }).filter(Boolean);
        },
        /* Formato oficial de reporte de cursos (12 columnas) + estado */
        COLS_REPORTE: ["Nombre", "Apellido", "Cédula", "Departamento", "Puesto", "Ubicación", "ID jefatura", "Regional", "Código corto", "Duración", "Nota", "Fecha fin"],
        filaReporte: r => [r.u.nombre, r.u.apellido, r.u.cedula, r.u.departamento, r.u.puesto, r.u.ubicacion, r.u.idJefatura, r.u.regional, r.codigo, r.duracion, r.nota, r.fin]
    };

    window.UMUsers = UMUsers; window.UMData = UMData;
})();
