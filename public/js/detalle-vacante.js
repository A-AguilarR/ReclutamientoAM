document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const params    = new URLSearchParams(window.location.search);
    const idVacante = params.get('id');
    if (!idVacante) { window.location.href = 'vacantes.html'; return; }

    const welcome         = document.getElementById('welcome');
    const logoutBtn       = document.getElementById('logoutBtn');
    const logoutBtnHeader = document.getElementById('logoutBtnHeader');
    const fechaActual     = document.getElementById('fecha-actual');

    const vTitulo         = document.getElementById('v-titulo');
    const vEstatus        = document.getElementById('v-estatus');
    const vArea           = document.getElementById('v-area');
    const vCreada         = document.getElementById('v-creada');
    const vCierre         = document.getElementById('v-cierre');
    const vPostulantes    = document.getElementById('v-postulantes');
    const vRequisitos     = document.getElementById('v-requisitos');
    const vRanking        = document.getElementById('v-ranking');

    const flujoDescripcion = document.getElementById('flujo-descripcion');
    const flujoLabel      = document.getElementById('flujo-label');
    const flujoToggle     = document.getElementById('flujoToggle');
    const flujoRecibidos  = document.getElementById('flujo-recibidos');
    const flujosPendientes= document.getElementById('flujo-pendientes');

    const btnEditar       = document.getElementById('btnEditar');
    const btnCerrar       = document.getElementById('btnCerrar');

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

    async function loadDetalle() {
        // 🔌 API: GET /api/vacantes/{id_vacante}, adaptar
        // Respuesta esperada:
        // {
        //   id_vacante, titulo,
        //   nombre_area,           ← JOIN bd_empleados.areas
        //   nombre_estatus,        ← JOIN cat_estatus_vacante
        //   descripcion,
        //   fecha_creacion,
        //   fecha_cierre,
        //   fecha_apertura_externa, ← NULL = flujo cerrado
        //   total_postulantes,     ← COUNT postulaciones
        //   externos_recibidos,    ← COUNT postulaciones WHERE id_tipo_candidato = externo
        //   externos_pendientes,   ← COUNT postulaciones externas WHERE estatus = pendiente
        //   requisitos: [{
        //     id_requisito, descripcion, peso_pct,
        //     valor_minimo, valor_ideal, es_excluyente,
        //     nombre_tipo   ← JOIN cat_tipos_requisito
        //   }, ...]
        // }
        const r = await fetchJSON(`/api/vacantes/${idVacante}`);

        if (!r.ok) {
            vTitulo.textContent = 'No se pudo cargar la vacante.';
            return;
        }

        const v = r.data;

        vTitulo.textContent      = v.titulo      ?? '—';
        vEstatus.textContent     = v.nombre_estatus ?? '—';
        vArea.textContent        = v.nombre_area    ?? '—';
        vPostulantes.textContent = v.total_postulantes ?? 0;

        vCreada.textContent = v.fecha_creacion
            ? new Date(v.fecha_creacion).toLocaleDateString('es-MX')
            : '—';
        vCierre.textContent = v.fecha_cierre
            ? new Date(v.fecha_cierre).toLocaleDateString('es-MX')
            : '—';

        btnEditar.href = `crear-vacante.html?id=${idVacante}`;

        if (Array.isArray(v.requisitos) && v.requisitos.length) {
            vRequisitos.innerHTML = v.requisitos.map(req => `
                <div style="display:flex; gap:.75rem; align-items:center;
                            margin-bottom:6px; flex-wrap:wrap;">
                    <span class="pill pill-activa">${req.peso_pct ?? 0}%</span>
                    <span><strong>${req.nombre_tipo ?? '—'}:</strong>
                        ${req.descripcion ?? '—'}</span>
                    <span style="color:#718096; font-size:.8rem;">
                        Mín: ${req.valor_minimo ?? '—'} ·
                        Ideal: ${req.valor_ideal ?? '—'}
                        ${req.es_excluyente
                            ? '· <strong style="color:#E53E3E;">Excluyente</strong>'
                            : ''}
                    </span>
                </div>`).join('');
        } else {
            vRequisitos.textContent = 'Sin requisitos registrados.';
        }

        const flujoActivo = !!v.fecha_apertura_externa;
        actualizarFlujoUI(flujoActivo);
        flujoRecibidos.textContent   = v.externos_recibidos  ?? 0;
        flujosPendientes.textContent = v.externos_pendientes ?? 0;
    }

