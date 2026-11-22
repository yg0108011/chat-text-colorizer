/**
 * Chat Text Colorizer for SillyTavern
 * 
 * 功能：
 * 1. 主文本 (main text) — 纯色 / 渐变 / 跟随主题，可选光晕
 * 2. 斜体文本 (italic text) — 按段落独立渐变，可选光晕
 * 3. 引用文本 (quote text) — 自动识别6种引号，按句子独立渐变，可选光晕
 * 
 * 内置 10 组「雨夜回响」预设配色
 * 渐变角度可调
 * 光晕强度可调（参考雨夜回响双 drop-shadow 逻辑）
 */

// ──────────────────────────────────────
// 0. 扩展注册
// ──────────────────────────────────────

const context = SillyTavern.getContext();
const { eventSource, event_types, saveSettingsDebounced, extension_settings } = context;

const EXT_NAME = 'third-party/chat-text-colorizer';

// ──────────────────────────────────────
// 1. 预设配色（从雨夜回响主题提取）
// ──────────────────────────────────────

const BUILTIN_PRESETS = [
    {
        name: '粉蓝-雨夜回响',
        gradientStart: '#ffb6c1',
        gradientMid:   '#ffffff',
        gradientEnd:   '#a8d8ff',
        glowColorA:    'rgba(255, 182, 193, 0.45)',
        glowColorB:    'rgba(168, 216, 255, 0.35)',
    },
    {
        name: '粉-雨夜回响',
        gradientStart: '#ff9bb2',
        gradientMid:   '#ffffff',
        gradientEnd:   '#ffdbe4',
        glowColorA:    'rgba(255, 155, 178, 0.45)',
        glowColorB:    'rgba(255, 219, 228, 0.35)',
    },
    {
        name: '黄橙-雨夜回响',
        gradientStart: '#f5c26b',
        gradientMid:   '#ffffff',
        gradientEnd:   '#ff9a3c',
        glowColorA:    'rgba(245, 194, 107, 0.45)',
        glowColorB:    'rgba(255, 154, 60, 0.35)',
    },
    {
        name: '金-雨夜回响',
        gradientStart: '#d4af37',
        gradientMid:   '#fdf6e2',
        gradientEnd:   '#e5cf76',
        glowColorA:    'rgba(212, 175, 55, 0.45)',
        glowColorB:    'rgba(229, 207, 118, 0.35)',
    },
    {
        name: '蓝黄-雨夜回响',
        gradientStart: '#8ecbff',
        gradientMid:   '#ffffff',
        gradientEnd:   '#ffe680',
        glowColorA:    'rgba(142, 203, 255, 0.45)',
        glowColorB:    'rgba(255, 230, 128, 0.35)',
    },
    {
        name: '蓝青-雨夜回响',
        gradientStart: '#4aa8ff',
        gradientMid:   '#ffffff',
        gradientEnd:   '#70F3FF',
        glowColorA:    'rgba(74, 168, 255, 0.45)',
        glowColorB:    'rgba(112, 243, 255, 0.35)',
    },
    {
        name: '蓝-雨夜回响',
        gradientStart: '#8faecb',
        gradientMid:   '#ffffff',
        gradientEnd:   '#d8e6f3',
        glowColorA:    'rgba(143, 174, 203, 0.45)',
        glowColorB:    'rgba(216, 230, 243, 0.35)',
    },
    {
        name: '青-雨夜回响',
        gradientStart: '#7fd8d8',
        gradientMid:   '#ffffff',
        gradientEnd:   '#c8f0f0',
        glowColorA:    'rgba(127, 216, 216, 0.45)',
        glowColorB:    'rgba(200, 240, 240, 0.35)',
    },
    {
        name: '银白-雨夜回响',
        gradientStart: '#c0c8d0',
        gradientMid:   '#ffffff',
        gradientEnd:   '#e8eef4',
        glowColorA:    'rgba(192, 200, 208, 0.45)',
        glowColorB:    'rgba(232, 238, 244, 0.35)',
    },
    {
        name: '紫-雨夜回响',
        gradientStart: '#b8a9d9',
        gradientMid:   '#ffffff',
        gradientEnd:   '#d8c8f0',
        glowColorA:    'rgba(184, 169, 217, 0.45)',
        glowColorB:    'rgba(216, 200, 240, 0.35)',
    },
];

// ──────────────────────────────────────
// 2. 默认设置
// ──────────────────────────────────────

const DEFAULT_SETTINGS = {
    // --- 主文本 ---
    mainMode: 'theme',           // 'theme' | 'solid' | 'gradient'
    mainSolidColor: '#ffffff',
    mainGradientStart: '#ffb6c1',
    mainGradientMid: '#ffffff',
    mainGradientEnd: '#a8d8ff',
    mainGradientAngle: 90,       // degrees (0=left-to-right)
    mainGlowEnabled: false,
    mainGlowIntensity: 50,       // 0-100
    mainGlowColorA: 'rgba(255, 182, 193, 0.45)',
    mainGlowColorB: 'rgba(168, 216, 255, 0.35)',

    // --- 斜体文本 ---
    italicMode: 'theme',         // 'theme' | 'solid' | 'gradient'
    italicSolidColor: '#ffffff',
    italicGradientStart: '#ffb6c1',
    italicGradientMid: '#ffffff',
    italicGradientEnd: '#a8d8ff',
    italicGradientAngle: 90,
    italicGlowEnabled: false,
    italicGlowIntensity: 50,
    italicGlowColorA: 'rgba(255, 182, 193, 0.45)',
    italicGlowColorB: 'rgba(168, 216, 255, 0.35)',

    // --- 引用文本 ---
    quoteMode: 'gradient',       // 'theme' | 'solid' | 'gradient'
    quoteSolidColor: '#ffffff',
    quoteGradientStart: '#ffb6c1',
    quoteGradientMid: '#ffffff',
    quoteGradientEnd: '#a8d8ff',
    quoteGradientAngle: 90,
    quoteGlowEnabled: true,
    quoteGlowIntensity: 50,
    quoteGlowColorA: 'rgba(255, 182, 193, 0.45)',
    quoteGlowColorB: 'rgba(168, 216, 255, 0.35)',

    // --- 全局 ---
    activePreset: '粉蓝-雨夜回响',
    enabled: true,
};

