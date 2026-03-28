document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const welcome = document.getElementById('welcome');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnHeader = document.getElementById('logoutBtnHeader');

    const inputTitulo = document.getElementById('titulo');
    const selectArea = document.getElementById('id_area');
    const inputSalario = document.getElementById('salario');
    const inputFechaInt = document.getElementById('fecha_apertura_interna');
    const inputFechaCierre = document.getElementById('fecha_cierre');
    const inputDesc = document.getElementById('descripcion');

    const btnAddReq = document.getElementById('btnAddReq');
    const reqList = document.getElementById('req-list');
    const weightDisplay = document.getElementById('weight-display');
    const btnGuardar = document.getElementById('btnGuardar');

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
        } catch (_) { }
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
            alert('El título del puesto es obligatorio.');
            return;
        }

        const requisitos = [...reqList.querySelectorAll('.req-row')].map(row => ({
            descripcion: row.querySelector('.req-desc').value.trim(),
            id_tipo_requisito: Number(row.querySelector('.req-tipo').value) || null,
            valor_minimo: row.querySelector('.req-min').value.trim(),
            valor_ideal: row.querySelector('.req-ideal').value.trim(),
            peso_pct: parseFloat(row.querySelector('.req-peso').value) || 0,
            es_excluyente: row.querySelector('.req-excl-check').checked,
        }));

        const sinTipo = requisitos.some(r => !r.id_tipo_requisito);
        if (requisitos.length > 0 && sinTipo) {
            alert('Selecciona el tipo para todos los requisitos.');
            return;
        }

        if (requisitos.length > 0) {
            const totalPeso = requisitos.reduce((a, r) => a + r.peso_pct, 0);
            if (Math.abs(totalPeso - 100) > 0.01) {
                alert(`Los pesos deben sumar 100%. Actualmente suman ${totalPeso.toFixed(1)}%.`);
                return;
            }
        }

        const payload = {
            titulo: inputTitulo.value.trim(),
            id_area: selectArea.value || null,
            descripcion: inputDesc.value.trim() || null,
            fecha_apertura_interna: inputFechaInt.value || null,
            fecha_cierre: inputFechaCierre.value || null,
            requisitos,
        };

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        // PUT si es edición, POST si es nueva
        const url = idEditar ? `/api/vacantes/${idEditar}` : '/api/vacantes';
        const method = idEditar ? 'PUT' : 'POST';

        const r = await fetchJSON(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        btnGuardar.disabled = false;
        btnGuardar.textContent = idEditar ? 'Guardar cambios' : 'Guardar vacante';

        if (!r.ok) {
            alert(r.data?.message || 'Error al guardar la vacante.');
            return;
        }

        window.location.href = `detalle-vacante.html?id=${idEditar ?? r.data?.id_vacante}`;
    });

    const params = new URLSearchParams(window.location.search);
    const idEditar = params.get('id');

    await loadMe();
    await loadCatalogos();

    if (idEditar) {
        document.querySelector('h1').textContent = 'Editar vacante';
        document.querySelector('header p').textContent = 'Modifica los datos de la vacante';

        const r = await fetchJSON(`/api/vacantes/${idEditar}`);
        if (r.ok) {
            const v = r.data;
            inputTitulo.value = v.titulo ?? '';
            selectArea.value = String(v.idDepa ?? '');
            inputFechaInt.value = v.fecha_apertura_interna ?? '';
            inputFechaCierre.value = v.fecha_cierre ?? '';
            inputDesc.value = v.descripcion ?? '';

            // Cargar requisitos existentes
            if (Array.isArray(v.requisitos) && v.requisitos.length) {
                v.requisitos.forEach(req => addReq({
                    descripcion: req.descripcion,
                    id_tipo_requisito: req.id_requisito,
                    valor_minimo: req.valor_minimo,
                    valor_ideal: req.valor_ideal,
                    peso_pct: req.peso_pct,
                    es_excluyente: req.es_excluyente,
                }));
            } else {
                addReq();
            }
        }
    } else {
        addReq();
    }
});