/**
 * Corner Countdown — 右上角距离倒计时，单行布局
 *   格式：标题 + 彩色数字 + 天（一行靠右）
 *
 * Modes:
 *   off     — hidden
 *   gaokao  — "距离高考还剩" + auto next June 7
 *   custom  — 自定义标题/日期
 *
 * Color: 从 cdThresholds JSON 中按天数降序匹配第一个 days > threshold.d
 */
(function () {
    var container = document.getElementById('cornerCountdown');
    var lineEl    = document.getElementById('cdLine');

    if (!container || !lineEl) return;

    var timer = null;

    function todayStart() {
        var d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    function daysBetween(a, b) {
        return Math.round((b - a) / 86400000);
    }

    function getGaokaoTarget() {
        var y = new Date().getFullYear();
        var target = new Date(y, 5, 7);
        if (todayStart() > target) {
            target = new Date(y + 1, 5, 7);
        }
        return target;
    }

    function parseThresholds() {
        try {
            var arr = JSON.parse(Settings.get('cdThresholds') || '[]');
            if (!Array.isArray(arr) || arr.length === 0) {
                return [{ d: 100, c: '#34d399' }, { d: 0, c: '#f87171' }];
            }
            return arr.sort(function (a, b) { return b.d - a.d; });
        } catch (e) {
            return [{ d: 100, c: '#34d399' }, { d: 0, c: '#f87171' }];
        }
    }

    function getColor(days) {
        var thresholds = parseThresholds();
        for (var i = 0; i < thresholds.length; i++) {
            if (days > thresholds[i].d) {
                return thresholds[i].c;
            }
        }
        return thresholds[thresholds.length - 1].c;
    }

    function update() {
        var mode = Settings.get('cdMode');

        if (mode === 'off') {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        var targetDate, titleText;

        if (mode === 'gaokao') {
            targetDate = getGaokaoTarget();
            titleText = '距离' + targetDate.getFullYear() + '年高考还剩 ';
        } else if (mode === 'custom') {
            var dateStr = Settings.get('cdCustomDate');
            if (!dateStr) {
                lineEl.textContent = '请设置日期';
                lineEl.style.color = '#94a3b8';
                lineEl.style.fontSize = '';
                return;
            }
            targetDate = new Date(dateStr + 'T00:00:00');
            titleText = (Settings.get('cdCustomTitle') || '距离目标还剩') + ' ';
        } else {
            return;
        }

        var today = todayStart();
        var days = daysBetween(today, targetDate);

        if (days < 0) {
            if (mode === 'gaokao') {
                targetDate = new Date(today.getFullYear() + 1, 5, 7);
                days = daysBetween(today, targetDate);
            } else {
                days = 0;
            }
        }

        // Font size
        var fontSize = parseInt(Settings.get('cdFontSize')) || 72;

        var color = getColor(days);
        var daysHtml;
        if (days === 0) {
            daysHtml = '<span class="cd-num" style="color:' + color + ';font-size:' + fontSize + 'px;font-family:var(--font-mono);font-weight:800">今天！</span>';
        } else {
            daysHtml = '<span class="cd-num" style="color:' + color + ';font-size:' + fontSize + 'px;font-family:var(--font-mono);font-weight:800">' + days + '</span> 天';
        }

        lineEl.innerHTML = titleText + daysHtml;
        lineEl.style.color = '#ffffff';
        lineEl.style.fontSize = Math.round(fontSize * 0.43) + 'px';
    }

    function start() {
        update();
        timer = setInterval(update, 60000);
    }

    function stop() {
        clearInterval(timer);
        timer = null;
    }

    window.addEventListener('settingschange', function (e) {
        var key = e.detail.key;
        if (key && key.indexOf('cd') === 0) {
            stop();
            start();
        }
    });

    start();
})();