// ──────────────────────────────────────
// 3. 设置管理
// ──────────────────────────────────────

function loadSettings() {
    if (!extension_settings[EXT_NAME]) {
        extension_settings[EXT_NAME] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
    // 补全缺失字段（升级兼容）
    const stored = extension_settings[EXT_NAME];
    const defaults = DEFAULT_SETTINGS;
    for (const key of Object.keys(defaults)) {
        if (stored[key] === undefined) {
            stored[key] = defaults[key];
        }
    }
    return stored;
}

function getSettings() {
    return extension_settings[EXT_NAME] || loadSettings();
}

function saveSettings() {
    saveSettingsDebounced();
}

// ──────────────────────────────────────
// 4. CSS 动态注入系统
// ──────────────────────────────────────

let dynamicStyleEl = null;
const STYLE_ID = 'ctc-dynamic-styles';

function ensureStyleElement() {
    if (!dynamicStyleEl || !document.getElementById(STYLE_ID)) {
        // 移除旧元素
        const old = document.getElementById(STYLE_ID);
        if (old) old.remove();
        dynamicStyleEl = document.createElement('style');
        dynamicStyleEl.id = STYLE_ID;
        document.head.appendChild(dynamicStyleEl);
    }
    return dynamicStyleEl;
}

/**
 * 构建渐变 CSS background 值
 */
function buildGradientBg(start, mid, end, angle) {
    return `linear-gradient(${angle}deg, ${start}, ${mid}, ${end})`;
}

/**
 * 构建光晕 filter 值
 * 参考雨夜回响：双 drop-shadow
 * 强度映射：
 *   intensity 0   → opacity * 0.1, blur 1px/3px
 *   intensity 50  → opacity * 1.0, blur 3px/8px  (默认)
 *   intensity 100 → opacity * 2.0, blur 6px/16px
 */
function buildGlowFilter(colorA, colorB, intensity) {
    if (intensity <= 0) return 'none';
    const factor = intensity / 50; // 1.0 at default
    // 解析 rgba
    const parseRgba = (str) => {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (!m) return [255, 255, 255, 0.45];
        return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), parseFloat(m[4])];
    };
    const [r1, g1, b1, a1] = parseRgba(colorA);
    const [r2, g2, b2, a2] = parseRgba(colorB);

    const newA1 = Math.min(1, a1 * factor);
    const newA2 = Math.min(1, a2 * factor);
    const blur1 = Math.round(3 * factor);
    const blur2 = Math.round(8 * factor);

    return `drop-shadow(0 0 ${blur1}px rgba(${r1},${g1},${b1},${newA1.toFixed(2)})) drop-shadow(0 0 ${blur2}px rgba(${r2},${g2},${b2},${newA2.toFixed(2)})`;
}

/**
 * 生成完整的动态 CSS
 */
