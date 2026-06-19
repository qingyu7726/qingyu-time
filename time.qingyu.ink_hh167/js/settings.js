/**
 * Settings Module — manages user preferences via localStorage
 * Provides a global `Settings` object used by all other modules.
 *
 * Key design:
 *  - load() always returns a shallow copy → external mutation safe
 *  - set() validates keys and dispatches 'settingschange' automatically
 *  - syncToDOM() is the single source of truth for pushing state into the settings modal
 */
const Settings = (() => {
    const KEY = 'clock-app-settings';

    /** @type {Readonly<Object>} */
    const DEFAULTS = Object.freeze({
        hourFormat: '24',               // '12' | '24'
        clockTitle: '沉浸式时钟',
        clockTitleColor: '#94a3b8',     // top title color
        clockSubtitle: '专注此刻，不负时光',
        clockSubtitleColor: '#60a5fa',  // bottom subtitle color
        quoteMode: 'rotate',            // 'rotate' | 'off'
        quoteInterval: '60',           // '5' | '10' | '30' | '60' | '180' | '300' | '600' | '1800' | '3600'
        particles: 'on',                // 'on' | 'off'
        bgType: 'solid',                // 'solid' | 'nature' | 'custom' | 'builtin'
        bgImage: '',                    // base64 data URL for custom upload
        clockFont: 'mono',              // 'mono' | 'sans' | 'serif' | 'kaiti' | 'rounded'
        fontSize: '14',                 // '12' | '14' | '16' | '18'  — html root font-size in px
        // Countdown display in nav
        cdMode: 'off',                  // 'off' | 'gaokao' | 'custom'
        cdCustomTitle: '',              // custom title text
        cdCustomDate: '',               // ISO date for custom countdown
        cdThresholds: '',               // JSON: [{d:100,c:"#34d399"},{d:0,c:"#f87171"}]
        cdFontSize: '72',              // 40-100 px
    });

    /** Allowed values per key (null = any string) */
    const ALLOWED = {
        hourFormat: ['12', '24'],
        clockTitle: null,
        clockTitleColor: null,
        clockSubtitle: null,
        clockSubtitleColor: null,
        quoteMode: ['rotate', 'off'],
        quoteInterval: ['5', '10', '30', '60', '180', '300', '600', '1800', '3600'],
        particles: ['on', 'off'],
        bgType: ['solid', 'nature', 'custom', 'builtin'],
        bgImage: null,
        clockFont: ['mono', 'sans', 'serif', 'kaiti', 'rounded'],
        fontSize: ['12', '14', '16', '18'],
        cdMode: ['off', 'gaokao', 'custom'],
        cdCustomTitle: null,
        cdCustomDate: null,
        cdThresholds: null,
        cdFontSize: ['40', '50', '60', '72', '80', '90', '100'],
    };

    let _cache = null;  // raw parsed object, never exposed directly

    // ---- helpers ----

    function _readRaw() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function _writeRaw(obj) {
        try {
            localStorage.setItem(KEY, JSON.stringify(obj));
            return true;
        } catch {
            window.dispatchEvent(new CustomEvent('settingserror', { detail: { reason: 'quota' } }));
            return false;
        }
    }

    // ---- public API ----

    /**
     * Load all settings. Returns a shallow copy — mutations are harmless.
     */
    function load() {
        if (!_cache) {
            const stored = _readRaw();
            _cache = { ...DEFAULTS, ...(stored || {}) };
        }
        return { ..._cache };
    }

    /**
     * Get a single setting value.
     */
    function get(key) {
        return load()[key];
    }

    /**
     * Set a single setting. Validates key & value, persists, dispatches event.
     */
    function set(key, value) {
        if (!(key in DEFAULTS)) {
            console.warn(`Settings.set: unknown key "${key}"`);
            return;
        }

        // Validate enum values
        const allowed = ALLOWED[key];
        if (allowed !== null && !allowed.includes(value)) {
            console.warn(`Settings.set: invalid value "${value}" for "${key}". Allowed: ${allowed.join(', ')}`);
            return;
        }

        // Ensure cache is primed
        load();

        const oldValue = _cache[key];
        if (oldValue === value) return;  // no change

        _cache[key] = value;
        _writeRaw(_cache);

        // Dispatch change event
        window.dispatchEvent(new CustomEvent('settingschange', {
            detail: { key, value, oldValue }
        }));
    }

    /**
     * Set multiple settings at once. Dispatches one event per key.
     */
    function setMultiple(obj) {
        for (const [key, value] of Object.entries(obj)) {
            set(key, value);
        }
    }

    /**
     * Reset a single key to its default.
     */
    function reset(key) {
        if (!(key in DEFAULTS)) return;
        set(key, DEFAULTS[key]);
    }

    /**
     * Reset all settings to defaults.
     */
    function resetAll() {
        _cache = { ...DEFAULTS };
        _writeRaw(_cache);
        // Dispatch events for every key
        for (const [key, value] of Object.entries(DEFAULTS)) {
            window.dispatchEvent(new CustomEvent('settingschange', {
                detail: { key, value, oldValue: undefined }
            }));
        }
    }

    /**
     * Push current settings into the settings modal DOM elements.
     * Call this right before showing the modal.
     */
    function syncToDOM() {
        const s = load();

        const mapping = {
            setHourFormat:        s.hourFormat,
            setClockTitle:        s.clockTitle,
            setClockTitleColor:   s.clockTitleColor,
            setClockSubtitle:     s.clockSubtitle,
            setClockSubtitleColor: s.clockSubtitleColor,
            setQuoteMode:         s.quoteMode,
            setQuoteInterval:     s.quoteInterval,
            setParticles:         s.particles,
            setBgType:            s.bgType,
            setClockFont:         s.clockFont,
            setFontSize:          s.fontSize,
            setCdMode:            s.cdMode,
            setCdCustomTitle:     s.cdCustomTitle,
            setCdCustomDate:      s.cdCustomDate,
            setCdFontSize:        s.cdFontSize,
        };

        for (const [id, val] of Object.entries(mapping)) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }
    }

    return {
        DEFAULTS,
        load,
        get,
        set,
        setMultiple,
        reset,
        resetAll,
        syncToDOM,
    };
})();
