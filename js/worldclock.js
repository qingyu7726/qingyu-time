/**
 * World Clock — local time + major cities
 */
(function () {
    const cities = [
        { name: '东京', tz: 'Asia/Tokyo' },
        { name: '纽约', tz: 'America/New_York' },
        { name: '伦敦', tz: 'Europe/London' },
        { name: '悉尼', tz: 'Australia/Sydney' },
        { name: '洛杉矶', tz: 'America/Los_Angeles' },
        { name: '迪拜', tz: 'Asia/Dubai' },
        { name: '巴黎', tz: 'Europe/Paris' },
        { name: '新加坡', tz: 'Asia/Singapore' },
    ];

    let timer;

    function getLocalOffset() {
        return -(new Date().getTimezoneOffset() / 60);
    }

    function formatOffset(h) {
        const sign = h >= 0 ? '+' : '';
        return `UTC${sign}${h}`;
    }

    function formatTime(date) {
        return [
            String(date.getHours()).padStart(2, '0'),
            String(date.getMinutes()).padStart(2, '0'),
            String(date.getSeconds()).padStart(2, '0'),
        ].join(':');
    }

    function formatDate(date) {
        return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
    }

    function getCityTime(city) {
        try {
            const now = new Date();
            const str = now.toLocaleString('en-US', { timeZone: city.tz });
            const cityDate = new Date(str);
            // 通过对比本地时间和UTC时间，推算该城市此刻的真实UTC偏移
            const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
            const utcDate = new Date(utcStr);
            const offsetHours = Math.round((cityDate.getTime() - utcDate.getTime()) / 3600000);
            return {
                time: formatTime(cityDate),
                date: formatDate(cityDate),
                offset: formatOffset(offsetHours),
            };
        } catch {
            return { time: '--:--:--', date: '----/--/--', offset: '?' };
        }
    }

    function update() {
        const now = new Date();
        const localOffset = formatOffset(getLocalOffset());

        document.getElementById('wcLocalTime').textContent = formatTime(now);
        document.getElementById('wcLocalDate').textContent = formatDate(now);
        document.getElementById('wcLocalOffset').textContent = localOffset;

        const grid = document.getElementById('wcGrid');
        grid.innerHTML = cities.map(c => {
            const ct = getCityTime(c);
            return `<div class="wc-city-card">
                <div class="wc-city-name">${c.name}</div>
                <div class="wc-city-time">${ct.time}</div>
                <div class="wc-city-offset">${ct.offset} · ${ct.date}</div>
            </div>`;
        }).join('');
    }

    function start() {
        update();
        timer = setInterval(update, 1000);
    }

    function stop() {
        clearInterval(timer);
        timer = null;
    }

    window.addEventListener('pagechange', e => {
        if (e.detail.page === 'worldclock') start();
        else stop();
    });
})();