function generateCSS() {
    const s = getSettings();
    if (!s.enabled) {
        if (dynamicStyleEl) dynamicStyleEl.textContent = '';
        return;
    }

    const rules = [];

    // === 主文本 (.mes_text 内所有直接文本) ===
    if (s.mainMode === 'solid') {
        rules.push(`
            .mes_text, .mes_text * {
                color: ${s.mainSolidColor} !important;
                -webkit-text-fill-color: ${s.mainSolidColor} !important;
                background: none !important;
                filter: none !important;
            }
        `);
    } else if (s.mainMode === 'gradient') {
        const bg = buildGradientBg(s.mainGradientStart, s.mainGradientMid, s.mainGradientEnd, s.mainGradientAngle);
        const glow = s.mainGlowEnabled ? buildGlowFilter(s.mainGlowColorA, s.mainGlowColorB, s.mainGlowIntensity) : 'none';
        rules.push(`
            .mes_text, .mes_text * {
                background: ${bg} !important;
                -webkit-background-clip: text !important;
                background-clip: text !important;
                color: transparent !important;
                -webkit-text-fill-color: transparent !important;
                filter: ${glow} !important;
            }
            .mes_text .ctc-no-gradient, .mes_text .ctc-no-gradient * {
                background: none !important;
                -webkit-background-clip: unset !important;
                background-clip: unset !important;
                color: inherit !important;
                -webkit-text-fill-color: inherit !important;
                filter: none !important;
            }
        `);
    }
    // 'theme' mode: do nothing, let ST theme handle it

    // === 斜体文本 ===
    if (s.italicMode === 'solid') {
        rules.push(`
            .mes_text em, .mes_text i, .mes_text .ctc-italic {
                color: ${s.italicSolidColor} !important;
                -webkit-text-fill-color: ${s.italicSolidColor} !important;
                background: none !important;
                filter: none !important;
                font-style: italic !important;
            }
        `);
    } else if (s.italicMode === 'gradient') {
        const bg = buildGradientBg(s.italicGradientStart, s.italicGradientMid, s.italicGradientEnd, s.italicGradientAngle);
        const glow = s.italicGlowEnabled ? buildGlowFilter(s.italicGlowColorA, s.italicGlowColorB, s.italicGlowIntensity) : 'none';
        rules.push(`
            .mes_text em, .mes_text i, .mes_text .ctc-italic {
                background: ${bg} !important;
                -webkit-background-clip: text !important;
                background-clip: text !important;
                color: transparent !important;
                -webkit-text-fill-color: transparent !important;
                filter: ${glow} !important;
                font-style: italic !important;
            }
        `);
    }
    // 'theme' mode for italic: let ST handle

    // === 引用文本 (由 JS 动态包装的 span) ===
    if (s.quoteMode === 'solid') {
        rules.push(`
            .mes_text .ctc-quote {
                color: ${s.quoteSolidColor} !important;
                -webkit-text-fill-color: ${s.quoteSolidColor} !important;
                background: none !important;
                filter: none !important;
                font-weight: bold !important;
            }
        `);
    } else if (s.quoteMode === 'gradient') {
        const bg = buildGradientBg(s.quoteGradientStart, s.quoteGradientMid, s.quoteGradientEnd, s.quoteGradientAngle);
        const glow = s.quoteGlowEnabled ? buildGlowFilter(s.quoteGlowColorA, s.quoteGlowColorB, s.quoteGlowIntensity) : 'none';
        rules.push(`
            .mes_text .ctc-quote {
                background: ${bg} !important;
                -webkit-background-clip: text !important;
                background-clip: text !important;
                color: transparent !important;
                -webkit-text-fill-color: transparent !important;
                filter: ${glow} !important;
                font-weight: bold !important;
            }
        `);
    }
    // 'theme' mode for quote: let ST handle (but we still wrap for detection)

    // 确保引号标记本身也参与渲染
    rules.push(`
        .mes_text .ctc-quote .ctc-quote-mark {
            font-weight: bold !important;
        }
    `);

    const cssText = rules.join('\n');
    const el = ensureStyleElement();
    el.textContent = cssText;
}

// ──────────────────────────────────────
// 5. 引用文本检测与包装
// ──────────────────────────────────────

/**
 * 6 种引号对：
 *  1. 英文双引号 "…"
 *  2. 中文双引号 “…” (U+201C / U+201D)
 *  3. 直角引号 「…」 (U+300C / U+300D)
 *  4. 双直角引号 『…』 (U+300E / U+300F)
 *  5. 法语书名号 «…» (U+00AB / U+00BB)
 *  6. 全角双引号 ＂…＂ (U+FF02)
 */
const QUOTE_PAIRS = [
    { open: '"', close: '"', name: 'ascii_double' },
    { open: '\u201C', close: '\u201D', name: 'smart_double' },
    { open: '\u300C', close: '\u300D', name: 'corner' },
    { open: '\u300E', close: '\u300F', name: 'white_corner' },
    { open: '\u00AB', close: '\u00BB', name: 'guillemet' },
    { open: '\uFF02', close: '\uFF02', name: 'fullwidth_double' },
];

/**
 * 构建匹配所有引号对的正则
 * 每个引号对作为一个独立的匹配单元，
 * 内容为非贪婪匹配，排除嵌套的同类引号
 */
