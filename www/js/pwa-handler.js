// pwa-handler.js - เวอร์ชัน 3.0 (URL Install สำหรับ iOS / Android / PC)
console.log('📱 PWA Handler Module version 3.0 - โหลดสำเร็จ');

class PWAHandler {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installBanner = document.getElementById('installBanner');
        this.installButton = document.getElementById('installButton');
        this.dismissButton = document.getElementById('dismissBanner');
        this.platform = this.detectPlatform();

        this._injectInstallModalHTML();
        this.initialize();
    }

    // ─── Platform Detection ───────────────────────────────────────────────────

    detectPlatform() {
        const ua = navigator.userAgent;
        const isIOS     = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const isAndroid = /Android/.test(ua);
        const isMac     = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPad disguised
        const isSafari  = /Safari/.test(ua) && !/Chrome/.test(ua);
        const isChrome  = /Chrome/.test(ua) && !/Edg/.test(ua);
        const isEdge    = /Edg/.test(ua);
        const isFirefox = /Firefox/.test(ua);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                          || window.navigator.standalone === true;

        if (isIOS || isMac) return { type: 'ios',     browser: isSafari ? 'safari' : 'chrome', standalone: isStandalone };
        if (isAndroid)      return { type: 'android', browser: isChrome ? 'chrome' : 'other',  standalone: isStandalone };
        if (isEdge)         return { type: 'pc',      browser: 'edge',    standalone: isStandalone };
        if (isFirefox)      return { type: 'pc',      browser: 'firefox', standalone: isStandalone };
        return                     { type: 'pc',      browser: isChrome ? 'chrome' : 'other',  standalone: isStandalone };
    }

    // ─── Modal HTML Injection ─────────────────────────────────────────────────

    _injectInstallModalHTML() {
        if (document.getElementById('pwaInstallModal')) return;

        const modal = document.createElement('div');
        modal.id = 'pwaInstallModal';
        modal.innerHTML = `
<div id="pwaInstallModal" style="
    display:none; position:fixed; inset:0; z-index:9999;
    background:rgba(10,10,30,0.82); backdrop-filter:blur(8px);
    align-items:center; justify-content:center; padding:1rem;
" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">

  <div style="
    background:linear-gradient(145deg,#1e1b4b,#312e81,#1e1b4b);
    border:1px solid rgba(139,92,246,0.4);
    border-radius:1.5rem; max-width:420px; width:100%;
    box-shadow:0 0 60px rgba(139,92,246,0.3), 0 20px 60px rgba(0,0,0,0.5);
    overflow:hidden; position:relative;
  ">

    <!-- Header -->
    <div style="
        background:linear-gradient(135deg,rgba(139,92,246,0.3),rgba(79,70,229,0.2));
        padding:1.5rem 1.5rem 1rem; border-bottom:1px solid rgba(139,92,246,0.2);
        display:flex; align-items:center; gap:1rem;
    ">
      <div style="
        width:56px; height:56px; border-radius:14px; overflow:hidden; flex-shrink:0;
        box-shadow:0 4px 16px rgba(0,0,0,0.4);
        background:linear-gradient(135deg,#4f46e5,#7c3aed);
        display:flex; align-items:center; justify-content:center;
      ">
        <img src="icons/icon-72x72.png" alt="DestiBlue" style="width:100%;height:100%;object-fit:cover;"
             onerror="this.parentElement.innerHTML='<span style=\'font-size:2rem\'>🎵</span>'">
      </div>
      <div style="flex:1">
        <div id="pwaInstallTitle" style="font-family:'Kanit',sans-serif; font-size:1.1rem; font-weight:600; color:#e2e8f0; margin-bottom:2px;">
          ติดตั้ง DestiBlue Music
        </div>
        <div style="font-size:0.78rem; color:#a78bfa;">เพิ่มลงหน้าจอหลักได้ฟรี</div>
      </div>
      <button id="pwaInstallModalClose" style="
        width:32px; height:32px; border-radius:50%; border:none;
        background:rgba(255,255,255,0.1); color:#94a3b8; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:1.1rem;
        transition:background 0.2s;
      " aria-label="ปิด">✕</button>
    </div>

    <!-- Platform badge -->
    <div style="padding:0.75rem 1.5rem 0; display:flex; gap:0.5rem; flex-wrap:wrap;" id="pwaPlatformBadges"></div>

    <!-- Steps -->
    <div id="pwaInstallSteps" style="padding:1rem 1.5rem 1.5rem;"></div>

    <!-- Action button -->
    <div style="padding:0 1.5rem 1.5rem; display:flex; gap:0.75rem;">
      <button id="pwaInstallActionBtn" style="
        flex:1; padding:0.85rem 1.5rem; border-radius:0.875rem; border:none; cursor:pointer;
        background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff;
        font-family:'Kanit',sans-serif; font-size:1rem; font-weight:600;
        box-shadow:0 4px 20px rgba(79,70,229,0.5);
        transition:transform 0.15s, box-shadow 0.15s;
        display:flex; align-items:center; justify-content:center; gap:0.5rem;
      ">
        <span id="pwaInstallActionIcon">📲</span>
        <span id="pwaInstallActionText">ติดตั้งเลย</span>
      </button>
      <button id="pwaInstallCancelBtn" style="
        padding:0.85rem 1.2rem; border-radius:0.875rem;
        border:1px solid rgba(139,92,246,0.3); cursor:pointer;
        background:rgba(255,255,255,0.05); color:#94a3b8;
        font-family:'Kanit',sans-serif; font-size:0.9rem;
        transition:background 0.2s;
      ">ทีหลัง</button>
    </div>

    <!-- Tip -->
    <div id="pwaInstallTip" style="
        margin:0 1.5rem 1.5rem; padding:0.75rem 1rem; border-radius:0.75rem;
        background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25);
        font-size:0.78rem; color:#6ee7b7; display:none;
    "></div>
  </div>
</div>`;

        // Insert styles
        const style = document.createElement('style');
        style.textContent = `
            #pwaInstallModal { display:none; }
            #pwaInstallModal.show { display:flex !important; }
            #pwaInstallActionBtn:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(79,70,229,0.65) !important; }
            #pwaInstallModalClose:hover { background:rgba(255,255,255,0.2) !important; }
            .pwa-step {
                display:flex; align-items:flex-start; gap:0.75rem;
                padding:0.65rem 0; border-bottom:1px solid rgba(139,92,246,0.1);
            }
            .pwa-step:last-child { border-bottom:none; }
            .pwa-step-num {
                width:26px; height:26px; border-radius:50%; flex-shrink:0;
                background:linear-gradient(135deg,#4f46e5,#7c3aed);
                display:flex; align-items:center; justify-content:center;
                font-size:0.75rem; font-weight:700; color:#fff;
                box-shadow:0 2px 8px rgba(79,70,229,0.4);
            }
            .pwa-step-icon { font-size:1.3rem; flex-shrink:0; margin-top:1px; }
            .pwa-step-text { font-size:0.875rem; color:#cbd5e1; line-height:1.5; }
            .pwa-step-text strong { color:#e2e8f0; }
            .pwa-badge {
                padding:0.25rem 0.65rem; border-radius:999px; font-size:0.7rem; font-weight:600;
                display:inline-flex; align-items:center; gap:0.3rem;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal.firstElementChild);
    }

    // ─── Initialize ───────────────────────────────────────────────────────────

    initialize() {
        this.setupEventListeners();
        this.checkInstallStatus();
        this._setupModalListeners();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMLoaded());
        } else {
            this.onDOMLoaded();
        }
    }

    onDOMLoaded() {
        // ปุ่มใน Banner
        this.installButton?.addEventListener('click', () => this.install());
        this.dismissButton?.addEventListener('click', () => this.hideBanner());

        // ปุ่ม installPWAButton (icon ใน support section)
        const installPWAButton = document.getElementById('installPWAButton');
        if (installPWAButton) {
            installPWAButton.addEventListener('click', () => this.openInstallModal());
        }

        // ✅ ตรวจ URL Query Params
        this._handleInstallURL();
    }

    // ─── URL Install Handler ──────────────────────────────────────────────────

    _handleInstallURL() {
        const params = new URLSearchParams(window.location.search);
        const action  = params.get('action');   // ?action=install
        const install = params.get('install');  // ?install=true
        const ref     = params.get('ref');      // ?ref=qr / ?ref=link / ?ref=share

        if (action !== 'install' && install !== 'true') return;

        console.log(`📱 [PWA] URL install triggered | platform=${this.platform.type} | ref=${ref||'direct'}`);

        // Clean URL (ไม่ให้ bookmark เข้า loop)
        const cleanURL = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanURL);

        // รอให้ DOM พร้อม + delay เล็กน้อยให้ app โหลดก่อน
        const tryInstall = () => {
            if (this.isInstalled) {
                // ติดตั้งแล้ว — แจ้งให้รู้
                this._showInstalledAlready();
                return;
            }

//            if (this.deferredPrompt) {
                // Chrome/Edge/Android — prompt ได้เลย
                this.install();
//            } else {
                // iOS หรือยังไม่มี prompt — เปิด guide modal
                this.openInstallModal();
//            }
        };

        // รอ beforeinstallprompt ก่อน (max 2.5s) แล้วค่อย fallback
        let resolved = false;
        const onPrompt = () => {
            if (resolved) return;
            resolved = true;
            window.removeEventListener('beforeinstallprompt', onPrompt);
            clearTimeout(fallbackTimer);
            setTimeout(() => tryInstall(), 400);
        };

        window.addEventListener('beforeinstallprompt', onPrompt);
        const fallbackTimer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                window.removeEventListener('beforeinstallprompt', onPrompt);
                tryInstall();
            }
        }, 2500);
    }

    // ─── Install Modal ────────────────────────────────────────────────────────

    openInstallModal() {
        const modal = document.getElementById('pwaInstallModal');
        if (!modal) return;

        this._renderModalContent();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeInstallModal() {
        const modal = document.getElementById('pwaInstallModal');
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    _renderModalContent() {
        const { type, browser } = this.platform;

        const badgesEl = document.getElementById('pwaPlatformBadges');
        const stepsEl  = document.getElementById('pwaInstallSteps');
        const actionBtn = document.getElementById('pwaInstallActionBtn');
        const actionIcon = document.getElementById('pwaInstallActionIcon');
        const actionText = document.getElementById('pwaInstallActionText');
        const tipEl    = document.getElementById('pwaInstallTip');

        // --- Platform badge ---
        const platformInfo = {
            ios:     { label: 'iOS / iPadOS', color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', icon: '🍎' },
            android: { label: 'Android',      color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🤖' },
            pc:      { label: 'Desktop',      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '🖥️' },
        };
        const browserLabels = {
            safari: '🧭 Safari', chrome: '🌐 Chrome', edge: '🔷 Edge', firefox: '🦊 Firefox', other: '🌐 Browser'
        };
        const pi = platformInfo[type] || platformInfo.pc;

        if (badgesEl) {
            badgesEl.innerHTML = `
                <span class="pwa-badge" style="background:${pi.bg};color:${pi.color};border:1px solid ${pi.color}40">
                    ${pi.icon} ${pi.label}
                </span>
                <span class="pwa-badge" style="background:rgba(148,163,184,0.1);color:#94a3b8;border:1px solid rgba(148,163,184,0.2)">
                    ${browserLabels[browser] || browserLabels.other}
                </span>
            `;
        }

        // --- Steps & Action per platform ---
        if (type === 'ios') {
            stepsEl.innerHTML = this._stepsHTML([
                { icon: '🌐', text: 'เปิดหน้าเว็บนี้ใน <strong>Safari</strong> (ต้องเป็น Safari เท่านั้น)' },
                { icon: '📤', text: 'กดปุ่ม <strong>Share</strong> (รูปกล่องมีลูกศรขึ้น) ด้านล่างหน้าจอ' },
                { icon: '🏠', text: 'เลื่อนลงแล้วเลือก <strong>"Add to Home Screen"</strong> (เพิ่มในหน้าจอโฮม)' },
                { icon: '✅', text: 'กด <strong>Add</strong> มุมขวาบน — เสร็จแล้ว!' },
            ]);
            if (browser !== 'safari') {
                // Chrome บน iOS ไม่รองรับ
                if (tipEl) {
                    tipEl.style.display = 'block';
                    tipEl.innerHTML = '⚠️ Chrome บน iOS ไม่รองรับ Add to Home Screen — กรุณาเปิดลิงก์นี้ใน <strong>Safari</strong>';
                }
            }
            actionIcon.textContent = '📤';
            actionText.textContent = 'คัดลอกลิงก์เพื่อเปิดใน Safari';
            actionBtn.onclick = () => {
                navigator.clipboard?.writeText(window.location.href).then(() => {
                    this._dispatchToast('คัดลอกลิงก์แล้ว! เปิดใน Safari แล้วกด Share → Add to Home Screen', 'success');
                    this.closeInstallModal();
                });
            };

        } else if (type === 'android') {
            if (this.deferredPrompt) {
                // Native prompt available
                stepsEl.innerHTML = this._stepsHTML([
                    { icon: '📲', text: 'กดปุ่ม <strong>"ติดตั้งเลย"</strong> ด้านล่าง' },
                    { icon: '✅', text: 'กด <strong>Install</strong> / <strong>ติดตั้ง</strong> ในกล่องที่ปรากฏ' },
                    { icon: '🏠', text: 'แอปจะปรากฏบนหน้าจอหลักทันที' },
                ]);
                actionIcon.textContent = '📲';
                actionText.textContent = 'ติดตั้งเลย';
                actionBtn.onclick = () => {
                    this.closeInstallModal();
                    this.install();
                };
            } else {
                // Manual guide
                stepsEl.innerHTML = this._stepsHTML([
                    { icon: '⋮',  text: 'กดเมนู <strong>3 จุด</strong> (⋮) มุมขวาบนของ Chrome' },
                    { icon: '📲', text: 'เลือก <strong>"Add to Home screen"</strong> หรือ <strong>"Install App"</strong>' },
                    { icon: '✅', text: 'กด <strong>Install</strong> — แอปจะปรากฏบนหน้าจอหลัก' },
                ]);
                actionIcon.textContent = '🔄';
                actionText.textContent = 'รีเฟรชเพื่อลองอีกครั้ง';
                actionBtn.onclick = () => window.location.reload();
            }

        } else {
            // PC — Chrome / Edge / Firefox
            if (this.deferredPrompt) {
                stepsEl.innerHTML = this._stepsHTML([
                    { icon: '📲', text: 'กดปุ่ม <strong>"ติดตั้งเลย"</strong> ด้านล่าง' },
                    { icon: '✅', text: 'กด <strong>Install</strong> ในกล่องที่ปรากฏ' },
                    { icon: '🖥️', text: 'แอปจะเปิดในหน้าต่างแยกเหมือน desktop app' },
                ]);
                actionIcon.textContent = '💻';
                actionText.textContent = 'ติดตั้งบน Desktop';
                actionBtn.onclick = () => {
                    this.closeInstallModal();
                    this.install();
                };
            } else if (browser === 'chrome' || browser === 'edge') {
                stepsEl.innerHTML = this._stepsHTML([
                    { icon: '📍', text: 'มองที่ <strong>Address Bar</strong> — จะมีไอคอน <strong>⊕ Install</strong> ด้านขวาสุด' },
                    { icon: '🖱️', text: 'คลิกไอคอน Install แล้วกด <strong>Install</strong>' },
                    { icon: '🖥️', text: 'หรือกดเมนู <strong>⋮ → Install DestiBlue Music</strong>' },
                ]);
                actionIcon.textContent = '🔍';
                actionText.textContent = 'ดูไอคอน Install ใน Address Bar';
                actionBtn.onclick = () => { this.closeInstallModal(); };
            } else {
                // Firefox ไม่รองรับ PWA install
                stepsEl.innerHTML = this._stepsHTML([
                    { icon: '🌐', text: 'เปิดลิงก์นี้ใน <strong>Google Chrome</strong> หรือ <strong>Microsoft Edge</strong>' },
                    { icon: '📲', text: 'จะมีปุ่ม Install ปรากฏขึ้นอัตโนมัติ' },
                ]);
                if (tipEl) {
                    tipEl.style.display = 'block';
                    tipEl.textContent = '💡 Firefox ยังไม่รองรับการติดตั้ง PWA — แนะนำใช้ Chrome หรือ Edge';
                }
                actionIcon.textContent = '📋';
                actionText.textContent = 'คัดลอกลิงก์';
                actionBtn.onclick = () => {
                    navigator.clipboard?.writeText(window.location.href).then(() => {
                        this._dispatchToast('คัดลอกลิงก์แล้ว! เปิดใน Chrome หรือ Edge', 'success');
                        this.closeInstallModal();
                    });
                };
            }
        }
    }

    _stepsHTML(steps) {
        return steps.map((s, i) => `
            <div class="pwa-step">
                <div class="pwa-step-num">${i + 1}</div>
                <div class="pwa-step-icon">${s.icon}</div>
                <div class="pwa-step-text">${s.text}</div>
            </div>
        `).join('');
    }

    _setupModalListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'pwaInstallModalClose' || e.target.id === 'pwaInstallCancelBtn') {
                this.closeInstallModal();
            }
            // Click outside
            if (e.target.id === 'pwaInstallModal') {
                this.closeInstallModal();
            }
        });
    }

    _showInstalledAlready() {
        this._dispatchToast('✅ คุณได้ติดตั้งแอปนี้แล้ว! เปิดจากหน้าจอหลักได้เลย', 'success');
    }

    // ─── Install (Native Prompt) ──────────────────────────────────────────────

    setupEventListeners() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 ระบบพร้อมสำหรับการติดตั้ง (beforeinstallprompt captured)');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showBanner();

            const btn = document.getElementById('installPWAButton');
            if (btn) btn.classList.remove('hidden');
        });

        window.addEventListener('appinstalled', () => {
            console.log('🎉 ติดตั้ง PWA สำเร็จแล้ว');
            this.isInstalled = true;
            this.deferredPrompt = null;
            this.hideBanner();
            this.closeInstallModal();

            const btn = document.getElementById('installPWAButton');
            if (btn) btn.classList.add('hidden');

            if (window.AppMain?.setState) {
                window.AppMain.setState('pwa.installed', true);
                window.AppMain.setState('pwa.installDate', new Date().toISOString());
            }

            this._dispatchToast('🎉 ติดตั้งแอปสำเร็จ! เปิดได้จากหน้าจอหลัก', 'success');
        });

        window.addEventListener('appuninstalled', () => {
            if (window.AppMain?.setState) {
                window.AppMain.setState('pwa.installed', false);
                window.AppMain.setState('pwa.installDate', null);
            }
            this.isInstalled = false;
        });
    }

    async install() {
        if (!this.deferredPrompt) {
            // ไม่มี native prompt → เปิด guide modal แทน
            this.openInstallModal();
            return { success: false, message: 'No native prompt — modal opened' };
        }

        try {
            this._dispatchToast('กำลังเตรียมการติดตั้ง...', 'info');
            await this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`👤 ผลการตัดสินใจของผู้ใช้: ${outcome}`);

            if (outcome !== 'accepted') {
                this._dispatchToast('ยกเลิกการติดตั้ง', 'warning');
            }

            this.deferredPrompt = null;
            return { success: outcome === 'accepted' };

        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดระหว่างติดตั้ง:', error);
            this._dispatchToast('เกิดข้อผิดพลาดในการติดตั้ง', 'error');
            return { success: false, error };
        }
    }

    // ─── URL Generator (helper สำหรับแชร์) ───────────────────────────────────

    /**
     * สร้าง URL สำหรับแชร์ — ใช้แนบใน QR, SMS, Line, Email ฯลฯ
     * @param {string} ref - แหล่งที่มา เช่น 'qr', 'line', 'sms', 'email'
     * @returns {string} Full install URL
     */
    getInstallURL(ref = 'share') {
        const base = window.location.origin + window.location.pathname;
        return `${base}?action=install&ref=${ref}`;
    }

    // ─── Banner ───────────────────────────────────────────────────────────────

    showBanner() {
        if (this.installBanner) {
            this.installBanner.classList.add('show');
            setTimeout(() => this.installBanner.classList.remove('hidden'), 10);
        }
    }

    hideBanner() {
        if (this.installBanner) {
            this.installBanner.classList.remove('show');
            setTimeout(() => this.installBanner.classList.add('hidden'), 300);
        }
    }

    // ─── Status ───────────────────────────────────────────────────────────────

    checkInstallStatus() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                          || window.navigator.standalone === true;
        let storedInstalled = false;
        if (window.AppMain?.getState) {
            storedInstalled = window.AppMain.getState('pwa.installed') === true;
        }

        this.isInstalled = isStandalone || storedInstalled;

        if (this.isInstalled) {
            console.log('📱 แอปถูกติดตั้งแล้ว (standalone mode)');
            this.hideBanner();
            document.getElementById('installPWAButton')?.classList.add('hidden');
        }
    }

    getStatus() {
        return {
            hasDeferredPrompt : !!this.deferredPrompt,
            isInstalled       : this.isInstalled,
            platform          : this.platform,
            canInstall        : !!this.deferredPrompt && !this.isInstalled,
            installURL        : this.getInstallURL(),
        };
    }

    // ─── Toast ────────────────────────────────────────────────────────────────

    _dispatchToast(message, type = 'info') {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type } }));
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Legacy alias
    showToast(message, type = 'info') { this._dispatchToast(message, type); }
}

// ─── Instance & Global API ────────────────────────────────────────────────────

window.PWAHandler = new PWAHandler();

/** เรียกจาก HTML button onclick */
window.handleAppInstall = () => window.PWAHandler?.install()
    ?? window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'ระบบติดตั้งยังไม่พร้อม กรุณารอสักครู่...', type: 'warning' }
    }));

/** เปิด install guide modal (เรียกได้จากทุกที่) */
window.openPWAInstallModal = () => window.PWAHandler?.openInstallModal();

/** คืน install URL พร้อม ref tag */
window.getPWAInstallURL = (ref) => window.PWAHandler?.getInstallURL(ref);

console.log('✅ PWA Handler (v3.0) พร้อมใช้งานแล้ว');
console.log(`📱 Platform detected: ${window.PWAHandler.platform.type} / ${window.PWAHandler.platform.browser}`);
