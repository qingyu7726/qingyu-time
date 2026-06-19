<?php
/**
 * 天气 API 代理（JWT 认证）
 * 
 * 前端请求此接口，服务器生成 JWT 转发到和风天气 API。
 * Ed25519 私钥保存在服务器，JWT 和 API Key 均不暴露给前端。
 * 支持文件缓存，减少对和风 API 的调用。
 * 
 * GET 参数:
 *   lat  纬度 (必填)
 *   lon  经度 (必填)
 * 
 * 返回: JSON
 *   code    "ok" 或 "error"
 *   now     当前天气
 *   daily   7天预报
 *   message 错误信息
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$config = require __DIR__ . '/config.php';

// 检查配置
if (strpos($config['kid'], '请替换') !== false) {
    echo json_encode(['code' => 'error', 'message' => 'API 未配置，请先注册和风天气并填写 api/config.php']);
    exit;
}

$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;

if (!$lat || !$lon) {
    echo json_encode(['code' => 'error', 'message' => '缺少 lat/lon 参数']);
    exit;
}

// ---- 缓存 ----
$detail = !empty($_GET['detail']);
$cacheKey = 'weather_' . round($lat, 1) . '_' . round($lon, 1) . ($detail ? '_full' : '');
$cacheFile = sys_get_temp_dir() . '/' . $cacheKey . '.json';

if (file_exists($cacheFile) && time() - filemtime($cacheFile) < $config['cache_ttl']) {
    $cached = file_get_contents($cacheFile);
    if ($cached) { echo $cached; exit; }
}

// ---- 生成 JWT ----
$jwt = generateJWT($config);
if (!$jwt) {
    echo json_encode(['code' => 'error', 'message' => 'JWT 生成失败，请检查私钥配置']);
    exit;
}

// ---- 请求和风 API ----
$baseUrl = "https://{$config['host']}/v7";

// 和风 API 坐标顺序为 经度,纬度
$nowUrl = "{$baseUrl}/weather/now?location={$lon},{$lat}";
$forecastUrl = "{$baseUrl}/weather/7d?location={$lon},{$lat}";

$nowData = httpGet($nowUrl, $jwt);
$forecastData = httpGet($forecastUrl, $jwt);

if (!$nowData || !$forecastData) {
    echo json_encode(['code' => 'error', 'message' => '获取天气数据失败']);
    exit;
}

$nowJson = json_decode($nowData, true);
$forecastJson = json_decode($forecastData, true);

if (($nowJson['code'] ?? '') !== '200' || ($forecastJson['code'] ?? '') !== '200') {
    echo json_encode([
        'code' => 'error',
        'message' => '和风天气 API 返回错误',
        'detail' => [
            'now' => $nowJson['code'] ?? 'unknown',
            'forecast' => $forecastJson['code'] ?? 'unknown'
        ]
    ]);
    exit;
}

$response = [
    'code' => 'ok',
    'now'   => $nowJson['now'] ?? null,
    'daily' => $forecastJson['daily'] ?? [],
];

// ---- 详情模式：额外获取指数、预警、分钟降水 ----
if ($detail) {
    // 生活指数 (type=0 表示全部)
    $indicesData = httpGet("{$baseUrl}/indices/1d?type=0&location={$lon},{$lat}", $jwt);
    $indicesJson = $indicesData ? json_decode($indicesData, true) : null;
    if ($indicesJson && ($indicesJson['code'] ?? '') === '200') {
        $response['indices'] = $indicesJson['daily'] ?? [];
    }

    // 天气预警
    $warningsData = httpGet("{$baseUrl}/warning/now?location={$lon},{$lat}", $jwt);
    $warningsJson = $warningsData ? json_decode($warningsData, true) : null;
    if ($warningsJson && ($warningsJson['code'] ?? '') === '200') {
        $response['warnings'] = $warningsJson['warning'] ?? [];
    }

    // 分钟级降水（未来2小时）
    $minutelyData = httpGet("{$baseUrl}/minutely/5m?location={$lon},{$lat}", $jwt);
    $minutelyJson = $minutelyData ? json_decode($minutelyData, true) : null;
    if ($minutelyJson && ($minutelyJson['code'] ?? '') === '200') {
        $response['minutely'] = [
            'summary' => $minutelyJson['summary'] ?? '',
            'minutely' => $minutelyJson['minutely'] ?? [],
        ];
    }

    // 城市名称（通过坐标反查）
    $geoUrl = "https://{$config['host']}/geo/v2/city/lookup?location={$lon},{$lat}";
    $geoData = httpGet($geoUrl, $jwt);
    $geoJson = $geoData ? json_decode($geoData, true) : null;
    if ($geoJson && ($geoJson['code'] ?? '') === '200' && !empty($geoJson['location'])) {
        $loc = $geoJson['location'][0];
        $response['city'] = $loc['name'] ?? '';
        $response['adm1'] = $loc['adm1'] ?? '';
    }
}

$json = json_encode($response, JSON_UNESCAPED_UNICODE);
file_put_contents($cacheFile, $json, LOCK_EX);
echo $json;


// ================================================================
// 函数
// ================================================================

/**
 * 生成 JWT (EdDSA/Ed25519)
 * 使用 PHP Sodium 扩展签名
 */
function generateJWT($config) {
    $privateKeyFile = $config['private_key_file'];
    if (!file_exists($privateKeyFile)) return null;

    $pem = @file_get_contents($privateKeyFile);
    if (!$pem) return null;

    $key = @openssl_pkey_get_private($pem);
    if (!$key) return null;

    $details = @openssl_pkey_get_details($key);

    if (!$details || !isset($details['ed25519']['priv_key'])) return null;

    $seed = $details['ed25519']['priv_key'];
    if (strlen($seed) !== 32) return null;

    // 用 Sodium 生成签名密钥对
    $keypair = sodium_crypto_sign_seed_keypair($seed);
    $secretKey = sodium_crypto_sign_secretkey($keypair);

    // Header
    $header = base64url_encode(json_encode([
        'alg' => 'EdDSA',
        'kid' => $config['kid'],
    ]));

    // Payload
    $now = time();
    $payload = base64url_encode(json_encode([
        'sub' => $config['sub'],
        'iat' => $now - 30,
        'exp' => $now + $config['jwt_ttl'],
    ]));

    // 签名
    $data = $header . '.' . $payload;
    $signature = sodium_crypto_sign_detached($data, $secretKey);
    sodium_memzero($secretKey);

    return $data . '.' . base64url_encode($signature);
}

/**
 * Base64URL 编码（RFC 7515）
 */
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * HTTP GET 请求（携带 JWT）
 */
function httpGet($url, $jwt) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_ENCODING => '',
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $jwt,
        ],
        CURLOPT_USERAGENT => 'TimeClock/1.0',
    ]);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    return $httpCode === 200 ? $result : null;
}
