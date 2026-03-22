document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const params        = new URLSearchParams(window.location.search);
    const idPostulacion = params.get('id_postulacion');
    if (!idPostulacion) { window.location.href = 'vacantes.html'; return; }

    const welcome         = document.getElementById('welcome');
    const logoutBtn       = document.getElementById('logoutBtn');
    const logoutBtnHeader = document.getElementById('logoutBtnHeader');
    const fechaActual     = document.getElementById('fecha-actual');

    const iCandidato   = document.getElementById('i-candidato');
    const iTipo        = document.getElementById('i-tipo');
    const iVacante     = document.getElementById('i-vacante');
    const iArea        = document.getElementById('i-area');
    const iPuntajeAuto = document.getElementById('i-puntaje-auto');

    const inputFecha      = document.getElementById('fecha_entrevista');
    const selectRecom     = document.getElementById('id_recomendacion');
    const inputObs        = document.getElementById('observaciones');
    const criteriosList   = document.getElementById('criterios-list');

    const btnGuardar      = document.getElementById('btnGuardar');
    const btnCancelar     = document.getElementById('btnCancelar');

    let requisitosVacante = [];
    let idVacanteOrigen   = null;

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
            // API: POST /api/logout, adptar
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

    async function loadRecomendaciones() {
        //adaptar
        //API: GET /api/catalogos/recomendaciones-entrevista
        // SELECT id_recomendacion, nombre FROM cat_recomendaciones_entrevista
        // Respuesta esperada: [{ id_recomendacion, nombre }, ...]
        const r = await fetchJSON('/api/catalogos/recomendaciones-entrevista');

        if (!r.ok || !Array.isArray(r.data)) return;

        selectRecom.innerHTML =
            '<option value="">-- Selecciona --</option>' +
            r.data.map(rc =>
                `<option value="${rc.id_recomendacion}">${rc.nombre}</option>`
            ).join('');
    }

   async function loadPostulacion() {
        //API: GET /api/postulaciones/{id_postulacion}, adaptar
        // Respuesta esperada:
        // {
        //   id_postulacion,
        //   nombre_candidato,    ← empleados.nombre OR candidatos_externos.nombre
        //   tipo_candidato,      ← cat_tipos_candidato.nombre
        //   puntaje_automatico,
        //   id_vacante,
        //   titulo_vacante,      ← vacantes.titulo
        //   nombre_area,         ← JOIN bd_empleados.areas
        //   requisitos: [{       ← requisitos_vacante JOIN cat_tipos_requisito
        //     id_requisito,
        //     descripcion,
        //     nombre_tipo,
        //     peso_pct
        //   }, ...]
        // }
        const r = await fetchJSON(`/api/postulaciones/${idPostulacion}`);

        if (!r.ok) {
            iCandidato.textContent = 'Error al cargar la postulación.';
            return;
        }

        const p = r.data;
        idVacanteOrigen = p.id_vacante;

        iCandidato.textContent   = p.nombre_candidato   ?? '—';
        iTipo.textContent        = p.tipo_candidato      ?? '—';
        iVacante.textContent     = p.titulo_vacante      ?? '—';
        iArea.textContent        = p.nombre_area         ?? '—';
        iPuntajeAuto.textContent = p.puntaje_automatico != null
            ? `${p.puntaje_automatico} pts`
            : '—';

        requisitosVacante = Array.isArray(p.requisitos) ? p.requisitos : [];

        if (!requisitosVacante.length) {
            criteriosList.innerHTML =
                '<p style="color:#718096;">Esta vacante no tiene requisitos registrados.</p>';
            return;
        }

        criteriosList.innerHTML = requisitosVacante.map(req => `
            <div class="criterio" data-id="${req.id_requisito}">
                <div class="criterio-info">
                    <span class="criterio-nombre">${req.descripcion ?? req.nombre_tipo ?? '—'}</span>
                    <small style="color:#718096;">${req.peso_pct ?? 0}% del puntaje</small>
                </div>
                <div class="estrellas">
                    ${[1,2,3,4,5].map(n => `
                        <div class="estrella" data-val="${n}">${n}</div>
                    `).join('')}
                </div>
                <textarea class="req-observacion"
                    placeholder="Observación específica (opcional)..."
                    style="margin-top:6px; width:100%; min-height:50px;"></textarea>
            </div>`).join('');

        criteriosList.querySelectorAll('.criterio').forEach(bloque => {
            bloque.querySelectorAll('.estrella').forEach(estrella => {
                estrella.addEventListener('click', () => {
                    const val = parseInt(estrella.dataset.val);
                    bloque.querySelectorAll('.estrella').forEach(e => {
                        e.classList.toggle('selected', parseInt(e.dataset.val) <= val);
                    });
                });
            });
        });
    }

    btnGuardar.addEventListener('click', async () => {

        if (!inputFecha.value) {
            alert('Selecciona la fecha de entrevista.'); return;
        }
        if (!selectRecom.value) {
            alert('Selecciona una recomendación general.'); return;
        }

        const detalles = [];
        let faltanCalificaciones = false;

        criteriosList.querySelectorAll('.criterio').forEach(bloque => {
            const idRequisito   = bloque.dataset.id;
            const seleccionada  = bloque.querySelector('.estrella.selected:last-of-type');
            const calificacion  = seleccionada
                ? parseInt(seleccionada.dataset.val)
                : null;
            const observacion   = bloque.querySelector('.req-observacion').value.trim();

            if (!calificacion) faltanCalificaciones = true;

            detalles.push({
                id_requisito: idRequisito,
                calificacion,
                observacion: observacion || null
            });
        });

        if (faltanCalificaciones) {
            alert('Califica todos los requisitos antes de guardar.'); return;
        }

        const payload = {
            id_postulacion:  idPostulacion,
            fecha_entrevista: inputFecha.value,
            id_recomendacion: selectRecom.value,
            observaciones:    inputObs.value.trim() || null,
            // detalle_evaluacion_entrevista
            detalles,
        };

        btnGuardar.disabled     = true;
        btnGuardar.textContent  = 'Guardando...';

        // API: POST /api/evaluaciones-entrevista, adaptar
        // Body: payload completo
        const r = await fetchJSON('/api/evaluaciones-entrevista', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        btnGuardar.disabled    = false;
        btnGuardar.textContent = 'Guardar evaluación';

        if (!r.ok) {
            alert(r.data?.message || 'Error al guardar la evaluación. Intenta de nuevo.');
            return;
        }

        window.location.href = idVacanteOrigen
            ? `detalle-vacante.html?id=${idVacanteOrigen}`
            : 'vacantes.html';
    });

    btnCancelar.addEventListener('click', () => {
        window.location.href = idVacanteOrigen
            ? `detalle-vacante.html?id=${idVacanteOrigen}`
            : 'vacantes.html';
    });

    await loadMe();
    await loadRecomendaciones();
    await loadPostulacion();
});