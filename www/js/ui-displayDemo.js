// ui-displayDemo.js (v3.6.9) - แก้ไขสีข้อความใน #musicDNADetailedInfo ให้เป็นสีขาว
window.UI_DEMO_VERSION = '3.6.9';
console.log('✅ UI DISPLAY MODULE v' + window.UI_DEMO_VERSION + ' - LOAD COMPLETE (Music DNA Edition)');


// ========== 1. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_UI_Display = {
    initialize: true,
    addMusicDNAStyles: true,
    logDebug: true,
    logError: true,
    checkDOMElements: true,
    createMusicDNAInfoPanel: true,
    setupMusicDNAEventListeners: true,
    displayMusicDNAInfo: true,
    updateElementDiskFromMusicDNA: true,
    updateSongInfoFromMusicDNA: true,
    updateMelodyFromMusicDNA: true,
    showMusicDNAInfo: true,
    hideMusicDNAInfo: true,
    updateNumerologyGridForMusicDNA: true,
    getElementIcon: true,
    updateMusicDNAStorytelling: true,
    updateMusicDNAAudit: true,
    highlightMusicDNANote: true,
    startMusicDNAVisualizer: true,
    startMusicDNAVisualizerAnimation: true,
    updateVisualizerForNote: true,
    stopMusicDNAVisualizer: true,
    displayPsychomatrixResults: true,
    updateUserInfo: true,
    startVisualizerAnimation: true,
    stopVisualizerAnimation: true,
    saveDisplay: true,
    loadSavedData: true,
    sendStatusToDebug: true,
    checkMusicPlayingStatus: true,
    createInitialVisualizer: true,
    startInitialBarsAnimation: true,
    updateNumberDetails: true,
    updateNumerologyGrid: true,
    updateElementDisk: true,
    updateMelodyInfo: true,
    updateSongInfo: true,
    loadUserData: true,
    setupEventListeners: true,
    updateUIFromState: true,
    getState: true,
    updateFromState: true,
    updateStorytellingDisplay: true,
    updateMusicDNADetailedInfo: true,
    getMusicStyleDetails: true,
    showBothPanels: true,
    hideBothPanels: true,
    toggleBothPanels: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_UI_Display[functionName]) {
        // เงียบไว้ ตามเดิม
    }
}

