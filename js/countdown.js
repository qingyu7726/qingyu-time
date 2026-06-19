/**
 * Countdown Timer
 */
(function () {
    const hInput     = document.getElementById('cdHours');
    const mInput     = document.getElementById('cdMinutes');
    const sInput     = document.getElementById('cdSeconds');
    const display    = document.getElementById('cdDisplay');
    const startBtn   = document.getElementById('cdStart');
    const resetBtn   = document.getElementById('cdReset');
    const presetBtns = document.querySelectorAll('.cd-preset');

    let totalSeconds  = 300; // default 5 min
    let remaining     = 300;
    let running       = false;
    let intervalId    = null;
    let audioCtx      = null;

    function format(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) {
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function readInput() {
        const h = parseInt(hInput.value) || 0;
        const m = parseInt(mInput.value) || 0;
        const s = parseInt(sInput.value) || 0;
        return Math.max(0, h * 3600 + m * 60 + s);
    }

    function syncInputsToRemaining() {
        hInput.value = Math.floor(remaining / 3600);
        mInput.value = Math.floor((remaining % 3600) / 60);
        sInput.value = remaining % 60;
    }

    function beep() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = 880;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.5);
        } catch { /* audio not available */ }
    }

    function tick() {
        if (remaining <= 0) {
            stop();
            display.textContent = '00:00';
            display.classList.add('flash');
            beep();
            setTimeout(() => display.classList.remove('flash'), 3000);
            return;
        }
        remaining--;
        display.textContent = format(remaining);
        syncInputsToRemaining();
    }

    function startPause() {
        if (running) {
            // Pause
            clearInterval(intervalId);
            intervalId = null;
            running = false;
            startBtn.textContent = '继续';
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-outline');
            // Allow editing while paused
            setInputsEnabled(true);
        } else {
            // If not started yet, read from inputs
            if (remaining <= 0 || (!intervalId && remaining === totalSeconds)) {
                remaining = readInput();
                totalSeconds = remaining;
                if (remaining <= 0) return;
                setInputsEnabled(false);
            }
            running = true;
            intervalId = setInterval(tick, 1000);
            startBtn.textContent = '暂停';
            startBtn.classList.remove('btn-outline');
            startBtn.classList.add('btn-primary');
        }
    }

    function stop() {
        clearInterval(intervalId);
        intervalId = null;
        running = false;
        startBtn.textContent = '开始';
        startBtn.classList.remove('btn-outline');
        startBtn.classList.add('btn-primary');
        setInputsEnabled(true);
    }

    function reset() {
        stop();
        totalSeconds = readInput();
        remaining = totalSeconds;
        display.textContent = format(remaining);
        display.classList.remove('flash');
    }

    function setInputsEnabled(enabled) {
        hInput.disabled = !enabled;
        mInput.disabled = !enabled;
        sInput.disabled = !enabled;
        presetBtns.forEach(b => b.disabled = !enabled);
    }

    function selectPreset(sec) {
        if (running) return;
        totalSeconds = sec;
        remaining = sec;
        display.textContent = format(remaining);
        hInput.value = Math.floor(sec / 3600);
        mInput.value = Math.floor((sec % 3600) / 60);
        sInput.value = sec % 60;
        display.classList.remove('flash');

        // Update active state
        presetBtns.forEach(b => b.classList.remove('active'));
        const active = document.querySelector(`.cd-preset[data-sec="${sec}"]`);
        if (active) active.classList.add('active');
    }

    // Event listeners
    startBtn.addEventListener('click', startPause);
    resetBtn.addEventListener('click', reset);

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => selectPreset(parseInt(btn.dataset.sec)));
    });

    // Update display when inputs change manually
    [hInput, mInput, sInput].forEach(input => {
        input.addEventListener('input', () => {
            if (!running) {
                remaining = readInput();
                totalSeconds = remaining;
                display.textContent = format(remaining);
                // Clear preset active
                presetBtns.forEach(b => b.classList.remove('active'));
            }
        });
    });

    // Stop on page leave
    window.addEventListener('pagechange', e => {
        if (e.detail.page !== 'countdown' && running) {
            clearInterval(intervalId);
            intervalId = null;
            running = false;
            startBtn.textContent = '继续';
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-outline');
            setInputsEnabled(true);
        }
    });
})();
