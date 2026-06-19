<?php
/**
 * 和风天气 JWT 配置
 * 注册地址：https://dev.qweather.com
 */
return [
    // Ed25519 私钥文件路径（完整 PEM，我帮你生成）
    'private_key_file' => __DIR__ . '/ed25519-private.pem',

    // 凭据 ID（kid）
    'kid' => 'KCB5XDY3PR',

    // 项目 ID（sub）
    'sub' => '3N2B337CHH',

    // API 主机地址
    'host' => 'ma2x89dr7j.re.qweatherapi.com',

    // JWT 过期时间（秒），默认 900 = 15 分钟
    'jwt_ttl' => 900,

    // 缓存时间（秒），默认 300 = 5 分钟
    'cache_ttl' => 300,
];
