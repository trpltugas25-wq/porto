/* ═══════════════════════════════════════
   app.js — PrimaFarm
   ═══════════════════════════════════════ */

// ── Navigation ──────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const pages   = document.querySelectorAll('.page');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.page;

        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        pages.forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + target).classList.add('active');

        // Inisialisasi chart saat halaman riwayat pertama dibuka
        if (target === 'riwayat' && !chartsInitialized) {
            initCharts();
            chartsInitialized = true;
        }
    });
});

// ── Live Clock ───────────────────────────
function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').textContent =
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ── Date Badge ────────────────────────────
const d = new Date();
document.getElementById('date-display').textContent =
    d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ── Monitoring: Mapping Grid ─────────────────

// Konfigurasi grid: kolom = abjad, baris = angka
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4];

// Data tanaman — format: { col, row, status, sensor }
// col = abjad (A-F), row = angka (1-4)
const plantData = [
    { col: 'A', row: 1, status: 'sehat',     sensor: { suhu: 28, hum: 71, ph: 6.7, ec: 2.6, light: 4.1 } },
    { col: 'A', row: 2, status: 'sehat',     sensor: { suhu: 27, hum: 73, ph: 6.8, ec: 2.5, light: 4.0 } },
    { col: 'A', row: 3, status: 'perhatian', sensor: { suhu: 31, hum: 80, ph: 5.8, ec: 3.2, light: 3.7 } },
    { col: 'B', row: 1, status: 'sehat',     sensor: { suhu: 29, hum: 70, ph: 6.5, ec: 2.7, light: 4.3 } },
    { col: 'B', row: 2, status: 'kritis',    sensor: { suhu: 34, hum: 88, ph: 5.2, ec: 3.8, light: 2.9 } },
    { col: 'B', row: 3, status: 'sehat',     sensor: { suhu: 28, hum: 72, ph: 6.9, ec: 2.4, light: 4.2 } },
    { col: 'C', row: 1, status: 'sehat',     sensor: { suhu: 27, hum: 69, ph: 7.0, ec: 2.3, light: 4.5 } },
    { col: 'C', row: 2, status: 'perhatian', sensor: { suhu: 30, hum: 78, ph: 6.1, ec: 3.0, light: 3.8 } },
    { col: 'C', row: 4, status: 'sehat',     sensor: { suhu: 28, hum: 71, ph: 6.6, ec: 2.6, light: 4.1 } },
    { col: 'D', row: 2, status: 'sehat',     sensor: { suhu: 26, hum: 68, ph: 6.8, ec: 2.5, light: 4.4 } },
    { col: 'D', row: 3, status: 'sehat',     sensor: { suhu: 28, hum: 72, ph: 6.7, ec: 2.6, light: 4.0 } },
];

const statusConfig = {
    sehat:     { color: '#3fb950', label: 'Sehat',     bg: 'rgba(63,185,80,0.12)' },
    perhatian: { color: '#d29922', label: 'Perhatian', bg: 'rgba(210,153,34,0.12)' },
    kritis:    { color: '#f85149', label: 'Kritis',    bg: 'rgba(248,81,73,0.12)' },
};

let selectedCard = null;
let currentFilter = 'all';

// Build column headers
function buildColHeaders(cols) {
    const el = document.getElementById('map-col-headers');
    el.innerHTML = cols.map(c => `<div class="map-col-label">${c}</div>`).join('');
}

// Build row labels
function buildRowLabels(rows) {
    const el = document.getElementById('map-row-labels');
    el.innerHTML = rows.map(r => `<div class="map-row-label">0${r}</div>`).join('');
}