async function loadRanking() {
        vRanking.innerHTML = '<p style="color:#718096;">Cargando ranking...</p>';

        //API: GET /api/vacantes/{id_vacante}/ranking, adaptar
        // Respuesta esperada (postulaciones ORDER BY puntaje_final DESC):
        // [{
        //   posicion,
        //   nombre_candidato,    ← empleados.nombre OR candidatos_externos.nombre
        //   tipo_candidato,      ← cat_tipos_candidato.nombre
        //   puntaje_automatico,  ← postulaciones.puntaje_automatico
        //   puntaje_entrevista,  ← postulaciones.puntaje_entrevista
        //   puntaje_final,       ← postulaciones.puntaje_final
        //   nombre_estatus,      ← cat_estatus_postulacion.nombre
        //   id_postulacion
        // }, ...]
        const r = await fetchJSON(`/api/vacantes/${idVacante}/ranking`);

        if (!r.ok || !Array.isArray(r.data) || !r.data.length) {
            vRanking.innerHTML =
                '<p style="color:#718096; padding:.5rem 0;">Sin postulantes registrados aún.</p>';
            return;
        }

        vRanking.innerHTML = r.data.map(c => `
            <div class="ranking-row">
                <span>${c.posicion           ?? '—'}</span>
                <span>${c.nombre_candidato   ?? '—'}</span>
                <span><small class="pill">${c.tipo_candidato ?? '—'}</small></span>
                <span>${c.puntaje_automatico ?? '—'}</span>
                <span>${c.puntaje_entrevista ?? '—'}</span>
                <span><strong>${c.puntaje_final ?? '—'}</strong></span>
                <span>${c.nombre_estatus     ?? '—'}</span>
                <span>
                    <button class="btn btn-secondary btn-sm"
                        onclick="window.location.href=
    'evaluacion-entrevista.html?id_postulacion=${c.id_postulacion}'">
                        Evaluar
                    </button>
                </span>
            </div>`).join('');
    }

    function actualizarFlujoUI(activo) {
    flujoToggle.classList.toggle('active', activo);
    flujoToggle.classList.toggle('off', !activo); // agrega esta línea
    flujoLabel.textContent = activo ? 'Flujo activo' : 'Flujo inactivo';
    flujoDescripcion.textContent = activo
        ? 'Esta vacante está aceptando postulantes desde el portal externo.'
        : 'El flujo externo está cerrado. Solo se aceptan candidatos internos.';
}

    flujoToggle.addEventListener('click', async () => {
        const estaActivo = flujoToggle.classList.contains('active');

        //API: PATCH /api/vacantes/{id_vacante}/flujo-externo, adaptar
        // Body: { activo: true | false }
        // Laravel: activo=true → fecha_apertura_externa = NOW()
        //          activo=false → fecha_apertura_externa = NULL
        const r = await fetchJSON(`/api/vacantes/${idVacante}/flujo-externo`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: !estaActivo })
        });

        if (!r.ok) {
            alert('No se pudo cambiar el flujo externo. Intenta de nuevo.');
            return;
        }

        actualizarFlujoUI(!estaActivo);
    });

    btnCerrar.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de cerrar esta vacante? Esta acción no se puede deshacer.'))
            return;

        
        const r = await fetchJSON(`/api/vacantes/${idVacante}/estatus`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_estatus: 'Cerrada' })
        });

        if (!r.ok) {
            alert('No se pudo cerrar la vacante. Intenta de nuevo.');
            return;
        }

        vEstatus.textContent = 'Cerrada';
        btnCerrar.disabled   = true;
        btnCerrar.textContent = 'Vacante cerrada';
    });

    let chartPuntajes = null;

async function loadGraficaVacante() {
    const r = await fetchJSON(`/api/vacantes/${idVacante}/graficas`);
    if (!r.ok || !Array.isArray(r.data) || !r.data.length) return;

    const labels   = r.data.map((c, i) => c.nombre || `Candidato ${i + 1}`);
    const automatico  = r.data.map(c => c.puntaje_automatico);
    const entrevista  = r.data.map(c => c.puntaje_entrevista);
    const final       = r.data.map(c => c.puntaje_final);

    const ctx = document.getElementById('chartPuntajes').getContext('2d');
    if (chartPuntajes) chartPuntajes.destroy();
    chartPuntajes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Puntaje automático',
                    data: automatico,
                    backgroundColor: '#3182CE',
                    borderRadius: 4,
                },
                {
                    label: 'Puntaje entrevista',
                    data: entrevista,
                    backgroundColor: '#805AD5',
                    borderRadius: 4,
                },
                {
                    label: 'Puntaje final',
                    data: final,
                    backgroundColor: '#38A169',
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 12 }, padding: 12 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: '#EDF2F7' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

    await loadMe();
    await loadDetalle();
    await loadRanking();
    await loadGraficaVacante();
});