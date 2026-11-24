/* =========================================================
   UMONGE · Almacén local de archivos (IndexedDB)
   Guarda PDF, PPT, Word, Excel, etc. dentro del navegador.
   ambito: "material" (Materiales) | "privado" (Archivos privados)
   ========================================================= */
(function () {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((ok, fail) => {
        const r = indexedDB.open("umonge", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("files", { keyPath: "id", autoIncrement: true });
        r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error);
    }));
    const run = async (mode, fn) => { const db = await open(); return new Promise((ok, fail) => {
        const tx = db.transaction("files", mode), st = tx.objectStore("files"), req = fn(st);
        tx.oncomplete = () => ok(req && req.result); tx.onerror = () => fail(tx.error); }); };

    const tipoDe = n => { const e = (n.split(".").pop() || "").toLowerCase();
        return ({ pdf: "PDF", ppt: "PPT", pptx: "PPT", doc: "DOC", docx: "DOC", xls: "XLS", xlsx: "XLS", csv: "XLS", png: "IMG", jpg: "IMG", jpeg: "IMG", mp4: "VIDEO", webm: "VIDEO", mov: "VIDEO", gif: "IMG", webp: "IMG" })[e] || e.toUpperCase().slice(0, 4) || "ARCHIVO"; };

    window.UMStore = {
        tipoDe,
        add: (meta, file) => run("readwrite", s => s.add({ ...meta, nombre: file.name, tipo: tipoDe(file.name), size: file.size, mime: file.type, fecha: new Date().toISOString(), blob: file })),
        list: async ambito => (await run("readonly", s => s.getAll())).filter(f => f.ambito === ambito).sort((a, b) => b.fecha.localeCompare(a.fecha)),
        get: id => run("readonly", s => s.get(id)),
        remove: id => run("readwrite", s => s.delete(id)),
        size: n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"
    };
})();