// Build grid
function buildGrid(cols, rows, data, filter) {
    const grid = document.getElementById('plant-grid');
    grid.style.gridTemplateColumns = `repeat(${cols.length}, 90px)`;
    grid.style.gridTemplateRows    = `repeat(${rows.length}, 90px)`;
    grid.innerHTML = '';

    rows.forEach((row, ri) => {
        cols.forEach((col, ci) => {
            const plant = data.find(p => p.col === col && p.row === row);
            const cell = document.createElement('div');

            // Positioning in grid
            cell.style.gridColumn = ci + 1;
            cell.style.gridRow    = ri + 1;

            if (!plant) {
                // Empty slot
                cell.className = 'plant-card-empty';
                cell.style.cssText = `
                    grid-column:${ci+1}; grid-row:${ri+1};
                    width:90px; height:90px;
                    border: 1px dashed rgba(0,150,62,0.2);
                    border-radius: 8px;
                    opacity: 0.4;
                `;
                grid.appendChild(cell);
                return;
            }

            // Filter by zone
            if (filter !== 'all' && plant.col !== filter) {
                cell.style.cssText = `grid-column:${ci+1}; grid-row:${ri+1}; width:90px; height:90px; opacity:0.15; pointer-events:none;`;
                cell.className = 'plant-card';
            }

            const cfg = statusConfig[plant.status] || statusConfig.sehat;
            const plantId = `${plant.col}-0${plant.row}`;

            cell.className = 'plant-card';
            cell.style.borderTop = `2px solid ${cfg.color}`;
            cell.dataset.id = plantId;
            cell.innerHTML = `
                <div class="p-name">${plantId}</div>
                <div class="p-zone">Zona ${plant.col}</div>
                <div class="p-status">
                    <span class="p-dot" style="background:${cfg.color}"></span>
                    <span style="color:${cfg.color}">${cfg.label}</span>
                </div>
            `;

            // Filter dim
            if (filter !== 'all' && plant.col !== filter) {
                cell.style.opacity = '0.2';
                cell.style.pointerEvents = 'none';
            }

            cell.addEventListener('click', () => showStat(plant, cell));
            grid.appendChild(cell);
        });
    });
}

// Show stat panel
function showStat(plant, cardEl) {
    // Deselect previous
    if (selectedCard) selectedCard.classList.remove('selected');
    cardEl.classList.add('selected');
    selectedCard = cardEl;

    const cfg = statusConfig[plant.status] || statusConfig.sehat;
    const s = plant.sensor;
    const plantId = `${plant.col}-0${plant.row}`;
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('stat-empty').style.display   = 'none';
    document.getElementById('stat-content').style.display = 'flex';

    document.getElementById('stat-name').textContent  = `Tanaman ${plantId}`;
    document.getElementById('stat-zone').textContent  = `Zona ${plant.col} · Baris 0${plant.row}`;

    const badge = document.getElementById('stat-badge');
    badge.textContent        = cfg.label;
    badge.style.background   = cfg.bg;
    badge.style.color        = cfg.color;
    badge.style.border       = `1px solid ${cfg.color}44`;

    document.getElementById('s-suhu').textContent   = `${s.suhu} °C`;
    document.getElementById('s-hum').textContent    = `${s.hum} %`;
    document.getElementById('s-ph').textContent     = `${s.ph}`;
    document.getElementById('s-ec').textContent     = `${s.ec} mS/cm`;
    document.getElementById('s-light').textContent  = `${s.light} klx`;
    document.getElementById('s-update').textContent = `${now} WIB`;

    // Auto note berdasarkan status
    const notes = {
        sehat:     '✅ Semua parameter dalam rentang normal. Tidak ada tindakan diperlukan.',
        perhatian: '⚠️ Beberapa parameter mendekati batas. Pantau lebih sering.',
        kritis:    '🔴 Parameter di luar batas aman. Segera lakukan penanganan!'
    };
    document.getElementById('s-note').textContent = notes[plant.status];
}

// Filter handler
document.getElementById('filter-zone').addEventListener('change', function() {
    currentFilter = this.value;
    buildGrid(COLS, ROWS, plantData, currentFilter);
    // Reset stat panel
    document.getElementById('stat-empty').style.display   = 'flex';
    document.getElementById('stat-content').style.display = 'none';
    selectedCard = null;
});

// Init mapping
buildColHeaders(COLS);
buildRowLabels(ROWS);
buildGrid(COLS, ROWS, plantData, 'all');

