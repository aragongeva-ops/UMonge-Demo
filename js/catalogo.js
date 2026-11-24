/* =========================================================
   UMONGE · Catálogo maestro de contenidos (Universidad Monge Nicaragua)
   Fuente: inventario de la plataforma Moodle "Cursos U Monge".
   Estructura: categoría → subcategoría → títulos.
   Exporta window.UM_CATALOGO (lista plana) y window.UM_CATEGORIAS.
   Para agregar un curso: añade su título en la subcategoría que corresponda.
   ========================================================= */
(function () {
    const FUENTE = {
        "Cursos Universidad Monge NI": {
            "Cumplimiento y Normativa": [
                "Capacitación Anual Debida Diligencia para el conocimiento del Proveedor de Bienes y/o Servicios",
                "Capacitación Anual Debida Diligencia para el conocimiento de Aliados de Negocios",
                "Capacitación Anual Extracto Gobierno Corporativo 2026",
                "Capacitación Anual Reglamento Interno de Trabajo GMG Comercial Nicaragua S.A. 2026",
                "Capacitación Anual Prevención Lavado de Activos GMG Comercial Nicaragua S.A. 2026",
                "Capacitación Anual Prevención de Lavado de Activos GMG Servicios Nicaragua S.A. 2026",
                "Código de Ética GMG Comercial Nicaragua S.A.", "Código de Ética GMG Servicios Nicaragua S.A.",
                "Reglamento Interno de Trabajo GMG Nicaragua ZF S.A. Anual", "Reglamento Interno de Trabajo GMG Nicaragua ZF S.A. Nuevos Ingresos"],
            "Seguridad y Riesgos": [
                "Seguridad de la Información 2026 NI", "Procesos Liveness Seguridad y Prevención de Fraudes",
                "Prevención de Fraude GMG Servicios Nicaragua S.A.", "Prevención de Fraude GMG Comercial Nicaragua S.A.", "Gestión de Riesgos Inducción"],
            "Atención y Servicio": ["Soy Monge Experiencia del Cliente", "Atención Preferencial Adultos Mayores, Embarazadas y Personas Discapacitadas", "Excelencia en Atención al Cliente"],
            "Crédito y Cobros": [
                "Curso Anual de Cobros Abusivos Microfinanzas 2026", "Curso Anual de Ventas Agresivas Microfinanzas 2026", "Formalización de Expedientes de Crédito 2026",
                "Capacitación PLAFTFP Nuevos Ingresos y Traslados", "Curso Conozca a su Empleado", "Política Conozca a su Colaborador"],
            "Tecnología": ["Política de Uso de Inteligencia Artificial Nicaragua", "Capacitaciones Rapiweb Fase I", "Capacitaciones Rapiweb Fase II", "Capacitaciones Rapiweb Fase III", "Digitalización de Formularios MCF"],
            "Sistemas": ["OMS y TMS Tienda Física Administradores NI", "OMS Backup Tienda Física Administradores NI", "U Contact Supervisor", "U Contact Agente"],
            "Ventas": ["Certificación de Pasos de la Venta", "Preventa", "Inducción Televentas"],
            "Finanzas": ["Curso Gastos Deducibles GMG Comercial", "Curso Gastos Deducibles GMG Servicios"],
            "Otros": ["Video Marco Regulatorio CONAMI"]
        },
        "Políticas y Procedimientos NI": {
            "Recursos Humanos": ["Manual de Organización y Funciones", "Política de Selección y Contratación", "Política de Capacitación", "Política de Concurso Interno", "Política de Vacaciones",
                "Política de Uniformes", "Política de Comunicación de Políticas", "Procedimiento de Liquidación de Excolaborador", "Procedimiento de Resguardo de Expedientes", "Procedimiento de Entrega de Herramientas"],
            "Crédito": ["Manual de Procedimientos de Crédito", "Capacitación Anual Extracto Manual de Crédito", "Política Conozca a su Cliente", "Política de Debida Diligencia del Cliente",
                "Política y Procedimiento de Financiamiento", "Políticas y Procedimientos de Crédito Nicaragua"],
            "PLAFTFP": ["Política y Procedimiento de Prevención de Lavado de Activos", "Actualización de Categorización de PEP", "Política para Proveedores", "Política para Aliados de Negocio"],
            "Inventarios": ["Política de Toma Física de Inventario", "Procedimiento de Toma Física del Inventario", "Política de Administración de Inventarios", "Procedimiento de Inventarios de Repuestos"],
            "Logística": ["Política de Despacho de Mercadería", "Procedimiento de Recepción, Traslado y Devolución", "Política de Recepción, Traslado y Facturación de Repuestos"],
            "Ventas": ["Procedimientos Pasos de la Venta", "Procedimiento de Ventas a Crédito y Contado", "Política de Pago de Comisiones", "Procedimiento Push Money", "Política de Televentas"],
            "Talleres": ["Procedimiento de Atención a Siniestros Taller Serpento", "Procedimientos Operativos Taller Servitec"],
            "Finanzas": ["Política de Pago a Proveedores", "Política de Solicitud de Efectivo y Rendición de Gastos", "Catálogo de Cuentas Ingresos y Egresos", "Política de Análisis de Variaciones de Saldos"],
            "Control Interno": ["Manual de Control Interno", "Manual de Atención al Usuario", "Extracto de Manual de Atención al Usuario", "Procedimiento de Aplicación de Artículos Abandonados"]
        },
        "Academias NI": {
            "Línea Blanca": ["Academia Cocinas Mabe", "Academia Lavadoras Telstar", "Academia Productos Lavadoras Mabe", "Academia Lavadoras Frigidaire", "Academia Refrigeradoras Frigidaire",
                "Academia Refrigeradoras Telstar", "Academia Máquinas de Coser", "Academia Camas Facenco"],
            "Electrónica": ["Academia Xiaomi", "Academia Newton Roku TV", "Academia Televisores Hisense", "Academia Televisores LG", "Televisores y Refrigeradoras LG", "Generalidades de Computadoras"],
            "Motocicletas": ["Academia de Producto Motos TVS 2026", "Academia Productos Motos Serpento Sports 2026", "Academia Producto Serpento Scooter Cuadraciclos",
                "Academia de Producto Motos Serpento Mensajeras 2026", "Academia de Producto Motos Serpento Modelos 2026", "Moto Serpento Krait 250cc y 300cc"],
            "Garantías": ["Academia Garantía y Seguros"],
            "Ventas": ["8 Pasos de la Venta", "Refuerzo 8 Pasos de la Venta", "Refuerzo 8 Pasos de la Venta Segunda Parte"],
            "Microfinanzas": ["Escuelita Microfinanzas", "Escuelita Microfinanzas Abril", "Escuelita Microfinanzas Septiembre 2026", "Escuelita Microfinanzas Octubre 2026",
                "Escuelita Microfinanzas Noviembre 2026", "Escuelita MCF No.5", "Escuelita MCF Mayo 2026"]
        },
        "Actividades Complementarias NI": {
            "Perfil del colaborador": ["Perfil de Información del Colaborador", "Perfil de Información del Colaborador 2026 Nuevos Ingresos"]
        }
    };

    const MIN = { "Cursos Universidad Monge NI": 10, "Políticas y Procedimientos NI": 15, "Academias NI": 30, "Actividades Complementarias NI": 10 };
    const empresaDe = t => /Comercial/i.test(t) ? "GMG Comercial" : /Servicios/i.test(t) ? "GMG Servicios" : /\bZF\b|Zona Franca/i.test(t) ? "GMG Zona Franca" : "General";
    const codigo = t => "NI" + t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 3 && !/^\d+$/.test(w)).slice(0, 4).map(w => w[0]).join("").toUpperCase() + "26";

    const lista = [];
    Object.entries(FUENTE).forEach(([categoria, subs]) => Object.entries(subs).forEach(([subcategoria, titulos]) => titulos.forEach(titulo => lista.push({
        id: lista.length + 1, pais: "NI", categoria, subcategoria, area: subcategoria, titulo, empresa: empresaDe(titulo), codigo: codigo(titulo) + (lista.length + 1),
        minutos: MIN[categoria], colaborador: /nuevos? ingresos?|inducci[oó]n/i.test(titulo) ? "Nuevo ingreso" : "Colaborador activo", anual: /anual/i.test(titulo)
    }))));

    window.UM_PAISES = [
        { id: "CR", nombre: "Costa Rica", etiqueta: "Administración Costa Rica" }, { id: "NI", nombre: "Nicaragua", etiqueta: "Administración Nicaragua" },
        { id: "SV", nombre: "El Salvador", etiqueta: "Administración El Salvador" }, { id: "HN", nombre: "Honduras", etiqueta: "Administración Honduras" },
        { id: "GT", nombre: "Guatemala", etiqueta: "Administración Guatemala" }, { id: "RG", nombre: "Regional", etiqueta: "Administración Regional" },
        { id: "PR", nombre: "Pruebas", etiqueta: "Administración Pruebas" }];
    window.UM_CATALOGO = lista;
    window.UM_CATEGORIAS = Object.fromEntries(Object.entries(FUENTE).map(([c, s]) => [c, Object.keys(s)]));
})();
