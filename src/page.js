const 值页面 = `<!DOCTYPE html>
    <html lang="${语言值}" dir="${是否值236 ? 'rtl' : 'ltr'}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${翻译值.title}</title>
        <style>
            :root {
                --cp-bg: #05030e;
                --cp-bg-2: #0a0820;
                --cp-bg-3: #110835;
                --cp-cyan: #00f0ff;
                --cp-cyan-d: #00b8c4;
                --cp-pink: #ff2bd6;
                --cp-pink-d: #d1239f;
                --cp-purple: #a347ff;
                --cp-yellow: #fff200;
                --cp-mint: #00ff9d;
                --cp-amber: #ffb400;
                --cp-red: #ff3860;
                --cp-text: #e6f5ff;
                --cp-text-dim: #7aa9c4;
                --cp-border: rgba(0, 240, 255, 0.55);
                --cp-border-pink: rgba(255, 43, 214, 0.55);
                --cp-grid: rgba(255, 43, 214, 0.16);
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { min-height: 100%; }
            body {
                font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
                background: radial-gradient(ellipse at 80% -10%, #2a0040 0%, var(--cp-bg) 50%, #000 100%);
                color: var(--cp-text);
                min-height: 100vh;
                overflow-x: hidden;
                position: relative;
            }
            body::before {
                content: ""; position: fixed; inset: 0;
                background-image:
                    linear-gradient(var(--cp-grid) 1px, transparent 1px),
                    linear-gradient(90deg, var(--cp-grid) 1px, transparent 1px);
                background-size: 48px 48px;
                mask-image: radial-gradient(ellipse at center, #000 30%, transparent 85%);
                z-index: -3;
                animation: cp-grid-slide 22s linear infinite;
                pointer-events: none;
            }
            body::after {
                content: ""; position: fixed; inset: 0;
                background: repeating-linear-gradient(
                    180deg,
                    rgba(255,255,255,0.035) 0,
                    rgba(255,255,255,0.035) 1px,
                    transparent 1px,
                    transparent 3px
                );
                pointer-events: none;
                z-index: 6;
                mix-blend-mode: overlay;
                animation: cp-scan-flicker 6s infinite;
            }
            @keyframes cp-grid-slide {
                0% { background-position: 0 0, 0 0; }
                100% { background-position: 48px 48px, 48px 48px; }
            }
            @keyframes cp-scan-flicker {
                0%, 100% { opacity: 0.55; }
                50% { opacity: 0.85; }
            }
            .matrix-bg {
                position: fixed; inset: 0;
                background:
                    radial-gradient(circle at 85% 15%, rgba(255,43,214,0.18) 0%, transparent 45%),
                    radial-gradient(circle at 10% 85%, rgba(0,240,255,0.18) 0%, transparent 45%),
                    radial-gradient(circle at 55% 50%, rgba(163,71,255,0.10) 0%, transparent 60%);
                z-index: -2;
                pointer-events: none;
            }
            .matrix-rain { display: none; }
            .matrix-code-rain {
                position: fixed; inset: 0;
                pointer-events: none; z-index: -1;
                overflow: hidden;
            }
            .matrix-column {
                position: absolute; top: -120%; left: 0;
                color: var(--cp-cyan);
                font-family: "JetBrains Mono", "Courier New", monospace;
                font-size: 14px; line-height: 1.25;
                text-shadow: 0 0 6px var(--cp-cyan), 0 0 12px rgba(0,240,255,0.5);
                animation: cp-drop linear infinite;
            }
            @keyframes cp-drop {
                0%   { top: -120%; opacity: 0; }
                10%  { opacity: 0.85; }
                90%  { opacity: 0.4; }
                100% { top: 110vh; opacity: 0; }
            }
            .matrix-column:nth-child(odd)  { animation-duration: 12s; }
            .matrix-column:nth-child(even) { animation-duration: 18s; color: var(--cp-pink); text-shadow: 0 0 6px var(--cp-pink), 0 0 14px rgba(255,43,214,0.5); }
            .matrix-column:nth-child(3n)   { animation-duration: 20s; color: var(--cp-purple); text-shadow: 0 0 6px var(--cp-purple); }
            .matrix-column:nth-child(5n)   { animation-duration: 9s; opacity: 0.6; }

            ::selection { background: var(--cp-pink); color: var(--cp-bg); }

            .container {
                max-width: 1180px;
                margin: 0 auto;
                padding: 110px 24px 60px;
                position: relative;
                z-index: 1;
            }
            .header {
                text-align: center;
                margin-bottom: 36px;
                padding: 28px 24px;
                position: relative;
                border: 1px solid var(--cp-border);
                background: linear-gradient(135deg, rgba(15,3,40,0.6), rgba(40,5,70,0.45));
                clip-path: polygon(
                    0 14px, 14px 0,
                    calc(100% - 80px) 0, calc(100% - 60px) 14px,
                    100% 14px, 100% calc(100% - 14px),
                    calc(100% - 14px) 100%, 80px 100%,
                    60px calc(100% - 14px), 0 calc(100% - 14px)
                );
                box-shadow: 0 0 30px rgba(0,240,255,0.25), 0 0 60px rgba(255,43,214,0.18);
            }
            .header::before {
                content: "// SYS_ID / CFNEW / NIGHTCITY.NET";
                position: absolute; top: 8px; left: 24px;
                font-size: 10px; letter-spacing: 0.35em;
                color: var(--cp-pink);
                text-shadow: 0 0 6px var(--cp-pink);
            }
            .header::after {
                content: "STATUS // ONLINE";
                position: absolute; top: 8px; right: 24px;
                font-size: 10px; letter-spacing: 0.35em;
                color: var(--cp-mint);
                text-shadow: 0 0 6px var(--cp-mint);
            }
            .title {
                font-size: clamp(2.2rem, 5vw, 3.4rem);
                font-weight: 800;
                margin: 14px 0 8px;
                color: var(--cp-cyan);
                letter-spacing: 0.08em;
                text-transform: uppercase;
                text-shadow:
                    0 0 12px var(--cp-cyan),
                    0 0 28px rgba(0,240,255,0.5),
                    -2px 0 var(--cp-pink),
                    2px 0 var(--cp-mint);
                position: relative;
                animation: cp-title-flicker 6s infinite;
            }
            @keyframes cp-title-flicker {
                0%, 92%, 100% { opacity: 1; }
                94%, 96% { opacity: 0.65; }
            }
            .subtitle {
                color: var(--cp-text-dim);
                margin-bottom: 0;
                font-size: 0.95rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
            }
            .subtitle::before { content: "▸ "; color: var(--cp-pink); }

            .card {
                background:
                    linear-gradient(180deg, rgba(8,4,28,0.85) 0%, rgba(15,3,40,0.78) 100%);
                border: 1px solid var(--cp-border);
                border-radius: 0;
                padding: 26px 28px 28px;
                margin-bottom: 22px;
                position: relative;
                backdrop-filter: blur(8px);
                width: 100%;
                box-shadow:
                    0 0 0 1px rgba(255,43,214,0.18),
                    0 0 22px rgba(0,240,255,0.18),
                    0 0 60px rgba(255,43,214,0.06),
                    inset 0 0 24px rgba(0,240,255,0.05);
                clip-path: polygon(
                    0 16px, 16px 0,
                    calc(100% - 56px) 0, calc(100% - 40px) 16px,
                    100% 16px, 100% calc(100% - 14px),
                    calc(100% - 14px) 100%, 40px 100%,
                    24px calc(100% - 14px), 0 calc(100% - 14px)
                );
            }
            .card::after {
                content: ""; position: absolute; top: 0; left: 0; right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, var(--cp-pink), var(--cp-cyan), transparent);
                opacity: 0.7;
            }
            .card-title {
                font-size: 1.1rem;
                margin: 0 0 20px;
                color: var(--cp-cyan);
                letter-spacing: 0.25em;
                text-transform: uppercase;
                text-shadow: 0 0 8px var(--cp-cyan);
                display: flex; align-items: center; gap: 12px;
                font-weight: 700;
            }
            .card-title::before {
                content: ""; display: inline-block;
                width: 14px; height: 14px;
                background: var(--cp-pink);
                box-shadow: 0 0 10px var(--cp-pink);
                transform: rotate(45deg);
            }
            .card-title::after {
                content: ""; flex: 1; height: 1px;
                background: linear-gradient(90deg, var(--cp-cyan), transparent);
                margin-left: 6px;
            }
            h3, h4 {
                color: var(--cp-cyan);
                letter-spacing: 0.18em;
                text-transform: uppercase;
                text-shadow: 0 0 6px var(--cp-cyan);
                font-weight: 700;
            }

            .client-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 14px;
                margin: 12px 0 18px;
            }
            .client-btn {
                background: linear-gradient(135deg, rgba(0,240,255,0.08), rgba(255,43,214,0.08));
                border: 1px solid var(--cp-border);
                padding: 14px 18px;
                color: var(--cp-cyan);
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                position: relative;
                overflow: hidden;
                text-shadow: 0 0 6px var(--cp-cyan);
                clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
            }
            .client-btn::before {
                content: ""; position: absolute; inset: 0; left: -100%;
                background: linear-gradient(90deg, transparent, rgba(0,240,255,0.35), transparent);
                transition: left 0.6s ease;
            }
            .client-btn:hover::before { left: 100%; }
            .client-btn:hover {
                color: var(--cp-pink);
                border-color: var(--cp-pink);
                background: linear-gradient(135deg, rgba(255,43,214,0.18), rgba(0,240,255,0.10));
                box-shadow: 0 0 14px rgba(255,43,214,0.55), 0 0 28px rgba(0,240,255,0.30);
                transform: translateY(-2px);
                text-shadow: 0 0 8px var(--cp-pink);
            }

            #clientSubscriptionUrl,
            .subscription-url,
            [class*='subscription-url'],
            [class*='c3Vic2NyaXB0aW9u'] {
                background: rgba(0,0,0,0.7) !important;
                border: 1px dashed var(--cp-pink) !important;
                padding: 14px 16px !important;
                word-break: break-all;
                font-family: inherit;
                color: var(--cp-mint) !important;
                margin-top: 18px;
                box-shadow: inset 0 0 12px rgba(255,43,214,0.18), 0 0 18px rgba(0,255,157,0.18) !important;
                position: relative;
                overflow-wrap: break-word;
                overflow-x: auto;
                max-width: 100%;
                font-size: 0.85rem;
                line-height: 1.6;
                text-shadow: 0 0 6px var(--cp-mint);
            }
            #clientSubscriptionUrl:empty { display: none !important; }

            .cp-hud {
                position: fixed; top: 18px; right: 22px;
                color: var(--cp-cyan);
                font-family: "JetBrains Mono", monospace;
                font-size: 11px; letter-spacing: 0.2em;
                text-transform: uppercase;
                text-align: right;
                opacity: 0.85;
                z-index: 1000;
            }
            .cp-hud .cp-hud-label { color: var(--cp-pink); }
            .cp-hud .cp-hud-line { display: block; }
            .cp-lang-wrapper {
                position: fixed; top: 18px; left: 22px; z-index: 1000;
                display: flex; align-items: center; gap: 10px;
            }
            .cp-lang-tag {
                color: var(--cp-pink); font-size: 11px;
                letter-spacing: 0.25em; text-transform: uppercase;
                text-shadow: 0 0 6px var(--cp-pink);
            }
            #languageSelector {
                background: rgba(8,4,28,0.85);
                border: 1px solid var(--cp-cyan);
                color: var(--cp-cyan);
                padding: 6px 12px;
                font-family: inherit;
                font-size: 12px;
                cursor: pointer;
                letter-spacing: 0.12em;
                text-shadow: 0 0 6px var(--cp-cyan);
                box-shadow: 0 0 12px rgba(0,240,255,0.35);
                clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
            }
            #languageSelector option { background: var(--cp-bg-2); color: var(--cp-cyan); }

            /* FX toggle - 页面特效图形化开关 */
            .cp-fx-toggle {
                position: fixed; top: 68px; left: 22px; z-index: 1001;
                background: rgba(8,4,28,0.85);
                border: 1px solid var(--cp-mint);
                color: var(--cp-mint);
                padding: 6px 12px;
                font-family: inherit;
                font-size: 11px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                cursor: pointer;
                text-shadow: 0 0 6px var(--cp-mint);
                box-shadow: 0 0 10px rgba(0,255,157,0.35);
                clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
                transition: all 0.2s ease;
                display: inline-flex; align-items: center; gap: 6px;
            }
            .cp-fx-toggle:hover {
                color: var(--cp-pink);
                border-color: var(--cp-pink);
                text-shadow: 0 0 8px var(--cp-pink);
                box-shadow: 0 0 16px rgba(255,43,214,0.55);
            }
            .cp-fx-toggle .cp-fx-dot {
                width: 6px; height: 6px;
                background: var(--cp-mint);
                border-radius: 50%;
                box-shadow: 0 0 8px var(--cp-mint);
                transition: all 0.2s;
            }
            body.fx-off .cp-fx-toggle {
                color: var(--cp-text-dim);
                border-color: var(--cp-text-dim);
                text-shadow: none;
                box-shadow: none;
            }
            body.fx-off .cp-fx-toggle .cp-fx-dot {
                background: transparent;
                border: 1px solid var(--cp-text-dim);
                box-shadow: none;
            }
            /* FX OFF: 关闭所有装饰性特效，保留布局和配色 */
            body.fx-off .matrix-bg,
            body.fx-off .matrix-code-rain,
            body.fx-off .matrix-column { display: none !important; }
            body.fx-off::before,
            body.fx-off::after { display: none !important; content: none !important; }
            body.fx-off { background: var(--cp-bg) !important; }
            body.fx-off * {
                animation: none !important;
                transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s !important;
            }
            body.fx-off .cp-glitch::before,
            body.fx-off .cp-glitch::after { display: none !important; }
            body.fx-off .terminal-cursor::after,
            body.fx-off .cp-fab-save .cp-fab-dot { animation: none !important; }
            body.fx-off .cp-fab-save:hover { transform: none !important; }
            body.fx-off .cp-action-bar.cp-dirty::before { animation: none !important; }
            body.fx-off .header::before { display: none !important; }
            body.fx-off .card { backdrop-filter: none !important; }
            body.fx-off select, body.fx-off input, body.fx-off textarea { backdrop-filter: none !important; }

            /* Status panel inside card */
            #systemStatus {
                background: linear-gradient(135deg, rgba(0,240,255,0.05), rgba(255,43,214,0.05)) !important;
                border: 1px solid var(--cp-border) !important;
                padding: 18px 20px !important;
                margin: 14px 0 0 !important;
                box-shadow: inset 0 0 16px rgba(0,240,255,0.12) !important;
                position: relative;
                clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
            }
            #systemStatus > div {
                color: var(--cp-text) !important;
                text-shadow: none !important;
                font-family: inherit !important;
                margin: 6px 0 !important;
                font-size: 0.85rem !important;
                letter-spacing: 0.05em;
            }
            #systemStatus > div:first-child {
                color: var(--cp-pink) !important;
                font-weight: 700 !important;
                letter-spacing: 0.25em !important;
                text-shadow: 0 0 6px var(--cp-pink) !important;
                margin-bottom: 14px !important;
                text-transform: uppercase;
            }

            /* Force inputs / selects to cyberpunk */
            input[type="text"], input[type="number"], input[type="password"],
            select, textarea {
                background: rgba(0,0,0,0.6) !important;
                border: 1px solid var(--cp-border) !important;
                color: var(--cp-cyan) !important;
                font-family: inherit !important;
                font-size: 13px !important;
                padding: 10px 12px !important;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
                box-shadow: inset 0 0 8px rgba(0,240,255,0.08) !important;
                letter-spacing: 0.04em;
            }
            input::placeholder { color: var(--cp-text-dim) !important; opacity: 0.7; }
            input:focus, select:focus, textarea:focus {
                border-color: var(--cp-pink) !important;
                box-shadow: 0 0 0 1px var(--cp-pink), 0 0 14px rgba(255,43,214,0.4) !important;
            }
            select option { background: var(--cp-bg-2); color: var(--cp-cyan); }
            input[type="checkbox"], input[type="radio"] {
                accent-color: var(--cp-pink);
            }

            label {
                color: var(--cp-cyan) !important;
                letter-spacing: 0.05em;
                text-shadow: 0 0 4px rgba(0,240,255,0.4);
            }
            label[style*="font-weight"], label[style*="bold"] {
                font-weight: 700 !important;
                color: var(--cp-pink) !important;
                text-shadow: 0 0 6px var(--cp-pink) !important;
                letter-spacing: 0.15em !important;
                text-transform: uppercase;
                font-size: 0.78rem !important;
            }
            small {
                color: var(--cp-text-dim) !important;
                font-size: 0.78rem !important;
                letter-spacing: 0.04em;
                line-height: 1.5;
            }

            /* Buttons inside forms - global override */
            button, input[type="submit"] {
                background: linear-gradient(135deg, rgba(0,240,255,0.15), rgba(255,43,214,0.15)) !important;
                border: 1px solid var(--cp-border) !important;
                color: var(--cp-cyan) !important;
                font-family: inherit !important;
                font-weight: 700 !important;
                cursor: pointer;
                padding: 10px 18px !important;
                letter-spacing: 0.18em !important;
                text-transform: uppercase;
                font-size: 0.78rem !important;
                text-shadow: 0 0 6px var(--cp-cyan) !important;
                transition: all 0.25s ease;
                clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
                box-shadow: 0 0 10px rgba(0,240,255,0.25);
            }
            button:hover, input[type="submit"]:hover {
                color: var(--cp-pink) !important;
                border-color: var(--cp-pink) !important;
                box-shadow: 0 0 16px rgba(255,43,214,0.45), 0 0 32px rgba(0,240,255,0.20) !important;
                transform: translateY(-1px);
                text-shadow: 0 0 8px var(--cp-pink) !important;
            }
            button[id*="Reset"], button[onclick*="reset"], button[style*="ff0000"] {
                color: var(--cp-red) !important;
                border-color: var(--cp-red) !important;
                text-shadow: 0 0 6px var(--cp-red) !important;
                background: linear-gradient(135deg, rgba(255,56,96,0.15), rgba(255,43,214,0.10)) !important;
            }
            button[id*="Reset"]:hover, button[onclick*="reset"]:hover, button[style*="ff0000"]:hover {
                box-shadow: 0 0 16px rgba(255,56,96,0.5) !important;
            }
            button[id="stopLatencyTest"] {
                color: var(--cp-red) !important;
                border-color: var(--cp-red) !important;
            }

            /* Form sub-cards */
            .card form > div[style*="background: rgba(15, 3, 40"],
            .card form > div[style*="background: rgba(20, 5, 50"],
            div[style*="background: rgba(15, 3, 40"],
            div[style*="background: rgba(20, 5, 50"] {
                background: linear-gradient(135deg, rgba(0,240,255,0.04), rgba(255,43,214,0.04)) !important;
                border: 1px solid var(--cp-border-pink) !important;
                box-shadow: inset 0 0 12px rgba(255,43,214,0.06) !important;
                border-radius: 0 !important;
            }

            /* kvStatus / statusMessage / currentConfig / pathTypeInfo */
            #kvStatus, #statusMessage, #currentConfig, #pathTypeInfo {
                background: rgba(0,0,0,0.55) !important;
                border: 1px solid var(--cp-border) !important;
                color: var(--cp-cyan) !important;
                font-family: inherit !important;
                box-shadow: inset 0 0 10px rgba(0,240,255,0.10) !important;
                padding: 12px 14px !important;
                font-size: 0.85rem !important;
                letter-spacing: 0.04em;
            }
            #pathTypeInfo div:first-child {
                color: var(--cp-pink) !important;
                text-shadow: 0 0 6px var(--cp-pink) !important;
                letter-spacing: 0.2em !important;
            }

            /* Latency Result list */
            #latencyResultsList {
                background: rgba(0,0,0,0.5) !important;
                border: 1px solid var(--cp-border) !important;
            }
            #latencyResultsList > div {
                border-bottom: 1px dashed rgba(0,240,255,0.18) !important;
            }
            #cityFilterContainer {
                background: rgba(0,0,0,0.55) !important;
                border: 1px solid var(--cp-border-pink) !important;
            }

            /* Related links area */
            .card a {
                color: var(--cp-cyan) !important;
                text-decoration: none;
                text-shadow: 0 0 6px var(--cp-cyan);
                letter-spacing: 0.15em;
                text-transform: uppercase;
                font-size: 0.85rem;
                padding: 4px 0;
                border-bottom: 1px dashed transparent;
                transition: all 0.25s;
            }
            .card a:hover {
                color: var(--cp-pink) !important;
                border-bottom-color: var(--cp-pink);
                text-shadow: 0 0 8px var(--cp-pink);
            }

            /* Scrollbars */
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: rgba(0,0,0,0.4); }
            ::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, var(--cp-pink), var(--cp-cyan));
            }

            .cp-glitch {
                position: relative;
                display: inline-block;
            }

            /* Floating action dock - bottom-right anchored FAB cluster */
            .cp-action-bar {
                position: fixed;
                right: 22px;
                bottom: 22px;
                z-index: 99999;
                isolation: isolate;
                display: flex;
                flex-direction: row-reverse;
                align-items: center;
                gap: 10px;
                padding: 0;
                background: transparent;
                border: 0;
                box-shadow: none;
                max-width: calc(100vw - 32px);
                pointer-events: auto;
            }
            /* Primary SAVE FAB - large, magenta, pulses when dirty */
            .cp-fab-save {
                position: relative;
                min-width: 188px;
                padding: 16px 26px !important;
                font-size: 0.92rem !important;
                font-weight: 800 !important;
                letter-spacing: 0.22em !important;
                text-transform: uppercase;
                color: var(--cp-pink) !important;
                background:
                    linear-gradient(135deg, rgba(255,43,214,0.45) 0%, rgba(0,240,255,0.25) 100%) !important;
                border: 2px solid var(--cp-pink) !important;
                text-shadow: 0 0 10px var(--cp-pink) !important;
                box-shadow:
                    0 0 0 1px rgba(0,240,255,0.4),
                    0 0 24px rgba(255,43,214,0.7),
                    0 0 48px rgba(255,43,214,0.35),
                    inset 0 0 18px rgba(255,43,214,0.25) !important;
                clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
                cursor: pointer;
                transition: transform 0.18s ease, box-shadow 0.25s ease;
                display: inline-flex; align-items: center; gap: 10px;
                white-space: nowrap;
                font-family: inherit !important;
                animation: cp-fab-breathe 3.4s ease-in-out infinite;
            }
            @keyframes cp-fab-breathe {
                0%, 100% {
                    box-shadow:
                        0 0 0 1px rgba(0,240,255,0.4),
                        0 0 24px rgba(255,43,214,0.7),
                        0 0 48px rgba(255,43,214,0.35),
                        inset 0 0 18px rgba(255,43,214,0.25);
                }
                50% {
                    box-shadow:
                        0 0 0 1px rgba(0,240,255,0.55),
                        0 0 32px rgba(255,43,214,0.9),
                        0 0 80px rgba(255,43,214,0.45),
                        inset 0 0 24px rgba(255,43,214,0.4);
                }
            }
            .cp-fab-save:hover {
                transform: translateY(-3px) scale(1.03);
                color: #fff !important;
                text-shadow: 0 0 14px #fff, 0 0 22px var(--cp-pink) !important;
            }
            .cp-fab-save .cp-fab-icon {
                font-size: 1.15em;
                line-height: 1;
                color: var(--cp-cyan);
                text-shadow: 0 0 10px var(--cp-cyan);
            }
            .cp-fab-save .cp-fab-dot {
                width: 8px; height: 8px;
                background: var(--cp-mint);
                box-shadow: 0 0 8px var(--cp-mint);
                transform: rotate(45deg);
                margin-left: 4px;
                opacity: 0.5;
                transition: all 0.2s;
            }
            .cp-action-bar.cp-dirty .cp-fab-save {
                animation: cp-fab-dirty 1.1s ease-in-out infinite;
                color: #fff !important;
            }
            .cp-action-bar.cp-dirty .cp-fab-save .cp-fab-dot {
                background: var(--cp-pink);
                box-shadow: 0 0 12px var(--cp-pink), 0 0 24px var(--cp-pink);
                opacity: 1;
            }
            @keyframes cp-fab-dirty {
                0%, 100% {
                    box-shadow:
                        0 0 0 1px var(--cp-pink),
                        0 0 24px rgba(255,43,214,0.85),
                        0 0 60px rgba(255,43,214,0.5),
                        inset 0 0 22px rgba(255,43,214,0.45);
                    transform: scale(1);
                }
                50% {
                    box-shadow:
                        0 0 0 2px var(--cp-pink),
                        0 0 40px rgba(255,43,214,1),
                        0 0 100px rgba(255,43,214,0.7),
                        inset 0 0 30px rgba(255,43,214,0.6);
                    transform: scale(1.04);
                }
            }
            /* Secondary mini buttons - icon-first */
            .cp-action-btn {
                background: rgba(8,4,28,0.85) !important;
                border: 1px solid var(--cp-border) !important;
                color: var(--cp-cyan) !important;
                font-family: inherit !important;
                font-weight: 700 !important;
                cursor: pointer;
                width: 46px; height: 46px;
                padding: 0 !important;
                letter-spacing: 0 !important;
                font-size: 1.05rem !important;
                text-shadow: 0 0 6px var(--cp-cyan) !important;
                transition: all 0.25s ease;
                clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
                box-shadow: 0 0 10px rgba(0,240,255,0.35);
                display: inline-flex; align-items: center; justify-content: center;
                white-space: nowrap;
                position: relative;
            }
            .cp-action-btn .cp-btn-label { display: none; }
            .cp-action-btn::after {
                content: attr(data-tip);
                position: absolute;
                bottom: 100%; right: 50%;
                transform: translate(50%, -8px);
                background: rgba(8,4,28,0.95);
                color: var(--cp-cyan);
                font-size: 10px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                padding: 5px 9px;
                border: 1px solid var(--cp-border);
                opacity: 0; pointer-events: none;
                transition: opacity 0.2s;
                white-space: nowrap;
                text-shadow: 0 0 5px var(--cp-cyan);
                box-shadow: 0 0 10px rgba(0,240,255,0.4);
            }
            .cp-action-btn:hover::after { opacity: 1; }
            .cp-action-btn:hover {
                color: var(--cp-pink) !important;
                border-color: var(--cp-pink) !important;
                box-shadow: 0 0 16px rgba(255,43,214,0.55) !important;
                transform: translateY(-2px);
                text-shadow: 0 0 8px var(--cp-pink) !important;
            }
            .cp-action-btn-danger {
                color: var(--cp-red) !important;
                border-color: var(--cp-red) !important;
                text-shadow: 0 0 6px var(--cp-red) !important;
                box-shadow: 0 0 10px rgba(255,56,96,0.45) !important;
            }
            .cp-action-btn-danger:hover {
                color: #fff !important;
                box-shadow: 0 0 20px rgba(255,56,96,0.85) !important;
                transform: translateY(-2px);
            }
            .cp-action-btn-saving,
            .cp-fab-save.cp-action-btn-saving {
                opacity: 0.7;
                pointer-events: none;
                animation: cp-pulse-pink 0.9s ease-in-out infinite !important;
            }
            @keyframes cp-pulse-pink {
                0%, 100% { box-shadow: 0 0 12px rgba(255,43,214,0.45); }
                50%      { box-shadow: 0 0 36px rgba(255,43,214,0.95); }
            }
            .container { padding-bottom: 130px; }
            .cp-action-status {
                position: fixed;
                right: 22px;
                bottom: 86px;
                z-index: 99998;
                padding: 9px 16px;
                background: rgba(8,4,28,0.95);
                border: 1px solid var(--cp-mint);
                color: var(--cp-mint);
                font-size: 0.78rem;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                text-shadow: 0 0 6px var(--cp-mint);
                box-shadow: 0 0 14px rgba(0,255,157,0.45);
                clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
                opacity: 0;
                transform: translateY(8px);
                transition: opacity 0.25s, transform 0.25s;
                pointer-events: none;
                white-space: nowrap;
                max-width: calc(100vw - 44px);
                overflow: hidden; text-overflow: ellipsis;
            }
            .cp-action-status.cp-show { opacity: 1; transform: translateY(0); }
            .cp-action-status.cp-err {
                border-color: var(--cp-red);
                color: var(--cp-red);
                text-shadow: 0 0 6px var(--cp-red);
                box-shadow: 0 0 14px rgba(255,56,96,0.55);
            }
            /* Toast notification stack (top-right) */
            .cp-toast-stack {
                position: fixed;
                top: 88px;
                right: 22px;
                z-index: 100000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: min(420px, calc(100vw - 32px));
                pointer-events: none;
            }
            .cp-toast {
                position: relative;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 16px 12px 14px;
                background: linear-gradient(135deg, rgba(8,4,28,0.96) 0%, rgba(20,5,50,0.92) 100%);
                border: 1px solid var(--cp-mint);
                color: var(--cp-mint);
                font-size: 0.82rem;
                line-height: 1.45;
                letter-spacing: 0.06em;
                text-shadow: 0 0 6px var(--cp-mint);
                box-shadow:
                    0 0 0 1px rgba(0,255,157,0.25),
                    0 0 18px rgba(0,255,157,0.45),
                    0 8px 28px rgba(0,0,0,0.55);
                backdrop-filter: blur(8px);
                clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
                transform: translateX(120%);
                opacity: 0;
                transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s;
                pointer-events: auto;
                overflow: hidden;
                word-break: break-all;
            }
            .cp-toast.cp-show { transform: translateX(0); opacity: 1; }
            .cp-toast.cp-hide { transform: translateX(120%); opacity: 0; }
            .cp-toast::before {
                content: "";
                position: absolute;
                left: 0; top: 0; bottom: 0;
                width: 3px;
                background: var(--cp-mint);
                box-shadow: 0 0 10px var(--cp-mint);
            }
            .cp-toast-icon {
                font-size: 1.1rem;
                line-height: 1;
                margin-top: 1px;
                flex-shrink: 0;
                color: var(--cp-mint);
                text-shadow: 0 0 8px var(--cp-mint);
            }
            .cp-toast-body { flex: 1; min-width: 0; }
            .cp-toast-title {
                font-size: 0.72rem;
                font-weight: 800;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                opacity: 0.85;
                margin-bottom: 2px;
            }
            .cp-toast-msg { white-space: pre-wrap; }
            .cp-toast-close {
                position: absolute;
                top: 6px; right: 8px;
                background: transparent;
                border: 0;
                color: inherit;
                font-size: 14px;
                cursor: pointer;
                opacity: 0.55;
                padding: 2px 4px;
                line-height: 1;
                transition: opacity 0.2s;
            }
            .cp-toast-close:hover { opacity: 1; }
            .cp-toast::after {
                content: "";
                position: absolute;
                left: 0; bottom: 0;
                height: 2px;
                width: 100%;
                background: linear-gradient(90deg, var(--cp-mint), transparent);
                box-shadow: 0 0 6px var(--cp-mint);
                transform-origin: left;
                animation: cp-toast-bar var(--cp-toast-dur, 3200ms) linear forwards;
            }
            @keyframes cp-toast-bar {
                from { transform: scaleX(1); }
                to   { transform: scaleX(0); }
            }
            .cp-toast.cp-toast-success { border-color: var(--cp-mint); color: var(--cp-mint); text-shadow: 0 0 6px var(--cp-mint); }
            .cp-toast.cp-toast-success::before,
            .cp-toast.cp-toast-success::after { background: var(--cp-mint); box-shadow: 0 0 10px var(--cp-mint); }
            .cp-toast.cp-toast-success .cp-toast-icon { color: var(--cp-mint); text-shadow: 0 0 8px var(--cp-mint); }
            .cp-toast.cp-toast-info { border-color: var(--cp-cyan); color: var(--cp-cyan); text-shadow: 0 0 6px var(--cp-cyan); box-shadow: 0 0 0 1px rgba(0,240,255,0.25), 0 0 18px rgba(0,240,255,0.45), 0 8px 28px rgba(0,0,0,0.55); }
            .cp-toast.cp-toast-info::before,
            .cp-toast.cp-toast-info::after { background: var(--cp-cyan); box-shadow: 0 0 10px var(--cp-cyan); }
            .cp-toast.cp-toast-info .cp-toast-icon { color: var(--cp-cyan); text-shadow: 0 0 8px var(--cp-cyan); }
            .cp-toast.cp-toast-warn { border-color: var(--cp-amber); color: var(--cp-amber); text-shadow: 0 0 6px var(--cp-amber); box-shadow: 0 0 0 1px rgba(255,176,46,0.25), 0 0 18px rgba(255,176,46,0.45), 0 8px 28px rgba(0,0,0,0.55); }
            .cp-toast.cp-toast-warn::before,
            .cp-toast.cp-toast-warn::after { background: var(--cp-amber); box-shadow: 0 0 10px var(--cp-amber); }
            .cp-toast.cp-toast-warn .cp-toast-icon { color: var(--cp-amber); text-shadow: 0 0 8px var(--cp-amber); }
            .cp-toast.cp-toast-error { border-color: var(--cp-red); color: var(--cp-red); text-shadow: 0 0 6px var(--cp-red); box-shadow: 0 0 0 1px rgba(255,56,96,0.30), 0 0 18px rgba(255,56,96,0.55), 0 8px 28px rgba(0,0,0,0.55); }
            .cp-toast.cp-toast-error::before,
            .cp-toast.cp-toast-error::after { background: var(--cp-red); box-shadow: 0 0 10px var(--cp-red); }
            .cp-toast.cp-toast-error .cp-toast-icon { color: var(--cp-red); text-shadow: 0 0 8px var(--cp-red); }

            /* Tiny floating "unsaved" badge on the FAB */
            .cp-action-bar.cp-dirty::before {
                content: "● UNSAVED";
                position: absolute;
                top: -22px; right: 6px;
                font-size: 9px;
                letter-spacing: 0.3em;
                color: var(--cp-pink);
                text-shadow: 0 0 6px var(--cp-pink);
                background: rgba(8,4,28,0.92);
                padding: 3px 8px;
                border: 1px solid var(--cp-pink);
                box-shadow: 0 0 10px rgba(255,43,214,0.6);
                animation: cp-pulse-pink 1.6s ease-in-out infinite;
            }

            @media (max-width: 720px) {
                .container { padding: 100px 14px 140px; }
                .card { padding: 22px 18px; }
                .header { padding: 22px 18px; }
                .title { font-size: 2rem; }
                .cp-hud { font-size: 9px; }
                .cp-action-bar {
                    right: 50%;
                    bottom: 14px;
                    transform: translateX(50%);
                    gap: 8px;
                }
                .cp-fab-save {
                    min-width: 0;
                    padding: 13px 18px !important;
                    font-size: 0.8rem !important;
                    letter-spacing: 0.16em !important;
                }
                .cp-action-btn { width: 42px; height: 42px; }
                .cp-action-status { right: 50%; transform: translate(50%, 8px); }
                .cp-action-status.cp-show { transform: translate(50%, 0); }
            }
        </style>
    </head>
    <body>
        <div class="matrix-bg"></div>
        <div class="matrix-code-rain" id="matrixCodeRain"></div>
            <div class="cp-hud">
                <span class="cp-hud-line"><span class="cp-hud-label">SYS::</span> ${翻译值.terminal}</span>
                <span class="cp-hud-line"><span class="cp-hud-label">NODE::</span> NIGHT_CITY</span>
                <span class="cp-hud-line"><span class="cp-hud-label">LINK::</span> SECURE / ENC</span>
            </div>
            <div class="cp-lang-wrapper">
                <span class="cp-lang-tag">LANG_</span>
                <select id="languageSelector" onchange="切换语言(this.value)">
                    <option value="zh" ${!是否值236 ? 'selected' : ''}>🇨🇳 中文</option>
                    <option value="fa" ${是否值236 ? 'selected' : ''}>🇮🇷 فارسی</option>
                </select>
            </div>
            <button type="button" id="cpFxToggle" class="cp-fx-toggle" onclick="window.切换页面特效()" title="${是否值236 ? 'تغییر افکت‌های صفحه' : '切换页面特效'}" aria-label="FX toggle">
                <span class="cp-fx-dot" aria-hidden="true"></span>
                <span id="cpFxLabel">FX: ON</span>
            </button>
        <div class="container">
            <div class="header">
                    <h1 class="title cp-glitch" data-text="${翻译值.title}">${翻译值.title}</h1>
                    <p class="subtitle">${翻译值.subtitle}</p>
            </div>
            <div class="card">
                    <h2 class="card-title">${翻译值.selectClient}</h2>
                <div class="client-grid">
                    <button class="client-btn" onclick="生成客户端链接(atob('Y2xhc2g='), 'CLASH')">CLASH</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('Y2xhc2g='), 'STASH')">STASH</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('c3VyZ2U='), 'SURGE')">SURGE</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('c2luZ2JveA=='), 'SING-BOX')">SING-BOX</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('bG9vbg=='), 'LOON')">LOON</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('cXVhbng='), 'QUANTUMULT X')">QUANTUMULT X</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('djJyYXk='), 'V2RAY')">V2RAY</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('djJyYXk='), 'V2RAYNG')">V2RAYNG</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('djJyYXk='), 'NEKORAY')">NEKORAY</button>
                    <button class="client-btn" onclick="生成客户端链接(atob('djJyYXk='), 'Shadowrocket')">Shadowrocket</button>
                    <button class="client-btn" id="jkClientBtn" style="${启用家宽链式 ? '' : 'display: none;'}" onclick="生成客户端链接('vg', '${翻译值.jkClient}')">${翻译值.jkClient}</button>
                    <button class="client-btn" id="pvlClientBtn" style="${启用公共节点 ? '' : 'display: none;'}" onclick="生成客户端链接('pvl', '${翻译值.pvlClient}')">${翻译值.pvlClient}</button>
                    <button class="client-btn" id="pvlUriClientBtn" style="${启用公共节点 ? '' : 'display: none;'}" onclick="生成客户端链接('pvluri', '${翻译值.pvlUriClient}')">${翻译值.pvlUriClient}</button>
                    <button class="client-btn" id="pvlBoxClientBtn" style="${启用公共节点 ? '' : 'display: none;'}" onclick="生成客户端链接('pvlsb', '${翻译值.pvlBoxClient}')">${翻译值.pvlBoxClient}</button>
                </div>
                <div class="subscription-url" id="clientSubscriptionUrl"></div>
            </div>
            <div class="card">
                    <h2 class="card-title">${翻译值.systemStatus}</h2>
                <div id="systemStatus" style="margin: 20px 0; padding: 15px; background: rgba(8, 4, 28, 0.8); border: 2px solid #00f0ff; box-shadow: 0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 15px rgba(0, 240, 255, 0.1); position: relative; overflow: hidden;">
                        <div style="color: #00f0ff; margin-bottom: 15px; font-weight: bold; text-shadow: 0 0 5px #00f0ff;">[ ${翻译值.checking} ]</div>
                        <div id="regionStatus" style="margin: 8px 0; color: #00f0ff; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00f0ff;">${翻译值.workerRegion}${翻译值.checking}</div>
                        <div id="geoInfo" style="margin: 8px 0; color: #7aa9c4; font-family: 'Courier New', monospace; font-size: 0.9rem; text-shadow: 0 0 3px #7aa9c4;">${翻译值.detectionMethod}${翻译值.checking}</div>
                        <div id="backupStatus" style="margin: 8px 0; color: #00f0ff; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00f0ff;">${翻译值.proxyIPStatus}${翻译值.checking}</div>
                        <div id="currentIP" style="margin: 8px 0; color: #00f0ff; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00f0ff;">${翻译值.currentIP}${翻译值.checking}</div>
                        <div id="echStatus" style="margin: 8px 0; color: #00f0ff; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00f0ff; font-size: 0.9rem;">ECH状态: ${翻译值.checking}</div>
                        <div id="regionMatch" style="margin: 8px 0; color: #00f0ff; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00f0ff;">${翻译值.regionMatch}${翻译值.checking}</div>
                        <div id="selectionLogic" style="margin: 8px 0; color: #7aa9c4; font-family: 'Courier New', monospace; font-size: 0.9rem; text-shadow: 0 0 3px #7aa9c4;">${翻译值.selectionLogic}${翻译值.selectionLogicText}</div>
                </div>
            </div>
            <div class="card" id="configCard" style="display: none;">
                    <h2 class="card-title">${翻译值.configManagement}</h2>
                <div id="kvStatus" style="margin-bottom: 20px; padding: 10px; background: rgba(8, 4, 28, 0.8); border: 1px solid #00f0ff; color: #00f0ff;">
                    ${翻译值.kvStatusChecking}
                </div>
                <div id="configContent" style="display: none;">
                    <form id="regionForm" style="margin-bottom: 20px;">
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.specifyRegion}</label>
                            <select id="wkRegion" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                    <option value="">${翻译值.autoDetect}</option>
                                    <option value="HK">${翻译值.regionNames.HK}</option>
                                    <option value="US">${翻译值.regionNames.US}</option>
                                    <option value="SG">${翻译值.regionNames.SG}</option>
                                    <option value="JP">${翻译值.regionNames.JP}</option>
                                    <option value="KR">${翻译值.regionNames.KR}</option>
                                    <option value="DE">${翻译值.regionNames.DE}</option>
                                    <option value="SE">${翻译值.regionNames.SE}</option>
                                    <option value="NL">${翻译值.regionNames.NL}</option>
                                    <option value="FI">${翻译值.regionNames.FI}</option>
                                    <option value="GB">${翻译值.regionNames.GB}</option>
                            </select>
                                <small id="wkRegionHint" style="color: #7aa9c4; font-size: 0.85rem; display: none;">⚠️ ${翻译值.customIPDisabledHint}</small>
                        </div>
                    </form>
                    <form id="otherConfigForm" style="margin-bottom: 20px;">
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.protocolSelection}</label>
                            <div style="padding: 15px; background: rgba(15, 3, 40, 0.6); border: 1px solid #00f0ff; border-radius: 5px;">
                                <div style="margin-bottom: 10px;">
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="ev" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1.1rem;">${翻译值.enableProtoV}</span>
                                    </label>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="et" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1.1rem;">${翻译值.enableProtoT}</span>
                                    </label>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="ex" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1.1rem;">${翻译值.enableXhttp}</span>
                                    </label>
                                </div>
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0, 240, 255, 0.3);">
                                    <div style="margin-bottom: 10px;">
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                            <input type="checkbox" id="ech" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                                <span style="font-size: 1.1rem;">${翻译值.enableECH}</span>
                                        </label>
                                        <small style="color: #7aa9c4; font-size: 0.8rem; display: block; margin-top: 5px; margin-left: 26px;">${翻译值.enableECHHint}</small>
                                    </div>
                                    <div style="margin-top: 15px; margin-bottom: 10px;">
                                        <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-size: 0.95rem;">${翻译值.customDNS}</label>
                                        <input type="text" id="customDNS" placeholder="${翻译值.customDNSPlaceholder}" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                        <small style="color: #7aa9c4; font-size: 0.8rem; display: block; margin-top: 5px;">${翻译值.customDNSHint}</small>
                                    </div>
                                    <div style="margin-bottom: 10px;">
                                        <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-size: 0.95rem;">${翻译值.customECHDomain}</label>
                                        <input type="text" id="customECHDomain" placeholder="${翻译值.customECHDomainPlaceholder}" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                        <small style="color: #7aa9c4; font-size: 0.8rem; display: block; margin-top: 5px;">${翻译值.customECHDomainHint}</small>
                                    </div>
                                    <div style="margin-bottom: 10px;">
                                        <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-size: 0.95rem;">${翻译值.alpn}</label>
                                        <select id="alpn" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                            <option value="">${翻译值.alpnDefault}</option>
                                            <option value="h3">h3</option>
                                            <option value="h2">h2</option>
                                            <option value="http/1.1">http/1.1</option>
                                            <option value="h3,h2">h3,h2</option>
                                            <option value="h2,http/1.1">h2,http/1.1</option>
                                            <option value="h3,h2,http/1.1">h3,h2,http/1.1</option>
                                        </select>
                                        <small style="color: #7aa9c4; font-size: 0.8rem; display: block; margin-top: 5px;">${翻译值.alpnHint}</small>
                                    </div>
                                </div>
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0, 240, 255, 0.3);">
                                        <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-size: 0.95rem;">${翻译值.altPassword}</label>
                                        <input type="text" id="tp" placeholder="${翻译值.altPasswordPlaceholder}" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                        <small style="color: #7aa9c4; font-size: 0.8rem; display: block; margin-top: 5px;">${翻译值.altPasswordHint}</small>
                                </div>
                                    <small style="color: #7aa9c4; font-size: 0.85rem; display: block; margin-top: 10px;">${翻译值.protocolHint}</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.customHomepage}</label>
                                <input type="text" id="customHomepage" placeholder="${翻译值.customHomepagePlaceholder}" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${翻译值.customHomepageHint}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.customPath}</label>
                                <input type="text" id="customPath" placeholder="${是否值236 ? 'مثال: /mypath یا خالی بگذارید تا از UUID استفاده شود' : '例如: /mypath 或留空使用 UUID'}" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${是否值236 ? 解码64('2YXYs9uM2LEg2KfYtNiq2LHYp9qpINiz2YHYp9ix2LTbjC4g2Kfar9ixINiu2KfZhNuMINio2q/YsNin2LHbjNivINin2LIgVVVJRCDYqNmHINi52YbZiNin2YYg2YXYs9uM2LEg2KfYs9iq2YHYp9iv2Ycg2YXbjOKAjNi02YjYry4=') : 解码64('6Ieq5a6a5LmJ6K6i6ZiF6Lev5b6E44CC55WZ56m65YiZ5L2/55SoIFVVSUQg5L2c5Li66Lev5b6E44CC')}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.customIP}</label>
                                <input type="text" id="customIP" placeholder="${是否值236 ? 'مثال: 1.2.3.4:443' : '例如: 1.2.3.4:443'}" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${是否值236 ? 解码64('2KLYr9ix2LMg2Ygg2b7ZiNix2KogUHJveHlJUCDYs9mB2KfYsdi024w=') : 解码64('6Ieq5a6a5LmJUHJveHlJUOWcsOWdgOWSjOerr+WPow==')}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.preferredIPs}</label>
                                <input type="text" id="yx" placeholder="${是否值236 ? 'مثال: 1.2.3.4:443#گره هنگ‌کنگ,5.6.7.8:80#گره آمریکا,example.com:8443#گره سنگاپور' : '例如: 1.2.3.4:443#日本节点,5.6.7.8:80#美国节点,example.com:8443#新加坡节点'}" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${是否值236 ? 'فرمت: IP:پورت#نام گره یا IP:پورت (بدون # از نام پیش‌فرض استفاده می‌شود). پشتیبانی از چندین مورد، با کاما جدا می‌شوند. <span style="color: #ffb400;">IP های اضافه شده از طریق API به طور خودکار در اینجا نمایش داده می‌شوند.</span>' : '格式: IP:端口#节点名称 或 IP:端口 (无#则使用默认名称)。支持多个，用逗号分隔。<span style="color: #ffb400;">API添加的IP会自动显示在这里。</span>'}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.preferredIPsURL}</label>
                                <input type="text" id="yxURL" placeholder="${是否值236 ? 'URL منبع لیست IP ترجیحی را وارد کنید' : '输入优选IP列表来源URL'}" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${是否值236 ? 'URL منبع لیست IP ترجیحی سفارشی، اگر خالی بگذارید از آدرس پیش‌فرض استفاده می‌شود' : '自定义优选IP列表来源URL，留空则使用默认地址'}</small>
                        </div>
                        
                        <div style="margin-bottom: 20px; padding: 15px; background: rgba(20, 5, 50, 0.6); border: 2px solid #7aa9c4; border-radius: 8px;">
                            <h4 style="color: #00f0ff; margin: 0 0 15px 0; font-size: 1.1rem; text-shadow: 0 0 5px #00f0ff;">⚡ ${翻译值.latencyTest}</h4>
                            <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
                                <div style="min-width: 120px;">
                                    <label style="display: block; margin-bottom: 5px; color: #00f0ff; font-size: 0.9rem;">${翻译值.ipSource}</label>
                                    <select id="ipSourceSelect" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px; cursor: pointer;">
                                        <option value="manual">${翻译值.manualInput}</option>
                                        <option value="cfRandom">${翻译值.cfRandomIP}</option>
                                        <option value="urlFetch">${翻译值.urlFetch}</option>
                                    </select>
                                </div>
                                <div style="width: 100px;">
                                    <label style="display: block; margin-bottom: 5px; color: #00f0ff; font-size: 0.9rem;">${翻译值.latencyTestPort}</label>
                                    <input type="number" id="latencyTestPort" value="443" min="1" max="65535" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                </div>
                                <div id="randomCountDiv" style="width: 100px; display: none;">
                                    <label style="display: block; margin-bottom: 5px; color: #00f0ff; font-size: 0.9rem;">${翻译值.randomCount}</label>
                                    <input type="number" id="randomIPCount" value="20" min="1" max="100" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                </div>
                                <div style="width: 80px;">
                                    <label style="display: block; margin-bottom: 5px; color: #00f0ff; font-size: 0.9rem;">${是否值236 ? 'رشته‌ها' : '线程'}</label>
                                    <input type="number" id="testThreads" value="5" min="1" max="50" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                </div>
                            </div>
                            <div id="manualInputDiv" style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; color: #00f0ff; font-size: 0.9rem;">${翻译值.latencyTestIP}</label>
                                <input type="text" id="latencyTestInput" placeholder="${翻译值.latencyTestIPPlaceholder}" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                            </div>
                            <div id="urlFetchDiv" style="margin-bottom: 10px; display: none;">
                                <label style="display: block; margin-bottom: 5px; color: #00f0ff; font-size: 0.9rem;">${翻译值.fetchURL}</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="fetchURLInput" placeholder="${翻译值.fetchURLPlaceholder}" style="flex: 1; padding: 10px; background: rgba(0, 0, 0, 0.8); border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 13px;">
                                    <button type="button" id="fetchIPBtn" style="background: rgba(0, 200, 255, 0.2); border: 1px solid #00aaff; padding: 8px 16px; color: #00aaff; font-family: 'Courier New', monospace; cursor: pointer; white-space: nowrap;">⬇ ${翻译值.fetchIP}</button>
                                </div>
                            </div>
                            <div id="cfRandomDiv" style="margin-bottom: 10px; display: none;">
                                <button type="button" id="generateCFIPBtn" style="background: rgba(0, 240, 255, 0.15); border: 1px solid #00f0ff; padding: 10px 20px; color: #00f0ff; font-family: 'Courier New', monospace; cursor: pointer; width: 100%; transition: all 0.3s;">🎲 ${翻译值.generateIP}</button>
                            </div>
                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                <button type="button" id="startLatencyTest" style="background: rgba(0, 240, 255, 0.2); border: 1px solid #00f0ff; padding: 8px 16px; color: #00f0ff; font-family: 'Courier New', monospace; cursor: pointer; transition: all 0.3s;">▶ ${翻译值.startTest}</button>
                                <button type="button" id="stopLatencyTest" style="background: rgba(255, 0, 0, 0.2); border: 1px solid #ff3860; padding: 8px 16px; color: #ff3860; font-family: 'Courier New', monospace; cursor: pointer; display: none; transition: all 0.3s;">⏹ ${翻译值.stopTest}</button>
                            </div>
                            <div id="latencyTestStatus" style="color: #7aa9c4; font-size: 0.9rem; margin-bottom: 10px; display: none;"></div>
                            <div id="latencyTestResults" style="max-height: 250px; overflow-y: auto; display: none;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span style="color: #00f0ff; font-weight: bold;">${翻译值.testResult}</span>
                                    <div style="display: flex; gap: 8px;">
                                        <button type="button" id="selectAllResults" style="background: transparent; border: 1px solid #7aa9c4; padding: 4px 10px; color: #7aa9c4; font-size: 0.8rem; cursor: pointer;">${翻译值.selectAll}</button>
                                        <button type="button" id="deselectAllResults" style="background: transparent; border: 1px solid #7aa9c4; padding: 4px 10px; color: #7aa9c4; font-size: 0.8rem; cursor: pointer;">${翻译值.deselectAll}</button>
                                    </div>
                                </div>
                                <div id="cityFilterContainer" style="margin-bottom: 10px; padding: 10px; background: rgba(15, 3, 40, 0.6); border: 1px solid #7aa9c4; border-radius: 4px; display: none;">
                                    <div style="margin-bottom: 8px;">
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff; font-size: 0.9rem;">
                                            <input type="radio" name="cityFilterMode" value="all" checked style="margin-right: 6px; width: 16px; height: 16px; cursor: pointer;">
                                            <span>${是否值236 ? '全部城市' : '全部城市'}</span>
                                        </label>
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff; font-size: 0.9rem; margin-left: 15px;">
                                            <input type="radio" name="cityFilterMode" value="fastest10" style="margin-right: 6px; width: 16px; height: 16px; cursor: pointer;">
                                            <span>${是否值236 ? '只选择最快的10个' : '只选择最快的10个'}</span>
                                        </label>
                                    </div>
                                    <div id="cityCheckboxesContainer" style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 80px; overflow-y: auto; padding: 5px;"></div>
                                </div>
                                <div id="latencyResultsList" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #004400; border-radius: 4px; padding: 10px;"></div>
                                <div style="margin-top: 10px; display: flex; gap: 10px;">
                                    <button type="button" id="overwriteSelectedToYx" style="flex: 1; background: rgba(0, 220, 130, 0.3); border: 1px solid #00f0ff; padding: 10px 20px; color: #00f0ff; font-family: 'Courier New', monospace; font-weight: bold; cursor: pointer; transition: all 0.3s;">${是否值236 ? '覆盖添加' : '覆盖添加'}</button>
                                    <button type="button" id="appendSelectedToYx" style="flex: 1; background: rgba(0, 178, 110, 0.3); border: 1px solid #7aa9c4; padding: 10px 20px; color: #7aa9c4; font-family: 'Courier New', monospace; font-weight: bold; cursor: pointer; transition: all 0.3s;">${是否值236 ? '追加添加' : '追加添加'}</button>
                                </div>
                            </div>
                        </div>

                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.socks5Config}</label>
                                <input type="text" id="socksConfig" placeholder="${是否值236 ? 解码64('2YXYq9in2YQ6IHVzZXI6cGFzc0Bob3N0OnBvcnQg24zYpyBodHRwOi8vdXNlcjpwYXNzQGhvc3Q6cG9ydA==') : 解码64('5L6L5aaCOiB1c2VyOnBhc3NAaG9zdDpwb3J0IOaIliBodHRwOi8vdXNlcjpwYXNzQGhvc3Q6cG9ydA==')}" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${是否值236 ? 解码64('2KLYr9ix2LMg2b7YsdmI2qnYs9uMINiu2LHZiNis24wg2KjYsdin24wg2KfZhtiq2YLYp9mEINiq2YXYp9mFINiq2LHYp9mB24zaqSDYrtix2YjYrNuMLiDYqNiv2YjZhiDZvtuM2LTZiNmG2K8g2KjZhyDYtdmI2LHYqiBzNSDYr9ixINmG2LjYsSDar9ix2YHYqtmHINmF24zigIzYtNmI2K8=') : 解码64('5Ye656uZ5Luj55CG5Zyw5Z2A77yM55So5LqO6L2s5Y+R5omA5pyJ5Ye656uZ5rWB6YeP44CC5LiN5YaZ5YmN57yA6buY6K6k5oyJIHM1IOWkhOeQhg==')}</small>
                        </div>
                    </form>

                    <h3 style="color: #00f0ff; margin: 20px 0 15px 0; font-size: 1.2rem;">${翻译值.advancedControl}</h3>
                    <form id="advancedConfigForm" style="margin-bottom: 20px;">
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.subscriptionConverter}</label>
                                <input type="text" id="scu" placeholder="${翻译值.subscriptionConverterPlaceholder}" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${翻译值.subscriptionConverterHint}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.builtinPreferred}</label>
                            <div style="padding: 15px; background: rgba(15, 3, 40, 0.6); border: 1px solid #00f0ff; border-radius: 5px;">
                                <div style="margin-bottom: 10px;">
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="ena" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1.1rem;">${翻译值.enableNativeAddress}</span>
                                    </label>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="epd" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1.1rem;">${翻译值.enablePreferredDomain}</span>
                                    </label>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="epi" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1.1rem;">${翻译值.enablePreferredIP}</span>
                                    </label>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="egi" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1.1rem;">${翻译值.enableGitHubPreferred}</span>
                                    </label>
                                </div>
                                    <small style="color: #7aa9c4; font-size: 0.85rem; display: block; margin-top: 10px;">${翻译值.builtinPreferredHint}</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.jkSection}</label>
                            <div style="padding: 15px; background: rgba(15, 3, 40, 0.6); border: 1px solid #00f0ff; border-radius: 5px;">
                                <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                    <input type="checkbox" id="jk" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                        <span style="font-size: 1.1rem;">${翻译值.jkEnable}</span>
                                </label>
                                    <small style="color: #7aa9c4; font-size: 0.85rem; display: block; margin-top: 10px;">${翻译值.jkHint}</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.pvlSection}</label>
                            <div style="padding: 15px; background: rgba(15, 3, 40, 0.6); border: 1px solid #00f0ff; border-radius: 5px;">
                                <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                    <input type="checkbox" id="pvl" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                        <span style="font-size: 1.1rem;">${翻译值.pvlEnable}</span>
                                </label>
                                    <small style="color: #7aa9c4; font-size: 0.85rem; display: block; margin-top: 10px;">${翻译值.pvlHint}</small>
                                <div style="margin-top: 12px; display: grid; gap: 10px;" id="pvlOptions">
                                    <label style="display: block; color: #00f0ff; font-size: 0.9rem;">${翻译值.pvlUrlLabel}
                                        <input type="text" id="pvlURL" placeholder="https://publicvpnlist.com/local/api/vpn-data.php?status=all" style="width: 100%; margin-top: 5px; padding: 8px; background: rgba(8, 4, 28, 0.9); border: 1px solid #00f0ff; color: #00f0ff; border-radius: 4px; box-sizing: border-box;">
                                    </label>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <label style="display: block; color: #00f0ff; font-size: 0.9rem;">${翻译值.pvlMinLabel}
                                            <input type="number" id="pvlmin" min="0" step="0.1" style="width: 100%; margin-top: 5px; padding: 8px; background: rgba(8, 4, 28, 0.9); border: 1px solid #00f0ff; color: #00f0ff; border-radius: 4px; box-sizing: border-box;">
                                        </label>
                                        <label style="display: block; color: #00f0ff; font-size: 0.9rem;">${翻译值.pvlMaxLabel}
                                            <input type="number" id="pvlmax" min="0" step="1" style="width: 100%; margin-top: 5px; padding: 8px; background: rgba(8, 4, 28, 0.9); border: 1px solid #00f0ff; color: #00f0ff; border-radius: 4px; box-sizing: border-box;">
                                        </label>
                                    </div>
                                    <label style="display: block; color: #00f0ff; font-size: 0.9rem;">${翻译值.pvlLimitLabel}
                                        <input type="number" id="pvllimit" min="1" step="1" placeholder="120" style="width: 100%; margin-top: 5px; padding: 8px; background: rgba(8, 4, 28, 0.9); border: 1px solid #00f0ff; color: #00f0ff; border-radius: 4px; box-sizing: border-box;">
                                    </label>
                                    <label style="display: block; color: #00f0ff; font-size: 0.9rem;">${翻译值.pvlCountryLabel}
                                        <input type="text" id="pvlcountry" placeholder="japan,south-korea,usa" style="width: 100%; margin-top: 5px; padding: 8px; background: rgba(8, 4, 28, 0.9); border: 1px solid #00f0ff; color: #00f0ff; border-radius: 4px; box-sizing: border-box;">
                                    </label>
                                    <label style="display: block; color: #00f0ff; font-size: 0.9rem;">${翻译值.pvlProtoLabel}
                                        <input type="text" id="pvlproto" placeholder="openvpn,vless,trojan" style="width: 100%; margin-top: 5px; padding: 8px; background: rgba(8, 4, 28, 0.9); border: 1px solid #00f0ff; color: #00f0ff; border-radius: 4px; box-sizing: border-box;">
                                    </label>
                                    <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                        <input type="checkbox" id="pvlraw" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 0.95rem;">${翻译值.pvlRawLabel}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">优选IP筛选设置</label>
                            <div style="padding: 15px; background: rgba(15, 3, 40, 0.6); border: 1px solid #00f0ff; border-radius: 5px;">
                                <div style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">IP版本选择</label>
                                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                            <input type="checkbox" id="ipv4Enabled" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1rem;">IPv4</span>
                                        </label>
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                            <input type="checkbox" id="ipv6Enabled" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1rem;">IPv6</span>
                                        </label>
                                    </div>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">运营商选择</label>
                                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                            <input type="checkbox" id="ispMobile" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1rem;">移动</span>
                                        </label>
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                            <input type="checkbox" id="ispUnicom" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1rem;">联通</span>
                                        </label>
                                        <label style="display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff;">
                                            <input type="checkbox" id="ispTelecom" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                                            <span style="font-size: 1rem;">电信</span>
                                        </label>
                                    </div>
                                </div>
                                    <small style="color: #7aa9c4; font-size: 0.85rem; display: block; margin-top: 10px;">选择要使用的IP版本和运营商，未选中的将被过滤</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.allowAPIManagement}</label>
                            <select id="apiEnabled" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                    <option value="">${翻译值.apiEnabledDefault}</option>
                                    <option value="yes">${翻译值.apiEnabledYes}</option>
                            </select>
                                <small style="color: #ffb400; font-size: 0.85rem;">${翻译值.apiEnabledHint}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.regionMatching}</label>
                            <select id="regionMatching" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                    <option value="">${翻译值.regionMatchingDefault}</option>
                                    <option value="no">${翻译值.regionMatchingNo}</option>
                            </select>
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${翻译值.regionMatchingHint}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.downgradeControl}</label>
                            <select id="downgradeControl" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                    <option value="">${翻译值.downgradeControlDefault}</option>
                                    <option value="no">${翻译值.downgradeControlNo}</option>
                                    <option value="only">${翻译值.downgradeControlOnly}</option>
                            </select>
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${翻译值.downgradeControlHint}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.tlsControl}</label>
                            <select id="portControl" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                    <option value="">${翻译值.tlsControlDefault}</option>
                                    <option value="yes">${翻译值.tlsControlYes}</option>
                            </select>
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${翻译值.tlsControlHint}</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #00f0ff; font-weight: bold; text-shadow: 0 0 3px #00f0ff;">${翻译值.preferredControl}</label>
                            <select id="preferredControl" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); border: 2px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;">
                                    <option value="">${翻译值.preferredControlDefault}</option>
                                    <option value="yes">${翻译值.preferredControlYes}</option>
                            </select>
                                <small style="color: #7aa9c4; font-size: 0.85rem;">${翻译值.preferredControlHint}</small>
                        </div>
                    </form>
                    <div id="currentConfig" style="background: rgba(0, 0, 0, 0.9); border: 1px solid #00f0ff; padding: 15px; margin: 10px 0; font-family: 'Courier New', monospace; color: #00f0ff;">
                            ${翻译值.loading}
                    </div>
                    <div id="pathTypeInfo" style="background: rgba(15, 3, 40, 0.7); border: 1px solid #00f0ff; padding: 15px; margin: 10px 0; font-family: 'Courier New', monospace; color: #00f0ff;">
                            <div style="font-weight: bold; margin-bottom: 8px; color: #00ff9d; text-shadow: 0 0 5px #00ff9d;">${翻译值.currentConfig}</div>
                            <div id="pathTypeStatus">${翻译值.checking}</div>
                    </div>
                </div>
                <div id="statusMessage" style="display: none; padding: 10px; margin: 10px 0; border: 1px solid #00f0ff; background: rgba(8, 4, 28, 0.8); color: #00f0ff; text-shadow: 0 0 5px #00f0ff;"></div>
            </div>
            
            <div class="card">
                    <h2 class="card-title">${翻译值.relatedLinks}</h2>
                <div style="text-align: center; margin: 20px 0;">
                        <a href="https://github.com/byJoey/cfnew" target="_blank" style="color: #00f0ff; text-decoration: none; margin: 0 20px; font-size: 1.2rem; text-shadow: 0 0 5px #00f0ff;">${翻译值.githubProject}</a>
                        <a href="https://github.com/byJoey/yx-tools/releases/" target="_blank" rel="noopener noreferrer" style="color: #00f0ff; text-decoration: none; margin: 0 20px; font-size: 1.2rem; text-shadow: 0 0 5px #00f0ff;">${翻译值.优选工具}</a>
                    <a href="https://www.youtube.com/@joeyblog" target="_blank" style="color: #00f0ff; text-decoration: none; margin: 0 20px; font-size: 1.2rem; text-shadow: 0 0 5px #00f0ff;">YouTube @joeyblog</a>
                </div>
            </div>
        </div>
        <div id="cpToastStack" class="cp-toast-stack" aria-live="polite" aria-atomic="false"></div>
        <div id="cpActionStatus" class="cp-action-status" role="status" aria-live="polite"></div>
        <div id="cpActionBar" class="cp-action-bar" role="toolbar" aria-label="${翻译值.configManagement}">
            <button type="button" id="cpBtnSaveAll" class="cp-fab-save" title="${是否值236 ? 'ذخیره همه تنظیمات' : '保存所有配置 (Ctrl+S)'}">
                <span class="cp-fab-icon">▣</span>
                <span>${是否值236 ? 'ذخیره همه' : '保 存 全 部'}</span>
                <span class="cp-fab-dot" aria-hidden="true"></span>
            </button>
            <button type="button" id="cpBtnRefresh" class="cp-action-btn" data-tip="${翻译值.refreshConfig}" aria-label="${翻译值.refreshConfig}">
                <span aria-hidden="true">↻</span>
                <span class="cp-btn-label">${翻译值.refreshConfig}</span>
            </button>
            <button type="button" id="cpBtnReset" class="cp-action-btn cp-action-btn-danger" data-tip="${翻译值.resetConfig}" aria-label="${翻译值.resetConfig}">
                <span aria-hidden="true">⌫</span>
                <span class="cp-btn-label">${翻译值.resetConfig}</span>
            </button>
        </div>
        <script>
// 地址从服务器配置注入
var 订阅转换网址 = "${订阅转换接口}";
// 远程配置URL（硬编码）
var 远程配置网址 = "${远程配置网址}";

// 翻译对象
const 本地值20215 = {
  zh: {
    subscriptionCopied: '${解码64('6K6i6ZiF6ZO+5o6l5bey5aSN5Yi2')}',
    autoSubscriptionCopied: '${解码64('6Ieq5Yqo6K+G5Yir6K6i6ZiF6ZO+5o6l5bey5aSN5Yi277yM5a6i5oi356uv6K6/6Zeu5pe25Lya5qC55o2uVXNlci1BZ2VudOiHquWKqOivhuWIq+W5tui/lOWbnuWvueW6lOagvOW8jw==')}'
  },
  fa: {
    subscriptionCopied: 'لینک اشتراک کپی شد',
    autoSubscriptionCopied: 'لینک اشتراک تشخیص خودکار کپی شد، کلاینت هنگام دسترسی بر اساس User-Agent به طور خودکار تشخیص داده و قالب مربوطه را برمی‌گرداند'
  }
};
function 获取凭据20214(名称20213) {
  const 值20212 = '; ' + document.cookie;
  const 部分列表20211 = 值20212.split('; ' + 名称20213 + '=');
  if (部分列表20211.length === 2) return 部分列表20211.pop().split(';').shift();
  return null;
}
const 浏览器语言20210 = navigator.language || navigator.userLanguage || '';
const 已保存语言20209 = localStorage.getItem('preferredLanguage') || 获取凭据20214('preferredLanguage');
let 是否值20208 = false;
if (已保存语言20209 === 'fa' || 已保存语言20209 === 'fa-IR') {
  是否值20208 = true;
} else if (已保存语言20209 === 'zh' || 已保存语言20209 === 'zh-CN') {
  是否值20208 = false;
} else {
  是否值20208 = 浏览器语言20210.includes('fa') || 浏览器语言20210.includes('fa-IR');
}
const 翻译值20207 = 本地值20215[是否值20208 ? 'fa' : 'zh'];
function 切换语言(语言) {
  localStorage.setItem('preferredLanguage', 语言);
  // 设置Cookie（有效期1年）
  const 过期日期20206 = new Date();
  过期日期20206.setFullYear(过期日期20206.getFullYear() + 1);
  document.cookie = 'preferredLanguage=' + 语言 + '; path=/; expires=' + 过期日期20206.toUTCString() + '; SameSite=Lax';
  // 刷新页面，不使用URL参数
  window.location.reload();
}

// 页面加载时检查 localStorage 和 Cookie，并清理URL参数
window.addEventListener('DOMContentLoaded', function () {
  const 已保存语言20205 = localStorage.getItem('preferredLanguage') || 获取凭据20214('preferredLanguage');
  const 网址参数 = new URLSearchParams(window.location.search);
  const 网址语言 = 网址参数.get('lang');

  // 如果URL中有语言参数，移除它并设置Cookie
  if (网址语言) {
    const 当前网址20204 = new URL(window.location.href);
    当前网址20204.searchParams.delete('lang');
    const 新网址 = 当前网址20204.toString();

    // 设置Cookie
    const 过期日期20203 = new Date();
    过期日期20203.setFullYear(过期日期20203.getFullYear() + 1);
    document.cookie = 'preferredLanguage=' + 网址语言 + '; path=/; expires=' + 过期日期20203.toUTCString() + '; SameSite=Lax';
    localStorage.setItem('preferredLanguage', 网址语言);

    // 使用history API移除URL参数，不刷新页面
    window.history.replaceState({}, '', 新网址);
  } else if (已保存语言20205) {
    // 如果localStorage中有但Cookie中没有，同步到Cookie
    const 过期日期 = new Date();
    过期日期.setFullYear(过期日期.getFullYear() + 1);
    document.cookie = 'preferredLanguage=' + 已保存语言20205 + '; path=/; expires=' + 过期日期.toUTCString() + '; SameSite=Lax';
  }
});

// 赛博朋克风 toast 通知 (替代 alert)
window.显示提示 = function (消息20202, 类型20201, 本地值20200) {
  本地值20200 = 本地值20200 || {};
  var 堆栈 = document.getElementById('cpToastStack');
  if (!堆栈) return;
  var 类型映射 = {
    success: '✓',
    info: '⌬',
    warn: '⚠',
    error: '✕'
  };
  var 标题映射 = {
    success: 'SUCCESS',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR'
  };
  类型20201 = 类型映射[类型20201] ? 类型20201 : 'success';
  var 持续时间 = 本地值20200.duration || 3200;
  var 提示 = document.createElement('div');
  提示.className = 'cp-toast cp-toast-' + 类型20201;
  提示.style.setProperty('--cp-toast-dur', 持续时间 + 'ms');
  var 图标 = document.createElement('span');
  图标.className = 'cp-toast-icon';
  图标.textContent = 类型映射[类型20201];
  var 主体 = document.createElement('div');
  主体.className = 'cp-toast-body';
  var 标题 = document.createElement('div');
  标题.className = 'cp-toast-title';
  标题.textContent = 本地值20200.title || 标题映射[类型20201];
  var 消息20199 = document.createElement('div');
  消息20199.className = 'cp-toast-msg';
  消息20199.textContent = String(消息20202 == null ? '' : 消息20202);
  主体.appendChild(标题);
  主体.appendChild(消息20199);
  var 关闭 = document.createElement('button');
  关闭.type = 'button';
  关闭.className = 'cp-toast-close';
  关闭.setAttribute('aria-label', 'close');
  关闭.textContent = '✕';
  提示.appendChild(图标);
  提示.appendChild(主体);
  提示.appendChild(关闭);
  堆栈.appendChild(提示);
  requestAnimationFrame(function () {
    提示.classList.add('cp-show');
  });
  var 本地值20198 = false;
  function 关闭提示() {
    if (本地值20198) return;
    本地值20198 = true;
    提示.classList.remove('cp-show');
    提示.classList.add('cp-hide');
    setTimeout(function () {
      if (提示.parentNode) 提示.parentNode.removeChild(提示);
    }, 400);
  }
  关闭.addEventListener('click', 关闭提示);
  var 计时器 = setTimeout(关闭提示, 持续时间);
  提示.addEventListener('mouseenter', function () {
    clearTimeout(计时器);
  });
  提示.addEventListener('mouseleave', function () {
    计时器 = setTimeout(关闭提示, 1200);
  });
  return {
    dismiss: 关闭提示,
    element: 提示
  };
};
function 尝试打开应用(方案网址20197, 回退回调, 超时20196) {
  超时20196 = 超时20196 || 2500;
  var 应用已打开 = false;
  var 回调已执行 = false;
  var 开始值 = Date.now();
  var 值值20195 = function () {
    var 耗时20194 = Date.now() - 开始值;
    if (耗时20194 < 3000 && !回调已执行) {
      应用已打开 = true;
    }
  };
  window.addEventListener('blur', 值值20195);
  var 值值20193 = function () {
    var 耗时 = Date.now() - 开始值;
    if (耗时 < 3000 && !回调已执行) {
      应用已打开 = true;
    }
  };
  document.addEventListener('visibilitychange', 值值20193);
  var 内嵌框架 = document.createElement('iframe');
  内嵌框架.style.display = 'none';
  内嵌框架.style.width = '1px';
  内嵌框架.style.height = '1px';
  内嵌框架.src = 方案网址20197;
  document.body.appendChild(内嵌框架);
  setTimeout(function () {
    内嵌框架.parentNode && 内嵌框架.parentNode.removeChild(内嵌框架);
    window.removeEventListener('blur', 值值20195);
    document.removeEventListener('visibilitychange', 值值20193);
    if (!回调已执行) {
      回调已执行 = true;
      if (!应用已打开 && 回退回调) {
        回退回调();
      }
    }
  }, 超时20196);
}
function 生成客户端链接(客户端类型, 客户端名称) {
  var 当前网址20192 = window.location.href;
  var 订阅网址20191 = 当前网址20192 + "/sub";
  var 方案网址 = '';
  var 显示名称 = 客户端名称 || '';
  var 最终网址 = 订阅网址20191;
  if (客户端类型 === atob('djJyYXk=')) {
    最终网址 = 订阅网址20191;
    var 网址值20190 = document.getElementById("clientSubscriptionUrl");
    网址值20190.textContent = 最终网址;
    网址值20190.style.display = "block";
    网址值20190.style.overflowWrap = "break-word";
    网址值20190.style.wordBreak = "break-all";
    网址值20190.style.overflowX = "auto";
    网址值20190.style.maxWidth = "100%";
    网址值20190.style.boxSizing = "border-box";
    if (客户端名称 === 'V2RAY') {
      navigator.clipboard.writeText(最终网址).then(function () {
        显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
      });
    } else if (客户端名称 === 'Shadowrocket') {
      方案网址 = '${解码64('c2hhZG93cm9ja2V0Oi8vYWRkLw==')}' + encodeURIComponent(最终网址);
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    } else if (客户端名称 === 'V2RAYNG') {
      方案网址 = '${解码64('djJyYXluZzovL2luc3RhbGw/dXJsPQ==')}' + encodeURIComponent(最终网址);
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    } else if (客户端名称 === 'NEKORAY') {
      方案网址 = '${解码64('bmVrb3JheTovL2luc3RhbGwtY29uZmlnP3VybD0=')}' + encodeURIComponent(最终网址);
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    }
  } else {
    // 统一走内部格式转换
    最终网址 = 订阅网址20191 + (订阅网址20191.includes('?') ? '&' : '?') + "target=" + 客户端类型;
    var 网址值20190 = document.getElementById("clientSubscriptionUrl");
    网址值20190.textContent = 最终网址;
    网址值20190.style.display = "block";
    网址值20190.style.overflowWrap = "break-word";
    网址值20190.style.wordBreak = "break-all";
    网址值20190.style.overflowX = "auto";
    网址值20190.style.maxWidth = "100%";
    网址值20190.style.boxSizing = "border-box";
    if (客户端类型 === 'vg' || 客户端类型 === 'pvl') {
      方案网址 = '${解码64('Y2xhc2g6Ly9pbnN0YWxsLWNvbmZpZz91cmw9')}' + encodeURIComponent(最终网址);
      if (客户端类型 === 'pvl') 显示名称 = 'CLASH';
    } else if (客户端类型 === 'pvlsb') {
      方案网址 = '${解码64('c2luZy1ib3g6Ly9pbXBvcnQtY29uZmlnP3VybD0=')}' + encodeURIComponent(最终网址);
      显示名称 = 'SING-BOX';
    } else if (客户端类型 === atob('Y2xhc2g=')) {
      if (客户端名称 === 'STASH') {
        方案网址 = '${解码64('c3Rhc2g6Ly9pbnN0YWxsP3VybD0=')}' + encodeURIComponent(最终网址);
        显示名称 = 'STASH';
      } else {
        方案网址 = '${解码64('Y2xhc2g6Ly9pbnN0YWxsLWNvbmZpZz91cmw9')}' + encodeURIComponent(最终网址);
        显示名称 = 'CLASH';
      }
    } else if (客户端类型 === atob('c3VyZ2U=')) {
      方案网址 = '${解码64('c3VyZ2U6Ly8vaW5zdGFsbC1jb25maWc/dXJsPQ==')}' + encodeURIComponent(最终网址);
      显示名称 = 'SURGE';
    } else if (客户端类型 === atob('c2luZ2JveA==')) {
      方案网址 = '${解码64('c2luZy1ib3g6Ly9pbnN0YWxsLWNvbmZpZz91cmw9')}' + encodeURIComponent(最终网址);
      显示名称 = 'SING-BOX';
    } else if (客户端类型 === atob('bG9vbg==')) {
      方案网址 = '${解码64('bG9vbjovL2luc3RhbGw/dXJsPQ==')}' + encodeURIComponent(最终网址);
      显示名称 = 'LOON';
    } else if (客户端类型 === atob('cXVhbng=')) {
      方案网址 = '${解码64('cXVhbnR1bXVsdC14Oi8vaW5zdGFsbC1jb25maWc/dXJsPQ==')}' + encodeURIComponent(最终网址);
      显示名称 = 'QUANTUMULT X';
    }
    if (方案网址) {
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    } else {
      navigator.clipboard.writeText(最终网址).then(function () {
        显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
      });
    }
  }
}

// 页面特效图形化开关 (localStorage 持久化)
window.应用页面特效 = function () {
  var 本地值20189 = localStorage.getItem('cp-fx-off') === '1';
  document.body.classList.toggle('fx-off', 本地值20189);
  var 本地值20188 = document.getElementById('cpFxLabel');
  if (本地值20188) 本地值20188.textContent = 本地值20189 ? 'FX: OFF' : 'FX: ON';
  if (本地值20189) {
    var 本地值20187 = document.getElementById('matrixCodeRain');
    if (本地值20187) 本地值20187.innerHTML = '';
  } else if (typeof 创建矩阵雨 === 'function') {
    var 结果值 = document.getElementById('matrixCodeRain');
    if (结果值 && !结果值.firstChild) 创建矩阵雨();
  }
};
window.切换页面特效 = function () {
  var 本地值20186 = localStorage.getItem('cp-fx-off') === '1';
  localStorage.setItem('cp-fx-off', 本地值20186 ? '0' : '1');
  window.应用页面特效();
};
(function () {
  if (localStorage.getItem('cp-fx-off') === '1') {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.classList.add('fx-off');
      var 本地值20185 = document.getElementById('cpFxLabel');
      if (本地值20185) 本地值20185.textContent = 'FX: OFF';
    });
  }
})();
function 创建矩阵雨() {
  if (document.body && document.body.classList.contains('fx-off')) return;
  const 矩阵值 = document.getElementById('matrixCodeRain');
  if (!矩阵值) return;
  const 赛博字符列表 = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ$%#@!?<>+=ABCDEF';
  const 调色板 = ['#00f0ff', '#ff2bd6', '#a347ff', '#00ff9d'];
  const 列数 = Math.floor(window.innerWidth / 20);
  for (let 索引值20184 = 0; 索引值20184 < 列数; 索引值20184++) {
    const 列20183 = document.createElement('div');
    列20183.className = 'matrix-column';
    列20183.style.left = 索引值20184 * 20 + 'px';
    列20183.style.animationDelay = -Math.random() * 15 + 's';
    列20183.style.animationDuration = Math.random() * 14 + 8 + 's';
    列20183.style.fontSize = Math.random() * 4 + 12 + 'px';
    列20183.style.opacity = (Math.random() * 0.7 + 0.3).toFixed(2);
    let 文本20182 = '';
    const 字符数量 = Math.floor(Math.random() * 30 + 18);
    for (let 次索引值 = 0; 次索引值 < 字符数量; 次索引值++) {
      const 字符 = 赛博字符列表[Math.floor(Math.random() * 赛博字符列表.length)];
      const 值强调 = Math.random() > 0.85;
      const 颜色 = 值强调 ? 调色板[Math.floor(Math.random() * 调色板.length)] : '';
      文本20182 += 颜色 ? '<span style="color:' + 颜色 + ';text-shadow:0 0 8px ' + 颜色 + ';">' + 字符 + '</span><br>' : '<span>' + 字符 + '</span><br>';
    }
    列20183.innerHTML = 文本20182;
    矩阵值.appendChild(列20183);
  }
  setInterval(function () {
    const 列列表 = 矩阵值.querySelectorAll('.matrix-column');
    列列表.forEach(function (列) {
      if (Math.random() > 0.94) {
        const 字符列表 = 列.querySelectorAll('span');
        if (字符列表.length > 0) {
          const 目标20181 = 字符列表[Math.floor(Math.random() * 字符列表.length)];
          const 本地值20180 = 目标20181.style.color;
          目标20181.style.color = '#ffffff';
          目标20181.style.textShadow = '0 0 10px #ffffff, 0 0 18px #00f0ff';
          setTimeout(function () {
            目标20181.style.color = 本地值20180;
            目标20181.style.textShadow = '';
          }, 200);
        }
      }
    });
  }, 110);
}
async function 检查系统状态() {
  try {
    const 云墙状态 = document.getElementById('cfStatus');
    const 地区状态 = document.getElementById('regionStatus');
    const 值值20179 = document.getElementById('geoInfo');
    const 备用状态 = document.getElementById('backupStatus');
    const 当前地址 = document.getElementById('currentIP');
    const 地区值 = document.getElementById('regionMatch');

    // 获取当前语言设置（优先从Cookie/localStorage读取）
    function 获取凭据20178(名称20177) {
      const 值20176 = '; ' + document.cookie;
      const 部分列表20175 = 值20176.split('; ' + 名称20177 + '=');
      if (部分列表20175.length === 2) return 部分列表20175.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20174 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20173 = localStorage.getItem('preferredLanguage') || 获取凭据20178('preferredLanguage');
    let 是否值20172 = false;
    if (已保存语言20173 === 'fa' || 已保存语言20173 === 'fa-IR') {
      是否值20172 = true;
    } else if (已保存语言20173 === 'zh' || 已保存语言20173 === 'zh-CN') {
      是否值20172 = false;
    } else {
      是否值20172 = 浏览器语言20174.includes('fa') || 浏览器语言20174.includes('fa-IR');
    }
    const 本地值20171 = {
      zh: {
        workerRegion: 'Worker地区: ',
        detectionMethod: '检测方式: ',
        proxyIPStatus: '${解码64('UHJveHlJUOeKtuaAgTog')}',
        currentIP: '当前使用IP: ',
        regionMatch: '地区匹配: ',
        regionNames: {
          'CF': '${解码64('8J+MkCDlrpjmlrnnm7Tov54=')}',
          'HK': '🇭🇰 香港',
          'US': '🇺🇸 美国',
          'SG': '🇸🇬 新加坡',
          'JP': '🇯🇵 日本',
          'KR': '🇰🇷 韩国',
          'DE': '🇩🇪 德国',
          'SE': '🇸🇪 瑞典',
          'NL': '🇳🇱 荷兰',
          'FI': '🇫🇮 芬兰',
          'GB': '🇬🇧 英国'
        },
        customIPMode: '${解码64('6Ieq5a6a5LmJUHJveHlJUOaooeW8jyAocOWPmOmHj+WQr+eUqCk=')}',
        customIPModeDesc: '自定义IP模式 (已禁用地区匹配)',
        usingCustomProxyIP: '${解码64('5L2/55So6Ieq5a6a5LmJUHJveHlJUDog')}',
        customIPConfig: ' (p变量配置)',
        customIPModeDisabled: '自定义IP模式，地区选择已禁用',
        manualRegion: '手动指定地区',
        manualRegionDesc: ' (手动指定)',
        proxyIPAvailable: '${解码64('MTAvMTAg5Y+v55SoIChQcm94eUlQ5Z+f5ZCN6aKE6K6+5Y+v55SoKQ==')}',
        smartSelection: '智能就近选择中',
        sameRegionIP: '同地区IP可用 (1个)',
        cloudflareDetection: '${解码64('5a6Y5pa555u06L+e')}',
        detectionFailed: '检测失败',
        unknown: '未知'
      },
      fa: {
        workerRegion: 'منطقه Worker: ',
        detectionMethod: 'روش تشخیص: ',
        proxyIPStatus: '${解码64('2YjYtti524zYqiBQcm94eUlQOiA=')}',
        currentIP: 'IP فعلی: ',
        regionMatch: 'تطبیق منطقه: ',
        regionNames: {
          'CF': '🌐 مستقیم رسمی',
          'HK': '🇭🇰 هنگ کنگ',
          'US': '🇺🇸 آمریکا',
          'SG': '🇸🇬 سنگاپور',
          'JP': '🇯🇵 ژاپن',
          'KR': '🇰🇷 کره جنوبی',
          'DE': '🇩🇪 آلمان',
          'SE': '🇸🇪 سوئد',
          'NL': '🇳🇱 هلند',
          'FI': '🇫🇮 فنلاند',
          'GB': '🇬🇧 بریتانیا'
        },
        customIPMode: '${解码64('2K3Yp9mE2KogUHJveHlJUCDYs9mB2KfYsdi024wgKNmF2KrYutuM2LEgcCDZgdi52KfZhCDYp9iz2Kop')}',
        customIPModeDesc: 'حالت IP سفارشی (تطبیق منطقه غیرفعال است)',
        usingCustomProxyIP: '${解码64('2KfYs9iq2YHYp9iv2Ycg2KfYsiBQcm94eUlQINiz2YHYp9ix2LTbjDog')}',
        customIPConfig: ' (پیکربندی متغیر p)',
        customIPModeDisabled: 'حالت IP سفارشی، انتخاب منطقه غیرفعال است',
        manualRegion: 'تعیین منطقه دستی',
        manualRegionDesc: ' (تعیین دستی)',
        proxyIPAvailable: '${解码64('MTAvMTAg2K/YsSDYr9iz2KrYsdizICjYr9in2YXZhtmHINm+24zYtOKAjNmB2LHYtiBQcm94eUlQINiv2LEg2K/Ys9iq2LHYsyDYp9iz2Kop')}',
        smartSelection: 'انتخاب هوشمند نزدیک در حال انجام است',
        sameRegionIP: 'IP هم‌منطقه در دسترس است (1)',
        cloudflareDetection: 'اتصال مستقیم رسمی',
        detectionFailed: 'تشخیص ناموفق',
        unknown: 'ناشناخته'
      }
    };
    const 翻译值20170 = 本地值20171[是否值20172 ? 'fa' : 'zh'];
    let 值地区20169 = 'US'; // 默认值
    let 是否自定义地址值 = false;
    let 是否手动地区值 = false;
    try {
      const 响应20168 = await fetch(window.location.pathname + '/region');
      const 数据20167 = await 响应20168.json();
      if (数据20167.region === 'CUSTOM') {
        是否自定义地址值 = true;
        值地区20169 = 'CUSTOM';

        // 获取自定义IP的详细信息
        const 自定义地址值 = 数据20167.ci || 翻译值20170.unknown;
        值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #ffb400;">⚙️ ' + 翻译值20170.customIPMode + '</span>';
        地区状态.innerHTML = 翻译值20170.workerRegion + '<span style="color: #ffb400;">🔧 ' + 翻译值20170.customIPModeDesc + '</span>';

        // 显示自定义IP配置状态，包含具体IP
        if (备用状态) 备用状态.innerHTML = 翻译值20170.proxyIPStatus + '<span style="color: #ffb400;">🔧 ' + 翻译值20170.usingCustomProxyIP + 自定义地址值 + '</span>';
        if (当前地址) 当前地址.innerHTML = 翻译值20170.currentIP + '<span style="color: #ffb400;">✅ ' + 自定义地址值 + 翻译值20170.customIPConfig + '</span>';
        if (地区值) 地区值.innerHTML = 翻译值20170.regionMatch + '<span style="color: #ffb400;">⚠️ ' + 翻译值20170.customIPModeDisabled + '</span>';
        return; // 提前返回，不执行后续的地区匹配逻辑
      } else if (数据20167.detectionMethod === '手动指定地区' || 数据20167.detectionMethod === 'تعیین منطقه دستی') {
        是否手动地区值 = true;
        值地区20169 = 数据20167.region;
        值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #00b380;">' + 翻译值20170.manualRegion + '</span>';
        地区状态.innerHTML = 翻译值20170.workerRegion + '<span style="color: #00ff9d;">🎯 ' + 翻译值20170.regionNames[值地区20169] + 翻译值20170.manualRegionDesc + '</span>';

        // 显示配置状态而不是检测状态
        if (备用状态) 备用状态.innerHTML = 翻译值20170.proxyIPStatus + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.proxyIPAvailable + '</span>';
        if (当前地址) 当前地址.innerHTML = 翻译值20170.currentIP + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.smartSelection + '</span>';
        if (地区值) 地区值.innerHTML = 翻译值20170.regionMatch + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.sameRegionIP + '</span>';
        return; // 提前返回，不执行后续的地区匹配逻辑
      } else if (数据20167.region && 翻译值20170.regionNames[数据20167.region]) {
        值地区20169 = 数据20167.region;
      }
      值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #00ff9d;">' + 翻译值20170.cloudflareDetection + '</span>';
    } catch (事件值20166) {
      值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #ff3860;">' + 翻译值20170.detectionFailed + '</span>';
    }
    地区状态.innerHTML = 翻译值20170.workerRegion + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.regionNames[值地区20169] + '</span>';

    // 直接显示配置状态，不再进行检测
    if (备用状态) {
      备用状态.innerHTML = 翻译值20170.proxyIPStatus + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.proxyIPAvailable + '</span>';
    }
    if (当前地址) {
      当前地址.innerHTML = 翻译值20170.currentIP + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.smartSelection + '</span>';
    }
    if (地区值) {
      地区值.innerHTML = 翻译值20170.regionMatch + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.sameRegionIP + '</span>';
    }
  } catch (错误20165) {
    function 获取凭据20164(名称20163) {
      const 值20162 = '; ' + document.cookie;
      const 部分列表20161 = 值20162.split('; ' + 名称20163 + '=');
      if (部分列表20161.length === 2) return 部分列表20161.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20160 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20159 = localStorage.getItem('preferredLanguage') || 获取凭据20164('preferredLanguage');
    let 是否值20158 = false;
    if (已保存语言20159 === 'fa' || 已保存语言20159 === 'fa-IR') {
      是否值20158 = true;
    } else {
      是否值20158 = 浏览器语言20160.includes('fa') || 浏览器语言20160.includes('fa-IR');
    }
    const 本地值20157 = {
      zh: {
        workerRegion: 'Worker地区: ',
        detectionMethod: '检测方式: ',
        proxyIPStatus: '${解码64('UHJveHlJUOeKtuaAgTog')}',
        currentIP: '当前使用IP: ',
        regionMatch: '地区匹配: ',
        detectionFailed: '检测失败'
      },
      fa: {
        workerRegion: 'منطقه Worker: ',
        detectionMethod: 'روش تشخیص: ',
        proxyIPStatus: '${解码64('2YjYtti524zYqiBQcm94eUlQOiA=')}',
        currentIP: 'IP فعلی: ',
        regionMatch: 'تطبیق منطقه: ',
        detectionFailed: 'تشخیص ناموفق'
      }
    };
    const 翻译值20156 = 本地值20157[是否值20158 ? 'fa' : 'zh'];
    document.getElementById('regionStatus').innerHTML = 翻译值20156.workerRegion + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('geoInfo').innerHTML = 翻译值20156.detectionMethod + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('backupStatus').innerHTML = 翻译值20156.proxyIPStatus + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('currentIP').innerHTML = 翻译值20156.currentIP + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('regionMatch').innerHTML = 翻译值20156.regionMatch + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
  }
}
async function 测试接口() {
  try {
    function 获取凭据20155(名称20154) {
      const 值20153 = '; ' + document.cookie;
      const 部分列表20152 = 值20153.split('; ' + 名称20154 + '=');
      if (部分列表20152.length === 2) return 部分列表20152.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20151 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20150 = localStorage.getItem('preferredLanguage') || 获取凭据20155('preferredLanguage');
    let 是否值20149 = false;
    if (已保存语言20150 === 'fa' || 已保存语言20150 === 'fa-IR') {
      是否值20149 = true;
    } else {
      是否值20149 = 浏览器语言20151.includes('fa') || 浏览器语言20151.includes('fa-IR');
    }
    const 本地值20148 = {
      zh: {
        apiTestResult: 'API检测结果: ',
        apiTestTime: '检测时间: ',
        apiTestFailed: 'API检测失败: ',
        unknownError: '未知错误',
        apiTestError: 'API测试失败: '
      },
      fa: {
        apiTestResult: 'نتیجه تشخیص API: ',
        apiTestTime: 'زمان تشخیص: ',
        apiTestFailed: 'تشخیص API ناموفق: ',
        unknownError: 'خطای ناشناخته',
        apiTestError: 'تست API ناموفق: '
      }
    };
    const 翻译值20147 = 本地值20148[是否值20149 ? 'fa' : 'zh'];
    const 响应20146 = await fetch(window.location.pathname + '/test-api');
    const 数据20145 = await 响应20146.json();
    if (数据20145.detectedRegion) {
      显示提示(翻译值20147.apiTestResult + 数据20145.detectedRegion + '\\n' + 翻译值20147.apiTestTime + 数据20145.timestamp, 'info', {
        duration: 5000
      });
    } else {
      显示提示(翻译值20147.apiTestFailed + (数据20145.error || 翻译值20147.unknownError), 'error', {
        duration: 4500
      });
    }
  } catch (错误20144) {
    function 获取凭据20143(名称20142) {
      const 值20141 = '; ' + document.cookie;
      const 部分列表20140 = 值20141.split('; ' + 名称20142 + '=');
      if (部分列表20140.length === 2) return 部分列表20140.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20139 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20138 = localStorage.getItem('preferredLanguage') || 获取凭据20143('preferredLanguage');
    let 是否值20137 = false;
    if (已保存语言20138 === 'fa' || 已保存语言20138 === 'fa-IR') {
      是否值20137 = true;
    } else {
      是否值20137 = 浏览器语言20139.includes('fa') || 浏览器语言20139.includes('fa-IR');
    }
    const 本地值20136 = {
      zh: {
        apiTestError: 'API测试失败: '
      },
      fa: {
        apiTestError: 'تست API ناموفق: '
      }
    };
    const 翻译值20135 = 本地值20136[是否值20137 ? 'fa' : 'zh'];
    显示提示(翻译值20135.apiTestError + 错误20144.message, 'error', {
      duration: 4500
    });
  }
}

// 配置管理相关函数
async function 检查键值状态() {
  const 接口网址20134 = window.location.pathname + '/api/config';
  try {
    const 响应20133 = await fetch(接口网址20134);
    function 获取凭据20132(名称20131) {
      const 值20130 = '; ' + document.cookie;
      const 部分列表20129 = 值20130.split('; ' + 名称20131 + '=');
      if (部分列表20129.length === 2) return 部分列表20129.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20128 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20127 = localStorage.getItem('preferredLanguage') || 获取凭据20132('preferredLanguage');
    let 是否值20126 = false;
    if (已保存语言20127 === 'fa' || 已保存语言20127 === 'fa-IR') {
      是否值20126 = true;
    } else {
      是否值20126 = 浏览器语言20128.includes('fa') || 浏览器语言20128.includes('fa-IR');
    }
    const 本地值20125 = {
      zh: {
        kvDisabled: '⚠️ KV存储未启用或未配置',
        kvNotConfigured: 'KV存储未配置，无法使用配置管理功能。\\n\\n请在Cloudflare Workers中:\\n1. 创建KV命名空间\\n2. 绑定环境变量 C\\n3. 重新部署代码',
        kvNotEnabled: 'KV存储未配置',
        kvEnabled: '✅ KV存储已启用，可以使用配置管理功能',
        kvCheckFailed: '⚠️ KV存储检测失败',
        kvCheckFailedFormat: 'KV存储检测失败: 响应格式错误',
        kvCheckFailedStatus: 'KV存储检测失败 - 状态码: ',
        kvCheckFailedError: 'KV存储检测失败 - 错误: '
      },
      fa: {
        kvDisabled: '⚠️ ذخیره‌سازی KV فعال نیست یا پیکربندی نشده است',
        kvNotConfigured: 'ذخیره‌سازی KV پیکربندی نشده است، نمی‌توانید از عملکرد مدیریت تنظیمات استفاده کنید.\\n\\nلطفا در Cloudflare Workers:\\n1. فضای نام KV ایجاد کنید\\n2. متغیر محیطی C را پیوند دهید\\n3. کد را دوباره مستقر کنید',
        kvNotEnabled: 'ذخیره‌سازی KV پیکربندی نشده است',
        kvEnabled: '✅ ذخیره‌سازی KV فعال است، می‌توانید از مدیریت تنظیمات استفاده کنید',
        kvCheckFailed: '⚠️ بررسی ذخیره‌سازی KV ناموفق',
        kvCheckFailedFormat: 'بررسی ذخیره‌سازی KV ناموفق: خطای فرمت پاسخ',
        kvCheckFailedStatus: 'بررسی ذخیره‌سازی KV ناموفق - کد وضعیت: ',
        kvCheckFailedError: 'بررسی ذخیره‌سازی KV ناموفق - خطا: '
      }
    };
    const 翻译值20124 = 本地值20125[是否值20126 ? 'fa' : 'zh'];
    if (响应20133.status === 503) {
      // KV未配置
      document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvDisabled + '</span>';
      document.getElementById('configCard').style.display = 'block';
      document.getElementById('currentConfig').textContent = 翻译值20124.kvNotConfigured;
    } else if (响应20133.ok) {
      try {
        const 数据20123 = await 响应20133.json();

        // 检查响应是否包含KV配置信息
        if (数据20123 && 数据20123.kvEnabled === true) {
          document.getElementById('kvStatus').innerHTML = '<span style="color: #00ff9d;">' + 翻译值20124.kvEnabled + '</span>';
          document.getElementById('configContent').style.display = 'block';
          document.getElementById('configCard').style.display = 'block';
          await 加载当前配置();
        } else {
          document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvDisabled + '</span>';
          document.getElementById('configCard').style.display = 'block';
          document.getElementById('currentConfig').textContent = 翻译值20124.kvNotEnabled;
        }
      } catch (数据对象错误) {
        document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvCheckFailed + '</span>';
        document.getElementById('configCard').style.display = 'block';
        document.getElementById('currentConfig').textContent = 翻译值20124.kvCheckFailedFormat;
      }
    } else {
      document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvDisabled + '</span>';
      document.getElementById('configCard').style.display = 'block';
      document.getElementById('currentConfig').textContent = 翻译值20124.kvCheckFailedStatus + 响应20133.status;
    }
  } catch (错误20122) {
    function 获取凭据(名称) {
      const 值20121 = '; ' + document.cookie;
      const 部分列表20120 = 值20121.split('; ' + 名称 + '=');
      if (部分列表20120.length === 2) return 部分列表20120.pop().split(';').shift();
      return null;
    }
    const 浏览器语言 = navigator.language || navigator.userLanguage || '';
    const 已保存语言 = localStorage.getItem('preferredLanguage') || 获取凭据('preferredLanguage');
    let 是否值 = false;
    if (已保存语言 === 'fa' || 已保存语言 === 'fa-IR') {
      是否值 = true;
    } else {
      是否值 = 浏览器语言.includes('fa') || 浏览器语言.includes('fa-IR');
    }
    const 本地值20119 = {
      zh: {
        kvDisabled: '⚠️ KV存储未启用或未配置',
        kvCheckFailedError: 'KV存储检测失败 - 错误: '
      },
      fa: {
        kvDisabled: '⚠️ ذخیره‌سازی KV فعال نیست یا پیکربندی نشده است',
        kvCheckFailedError: 'بررسی ذخیره‌سازی KV ناموفق - خطا: '
      }
    };
    const 翻译值20118 = 本地值20119[是否值 ? 'fa' : 'zh'];
    document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20118.kvDisabled + '</span>';
    document.getElementById('configCard').style.display = 'block';
    document.getElementById('currentConfig').textContent = 翻译值20118.kvCheckFailedError + 错误20122.message;
  }
}
function 读取字段值(标识) {
  const 元素 = document.getElementById(标识);
  return 元素 ? 元素.value : '';
}

function 写入字段值(标识, 值 = '') {
  const 元素 = document.getElementById(标识);
  if (元素) 元素.value = 值 || '';
}

function 是否开关启用(值, 默认启用 = false) {
  if (值 === undefined || 值 === null || 值 === '') return 默认启用;
  if (值 === true || 值 === false) return 值;
  const 文本 = String(值).trim().toLowerCase();
  if (文本 === 'yes' || 文本 === 'true' || 文本 === '1' || 文本 === 'on') return true;
  if (文本 === 'no' || 文本 === 'false' || 文本 === '0' || 文本 === 'off') return false;
  return 默认启用;
}

function 写入开关值(标识, 值, 默认启用 = false) {
  const 元素 = document.getElementById(标识);
  if (元素) 元素.checked = 是否开关启用(值, 默认启用);
}

function 读取开关值(标识, 默认启用 = false) {
  const 元素 = document.getElementById(标识);
  if (!元素) return 默认启用 ? 'yes' : 'no';
  return 元素.checked ? 'yes' : 'no';
}

function 同步协议界面状态() {
  const 明文开关 = document.getElementById('ev');
  const 木马开关 = document.getElementById('et');
  const 扩展开关 = document.getElementById('ex');
  if (明文开关 && 木马开关 && 扩展开关 && !明文开关.checked && !木马开关.checked && !扩展开关.checked) {
    明文开关.checked = true;
  }
}

function 同步联动界面状态() {
  同步协议界面状态();
  const 加密客户端问候复选框 = document.getElementById('ech');
  const 端口控制 = document.getElementById('portControl');
  if (加密客户端问候复选框 && 端口控制 && 加密客户端问候复选框.checked) {
    端口控制.value = 'yes';
  }
  更新路径类型状态(读取字段值('customPath'));
  更新工作器地区状态();
}

function 应用配置到界面(配置) {
  写入字段值('wkRegion', 配置.wk);
  写入开关值('ev', 配置.ev, true);
  写入开关值('et', 配置.et, false);
  写入开关值('ex', 配置.ex, false);
  写入开关值('ech', 配置.ech, false);
  写入字段值('tp', 配置.tp);
  写入字段值('customDNS', 配置.customDNS);
  写入字段值('customECHDomain', 配置.customECHDomain);
  写入字段值('alpn', 配置.alpn);
  写入字段值('scu', 配置.scu);
  写入开关值('ena', 配置.ena, false);
  写入开关值('jk', 配置.jk, false);
  const 家宽按钮 = document.getElementById('jkClientBtn');
  if (家宽按钮) 家宽按钮.style.display = 是否开关启用(配置.jk, false) ? '' : 'none';
  写入开关值('pvl', 配置.pvl, false);
  写入字段值('pvlURL', 配置.pvlURL);
  写入字段值('pvlmin', 配置.pvlmin);
  写入字段值('pvlmax', 配置.pvlmax);
  写入字段值('pvllimit', 配置.pvllimit);
  写入字段值('pvlcountry', 配置.pvlcountry);
  写入字段值('pvlproto', 配置.pvlproto);
  写入开关值('pvlraw', 配置.pvlraw, true);
  const 公共开关 = 是否开关启用(配置.pvl, false);
  for (const 标识 of ['pvlClientBtn', 'pvlUriClientBtn', 'pvlBoxClientBtn']) {
    const 按钮 = document.getElementById(标识);
    if (按钮) 按钮.style.display = 公共开关 ? '' : 'none';
  }
  写入开关值('epd', 配置.epd, true);
  写入开关值('epi', 配置.epi, true);
  写入开关值('egi', 配置.egi, true);
  写入开关值('ipv4Enabled', 配置.ipv4, true);
  写入开关值('ipv6Enabled', 配置.ipv6, true);
  写入开关值('ispMobile', 配置.ispMobile, true);
  写入开关值('ispUnicom', 配置.ispUnicom, true);
  写入开关值('ispTelecom', 配置.ispTelecom, true);
  写入字段值('customPath', 配置.d);
  写入字段值('customIP', 配置.p);
  写入字段值('yx', 配置.yx);
  写入字段值('yxURL', 配置.yxURL);
  写入字段值('socksConfig', 配置.s);
  写入字段值('customHomepage', 配置.homepage);
  写入字段值('apiEnabled', 配置.ae);
  写入字段值('regionMatching', 配置.rm);
  写入字段值('downgradeControl', 配置.qj);
  写入字段值('portControl', 配置.dkby);
  写入字段值('preferredControl', 配置.yxby);
  同步联动界面状态();
}

function 收集界面配置() {
  const 配置 = {
    wk: 读取字段值('wkRegion'),
    ev: 读取开关值('ev', true),
    et: 读取开关值('et', false),
    ex: 读取开关值('ex', false),
    ech: 读取开关值('ech', false),
    tp: 读取字段值('tp'),
    customDNS: 读取字段值('customDNS'),
    customECHDomain: 读取字段值('customECHDomain'),
    alpn: 读取字段值('alpn'),
    d: 读取字段值('customPath'),
    p: 读取字段值('customIP'),
    yx: 读取字段值('yx'),
    yxURL: 读取字段值('yxURL'),
    s: 读取字段值('socksConfig'),
    homepage: 读取字段值('customHomepage'),
    scu: 读取字段值('scu'),
    ena: 读取开关值('ena', false),
    jk: 读取开关值('jk', false),
    pvl: 读取开关值('pvl', false),
    pvlURL: 读取字段值('pvlURL'),
    pvlmin: 读取字段值('pvlmin'),
    pvlmax: 读取字段值('pvlmax'),
    pvllimit: 读取字段值('pvllimit'),
    pvlcountry: 读取字段值('pvlcountry'),
    pvlproto: 读取字段值('pvlproto'),
    pvlraw: 读取开关值('pvlraw', true),
    epd: 读取开关值('epd', true),
    epi: 读取开关值('epi', true),
    egi: 读取开关值('egi', true),
    ae: 读取字段值('apiEnabled'),
    rm: 读取字段值('regionMatching'),
    qj: 读取字段值('downgradeControl'),
    dkby: 读取字段值('portControl'),
    yxby: 读取字段值('preferredControl'),
    ipv4: 读取开关值('ipv4Enabled', true),
    ipv6: 读取开关值('ipv6Enabled', true),
    ispMobile: 读取开关值('ispMobile', true),
    ispUnicom: 读取开关值('ispUnicom', true),
    ispTelecom: 读取开关值('ispTelecom', true)
  };
  if (配置.ev === 'no' && 配置.et === 'no' && 配置.ex === 'no') {
    配置.ev = 'yes';
    写入开关值('ev', 'yes', true);
  }
  if (配置.ech === 'yes') {
    配置.dkby = 'yes';
    写入字段值('portControl', 'yes');
  }
  return 配置;
}

async function 加载当前配置() {
  const 接口网址20117 = window.location.pathname + '/api/config';
  try {
    const 响应20116 = await fetch(接口网址20117);
    if (响应20116.status === 503) {
      document.getElementById('currentConfig').textContent = 'KV存储未配置，无法加载配置';
      return;
    }
    if (!响应20116.ok) {
      const 错误文本20115 = await 响应20116.text();
      document.getElementById('currentConfig').textContent = '加载配置失败: ' + 错误文本20115;
      return;
    }
    const 配置 = await 响应20116.json();

    // 过滤掉内部字段 kvEnabled
    const 显示配置 = {};
    for (const [键20114, 值20113] of Object.entries(配置)) {
      if (键20114 !== 'kvEnabled') {
        显示配置[键20114] = 值20113;
      }
    }
    let 配置文本 = '当前配置:\\n';
    if (Object.keys(显示配置).length === 0) {
      配置文本 += '(暂无配置)';
    } else {
      for (const [键, 值20112] of Object.entries(显示配置)) {
        配置文本 += 键 + ': ' + (值20112 || '(未设置)') + '\\n';
      }
    }
    document.getElementById('currentConfig').textContent = 配置文本;

    应用配置到界面(配置);
  } catch (错误20111) {
    document.getElementById('currentConfig').textContent = '加载配置失败: ' + 错误20111.message;
  }
}

// 更新路径类型显示
function 更新路径类型状态(自定义路径) {
  const 路径类型状态 = document.getElementById('pathTypeStatus');
  const 当前网址20110 = window.location.href;
  const 路径部分列表 = window.location.pathname.split('/').filter(参数值20109 => 参数值20109);
  const 当前路径 = 路径部分列表.length > 0 ? 路径部分列表[0] : '';
  if (自定义路径 && 自定义路径.trim()) {
    // 使用自定义路径 (d)
    路径类型状态.innerHTML = '<div style="color: #00ff9d;">使用类型: <strong>自定义路径 (d)</strong></div>' + '<div style="margin-top: 5px; color: #00f0ff;">当前路径: <span style="color: #ffb400;">' + 自定义路径 + '</span></div>' + '<div style="margin-top: 5px; font-size: 0.9rem; color: #7aa9c4;">访问地址: ' + (当前网址20110.split('/')[0] + '//' + 当前网址20110.split('/')[2]) + 自定义路径 + '/sub</div>';
  } else {
    // 使用 UUID (u)
    路径类型状态.innerHTML = '<div style="color: #00ff9d;">使用类型: <strong>UUID 路径 (u)</strong></div>' + '<div style="margin-top: 5px; color: #00f0ff;">当前路径: <span style="color: #ffb400;">' + (当前路径 || '(UUID)') + '</span></div>' + '<div style="margin-top: 5px; font-size: 0.9rem; color: #7aa9c4;">访问地址: ' + 当前网址20110.split('/sub')[0] + '/sub</div>';
  }
}

// 更新wk地区选择的启用/禁用状态
function 更新工作器地区状态() {
  const 自定义地址输入20108 = document.getElementById('customIP');
  const 值地区 = document.getElementById('wkRegion');
  const 值地区值 = document.getElementById('wkRegionHint');
  if (自定义地址输入20108 && 值地区) {
    const 是否有自定义地址 = 自定义地址输入20108.value.trim() !== '';
    值地区.disabled = 是否有自定义地址;

    // 添加视觉反馈
    if (是否有自定义地址) {
      值地区.style.opacity = '0.5';
      值地区.style.cursor = 'not-allowed';
      值地区.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      // 显示提示信息
      if (值地区值) {
        值地区值.style.display = 'block';
        值地区值.style.color = '#ffb400';
      }
    } else {
      值地区.style.opacity = '1';
      值地区.style.cursor = 'pointer';
      值地区.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      // 隐藏提示信息
      if (值地区值) {
        值地区值.style.display = 'none';
      }
    }
  }
}
async function 保存配置(配置数据20107) {
  const 接口网址 = window.location.pathname + '/api/config';
  try {
    const 响应20106 = await fetch(接口网址, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(配置数据20107)
    });
    if (响应20106.status === 503) {
      显示状态('KV存储未配置，无法保存配置。请先在Cloudflare Workers中配置KV存储。', 'error');
      return;
    }
    if (!响应20106.ok) {
      const 错误文本20105 = await 响应20106.text();

      // 尝试解析 JSON 错误信息
      try {
        const 错误数据20104 = JSON.parse(错误文本20105);
        显示状态(错误数据20104.message || '保存失败', 'error');
      } catch (解析错误20103) {
        // 如果不是 JSON，直接显示文本
        显示状态('保存失败: ' + 错误文本20105, 'error');
      }
      return;
    }
    const 结果20102 = await 响应20106.json();
    显示状态(结果20102.message, 结果20102.success ? 'success' : 'error');
    if (结果20102.success) {
      await 加载当前配置();
      // 更新wk地区选择状态
      更新工作器地区状态();
      // 保存成功后刷新页面以更新系统状态
      setTimeout(function () {
        window.location.reload();
      }, 1500);
    } else {}
  } catch (错误20101) {
    显示状态('保存失败: ' + 错误20101.message, 'error');
  }
}
function 显示状态(消息20100, 类型20099) {
  const 状态值 = document.getElementById('statusMessage');
  if (状态值) {
    状态值.textContent = 消息20100;
    状态值.style.display = 'block';
    状态值.style.color = 类型20099 === 'success' ? '#00f0ff' : '#ff3860';
    状态值.style.borderColor = 类型20099 === 'success' ? '#00f0ff' : '#ff3860';
    setTimeout(function () {
      状态值.style.display = 'none';
    }, 3000);
  }
  // 同步在底部操作条上方弹出霓虹反馈
  if (typeof window.显示操作状态 === 'function') {
    window.显示操作状态(消息20100, 类型20099 === 'success' ? 'ok' : 'err');
  }
}
async function 重置全部配置() {
  if (confirm('确定要重置所有配置吗？这将清空所有KV配置，恢复为环境变量设置。')) {
    try {
      const 响应20098 = await fetch(window.location.pathname + '/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wk: '',
          d: '',
          p: '',
          yx: '',
          yxURL: '',
          s: '',
          ae: '',
          rm: '',
          qj: '',
          dkby: '',
          yxby: '',
          ev: '',
          et: '',
          ex: '',
          ech: '',
          tp: '',
          customDNS: '',
          customECHDomain: '',
          scu: '',
          epd: '',
          epi: '',
          egi: '',
          ipv4: '',
          ipv6: '',
          ispMobile: '',
          ispUnicom: '',
          ispTelecom: '',
          homepage: '',
          alpn: ''
        })
      });
      if (响应20098.status === 503) {
        显示状态('KV存储未配置，无法重置配置。', 'error');
        return;
      }
      if (!响应20098.ok) {
        const 错误文本 = await 响应20098.text();

        // 尝试解析 JSON 错误信息
        try {
          const 错误数据 = JSON.parse(错误文本);
          显示状态(错误数据.message || '重置失败', 'error');
        } catch (解析错误) {
          // 如果不是 JSON，直接显示文本
          显示状态('重置失败: ' + 错误文本, 'error');
        }
        return;
      }
      const 结果20097 = await 响应20098.json();
      显示状态(结果20097.message || '配置已重置', 结果20097.success ? 'success' : 'error');
      if (结果20097.success) {
        await 加载当前配置();
        // 更新wk地区选择状态
        更新工作器地区状态();
        // 刷新页面以更新系统状态
        setTimeout(function () {
          window.location.reload();
        }, 1500);
      }
    } catch (错误20096) {
      显示状态('重置失败: ' + 错误20096.message, 'error');
    }
  }
}
async function 检查加密问候状态() {
  const 加密客户端问候状态值 = document.getElementById('echStatus');
  if (!加密客户端问候状态值) return;
  try {
    const 当前网址 = window.location.href;
    const 订阅网址 = 当前网址 + '/sub';
    加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #ffb400;">检测中...</span>';
    const 响应20095 = await fetch(订阅网址, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    });
    const 加密客户端问候状态头部 = 响应20095.headers.get('X-ECH-Status');
    const 加密客户端问候配置长度 = 响应20095.headers.get('X-ECH-Config-Length');
    if (加密客户端问候状态头部 === 'ENABLED') {
      加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #00ff9d;">✅ 已启用' + (加密客户端问候配置长度 ? ' (配置长度: ' + 加密客户端问候配置长度 + ')' : '') + '</span>';
    } else {
      加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #ffb400;">⚠️ 未启用</span>';
    }
  } catch (错误20094) {
    加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #ff3860;">❌ 检测失败: ' + 错误20094.message + '</span>';
  }
}
document.addEventListener('DOMContentLoaded', function () {
  创建矩阵雨();
  检查系统状态();
  检查键值状态();
  检查加密问候状态();

  // ECH 开启时自动联动开启仅TLS
  const 加密客户端问候复选框 = document.getElementById('ech');
  const 端口控制 = document.getElementById('portControl');
  if (加密客户端问候复选框 && 端口控制) {
    加密客户端问候复选框.addEventListener('change', function () {
      if (this.checked) {
        // ECH 开启时，自动设置仅TLS为 yes
        端口控制.value = 'yes';
      }
      同步联动界面状态();
    });

    // 页面加载时，如果 ECH 已勾选，也自动设置仅TLS
    if (加密客户端问候复选框.checked) {
      端口控制.value = 'yes';
    }
  }

  // 监听customIP输入框变化，实时更新wk地区选择状态
  const 自定义地址输入 = document.getElementById('customIP');
  if (自定义地址输入) {
    自定义地址输入.addEventListener('input', function () {
      同步联动界面状态();
    });
  }


  const 自定义路径输入 = document.getElementById('customPath');
  if (自定义路径输入) {
    自定义路径输入.addEventListener('input', function () {
      同步联动界面状态();
    });
  }

  ['ev', 'et', 'ex'].forEach(function (协议标识) {
    const 协议开关 = document.getElementById(协议标识);
    if (协议开关) {
      协议开关.addEventListener('change', function () {
        同步联动界面状态();
      });
    }
  });

  // 阻止表单默认提交（保存按钮已统一到底部操作条）
  ['regionForm', 'otherConfigForm', 'advancedConfigForm'].forEach(function (本地值20093) {
    const 表单值 = document.getElementById(本地值20093);
    if (表单值) 表单值.addEventListener('submit', function (事件值20092) {
      事件值20092.preventDefault();
    });
  });

  // 在任意输入框按下回车，触发统一保存
  document.querySelectorAll('#configContent input[type="text"], #configContent input[type="number"]').forEach(function (本地值20091) {
    本地值20091.addEventListener('keydown', function (事件值20090) {
      if (事件值20090.key === 'Enter') {
        事件值20090.preventDefault();
        保存全部配置();
      }
    });
  });

  // 统一保存：一次性收齐所有字段
  function 收集全部配置() {
    return 收集界面配置();
  }
  async function 保存全部配置() {
    // 至少启用一个通道
    const 值值20085 = document.getElementById('ev'),
      值值20084 = document.getElementById('et'),
      值值20083 = document.getElementById('ex');
    if (值值20085 && 值值20084 && 值值20083 && !值值20085.checked && !值值20084.checked && !值值20083.checked) {
      显示操作状态('${是否值236 ? 解码64('2K3Yr9in2YLZhCDbjNqpINm+2LHZiNiq2qnZhCDYsdinINmB2LnYp9mEINqp2YbbjNivIQ==') : 解码64('6Iez5bCR6ZyA6KaB5ZCv55So5LiA5Liq5Y2P6K6u77yB')}', 'err');
      显示提示('${是否值236 ? 解码64('2K3Yr9in2YLZhCDbjNqpINm+2LHZiNiq2qnZhCDYsdinINmB2LnYp9mEINqp2YbbjNivIQ==') : 解码64('6Iez5bCR6ZyA6KaB5ZCv55So5LiA5Liq5Y2P6K6u77yB')}', 'warn');
      return;
    }
    const 本地值20082 = document.getElementById('cpBtnSaveAll');
    if (本地值20082) {
      本地值20082.classList.add('cp-action-btn-saving');
      本地值20082.disabled = true;
    }
    try {
      await 保存配置(收集全部配置());
    } finally {
      if (本地值20082) {
        本地值20082.classList.remove('cp-action-btn-saving');
        本地值20082.disabled = false;
      }
    }
  }
  window.保存全部配置 = 保存全部配置;
  function 显示操作状态(消息, 类型) {
    const 本地值20081 = document.getElementById('cpActionStatus');
    if (!本地值20081) return;
    本地值20081.textContent = 消息;
    本地值20081.classList.toggle('cp-err', 类型 === 'err');
    本地值20081.classList.add('cp-show');
    clearTimeout(显示操作状态._t);
    显示操作状态._t = setTimeout(function () {
      本地值20081.classList.remove('cp-show');
    }, 2400);
  }
  window.显示操作状态 = 显示操作状态;

  // 绑定底部统一操作条
  const 值操作值 = document.getElementById('cpActionBar');
  const 值值保存值 = document.getElementById('cpBtnSaveAll');
  if (值值保存值) 值值保存值.addEventListener('click', async function () {
    值值保存值.classList.add('cp-action-btn-saving');
    try {
      await 保存全部配置();
      if (值操作值) 值操作值.classList.remove('cp-dirty');
    } finally {
      值值保存值.classList.remove('cp-action-btn-saving');
    }
  });
  const 值值值20080 = document.getElementById('cpBtnRefresh');
  if (值值值20080) 值值值20080.addEventListener('click', async function () {
    值值值20080.classList.add('cp-action-btn-saving');
    try {
      await 加载当前配置();
      if (值操作值) 值操作值.classList.remove('cp-dirty');
      显示操作状态('${是否值236 ? 'تنظیمات تازه‌سازی شد' : '配置已刷新'}');
    } finally {
      值值值20080.classList.remove('cp-action-btn-saving');
    }
  });
  const 值值重置 = document.getElementById('cpBtnReset');
  if (值值重置) 值值重置.addEventListener('click', 重置全部配置);

  // 修改字段时把 FAB 标记为 "未保存"
  function 标记已修改() {
    if (值操作值) 值操作值.classList.add('cp-dirty');
  }
  const 已修改范围 = document.getElementById('configContent') || document;
  ['input', 'change'].forEach(function (本地值20079) {
    已修改范围.addEventListener(本地值20079, function (事件值20078) {
      const 本地值20077 = 事件值20078.target;
      if (!本地值20077 || !本地值20077.tagName) return;
      const 本地值20076 = 本地值20077.tagName.toLowerCase();
      if (本地值20076 === 'input' || 本地值20076 === 'select' || 本地值20076 === 'textarea') {
        // 跳过延迟测试相关输入，避免误触
        if (本地值20077.id && /^(latencyTestInput|fetchURLInput|latencyTestPort|randomIPCount|testThreads|ipSourceSelect)$/.test(本地值20077.id)) return;
        标记已修改();
      }
    });
  });

  // Ctrl+S / Cmd+S 触发保存
  window.addEventListener('keydown', function (事件值20075) {
    if ((事件值20075.ctrlKey || 事件值20075.metaKey) && (事件值20075.key === 's' || 事件值20075.key === 'S')) {
      事件值20075.preventDefault();
      if (值值保存值 && !值值保存值.classList.contains('cp-action-btn-saving')) {
        值值保存值.click();
      }
    }
  });
  let 测试值控制器 = null;
  let 测试结果列表 = [];
  const 开始测试值 = document.getElementById('startLatencyTest');
  const 值测试值 = document.getElementById('stopLatencyTest');
  const 测试状态 = document.getElementById('latencyTestStatus');
  const 测试结果列表值 = document.getElementById('latencyTestResults');
  const 结果列表列表 = document.getElementById('latencyResultsList');
  const 覆盖已选值 = document.getElementById('overwriteSelectedToYx');
  const 追加已选值 = document.getElementById('appendSelectedToYx');
  const 选择值值 = document.getElementById('selectAllResults');
  const 值值值 = document.getElementById('deselectAllResults');
  const 地址源选择 = document.getElementById('ipSourceSelect');
  const 手动输入值 = document.getElementById('manualInputDiv');
  const 网址获取值 = document.getElementById('urlFetchDiv');
  const 延迟测试输入 = document.getElementById('latencyTestInput');
  const 获取网址输入 = document.getElementById('fetchURLInput');
  const 延迟测试端口 = document.getElementById('latencyTestPort');
  const 随机地址数量 = document.getElementById('randomIPCount');
  const 云墙随机值 = document.getElementById('cfRandomDiv');
  const 随机数量值 = document.getElementById('randomCountDiv');
  const 生成云墙地址值 = document.getElementById('generateCFIPBtn');
  const 获取地址值 = document.getElementById('fetchIPBtn');
  if (延迟测试输入) {
    const 已保存测试输入 = localStorage.getItem('latencyTestInput');
    if (已保存测试输入) 延迟测试输入.value = 已保存测试输入;
    延迟测试输入.addEventListener('input', function () {
      localStorage.setItem('latencyTestInput', this.value);
    });
  }
  if (获取网址输入) {
    const 已保存获取网址 = localStorage.getItem('fetchURLInput');
    if (已保存获取网址) 获取网址输入.value = 已保存获取网址;
    获取网址输入.addEventListener('input', function () {
      localStorage.setItem('fetchURLInput', this.value);
    });
  }
  if (延迟测试端口) {
    const 已保存端口 = localStorage.getItem('latencyTestPort');
    if (已保存端口) 延迟测试端口.value = 已保存端口;
    延迟测试端口.addEventListener('input', function () {
      localStorage.setItem('latencyTestPort', this.value);
    });
  }
  if (随机地址数量) {
    const 已保存数量 = localStorage.getItem('randomIPCount');
    if (已保存数量) 随机地址数量.value = 已保存数量;
    随机地址数量.addEventListener('input', function () {
      localStorage.setItem('randomIPCount', this.value);
    });
    // 初始化时，如果默认是隐藏的，则禁用输入框
    if (随机数量值 && 随机数量值.style.display === 'none') {
      随机地址数量.disabled = true;
    }
  }
  const 测试线程数输入 = document.getElementById('testThreads');
  if (测试线程数输入) {
    const 已保存线程数 = localStorage.getItem('testThreads');
    if (已保存线程数) 测试线程数输入.value = 已保存线程数;
    测试线程数输入.addEventListener('input', function () {
      localStorage.setItem('testThreads', this.value);
    });
  }
  if (地址源选择) {
    const 已保存源 = localStorage.getItem('ipSourceSelect');
    const 当前源 = 已保存源 || 地址源选择.value || 'manual';
    if (已保存源) {
      地址源选择.value = 已保存源;
    }
    手动输入值.style.display = 当前源 === 'manual' ? 'block' : 'none';
    网址获取值.style.display = 当前源 === 'urlFetch' ? 'block' : 'none';
    云墙随机值.style.display = 当前源 === 'cfRandom' ? 'block' : 'none';
    随机数量值.style.display = 当前源 === 'cfRandom' ? 'block' : 'none';
    // 当隐藏时禁用输入框，避免表单验证错误
    if (随机地址数量) {
      随机地址数量.disabled = 当前源 !== 'cfRandom';
    }
  }
  const 云墙网段列表 = ['173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'];
  function 从网段生成随机地址(网段20074) {
    const [基础地址, 前缀长度] = 网段20074.split('/');
    const 前缀 = parseInt(前缀长度);
    const 主机值 = 32 - 前缀;
    const 地址部分列表 = 基础地址.split('.').map(参数值20073 => parseInt(参数值20073));
    const 地址值 = 地址部分列表[0] << 24 | 地址部分列表[1] << 16 | 地址部分列表[2] << 8 | 地址部分列表[3];
    const 随机偏移 = Math.floor(Math.random() * Math.pow(2, 主机值));
    const 掩码 = 0xFFFFFFFF << 主机值 >>> 0;
    const 随机地址 = ((地址值 & 掩码) >>> 0) + 随机偏移 >>> 0;
    return [随机地址 >>> 24 & 0xFF, 随机地址 >>> 16 & 0xFF, 随机地址 >>> 8 & 0xFF, 随机地址 & 0xFF].join('.');
  }
  function 生成云墙随机地址(数量20072, 端口20071) {
    const 地址列表20070 = [];
    for (let 索引值20069 = 0; 索引值20069 < 数量20072; 索引值20069++) {
      const 网段 = 云墙网段列表[Math.floor(Math.random() * 云墙网段列表.length)];
      const 地址20068 = 从网段生成随机地址(网段);
      地址列表20070.push(地址20068 + ':' + 端口20071);
    }
    return 地址列表20070;
  }
  if (地址源选择) {
    地址源选择.addEventListener('change', function () {
      const 值 = this.value;
      localStorage.setItem('ipSourceSelect', 值);
      手动输入值.style.display = 值 === 'manual' ? 'block' : 'none';
      网址获取值.style.display = 值 === 'urlFetch' ? 'block' : 'none';
      云墙随机值.style.display = 值 === 'cfRandom' ? 'block' : 'none';
      随机数量值.style.display = 值 === 'cfRandom' ? 'block' : 'none';
      // 当隐藏时禁用输入框，避免表单验证错误
      if (随机地址数量) {
        随机地址数量.disabled = 值 !== 'cfRandom';
      }
    });
  }
  if (生成云墙地址值) {
    生成云墙地址值.addEventListener('click', function () {
      const 数量 = parseInt(document.getElementById('randomIPCount').value) || 20;
      const 端口20067 = document.getElementById('latencyTestPort').value || '443';
      const 地址列表 = 生成云墙随机地址(数量, 端口20067);
      document.getElementById('latencyTestInput').value = 地址列表.join(',');
      手动输入值.style.display = 'block';
      显示状态('${是否值236 ? 'تولید شد' : '已生成'} ' + 数量 + ' ${是否值236 ? 'IP تصادفی CF' : '个CF随机IP'}', 'success');
    });
  }
  if (获取地址值) {
    获取地址值.addEventListener('click', async function () {
      const 网址输入 = document.getElementById('fetchURLInput');
      const 获取网址 = 网址输入.value.trim();
      if (!获取网址) {
        显示提示('${是否值236 ? 'لطفا URL را وارد کنید' : '请输入URL'}', 'warn');
        return;
      }
      获取地址值.disabled = true;
      获取地址值.textContent = '${是否值236 ? 'در حال دریافت...' : '获取中...'}';
      try {
        // 支持多个 URL（逗号分隔）以及返回内容中逗号分隔的多个 IP/节点
        const 网址列表 = Array.from(new Set(获取网址.split(',').map(网址值20066 => 网址值20066.trim()).filter(网址值20065 => 网址值20065)));
        const 值项目列表 = [];
        for (const 网址值 of 网址列表) {
          const 响应 = await fetch(网址值);
          if (!响应.ok) {
            throw new Error('HTTP ' + 响应.status + ' @ ' + 网址值);
          }
          const 文本20064 = await 响应.text();

          // 先按行分割，再在每行内按逗号分割，兼容“多行 + 逗号分隔”两种格式
          const 值网址项目列表 = 文本20064.split(/\\r?\\n/).map(行值20063 => 行值20063.trim()).filter(行值20062 => 行值20062 && !行值20062.startsWith('#')).flatMap(行值 => 行值.split(',').map(参数值20061 => 参数值20061.trim()).filter(参数值 => 参数值));
          值项目列表.push(...值网址项目列表);
        }
        if (值项目列表.length > 0) {
          document.getElementById('latencyTestInput').value = 值项目列表.join(',');
          手动输入值.style.display = 'block';
          显示状态('${是否值236 ? 'دریافت شد' : '已获取'} ' + 值项目列表.length + ' ${是否值236 ? 'IP' : '个IP'}', 'success');
        } else {
          显示状态('${是否值236 ? 'داده‌ای یافت نشد' : '未获取到数据'}', 'error');
        }
      } catch (错误20060) {
        显示状态('${是否值236 ? 'خطا در دریافت' : '获取失败'}: ' + 错误20060.message, 'error');
      } finally {
        获取地址值.disabled = false;
        获取地址值.textContent = '⬇ ${是否值236 ? 'دریافت IP' : '获取IP'}';
      }
    });
  }
  if (开始测试值) {
    开始测试值.addEventListener('click', async function () {
      const 输入值20059 = document.getElementById('latencyTestInput');
      const 端口值 = document.getElementById('latencyTestPort');
      const 线程数值 = document.getElementById('testThreads');
      const 输入值 = 输入值20059.value.trim();
      const 默认端口 = 端口值.value || '443';
      const 线程数 = parseInt(线程数值.value) || 5;
      if (!输入值) {
        显示状态('${是否值236 ? 'لطفا IP یا دامنه وارد کنید' : '请输入IP或域名'}', 'error');
        return;
      }
      const 本地值20058 = 输入值.split(',').map(翻译值20057 => 翻译值20057.trim()).filter(翻译值20056 => 翻译值20056);
      if (本地值20058.length === 0) return;
      开始测试值.style.display = 'none';
      值测试值.style.display = 'inline-block';
      测试状态.style.display = 'block';
      测试结果列表值.style.display = 'block';
      结果列表列表.innerHTML = '';
      测试结果列表 = [];
      if (城市筛选值) {
        城市筛选值.style.display = 'none';
      }
      测试值控制器 = new AbortController();
      let 本地值20055 = 0;
      const 本地值20054 = 本地值20058.length;
      function 解析目标(目标20053) {
        let 主机20052 = 目标20053;
        let 端口20051 = 默认端口;
        let 节点名称20050 = '';
        if (目标20053.includes('#')) {
          const 部分列表20049 = 目标20053.split('#');
          节点名称20050 = 部分列表20049[1] || '';
          主机20052 = 部分列表20049[0];
        }
        if (主机20052.includes(':') && !主机20052.startsWith('[')) {
          const 值值20048 = 主机20052.lastIndexOf(':');
          const 值端口 = 主机20052.substring(值值20048 + 1);
          if (/^[0-9]+$/.test(值端口)) {
            端口20051 = 值端口;
            主机20052 = 主机20052.substring(0, 值值20048);
          }
        } else if (主机20052.includes(']:')) {
          const 部分列表20047 = 主机20052.split(']:');
          主机20052 = 部分列表20047[0] + ']';
          端口20051 = 部分列表20047[1];
        }
        return {
          host: 主机20052,
          port: 端口20051,
          nodeName: 节点名称20050
        };
      }
      function 渲染结果(结果20046, 索引20045, 值值20044 = true) {
        // 只展示在线优选成功的结果，失败/超时的不再显示
        if (!结果20046.success) {
          return null;
        }
        const 结果项目 = document.createElement('div');
        结果项目.style.cssText = 'display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #003300; gap: 10px;';
        结果项目.dataset.index = 索引20045;
        结果项目.dataset.colo = 结果20046.colo || '';
        if (!值值20044) {
          结果项目.style.display = 'none';
        }
        const 复选框20043 = document.createElement('input');
        复选框20043.type = 'checkbox';
        复选框20043.checked = true;
        复选框20043.disabled = false;
        复选框20043.dataset.index = 索引20045;
        复选框20043.style.cssText = 'width: 18px; height: 18px; cursor: pointer;';
        const 本地值20042 = document.createElement('div');
        本地值20042.style.cssText = 'flex: 1; font-family: monospace; font-size: 13px;';
        const 机房名称20041 = 结果20046.colo ? 获取机房名称(结果20046.colo) : '';
        const 机房显示 = 机房名称20041 ? ' <span style="color: #00aaff;">[' + 机房名称20041 + ']</span>' : '';
        本地值20042.innerHTML = '<span style="color: #00f0ff;">' + 结果20046.host + ':' + 结果20046.port + '</span>' + 机房显示 + ' <span style="color: #ffff00;">' + 结果20046.latency + 'ms</span>';
        结果项目.appendChild(复选框20043);
        结果项目.appendChild(本地值20042);
        结果列表列表.appendChild(结果项目);
        return 结果项目;
      }
      async function 测试单项(目标) {
        if (测试值控制器.signal.aborted) return null;
        const {
          host: 主机20040,
          port: 端口20039,
          nodeName: 节点名称
        } = 解析目标(目标);
        const 结果20038 = await 测试延迟(主机20040, 端口20039, 测试值控制器.signal);
        结果20038.host = 主机20040;
        结果20038.port = 端口20039;
        结果20038.nodeName = 结果20038.success && 结果20038.colo ? 节点名称 || 'CF-' + 结果20038.colo : 节点名称 || 主机20040;
        return 结果20038;
      }
      for (let 索引值20037 = 0; 索引值20037 < 本地值20054; 索引值20037 += 线程数) {
        if (测试值控制器.signal.aborted) break;
        const 本地值20036 = 本地值20058.slice(索引值20037, Math.min(索引值20037 + 线程数, 本地值20054));
        测试状态.textContent = '${是否值236 ? 'در حال تست' : '测试中'}: ' + (索引值20037 + 1) + '-' + Math.min(索引值20037 + 线程数, 本地值20054) + '/' + 本地值20054 + ' (${是否值236 ? 'رشته‌ها' : '线程'}: ' + 线程数 + ')';
        const 结果列表 = await Promise.all(本地值20036.map(翻译值 => 测试单项(翻译值)));
        for (const 结果20035 of 结果列表) {
          if (结果20035) {
            const 索引20034 = 测试结果列表.length;
            测试结果列表.push(结果20035);
            渲染结果(结果20035, 索引20034);
            本地值20055++;
          }
        }
      }
      测试状态.textContent = '${是否值236 ? 'تست کامل شد' : '测试完成'}: ' + 本地值20055 + '/' + 本地值20054;
      开始测试值.style.display = 'inline-block';
      值测试值.style.display = 'none';

      // 更新城市选择器
      更新城市筛选();
    });
  }
  if (值测试值) {
    值测试值.addEventListener('click', function () {
      if (测试值控制器) {
        测试值控制器.abort();
      }
      开始测试值.style.display = 'inline-block';
      值测试值.style.display = 'none';
      测试状态.textContent = '${是否值236 ? 'تست متوقف شد' : '测试已停止'}';
    });
  }
  if (选择值值) {
    选择值值.addEventListener('click', function () {
      const 本地值20033 = 结果列表列表.querySelectorAll('input[type="checkbox"]:not(:disabled)');
      本地值20033.forEach(本地值20032 => 本地值20032.checked = true);
    });
  }
  if (值值值) {
    值值值.addEventListener('click', function () {
      const 本地值20031 = 结果列表列表.querySelectorAll('input[type="checkbox"]');
      本地值20031.forEach(本地值20030 => 本地值20030.checked = false);
    });
  }

  // 获取选中项的通用函数
  function 获取已选项目() {
    const 本地值20029 = 结果列表列表.querySelectorAll('input[type="checkbox"]:checked');
    if (本地值20029.length === 0) {
      显示状态('${是否值236 ? 'لطفا حداقل یک مورد انتخاب کنید' : '请至少选择一项'}', 'error');
      return null;
    }
    const 已选项目列表20028 = [];
    本地值20029.forEach(本地值20027 => {
      const 索引20026 = parseInt(本地值20027.dataset.index);
      const 结果20025 = 测试结果列表[索引20026];
      if (结果20025 && 结果20025.success) {
        const 机房名称 = 结果20025.colo ? 获取机房名称(结果20025.colo) : 结果20025.nodeName;
        const 项目字符串 = 结果20025.host + ':' + 结果20025.port + '#' + 机房名称;
        已选项目列表20028.push(项目字符串);
      }
    });
    return 已选项目列表20028;
  }

  // 覆盖添加
  if (覆盖已选值) {
    覆盖已选值.addEventListener('click', async function () {
      const 已选项目列表20024 = 获取已选项目();
      if (!已选项目列表20024 || 已选项目列表20024.length === 0) return;
      const 值输入20023 = document.getElementById('yx');
      const 新值20022 = 已选项目列表20024.join(',');
      值输入20023.value = 新值20022;
      覆盖已选值.disabled = true;
      追加已选值.disabled = true;
      覆盖已选值.textContent = '${是否值236 ? 'در حال ذخیره...' : '保存中...'}';
      try {
        const 配置数据20021 = {
          customIP: document.getElementById('customIP').value,
          yx: 新值20022,
          yxURL: document.getElementById('yxURL').value,
          s: document.getElementById('socksConfig').value
        };
        await 保存配置(配置数据20021);
        显示状态('${是否值236 ? 'موفقیت‌آمیز بود' : '已覆盖'} ' + 已选项目列表20024.length + ' ${是否值236 ? 'مورد و ذخیره شد' : '项并已保存'}', 'success');
      } catch (错误20020) {
        显示状态('${是否值236 ? 'خطا در ذخیره' : '保存失败'}: ' + 错误20020.message, 'error');
      } finally {
        覆盖已选值.disabled = false;
        追加已选值.disabled = false;
        覆盖已选值.textContent = '${是否值236 ? '覆盖添加' : '覆盖添加'}';
      }
    });
  }

  // 追加添加
  if (追加已选值) {
    追加已选值.addEventListener('click', async function () {
      const 已选项目列表 = 获取已选项目();
      if (!已选项目列表 || 已选项目列表.length === 0) return;
      const 值输入 = document.getElementById('yx');
      const 当前值 = 值输入.value.trim();
      const 新项目列表 = 已选项目列表.join(',');
      const 新值 = 当前值 ? 当前值 + ',' + 新项目列表 : 新项目列表;
      值输入.value = 新值;
      覆盖已选值.disabled = true;
      追加已选值.disabled = true;
      追加已选值.textContent = '${是否值236 ? 'در حال ذخیره...' : '保存中...'}';
      try {
        const 配置数据 = {
          customIP: document.getElementById('customIP').value,
          yx: 新值,
          yxURL: document.getElementById('yxURL').value,
          s: document.getElementById('socksConfig').value
        };
        await 保存配置(配置数据);
        显示状态('${是否值236 ? 'موفقیت‌آمیز بود' : '已追加'} ' + 已选项目列表.length + ' ${是否值236 ? 'مورد و ذخیره شد' : '项并已保存'}', 'success');
      } catch (错误20019) {
        显示状态('${是否值236 ? 'خطا در ذخیره' : '保存失败'}: ' + 错误20019.message, 'error');
      } finally {
        覆盖已选值.disabled = false;
        追加已选值.disabled = false;
        追加已选值.textContent = '${是否值236 ? '追加添加' : '追加添加'}';
      }
    });
  }
  function 地址转十六进制(地址) {
    const 部分列表 = 地址.split('.');
    if (部分列表.length !== 4) return null;
    let 十六进制 = '';
    for (let 索引值 = 0; 索引值 < 4; 索引值++) {
      const 数字 = parseInt(部分列表[索引值]);
      if (isNaN(数字) || 数字 < 0 || 数字 > 255) return null;
      十六进制 += 数字.toString(16).padStart(2, '0');
    }
    return 十六进制;
  }
  const 机房映射 = {
    'SJC': '🇺🇸 圣何塞',
    'LAX': '🇺🇸 洛杉矶',
    'SEA': '🇺🇸 西雅图',
    'SFO': '🇺🇸 旧金山',
    'DFW': '🇺🇸 达拉斯',
    'ORD': '🇺🇸 芝加哥',
    'IAD': '🇺🇸 华盛顿',
    'ATL': '🇺🇸 亚特兰大',
    'MIA': '🇺🇸 迈阿密',
    'DEN': '🇺🇸 丹佛',
    'PHX': '🇺🇸 凤凰城',
    'BOS': '🇺🇸 波士顿',
    'EWR': '🇺🇸 纽瓦克',
    'JFK': '🇺🇸 纽约',
    'LAS': '🇺🇸 拉斯维加斯',
    'MSP': '🇺🇸 明尼阿波利斯',
    'DTW': '🇺🇸 底特律',
    'PHL': '🇺🇸 费城',
    'CLT': '🇺🇸 夏洛特',
    'SLC': '🇺🇸 盐湖城',
    'PDX': '🇺🇸 波特兰',
    'SAN': '🇺🇸 圣地亚哥',
    'TPA': '🇺🇸 坦帕',
    'IAH': '🇺🇸 休斯顿',
    'MCO': '🇺🇸 奥兰多',
    'AUS': '🇺🇸 奥斯汀',
    'BNA': '🇺🇸 纳什维尔',
    'RDU': '🇺🇸 罗利',
    'IND': '🇺🇸 印第安纳波利斯',
    'CMH': '🇺🇸 哥伦布',
    'MCI': '🇺🇸 堪萨斯城',
    'OMA': '🇺🇸 奥马哈',
    'ABQ': '🇺🇸 阿尔伯克基',
    'OKC': '🇺🇸 俄克拉荷马城',
    'MEM': '🇺🇸 孟菲斯',
    'JAX': '🇺🇸 杰克逊维尔',
    'RIC': '🇺🇸 里士满',
    'BUF': '🇺🇸 布法罗',
    'PIT': '🇺🇸 匹兹堡',
    'CLE': '🇺🇸 克利夫兰',
    'CVG': '🇺🇸 辛辛那提',
    'MKE': '🇺🇸 密尔沃基',
    'STL': '🇺🇸 圣路易斯',
    'SAT': '🇺🇸 圣安东尼奥',
    'HNL': '🇺🇸 檀香山',
    'ANC': '🇺🇸 安克雷奇',
    'SMF': '🇺🇸 萨克拉门托',
    'ONT': '🇺🇸 安大略',
    'OAK': '🇺🇸 奥克兰',
    'HKG': '🇭🇰 香港',
    'TPE': '🇹🇼 台北',
    'TSA': '🇹🇼 台北松山',
    'KHH': '🇹🇼 高雄',
    'NRT': '🇯🇵 东京成田',
    'HND': '🇯🇵 东京羽田',
    'KIX': '🇯🇵 大阪关西',
    'ITM': '🇯🇵 大阪伊丹',
    'NGO': '🇯🇵 名古屋',
    'FUK': '🇯🇵 福冈',
    'CTS': '🇯🇵 札幌',
    'OKA': '🇯🇵 冲绳',
    'ICN': '🇰🇷 首尔仁川',
    'GMP': '🇰🇷 首尔金浦',
    'PUS': '🇰🇷 釜山',
    'SIN': '🇸🇬 新加坡',
    'BKK': '🇹🇭 曼谷',
    'DMK': '🇹🇭 曼谷廊曼',
    'KUL': '🇲🇾 吉隆坡',
    'CGK': '🇮🇩 雅加达',
    'MNL': '🇵🇭 马尼拉',
    'CEB': '🇵🇭 宿务',
    'HAN': '🇻🇳 河内',
    'SGN': '🇻🇳 胡志明',
    'DAD': '🇻🇳 岘港',
    'RGN': '🇲🇲 仰光',
    'PNH': '🇰🇭 金边',
    'REP': '🇰🇭 暹粒',
    'VTE': '🇱🇦 万象',
    'BOM': '🇮🇳 孟买',
    'DEL': '🇮🇳 新德里',
    'MAA': '🇮🇳 金奈',
    'BLR': '🇮🇳 班加罗尔',
    'CCU': '🇮🇳 加尔各答',
    'HYD': '🇮🇳 海得拉巴',
    'AMD': '🇮🇳 艾哈迈达巴德',
    'COK': '🇮🇳 科钦',
    'PNQ': '🇮🇳 浦那',
    'GOI': '🇮🇳 果阿',
    'CMB': '🇱🇰 科伦坡',
    'DAC': '🇧🇩 达卡',
    'KTM': '🇳🇵 加德满都',
    'ISB': '🇵🇰 伊斯兰堡',
    'KHI': '🇵🇰 卡拉奇',
    'LHE': '🇵🇰 拉合尔',
    'LHR': '🇬🇧 伦敦希思罗',
    'LGW': '🇬🇧 伦敦盖特威克',
    'STN': '🇬🇧 伦敦斯坦斯特德',
    'LTN': '🇬🇧 伦敦卢顿',
    'MAN': '🇬🇧 曼彻斯特',
    'EDI': '🇬🇧 爱丁堡',
    'BHX': '🇬🇧 伯明翰',
    'CDG': '🇫🇷 巴黎戴高乐',
    'ORY': '🇫🇷 巴黎奥利',
    'MRS': '🇫🇷 马赛',
    'LYS': '🇫🇷 里昂',
    'NCE': '🇫🇷 尼斯',
    'FRA': '🇩🇪 法兰克福',
    'MUC': '🇩🇪 慕尼黑',
    'TXL': '🇩🇪 柏林',
    'BER': '🇩🇪 柏林勃兰登堡',
    'HAM': '🇩🇪 汉堡',
    'DUS': '🇩🇪 杜塞尔多夫',
    'CGN': '🇩🇪 科隆',
    'STR': '🇩🇪 斯图加特',
    'AMS': '🇳🇱 阿姆斯特丹',
    'BRU': '🇧🇪 布鲁塞尔',
    'LUX': '🇱🇺 卢森堡',
    'ZRH': '🇨🇭 苏黎世',
    'GVA': '🇨🇭 日内瓦',
    'BSL': '🇨🇭 巴塞尔',
    'VIE': '🇦🇹 维也纳',
    'PRG': '🇨🇿 布拉格',
    'BUD': '🇭🇺 布达佩斯',
    'WAW': '🇵🇱 华沙',
    'KRK': '🇵🇱 克拉科夫',
    'MXP': '🇮🇹 米兰马尔彭萨',
    'LIN': '🇮🇹 米兰利纳特',
    'FCO': '🇮🇹 罗马',
    'VCE': '🇮🇹 威尼斯',
    'NAP': '🇮🇹 那不勒斯',
    'FLR': '🇮🇹 佛罗伦萨',
    'BGY': '🇮🇹 贝加莫',
    'MAD': '🇪🇸 马德里',
    'BCN': '🇪🇸 巴塞罗那',
    'PMI': '🇪🇸 帕尔马',
    'AGP': '🇪🇸 马拉加',
    'VLC': '🇪🇸 瓦伦西亚',
    'SVQ': '🇪🇸 塞维利亚',
    'BIO': '🇪🇸 毕尔巴鄂',
    'LIS': '🇵🇹 里斯本',
    'OPO': '🇵🇹 波尔图',
    'FAO': '🇵🇹 法鲁',
    'DUB': '🇮🇪 都柏林',
    'CPH': '🇩🇰 哥本哈根',
    'ARN': '🇸🇪 斯德哥尔摩',
    'GOT': '🇸🇪 哥德堡',
    'OSL': '🇳🇴 奥斯陆',
    'BGO': '🇳🇴 卑尔根',
    'HEL': '🇫🇮 赫尔辛基',
    'RIX': '🇱🇻 里加',
    'TLL': '🇪🇪 塔林',
    'VNO': '🇱🇹 维尔纽斯',
    'ATH': '🇬🇷 雅典',
    'SKG': '🇬🇷 塞萨洛尼基',
    'SOF': '🇧🇬 索非亚',
    'OTP': '🇷🇴 布加勒斯特',
    'BEG': '🇷🇸 贝尔格莱德',
    'ZAG': '🇭🇷 萨格勒布',
    'LJU': '🇸🇮 卢布尔雅那',
    'KBP': '🇺🇦 基辅',
    'IEV': '🇺🇦 基辅茹良尼',
    'ODS': '🇺🇦 敖德萨',
    'SVO': '🇷🇺 莫斯科谢列梅捷沃',
    'DME': '🇷🇺 莫斯科多莫杰多沃',
    'VKO': '🇷🇺 莫斯科伏努科沃',
    'LED': '🇷🇺 圣彼得堡',
    'IST': '🇹🇷 伊斯坦布尔',
    'SAW': '🇹🇷 伊斯坦布尔萨比哈',
    'ESB': '🇹🇷 安卡拉',
    'AYT': '🇹🇷 安塔利亚',
    'ADB': '🇹🇷 伊兹密尔',
    'TLV': '🇮🇱 特拉维夫',
    'AMM': '🇯🇴 安曼',
    'BEY': '🇱🇧 贝鲁特',
    'BAH': '🇧🇭 巴林',
    'KWI': '🇰🇼 科威特',
    'DXB': '🇦🇪 迪拜',
    'AUH': '🇦🇪 阿布扎比',
    'SHJ': '🇦🇪 沙迦',
    'DOH': '🇶🇦 多哈',
    'MCT': '🇴🇲 马斯喀特',
    'RUH': '🇸🇦 利雅得',
    'JED': '🇸🇦 吉达',
    'DMM': '🇸🇦 达曼',
    'CAI': '🇪🇬 开罗',
    'HBE': '🇪🇬 亚历山大',
    'SSH': '🇪🇬 沙姆沙伊赫',
    'CMN': '🇲🇦 卡萨布兰卡',
    'RAK': '🇲🇦 马拉喀什',
    'TUN': '🇹🇳 突尼斯',
    'ALG': '🇩🇿 阿尔及尔',
    'LOS': '🇳🇬 拉各斯',
    'ABV': '🇳🇬 阿布贾',
    'ACC': '🇬🇭 阿克拉',
    'NBO': '🇰🇪 内罗毕',
    'MBA': '🇰🇪 蒙巴萨',
    'ADD': '🇪🇹 亚的斯亚贝巴',
    'DAR': '🇹🇿 达累斯萨拉姆',
    'JNB': '🇿🇦 约翰内斯堡',
    'CPT': '🇿🇦 开普敦',
    'DUR': '🇿🇦 德班',
    'HRE': '🇿🇼 哈拉雷',
    'LUN': '🇿🇲 卢萨卡',
    'MRU': '🇲🇺 毛里求斯',
    'SEZ': '🇸🇨 塞舌尔',
    'SYD': '🇦🇺 悉尼',
    'MEL': '🇦🇺 墨尔本',
    'BNE': '🇦🇺 布里斯班',
    'PER': '🇦🇺 珀斯',
    'ADL': '🇦🇺 阿德莱德',
    'CBR': '🇦🇺 堪培拉',
    'OOL': '🇦🇺 黄金海岸',
    'CNS': '🇦🇺 凯恩斯',
    'AKL': '🇳🇿 奥克兰',
    'WLG': '🇳🇿 惠灵顿',
    'CHC': '🇳🇿 基督城',
    'ZQN': '🇳🇿 皇后镇',
    'NAN': '🇫🇯 楠迪',
    'PPT': '🇵🇫 帕皮提',
    'GUM': '🇬🇺 关岛',
    'GRU': '🇧🇷 圣保罗瓜鲁柳斯',
    'CGH': '🇧🇷 圣保罗孔戈尼亚斯',
    'GIG': '🇧🇷 里约热内卢',
    'BSB': '🇧🇷 巴西利亚',
    'CNF': '🇧🇷 贝洛奥里藏特',
    'POA': '🇧🇷 阿雷格里港',
    'CWB': '🇧🇷 库里蒂巴',
    'FOR': '🇧🇷 福塔莱萨',
    'REC': '🇧🇷 累西腓',
    'SSA': '🇧🇷 萨尔瓦多',
    'EZE': '🇦🇷 布宜诺斯艾利斯',
    'AEP': '🇦🇷 布宜诺斯艾利斯城',
    'COR': '🇦🇷 科尔多瓦',
    'MDZ': '🇦🇷 门多萨',
    'SCL': '🇨🇱 圣地亚哥',
    'LIM': '🇵🇪 利马',
    'BOG': '🇨🇴 波哥大',
    'MDE': '🇨🇴 麦德林',
    'CLO': '🇨🇴 卡利',
    'UIO': '🇪🇨 基多',
    'GYE': '🇪🇨 瓜亚基尔',
    'CCS': '🇻🇪 加拉加斯',
    'MVD': '🇺🇾 蒙得维的亚',
    'ASU': '🇵🇾 亚松森',
    'PTY': '🇵🇦 巴拿马城',
    'SJO': '🇨🇷 圣何塞',
    'GUA': '🇬🇹 危地马拉城',
    'SAL': '🇸🇻 圣萨尔瓦多',
    'TGU': '🇭🇳 特古西加尔巴',
    'MGA': '🇳🇮 马那瓜',
    'BZE': '🇧🇿 伯利兹城',
    'MEX': '🇲🇽 墨西哥城',
    'GDL': '🇲🇽 瓜达拉哈拉',
    'MTY': '🇲🇽 蒙特雷',
    'CUN': '🇲🇽 坎昆',
    'TIJ': '🇲🇽 蒂华纳',
    'SJD': '🇲🇽 圣何塞德尔卡沃',
    'YYZ': '🇨🇦 多伦多',
    'YVR': '🇨🇦 温哥华',
    'YUL': '🇨🇦 蒙特利尔',
    'YYC': '🇨🇦 卡尔加里',
    'YEG': '🇨🇦 埃德蒙顿',
    'YOW': '🇨🇦 渥太华',
    'YWG': '🇨🇦 温尼伯',
    'YHZ': '🇨🇦 哈利法克斯',
    'HAV': '🇨🇺 哈瓦那',
    'SJU': '🇵🇷 圣胡安',
    'SDQ': '🇩🇴 圣多明各',
    'PAP': '🇭🇹 太子港',
    'KIN': '🇯🇲 金斯顿',
    'NAS': '🇧🇸 拿骚',
    'MBJ': '🇯🇲 蒙特哥贝'
  };
  function 获取机房名称(机房20018) {
    return 机房映射[机房20018] || 机房20018;
  }

  // 城市筛选相关函数
  const 城市筛选值 = document.getElementById('cityFilterContainer');
  const 城市值值 = document.getElementById('cityCheckboxesContainer');
  function 更新城市筛选() {
    if (!城市筛选值 || !城市值值) return;

    // 从测试结果中提取所有可用的城市
    const 城市映射 = new Map();
    测试结果列表.forEach((结果20017, 索引20016) => {
      if (结果20017.success && 结果20017.colo) {
        const 机房20015 = 结果20017.colo;
        if (!城市映射.has(机房20015)) {
          城市映射.set(机房20015, {
            colo: 机房20015,
            name: 获取机房名称(机房20015),
            count: 0
          });
        }
        城市映射.get(机房20015).count++;
      }
    });
    if (城市映射.size === 0) {
      城市筛选值.style.display = 'none';
      return;
    }
    城市筛选值.style.display = 'block';
    城市值值.innerHTML = '';

    // 按城市名称排序
    const 城市列表 = Array.from(城市映射.values()).sort((甲值20014, 乙值20013) => 甲值20014.name.localeCompare(乙值20013.name));
    城市列表.forEach(城市 => {
      const 标签 = document.createElement('label');
      标签.style.cssText = 'display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff; font-size: 0.85rem; padding: 4px 8px; background: rgba(20, 5, 50, 0.4); border: 1px solid #7aa9c4; border-radius: 4px;';
      const 复选框20012 = document.createElement('input');
      复选框20012.type = 'checkbox';
      复选框20012.value = 城市.colo;
      复选框20012.checked = true;
      复选框20012.dataset.colo = 城市.colo;
      复选框20012.style.cssText = 'margin-right: 6px; width: 16px; height: 16px; cursor: pointer;';
      const 本地值20011 = document.createElement('span');
      本地值20011.textContent = 城市.name + ' (' + 城市.count + ')';
      标签.appendChild(复选框20012);
      标签.appendChild(本地值20011);
      城市值值.appendChild(标签);
      复选框20012.addEventListener('change', 按城市筛选结果);
    });

    // 监听筛选模式变化
    const 筛选值值 = document.querySelectorAll('input[name="cityFilterMode"]');
    筛选值值.forEach(单选框 => {
      单选框.addEventListener('change', function () {
        if (this.value === 'all') {
          // 切换到"全部城市"模式时，自动选中所有城市复选框
          const 城市值20010 = 城市值值.querySelectorAll('input[type="checkbox"]');
          城市值20010.forEach(本地值20009 => {
            本地值20009.checked = true;
            本地值20009.disabled = false;
          });
        }
        按城市筛选结果();
      });
    });
  }
  function 按城市筛选结果() {
    if (!结果列表列表 || !城市值值) return;
    const 筛选值 = document.querySelector('input[name="cityFilterMode"]:checked')?.value || 'all';
    const 结果项目列表 = 结果列表列表.querySelectorAll('[data-index]');
    const 城市值 = 城市值值.querySelectorAll('input[type="checkbox"]');
    if (筛选值 === 'fastest10') {
      // 只选择最快的10个
      const 值结果列表 = 测试结果列表.map((结果, 索引20008) => ({
        result: 结果,
        index: 索引20008
      })).filter(项目20007 => 项目20007.result.success).sort((甲值, 乙值) => 甲值.result.latency - 乙值.result.latency).slice(0, 10);
      const 最快索引集合 = new Set(值结果列表.map(项目20006 => 项目20006.index));
      结果项目列表.forEach(项目20005 => {
        const 索引 = parseInt(项目20005.dataset.index);
        const 复选框20004 = 项目20005.querySelector('input[type="checkbox"]');
        if (最快索引集合.has(索引)) {
          项目20005.style.display = 'flex';
          if (复选框20004) 复选框20004.checked = true;
        } else {
          项目20005.style.display = 'none';
          if (复选框20004) 复选框20004.checked = false;
        }
      });

      // 禁用城市复选框
      城市值.forEach(本地值20003 => 本地值20003.disabled = true);
    } else {
      // 根据选中的城市筛选
      const 已选城市列表 = new Set();
      城市值.forEach(本地值20002 => {
        if (本地值20002.checked) {
          已选城市列表.add(本地值20002.value);
        }
      });

      // 如果所有城市都被选中（或没有选中任何城市），显示所有结果
      const 值值20001 = 城市值.length > 0 && 已选城市列表.size === 城市值.length;
      const 值值 = 已选城市列表.size === 0;
      结果项目列表.forEach(项目 => {
        const 机房20000 = 项目.dataset.colo || '';
        const 复选框 = 项目.querySelector('input[type="checkbox"]');
        if (值值20001 || 值值 || 已选城市列表.has(机房20000)) {
          项目.style.display = 'flex';
          // 同步更新结果项复选框的选中状态
          if (复选框) {
            if (值值20001) {
              // 所有城市都选中时，所有结果项复选框都选中
              复选框.checked = true;
            } else if (值值) {
              // 没有选中任何城市时，所有结果项复选框都取消选中
              复选框.checked = false;
            } else {
              // 根据城市选择状态同步复选框
              复选框.checked = 已选城市列表.has(机房20000);
            }
          }
        } else {
          项目.style.display = 'none';
          // 取消选中隐藏的结果项复选框
          if (复选框) {
            复选框.checked = false;
          }
        }
      });

      // 启用城市复选框
      城市值.forEach(本地值 => 本地值.disabled = false);
    }
  }
  async function 测试延迟(主机, 端口, 信号) {
    const 超时 = 8000;
    let 机房 = '';
    let 测试网址 = '';
    try {
      const 控制器 = new AbortController();
      const 超时标识 = setTimeout(() => 控制器.abort(), 超时);
      if (信号) {
        信号.addEventListener('abort', () => 控制器.abort());
      }
      const 清理主机 = 主机.replace(/^\\[|\\]$/g, '');
      const 十六进制地址 = 地址转十六进制(清理主机);
      const 测试域名 = 十六进制地址 ? 十六进制地址 + '.nip.lfree.org' : 清理主机 + '.nip.lfree.org';
      测试网址 = 'https://' + 测试域名 + ':' + 端口 + '/';
      console.log('[LatencyTest] Testing:', 测试网址, 'Original:', 主机 + ':' + 端口, 'HexIP:', 十六进制地址);
      const 首次开始 = Date.now();
      const 响应1 = await fetch(测试网址, {
        signal: 控制器.signal
      });
      const 首次值 = Date.now() - 首次开始;
      if (!响应1.ok) {
        clearTimeout(超时标识);
        return {
          success: false,
          latency: 首次值,
          error: 'HTTP ' + 响应1.status + ' ' + 响应1.statusText,
          colo: '',
          testUrl: 测试网址
        };
      }
      try {
        const 文本 = await 响应1.text();
        console.log('[LatencyTest] Response body:', 文本.substring(0, 200));
        const 数据 = JSON.parse(文本);
        if (数据.colo) {
          机房 = 数据.colo;
        }
      } catch (事件值) {
        console.log('[LatencyTest] Parse error:', 事件值.message);
      }
      const 值开始 = Date.now();
      const 响应2 = await fetch(测试网址, {
        signal: 控制器.signal
      });
      await 响应2.text();
      const 延迟 = Date.now() - 值开始;
      clearTimeout(超时标识);
      console.log('[LatencyTest] First:', 首次值 + 'ms (DNS+TLS+RTT)', 'Second:', 延迟 + 'ms (RTT only)');
      return {
        success: true,
        latency: 延迟,
        colo: 机房,
        testUrl: 测试网址
      };
    } catch (错误) {
      const 错误消息 = 错误.name === 'AbortError' ? '${是否值236 ? 'زمان تمام شد' : '超时'}' : 错误.message;
      console.log('[LatencyTest] Error:', 错误消息, 'URL:', 测试网址);
      return {
        success: false,
        latency: -1,
        error: 错误消息,
        colo: '',
        testUrl: 测试网址
      };
    }
  }
});
</script>
    </body>
    </html>`;