// ── Modal Form ───────────────────────────────
const overlay  = document.getElementById('modal-overlay');
let selectedStatus = 'sehat';

function openModal() {
    // Reset form
    document.getElementById('f-col').value   = '';
    document.getElementById('f-row').value   = '';
    document.getElementById('f-suhu').value  = '';
    document.getElementById('f-hum').value   = '';
    document.getElementById('f-ph').value    = '';
    document.getElementById('f-ec').value    = '';
    document.getElementById('f-light').value = '';
    document.getElementById('form-error').textContent = '';
    selectedStatus = 'sehat';
    document.querySelectorAll('.pill').forEach(p => {
        p.classList.toggle('active', p.dataset.val === 'sehat');
    });
    overlay.classList.add('open');
}

function closeModal() { overlay.classList.remove('open'); }

// Open
document.getElementById('btn-add-plant').addEventListener('click', openModal);

// Close
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

// Status pills
document.getElementById('f-status').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    selectedStatus = pill.dataset.val;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
});

// Submit
document.getElementById('btn-submit').addEventListener('click', () => {
    const col   = document.getElementById('f-col').value.trim().toUpperCase();
    const row   = parseInt(document.getElementById('f-row').value);
    const suhu  = parseFloat(document.getElementById('f-suhu').value)  || 28;
    const hum   = parseFloat(document.getElementById('f-hum').value)   || 72;
    const ph    = parseFloat(document.getElementById('f-ph').value)    || 6.8;
    const ec    = parseFloat(document.getElementById('f-ec').value)    || 2.5;
    const light = parseFloat(document.getElementById('f-light').value) || 4.0;
    const errEl = document.getElementById('form-error');

    // Validasi
    if (!col) { errEl.textContent = '⚠ Kolom harus dipilih.'; return; }
    if (!row) { errEl.textContent = '⚠ Baris harus dipilih.'; return; }

    const exists = plantData.find(p => p.col === col && p.row === row);
    if (exists) { errEl.textContent = `⚠ Slot ${col}-0${row} sudah terisi!`; return; }

    errEl.textContent = '';
    plantData.push({ col, row, status: selectedStatus, sensor: { suhu, hum, ph, ec, light } });
    buildGrid(COLS, ROWS, plantData, currentFilter);
    closeModal();
});

// ── Charts (Riwayat) ─────────────────────
let chartsInitialized = false;

const labels7d = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
        x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#7d8590', font: { family: 'DM Mono', size: 11 } }
        },
        y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#7d8590', font: { family: 'DM Mono', size: 11 } }
        }
    }
};

function makeLineDataset(data, color) {
    return {
        data,
        borderColor: color,
        backgroundColor: color + '18',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: color,
        fill: true,
        tension: 0.4
    };
}

function initCharts() {
    // Suhu
    new Chart(document.getElementById('chart-suhu'), {
        type: 'line',
        data: {
            labels: labels7d,
            datasets: [makeLineDataset([26, 28, 27, 30, 29, 28, 28], '#58a6ff')]
        },
        options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 20, max: 40 } } }
    });

    // Kelembaban
    new Chart(document.getElementById('chart-humidity'), {
        type: 'line',
        data: {
            labels: labels7d,
            datasets: [makeLineDataset([68, 72, 70, 75, 73, 71, 72], '#3fb9b9')]
        },
        options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 50, max: 100 } } }
    });

    // pH
    new Chart(document.getElementById('chart-ph'), {
        type: 'bar',
        data: {
            labels: labels7d,
            datasets: [{
                data: [6.8, 6.7, 6.9, 6.5, 6.8, 7.0, 6.8],
                backgroundColor: '#3fb95044',
                borderColor: '#3fb950',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 5, max: 9 } } }
    });

    // Cahaya
    new Chart(document.getElementById('chart-light'), {
        type: 'bar',
        data: {
            labels: labels7d,
            datasets: [{
                data: [3.8, 4.2, 4.0, 4.5, 4.1, 3.9, 4.2],
                backgroundColor: '#d2992244',
                borderColor: '#d29922',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: chartDefaults
    });
}
