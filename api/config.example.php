<?php
/**
 * 和风天气 API 配置
 * 
 * 使用方法：
 * 1. 复制此文件为 config.php
 * 2. 在 dev.qweather.com 注册账号
 * 3. 创建项目，获取 API Key 和 API Host
 * 4. 填入下方配置
 */
return [
    // 和风天气 API Key（控制台 → 项目管理 → 创建凭据 → API Key）
    'key' => '请替换为你的API Key',

    // API 主机地址（控制台 → 项目管理 → 查看项目 → API Host）
    // 格式如：abcxyz  完整 URL 为 https://abcxyz.qweatherapi.com
    'host' => '请替换为你的API Host',

    // 缓存时间（秒），默认 300 秒 = 5 分钟
    'cache_ttl' => 300,
];
