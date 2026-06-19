<div align="center">

# 🕐 庆余时间 · Qingyu Time

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA"/>
  <img src="https://img.shields.io/badge/和风天气-4FC3F7?style=flat-square&logo=cloud&logoColor=white" alt="QWeather"/>
  <br>
  <img src="https://img.shields.io/badge/状态-活跃-success?style=flat-square"/>
  <img src="https://img.shields.io/badge/许可证-MIT-blue?style=flat-square"/>
</p>

**一个简洁优雅的全屏时钟网页应用** ✨  
全屏显示 · 实时天气 · 番茄钟 · 世界时钟 · 倒计时 · 日期计算

<p align="center">
  <a href="https://time.qingyu.ink" target="_blank">🌐 在线体验</a>
  ·
  <a href="#功能">📖 功能列表</a>
  ·
  <a href="#部署">🚀 快速部署</a>
</p>

</div>

---

## 📸 截图

| 星空时钟主页 | 侧边栏 · 功能菜单 | 天气详情 · 7天预报 |
|:---:|:---:|:---:|
| ![](assets/screenshot-main.png) | ![](assets/screenshot-sidebar.png) | ![](assets/screenshot-weather.png) |

上传截图到 `assets/` 目录后替换链接即可。

---

## ✨ 功能

### 🕐 全屏时钟
- 大字体实时时间显示（时:分:秒）
- 12/24 小时制切换
- 日期 + 星期显示
- 多种星空/渐变/纯色背景

### 🌤️ 实时天气
- 当前温度、天气状况、体感温度
- 7 天天气预报
- 自动定位（GPS → IP → 默认城市）
- 和风天气 API · 服务端代理 · JWT 认证

### ⏱️ 番茄钟
- 自定义专注/休息时长
- 倒计时提醒

### 🌍 世界时钟
- 多城市时间同时查看

### ⏳ 倒计时
- 自定义目标时间

### 📅 日期计算器
- 日期差计算 · 纪念日倒计时

### 🎨 自定义
- 多种背景主题 · 自定义背景图 · 名言警句

### 📦 PWA 支持
- 可添加到主屏幕，类原生体验

---

## 🛠️ 技术栈

HTML5 · CSS3 · JavaScript (ES6+) · PHP · 和风天气 API · PWA · Ed25519 JWT

---

## 🚀 部署

直接上传到任意 Web 服务器即可使用。

### 配置天气（可选）

注册[和风天气](https://dev.qweather.com)后，编辑 `api/config.php`：

```php
'kid' => '你的凭据ID',
'sub' => '你的项目ID',
'host' => '你的API主机地址',
