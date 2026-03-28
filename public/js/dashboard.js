document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const welcome                 = document.getElementById('welcome');
    const logoutBtn               = document.getElementById('logoutBtn');
    const logoutBtnHeader         = document.getElementById('logoutBtnHeader');
    const fechaActual             = document.getElementById('fecha-actual');
    const kpiVacantes             = document.getElementById('kpiVacantes');
    const kpiPostulantes          = document.getElementById('kpiPostulantes');
    const kpiEntrevistas          = document.getElementById('kpiEntrevistas');
    const kpiCerradas             = document.getElementById('kpiCerradas');
    const tbodyVacantes           = document.getElementById('tbodyVacantes');
    const alertasContainer        = document.getElementById('alertasContainer');
    const numCandidatosPendientes = document.getElementById('numCandidatosPendientes');

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
        const r = await fetchJSON('/api/me');
        if (!r.ok) { welcome.textContent = 'Sesión activa.'; return; }
        const u = r.data?.usuario;
        welcome.textContent = u
            ? `Bienvenido/a: ${u.nombre} ${u.ap} ${u.am}`.trim()
            : 'Bienvenido/a.';
    }

    async function loadResumen() {
        const r = await fetchJSON('/api/vacantes/resumen');
        if (!r.ok) return;
        kpiVacantes.textContent             = r.data?.vacantes_activas               ?? 0;
        kpiPostulantes.textContent          = r.data?.postulantes_totales             ?? 0;
        kpiEntrevistas.textContent          = r.data?.entrevistas_pendientes          ?? 0;
        kpiCerradas.textContent             = r.data?.cerradas_mes                    ?? 0;
        numCandidatosPendientes.textContent = r.data?.candidatos_externos_pendientes  ?? 0;
    }

    async function loadVacantes() {
        const r = await fetchJSON('/api/vacantes?recientes=1&limit=5');

        if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) {
            tbodyVacantes.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:#718096;padding:1rem;">
                        Sin vacantes registradas.
                    </td>
                </tr>`;
            return;
        }

        // Mapeo de estatus a clase CSS — normalizar a minúsculas
        const pillClass = {
            'activa':      'pill-activa',
            'en proceso':  'pill-proceso',
            'cerrada':     'pill-cerrada',
            'pausada':     'pill-pausada',
        };

        tbodyVacantes.innerHTML = r.data.map(v => {
            const estatusKey = (v.nombre_estatus ?? '').toLowerCase();
            const css  = pillClass[estatusKey] ?? 'pill-cerrada';
            const fecha = v.fecha_cierre
                ? new Date(v.fecha_cierre).toLocaleDateString('es-MX')
                : '—';

            return `
            <tr>
                <td>${v.titulo           ?? '—'}</td>
                <td>${v.nombre_area      ?? '—'}</td>
                <td><span class="pill ${css}">${v.nombre_estatus ?? '—'}</span></td>
                <td>${v.total_postulantes ?? 0}</td>
                <td>${fecha}</td>
                <td>
                    <button class="btn-ver"
                        onclick="window.location.href='detalle-vacante.html?id=${v.id_vacante}'">
                        Ver detalle
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    async function loadAlertas() {
        const r = await fetchJSON('/api/alertas');

        if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) {
            alertasContainer.innerHTML = `
                <div class="alert">
                    <strong>✅</strong>
                    <span>Sin alertas pendientes.</span>
                </div>`;
            return;
        }

        alertasContainer.innerHTML = r.data.map(a => `
            <div class="alert">
                <strong>⚠️</strong>
                <span>${a.mensaje}</span>
            </div>
        `).join('');
    }

    // Variables para las gráficas
let chartVacantes = null;
let chartPostulaciones = null;

async function loadGraficas() {
    const r = await fetchJSON('/api/graficas');
    if (!r.ok) return;

    const coloresVacantes = {
        'Activa':      '#3182CE',
        'En proceso':  '#DD6B20',
        'Cerrada':     '#718096',
        'Pausada':     '#D69E2E',
    };

    const coloresPostulaciones = {
        'Pendiente':    '#D69E2E',
        'En revisión':  '#3182CE',
        'Entrevista':   '#805AD5',
        'Aprobado':     '#38A169',
        'Descartado':   '#E53E3E',
    };

    // Gráfica 1 — Dona: vacantes por estatus
    const vacData  = r.data.vacantes_por_estatus ?? [];
    const vacLabels = vacData.map(v => v.estatus);
    const vacTotals = vacData.map(v => v.total);
    const vacColors = vacLabels.map(l => coloresVacantes[l] ?? '#CBD5E0');

    const ctxVac = document.getElementById('chartVacantesEstatus').getContext('2d');
    if (chartVacantes) chartVacantes.destroy();
    chartVacantes = new Chart(ctxVac, {
        type: 'doughnut',
        data: {
            labels: vacLabels,
            datasets: [{
                data: vacTotals,
                backgroundColor: vacColors,
                borderWidth: 2,
                borderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 12 }, padding: 12 }
                }
            }
        }
    });

    // Gráfica 2 — Barras: avance del proceso
    const postData   = r.data.postulaciones_por_estatus ?? [];
    const postLabels = postData.map(p => p.estatus);
    const postTotals = postData.map(p => p.total);
    const postColors = postLabels.map(l => coloresPostulaciones[l] ?? '#CBD5E0');

    const ctxPost = document.getElementById('chartPostulaciones').getContext('2d');
    if (chartPostulaciones) chartPostulaciones.destroy();
    chartPostulaciones = new Chart(ctxPost, {
        type: 'bar',
        data: {
            labels: postLabels,
            datasets: [{
                label: 'Candidatos',
                data: postTotals,
                backgroundColor: postColors,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
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
    await loadResumen();
    await loadGraficas();
    await loadVacantes();
    await loadAlertas();
});