window.UI = {
    debugMode: true,
    currentDisplay: null,
    currentMusicDNA: null,
    lastEventReceived: null,
    domElementsStatus: {},
    version: '3.6.6',
    savedFormData: null,
    isMusicDNAMode: false,
    lastStory: null, // เก็บ story ล่าสุด
    
    initialize: function() {
        verifyFunctionApproval('initialize');
        this.logDebug('🔧 Initializing UI Display module v' + window.UI_DEMO_VERSION + ' (Music DNA Edition)');

        // เพิ่ม CSS styles สำหรับ Music DNA
        this.addMusicDNAStyles();
        
        // ตรวจสอบ DOM elements
        this.checkDOMElements();
    
        // Setup event listeners (รวม Music DNA events)
        this.setupMusicDNAEventListeners();
    
        // โหลดข้อมูลเก่าถ้ามี
        this.loadSavedData();
        // 🔥 โหลดข้อมูลผู้ใช้จาก localStorage
        this.loadUserData();
        // 🔥 ตั้งค่า event listeners ทั่วไป
        this.setupEventListeners();
    
        // สร้าง initial visualizer bars
        this.createInitialVisualizer();
        
        // ตรวจสอบสถานะเพลงเริ่มต้น
        this.checkMusicPlayingStatus();
    
        // ส่งสถานะไปยัง debug
        this.sendStatusToDebug();

        // ทำให้ div#Storytelling เริ่มต้นเป็น hidden (ตามเดิม)
        const storytellingDiv = document.getElementById('Storytelling');
        if (storytellingDiv) storytellingDiv.classList.add('hidden');

        // #musicDNADetailedInfo ควรมี class hidden ใน HTML อยู่แล้ว
    
        this.logDebug('✅ UI Display module initialized (Music DNA Ready)');
        return true;
    },

    createInitialVisualizer: function() {
        verifyFunctionApproval('createInitialVisualizer');
        this.logDebug('🎨 Creating initial visualizer bars...');
    
        const visualizer = document.getElementById('visualizer');
        if (!visualizer) {
            this.logError('createInitialVisualizer', 'Visualizer element not found');
            return false;
        }
    
        // ล้าง content เก่า
        visualizer.innerHTML = '';
    
        // สร้าง bars 6 อัน
        const barValues = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    
        barValues.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'visualizer-bar initial-bar';
        
            const heightPercent = value * 100;
            bar.style.cssText = `
                flex: 1;
                height: ${heightPercent}%;
                background: linear-gradient(to top, #4f46e5, #8b5cf6);
                border-radius: 4px 4px 0 0;
                margin: 0 2px;
                min-height: 4px;
                transition: height 0.3s ease;
                opacity: 0.7;
            `;
        
            bar.style.animationDelay = `${index * 0.1}s`;
            visualizer.appendChild(bar);
        });
    
        this.logDebug(`✅ Created ${barValues.length} initial visualizer bars`);
        this.startInitialBarsAnimation();
    
        return true;
    },

    startInitialBarsAnimation: function() {
        verifyFunctionApproval('startInitialBarsAnimation');
        this.logDebug('🎨 Starting gentle animation for initial visualizer...');
    
        const bars = document.querySelectorAll('.initial-bar');
        if (!bars.length) return;
    
        let animationCounter = 0;
    
        const animateBars = () => {
            bars.forEach((bar, index) => {
                const baseHeight = 50;
                const variation = Math.sin((Date.now() / 1000) + (index * 0.5)) * 10;
                const newHeight = baseHeight + variation;
            
                bar.style.height = `${newHeight}%`;
            
                const opacity = 0.5 + (Math.sin((Date.now() / 800) + index) * 0.3);
                bar.style.opacity = opacity.toString();
            });
        
            if (animationCounter < 300) {
                animationCounter++;
                requestAnimationFrame(animateBars);
            }
        };
    
        animateBars();
        this.logDebug('✅ Started gentle animation for initial visualizer bars');
    },
    
    addMusicDNAStyles: function() {
        verifyFunctionApproval('addMusicDNAStyles');
        if (document.getElementById('ui-musicdna-styles')) {
            this.logDebug('🎨 UI Music DNA styles already loaded');
            return;
        }
    
        const musicDNAStyles = document.createElement('style');
        musicDNAStyles.id = 'ui-musicdna-styles';
        musicDNAStyles.textContent = `
        
            /* Music DNA Specific Styles */
            .musicdna-storytelling {
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
                border-left: 4px solid #8b5cf6;
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
                animation: ui-fadeInUp 0.5s ease-out;
        }
        
        .musicdna-config-card {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 0.75rem;
            padding: 1rem;
            transition: all 0.3s ease;
        }
        
        .musicdna-config-card:hover {
            border-color: rgba(99, 102, 241, 0.6);
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.15);
            transform: translateY(-2px);
        }
        
        .musicdna-sequence-note {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.5rem;
            font-family: monospace;
            font-weight: bold;
            margin: 0.25rem;
            transition: all 0.2s ease;
        }
        
        .musicdna-sequence-note.root-note {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        
        .musicdna-sequence-note.regular-note {
            background: rgba(99, 102, 241, 0.2);
            color: #c7d2fe;
            border: 1px solid rgba(99, 102, 241, 0.3);
        }
        
        .musicdna-audit-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            margin: 0.25rem;
        }
        
        .musicdna-audit-success {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .musicdna-audit-warning {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .musicdna-audit-error {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        @keyframes musicdna-note-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
        }
        
        .musicdna-note-playing {
            animation: musicdna-note-pulse 0.5s ease-out;
            z-index: 10;
        }
        
        .musicdna-element-fire {
            background: linear-gradient(135deg, #f97316, #ea580c);
            box-shadow: 0 10px 30px rgba(249, 115, 22, 0.3);
        }
        
        .musicdna-element-water {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);
        }
        
        .musicdna-element-wood {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);
        }
        
        .musicdna-element-earth {
            background: linear-gradient(135deg, #a16207, #854d0e);
            box-shadow: 0 10px 30px rgba(161, 98, 7, 0.3);
        }
        
        .musicdna-element-metal {
            background: linear-gradient(135deg, #94a3b8, #64748b);
            box-shadow: 0 10px 30px rgba(148, 163, 184, 0.3);
        }
        
        .musicdna-wave-sine {
            border-color: #3b82f6;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1));
        }
        
        .musicdna-wave-square {
            border-color: #ef4444;
            background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1));
        }
        
        .musicdna-wave-triangle {
            border-color: #10b981;
            background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1));
        }
        
        .musicdna-wave-sawtooth {
            border-color: #8b5cf6;
            background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1));
        }
        
        .musicdna-info-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 1rem;
            padding: 1.25rem;
            z-index: 1000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: ui-fadeInUp 0.5s ease-out;
        }
        
        .musicdna-info-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(99, 102, 241, 0.2);
        }
        
        .musicdna-info-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .musicdna-close-btn {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 1.25rem;
            transition: color 0.2s;
        }
        
        .musicdna-close-btn:hover {
            color: #ef4444;
        }
        
        /* ========== 🔥 แก้ไขสีข้อความภายใน #musicDNADetailedInfo ========== */
        #musicDNADetailedInfo {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 1rem;
            padding: 1.25rem;
            margin-bottom: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            color: #ffffff !important;
        }
        /* ข้อความภายในทุกชั้นเป็นสีขาว*/
        #musicDNADetailedInfo  {
            color: #ffffff ;
        }
        
 
        /* ========== คืนสีให้หัวข้อภายนอก (ทอง/ชมพู) ========== */
        /* สีทองสำหรับหัวข้อหลัก (ปุ่มสร้างเพลง + modal title) */
        .btn-text .modal-title,
        .btn-primary .modal-title,
        h2.modal-title,
        .modal-title {
            color: #fbbf24 !important;  /* ทอง */
            text-shadow: 0 0 2px rgba(0,0,0,0.3);
        }
        
        /* สีชมพูสำหรับตัวเลือกใน modal */
        .option-card .font-medium,
        .option-label .option-card .font-medium {
            color: #f9a8d4 !important;  /* ชมพู */
        }
        
        /* ป้องกันการทับ element อื่น (loading, inviteModal) */
        .loading-screen h2,
        #inviteModal h2 {
            color: inherit !important;
        }

        @keyframes ui-fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes ui-pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
            100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        
        .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
        }
        
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .musicdna-visualizer-bar {
            transition: all 0.1s ease;
            will-change: height, opacity;
        }
        
        .musicdna-visualizer-bar.active {
            opacity: 1;
            filter: brightness(1.2);
        }
        
        @media (max-width: 768px) {
            .musicdna-info-panel {
                position: relative;
                top: auto;
                right: auto;
                width: 100%;
                margin: 1rem 0;
            }
        }
        `;
    
        document.head.appendChild(musicDNAStyles);
        this.logDebug('✅ Music DNA CSS styles added (v3.6.8');
    },
    
    logDebug: function(message, data = null) {
        verifyFunctionApproval('logDebug');
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] [UI-MusicDNA] ${message}`;
        
        if (this.debugMode) {
            console.log(logMessage);
            if (data !== null) {
                console.log('📊 Data:', data);
            }
        }
        
        window.Debug?.log('UI-MusicDNA', message);
        
        if (data !== null) {
            window.Debug?.log('UI-MusicDNA', 'Data: ' + JSON.stringify(data).substring(0, 200) + 
                (JSON.stringify(data).length > 200 ? '...' : ''));
        }
        
        return logMessage;
    },
    
    logError: function(message, error) {
        verifyFunctionApproval('logError');
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[${timestamp}] [UI-MusicDNA] ${message}`, error);
        window.Debug?.error('UI-MusicDNA', `${message} - ${error?.message || error}`);
        
        this.lastError = {
            message: message,
            error: error?.message || String(error),
            timestamp: new Date().toISOString(),
            stack: error?.stack
        };
    },
    
    checkDOMElements: function() {
        verifyFunctionApproval('checkDOMElements');
        this.logDebug('🔍 Checking DOM elements for Music DNA...');
        
        const requiredElements = [
            'numerologyGrid',
            'numberDetails',
            'elementDisk',
            'elementIcon',
            'melodyNotes',
            'seedNumbers',
            'currentUserName',
            'currentUserBirth',
            'songTitle',
            'songInfo',
            'playButton',
            'playIcon',
            'visualizer',
            'musicDNADetailedInfo'
        ];
        
        this.domElementsStatus = {};
        
        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            const exists = !!element;
            this.domElementsStatus[id] = {
                exists: exists,
                type: element?.tagName ?? 'MISSING',
                id: id
            };
            if (exists) {
                this.logDebug(`✅ Found element: #${id}`);
            } else {
                this.logDebug(`❌ Missing element: #${id} (will use fallback if needed)`);
            }
        });
        
        return Object.values(this.domElementsStatus).every(e => e.exists);
    },
    
    setupMusicDNAEventListeners: function() {
        verifyFunctionApproval('setupMusicDNAEventListeners');
        this.logDebug('🔗 Setting up Music DNA event listeners...');
        
        window.addEventListener('psychomatrixResultsUpdated', (event) => {
            this.logDebug('📥 Received psychomatrixResultsUpdated event');
            this.lastEventReceived = {
                type: 'psychomatrixResultsUpdated',
                timestamp: new Date().toISOString(),
                data: event.detail
            };
            
            if (event.detail) {
                this.logDebug('📦 Event detail structure:', {
                    type: typeof event.detail,
                    keys: Object.keys(event.detail),
                    hasBirthDate: !!event.detail.birthDate,
                    hasIdCard: !!event.detail.id_card,
                    hasFullName: !!event.detail.fullName
                });
                this.displayPsychomatrixResults(event.detail);
            } else {
                this.logDebug('⚠️ Event detail is empty');
            }
        });
        
        window.addEventListener('formSubmitted', (event) => {
            this.logDebug('📥 Received formSubmitted event');
            this.lastEventReceived = {
                type: 'formSubmitted',
                timestamp: new Date().toISOString(),
                data: event.detail
            };
            this.updateUserInfo(event.detail);
        });
        
        window.addEventListener('musicDNAStarted', (event) => {
            this.logDebug('🎵 Music DNA started event received', event.detail);
            this.isMusicDNAMode = true;
            this.currentMusicDNA = event.detail?.musicDNA || null;
            
            if (event.detail) {
                this.displayMusicDNAInfo(event.detail);
                this.startMusicDNAVisualizer(event.detail);
            }
            
            const disk = document.getElementById('elementDisk');
            if (disk) {
                disk.classList.add('animate-spin-slow');
                disk.classList.add('element-glow');
            }
            
            if (window.AppState) window.AppState.isPlaying = true;
        });

        if (window.AppMainController && typeof window.AppMainController.subscribe === 'function') {
            window.AppMainController.subscribe('numerology', (numerology) => {
                this.logDebug('📥 Received numerology update from AppMain', numerology);
                this.updateNumberDetails(numerology);
            });
            this.logDebug('✅ Subscribed to AppMain numerology');
        } else {
            this.logDebug('⚠️ AppMainController not available, cannot subscribe to numerology');
        }
        
        this.logDebug('✅ Music DNA event listeners setup complete');
    },
    
    loadUserData: function() {
        verifyFunctionApproval('loadUserData');
        try {
            const saved = localStorage.getItem('psychomatrixUserData');
            if (saved) {
                this.savedFormData = JSON.parse(saved);
                this.logDebug('✅ User data loaded from localStorage');
            }
        } catch (e) {
            this.logError('loadUserData', e);
        }
    },

    _updateDNAStatusText: function(isPlaying) {
        const label = isPlaying ? 'กำลังเล่น' : 'หยุด';
        const statusEl = document.getElementById('musicStatusText');
        if (statusEl) statusEl.textContent = isPlaying ? 'กำลังเล่น' : 'พร้อมเล่น';
        const dnaStatus = document.getElementById('dnaCardStatusText');
        if (dnaStatus) dnaStatus.textContent = label;
        this.logDebug('✅ DNA Status updated →', label);
    },

    setupEventListeners: function() {
        verifyFunctionApproval('setupEventListeners');
        
        window.addEventListener('stateUpdated', (e) => {
            if (e.detail) this.updateUIFromState(e.detail);
        });

        window.addEventListener('stateChanged', (e) => {
            const { path, value } = e.detail || {};
            if (path === 'music.default' || path === 'music.CustomSty') {
                this.displayMusicDNAInfo(value);
            }
        });

        window.addEventListener('musicPointerChanged', (e) => {
            const { activeDNA } = e.detail || {};
            if (activeDNA) {
                this.displayMusicDNAInfo(activeDNA);
            }
        });

        window.addEventListener('storyGenerated', (e) => {
            const story = e.detail?.story;
            if (story) {
                this.lastStory = story;
                this._currentSessionId = e.detail?.sessionId ?? null;
                const storytellingDiv = document.getElementById('Storytelling');
                if (storytellingDiv && !storytellingDiv.classList.contains('hidden')) {
                    this.updateStorytellingDisplay(story);
                }
            }
        });

        window.addEventListener('storyFetching', (e) => {
            this.logDebug('⏳ storyFetching received, source:', e.detail?.source);
            const div = document.getElementById('Storytelling');
            if (div) {
                div.innerHTML = '<div class="storytelling-content p-4 bg-slate-800/50 rounded-lg"><p class="text-slate-400 animate-pulse">⏳ กำลังสร้างเรื่องราว...</p></div>';
                div.classList.remove('hidden');
            }
        });

        window.addEventListener('storyError', (e) => {
            const { fallbackStory, sessionId, error } = e.detail || {};
            this.logDebug('❌ storyError received, sessionId:', sessionId, 'error:', error);
            if (fallbackStory) {
                this.lastStory = fallbackStory;
                this._currentSessionId = sessionId ?? null;
                this.updateStorytellingDisplay(fallbackStory);
            } else {
                const div = document.getElementById('Storytelling');
                if (div) {
                    div.innerHTML = '<div class="storytelling-content p-4 bg-slate-800/50 rounded-lg"><p class="text-red-400">ไม่สามารถสร้างเรื่องราวได้</p></div>';
                }
            }
        });

        const infoBtn = document.getElementById('showMusicDNAInfoBtn');
        if (infoBtn) {
            const newBtn = infoBtn.cloneNode(true);
            infoBtn.parentNode.replaceChild(newBtn, infoBtn);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleBothPanels();
            });
        }

        this.logDebug('✅ setupEventListeners complete');
       
    },

    updateUIFromState: function(state) {
        verifyFunctionApproval('updateUIFromState');
        if (!state) return;
        if (state.numerology) this.updateNumberDetails(state.numerology);
        if (state.music?.current && typeof state.music.current !== 'string') {
            this.displayMusicDNAInfo(state.music.current);
        } else if (state.music?.current && typeof state.music.current === 'string') {
            const activeDNA = window.AppMainController?.getActiveMusicDNA?.();
            if (activeDNA?.config) this.displayMusicDNAInfo(activeDNA);
        }
        this.logDebug('🔄 UI updated from state');
    },

    getState: function() {
        verifyFunctionApproval('getState');
        return {
            currentMusicDNA: this.currentMusicDNA,
            isMusicDNAMode: this.isMusicDNAMode,
            lastEventReceived: this.lastEventReceived,
            savedFormData: this.savedFormData
        };
    },

    updateFromState: function(state) {
        verifyFunctionApproval('updateFromState');
        this.updateUIFromState(state);
    },
    
    updateNumberDetails: function(numerology) {
        verifyFunctionApproval('updateNumberDetails');
        const numberDetails = document.getElementById('numberDetails');
        if (!numberDetails) {
            this.logDebug('⚠️ numberDetails element not found');
            return;
        }
        
        if (!numerology) {
            this.logDebug('⚠️ No numerology data to display');
            numberDetails.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-slate-300">Life Path Number:</span>
                    <span class="font-bold text-purple-300">-</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-slate-300">ธาตุประจำตัว:</span>
                    <span class="font-bold text-green-300">-</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-slate-300">ปีแห่งธาตุ:</span>
                    <span class="font-bold text-blue-300">-</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-slate-300">เดือนแห่งธาตุ:</span>
                    <span class="font-bold text-yellow-300">-</span>
                </div>
            `;
            return;
        }
        
        const lifePath = numerology.lifePath ?? '-';
        const element = numerology.element ?? '-';
        const yearElement = numerology.elementRelations?.yearElement ?? '-';
        const monthElement = numerology.elementRelations?.monthElement ?? '-';
        
        const html = `
            <div class="flex justify-between items-center">
                <span class="text-slate-300">Life Path Number:</span>
                <span class="font-bold text-purple-300">${lifePath}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-slate-300">ธาตุประจำตัว:</span>
                <span class="font-bold text-green-300">${element}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-slate-300">ปีแห่งธาตุ:</span>
                <span class="font-bold text-blue-300">${yearElement}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-slate-300">เดือนแห่งธาตุ:</span>
                <span class="font-bold text-yellow-300">${monthElement}</span>
            </div>
        `;
        
        numberDetails.innerHTML = html;
        this.logDebug('✅ Numerology details updated');
    },
    
    
        updateMainUIFromState: function(state = null) {
        if (!state && window.AppMainController) state = window.AppMainController.getState();
        if (!state) return;

        if (state.user) this.updateUserInfoDisplay(state.user);

        const musicPref = state.user?.musicPreference;
        if (musicPref) {
            const mel1 = document.getElementById('currentMelody1');
            const mel2 = document.getElementById('currentMelody2');
            if (mel1) mel1.textContent = musicPref.defaultStyle || '-';
            if (mel2) mel2.textContent = musicPref.customStyle || '-';
        }

        const defaultDNA = this._cachedDefaultDNA
            || window.AudioController?._defaultDNA
            || null;
        const customDNA = this._cachedCustomDNA
            || window.AudioController?._customDNA
            || null;

        if (defaultDNA) {
            const instr1 = document.getElementById('currentInstrument1');
            const tempo1 = document.getElementById('currentTempo1');
            const nature1 = document.getElementById('currentNatureFX1');
            if (instr1) instr1.textContent = defaultDNA.instruments?.join(', ') || '-';
            if (tempo1) tempo1.textContent = defaultDNA.config?.bpm ? defaultDNA.config.bpm + ' BPM' : '-';
            if (nature1) nature1.textContent = defaultDNA.natureEffects?.map(ne => ne.type).join(', ') || '-';
        } else {
            const instr1 = document.getElementById('currentInstrument1');
            const tempo1 = document.getElementById('currentTempo1');
            const nature1 = document.getElementById('currentNatureFX1');
            if (instr1) instr1.textContent = '-';
            if (tempo1) tempo1.textContent = '-';
            if (nature1) nature1.textContent = '-';
        }

        if (customDNA) {
            const instr2 = document.getElementById('currentInstrument2');
            const tempo2 = document.getElementById('currentTempo2');
            const nature2 = document.getElementById('currentNatureFX2');
            if (instr2) instr2.textContent = customDNA.instruments?.join(', ') || '-';
            if (tempo2) tempo2.textContent = customDNA.config?.bpm ? customDNA.config.bpm + ' BPM' : '-';
            if (nature2) nature2.textContent = customDNA.natureEffects?.map(ne => ne.type).join(', ') || '-';
        } else {
            const instr2 = document.getElementById('currentInstrument2');
            const tempo2 = document.getElementById('currentTempo2');
            const nature2 = document.getElementById('currentNatureFX2');
            if (instr2) instr2.textContent = '-';
            if (tempo2) tempo2.textContent = '-';
            if (nature2) nature2.textContent = '-';
        }

        const status = document.getElementById('musicStatusText');
        if (status) {
            const isPlaying = window.AudioController?.isPlaying || false;
            status.textContent = isPlaying ? 'กำลังเล่น' : 'พร้อมเล่น';
        }
    },

    
    displayMusicDNAInfo: function(musicDNAData) {
        verifyFunctionApproval('displayMusicDNAInfo');
        
        if (!musicDNAData || typeof musicDNAData === 'string') {
            this.logDebug(`displayMusicDNAInfo skipped — invalid input type: ${typeof musicDNAData}`);
            return false;
        }

        this.logDebug('🧬 Displaying Music DNA information...');
        
        try {
            const musicDNA = musicDNAData.musicDNA || musicDNAData;
            
            if (!musicDNA || !musicDNA.config) {
                this.logDebug('displayMusicDNAInfo skipped — musicDNA.config not ready yet');
                return false;
            }
            
            this.currentMusicDNA = musicDNA;
            
            this.updateElementDiskFromMusicDNA(musicDNA);
            this.updateSongInfoFromMusicDNA(musicDNA);
            this.updateMelodyFromMusicDNA(musicDNA);
            this.updateNumerologyGridForMusicDNA(musicDNA);
            
            this._scheduleDetailedInfoUpdate(musicDNA);
            
            if (musicDNA.storytelling) {
                this.lastStory = musicDNA.storytelling;
                this.updateStorytellingDisplay(musicDNA.storytelling);
            }
            
            this.showBothPanels();
            
            this.logDebug('✅ Music DNA information displayed');
            return true;
            
        } catch (error) {
            console.error(`[UI-MusicDNA] ❌ Failed to display Music DNA info: ${error?.message}`, error?.stack || error);
            this.logError('❌ Failed to display Music DNA info', error);
            return false;
        }
    },
    
    _scheduleDetailedInfoUpdate: function(dna) {
        if (this._detailUpdateTimer) clearTimeout(this._detailUpdateTimer);
        this._detailUpdateTimer = setTimeout(() => {
            this._detailUpdateTimer = null;
            this.updateMusicDNADetailedInfo(dna || this.currentMusicDNA);
        }, 80);
    },

    updateMusicDNADetailedInfo: function(musicDNA) {
        verifyFunctionApproval('updateMusicDNADetailedInfo');
        const container = document.getElementById('musicDNADetailedInfo');
        if (!container) {
            this.logDebug('⚠️ #musicDNADetailedInfo not found');
            return;
        }

        const dna = musicDNA || this.currentMusicDNA;
        if (!dna) return;

        const config      = dna.config;
        const storytelling = dna.storytelling;
        const sequence    = dna.sequence || [];

        const defaultDNA = this._cachedDefaultDNA
        || window.AudioController?._defaultDNA
        || null;
        const customDNA  = this._cachedCustomDNA
        || dna._customDNA
        || window.AudioController?._customDNA
        || null;

        let musicStyle1 = '-';
        let musicStyle2 = '-';
        try {
            const userState = window.AppMainController?.getState?.('user');
            if (userState?.musicPreference) {
                musicStyle1 = userState.musicPreference.defaultStyle || '-';
                musicStyle2 = userState.musicPreference.customStyle || '-';
            }
        } catch (e) {
            this.logDebug('⚠️ Cannot read user.musicPreference, using fallback');
        }

        let infoHTML = ``;
    
        if (storytelling) {
            const blueprintText = [
                storytelling.foundation,
                storytelling.heartbeat,
                storytelling.spark,
                storytelling.atmosphere,
                storytelling.note
            ].filter(Boolean).join('\n\n');

            if (blueprintText && blueprintText.length > 10) {
                window.dispatchEvent(new CustomEvent('personalBlueprintReady', {
                    detail: { blueprint: blueprintText, timestamp: Date.now() }
                }));
                this.logDebug('📡 Dispatched personalBlueprintReady');
            }
            infoHTML += `
                <h3 class="font-semibold text-lg text-amber-300"><i class="fas fa-dna mr-2"></i>Destiny Blueprint Music</h3>
                <div class="text-sm">
                    ${storytelling.foundation ? `<p class="font-semibold mb-1 text-purple-300">รากฐาน: <span>${storytelling.foundation}</span></p>` : ''}
                    ${storytelling.heartbeat ? `<p>${storytelling.heartbeat}</p>` : ''}
                    ${storytelling.spark ? `<p>${storytelling.spark}</p>` : ''}
                    ${storytelling.atmosphere ? `<p>${storytelling.atmosphere}</p>` : ''}
                    ${storytelling.note ? `<p class="italic">${storytelling.note}</p>` : ''}
                </div>
            `;
        }
 
        infoHTML += `</div>`;
        container.innerHTML = infoHTML;
        this.logDebug('✅ Music DNA detailed info updated');
    },


    showBothPanels: function() {
        verifyFunctionApproval('showBothPanels');
        const storytellingDiv = document.getElementById('Storytelling');
        const dnaDiv = document.getElementById('musicDNADetailedInfo');
        if (storytellingDiv) storytellingDiv.classList.remove('hidden');
        if (dnaDiv) dnaDiv.classList.remove('hidden');
        this.logDebug('✅ Both panels shown');
    },
    
    hideBothPanels: function() {
        verifyFunctionApproval('hideBothPanels');
        const storytellingDiv = document.getElementById('Storytelling');
        // const dnaDiv = document.getElementById('musicDNADetailedInfo');
        // if (storytellingDiv) storytellingDiv.classList.add('hidden');
        // if (dnaDiv) dnaDiv.classList.add('hidden');
        this.logDebug('✅ Both panels hidden');
    },
    
    toggleBothPanels: function() {
        verifyFunctionApproval('toggleBothPanels');
        const storytellingDiv = document.getElementById('Storytelling');
        const dnaDiv = document.getElementById('musicDNADetailedInfo');
        if (storytellingDiv && dnaDiv) {
            const currentlyHidden = storytellingDiv.classList.contains('hidden');
            if (currentlyHidden) {
                this.showBothPanels();
            } else {
                this.hideBothPanels();
            }
        }
    },
    
    updateElementDiskFromMusicDNA: function(musicDNA) {
        verifyFunctionApproval('updateElementDiskFromMusicDNA');
        const disk = document.getElementById('elementDisk');
        const icon = document.getElementById('elementIcon');
        
        if (!disk || !icon) {
            this.logDebug('⚠️ Element disk or icon not found');
            return;
        }
        
        const config = musicDNA.config;
        const element = config.element || 'earth';
        
        const elementMap = {
            'fire': 'ไฟ', 'ไฟ': 'ไฟ',
            'water': 'น้ำ', 'น้ำ': 'น้ำ',
            'wood': 'ไม้', 'ไม้': 'ไม้',
            'earth': 'ดิน', 'ดิน': 'ดิน',
            'metal': 'ทอง', 'ทอง': 'ทอง',
            'gold': 'ทอง'
        };
        
        const elementName = elementMap[element.toLowerCase()] || 'ดิน';
        
        const currentClasses = disk.className.split(' ');
        const newClasses = currentClasses.filter(cls => 
            !cls.startsWith('ui-element-') && 
            !cls.startsWith('element-') &&
            !cls.startsWith('musicdna-element-')
        );
        
        newClasses.push(`musicdna-element-${elementName}`);
        newClasses.push(`ui-element-${elementName}`);
        newClasses.push(`element-${elementName}`);
        newClasses.push('ui-element-disk');
        
        disk.className = newClasses.join(' ');
        
        const elementIcons = {
            'ไฟ': 'fa-fire',
            'น้ำ': 'fa-tint',
            'ไม้': 'fa-leaf',
            'ดิน': 'fa-mountain',
            'ทอง': 'fa-gem'
        };
        
        icon.className = `fas ${elementIcons[elementName] || 'fa-music'} ui-element-icon`;
        
        this.logDebug(`✅ Element disk updated from Music DNA: ${elementName} (${element})`);
    },
    
    updateSongInfoFromMusicDNA: function(musicDNA) {
        verifyFunctionApproval('updateSongInfoFromMusicDNA');
        const songTitle = document.getElementById('songTitle');
        const songInfo = document.getElementById('songInfo');
        
        if (!songTitle || !songInfo) return;
        
        const config = musicDNA.config;
        const storytelling = musicDNA.storytelling;
        
        if (storytelling?.foundation) {
            const titleParts = storytelling.foundation.split(' ');
            const shortTitle = titleParts.slice(0, 3).join(' ');
            songTitle.textContent = shortTitle || 'Music DNA Composition';
        } else {
            songTitle.textContent = 'Music DNA Composition';
        }
        
        const infoParts = [];
        if (config.root) infoParts.push(`Root: ${config.root}`);
        if (config.bpm) infoParts.push(`${config.bpm} BPM`);
        if (config.scale) infoParts.push(config.scale);
        if (config.element) infoParts.push(`${config.element} Element`);
        
        songInfo.textContent = infoParts.join(' • ') || 'Music DNA Basic Edition';
        
        this.logDebug('✅ Song info updated from Music DNA:', {
            title: songTitle.textContent,
            info: songInfo.textContent
        });
    },
    
    updateMelodyFromMusicDNA: function(musicDNA) {
        verifyFunctionApproval('updateMelodyFromMusicDNA');
        const melodyNotes = document.getElementById('melodyNotes');
        const seedNumbers = document.getElementById('seedNumbers');
        
        if (!melodyNotes || !seedNumbers) {
            this.logDebug('⚠️ Melody containers not found');
            return;
        }
        
        if (!musicDNA.sequence || !Array.isArray(musicDNA.sequence)) {
            this.logDebug('⚠️ No valid sequence in Music DNA');
            return;
        }
        
        const displayNotes = musicDNA.sequence.slice(0, 8);
        
        melodyNotes.innerHTML = displayNotes.map((noteObj, index) => {
            const isRoot = noteObj.isRootNote || false;
            const noteClass = isRoot ? 'musicdna-sequence-note root-note' : 'musicdna-sequence-note regular-note';
            const noteId = `musicdna-note-${index}`;
            
            return `
                <div id="${noteId}" class="${noteClass}" 
                     title="Note: ${noteObj.note}, Duration: ${noteObj.duration}, Velocity: ${noteObj.velocity?.toFixed(2)}">
                    ${noteObj.note}
                </div>
            `;
        }).join('');
        
        seedNumbers.textContent = `${musicDNA.sequence.length} notes, ${musicDNA.config?.bpm || 120} BPM`;
        
        this.logDebug('✅ Melody updated from Music DNA:', {
            notes: displayNotes.map(n => n.note),
            totalNotes: musicDNA.sequence.length,
            hasRootNotes: displayNotes.filter(n => n.isRootNote).length
        });
    },
    
    updateNumerologyGridForMusicDNA: function(musicDNA) {
        verifyFunctionApproval('updateNumerologyGridForMusicDNA');
        const grid = document.getElementById('numerologyGrid');
        if (!grid) {
            this.logDebug('⚠️ Numerology grid not found');
            return;
        }
        
        const config = musicDNA.config;
        const foundationNumber = config.foundationNumber || 1;
        
        const numerologyCards = [
            {
                source: 'DNA Foundation',
                value: foundationNumber,
                label: 'Foundation',
                icon: 'fa-dna',
                color: 'text-indigo-400',
                description: 'Music DNA Foundation Number'
            },
            {
                source: 'Element',
                value: config.element || 'Earth',
                label: 'Element',
                icon: this.getElementIcon(config.element),
                color: 'text-emerald-400',
                description: 'Element based on numerology'
            },
            {
                source: 'BPM',
                value: config.bpm || 120,
                label: 'Tempo',
                icon: 'fa-tachometer-alt',
                color: 'text-amber-400',
                description: 'Beats per minute'
            },
            {
                source: 'Root',
                value: config.root || 'C3',
                label: 'Root Note',
                icon: 'fa-music',
                color: 'text-purple-400',
                description: 'Root note of the scale'
            }
        ];
        
        grid.innerHTML = numerologyCards.map(card => `
            <div class="numerology-card ui-numerology-card" title="${card.description}">
                <div class="numerology-source">${card.source}</div>
                <div class="numerology-value ${card.color}">
                    <i class="fas ${card.icon} mr-2"></i>${card.value}
                </div>
                <div class="numerology-label">${card.label}</div>
            </div>
        `).join('');
        
        this.logDebug('✅ Numerology grid updated for Music DNA');
    },
    
    getElementIcon: function(element) {
        verifyFunctionApproval('getElementIcon');
        const elementIcons = {
            'fire': 'fa-fire',
            'ไฟ': 'fa-fire',
            'water': 'fa-tint',
            'น้ำ': 'fa-tint',
            'wood': 'fa-leaf',
            'ไม้': 'fa-leaf',
            'earth': 'fa-mountain',
            'ดิน': 'fa-mountain',
            'metal': 'fa-gem',
            'ทอง': 'fa-gem',
            'gold': 'fa-gem'
        };
        return elementIcons[element?.toLowerCase()] || 'fa-question';
    },
    
    updateMusicDNAStorytelling: function(storytelling) {
        verifyFunctionApproval('updateMusicDNAStorytelling');
        const content = document.getElementById('musicDNAInfoContent');
        // ไม่ต้องทำอะไร
    },
    
    updateMusicDNAAudit: function(audit) {
        // ไม่ต้องทำ
    },
    
    highlightMusicDNANote: function(noteData) {
        verifyFunctionApproval('highlightMusicDNANote');
        if (!noteData || !noteData.note) return;
        
        const melodyNotes = document.querySelectorAll('.musicdna-sequence-note');
        melodyNotes.forEach(noteEl => {
            noteEl.classList.remove('musicdna-note-playing');
            
            const noteText = noteEl.textContent.trim();
            if (noteText === noteData.note || noteText.includes(noteData.note.substring(0, 2))) {
                noteEl.classList.add('musicdna-note-playing');
                
                setTimeout(() => {
                    noteEl.classList.remove('musicdna-note-playing');
                }, 500);
            }
        });
    },
    
    startMusicDNAVisualizer: function(musicDNAData) {
        verifyFunctionApproval('startMusicDNAVisualizer');
        this.logDebug('🎨 Starting Music DNA visualizer...');
        
        const visualizer = document.getElementById('visualizer');
        if (!visualizer) {
            this.logError('startMusicDNAVisualizer', 'Visualizer element not found');
            return false;
        }
        
        visualizer.innerHTML = '';
        
        const musicDNA = musicDNAData.musicDNA || musicDNAData;
        const sequence = musicDNA.sequence || [];
        const bpm = musicDNA.config?.bpm || 120;
        
        const barCount = Math.min(sequence.length, 16);
        
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'musicdna-visualizer-bar';
            
            const note = sequence[i];
            const velocity = note?.velocity || 0.5;
            const heightPercent = 20 + (velocity * 60);
            
            const hue = (i * 30) % 360;
            
            bar.style.cssText = `
                flex: 1;
                height: ${heightPercent}%;
                background: linear-gradient(to top, hsl(${hue}, 80%, 60%), hsl(${hue + 20}, 90%, 70%));
                border-radius: 4px 4px 0 0;
                margin: 0 1px;
                min-height: 4px;
                opacity: 0.7;
                transition: all 0.1s ease;
            `;
            
            visualizer.appendChild(bar);
        }
        
        this.logDebug(`✅ Music DNA visualizer started with ${barCount} bars`);
        this.startMusicDNAVisualizerAnimation(bpm);
        
        return true;
    },
    
    startMusicDNAVisualizerAnimation: function(bpm) {
        verifyFunctionApproval('startMusicDNAVisualizerAnimation');
        const bars = document.querySelectorAll('.musicdna-visualizer-bar');
        if (!bars.length) return;
        
        const beatDuration = 60000 / bpm;
        const barCount = bars.length;
        let currentBar = 0;
        
        const animateVisualizer = () => {
            bars.forEach(bar => {
                bar.classList.remove('active');
                bar.style.opacity = '0.7';
            });
            
            if (bars[currentBar]) {
                bars[currentBar].classList.add('active');
                bars[currentBar].style.opacity = '1';
                bars[currentBar].style.filter = 'brightness(1.3)';
                
                const currentHeight = bars[currentBar].style.height;
                bars[currentBar].style.height = `${parseFloat(currentHeight) * 1.2}%`;
                
                setTimeout(() => {
                    bars[currentBar].style.height = currentHeight;
                }, 100);
            }
            
            currentBar = (currentBar + 1) % barCount;
        };
        
        this.visualizerInterval = setInterval(animateVisualizer, beatDuration / 2);
        
        this.logDebug(`✅ Music DNA visualizer animation started at ${bpm} BPM`);
    },
    
    updateVisualizerForNote: function(noteData) {
        verifyFunctionApproval('updateVisualizerForNote');
        if (!noteData || !noteData.frequency) return;
        
        const bars = document.querySelectorAll('.musicdna-visualizer-bar');
        if (!bars.length) return;
        
        const minFreq = 130.81;
        const maxFreq = 1046.50;
        const logFreq = Math.log(noteData.frequency);
        const logMin = Math.log(minFreq);
        const logMax = Math.log(maxFreq);
        
        const normalized = (logFreq - logMin) / (logMax - logMin);
        const barIndex = Math.floor(normalized * (bars.length - 1));
        
        if (bars[barIndex]) {
            bars.forEach(bar => {
                bar.style.opacity = '0.7';
                bar.style.filter = 'none';
            });
            
            bars[barIndex].style.opacity = '1';
            bars[barIndex].style.filter = 'brightness(1.5)';
            
            const velocity = noteData.velocity || 0.5;
            const currentHeight = bars[barIndex].style.height;
            const bounceHeight = parseFloat(currentHeight) * (1 + (velocity * 0.3));
            
            bars[barIndex].style.height = `${bounceHeight}%`;
            
            setTimeout(() => {
                bars[barIndex].style.height = currentHeight;
            }, 200);
        }
    },
    
    stopMusicDNAVisualizer: function() {
        verifyFunctionApproval('stopMusicDNAVisualizer');
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
        
        const bars = document.querySelectorAll('.musicdna-visualizer-bar');
        bars.forEach(bar => {
            bar.classList.remove('active');
            bar.style.opacity = '0.5';
            bar.style.filter = 'none';
        });
        
        this.logDebug('✅ Music DNA visualizer stopped');
    },
    
    displayPsychomatrixResults: function(numerologyData) {
        verifyFunctionApproval('displayPsychomatrixResults');
        this.logDebug('🎨 [UI-MusicDNA] Displaying psychomatrix results...');
        
        try {
            if (!numerologyData) {
                throw new Error('No numerology data provided');
            }
            
            this.currentDisplay = numerologyData;
            
            this.logDebug('📊 Numerology data structure:', {
                allResultsCount: numerologyData.allResults?.length || 0,
                birthDate: !!numerologyData.birthDate,
                id_card: !!numerologyData.id_card,
                fullName: !!numerologyData.fullName,
                processedAt: numerologyData.processedAt
            });
            
            this.updateNumberDetails(numerologyData);
            
            if (!this.isMusicDNAMode) {
                this.updateNumerologyGrid(numerologyData);
                this.updateElementDisk(numerologyData);
                this.updateMelodyInfo(numerologyData);
                this.updateSongInfo(numerologyData);
            }
            
            this.startVisualizerAnimation(numerologyData);
            
            setTimeout(() => {
                if (!window.AppState?.isPlaying) {
                    this.stopVisualizerAnimation();
                }
            }, 3000);
            
            this.saveDisplay();
            
            this.logDebug('✅ Psychomatrix results displayed successfully');
            
            const event = new CustomEvent('uiDisplayUpdated', {
                detail: numerologyData
            });
            window.dispatchEvent(event);
            
            return true;
            
        } catch (error) {
            this.logError('❌ Failed to display psychomatrix results', error);
            return false;
        }
    },
    
    updateNumerologyGrid: function(numerologyData) {
        verifyFunctionApproval('updateNumerologyGrid');
        this.logDebug('updateNumerologyGrid called (stub)');
    },
    
    updateElementDisk: function(numerologyData) {
        verifyFunctionApproval('updateElementDisk');
        this.logDebug('updateElementDisk called (stub)');
    },
    
    updateMelodyInfo: function(numerologyData) {
        verifyFunctionApproval('updateMelodyInfo');
        this.logDebug('updateMelodyInfo called (stub)');
    },
    
    updateSongInfo: function(numerologyData) {
        verifyFunctionApproval('updateSongInfo');
        this.logDebug('updateSongInfo called (stub)');
    },
    
    updateUserInfo: function(userData) {
        verifyFunctionApproval('updateUserInfo');
        this.logDebug('updateUserInfo called (stub)');
    },
    
    startVisualizerAnimation: function(numerologyData) {
        verifyFunctionApproval('startVisualizerAnimation');
        this.logDebug('startVisualizerAnimation called (stub)');
    },
    
    stopVisualizerAnimation: function() {
        verifyFunctionApproval('stopVisualizerAnimation');
        this.logDebug('stopVisualizerAnimation called (stub)');
    },
    
    saveDisplay: function() {
        verifyFunctionApproval('saveDisplay');
        this.logDebug('saveDisplay called (stub)');
    },
    
    loadSavedData: function() {
        verifyFunctionApproval('loadSavedData');
        this.logDebug('loadSavedData called (stub)');
    },
    
    sendStatusToDebug: function() {
        verifyFunctionApproval('sendStatusToDebug');
        this.logDebug('sendStatusToDebug called (stub)');
    },
    
    checkMusicPlayingStatus: function() {
        verifyFunctionApproval('checkMusicPlayingStatus');
        this.logDebug('checkMusicPlayingStatus called (stub)');
    },
    
    updateStorytellingDisplay: function(story) {
        verifyFunctionApproval('updateStorytellingDisplay');
        const storytellingDiv = document.getElementById('Storytelling');
        if (!storytellingDiv) return;

        let html = '<div class="storytelling-content p-4 bg-slate-800/50 rounded-lg space-y-2">';
        if (story.foundation) html += `<p><span class="font-semibold text-indigo-300">รากฐาน:</span> ${story.foundation}</p>`;
        if (story.heartbeat) html += `<p><span class="font-semibold text-emerald-300">จังหวะชีวิต:</span> ${story.heartbeat}</p>`;
        if (story.spark) html += `<p><span class="font-semibold text-amber-300">ประกาย:</span> ${story.spark}</p>`;
        if (story.atmosphere) html += `<p><span class="font-semibold text-blue-300">บรรยากาศ:</span> ${story.atmosphere}</p>`;
        if (story.note) html += `<p class="text-sm italic text-slate-400">${story.note}</p>`;
        html += '</div>';

        storytellingDiv.innerHTML = html;
        this.logDebug('✅ Storytelling updated');

        window.dispatchEvent(new CustomEvent('storyDisplayed', {
            detail: {
                sessionId:   this._currentSessionId ?? null,
                displayedAt: new Date().toISOString(),
            }
        }));
    }
};

window.debugMusicDNA = function() {
    if (window.UI && window.UI.currentMusicDNA) {
        console.group('🧬 MUSIC DNA DEBUG INFO');
        console.log('Current Music DNA:', window.UI.currentMusicDNA);
        console.log('Config:', window.UI.currentMusicDNA.config);
        console.log('Sequence Length:', window.UI.currentMusicDNA.sequence?.length || 0);
        console.log('Storytelling:', window.UI.currentMusicDNA.storytelling);
        console.log('Audit:', window.UI.currentMusicDNA.audit);
        console.log('Is Music DNA Mode:', window.UI.isMusicDNAMode);
        console.groupEnd();
        return window.UI.currentMusicDNA;
    } else {
        console.warn('No Music DNA data available');
        return null;
    }
};

window.debugUI = function() {
    if (window.UI && typeof window.UI.debugUIStatus === 'function') {
        return window.UI.debugUIStatus();
    } else {
        console.error('UI module not loaded or debug function not available');
        return null;
    }
};

console.log('✅ UI Demo DISPLAY MODULE V' + window.UI_DEMO_VERSION + ' - LOAD COMPLETE (Music DNA Edition)');