function buildQuoteRegex() {
    const patterns = QUOTE_PAIRS.map((pair) => {
        const o = escapeRegex(pair.open);
        const c = escapeRegex(pair.close);
        // 匹配：开引号 + 任意内容(非贪婪) + 闭引号
        return `${o}([^${c}]*)${c}`;
    });
    return new RegExp(patterns.join('|'), 'gu');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 全局正则（每次使用时重新编译以保证最新）
function getGlobalQuoteRegex() {
    return buildQuoteRegex();
}

/**
 * 判断节点或其祖先是否应跳过处理
 */
function shouldSkipNode(node) {
    let current = node;
    while (current && current !== document.body) {
        if (current.nodeType === Node.ELEMENT_NODE) {
            const el = current;
            // 跳过已处理过的
            if (el.classList && (el.classList.contains('ctc-quote') || el.classList.contains('ctc-processed'))) {
                return true;
            }
            // 跳过非消息正文区域
            if (el.classList && el.classList.contains('mes_reasoning')) return true;
            if (el.tagName === 'CODE' || el.tagName === 'PRE' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
                return true;
            }
            // 跳过输入区域等
            if (el.closest && (el.closest('#send_form') || el.closest('#nonQRFormItems'))) {
                return true;
            }
        }
        current = current.parentNode;
    }
    return false;
}

/**
 * 处理单个文本节点，将引号内容替换为带样式的 span
 * 返回替换次数
 */
function processQuoteTextNode(textNode) {
    if (shouldSkipNode(textNode)) return 0;
    const text = textNode.textContent;
    if (!text || text.trim().length === 0) return 0;

    const regex = getGlobalQuoteRegex();
    regex.lastIndex = 0;

    let match;
    const fragments = [];
    let lastIndex = 0;
    let count = 0;

    while ((match = regex.exec(text)) !== null) {
        count++;
        // 添加匹配前的文本
        if (match.index > lastIndex) {
            fragments.push(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        // 完整匹配文本（含引号）
        const fullMatch = match[0];
        const span = document.createElement('span');
        span.className = 'ctc-quote';
        span.setAttribute('data-ctc-quote', 'true');
        span.textContent = fullMatch;
        fragments.push(span);
        lastIndex = match.index + fullMatch.length;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
        fragments.push(document.createTextNode(text.slice(lastIndex)));
    }

    if (count > 0 && fragments.length > 0) {
        const parent = textNode.parentNode;
        if (parent) {
            for (const frag of fragments) {
                parent.insertBefore(frag, textNode);
            }
            parent.removeChild(textNode);
        }
    }
    return count;
}

/**
 * 处理消息元素内的所有文本节点
 */
function processQuoteTextInElement(rootEl) {
    if (!rootEl || shouldSkipNode(rootEl)) return 0;
    const walker = document.createTreeWalker(
        rootEl,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
                const text = node.textContent || '';
                if (text.trim().length === 0) return NodeFilter.FILTER_SKIP;
                // 快速检测是否包含任何引号字符
                for (const pair of QUOTE_PAIRS) {
                    if (text.includes(pair.open) && text.includes(pair.close)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
                return NodeFilter.FILTER_SKIP;
            },
        },
        false
    );

    // 先收集所有匹配的文本节点（因为处理过程中 DOM 会变化）
    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    let totalCount = 0;
    for (const node of textNodes) {
        // 再次检查节点是否仍在 DOM 中
        if (node.parentNode) {
            totalCount += processQuoteTextNode(node);
        }
    }
    return totalCount;
}

// ──────────────────────────────────────
// 6. 斜体段落梯度处理
// ──────────────────────────────────────

/**
 * 为消息中的斜体元素赋予段落级标识，
 * 同段落内的斜体共享梯度上下文
 */
function processItalicParagraphs(rootEl) {
    if (!rootEl) return;
    const italics = rootEl.querySelectorAll('em, i');
    if (italics.length === 0) return;

    // 按父段落分组
    const paragraphGroups = new Map();
    for (const el of italics) {
        if (shouldSkipNode(el)) continue;
        // 找到最近的块级父元素
        let blockParent = el.closest('p, div, .mes_text, blockquote, li, td, th');
        if (!blockParent) blockParent = rootEl;
        if (!paragraphGroups.has(blockParent)) {
            paragraphGroups.set(blockParent, []);
        }
        paragraphGroups.get(blockParent).push(el);
    }

    // 为每组添加段落级 class
    let paraIndex = 0;
    for (const [blockParent, els] of paragraphGroups) {
        paraIndex++;
        const paraClass = `ctc-italic-p${paraIndex}`;
        for (const el of els) {
            el.classList.add('ctc-italic', paraClass);
            el.setAttribute('data-ctc-para', String(paraIndex));
        }
    }
}

// ──────────────────────────────────────
// 7. 全面处理一条消息
// ──────────────────────────────────────

function processMessageElement(mesEl) {
    if (!mesEl) return;
    const settings = getSettings();
    if (!settings.enabled) return;

    // 查找消息正文容器
    const textEls = mesEl.querySelectorAll('.mes_text');
    for (const textEl of textEls) {
        // 先标记为已处理（避免重复）
        if (textEl.classList.contains('ctc-processed')) continue;
        textEl.classList.add('ctc-processed');

        // 处理引用文字
        if (settings.quoteMode !== 'theme') {
            processQuoteTextInElement(textEl);
        }
        // 处理斜体段落
        if (settings.italicMode !== 'theme') {
            processItalicParagraphs(textEl);
        }
    }
}

/**
 * 处理所有可见消息
 */
function processAllMessages() {
    const chatEl = document.getElementById('chat');
    if (!chatEl) return;
    const mesEls = chatEl.querySelectorAll('.mes');
    for (const mesEl of mesEls) {
        processMessageElement(mesEl);
    }
}

/**
 * 清除所有处理痕迹（重新处理前调用）
 */
function clearAllProcessing() {
    const chatEl = document.getElementById('chat');
    if (!chatEl) return;
    // 移除所有 ctc-quote span，还原文本
    const quoteSpans = chatEl.querySelectorAll('.ctc-quote');
    for (const span of quoteSpans) {
        const parent = span.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(span.textContent), span);
        }
    }
    // 移除 class 标记
    const processed = chatEl.querySelectorAll('.ctc-processed');
    for (const el of processed) {
        el.classList.remove('ctc-processed');
    }
    const italics = chatEl.querySelectorAll('.ctc-italic');
    for (const el of italics) {
        el.classList.remove('ctc-italic');
        // 移除 ctc-italic-p* class
        const classes = Array.from(el.classList);
        for (const cls of classes) {
            if (cls.startsWith('ctc-italic-p')) {
                el.classList.remove(cls);
            }
        }
        el.removeAttribute('data-ctc-para');
    }
}

/**
 * 完全重新处理
 */
function fullReprocess() {
    clearAllProcessing();
    generateCSS();
    processAllMessages();
}

// ──────────────────────────────────────
// 8. 消息侦听（MutationObserver）
// ──────────────────────────────────────

let observer = null;
let reprocessTimeout = null;

function startObserver() {
    if (observer) return;

    const chatEl = document.getElementById('chat');
    if (!chatEl) {
        // chat 尚未加载，稍后重试
        setTimeout(startObserver, 1000);
        return;
    }

    observer = new MutationObserver((mutations) => {
        let shouldReprocess = false;
        const settings = getSettings();
        if (!settings.enabled) return;

        for (const mutation of mutations) {
            // 新增节点
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList && node.classList.contains('mes')) {
                        processMessageElement(node);
                        shouldReprocess = true;
                    } else if (node.querySelectorAll) {
                        const mesEls = node.querySelectorAll('.mes');
                        for (const mesEl of mesEls) {
                            processMessageElement(mesEl);
                        }
                        if (mesEls.length > 0) shouldReprocess = true;
                    }
                    // 检查是否有新的 .mes_text
                    if (node.querySelectorAll && node.querySelectorAll('.mes_text').length > 0) {
                        shouldReprocess = true;
                    }
                }
            }
            // 字符数据变化（流式输出）
            if (mutation.type === 'characterData' && mutation.target.parentNode) {
                const textEl = mutation.target.parentNode.closest('.mes_text');
                if (textEl) {
                    shouldReprocess = true;
                }
            }
        }

        if (shouldReprocess) {
            // 防抖：流式输出时避免过快重复处理
            if (reprocessTimeout) clearTimeout(reprocessTimeout);
            reprocessTimeout = setTimeout(() => {
                fullReprocess();
            }, 400);
        }
    });

    observer.observe(chatEl, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: false,
    });
}

function stopObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (reprocessTimeout) {
        clearTimeout(reprocessTimeout);
        reprocessTimeout = null;
    }
}

// ──────────────────────────────────────
// 9. 事件处理
// ──────────────────────────────────────

function onChatChanged() {
    // 聊天切换时重新处理
    setTimeout(() => {
        clearAllProcessing();
        generateCSS();
        processAllMessages();
    }, 300);
}

function onMessageReceived() {
    // 新消息到达时 Observer 会处理，但做一个延迟全量检查
    setTimeout(() => {
        fullReprocess();
    }, 500);
}

function onMessageEdited() {
    setTimeout(() => {
        fullReprocess();
    }, 300);
}

function onMessageSwiped() {
    setTimeout(() => {
        fullReprocess();
    }, 300);
}

function onExtensionSettingsLoaded() {
    loadSettings();
    generateCSS();
    processAllMessages();
    startObserver();
}

// ──────────────────────────────────────
// 10. 设置 UI
// ──────────────────────────────────────

function buildSettingsHTML() {
    const s = getSettings();
    const presetsOptions = BUILTIN_PRESETS.map(p =>
        `<option value="${p.name}" ${s.activePreset === p.name ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    // 模式选项
    const modeOptions = (current, name) => `
        <option value="theme" ${current === 'theme' ? 'selected' : ''}>跟随酒馆主题</option>
        <option value="solid" ${current === 'solid' ? 'selected' : ''}>纯色</option>
        <option value="gradient" ${current === 'gradient' ? 'selected' : ''}>渐变</option>
    `;

    // 单个文本类型的设置面板
    const buildTypePanel = (type, label, icon) => {
        const mode = s[`${type}Mode`];
        const solidColor = s[`${type}SolidColor`] || '#ffffff';
        const gradStart = s[`${type}GradientStart`] || '#ffb6c1';
        const gradMid = s[`${type}GradientMid`] || '#ffffff';
        const gradEnd = s[`${type}GradientEnd`] || '#a8d8ff';
        const gradAngle = s[`${type}GradientAngle`] ?? 90;
        const glowEnabled = s[`${type}GlowEnabled`] ?? false;
        const glowIntensity = s[`${type}GlowIntensity`] ?? 50;

        return `
        <div class="ctc-type-panel" style="
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 12px;
            background: rgba(255,255,255,0.03);
        ">
            <h4 style="margin: 0 0 10px 0; font-size: 15px;">
                ${icon} ${label}
            </h4>

            <div style="margin-bottom: 8px;">
                <label style="display: inline-block; width: 80px;">模式：</label>
                <select class="ctc-sel" data-ctc-setting="${type}Mode"
                    style="width: 160px; padding: 3px 6px; background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px;">
                    ${modeOptions(mode, type)}
                </select>
            </div>

            <div class="ctc-solid-group ctc-${type}-solid" style="display: ${mode === 'solid' ? 'block' : 'none'}; margin-bottom: 8px;">
                <label style="display: inline-block; width: 80px;">纯色：</label>
                <input type="color" class="ctc-color" data-ctc-setting="${type}SolidColor"
                    value="${solidColor}"
                    style="width: 40px; height: 28px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer; vertical-align: middle;">
                <input type="text" class="ctc-color-text" data-ctc-setting="${type}SolidColor"
                    value="${solidColor}"
                    style="width: 80px; padding: 3px 6px; background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; margin-left: 4px;">
            </div>

            <div class="ctc-gradient-group ctc-${type}-gradient" style="display: ${mode === 'gradient' ? 'block' : 'none'};">
                <div style="margin-bottom: 6px;">
                    <label style="display: inline-block; width: 80px;">起始色：</label>
                    <input type="color" class="ctc-color" data-ctc-setting="${type}GradientStart"
                        value="${gradStart}"
                        style="width: 40px; height: 28px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer;">
                    <input type="text" class="ctc-color-text" data-ctc-setting="${type}GradientStart"
                        value="${gradStart}"
                        style="width: 80px; padding: 3px 6px; background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; margin-left: 4px;">
                </div>
                <div style="margin-bottom: 6px;">
                    <label style="display: inline-block; width: 80px;">中间色：</label>
                    <input type="color" class="ctc-color" data-ctc-setting="${type}GradientMid"
                        value="${gradMid}"
                        style="width: 40px; height: 28px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer;">
                    <input type="text" class="ctc-color-text" data-ctc-setting="${type}GradientMid"
                        value="${gradMid}"
                        style="width: 80px; padding: 3px 6px; background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; margin-left: 4px;">
                </div>
                <div style="margin-bottom: 6px;">
                    <label style="display: inline-block; width: 80px;">结束色：</label>
                    <input type="color" class="ctc-color" data-ctc-setting="${type}GradientEnd"
                        value="${gradEnd}"
                        style="width: 40px; height: 28px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer;">
                    <input type="text" class="ctc-color-text" data-ctc-setting="${type}GradientEnd"
                        value="${gradEnd}"
                        style="width: 80px; padding: 3px 6px; background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; margin-left: 4px;">
                </div>
                <div style="margin-bottom: 8px;">
                    <label style="display: inline-block; width: 80px;">渐变角度：</label>
                    <input type="range" class="ctc-range" data-ctc-setting="${type}GradientAngle"
                        value="${gradAngle}" min="0" max="360" step="15"
                        style="width: 140px; vertical-align: middle;">
                    <span class="ctc-angle-val" style="margin-left: 6px; font-size: 12px;">${gradAngle}°</span>
                </div>
                <div style="margin-bottom: 6px;">
                    <label style="display: inline-block; width: 80px;">光晕：</label>
                    <input type="checkbox" class="ctc-check" data-ctc-setting="${type}GlowEnabled"
                        ${glowEnabled ? 'checked' : ''}
                        style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                    <span style="font-size: 12px;">启用</span>
                </div>
                <div class="ctc-glow-intensity" style="display: ${glowEnabled ? 'block' : 'none'}; margin-bottom: 4px;">
                    <label style="display: inline-block; width: 80px;">光晕强度：</label>
                    <input type="range" class="ctc-range" data-ctc-setting="${type}GlowIntensity"
                        value="${glowIntensity}" min="0" max="100" step="5"
                        style="width: 140px; vertical-align: middle;">
                    <span class="ctc-intensity-val" style="margin-left: 6px; font-size: 12px;">${glowIntensity}%</span>
                </div>
            </div>
        </div>`;
    };

    const html = `
    <div class="ctc-settings-container" style="
        padding: 12px;
        color: #e0e0e0;
        font-size: 13px;
        max-width: 600px;
    ">
        <div style="
            background: linear-gradient(135deg, rgba(255,182,193,0.15), rgba(168,216,255,0.15));
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 16px;
        ">
            <h3 style="margin: 0 0 6px 0; font-size: 18px;">
                🎨 聊天文字调色
            </h3>
            <p style="margin: 0; opacity: 0.7; font-size: 12px;">
                仅对酒馆聊天消息生效 · 支持主文本 / 斜体 / 引用独立调色
            </p>
        </div>

        <!-- 启用开关 -->
        <div style="margin-bottom: 14px; display: flex; align-items: center; gap: 10px;">
            <label style="font-weight: bold;">启用扩展：</label>
            <input type="checkbox" class="ctc-check" data-ctc-setting="enabled"
                ${s.enabled ? 'checked' : ''}
                style="width: 18px; height: 18px; vertical-align: middle;">
        </div>

        <!-- 预设选择 -->
        <div style="margin-bottom: 16px;">
            <label style="display: inline-block; width: 80px; font-weight: bold;">预设配色：</label>
            <select class="ctc-sel" data-ctc-setting="activePreset"
                style="width: 220px; padding: 5px 8px; background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px;">
                ${presetsOptions}
            </select>
            <button class="ctc-btn-apply-preset" style="
                margin-left: 8px;
                padding: 5px 14px;
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">应用预设到全部</button>
        </div>

        <!-- 预览渐变条 -->
        <div class="ctc-preview-bar" style="
            height: 6px;
            border-radius: 3px;
            margin-bottom: 16px;
            background: linear-gradient(90deg, ${s.quoteGradientStart}, ${s.quoteGradientMid}, ${s.quoteGradientEnd});
            border: 1px solid rgba(255,255,255,0.2);
        "></div>

        <!-- 三个调色面板 -->
        ${buildTypePanel('main', '正文文本', '📝')}
        ${buildTypePanel('italic', '斜体文本', '💬')}
        ${buildTypePanel('quote', '引用文本', '✨')}

        <!-- 图例 -->
        <div style="
            margin-top: 14px;
            padding: 10px;
            background: rgba(0,0,0,0.3);
            border-radius: 6px;
            font-size: 11px;
            opacity: 0.7;
            line-height: 1.6;
        ">
            <strong>📖 引用文本支持的引号类型：</strong><br>
            英文 <code>""</code> · 中文 <code>“”</code> · <code>「」</code> · <code>『』</code> · <code>«»</code> · 全角 <code>＂＂</code><br>
            <strong>斜体梯度：</strong>按段落独立渲染 &nbsp;|&nbsp; <strong>引用梯度：</strong>按句子独立渲染<br>
            <strong>光晕逻辑：</strong>采用雨夜回响双 <code>drop-shadow</code> 方案（小半径+大半径）
        </div>

        <!-- 操作按钮 -->
        <div style="margin-top: 16px; display: flex; gap: 10px;">
            <button class="ctc-btn-reset" style="
                padding: 6px 16px;
                background: rgba(255,80,80,0.2);
                color: #ff8888;
                border: 1px solid rgba(255,80,80,0.4);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">恢复默认设置</button>
            <button class="ctc-btn-refresh" style="
                padding: 6px 16px;
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">🔄 刷新聊天样式</button>
        </div>
    </div>`;

    return html;
}

/**
 * 将预设应用到所有设置字段
 */
function applyPresetToAll(presetName) {
    const preset = BUILTIN_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    const s = getSettings();
    s.activePreset = presetName;

    // 应用到主文本
    s.mainGradientStart = preset.gradientStart;
    s.mainGradientMid = preset.gradientMid;
    s.mainGradientEnd = preset.gradientEnd;
    s.mainGlowColorA = adjustGlowAlpha(preset.glowColorA, 0.45);
    s.mainGlowColorB = adjustGlowAlpha(preset.glowColorB, 0.35);

    // 应用到斜体
    s.italicGradientStart = preset.gradientStart;
    s.italicGradientMid = preset.gradientMid;
    s.italicGradientEnd = preset.gradientEnd;
    s.italicGlowColorA = adjustGlowAlpha(preset.glowColorA, 0.45);
    s.italicGlowColorB = adjustGlowAlpha(preset.glowColorB, 0.35);

    // 应用到引用
    s.quoteGradientStart = preset.gradientStart;
    s.quoteGradientMid = preset.gradientMid;
    s.quoteGradientEnd = preset.gradientEnd;
    s.quoteGlowColorA = adjustGlowAlpha(preset.glowColorA, 0.45);
    s.quoteGlowColorB = adjustGlowAlpha(preset.glowColorB, 0.35);

    // 所有模式设为 gradient
    s.mainMode = 'gradient';
    s.italicMode = 'gradient';
    s.quoteMode = 'gradient';

    // 启用光晕
    s.mainGlowEnabled = true;
    s.italicGlowEnabled = true;
    s.quoteGlowEnabled = true;

    saveSettings();
}

function adjustGlowAlpha(rgbaStr, targetAlpha) {
    const m = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!m) return rgbaStr;
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${targetAlpha})`;
}

/**
 * 挂载设置 UI 到 ST 扩展设置面板
 */
function mountSettingsUI() {
    // 获取扩展设置容器
    const container = document.getElementById('extensions_settings');
    if (!container) {
        setTimeout(mountSettingsUI, 500);
        return;
    }

    // 查找我们的设置区块
    const existing = document.getElementById('ctc-settings-root');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.id = 'ctc-settings-root';
    root.innerHTML = buildSettingsHTML();

    // 将设置 UI 追加到扩展设置区域
    // ST 的扩展设置通常在 #extensions_settings 内的 .inline-drawer-content 中
    const targetArea = container.querySelector('.inline-drawer-content') || container;
    if (targetArea) {
        targetArea.appendChild(root);
    }

    // 绑定事件
    bindSettingsEvents(root);
}

function bindSettingsEvents(root) {
    // 所有设置控件变化
    root.querySelectorAll('.ctc-sel, .ctc-range, .ctc-check').forEach(el => {
        el.addEventListener('input', () => {
            const settingKey = el.getAttribute('data-ctc-setting');
            if (!settingKey) return;
            const s = getSettings();
            if (el.type === 'checkbox') {
                s[settingKey] = el.checked;
            } else if (el.type === 'range') {
                s[settingKey] = parseInt(el.value);
            } else {
                s[settingKey] = el.value;
            }
            saveSettings();
            fullReprocess();
            refreshSettingsUI(root);
        });
    });

    // color inputs
    root.querySelectorAll('.ctc-color').forEach(el => {
        el.addEventListener('input', () => {
            const settingKey = el.getAttribute('data-ctc-setting');
            if (!settingKey) return;
            const s = getSettings();
            s[settingKey] = el.value;
            saveSettings();
            fullReprocess();
            // 同步文本输入框
            const textInput = root.querySelector(`input[type="text"][data-ctc-setting="${settingKey}"]`);
            if (textInput) textInput.value = el.value;
            updatePreviewBar(root);
        });
    });

    // color text inputs
    root.querySelectorAll('.ctc-color-text').forEach(el => {
        el.addEventListener('change', () => {
            const settingKey = el.getAttribute('data-ctc-setting');
            if (!settingKey) return;
            let val = el.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                const s = getSettings();
                s[settingKey] = val;
                saveSettings();
                fullReprocess();
                // 同步 color input
                const colorInput = root.querySelector(`input[type="color"][data-ctc-setting="${settingKey}"]`);
                if (colorInput) colorInput.value = val;
                updatePreviewBar(root);
            }
        });
    });

    // 模式选择
    root.querySelectorAll('.ctc-sel[data-ctc-setting$="Mode"]').forEach(el => {
        el.addEventListener('change', () => {
            const settingKey = el.getAttribute('data-ctc-setting');
            if (!settingKey) return;
            const s = getSettings();
            s[settingKey] = el.value;
            saveSettings();
            fullReprocess();
            refreshSettingsUI(root);
        });
    });

    // 光晕开关
    root.querySelectorAll('.ctc-check[data-ctc-setting$="GlowEnabled"]').forEach(el => {
        el.addEventListener('change', () => {
            const settingKey = el.getAttribute('data-ctc-setting');
            if (!settingKey) return;
            const s = getSettings();
            s[settingKey] = el.checked;
            saveSettings();
            fullReprocess();
            refreshSettingsUI(root);
        });
    });

    // 角度范围
    root.querySelectorAll('.ctc-range[data-ctc-setting$="GradientAngle"]').forEach(el => {
        el.addEventListener('input', () => {
            const val = el.value;
            const display = el.parentElement.querySelector('.ctc-angle-val');
            if (display) display.textContent = val + '°';
        });
    });

    // 强度范围
    root.querySelectorAll('.ctc-range[data-ctc-setting$="GlowIntensity"]').forEach(el => {
        el.addEventListener('input', () => {
            const val = el.value;
            const display = el.parentElement.querySelector('.ctc-intensity-val');
            if (display) display.textContent = val + '%';
        });
    });

    // 启用开关
    const enableCheck = root.querySelector('.ctc-check[data-ctc-setting="enabled"]');
    if (enableCheck) {
        enableCheck.addEventListener('change', () => {
            const s = getSettings();
            s.enabled = enableCheck.checked;
            saveSettings();
            if (s.enabled) {
                generateCSS();
                processAllMessages();
                startObserver();
            } else {
                if (dynamicStyleEl) dynamicStyleEl.textContent = '';
                clearAllProcessing();
                stopObserver();
            }
            refreshSettingsUI(root);
        });
    }

    // 预设应用按钮
    const applyBtn = root.querySelector('.ctc-btn-apply-preset');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const sel = root.querySelector('.ctc-sel[data-ctc-setting="activePreset"]');
            if (sel) {
                applyPresetToAll(sel.value);
                fullReprocess();
                refreshSettingsUI(root);
            }
        });
    }

    // 重置按钮
    const resetBtn = root.querySelector('.ctc-btn-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('确定恢复默认设置？当前设置将丢失。')) {
                extension_settings[EXT_NAME] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
                saveSettings();
                fullReprocess();
                refreshSettingsUI(root);
                // 完全重建 UI
                mountSettingsUI();
            }
        });
    }

    // 刷新按钮
    const refreshBtn = root.querySelector('.ctc-btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fullReprocess();
        });
    }
}

