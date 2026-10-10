const X = `
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
`;
