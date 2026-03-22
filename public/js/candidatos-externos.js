document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const welcome           = document.getElementById('welcome');
    const logoutBtn         = document.getElementById('logoutBtn');
    const logoutBtnHeader   = document.getElementById('logoutBtnHeader');
    const fechaActual       = document.getElementById('fecha-actual');

    const filtroVacante     = document.getElementById('filtroVacante');
    const filtroEstatus     = document.getElementById('filtroEstatus');
    const filtroNombre      = document.getElementById('filtroNombre');
    const btnFiltrar        = document.getElementById('btnFiltrar');

    const tbodyCandidatos   = document.getElementById('tbodyCandidatos');
    const resumenCandidatos = document.getElementById('resumenCandidatos');

    fechaActual.textContent = new Date().toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

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
            //API: POST /api/logout, adaptar
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
        //API: GET /api/me, adaptar
        // Respuesta esperada: { usuario: { nombre, ap, am } }
        const r = await fetchJSON('/api/me');
        if (!r.ok) { welcome.textContent = 'Sesión activa.'; return; }
        const u = r.data?.usuario;
        welcome.textContent = u
            ? `Bienvenido/a: ${u.nombre} ${u.ap} ${u.am}`
            : 'Bienvenido/a.';
    }

    async function loadCatalogos() {
        //API: GET /api/vacantes?activas=1, adaptar
        // Respuesta esperada: [{ id_vacante, titulo }, ...]
        const rVac = await fetchJSON('/api/vacantes?activas=1');
        if (rVac.ok && Array.isArray(rVac.data)) {
            filtroVacante.innerHTML =
                '<option value="">Todas las vacantes</option>' +
                rVac.data.map(v =>
                    `<option value="${v.id_vacante}">${v.titulo}</option>`
                ).join('');
        }

        //API: GET /api/catalogos/estatus-postulacion, adaptar
        // SELECT id_estatus_postulacion, nombre FROM cat_estatus_postulacion
        // Respuesta esperada: [{ id_estatus_postulacion, nombre }, ...]
        const rEst = await fetchJSON('/api/catalogos/estatus-postulacion');
        if (rEst.ok && Array.isArray(rEst.data)) {
            filtroEstatus.innerHTML =
                '<option value="">Todos los estatus</option>' +
                rEst.data.map(e =>
                    `<option value="${e.nombre}">${e.nombre}</option>`
                ).join('');
        }
    }

    async function loadCandidatos() {
        tbodyCandidatos.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:#718096; padding:1rem;">
                    Cargando...
                </td>
            </tr>`;

        const params = new URLSearchParams();
        if (filtroVacante.value) params.set('id_vacante',     filtroVacante.value);
        if (filtroEstatus.value)  params.set('nombre_estatus', filtroEstatus.value);
        if (filtroNombre.value.trim()) params.set('nombre',   filtroNombre.value.trim());

        //API: GET /api/candidatos-externos?{params}, adaptar
        // Filtra postulaciones WHERE id_tipo_candidato = externo
        // Respuesta esperada:
        // {
        //   total, pendientes,
        //   data: [{
        //     id_postulacion,
        //     id_candidato_externo,
        //     nombre_candidato,      ← candidatos_externos.nombre
        //     email,                 ← candidatos_externos.email
        //     titulo_vacante,        ← vacantes.titulo
        //     nombre_estatus,        ← cat_estatus_postulacion.nombre
        //     fecha_postulacion,     ← postulaciones.fecha_postulacion
        //     documentos: [{         ← documentos_externos
        //       nombre_tipo,         ← cat_tipos_documento.nombre
        //       url_archivo
        //     }, ...]
        //   }, ...]
        // }
        const r = await fetchJSON(`/api/candidatos-externos?${params.toString()}`);

        if (!r.ok) {
            tbodyCandidatos.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color:#718096; padding:1rem;">
                        No se pudieron cargar los candidatos.
                    </td>
                </tr>`;
            resumenCandidatos.textContent = '';
            return;
        }

        const total     = r.data?.total     ?? 0;
        const pendientes= r.data?.pendientes ?? 0;
        const lista     = r.data?.data       ?? [];

        resumenCandidatos.textContent =
            `${total} candidato(s) encontrado(s) · ${pendientes} pendiente(s) de revisión`;

        if (!lista.length) {
            tbodyCandidatos.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color:#718096; padding:1rem;">
                        Sin candidatos encontrados.
                    </td>
                </tr>`;
            return;
        }

        tbodyCandidatos.innerHTML = lista.map(c => {
            const fecha = c.fecha_postulacion
                ? new Date(c.fecha_postulacion).toLocaleDateString('es-MX')
                : '—';

            const docs = Array.isArray(c.documentos) && c.documentos.length
                ? c.documentos.map(d =>
                    `<div class="doc-item">
                        <a href="${d.url_archivo}" target="_blank" class="doc-link">
                            📄 ${d.nombre_tipo ?? 'Documento'}
                        </a>
                    </div>`).join('')
                : '<span style="color:#718096;">Sin documentos</span>';

            return `
            <tr>
                <td>
                    <div class="nombre">${c.nombre_candidato ?? '—'}</div>
                    <div class="correo" style="color:#718096; font-size:.85rem;">
                        ${c.email ?? ''}
                    </div>
                </td>
                <td>${c.titulo_vacante ?? '—'}</td>
                <td><span class="pill">${c.nombre_estatus ?? '—'}</span></td>
                <td>${fecha}</td>
                <td><div class="docs">${docs}</div></td>
                <td>
                    <div class="acciones">
                        <button class="btn btn-secondary btn-sm"
                            onclick="window.location.href=
                                'evaluacion-entrevista.html?id_postulacion=${c.id_postulacion}'">
                            Ver evaluación
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    btnFiltrar.addEventListener('click', loadCandidatos);

    await loadMe();
    await loadCatalogos();
    await loadCandidatos();
});