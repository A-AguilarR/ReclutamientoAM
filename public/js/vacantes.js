document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const welcome           = document.getElementById('welcome');
    const logoutBtn         = document.getElementById('logoutBtn');
    const logoutBtnHeader   = document.getElementById('logoutBtnHeader');

    const filtroTexto       = document.getElementById('filtroTexto');
    const filtroEstatus     = document.getElementById('filtroEstatus');
    const tbodyVacantes     = document.getElementById('tbodyVacantes');

    const modal             = document.getElementById('modal');
    const modalTitle        = document.getElementById('modal-title');
    const modalCloseBtn     = document.getElementById('modalCloseBtn');

    const dArea             = document.getElementById('d-area');
    const dContrato         = document.getElementById('d-contrato');
    const dFecha            = document.getElementById('d-fecha');
    const dSalario          = document.getElementById('d-salario');
    const dPost             = document.getElementById('d-post');
    const dReqs             = document.getElementById('d-reqs');

    const rankingList       = document.getElementById('ranking-list');

    const statusSelect      = document.getElementById('status-select');
    const btnGuardarEstatus = document.getElementById('btnGuardarEstatus');
    const btnFlujoExterno   = document.getElementById('btnFlujoExterno');

    let todasLasVacantes    = [];
    let vacanteActivaId     = null;

    async function fetchJSON(url, opt = {}) {
        const res = await fetch(url, {
            ...opt,
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + token,
                ...(opt.headers || {})
            }
        });

        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }

        if (res.status === 204) return { ok: true, data: null };

        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    }

    async function handleLogout() {
        try {
            //API: POST /api/logout, adaptar al api
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
        } catch (_) {}

        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }

    logoutBtn.addEventListener('click', handleLogout);
    logoutBtnHeader.addEventListener('click', handleLogout);

    async function loadMe() {
        // API: GET /api/me, adaptar al api
        // usuarios_sistema JOIN bd_empleados.empleados por id_empleado
        // Respuesta esperada: { usuario: { nombre, ap, am } }
        const r = await fetchJSON('/api/me');

        if (!r.ok) { welcome.textContent = 'Sesión activa.'; return; }

        const u = r.data?.usuario;
        welcome.textContent = u
            ? `Bienvenido/a: ${u.nombre} ${u.ap} ${u.am}`
            : 'Bienvenido/a.';
    }

    async function loadCatalogos() {
        // API: GET /api/catalogos/estatus-vacante, adpatar al api
        // SELECT id_estatus_vacante as valor, nombre as etiqueta FROM cat_estatus_vacante
        // Respuesta esperada: [{ valor: 1, etiqueta: 'Activa' }, ...]
        const r = await fetchJSON('/api/catalogos/estatus-vacante');

        if (!r.ok || !Array.isArray(r.data)) return;

        // Filtro de la tabla (conserva "Todos")
        filtroEstatus.innerHTML =
            '<option value="">Todos los estatus</option>' +
            r.data.map(e =>
                `<option value="${e.etiqueta}">${e.etiqueta}</option>`
            ).join('');

        statusSelect.innerHTML = r.data.map(e =>
            `<option value="${e.etiqueta}">${e.etiqueta}</option>`
        ).join('');
    }

    function renderTabla(vacantes) {
        if (!vacantes.length) {
            tbodyVacantes.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; color:#718096; padding:1rem;">
                        Sin vacantes encontradas.
                    </td>
                </tr>`;
            return;
        }

        tbodyVacantes.innerHTML = vacantes.map(v => {
            const fecha = v.fecha_cierre
                ? new Date(v.fecha_cierre).toLocaleDateString('es-MX')
                : '—';

           const flujo = v.fecha_apertura_externa
                ? '<span class="pill pill-activa">Activo</span>'
                : '<span class="pill pill-cerrada">Inactivo</span>';

            return `
            <tr>
                <td>${v.titulo            ?? '—'}</td>
                <td>${v.nombre_area       ?? '—'}</td>
                <td><span class="pill">${v.nombre_estatus ?? '—'}</span></td>
                <td>${v.total_postulantes  ?? 0}</td>
                <td>${fecha}</td>
                <td>${flujo}</td>
                <td>
                    <button class="btn btn-secondary btn-sm btn-ver-detalle"
                        data-id="${v.id_vacante}">
                        Ver detalle
                    </button>
                </td>
            </tr>`;
        }).join('');

        tbodyVacantes.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', () => {
            window.location.href = `detalle-vacante.html?id=${btn.dataset.id}`;
            });
        });
    }

    async function loadVacantes() {
        //API: GET /api/vacantes, adaptar al api
        // Respuesta esperada (JOINs resueltos en Laravel):
        // [{
        //   id_vacante,
        //   titulo,
        //   nombre_area,           ← JOIN bd_empleados.areas
        //   nombre_estatus,        ← JOIN cat_estatus_vacante
        //   total_postulantes,     ← COUNT postulaciones WHERE id_vacante
        //   fecha_cierre,
        //   fecha_apertura_externa ← NULL = flujo cerrado
        // }, ...]
        const r = await fetchJSON('/api/vacantes');

        if (!r.ok || !Array.isArray(r.data)) {
            tbodyVacantes.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; color:#718096; padding:1rem;">
                        No se pudieron cargar las vacantes.
                    </td>
                </tr>`;
            return;
        }

        todasLasVacantes = r.data;
        renderTabla(todasLasVacantes);
    }

   function aplicarFiltros() {
        const texto   = filtroTexto.value.toLowerCase().trim();
        const estatus = filtroEstatus.value;

        const filtradas = todasLasVacantes.filter(v => {
            const coincideTexto   = !texto   || (v.titulo ?? '').toLowerCase().includes(texto);
            // se compara contra nombre_estatus ya que la API devuelve solo el nombre
            const coincideEstatus = !estatus || v.nombre_estatus === estatus;
            return coincideTexto && coincideEstatus;
        });

        renderTabla(filtradas);
    }

    filtroTexto.addEventListener('input', aplicarFiltros);
    filtroEstatus.addEventListener('change', aplicarFiltros);

    function openModal(id) {
        vacanteActivaId = id;
        modal.classList.add('active');
        switchTab('info');
        loadDetalle(id);
    }

    function closeModal() {
        modal.classList.remove('active');
        vacanteActivaId = null;
    }

    modalCloseBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });

    function switchTab(nombre) {
        document.querySelectorAll('.tab').forEach(t =>
            t.classList.toggle('active', t.dataset.tab === nombre));
        document.querySelectorAll('.tab-panel').forEach(p =>
            p.classList.toggle('active', p.id === `tab-${nombre}`));

        if (nombre === 'ranking' && vacanteActivaId) {
            loadRanking(vacanteActivaId);
        }
    }

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    async function loadDetalle(id) {
        [dArea, dContrato, dFecha, dSalario, dPost].forEach(el => el.textContent = '...');
        dReqs.innerHTML        = '';
        modalTitle.textContent = 'Cargando...';

        //API: GET /api/vacantes/{id_vacante}, adptar al api
        // Respuesta esperada:
        // {
        //   id_vacante,
        //   titulo,
        //   nombre_area,           ← JOIN bd_empleados.areas
        //   nombre_estatus,        ← JOIN cat_estatus_vacante
        //   descripcion,
        //   fecha_cierre,
        //   fecha_apertura_externa, ← NULL = flujo cerrado
        //   total_postulantes,     ← COUNT postulaciones
        //   requisitos: [{         ← requisitos_vacante JOIN cat_tipos_requisito
        //     descripcion,
        //     peso_pct,
        //     valor_minimo,
        //     valor_ideal,
        //     es_excluyente
        //   }, ...]
        // }
        // NOTA: salario y tipo_contrato no existen en vacantes,
        // podrían venir de bd_empleados.puestos_catalogo si se hace JOIN por nombre del puesto
        const r = await fetchJSON(`/api/vacantes/${id}`);

        if (!r.ok) {
            modalTitle.textContent = 'Error al cargar la vacante.';
            return;
        }

        const v = r.data;

        modalTitle.textContent = v.titulo      ?? 'Detalle de vacante';
        dArea.textContent      = v.nombre_area ?? '—';
        dFecha.textContent     = v.fecha_cierre
            ? new Date(v.fecha_cierre).toLocaleDateString('es-MX')
            : '—';
        dPost.textContent      = v.total_postulantes ?? 0;

        dContrato.textContent  = v.nombre_tipo_contrato ?? '—';

        // salario: no está en la BD actual,agregar el campo a la tabla vacante
        dSalario.textContent   = v.salario ?? '—';

        statusSelect.value = v.nombre_estatus ?? '';

        const flujoActivo = !!v.fecha_apertura_externa;
        btnFlujoExterno.textContent    = flujoActivo
            ? 'Desactivar flujo externo'
            : 'Activar flujo externo';
        btnFlujoExterno.dataset.activo = flujoActivo ? '1' : '0';

        if (Array.isArray(v.requisitos) && v.requisitos.length) {
            dReqs.innerHTML = v.requisitos.map(req => `
                <div style="display:flex; gap:.5rem; align-items:center; margin-bottom:6px; flex-wrap:wrap;">
                    <span class="pill pill-activa">${req.peso_pct ?? 0}%</span>
                    <span>${req.descripcion ?? '—'}</span>
                    <span style="color:#718096; font-size:.8rem;">
                        Mín: ${req.valor_minimo ?? '—'} · Ideal: ${req.valor_ideal ?? '—'}
                        ${req.es_excluyente ? '· <strong>Excluyente</strong>' : ''}
                    </span>
                </div>`).join('');
        } else {
            dReqs.textContent = 'Sin requisitos registrados.';
        }
    }

    async function loadRanking(id) {
        rankingList.innerHTML = '<p style="color:#718096;">Cargando ranking...</p>';

        //API: GET /api/vacantes/{id_vacante}/ranking, adaptar al api
        // Respuesta esperada (postulaciones ordenadas por puntaje_final DESC):
        // [{
        //   posicion,
        //   nombre_candidato,      ← bd_empleados.empleados.nombre OR candidatos_externos.nombre
        //   tipo_candidato,        ← cat_tipos_candidato.nombre (Interno / Externo)
        //   puntaje_automatico,    ← postulaciones.puntaje_automatico
        //   puntaje_entrevista,    ← postulaciones.puntaje_entrevista
        //   puntaje_final,         ← postulaciones.puntaje_final
        //   nombre_estatus,        ← cat_estatus_postulacion.nombre
        // }, ...]
        const r = await fetchJSON(`/api/vacantes/${id}/ranking`);

        if (!r.ok || !Array.isArray(r.data) || !r.data.length) {
            rankingList.innerHTML = '<p style="color:#718096;">Sin postulantes registrados aún.</p>';
            return;
        }

        rankingList.innerHTML = r.data.map(c => `
            <div class="ranking-row">
                <span>${c.posicion           ?? '—'}</span>
                <span>
                    ${c.nombre_candidato ?? '—'}
                    <small style="color:#718096;">(${c.tipo_candidato ?? '—'})</small>
                </span>
                <span>${c.puntaje_final      ?? '—'}</span>
                <span>${c.puntaje_automatico ?? '—'}</span>
                <span>${c.puntaje_entrevista ?? '—'}</span>
                <span>${c.nombre_estatus     ?? '—'}</span>
            </div>`).join('');
    }

    btnGuardarEstatus.addEventListener('click', async () => {
        if (!vacanteActivaId) return;

        const nuevoEstatus = statusSelect.value;

        //API: PATCH /api/vacantes/{id_vacante}/estatus, adaptar al aapi
        // Body: { nombre_estatus: 'Activa' }
        // En Laravel: busca id_estatus_vacante WHERE nombre = nombre_estatus
        const r = await fetchJSON(`/api/vacantes/${vacanteActivaId}/estatus`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_estatus: nuevoEstatus })
        });

        if (!r.ok) {
            alert('No se pudo actualizar el estatus. Intenta de nuevo.');
            return;
        }

        // Actualizar caché local
        const idx = todasLasVacantes.findIndex(v =>
            String(v.id_vacante) === String(vacanteActivaId));
        if (idx !== -1) todasLasVacantes[idx].nombre_estatus = nuevoEstatus;
        aplicarFiltros();

        alert('Estatus actualizado correctamente.');
    });

    btnFlujoExterno.addEventListener('click', async () => {
        if (!vacanteActivaId) return;

        const estaActivo = btnFlujoExterno.dataset.activo === '1';

        //API: PATCH /api/vacantes/{id_vacante}/flujo-externo, adpatar al api
        // Body: { activo: true | false }
        // En Laravel: si activo=true → SET fecha_apertura_externa = NOW()
        //             si activo=false → SET fecha_apertura_externa = NULL
        const r = await fetchJSON(`/api/vacantes/${vacanteActivaId}/flujo-externo`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: !estaActivo })
        });

        if (!r.ok) {
            alert('No se pudo cambiar el flujo externo. Intenta de nuevo.');
            return;
        }

        const nuevoEstado = !estaActivo;
        btnFlujoExterno.textContent    = nuevoEstado
            ? 'Desactivar flujo externo'
            : 'Activar flujo externo';
        btnFlujoExterno.dataset.activo = nuevoEstado ? '1' : '0';

        const idx = todasLasVacantes.findIndex(v =>
            String(v.id_vacante) === String(vacanteActivaId));
        if (idx !== -1) {
            todasLasVacantes[idx].fecha_apertura_externa = nuevoEstado
                ? new Date().toISOString()
                : null;
        }
        aplicarFiltros();
    });

    await loadMe();
    await loadCatalogos();
    await loadVacantes();
});