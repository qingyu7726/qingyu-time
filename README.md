<div align="center">

# 🕐 庆余时间

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

**一个简洁优雅的全屏时钟网页应用** ✨

[🌐 在线体验](https://time.qingyu.ink)

</div>

## ✨ 功能

- 🕐 **全屏时钟** — 大字体时间显示，12/24小时切换，实时更新
- 🌤️ **实时天气** — GPS/IP定位，7天预报，基于和风天气 API
- ⏱️ **番茄钟** — 专注/休息计时模式
- 🌍 **世界时钟** — 多城市时间查看
- 📅 **日期计算器** — 日期差计算、纪念日倒计时
- 🎨 **自定义** — 背景主题、自定义背景图、名言警句
- 📦 **PWA 支持** — 可添加到主屏幕

## 🛠️ 技术栈

HTML5 · CSS3 · JavaScript (ES6+) · 和风天气 API · PHP · PWA

## 🚀 部署

直接上传到任意 Web 服务器即可使用。

### 配置天气（可选）

注册[和风天气](https://dev.qweather.com)后，编辑 `api/config.php`：

```php
'kid' => '你的凭据ID',
'sub' => '你的项目ID',
'host' => '你的API主机地址',
