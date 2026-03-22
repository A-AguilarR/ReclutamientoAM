document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const welcome         = document.getElementById('welcome');
    const logoutBtn       = document.getElementById('logoutBtn');
    const logoutBtnHeader = document.getElementById('logoutBtnHeader');

    const inputTitulo     = document.getElementById('titulo');
    const selectArea      = document.getElementById('id_area');
    const inputSalario    = document.getElementById('salario');
    const inputFechaInt   = document.getElementById('fecha_apertura_interna');
    const inputFechaCierre= document.getElementById('fecha_cierre');
    const inputDesc       = document.getElementById('descripcion');

    const btnAddReq       = document.getElementById('btnAddReq');
    const reqList         = document.getElementById('req-list');
    const weightDisplay   = document.getElementById('weight-display');
    const btnGuardar      = document.getElementById('btnGuardar');

    let tiposRequisito = [];

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
            //API: POST /api/logout, adpatar
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
        //API: GET /api/catalogos/areas, adaptar
        // SELECT id_area, nombre_area FROM bd_empleados.areas
        // Respuesta esperada: [{ id_area, nombre_area }, ...]
        const rAreas = await fetchJSON('/api/catalogos/areas');
        if (rAreas.ok && Array.isArray(rAreas.data)) {
            selectArea.innerHTML =
                '<option value="">Seleccionar...</option>' +
                rAreas.data.map(a =>
                    `<option value="${a.id_area}">${a.nombre_area}</option>`
                ).join('');
        }

        //API: GET /api/catalogos/tipos-requisito, adaptar
        // SELECT id_tipo_requisito, nombre FROM cat_tipos_requisito
        // Respuesta esperada: [{ id_tipo_requisito, nombre }, ...]
        const rTipos = await fetchJSON('/api/catalogos/tipos-requisito');
        if (rTipos.ok && Array.isArray(rTipos.data)) {
            tiposRequisito = rTipos.data;
        }
    }

    function buildTiposOptions(selectedId = '') {
        return tiposRequisito.map(t =>
            `<option value="${t.id_tipo_requisito}"
                ${String(t.id_tipo_requisito) === String(selectedId) ? 'selected' : ''}>
                ${t.nombre}
            </option>`
        ).join('');
    }

    function addReq(data = {}) {
        const row = document.createElement('div');
        row.className = 'req-row';
        row.innerHTML = `
            <input type="text" class="req-desc"
                placeholder="ej. Años en industria automotriz"
                value="${data.descripcion ?? ''}" />
            <select class="req-tipo">
                <option value="">Seleccionar...</option>
                ${buildTiposOptions(data.id_tipo_requisito ?? '')}
            </select>
            <input type="text" class="req-min"
                placeholder="ej. 5 años"
                value="${data.valor_minimo ?? ''}" />
            <input type="text" class="req-ideal"
                placeholder="ej. 8-10 años"
                value="${data.valor_ideal ?? ''}" />
            <input type="number" class="req-peso" min="0" max="100"
                placeholder="0"
                value="${data.peso_pct ?? ''}" />
            <label class="req-excl">
                <input type="checkbox" class="req-excl-check"
                    ${data.es_excluyente ? 'checked' : ''} />
                Excluyente
            </label>
            <button class="btn btn-danger btn-sm req-remove">✕</button>
        `;

        row.querySelector('.req-remove').addEventListener('click', () => {
            row.remove();
            updateTotal();
        });

        row.querySelector('.req-peso').addEventListener('input', updateTotal);

        reqList.appendChild(row);
        updateTotal();
    }

    function updateTotal() {
        const pesos = [...reqList.querySelectorAll('.req-peso')]
            .map(i => parseFloat(i.value) || 0);
        const total = pesos.reduce((a, b) => a + b, 0);
        weightDisplay.textContent = `Total: ${total.toFixed(1)}%`;
        weightDisplay.style.color = Math.abs(total - 100) < 0.01 ? '#38A169' : '#E53E3E';
    }

    btnAddReq.addEventListener('click', () => addReq());

    btnGuardar.addEventListener('click', async () => {

        if (!inputTitulo.value.trim()) {
            alert('El título del puesto es obligatorio.'); return;
        }
        if (!selectArea.value) {
            alert('Selecciona un área.'); return;
        }

        const requisitos = [...reqList.querySelectorAll('.req-row')].map(row => ({
            descripcion:       row.querySelector('.req-desc').value.trim(),
            id_tipo_requisito: row.querySelector('.req-tipo').value,
            valor_minimo:      row.querySelector('.req-min').value.trim(),
            valor_ideal:       row.querySelector('.req-ideal').value.trim(),
            peso_pct:          parseFloat(row.querySelector('.req-peso').value) || 0,
            es_excluyente:     row.querySelector('.req-excl-check').checked,
        }));

        const totalPeso = requisitos.reduce((a, r) => a + r.peso_pct, 0);
        if (requisitos.length > 0 && Math.abs(totalPeso - 100) > 0.01) {
            alert(`Los pesos deben sumar 100%. Actualmente suman ${totalPeso.toFixed(1)}%.`);
            return;
        }

        const payload = {
            titulo:                 inputTitulo.value.trim(),
            id_area:                selectArea.value,          // → vacantes.id_area (JOIN a bd_empleados.areas)
            salario:                inputSalario.value.trim(), // campo a agregar en vacantes
            descripcion:            inputDesc.value.trim(),
            fecha_apertura_interna: inputFechaInt.value || null,
            fecha_cierre:           inputFechaCierre.value || null,
            requisitos,
        };

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        //adaptar
        //API: POST /api/vacantes
        // Body: payload completo arriba
        // Laravel crea la vacante y los requisitos_vacante en una transacción
        const r = await fetchJSON('/api/vacantes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar vacante';

        if (!r.ok) {
            alert(r.data?.message || 'Error al guardar la vacante. Intenta de nuevo.');
            return;
        }

        const idNueva = r.data?.id_vacante;
        window.location.href = idNueva
            ? `detalle-vacante.html?id=${idNueva}`
            : 'vacantes.html';
    });

    await loadMe();
    await loadCatalogos();
    
    addReq();
});