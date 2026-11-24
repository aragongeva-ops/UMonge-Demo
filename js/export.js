/* =========================================================
   UMONGE · Exportación real: CSV, Excel (.xlsx), PDF e impresión
   Sin librerías externas. Uso:
       UMExport.csv(matriz, "nombre")
       UMExport.xlsx(matriz, "nombre", { hoja: "Reporte" })
       UMExport.pdf(matriz, "nombre", { titulo: "Reporte", subtitulo: "..." })
       UMExport.fromTable(document.querySelector("table"))  → matriz
   "matriz" = [[encabezados...], [fila...], ...]
   ========================================================= */
(function () {
    const stamp = () => new Date().toISOString().slice(0, 10);
    const txt = v => (v === null || v === undefined) ? "" : String(v);

    function download(name, mime, data) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([data], { type: mime }));
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    }

    /* ---------- CSV ---------- */
    function csv(m, name = "reporte_umonge") {
        const body = m.map(r => r.map(v => `"${txt(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
        download(`${name}_${stamp()}.csv`, "text/csv;charset=utf-8", "\ufeff" + body);
    }

    /* ---------- XLSX (zip sin compresión + XML) ---------- */
    const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

    function zip(files) { // files: [{name, data(Uint8Array)}]
        const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
        files.forEach(f => {
            const name = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
            h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
            h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true);
            h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
            parts.push(new Uint8Array(h.buffer), name, f.data);
            const c = new DataView(new ArrayBuffer(46));
            c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
            c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true);
            c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
            central.push(new Uint8Array(c.buffer), name);
            offset += 30 + name.length + f.data.length;
        });
        const cdSize = central.reduce((s, p) => s + p.length, 0), e = new DataView(new ArrayBuffer(22));
        e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
        e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
        return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    }

    const xml = s => txt(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    const colName = i => { let s = ""; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; };

    function xlsx(m, name = "reporte_umonge", opt = {}) {
        const enc = new TextEncoder(), hoja = (opt.hoja || "Reporte").replace(/[\\\/\?\*\[\]:]/g, "").slice(0, 31);
        const widths = m[0].map((_, c) => Math.min(48, Math.max(8, ...m.slice(0, 300).map(r => txt(r[c]).length + 2))));
        const rows = m.map((r, ri) => `<row r="${ri + 1}">` + r.map((v, ci) => {
            const ref = colName(ci) + (ri + 1), s = txt(v);
            if (ri > 0 && /^-?\d+(\.\d+)?$/.test(s) && !/^0\d/.test(s)) return `<c r="${ref}"><v>${s}</v></c>`;
            return `<c r="${ref}"${ri === 0 ? ' s="1"' : ""} t="inlineStr"><is><t xml:space="preserve">${xml(s)}</t></is></c>`;
        }).join("") + "</row>").join("");
        const last = colName(m[0].length - 1) + m.length;
        const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
            `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
            `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` +
            `<sheetData>${rows}</sheetData><autoFilter ref="A1:${last}"/></worksheet>`;
        const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
            `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>` +
            `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFB5121B"/></patternFill></fill></fills>` +
            `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
            `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
        const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const files = [
            ["[Content_Types].xml", H + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
            ["_rels/.rels", H + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
            ["xl/workbook.xml", H + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(hoja)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
            ["xl/_rels/workbook.xml.rels", H + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
            ["xl/styles.xml", styles], ["xl/worksheets/sheet1.xml", sheet]
        ].map(([n, d]) => ({ name: n, data: enc.encode(d) }));
        download(`${name}_${stamp()}.xlsx`, "application/octet-stream", zip(files));
    }

    /* ---------- PDF (motor mínimo, Helvetica, A4) ---------- */
    const latin = s => txt(s).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/→/g, "->").replace(/…/g, "...")
        .replace(/[^\x20-\xFF]/g, "?").replace(/[\\()]/g, m => "\\" + m);
    const col = c => c.map(v => (v / 255).toFixed(3)).join(" ");

    function Doc(w, h) {
        const pages = []; let cur = null;
        return {
            w, h,
            page() { cur = []; pages.push(cur); },
            text(x, y, s, size = 9, bold = false, rgb = [20, 20, 24]) { cur.push(`${col(rgb)} rg BT /F${bold ? 2 : 1} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${latin(s)}) Tj ET`); },
            rect(x, y, rw, rh, rgb) { cur.push(`${col(rgb)} rg ${x.toFixed(1)} ${y.toFixed(1)} ${rw.toFixed(1)} ${rh.toFixed(1)} re f`); },
            line(x1, y1, x2, y2, rgb = [200, 200, 205], lw = .5) { cur.push(`${col(rgb)} RG ${lw} w ${x1} ${y1} m ${x2} ${y2} l S`); },
            count: () => pages.length,
            build() {
                const objs = [];
                objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
                objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
                objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
                const kids = [];
                pages.forEach((ops, i) => {
                    const pg = 5 + i * 2, ct = pg + 1, body = ops.join("\n");
                    kids.push(`${pg} 0 R`);
                    objs[pg] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${ct} 0 R >>`;
                    objs[ct] = `<< /Length ${body.length} >>\nstream\n${body}\nendstream`;
                });
                objs[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`;
                let out = "%PDF-1.4\n", off = [];
                for (let i = 1; i < objs.length; i++) { off[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
                const xr = out.length;
                out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.slice(1).map(o => String(o).padStart(10, "0") + " 00000 n \n").join("");
                out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
                const u = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255;
                return u;
            }
        };
    }

    function pdf(m, name = "reporte_umonge", opt = {}) {
        const W = 842, H = 595, M = 36, size = m[0].length > 10 ? 6.5 : 8, rh = size + 8, d = Doc(W, H);
        const weight = m[0].map((_, c) => Math.min(38, Math.max(6, ...m.slice(0, 200).map(r => txt(r[c]).length))) + 2);
        const tw = weight.reduce((a, b) => a + b, 0), cw = weight.map(w => w / tw * (W - 2 * M));
        const perPage = Math.floor((H - 2 * M - 62) / rh), body = m.slice(1), total = Math.max(1, Math.ceil(body.length / perPage));
        const fit = (s, w) => { s = txt(s); const n = Math.max(2, Math.floor(w / (size * .5)) - 1); return s.length > n ? s.slice(0, n - 1) + "..." : s; };
        for (let p = 0; p < total; p++) {
            d.page();
            d.rect(0, H - 46, W, 46, [20, 20, 24]); d.rect(0, H - 48, W, 2, [217, 0, 0]);
            d.text(M, H - 30, "UNIVERSIDAD MONGE", 13, true, [255, 255, 255]);
            d.text(W - M - 190, H - 30, opt.titulo || "Reporte", 10, false, [220, 220, 225]);
            d.text(M, H - 66, (opt.subtitulo || "Generado el " + new Date().toLocaleDateString("es-NI")), 8, false, [90, 90, 98]);
            let y = H - 84; d.rect(M, y - 4, W - 2 * M, rh, [181, 18, 27]);
            let x = M; m[0].forEach((h, c) => { d.text(x + 3, y + 1, fit(h, cw[c]), size, true, [255, 255, 255]); x += cw[c]; });
            body.slice(p * perPage, (p + 1) * perPage).forEach((r, i) => {
                y -= rh; if (i % 2 === 0) d.rect(M, y - 4, W - 2 * M, rh, [243, 243, 245]);
                let xx = M; r.forEach((v, c) => { d.text(xx + 3, y + 1, fit(v, cw[c]), size); xx += cw[c]; });
            });
            d.text(M, 20, `${body.length} registros`, 7, false, [110, 110, 118]);
            d.text(W - M - 70, 20, `Página ${p + 1} de ${total}`, 7, false, [110, 110, 118]);
        }
        download(`${name}_${stamp()}.pdf`, "application/pdf", d.build());
    }

    /* ---------- Certificado en PDF ---------- */
    function certificado({ nombre, curso, fecha, empresa }) {
        const W = 842, H = 595, d = Doc(W, H), mid = s => W / 2 - latin(s).length * 7.2;
        d.page(); d.rect(0, 0, W, H, [20, 20, 24]); d.rect(18, 18, W - 36, H - 36, [244, 244, 246]); d.rect(18, H - 30, W - 36, 12, [181, 18, 27]);
        d.text(W / 2 - 95, H - 100, "UNIVERSIDAD MONGE", 22, true, [20, 20, 24]);
        d.text(W / 2 - 110, H - 150, "CERTIFICADO DE FINALIZACION", 15, true, [181, 18, 27]);
        d.text(W / 2 - 78, H - 215, "Se otorga el presente a", 12, false, [90, 90, 98]);
        d.text(mid(nombre) , H - 265, nombre, 24, true, [20, 20, 24]);
        d.text(W / 2 - 120, H - 315, "por completar satisfactoriamente el curso", 12, false, [90, 90, 98]);
        d.text(Math.max(40, W / 2 - curso.length * 3.6), H - 355, curso, 14, true, [20, 20, 24]);
        d.text(W / 2 - 80, H - 400, (empresa || "Grupo Monge") + " - Nicaragua", 11, false, [90, 90, 98]);
        d.text(W / 2 - 60, H - 440, "Fecha: " + fecha, 11, false, [90, 90, 98]);
        d.line(W / 2 - 110, 110, W / 2 + 110, 110, [20, 20, 24], .8); d.text(W / 2 - 60, 94, "Universidad Monge", 10, false, [90, 90, 98]);
        download(`certificado_${nombre.replace(/\s+/g, "_")}.pdf`, "application/pdf", d.build());
    }

    /* ---------- Utilidades ---------- */
    function fromTable(table) {
        const rows = [...table.querySelectorAll("tr")].filter(r => r.offsetParent !== null || r.closest("thead"));
        return rows.map(r => [...r.children].filter(c => !c.hasAttribute("data-noexport")).map(c => c.innerText.replace(/\s+/g, " ").trim()))
            .filter(r => r.length && r.some(Boolean));
    }

    window.UMExport = { csv, xlsx, pdf, certificado, fromTable, download, print: () => window.print() };
})();
