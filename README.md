# 🎨 Chat Text Colorizer for SillyTavern

酒馆（SillyTavern）聊天消息文字颜色自定义扩展 —— 让每一条消息的字体色彩随你心意。

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📝 **主文本调色** | 设置聊天正文的颜色：跟随主题 / 纯色 / 渐变 |
| 💬 **斜体文本调色** | 按**段落**独立渐变，每段斜体拥有自己的渐变循环 |
| ✨ **引用文本调色** | 按**句子**独立渐变，自动识别 6 种引号并渲染引号+内容 |

### 六种引号类型

| 类型 | 示例 |
|------|------|
| 英文双引号 | `"text"` |
| 中文双引号 | `“text”` (U+201C/U+201D) |
| 直角引号 | `「text」` |
| 双直角引号 | `『text』` |
| 法语书名号 | `«text»` |
| 全角双引号 | `＂text＂` |

### 每种文本类型独立支持

- ✅ **跟随酒馆主题** — 完全交给 ST 主题处理
- ✅ **纯色模式** — 任意自定义颜色
- ✅ **渐变模式** — 三色渐变 + 可调角度 (0°~360°)
- ✅ **光晕开关** — 独立启停 + 强度滑块 (0~100%)
- ✅ **10 组内建预设** — 全部来自「雨夜回响」系列主题

## 🎨 雨夜回响预设配色

| 预设名 | 渐变方向 | 起始色 | 中间色 | 结束色 |
|--------|----------|--------|--------|--------|
| 粉蓝-雨夜回响 | → | `#ffb6c1` | `#ffffff` | `#a8d8ff` |
| 粉-雨夜回响 | → | `#ff9bb2` | `#ffffff` | `#ffdbe4` |
| 黄橙-雨夜回响 | → | `#f5c26b` | `#ffffff` | `#ff9a3c` |
| 金-雨夜回响 | → | `#d4af37` | `#fdf6e2` | `#e5cf76` |
| 蓝黄-雨夜回响 | → | `#8ecbff` | `#ffffff` | `#ffe680` |
| 蓝青-雨夜回响 | → | `#4aa8ff` | `#ffffff` | `#70F3FF` |
| 蓝-雨夜回响 | → | `#8faecb` | `#ffffff` | `#d8e6f3` |
| 青-雨夜回响 | → | `#7fd8d8` | `#ffffff` | `#c8f0f0` |
| 银白-雨夜回响 | → | `#c0c8d0` | `#ffffff` | `#e8eef4` |
| 紫-雨夜回响 | → | `#b8a9d9` | `#ffffff` | `#d8c8f0` |

## 📦 安装

### 方法一：手动安装

1. 在 SillyTavern 目录下进入 `public/scripts/extensions/third-party/`
2. 创建文件夹 `chat-text-colorizer`
3. 将 `manifest.json` 和 `index.js` 放入该文件夹
4. 重启 SillyTavern 或在扩展面板点击「重新加载扩展」

### 方法二：Git Clone

```bash
cd public/scripts/extensions/third-party/
git clone https://github.com/your-username/chat-text-colorizer.git
