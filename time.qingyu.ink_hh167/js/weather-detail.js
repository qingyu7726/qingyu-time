/**
 * Weather Detail Modal — 预报、指数、预警、分钟降水
 * ES5 兼容，适合 Via 等轻量浏览器
 */
(function () {
    "use strict";

    var modal, headerEl, bodyEl, tabs, loadingEl, contentEl, activeTab = 'forecast', detailData = null;

    var iconMap = {
        '100': '☀️', '101': '🌤️', '102': '⛅', '103': '⛅', '104': '☁️',
        '150': '🌙', '151': '🌙', '152': '🌙', '153': '🌙',
        '300': '🌦️', '301': '🌦️', '302': '⛈️', '303': '🌧️', '304': '🌧️',
        '305': '🌧️', '306': '🌧️', '307': '🌧️', '308': '🌧️', '309': '🌧️',
        '310': '🌧️', '311': '🌧️', '312': '🌧️', '313': '🌧️', '314': '🌧️',
        '315': '🌦️', '316': '🌧️', '317': '🌧️', '318': '🌧️', '399': '🌧️',
        '400': '🌨️', '401': '🌨️', '402': '🌨️', '403': '❄️', '404': '❄️',
        '405': '🌨️', '406': '🌨️', '407': '🌨️', '408': '🌨️', '409': '❄️',
        '410': '❄️', '499': '❄️',
        '500': '🌫️', '501': '🌫️', '502': '🌫️', '509': '🌫️', '510': '🌫️',
        '511': '🌫️', '512': '🌫️', '513': '🌫️', '514': '🌫️', '515': '🌫️',
        '900': '🌡️'
    };
    function getIcon(code) { return iconMap[code] || '🌡️'; }

    var windLevels = ['无风','1级','2级','3级','4级','5级','6级','7级','8级','9级','10级','11级','12级'];
    var wkDays = ['周日','周一','周二','周三','周四','周五','周六'];

    function init() {
        if (modal) return;
        modal = document.getElementById('weatherDetailModal');
        if (!modal) return;
        close(); // 保证初始隐藏
        headerEl = modal.querySelector('.wd-header');
        bodyEl = modal.querySelector('.wd-body');
        loadingEl = modal.querySelector('.weather-detail-loading');
        contentEl = modal.querySelector('.weather-detail-content');
        tabs = modal.querySelectorAll('.wd-tab');

        // 关闭按钮
        var closeBtn = modal.querySelector('.weather-detail-close');
        if (closeBtn) closeBtn.onclick = close;
        var backdrop = modal.querySelector('.weather-detail-backdrop');
        if (backdrop) backdrop.onclick = close;

        // Tab 切换
        var i;
        for (i = 0; i < tabs.length; i++) {
            (function (btn) {
                btn.onclick = function () {
                    var tab = btn.getAttribute('data-tab');
                    if (tab) setTab(tab);
                };
            })(tabs[i]);
        }
    }

    function setTab(tab) {
        if (!modal) return;
        activeTab = tab;
        var i;
        for (i = 0; i < tabs.length; i++) {
            var cls = tabs[i].classList;
            if (tabs[i].getAttribute('data-tab') === tab) {
                cls.add('active');
            } else {
                cls.remove('active');
            }
        }
        renderBody(tab);
    }

    function close() {
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    function open(lat, lon) {
        init();
        if (!modal) return;
        modal.style.display = 'flex';
        modal.classList.add('show');
        loadingEl.style.display = '';
        contentEl.style.display = 'none';

        var url = '/api/weather.php?lat=' + lat + '&lon=' + lon + '&detail=1&_t=' + (+new Date());
        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.code !== 'ok') throw new Error(data.message || '加载失败');
                detailData = data;
                loadingEl.style.display = 'none';
                contentEl.style.display = '';
                renderHeader(data);
                setTab(activeTab);
            })
            .catch(function (err) {
                loadingEl.textContent = '加载失败: ' + err.message;
            });
    }

    function renderHeader(data) {
        if (!headerEl || !data.now) return;
        var n = data.now;
        var emoji = getIcon(n.icon);
        var temp = Math.round(parseFloat(n.temp));
        var feels = Math.round(parseFloat(n.feelsLike));
        var ws = windLevels[parseInt(n.windScale, 10)] || n.windScale + '级';
        var locationName = '';
        if (data.city) {
            locationName = data.adm1 && data.adm1 !== data.city ? data.adm1 + ' ' + data.city : data.city;
        }
        headerEl.innerHTML =
            '<div class="wd-now-icon">' + emoji + '</div>' +
            '<div class="wd-now-temp">' + temp + '°</div>' +
            '<div class="wd-now-desc">' + (n.text || '') + '</div>' +
            (locationName ? '<div class="wd-now-location">📍 ' + locationName + '</div>' : '') +
            '<div class="wd-now-meta">体感 ' + feels + '° · 湿度 ' + n.humidity + '% · ' +
            n.windDir + ' ' + ws + '</div>' +
            '<div class="wd-now-meta">气压 ' + n.pressure + 'hPa · 能见度 ' + n.vis + 'km' +
            (n.precip && parseFloat(n.precip) > 0 ? ' · 降水 ' + n.precip + 'mm' : '') + '</div>';
    }

    function renderBody(tab) {
        if (!bodyEl || !detailData) return;
        if (tab === 'forecast') renderForecast();
        else if (tab === 'indices') renderIndices();
        else if (tab === 'warning') renderWarning();
        else if (tab === 'rain') renderRain();
    }

    function renderForecast() {
        var daily = detailData.daily || [];
        var html = '', i;
        for (i = 0; i < daily.length; i++) {
            var d = daily[i];
            var label = i === 0 ? '今天' : i === 1 ? '明天' : wkDays[new Date(d.fxDate + 'T00:00:00').getDay()];
            var hi = Math.round(parseFloat(d.tempMax));
            var lo = Math.round(parseFloat(d.tempMin));
            var emoji = getIcon(d.iconDay);
            html += '<div class="wd-forecast-row">' +
                '<span class="wd-fc-day">' + label + '</span>' +
                '<span class="wd-fc-icon">' + emoji + '</span>' +
                '<span class="wd-fc-temps">' +
                '<span class="wd-fc-high">' + hi + '°</span>' +
                '<span class="wd-fc-bar"><span style="width:60%"></span></span>' +
                '<span class="wd-fc-low">' + lo + '°</span></span>' +
                '<span class="wd-fc-text">' + (d.textDay || '') + '</span>' +
                '<span class="wd-fc-wind">' + (d.windDirDay || '') + ' ' + (d.windScaleDay || '') + '级</span>' +
                '</div>';
        }
        bodyEl.innerHTML = html;
    }

    function renderIndices() {
        var indices = detailData.indices || [];
        if (!indices.length) {
            bodyEl.innerHTML = '<div class="wd-empty">暂无指数数据</div>';
            return;
        }
        var html = '<div class="wd-indices-grid">', i;
        for (i = 0; i < indices.length; i++) {
            var idx = indices[i];
            var lc = 'wd-idx-l' + (parseInt(idx.level, 10) || 1);
            html += '<div class="wd-index-item ' + lc + '">' +
                '<div class="wd-idx-name">' + (idx.name || '') + '</div>' +
                '<div class="wd-idx-level">' + (idx.category || idx.level || '') + '</div>' +
                '<div class="wd-idx-text">' + (idx.text || '') + '</div></div>';
        }
        html += '</div>';
        bodyEl.innerHTML = html;
    }

    function renderWarning() {
        var warnings = detailData.warnings || [];
        if (!warnings.length) {
            bodyEl.innerHTML = '<div class="wd-empty">当前无预警</div>';
            return;
        }
        var html = '', i;
        for (i = 0; i < warnings.length; i++) {
            var w = warnings[i];
            var sev = (w.severity || '').toLowerCase();
            var sc = sev === 'red' ? 'wd-warn-red' : sev === 'orange' ? 'wd-warn-orange' : sev === 'yellow' ? 'wd-warn-yellow' : 'wd-warn-blue';
            html += '<div class="wd-warning ' + sc + '">' +
                '<div class="wd-warn-title"><span class="wd-warn-badge">' + (w.severity || '') + '</span>' + (w.title || '') + '</div>' +
                '<div class="wd-warn-text">' + (w.text || '') + '</div>' +
                '<div class="wd-warn-time">' + (w.pubTime || '') + '</div></div>';
        }
        bodyEl.innerHTML = html;
    }

    function renderRain() {
        var minutely = detailData.minutely;
        if (!minutely || !minutely.minutely || !minutely.minutely.length) {
            bodyEl.innerHTML = '<div class="wd-empty">' + (minutely && minutely.summary ? minutely.summary : '暂无降水数据') + '</div>';
            return;
        }
        var summary = minutely.summary || '';
        var items = minutely.minutely;
        var maxPrecip = 1, i;
        for (i = 0; i < items.length; i++) {
            if (parseFloat(items[i].precip) > maxPrecip) maxPrecip = parseFloat(items[i].precip);
        }
        var chartHtml = '';
        var limit = items.length > 24 ? 24 : items.length;
        for (i = 0; i < limit; i++) {
            var m = items[i];
            var val = parseFloat(m.precip) || 0;
            var pct = maxPrecip > 0 ? Math.min(val / maxPrecip * 100, 100) : 0;
            var time = (m.fxTime || '').slice(11, 16);
            chartHtml += '<div class="wd-rain-bar-wrap" title="' + time + ' ' + val.toFixed(1) + 'mm">' +
                '<div class="wd-rain-bar" style="height:' + pct + '%"></div>' +
                '<div class="wd-rain-label">' + time.slice(0, 2) + '</div></div>';
        }
        bodyEl.innerHTML = '<div class="wd-rain-summary">' + summary + '</div><div class="wd-rain-chart">' + chartHtml + '</div>';
    }

    // ── 公开接口 ──
    window.weatherDetail = { open: open, close: close };

    // ── 导航栏天气点击 ──
    var navWeather = document.getElementById('navWeather');
    if (navWeather) {
        navWeather.onclick = function () {
            var pos = window._weatherPos;
            if (pos) open(pos.lat, pos.lon);
        };
    }

    // ── 侧边栏天气按钮 ──
    var sidebarBtn = document.getElementById('weatherSidebarBtn');
    if (sidebarBtn) {
        sidebarBtn.onclick = function () {
            var pos = window._weatherPos;
            if (pos) {
                open(pos.lat, pos.lon);
            } else {
                var tries = 0;
                var iv = setInterval(function () {
                    if (window._weatherPos) {
                        clearInterval(iv);
                        open(window._weatherPos.lat, window._weatherPos.lon);
                    } else if (++tries > 25) {
                        clearInterval(iv);
                        open(39.9042, 116.4074);
                    }
                }, 200);
            }
            var s = document.getElementById('sidebar');
            if (s) s.classList.remove('show');
        };
    }
})();