function refreshSettingsUI(root) {
    const s = getSettings();
    // 更新 solid/gradient 分组显示
    ['main', 'italic', 'quote'].forEach(type => {
        const mode = s[`${type}Mode`];
        const solidGroup = root.querySelector(`.ctc-${type}-solid`);
        const gradGroup = root.querySelector(`.ctc-${type}-gradient`);
        if (solidGroup) solidGroup.style.display = mode === 'solid' ? 'block' : 'none';
        if (gradGroup) gradGroup.style.display = mode === 'gradient' ? 'block' : 'none';

        // 光晕强度滑块
        const glowCheck = root.querySelector(`.ctc-check[data-ctc-setting="${type}GlowEnabled"]`);
        const glowIntensity = root.querySelector(`.ctc-glow-intensity`);
        if (glowCheck && glowIntensity) {
            glowIntensity.style.display = glowCheck.checked ? 'block' : 'none';
        }
    });

    // 更新启用状态视觉
    const enableCheck = root.querySelector('.ctc-check[data-ctc-setting="enabled"]');
    const panels = root.querySelectorAll('.ctc-type-panel');
    if (enableCheck && panels.length > 0) {
        const opacity = enableCheck.checked ? '1' : '0.4';
        panels.forEach(p => { p.style.opacity = opacity; p.style.pointerEvents = enableCheck.checked ? 'auto' : 'none'; });
    }

    updatePreviewBar(root);
}

