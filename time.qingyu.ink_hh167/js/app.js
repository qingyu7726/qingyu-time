/**
 * App — entry point, sidebar navigation, background canvas, fullscreen, quotes
 */
(function () {
    // ---- DOM refs ----
    const menuBtn    = document.getElementById('menuBtn');
    const sidebar    = document.getElementById('sidebar');
    const overlay    = document.getElementById('overlay');
    const menuItems  = document.querySelectorAll('.sidebar-menu li');
    const pages      = document.querySelectorAll('.page');

    // settings modal
    const settingsBtn   = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalClose    = document.getElementById('modalClose');

    // fullscreen
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // loading screen
    const loadingScreen = document.getElementById('loading-screen');

    let currentPage = 'clock';

    // ---- Sidebar ----
    function openSidebar() {
        menuBtn.classList.add('active');
        sidebar.classList.add('show');
        overlay.classList.add('show');
    }

    function closeSidebar() {
        menuBtn.classList.remove('active');
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }

    menuBtn.addEventListener('click', () => {
        sidebar.classList.contains('show') ? closeSidebar() : openSidebar();
    });
    overlay.addEventListener('click', closeSidebar);

    // ---- Page Switching ----
    function switchPage(pageName) {
        if (currentPage === pageName) return;
        currentPage = pageName;

        menuItems.forEach(li => {
            li.classList.toggle('active', li.dataset.page === pageName);
        });
        pages.forEach(p => {
            p.classList.toggle('active', p.id === `page-${pageName}`);
        });

        window.dispatchEvent(new CustomEvent('pagechange', { detail: { page: pageName } }));
    }

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.page) {
                switchPage(item.dataset.page);
            }
            closeSidebar();
        });
    });

    // ---- Fullscreen ----
    function updateFullscreenState() {
        const isFS = !!document.fullscreenElement;
        fullscreenBtn.textContent = isFS ? '⛒' : '⛶';
        fullscreenBtn.title = isFS ? '退出全屏' : '全屏模式';
        fullscreenBtn.classList.toggle('active', isFS);
    }
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    });
    document.addEventListener('fullscreenchange', updateFullscreenState);

    // ---- Toast notification ----
    let _toastTimer = null;
    function showToast(msg) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;padding:10px 24px;background:rgba(0,0,0,0.85);color:#fff;border-radius:20px;font-size:0.85rem;pointer-events:none;transition:opacity 0.4s;opacity:0;';
            document.body.appendChild(toast);
        }
        clearTimeout(_toastTimer);
        toast.textContent = msg;
        toast.style.opacity = '1';
        _toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    }

    // ---- Settings Modal ----
    function openSettings() {
        Settings.syncToDOM();
        updateBgRows();
        updateCdRows();
        settingsModal.classList.add('show');
    }
    function closeSettings() {
        settingsModal.classList.remove('show');
    }

    settingsBtn.addEventListener('click', openSettings);
    modalBackdrop.addEventListener('click', closeSettings);
    modalClose.addEventListener('click', closeSettings);

    // ---- About Modal ----
    const aboutBtn = document.getElementById('aboutBtn');
    const aboutModal = document.getElementById('aboutModal');
    const aboutBackdrop = document.getElementById('aboutBackdrop');
    const aboutClose = document.getElementById('aboutClose');

    function openAbout() {
        aboutModal.classList.add('show');
        closeSidebar();
    }
    function closeAbout() {
        aboutModal.classList.remove('show');
    }

    if (aboutBtn) aboutBtn.addEventListener('click', openAbout);
    if (aboutBackdrop) aboutBackdrop.addEventListener('click', closeAbout);
    if (aboutClose) aboutClose.addEventListener('click', closeAbout);

    // ---- Centralized settings UI bindings ----
    // Each modal control simply calls Settings.set().
    // All DOM updates happen via the 'settingschange' event listener below.
    (function bindSettingsControls() {
        // Simple select/input → direct mapping to settings key
        const bindings = [
            { id: 'setHourFormat',   event: 'change', key: 'hourFormat' },
            { id: 'setQuoteMode',    event: 'change', key: 'quoteMode' },
            { id: 'setQuoteInterval', event: 'change', key: 'quoteInterval' },
            { id: 'setParticles',    event: 'change', key: 'particles' },
            { id: 'setBgType',       event: 'change', key: 'bgType' },
            { id: 'setClockTitle',       event: 'input', key: 'clockTitle', fallback: Settings.DEFAULTS.clockTitle },
            { id: 'setClockSubtitle',    event: 'input', key: 'clockSubtitle', fallback: Settings.DEFAULTS.clockSubtitle },
            { id: 'setClockTitleColor',  event: 'input', key: 'clockTitleColor' },
            { id: 'setClockSubtitleColor', event: 'input', key: 'clockSubtitleColor' },
            { id: 'setClockFont',      event: 'change', key: 'clockFont' },
            { id: 'setFontSize',       event: 'change', key: 'fontSize' },
            { id: 'setCdMode',        event: 'change', key: 'cdMode' },
            { id: 'setCdCustomTitle', event: 'input',  key: 'cdCustomTitle' },
            { id: 'setCdCustomDate',  event: 'change', key: 'cdCustomDate' },
            { id: 'setCdFontSize',    event: 'change', key: 'cdFontSize' },
        ];

        bindings.forEach(({ id, event, key, fallback }) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(event, function () {
                const val = fallback !== undefined
                    ? (this.value || fallback)
                    : this.value;
                Settings.set(key, val);
            });
        });
    })();

    // ---- Countdown Threshold: bind inputs & sync ──
    function bindThRowEvents(row) {
        var daysEl = row.querySelector('.cd-th-days');
        var colorEl = row.querySelector('.cd-th-color');
        var delEl = row.querySelector('.cd-th-del');
        if (daysEl) daysEl.addEventListener('input', saveThresholds);
        if (colorEl) colorEl.addEventListener('input', saveThresholds);
        if (delEl) delEl.addEventListener('click', function () {
            row.remove();
            saveThresholds();
            updateDelButtons();
        });
    }

    function addThresholdRow(days, color) {
        var container = document.getElementById('cdThresholds');
        if (!container) return;
        // Insert before the last row
        var lastRow = container.querySelector('.cd-th-last');
        var row = document.createElement('div');
        row.className = 'cd-th-row';
        row.innerHTML =
            '<span class="cd-th-label">大于</span>' +
            '<input type="number" class="cd-th-days" placeholder="天数" min="1" value="' + (days || '') + '">' +
            '<span class="cd-th-label">天</span>' +
            '<input type="color" class="cd-th-color" value="' + (color || '#60a5fa') + '" title="颜色">' +
            '<button class="cd-th-del" title="删除此行">✕</button>';
        container.insertBefore(row, lastRow);
        bindThRowEvents(row);
        updateDelButtons();
        saveThresholds();
    }

    function updateDelButtons() {
        var rows = document.querySelectorAll('#cdThresholds .cd-th-row:not(.cd-th-last)');
        var delBtns = document.querySelectorAll('#cdThresholds .cd-th-row:not(.cd-th-last) .cd-th-del');
        // Hide delete if only 1 non-last row (keep at least 1 threshold)
        delBtns.forEach(function (btn) {
            btn.style.display = rows.length <= 1 ? 'none' : '';
        });
    }

    // Initial bind
    (function initCdThresholds() {
        var rows = document.querySelectorAll('#cdThresholds .cd-th-row');
        rows.forEach(bindThRowEvents);
        document.getElementById('cdThAdd').addEventListener('click', function () {
            addThresholdRow('', '#60a5fa');
        });
        updateDelButtons();
    })();

    function saveThresholds() {
        var container = document.getElementById('cdThresholds');
        if (!container) return;
        var rows = container.querySelectorAll('.cd-th-row:not(.cd-th-last)');
        var arr = [];
        rows.forEach(function (row) {
            var daysEl = row.querySelector('.cd-th-days');
            var colorEl = row.querySelector('.cd-th-color');
            var d = parseInt(daysEl && daysEl.value) || 0;
            var c = colorEl ? colorEl.value : '#ffffff';
            if (d > 0) arr.push({ d: d, c: c });
        });
        // Sort descending
        arr.sort(function (a, b) { return b.d - a.d; });
        // Get fallback color from last row
        var lastRow = container.querySelector('.cd-th-last');
        var fallbackColor = lastRow ? lastRow.querySelector('.cd-th-color').value : '#f87171';
        arr.push({ d: 0, c: fallbackColor });
        Settings.set('cdThresholds', JSON.stringify(arr));
    }

    function loadThresholds() {
        var container = document.getElementById('cdThresholds');
        if (!container) return;
        var s = Settings.get('cdThresholds');
        var arr = [];
        try { arr = JSON.parse(s); } catch (e) {}
        if (!Array.isArray(arr) || arr.length < 2) {
            arr = [{ d: 100, c: '#34d399' }, { d: 0, c: '#f87171' }];
        }
        arr.sort(function (a, b) { return b.d - a.d; });

        // Remove all non-last rows
        container.querySelectorAll('.cd-th-row:not(.cd-th-last)').forEach(function (r) { r.remove(); });

        // Re-create rows (all except the d=0 fallback)
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].d === 0) {
                // Set fallback color
                var lastRow = container.querySelector('.cd-th-last');
                if (lastRow) lastRow.querySelector('.cd-th-color').value = arr[i].c || '#f87171';
            } else {
                var row = document.createElement('div');
                row.className = 'cd-th-row';
                row.innerHTML =
                    '<span class="cd-th-label">大于</span>' +
                    '<input type="number" class="cd-th-days" placeholder="天数" min="1" value="' + arr[i].d + '">' +
                    '<span class="cd-th-label">天</span>' +
                    '<input type="color" class="cd-th-color" value="' + arr[i].c + '" title="颜色">' +
                    '<button class="cd-th-del" title="删除此行">✕</button>';
                var lastRowRef = container.querySelector('.cd-th-last');
                container.insertBefore(row, lastRowRef);
                bindThRowEvents(row);
            }
        }

        // If no non-last rows exist, add a default one
        if (!container.querySelector('.cd-th-row:not(.cd-th-last)')) {
            var defRow = document.createElement('div');
            defRow.className = 'cd-th-row';
            defRow.innerHTML =
                '<span class="cd-th-label">大于</span>' +
                '<input type="number" class="cd-th-days" placeholder="天数" min="1" value="100">' +
                '<span class="cd-th-label">天</span>' +
                '<input type="color" class="cd-th-color" value="#34d399" title="颜色">' +
                '<button class="cd-th-del" title="删除此行">✕</button>';
            var lastRowRef = container.querySelector('.cd-th-last');
            container.insertBefore(defRow, lastRowRef);
            bindThRowEvents(defRow);
        }

        updateDelButtons();
    }

    // ---- Background System ----
    const bgImageEl = document.getElementById('bgImage');
    const bgUploadRow = document.getElementById('bgUploadRow');
    const bgFetchRow = document.getElementById('bgFetchRow');

    // Track nature fetch URL in memory (not persisted) so we can re-apply
    // without re-fetching on every modal open.
    let _natureImageUrl = null;
    let _builtinImageUrl = null;
    let _bgFetchTimer = null;
    let _bgLoadFailed = {};  // track failed loads per type to throttle notifications

    function _setBodyTransparent(on) {
        document.body.classList.toggle('transparent-ui', on);
    }

    function _showBgImage(url) {
        if (!bgImageEl) return;
        bgImageEl.style.backgroundImage = `url(${url})`;
        bgImageEl.classList.add('show');
        _setBodyTransparent(true);
    }

    function _hideBgImage() {
        if (!bgImageEl) return;
        bgImageEl.style.backgroundImage = '';
        bgImageEl.classList.remove('show');
        _setBodyTransparent(false);
    }

    /**
     * Show/hide the upload / fetch helper rows based on current bgType.
     * Does NOT modify the background image itself.
     */
    function updateBgRows() {
        const type = Settings.get('bgType');
        if (bgUploadRow) bgUploadRow.style.display = type === 'custom' ? '' : 'none';
        if (bgFetchRow) bgFetchRow.style.display = type === 'nature' ? '' : 'none';
    }

    /** Show/hide countdown rows based on cdMode */
    function updateCdRows() {
        var mode = Settings.get('cdMode');
        var show = (mode !== 'off');
        var isCustom = (mode === 'custom');
        // Custom-only rows
        [ 'cdCustomTitleRow', 'cdCustomDateRow' ].forEach(function (id) {
            var row = document.getElementById(id);
            if (row) row.style.display = isCustom ? '' : 'none';
        });
        // Threshold + font size rows visible for all non-off modes
        [ 'cdThresholdRow', 'cdFontSizeRow' ].forEach(function (id) {
            var row = document.getElementById(id);
            if (row) row.style.display = show ? '' : 'none';
        });
        if (show) loadThresholds();
    }

    /**
     * Apply the background according to current settings.
     * - solid  → hide image, remove transparency
     * - nature → fetch (or reuse cached) nature image
     * - custom → use stored base64 (if any), else fall back to solid look
     */
    function applyBackground() {
        if (!bgImageEl) return;
        const type = Settings.get('bgType');

        if (type === 'solid') {
            _hideBgImage();
        } else if (type === 'nature') {
            // If we already have a fetched URL, re-apply it instantly
            if (_natureImageUrl) {
                _showBgImage(_natureImageUrl);
            }
            // Fetch a fresh one (debounced so rapid toggles don't spam requests)
            clearTimeout(_bgFetchTimer);
            _bgFetchTimer = setTimeout(() => {
                const url = `https://picsum.photos/1920/1080/?nature,landscape&random=${Date.now()}`;
                const img = new Image();
                img.onload = () => {
                    _natureImageUrl = url;
                    _showBgImage(url);
                };
                img.onerror = () => {
                    if (!_natureImageUrl) {
                        _hideBgImage();
                        if (!_bgLoadFailed.nature) {
                            _bgLoadFailed.nature = true;
                            showToast('背景图片加载失败，已切换到纯色模式');
                        }
                    }
                };
                img.src = url;
            }, 150);
        } else if (type === 'custom') {
            const dataUrl = Settings.get('bgImage');
            if (dataUrl) {
                _showBgImage(dataUrl);
            } else {
                _hideBgImage();
            }
        } else if (type === 'builtin') {
            if (_builtinImageUrl) {
                _showBgImage(_builtinImageUrl);
            } else {
                // 使用 photo.linsf.fun 域名的内置图片
                const builtinUrl = 'https://photo.linsf.fun/photo.jpg';
                const img = new Image();
                img.onload = () => {
                    _builtinImageUrl = builtinUrl;
                    _showBgImage(builtinUrl);
                };
                img.onerror = () => {
                    console.warn('内置图片加载失败，回退到纯色');
                    if (!_builtinImageUrl) {
                        _hideBgImage();
                        if (!_bgLoadFailed.builtin) {
                            _bgLoadFailed.builtin = true;
                            showToast('内置图片加载失败，已切换到纯色模式');
                        }
                    }
                };
                img.src = builtinUrl;
            }
        }
    }

    // ---- Background-specific UI handlers (not covered by simple key binding) ----

    // File upload for custom background
    document.getElementById('setBgFile').addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('图片太大（超过 2MB），请选择较小的图片。');
            this.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            Settings.setMultiple({ bgImage: reader.result, bgType: 'custom' });
        };
        reader.onerror = () => {
            alert('图片读取失败，请重试。');
        };
        reader.readAsDataURL(file);
    });

    // "Fetch new nature image" button
    document.getElementById('setBgFetch').addEventListener('click', function () {
        // Clear cached nature URL so we always get a fresh image
        _natureImageUrl = null;
        // If already on 'nature', force a re-apply (which will re-fetch)
        if (Settings.get('bgType') === 'nature') {
            applyBackground();
        } else {
            Settings.set('bgType', 'nature');
        }
    });

    // "Clear custom background" button
    document.getElementById('setBgClear').addEventListener('click', function () {
        Settings.setMultiple({ bgImage: '', bgType: 'solid' });
        const fileInput = document.getElementById('setBgFile');
        if (fileInput) fileInput.value = '';
    });

    // ---- Motivational Quote Rotation ----
    const quoteTextEl = document.getElementById('quoteText');
    let quoteTimer = null;

    function updateQuote() {
        if (!quoteTextEl) return;
        if (Settings.get('quoteMode') === 'off') {
            quoteTextEl.style.display = 'none';
            return;
        }
        quoteTextEl.style.display = '';
        quoteTextEl.style.opacity = '0';
        setTimeout(() => {
            quoteTextEl.textContent = Quotes.random();
            quoteTextEl.style.opacity = '1';
        }, 500);
    }

    function startQuoteRotation() {
        stopQuoteRotation();
        if (Settings.get('quoteMode') === 'off') {
            if (quoteTextEl) quoteTextEl.style.display = 'none';
            return;
        }
        if (quoteTextEl) quoteTextEl.style.display = '';
        updateQuote();
        const intervalSec = parseInt(Settings.get('quoteInterval')) || 60;
        quoteTimer = setInterval(updateQuote, intervalSec * 1000);
    }

    function stopQuoteRotation() {
        clearInterval(quoteTimer);
        quoteTimer = null;
    }

    // ---- Centralized settings change handler ----
    // All DOM updates driven by Settings.set() happen here.
    window.addEventListener('settingschange', function (e) {
        const { key, value } = e.detail;

        switch (key) {
            case 'hourFormat':
                // clock.js also listens; nothing extra needed here
                break;

            case 'clockTitle': {
                const el = document.getElementById('clockTitle');
                if (el) el.textContent = value || Settings.DEFAULTS.clockTitle;
                // Keep modal input in sync if modal is open
                const input = document.getElementById('setClockTitle');
                if (input && document.getElementById('settingsModal').classList.contains('show')) {
                    input.value = value;
                }
                break;
            }
            case 'clockTitleColor': {
                const el = document.getElementById('clockTitle');
                if (el) el.style.color = value;
                break;
            }
            case 'clockSubtitle': {
                const el = document.getElementById('clockSubtitle');
                if (el) el.textContent = value || Settings.DEFAULTS.clockSubtitle;
                const input = document.getElementById('setClockSubtitle');
                if (input && document.getElementById('settingsModal').classList.contains('show')) {
                    input.value = value;
                }
                break;
            }
            case 'clockSubtitleColor': {
                const el = document.getElementById('clockSubtitle');
                if (el) el.style.color = value;
                break;
            }
            case 'quoteMode':
                startQuoteRotation();
                break;

            case 'quoteInterval':
                // restart rotation with new interval
                if (Settings.get('quoteMode') !== 'off') startQuoteRotation();
                break;

            case 'particles':
                updateParticles();
                break;

            case 'bgType':
                updateBgRows();
                // When switching away from nature, clear cached nature URL
                if (value !== 'nature') _natureImageUrl = null;
                if (value !== 'builtin') _builtinImageUrl = null;
                applyBackground();
                // Keep select in sync (in case change came from outside the modal)
                const bgTypeEl = document.getElementById('setBgType');
                if (bgTypeEl && bgTypeEl.value !== value) bgTypeEl.value = value;
                break;

            case 'cdMode':
                updateCdRows();
                break;

            case 'bgImage':
                // Only re-apply if currently on 'custom' type
                if (Settings.get('bgType') === 'custom') {
                    applyBackground();
                }
                break;

            case 'clockFont':
                document.body.setAttribute('data-font', value);
                break;

            case 'fontSize':
                document.documentElement.style.fontSize = value + 'px';
                break;
        }
    });

    // ---- Settings save error notification ----
    window.addEventListener('settingserror', function (e) {
        if (e.detail && e.detail.reason === 'quota') {
            showToast('存储空间不足，设置可能未保存');
        }
    });

    // ---- Background Particle Canvas ----
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        const count = Math.floor((canvas.width * canvas.height) / 12000);
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.2 + 0.3,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.5 + 0.2,
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (Settings.get('particles') !== 'on') {
            animId = null;
            return;
        }

        // Move & draw particles
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
            ctx.fill();
        }

        // Spatial grid for O(n) neighbour lookup (cell size = connection radius)
        const CELL = 120;
        const cols = Math.ceil(canvas.width / CELL);
        const rows = Math.ceil(canvas.height / CELL);
        const grid = new Array(cols * rows);
        for (let i = 0; i < particles.length; i++) {
            const col = Math.floor(particles[i].x / CELL);
            const row = Math.floor(particles[i].y / CELL);
            const idx = row * cols + col;
            if (!grid[idx]) grid[idx] = [];
            grid[idx].push(i);
        }

        // Only check neighbouring cells
        for (let cell = 0; cell < grid.length; cell++) {
            const bucket = grid[cell];
            if (!bucket) continue;
            const cr = Math.floor(cell / cols);
            const cc = cell % cols;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = cr + dr;
                    const nc = cc + dc;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    const nidx = nr * cols + nc;
                    const nb = grid[nidx];
                    if (!nb) continue;
                    for (const a of bucket) {
                        for (const b of nb) {
                            if (a >= b) continue;  // avoid double-check and self
                            const dx = particles[a].x - particles[b].x;
                            const dy = particles[a].y - particles[b].y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < CELL) {
                                ctx.beginPath();
                                ctx.moveTo(particles[a].x, particles[a].y);
                                ctx.lineTo(particles[b].x, particles[b].y);
                                ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist / CELL)})`;
                                ctx.lineWidth = 0.5;
                                ctx.stroke();
                            }
                        }
                    }
                }
            }
        }
        animId = requestAnimationFrame(drawParticles);
    }

    function updateParticles() {
        if (Settings.get('particles') === 'off') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            // Restart the animation loop if it was stopped
            cancelAnimationFrame(animId);
            drawParticles();
        }
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });

    // ---- Sidebar clock ----
    function updateSidebarClock() {
        // Skip DOM writes when sidebar is hidden (saves cpu on invisible updates)
        if (!sidebar.classList.contains('show')) return;
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        document.getElementById('sidebarTime').textContent = `${h}:${m}:${s}`;
        document.getElementById('sidebarDate').textContent =
            `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}`;
    }

    // Force one refresh when sidebar opens so the time isn't stale
    function refreshSidebarClock() {
        updateSidebarClock();  // will run normally since sidebar is now visible
    }
    // Hook into sidebar open: update clock immediately on open
    const _origOpenSidebar = openSidebar;
    const _origCloseSidebar = closeSidebar;
    openSidebar = function() {
        _origOpenSidebar();
        refreshSidebarClock();
    };
    closeSidebar = function() {
        _origCloseSidebar();
    };

    // ---- Init ----
    function init() {
        const s = Settings.load();

        // Apply clock title (top)
        const clockTitleEl = document.getElementById('clockTitle');
        if (clockTitleEl) {
            if (s.clockTitle) clockTitleEl.textContent = s.clockTitle;
            if (s.clockTitleColor) clockTitleEl.style.color = s.clockTitleColor;
        }

        // Apply clock subtitle (bottom)
        const clockSubtitleEl = document.getElementById('clockSubtitle');
        if (clockSubtitleEl) {
            if (s.clockSubtitle) clockSubtitleEl.textContent = s.clockSubtitle;
            if (s.clockSubtitleColor) clockSubtitleEl.style.color = s.clockSubtitleColor;
        }

        // Apply font
        document.body.setAttribute('data-font', s.clockFont || 'mono');

        // Apply font size
        document.documentElement.style.fontSize = (s.fontSize || '14') + 'px';

        // Apply background
        applyBackground();
        updateBgRows();

        // Particles
        resizeCanvas();
        createParticles();
        drawParticles();

        // Footer year
        const yearEl = document.getElementById('currentYear');
        if (yearEl) yearEl.textContent = String(new Date().getFullYear());
        const aboutYearEl = document.getElementById('aboutYear');
        if (aboutYearEl) aboutYearEl.textContent = String(new Date().getFullYear());

        // Sidebar clock
        updateSidebarClock();
        setInterval(updateSidebarClock, 1000);

        // Quotes
        startQuoteRotation();

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (settingsModal.classList.contains('show')) closeSettings();
                if (aboutModal && aboutModal.classList.contains('show')) closeAbout();
            }
            if (e.key === 'f' && e.ctrlKey) {
                e.preventDefault();
                fullscreenBtn.click();
            }
        });

        // ---- Auto-save helpers for editable title/subtitle ----
        let titleSaveTimer = null;
        let subtitleSaveTimer = null;

        function saveClockTitle() {
            clearTimeout(titleSaveTimer);
            titleSaveTimer = setTimeout(() => {
                const text = clockTitleEl.textContent.trim() || Settings.DEFAULTS.clockTitle;
                Settings.set('clockTitle', text);
            }, 300);
        }

        function saveClockSubtitle() {
            clearTimeout(subtitleSaveTimer);
            subtitleSaveTimer = setTimeout(() => {
                const text = clockSubtitleEl.textContent.trim() || Settings.DEFAULTS.clockSubtitle;
                Settings.set('clockSubtitle', text);
            }, 300);
        }

        // Auto-save on every keystroke (debounced 300ms)
        clockTitleEl.addEventListener('input', saveClockTitle);
        clockSubtitleEl.addEventListener('input', saveClockSubtitle);

        // Final save + trim on blur
        clockTitleEl.addEventListener('blur', () => {
            clearTimeout(titleSaveTimer);
            const text = clockTitleEl.textContent.trim() || Settings.DEFAULTS.clockTitle;
            Settings.set('clockTitle', text);
            clockTitleEl.textContent = text;
        });
        clockTitleEl.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); clockTitleEl.blur(); }
        });

        clockSubtitleEl.addEventListener('blur', () => {
            clearTimeout(subtitleSaveTimer);
            const text = clockSubtitleEl.textContent.trim() || Settings.DEFAULTS.clockSubtitle;
            Settings.set('clockSubtitle', text);
            clockSubtitleEl.textContent = text;
        });
        clockSubtitleEl.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); clockSubtitleEl.blur(); }
        });

        // Hide loading screen once weather is ready (or timeout after 8s)
        let loadingHidden = false;
        function hideLoading() {
            if (loadingHidden || !loadingScreen) return;
            loadingHidden = true;
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (loadingScreen) loadingScreen.style.display = 'none';
            }, 500);
        }
        window.addEventListener('weatherready', hideLoading, { once: true });
        // Fallback: hide after 8 seconds even if weather hasn't loaded
        setTimeout(hideLoading, 8000);
    }

    init();
})();
