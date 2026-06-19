/**
 * Weather Module — fetches live weather via local proxy (HeFeng API)
 * Position data is sent to /api/weather.php, which forwards to HeFeng.
 * This keeps the API key server-side and enables caching.
 *
 * Position priority: shared cache (from weatherpage) > browser GPS > IP geolocation > Beijing fallback
 */
(function () {
    const navWeather = document.getElementById('navWeather');

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // HeFeng 天气图标 → emoji
    // 完整图标码：https://dev.qweather.com/docs/resource/icons/
    const iconEmoji = {
        '100': '☀️', '101': '🌤️', '102': '⛅', '103': '⛅', '104': '☁️',
        '150': '🌙', '151': '🌙', '152': '🌙', '153': '🌙',
        '300': '🌦️', '301': '🌦️', '302': '⛈️', '303': '🌧️', '304': '🌧️', '305': '🌧️', '306': '🌧️', '307': '🌧️', '308': '🌧️', '309': '🌧️', '310': '🌧️', '311': '🌧️', '312': '🌧️', '313': '🌧️', '314': '🌧️', '315': '🌦️', '316': '🌧️', '317': '🌧️', '318': '🌧️', '399': '🌧️',
        '400': '🌨️', '401': '🌨️', '402': '🌨️', '403': '❄️', '404': '❄️', '405': '🌨️', '406': '🌨️', '407': '🌨️', '408': '🌨️', '409': '❄️', '410': '❄️', '499': '❄️',
        '500': '🌫️', '501': '🌫️', '502': '🌫️', '509': '🌫️', '510': '🌫️', '511': '🌫️', '512': '🌫️', '513': '🌫️', '514': '🌫️', '515': '🌫️',
        '900': '🌡️',
    };
    function getEmoji(code) { return iconEmoji[code] || '🌡️'; }

    /**
     * 获取位置：共享缓存 > 浏览器 GPS > IP 定位 > 北京回退
     * 结果存入 window._weatherPos 供两个天气模块共享
     */
    function getPosition() {
        // 1) 优先使用已缓存的共享位置（用户在天气详情页选的）
        if (window._weatherPos) {
            return Promise.resolve(window._weatherPos);
        }

        // 2) 尝试浏览器 GPS（最准确）
        if (navigator.geolocation) {
            return new Promise(resolve => {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        const result = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                        window._weatherPos = result;
                        resolve(result);
                    },
                    () => tryIpFallback(resolve),  // GPS 失败 → IP
                    { timeout: 5000, maximumAge: 10 * 60 * 1000 }
                );
            });
        }

        // 3) GPS 不可用，直接用 IP
        return new Promise(resolve => tryIpFallback(resolve));
    }

    /**
     * IP 定位：同时请求多个服务，谁先成功就用谁
     * 国内用户优先走 ip.sb（国内能通），其次 ip-api.com
     */
    function tryIpFallback(resolve) {
        var settled = false;

        function done(result) {
            if (settled) return;
            settled = true;
            window._weatherPos = result;
            resolve(result);
        }

        // 服务1：ip.sb（全球可用，国内稳定）
        fetch('https://api.ip.sb/geoip')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.latitude && data.longitude) {
                    done({ lat: data.latitude, lon: data.longitude });
                }
            })
            .catch(function () {});

        // 服务2：ip-api.com（国外服务，做备用）
        fetch('https://ip-api.com/json/?fields=lat,lon')
            .then(function (res) {
                if (!res.ok) throw new Error('fail');
                return res.json();
            })
            .then(function (data) {
                if (data.lat && data.lon) {
                    done({ lat: data.lat, lon: data.lon });
                }
            })
            .catch(function () {});

        // 服务3：ipapi.co（第三备用）
        fetch('https://ipapi.co/json/')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.latitude && data.longitude) {
                    done({ lat: data.latitude, lon: data.longitude });
                }
            })
            .catch(function () {});

        // 3.5秒超时兜底：北京
        setTimeout(function () {
            done({ lat: 39.9042, lon: 116.4074 });
        }, 3500);
    }

    async function fetchWeather() {
        try {
            const pos = await getPosition();

            const url = '/api/weather.php?lat=' + pos.lat + '&lon=' + pos.lon;
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            if (data.code !== 'ok') {
                throw new Error(data.message || 'API error');
            }

            renderWeather(data);
        } catch (err) {
            console.warn('天气获取失败:', err.message);
            if (navWeather) {
                navWeather.innerHTML = '<span style="color:rgba(255,255,255,0.25)">🌡️ 天气暂不可用</span>';
            }
        } finally {
            window.dispatchEvent(new CustomEvent('weatherready'));
        }
    }

    function renderWeather(data) {
        if (!navWeather || !data.now) return;

        const now = data.now;
        const daily = data.daily || [];

        const temp = parseInt(now.temp, 10);
        const feelsLike = parseInt(now.feelsLike, 10);
        const humidity = now.humidity;
        const weatherIcon = getEmoji(now.icon);
        const weatherText = now.text || '未知';

        const forecastParts = daily.slice(0, 6).map(function (day, i) {
            var d = new Date(day.fxDate + 'T00:00:00');
            var label = i === 0 ? '今天' : i === 1 ? '明天' : weekDays[d.getDay()];
            var emoji = getEmoji(day.iconDay);
            var hi = Math.round(parseFloat(day.tempMax));
            var lo = Math.round(parseFloat(day.tempMin));
            return label + emoji + lo + '~' + hi + '°';
        });

        navWeather.innerHTML =
            '<span class="weather-now">' + weatherIcon + ' ' + temp + '° ' + weatherText + '</span>' +
            '<span class="weather-detail">体感' + feelsLike + '° · 湿度' + humidity + '%</span>' +
            '<span class="weather-forecast">' + forecastParts.join(' · ') + '</span>' +
            '<span class="weather-more">☁️</span>';
    }

    fetchWeather();
    setInterval(fetchWeather, 30 * 60 * 1000);
})();