function updatePreviewBar(root) {
    const s = getSettings();
    const bar = root.querySelector('.ctc-preview-bar');
    if (bar) {
        bar.style.background = `linear-gradient(90deg, ${s.quoteGradientStart}, ${s.quoteGradientMid}, ${s.quoteGradientEnd})`;
    }
}

// ──────────────────────────────────────
// 11. 替换 ST 原生扩展设置渲染（挂载 UI）
// ──────────────────────────────────────

function setupSettingsHook() {
    // 监听扩展设置面板打开
    eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, () => {
        setTimeout(mountSettingsUI, 200);
    });

    // 初始挂载尝试
    setTimeout(mountSettingsUI, 1000);
    setTimeout(mountSettingsUI, 3000);
    setTimeout(mountSettingsUI, 6000);
}

// ──────────────────────────────────────
// 12. 启动与事件注册
// ──────────────────────────────────────

function init() {
    loadSettings();
    const s = getSettings();

    if (s.enabled) {
        generateCSS();
        // 等待 DOM 就绪后处理
        setTimeout(() => {
            processAllMessages();
            startObserver();
        }, 500);
    }

    // 事件监听
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.MESSAGE_EDITED, onMessageEdited);
    eventSource.on(event_types.MESSAGE_SWIPED, onMessageSwiped);

    // 设置面板
    setupSettingsHook();

    console.log('[ChatTextColorizer] ✅ 扩展已加载');
}

// 启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ──────────────────────────────────────
// 13. 导出 API（供控制台调试）
// ──────────────────────────────────────

window.ChatTextColorizer = {
    getSettings,
    saveSettings,
    fullReprocess,
    clearAllProcessing,
    generateCSS,
    applyPresetToAll,
    BUILTIN_PRESETS,
    reload: () => {
        fullReprocess();
        mountSettingsUI();
    },
};
