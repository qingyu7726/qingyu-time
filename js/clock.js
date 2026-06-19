/**
 * Clock — full-screen digital clock with date & weekday
 * Supports 12/24 hour format switching via settings.
 */
(function () {
    const hoursEl   = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const ampmEl    = document.getElementById('ampm');
    const dateEl    = document.getElementById('date');
    const monthEl   = document.getElementById('month');
    const yearEl    = document.getElementById('year');
    const weekdayEl = document.getElementById('weekday');

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    let timer;

    function update() {
        const now  = new Date();
        const fmt  = Settings.get('hourFormat'); // '12' or '24'
        const h24  = now.getHours();
        const min  = String(now.getMinutes()).padStart(2, '0');
        const sec  = String(now.getSeconds()).padStart(2, '0');

        if (fmt === '12') {
            const h12 = h24 % 12 || 12;
            hoursEl.textContent = String(h12).padStart(2, '0');
            ampmEl.textContent  = h24 >= 12 ? 'PM' : 'AM';
            ampmEl.classList.add('show');
        } else {
            hoursEl.textContent = String(h24).padStart(2, '0');
            ampmEl.classList.remove('show');
        }

        minutesEl.textContent = min;
        secondsEl.textContent = sec;

        dateEl.textContent    = String(now.getDate()).padStart(2, '0');
        monthEl.textContent   = (now.getMonth() + 1) + '月';
        yearEl.textContent    = now.getFullYear() + '年';
        weekdayEl.textContent = weekdays[now.getDay()];
    }

    function start() {
        update();
        timer = setInterval(update, 1000);
    }

    function stop() {
        clearInterval(timer);
        timer = null;
    }

    // React to settings changes
    window.addEventListener('settingschange', e => {
        if (e.detail.key === 'hourFormat') update();
    });

    // Start / stop on page visibility
    window.addEventListener('pagechange', e => {
        if (e.detail.page === 'clock') start();
        else stop();
    });

    // Initial start (clock page is default)
    start();
})();
