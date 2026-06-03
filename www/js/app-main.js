window.AppMain_VERSION = "8.2.0";

console.log("🔧 APP-MAIN.JS v" + window.AppMain_VERSION + " - STATE MANAGER CENTRAL INITIALIZING...");

if (typeof window.DataContract === 'undefined') {
    throw new Error("❌ CRITICAL: data-contract.js must be loaded before app-main.js");
}
if (typeof window.EdgeFunctionIntegration === 'undefined') {
    throw new Error("❌ CRITICAL: edge-function-integration.js must be loaded before app-main.js");
}

const APPROVED_FUNCTIONS_AppMain = {
    constructor: true,
    initialize: true,
    getState: true,
    setState: true,
    validateState: true,
    resetState: true,
    resetStateDataOnly: true,
    getActiveMusicDNA: true,
    migrateStorageSchema: true,
    subscribe: true,
    notifyListeners: true,
    processFormSubmission: true,
    validateUserData: true,
    saveUserData: true,
    loadUserData: true,
    generateMusicDNA: true,
    validateForEdgeFunction: true,
    sendToEdgeFunction: true,
    updateUIFromState: true,
    showForm: true,
    hideForm: true,
    showToast: true,
    handleNumerologyUpdated: true,
    handlePsychomatrixDataReceived: true,
    handleLuckyNumberDataReceived: true,
    setupEventListeners: true,
    resetToDefaultMusic: true,
    // ✅ Premium methods (v8.0)
    checkUserPremiumStatus: true,
    updatePremiumState: true,
    // ✅ internal helpers
    _getValueAtPath: true,
    _deepEqual: true,
    fetchTrialStatus: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_AppMain[functionName]) {
        throw new Error(`🚫 UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
    }
    return true;
}

class AppMainController {
    constructor() {
        verifyFunctionApproval('constructor');
        this.listeners = new Map();
        this.state = {
            user: null,
            userCustom: null,
            numerology: null,
            psychomatrix: null,
            luckyNumber: null,
            music: {
                current: null,
                default: null,
                CustomSty: null
            },
            edgeFunctions: {
                psychomatrix: null,
                luckyNumber: null,
                musicGenerator: null
            },
            premium: {                // ✅ v8.0: premium state แยกจาก user
                isActive: false,
                lastChecked: null
            },
            trial: {
                isActive: false,
                daysLeft: 0,
                edition: 'basic',
                features: {}
            },
            ui: {
                formVisible: false,
                loading: false,
                currentView: 'form',
                currentMode: 'personal-form'
            }
        };
        
        this._updateTrialBadge = this._updateTrialBadge.bind(this);
        console.log("✅ AppMainController v"+ window.AppMain_VERSION +  " initialized");
    }

    // ---------- helper methods สำหรับเปรียบเทียบค่า ----------
    _getValueAtPath(path) {
        verifyFunctionApproval('_getValueAtPath');
        const keys = path.split('.');
        let current = this.state;
        for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        return current;
    }

    _deepEqual(a, b) {
        verifyFunctionApproval('_deepEqual');
        return JSON.stringify(a) === JSON.stringify(b);
    }

    // ========== 3. PREMIUM LOGIC (v8.0 - ปลอดภัย ไม่กระทบ user) ==========
    async checkUserPremiumStatus() {
        verifyFunctionApproval('checkUserPremiumStatus');
        try {
            const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
            let isPremium = false;

            // 1. โหลดจาก本地 cache (แยก key)
            if (isNative && window.Capacitor?.Preferences) {
                const { value } = await window.Capacitor.Preferences.get({ key: 'premium_status' });
                isPremium = (value === 'true');
            } else {
                const stored = localStorage.getItem('premium_status');
                isPremium = (stored === 'true');
            }

            if (isPremium) {
                this.setState('premium.isActive', true);
                this.setState('premium.lastChecked', new Date().toISOString());
                console.log("✅ [AppMain] Premium active (from cache)");
                return true;
            }

            // 2. ถ้าไม่มี cache หรือ cache เป็น false → ลองเช็ค Supabase (ถ้ามี client)
            if (window.supabaseClient && typeof window.supabaseClient.auth?.getSession === 'function') {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                const userId = session?.user?.id;
                if (userId) {
                    const { data, error } = await window.supabaseClient
                        .from('profiles')
                        .select('is_premium')
                        .eq('id', userId)
                        .single();
                    if (!error && data?.is_premium === true) {
                        await this.updatePremiumState(true);
                        console.log("✅ [AppMain] Premium active (from Supabase)");
                        return true;
                    }
                }
            }

            // 3. Default: ไม่เป็น premium
            await this.updatePremiumState(false);
            console.log("ℹ️ [AppMain] Premium not active");
            return false;
        } catch (e) {
            console.warn("⚠️ [AppMain] Premium check failed, using default false:", e);
            await this.updatePremiumState(false);
            return false;
        }
    }
    

    async fetchTrialStatus() {
        verifyFunctionApproval('fetchTrialStatus');
        console.log('[AppMain] 🔍 Fetching trial status...');
        try {
            if (window.EdgeFunctionIntegration?.callTrialCheck) {
                const result = await window.EdgeFunctionIntegration.callTrialCheck(false); // ไม่ force create
                if (result) {
                    this.setState('trial.isActive', result.trial || false);
                    this.setState('trial.daysLeft', result.days_left !== undefined ? result.days_left : null);
                    this.setState('trial.edition', result.edition || 'basic');
                    this.setState('trial.features', result.features || { melody1_styles: ['lofi'] });
                    console.log('✅ [AppMain] Trial status loaded:', {
                        edition: result.edition,
                        daysLeft: result.days_left
                    });
                } else {
                    throw new Error('callTrialCheck returned falsy');
                }
            } else {
                console.warn('[AppMain] EdgeFunctionIntegration.callTrialCheck not available — using basic');
                this.setState('trial.edition', 'basic');
                this._updateTrialBadge();
            }
        } catch (err) {
            console.error('[AppMain] Failed to fetch trial status:', err);
            this.setState('trial.isActive', false);
            this.setState('trial.daysLeft', null);
            this.setState('trial.edition', 'basic');
            this.setState('trial.features', { melody1_styles: ['lofi'] });
            this._updateTrialBadge();
        }
    }


    _updateTrialBadge() {
    const trialState = this.state.trial;
    const edition = trialState?.edition || 'basic';
    const daysLeft = trialState?.daysLeft ?? 0;
    const isTrial = trialState?.isActive;

    const badgeEl = document.getElementById('editionBadge');
    const daysEl = document.getElementById('trialDaysLeft');

    if (badgeEl) {
        const names = {
            trial: '🧪 Trial',
            basic: '🎵 Basic',
            premium: '👑 Premium'
        };
        badgeEl.textContent = names[edition] || 'Basic';

        // เปลี่ยนสีตาม Edition
        if (edition === 'premium') {
            badgeEl.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else if (edition === 'trial') {
            badgeEl.style.background = '#10b981'; // เขียวมรกต
        } else {
            badgeEl.style.background = '#6366f1'; // ม่วง indigo
        }
    }

    if (daysEl) {
        if (edition === 'premium') {
            daysEl.textContent = '✨ ไม่จำกัด';
            daysEl.style.color = '#fbbf24';
        } else if (isTrial) {
            daysEl.textContent = `⏳ เหลือ ${daysLeft} วัน`;
            daysEl.style.color = daysLeft <= 1 ? '#ef4444' : '#fbbf24';
        } else {
            daysEl.textContent = '';
        }
    }
}

    async updatePremiumState(isPremium) {
        verifyFunctionApproval('updatePremiumState');
        const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        const valueStr = isPremium ? 'true' : 'false';

        if (isNative && window.Capacitor?.Preferences) {
            await window.Capacitor.Preferences.set({ key: 'premium_status', value: valueStr });
        } else {
            localStorage.setItem('premium_status', valueStr);
        }

        this.setState('premium.isActive', isPremium);
        this.setState('premium.lastChecked', new Date().toISOString());
        console.log(`📢 [AppMain] Premium state updated: ${isPremium}`);
    }

    // ---------- core state methods ----------
    async initialize() {   // ✅ v8.0: เปลี่ยนเป็น async
        verifyFunctionApproval('initialize');
        console.log("🚀 Initializing AppMain v" + window.AppMain_VERSION + "...");
        try {
            this.loadPersistedData();
            
            // ✅ v8.0: เช็ค premium หลังจากโหลดข้อมูล
            await this.checkUserPremiumStatus();
            await this.fetchTrialStatus();
            this._updateTrialBadge();   

            this.setupEventListeners();
            this.updateUIFromState();

            // ✅ [v7.9] หลัง restore state จาก localStorage ครบแล้ว
            // ถ้ามีทั้ง defaultDNA และ customDNA → dispatch musicPointerChanged แบบ combined
            const defaultDNA = this.state.music.default;
            const customDNA = this.state.music.CustomSty;
            const currentPointer = this.state.music.current || 'music.default';

            if (defaultDNA?.sequence && customDNA?.sequence) {
                console.log("📡 [AppMain] Dispatching combined musicPointerChanged after restore");
                window.dispatchEvent(new CustomEvent('musicPointerChanged', {
                    detail: {
                        newPointer: currentPointer,
                        activeDNA: this.getActiveMusicDNA(),
                        combinedDNA: { defaultDNA, customDNA }
                    },
                    bubbles: true
                }));
            } else if (defaultDNA?.sequence) {
                console.log("📡 [AppMain] Dispatching single musicPointerChanged after restore");
                window.dispatchEvent(new CustomEvent('musicPointerChanged', {
                    detail: {
                        newPointer: currentPointer,
                        activeDNA: defaultDNA
                    },
                    bubbles: true
                }));
            }

            // เรียก initialize MusicAudio ถ้ามี
            if (window.AudioController?.initialize && !window.AudioController.initialized) {
                window.AudioController.initialize();
            }

            console.log("✅ AppMain v" + window.AppMain_VERSION + " initialized successfully");
        } catch (error) {
            console.error("❌ AppMain initialization failed:", error);
            throw error;
        }
    }

    getState(path = null) {
        verifyFunctionApproval('getState');
        if (!path) return JSON.parse(JSON.stringify(this.state));
        const keys = path.split('.');
        let current = this.state;
        for (const key of keys) {
            if (current[key] === undefined) return undefined;
            current = current[key];
        }
        return JSON.parse(JSON.stringify(current));
    }

    setState(path, value) {
        verifyFunctionApproval('setState');

        // ตรวจสอบว่าค่าเปลี่ยนหรือไม่
        const oldValue = this._getValueAtPath(path);
        if (this._deepEqual(oldValue, value)) {
            console.log(`[AppMain] setState skipped (no change): ${path}`);
            return true;
        }

        const validation = this.validateStateUpdate(path, value);
        if (!validation.valid) {
            throw new Error(`❌ State validation failed: ${validation.errors.join(', ')}`);
        }

        const keys = path.split('.');
        const newState = JSON.parse(JSON.stringify(this.state));
        let current = newState;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.state = newState;

        this.persistState(path, value);

        window.dispatchEvent(new CustomEvent('stateChanged', {
            detail: { path, value },
            bubbles: true
        }));

        // ✅ [v7.9] เมื่อเปลี่ยน music.current ให้ dispatch เฉพาะ activeDNA ตาม pointer เท่านั้น
        if (path === 'music.current') {
            const activeDNA = this.getActiveMusicDNA();
            window.dispatchEvent(new CustomEvent('musicPointerChanged', {
                detail: {
                    newPointer: value,
                    activeDNA
                },
                bubbles: true
            }));
        }

        this.notifyListeners(path, value);
        this.updateUIFromState();

        console.log(`✅ State updated: ${path}`, { type: typeof value, size: JSON.stringify(value).length });
        return true;
    }

    // ========== 5. ENHANCED VALIDATION METHODS ==========
    validateStateUpdate(path, value) {
        verifyFunctionApproval('validateState');
        
        const errors = [];
        
        try {
            switch(path) {
                case 'user':
                    window.DataContract.validateInput(value, 'app-main');
                    break;
                    
                case 'userCustom':
                    if (value && typeof value !== 'object') {
                        errors.push('userCustom must be an object');
                    }
                    break;
                    
                case 'numerology':
                    window.DataContract.validateNumerologyContext(value);
                    break;
                    
                case 'psychomatrix':
                    if (!value || typeof value !== 'object') {
                        errors.push('Psychomatrix data must be an object');
                    }
                    break;
                    
                case 'luckyNumber':
                    if (!value || typeof value !== 'object') {
                        errors.push('Lucky number data must be an object');
                    }
                    break;
                    
                // ✅ validation ตาม P1: music.current ต้องเป็น string pointer
                case 'music.current':
                    if (value !== null && typeof value !== 'string') {
                        errors.push('music.current must be a string pointer');
                    }
                    if (value && !['music.default', 'music.CustomSty'].includes(value)) {
                        errors.push('music.current must be either "music.default" or "music.CustomSty"');
                    }
                    break;
                    
                case 'music.default':
                case 'music.CustomSty':
                    if (value && typeof value !== 'object') {
                        errors.push('Music DNA must be an object');
                    }
                    if (value && (!value.config || !value.sequence)) {
                        console.warn('[AppMain] ⚠️ Music DNA missing config/sequence (warning)');
                    }
                    break;
                    
                case 'edgeFunctions.psychomatrix':
                case 'edgeFunctions.luckyNumber':
                case 'edgeFunctions.musicGenerator':
                    if (value && typeof value !== 'object') {
                        errors.push('Edge function data must be an object');
                    }
                    break;
                    
                case 'ui.formVisible':
                case 'ui.loading':
                    if (typeof value !== 'boolean') {
                        errors.push('UI state must be boolean');
                    }
                    break;
                    
                case 'ui.currentView':
                case 'ui.currentMode':
                    if (typeof value !== 'string') {
                        errors.push('UI view/mode must be string');
                    }
                    break;
                
                // ✅ v8.0: เพิ่ม validation สำหรับ premium paths
                case 'premium.isActive':
                    if (typeof value !== 'boolean') {
                        errors.push('premium.isActive must be boolean');
                    }
                    break;
                case 'premium.lastChecked':
                    if (value !== null && typeof value !== 'string') {
                        errors.push('premium.lastChecked must be ISO string or null');
                    }
                    break;
                    
                default:
                    console.log(`ℹ️ Validating custom path: ${path}`);
            }
        } catch (error) {
            errors.push(error.message);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    // ========== 6. SUBSCRIPTION SYSTEM ==========
    subscribe(path, callback) {
        verifyFunctionApproval('subscribe');
        
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
        
        return () => {
            const listeners = this.listeners.get(path);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }
    
    notifyListeners(path, newValue) {
        verifyFunctionApproval('notifyListeners');
        
        const listeners = this.listeners.get(path);
        if (listeners) {
            listeners.forEach(cb => {
                try {
                    cb(newValue);
                } catch (error) {
                    console.error(`Listener error for ${path}:`, error);
                }
            });
        }
        
        const wildcard = this.listeners.get('*');
        if (wildcard) {
            wildcard.forEach(cb => {
                try {
                    cb(path, newValue);
                } catch (error) {
                    console.error(`Wildcard listener error:`, error);
                }
            });
        }
    }
    
    // ========== 7. FORM HANDLING ==========
    processFormSubmission(formData) {
        verifyFunctionApproval('processFormSubmission');
        console.log("📋 Processing form submission...", { option: formData.option });
    
        try {
            const validation = this.validateUserData(formData);
            if (!validation.valid) {
                throw new Error(`Form validation failed: ${validation.errors.join(', ')}`);
            }
        
            this.saveUserData(formData);
        
            // ✅ สร้าง trial record เมื่อ submit ครั้งแรก (force create)
            if (!window._trialInitialized) {
                (async () => {
                    try {
                        await window.EdgeFunctionIntegration.callTrialCheck(true);
                        window._trialInitialized = true;
                        console.log('[AppMain] ✅ Trial record created (15 days)');
                        await this.fetchTrialStatus(); // รีเฟรชสถานะ
                    } catch (e) {
                        console.warn('[AppMain] Trial creation failed:', e);
                    }
                })();
            }
        
            this.triggerFormPsychomatrixCalculation(formData);
        
            this.setState('ui.loading', true);
            this.setState('ui.currentView', 'calculating');
        
            return { 
                success: true, 
                data: formData,
                message: 'กำลังประมวลผลข้อมูล...'
            };
        
        } catch (error) {
            console.error("❌ Form processing failed:", error);
            this.showToast(`ข้อมูลไม่ถูกต้อง: ${error.message}`, 'error');
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    validateUserData(formData) {
        verifyFunctionApproval('validateUserData');
        
        const errors = [];
        
        try {
            window.DataContract.validateInput(formData, 'app-main');
        } catch (error) {
            errors.push(error.message);
        }
        
        const option = formData.option || 'BD';
        const personalData = formData.personalData || {};
        
        if (option.includes('FullName') && !personalData.fullName?.trim()) {
            errors.push('กรุณากรอกชื่อ-นามสกุล');
        }
        
        if (option.includes('IDC') && !personalData.id_card?.trim()) {
            errors.push('กรุณากรอกเลขบัตรประชาชน');
        }
        
        if (option.includes('BD') && !personalData.birthDate) {
            errors.push('กรุณากรอกวันเกิด');
        }
        
        if (personalData.birthDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(personalData.birthDate)) {
                errors.push('รูปแบบวันเกิดต้องเป็น "YYYY-MM-DD" เช่น "1968-05-22"');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    // ========== 8. FORM-PSYCHOMATRIX INTEGRATION METHODS ==========
    handlePsychomatrixDataReceived(data) {
        verifyFunctionApproval('handlePsychomatrixDataReceived');
        
        console.log("📊 Handling Psychomatrix data received...");
        
        try {
            window.DataContract.validatePsychomatrixOutput(data);
            
            this.setState('psychomatrix', data);
            this.setState('edgeFunctions.psychomatrix', {
                data: data,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
            
            console.log("✅ Psychomatrix data saved to state");
            
            this.dispatchEvent('psychomatrixDataReady', data);
            
            return true;
            
        } catch (error) {
            console.error("❌ Failed to handle psychomatrix data:", error);
            this.setState('edgeFunctions.psychomatrix', {
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            });
            throw error;
        }
    }
    
    handleLuckyNumberDataReceived(data) {
        verifyFunctionApproval('handleLuckyNumberDataReceived');
        
        console.log("🍀 Handling Lucky Number data received...");
        
        try {
            window.DataContract.validateLuckyNumberOutput(data);
            
            this.setState('luckyNumber', data);
            this.setState('edgeFunctions.luckyNumber', {
                data: data,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
            
            console.log("✅ Lucky Number data saved to state");
            
            this.dispatchEvent('luckyNumberDataReady', data);
            
            return true;
            
        } catch (error) {
            console.error("❌ Failed to handle lucky number data:", error);
            this.setState('edgeFunctions.luckyNumber', {
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            });
            throw error;
        }
    }
    
    handleNumerologyUpdated(numerologyContext) {
        verifyFunctionApproval('handleNumerologyUpdated');
        
        console.log("🔢 Handling Numerology Context update...");
        
        try {
            window.DataContract.validateNumerologyContext(numerologyContext);
            
            this.setState('numerology', numerologyContext);
            
            this.setState('ui.loading', false);
            this.setState('ui.currentView', 'numerology');
            
            console.log("✅ Numerology context saved to state");
            
            this.showToast('คำนวณตัวเลขศาสตร์สำเร็จ!', 'success');
            
            this.dispatchEvent('numerologyReady', numerologyContext);
            
            return true;
            
        } catch (error) {
            console.error("❌ Failed to handle numerology update:", error);
            this.showToast(`การคำนวณตัวเลขศาสตร์ล้มเหลว: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // ========== 9. MUSIC GENERATION FLOW ==========
    async generateMusicDNA() {
        verifyFunctionApproval('generateMusicDNA');
        
        console.log("🎵 Generating Music DNA...");
        
        try {
            const numerologyData = this.getState('numerology');
            const userData = this.getState('user');
            
            if (!numerologyData || !userData) {
                throw new Error("❌ Missing required data for Music DNA generation");
            }
            
            const validation = this.validateForEdgeFunction(numerologyData, userData);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            this.setState('ui.loading', true);
            this.setState('ui.currentView', 'generating');
            
            const musicDNA = await this.sendToEdgeFunction(numerologyData, userData);
            
            // ✅ [v7.9] ตั้งค่า music.current เป็น string pointer เสมอ
            const currentDefault = this.getState('music.default');
            if (!currentDefault) {
                // ครั้งแรก: set default และชี้ไปที่ default
                this.setState('music.default', musicDNA);
                this.setState('music.current', 'music.default');
            } else {
                // มี default อยู่แล้ว → set custom และชี้ไปที่ custom
                this.setState('music.CustomSty', musicDNA);
                this.setState('music.current', 'music.CustomSty');
            }
            
            this.setState('ui.loading', false);
            this.setState('ui.currentView', 'music');
            
            return musicDNA;
            
        } catch (error) {
            console.error("❌ Music DNA generation failed:", error);
            this.setState('ui.loading', false);
            this.setState('ui.currentView', 'error');
            this.showToast(`สร้างดนตรีล้มเหลว: ${error.message}`, 'error');
            throw error;
        }
    }
    
    validateForEdgeFunction(numerologyData, userData) {
        verifyFunctionApproval('validateForEdgeFunction');
        
        const errors = [];
        const option = userData.option || 'BD';
        
        try {
            window.DataContract.validateNumerologyContext(numerologyData);
        } catch (error) {
            errors.push(`Numerology data invalid: ${error.message}`);
        }
        
        try {
            window.DataContract.validateInput(userData, 'app-main');
        } catch (error) {
            errors.push(`User data invalid: ${error.message}`);
        }
        
        const requiredSources = {
            'BD': ['birthDate'],
            'IDC': ['id_card'],
            'FullName': ['fullName'],
            'BD-IDC': ['birthDate', 'id_card'],
            'BD-IDC-FullName': ['birthDate', 'id_card', 'fullName'],
            'Num-Ard': []
        };
        
        const sources = requiredSources[option] || [];
        sources.forEach(source => {
            if (source === 'birthDate' && !numerologyData.sources?.birthDate) {
                errors.push(`Missing birthDate data for option ${option}`);
            }
            if (source === 'id_card' && !numerologyData.sources?.id_card) {
                errors.push(`Missing id_card data for option ${option}`);
            }
            if (source === 'fullName' && !numerologyData.sources?.fullName) {
                errors.push(`Missing fullName data for option ${option}`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    async sendToEdgeFunction(numerologyData, userData) {
        verifyFunctionApproval('sendToEdgeFunction');
        
        console.log("📡 Sending to Music Generator Edge Function via edge-function-integration...");
        
        try {
            const result = await window.EdgeFunctionIntegration.callMusicGenerator(
                numerologyData,
                userData
            );
            
            if (!result || !result.musicDNA) {
                throw new Error('Invalid response from music generator: missing musicDNA');
            }
            
            this.setState('edgeFunctions.musicGenerator', {
                data: result,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
            
            this.showToast('สร้างดนตรีสำเร็จ!', 'success');
            
            console.log("✅ Music DNA received");
            return result.musicDNA;
            
        } catch (error) {
            console.error("❌ Music Generator Edge Function call failed:", error);
            this.setState('edgeFunctions.musicGenerator', {
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            });
            throw error;
        }
    }
    
    // ========== 10. DATA PERSISTENCE (พร้อมลบข้อมูลเสีย) ==========
    saveUserData(formData) {
        verifyFunctionApproval('saveUserData');
        
        try {
            window.DataContract.validateInput(formData, 'app-main');
            this.setState('user', formData);
            
            try {
                localStorage.setItem('psychomatrixUserData', JSON.stringify(formData));
            } catch (error) {
                console.warn("⚠️ Failed to save user data to localStorage:", error);
            }
        } catch (error) {
            throw new Error(`Cannot save invalid user data: ${error.message}`);
        }
    }
    
    loadPersistedData() {
        verifyFunctionApproval('loadUserData');
        
        console.log("📂 Loading persisted data...");
        
        try {
            // ---------- USER DATA ----------
            const userKey = 'psychomatrixUserData';
            const userDataStr = localStorage.getItem(userKey);
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    window.DataContract.validateInput(userData, 'app-main');
                    this.state.user = userData;
                    console.log("✅ Loaded valid user data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${userKey}, removing:`, error.message);
                    localStorage.removeItem(userKey);
                    if (typeof this.showToast === 'function') {
                        this.showToast('ข้อมูลผู้ใช้รูปแบบเก่าถูกลบ กรุณากรอกใหม่', 'warning');
                    }
                }
            }
            
            // ---------- USER CUSTOM DATA ----------
            const userCustomKey = 'psychomatrixUserDataCustom';
            const userCustomStr = localStorage.getItem(userCustomKey);
            if (userCustomStr) {
                try {
                    const userCustom = JSON.parse(userCustomStr);
                    this.state.userCustom = userCustom;
                    console.log("✅ Loaded user custom data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${userCustomKey}, removing:`, error.message);
                    localStorage.removeItem(userCustomKey);
                }
            }
            
            // ---------- NUMEROLOGY DATA ----------
            const numKey = 'psychomatrixNumerologyData';
            const numStr = localStorage.getItem(numKey);
            if (numStr) {
                try {
                    const numData = JSON.parse(numStr);
                    window.DataContract.validateNumerologyContext(numData);
                    this.state.numerology = numData;
                    console.log("✅ Loaded valid numerology data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${numKey}, removing:`, error.message);
                    localStorage.removeItem(numKey);
                }
            }
            
            // ---------- PSYCHOMATRIX DATA ----------
            const psyKey = 'psychomatrixPsychomatrixData';
            const psyStr = localStorage.getItem(psyKey);
            if (psyStr) {
                try {
                    const psyData = JSON.parse(psyStr);
                    this.state.psychomatrix = psyData;
                    console.log("✅ Loaded psychomatrix data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${psyKey}, removing:`, error.message);
                    localStorage.removeItem(psyKey);
                }
            }
            
            // ---------- LUCKY NUMBER DATA ----------
            const luckKey = 'psychomatrixLuckyNumberData';
            const luckStr = localStorage.getItem(luckKey);
            if (luckStr) {
                try {
                    const luckData = JSON.parse(luckStr);
                    window.DataContract.validateLuckyNumberOutput(luckData);
                    this.state.luckyNumber = luckData;
                    console.log("✅ Loaded lucky number data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${luckKey}, removing:`, error.message);
                    localStorage.removeItem(luckKey);
                }
            }
            
            // ---------- MUSIC CURRENT (pointer) ----------
            const musicCurrKey = 'psychomatrixMusicCurrent';
            const musicCurrStr = localStorage.getItem(musicCurrKey);
            if (musicCurrStr) {
                try {
                    const musicCurr = JSON.parse(musicCurrStr);
                    if (typeof musicCurr === 'string') {
                        this.state.music.current = musicCurr;
                        console.log("✅ Loaded music current pointer:", musicCurr);
                    } else {
                        console.warn(`⚠️ ${musicCurrKey} is object, attempting migration`);
                        this.state.music.current = null;
                    }
                } catch (error) {
                    console.warn(`⚠️ Invalid ${musicCurrKey}, removing:`, error.message);
                    localStorage.removeItem(musicCurrKey);
                }
            }
            
            // ---------- MUSIC DEFAULT ----------
            const musicDefKey = 'psychomatrixMusicDefault';
            const musicDefStr = localStorage.getItem(musicDefKey);
            if (musicDefStr) {
                try {
                    const musicDef = JSON.parse(musicDefStr);
                    if (musicDef && typeof musicDef === 'object' && musicDef.config) {
                        this.state.music.default = musicDef;
                        console.log("✅ Loaded valid music default");
                    } else {
                        throw new Error('Invalid music default structure');
                    }
                } catch (error) {
                    console.warn(`⚠️ Invalid ${musicDefKey}, removing:`, error.message);
                    localStorage.removeItem(musicDefKey);
                }
            }
            
            // ---------- MUSIC CUSTOM STYLE ----------
            const musicCustomKey = 'psychomatrixMusicCustomStyle';
            const musicCustomStr = localStorage.getItem(musicCustomKey);
            if (musicCustomStr) {
                try {
                    const musicCustom = JSON.parse(musicCustomStr);
                    if (musicCustom && typeof musicCustom === 'object' && musicCustom.config) {
                        this.state.music.CustomSty = musicCustom;
                        console.log("✅ Loaded valid music custom style");
                    } else {
                        throw new Error('Invalid music custom style structure');
                    }
                } catch (error) {
                    console.warn(`⚠️ Invalid ${musicCustomKey}, removing:`, error.message);
                    localStorage.removeItem(musicCustomKey);
                }
            }
            
            // ---------- EDGE FUNCTIONS ----------
            const edgeKey = 'psychomatrixEdgeFunctions';
            const edgeStr = localStorage.getItem(edgeKey);
            if (edgeStr) {
                try {
                    const edgeFunctions = JSON.parse(edgeStr);
                    this.state.edgeFunctions = edgeFunctions;
                    console.log("✅ Loaded edge function results");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${edgeKey}, removing:`, error.message);
                    localStorage.removeItem(edgeKey);
                }
            }
            
            this.migrateStorageSchema();
            
        } catch (error) {
            console.error("❌ Error loading persisted data:", error);
        }
    }
    
    persistState(path, value) {
        const persistMap = {
            'user':                'psychomatrixUserData',
            'userCustom':          'psychomatrixUserDataCustom',
            'numerology':          'psychomatrixNumerologyData',
            'psychomatrix':        'psychomatrixPsychomatrixData',
            'luckyNumber':         'psychomatrixLuckyNumberData',
            'music.current':       'psychomatrixMusicCurrent',
            'music.default':       'psychomatrixMusicDefault',
            'music.CustomSty':     'psychomatrixMusicCustomStyle',
            'edgeFunctions':       'psychomatrixEdgeFunctions'
            // premium ไม่ต้อง persist ที่นี่ เพราะใช้ key แยก 'premium_status'
        };
        
        let storageKey = null;
        
        if (persistMap[path]) {
            storageKey = persistMap[path];
        } else if (path.startsWith('edgeFunctions.')) {
            storageKey = 'psychomatrixEdgeFunctions';
        }
        
        if (storageKey) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(value));
            } catch (error) {
                console.warn(`⚠️ Failed to persist ${path}:`, error);
            }
        }
    }
    
    // ========== 11. UI COORDINATION ==========
    updateUIFromState() {
        verifyFunctionApproval('updateUIFromState');
        
        console.log("🔄 Updating UI from state...");
        
        if (typeof window.UI !== 'undefined' && typeof window.UI.updateFromState === 'function') {
            window.UI.updateFromState(this.getState());
        }
        
        if (typeof window.FormPsychomatrix !== 'undefined' && typeof window.FormPsychomatrix.updateFromState === 'function') {
            window.FormPsychomatrix.updateFromState(this.getState());
        }
        
        this.dispatchEvent('stateUpdated', this.getState());
    }
    
    showForm() {
        verifyFunctionApproval('showForm');
        this.setState('ui.formVisible', true);
        this.setState('ui.currentView', 'form');
    }
    
    hideForm() {
        verifyFunctionApproval('hideForm');
        this.setState('ui.formVisible', false);
    }
    
    showToast(message, type = 'info') {
        verifyFunctionApproval('showToast');
        
        console.log(`📢 Toast (${type}): ${message}`);
        
        const event = new CustomEvent('showToast', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    }
    
    // ========== 12. ENHANCED EVENT HANDLING ==========
    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        
        console.log("🔌 Setting up enhanced event listeners...");
        
        window.addEventListener('formSubmitted', (event) => {
            if (event.detail) {
                this.processFormSubmission(event.detail);
            }
        });
        
        window.addEventListener('personalFormSubmitted', (event) => {
            if (event.detail && event.detail.data) {
                this.processFormSubmission(event.detail.data);
            }
        });
        
        window.addEventListener('numerologyCalculated', (event) => {
            this.handleNumerologyUpdated(event.detail);
        });
        
        window.addEventListener('psychomatrixDataReceived', (event) => {
            this.handlePsychomatrixDataReceived(event.detail);
        });
        
        window.addEventListener('luckyNumberDataReceived', (event) => {
            this.handleLuckyNumberDataReceived(event.detail);
        });
        
        window.addEventListener('generateMusicRequest', () => {
            this.generateMusicDNA();
        });
        
        window.addEventListener('updateUIRequest', () => {
            this.updateUIFromState();
        });
        
        window.addEventListener('psychomatrixModeChanged', (event) => {
            if (event.detail && event.detail.mode) {
                this.setState('ui.currentMode', event.detail.mode);
            }
        });
        
        window.addEventListener('calculationOptionChanged', (event) => {
            if (event.detail && event.detail.option) {
                const userData = this.getState('user');
                if (userData) {
                    userData.option = event.detail.option;
                    this.setState('user', userData);
                }
            }
        });
        
        window.addEventListener('personalBlueprintReady', (e) => {
            const blueprint = e.detail?.blueprint;
            if (blueprint && typeof blueprint === 'string' && blueprint.trim().length > 0) {
                localStorage.setItem('current_destiny_blueprint', blueprint);
                console.log('💾 [app-main] Personal Storytelling blueprint saved to localStorage');
            } else {
                console.warn('⚠️ [app-main] personalBlueprintReady received but blueprint invalid', e.detail);
            }
        });
        
        // Subscribe การเปลี่ยนแปลงของ trial state
        this.subscribe('trial', () => this._updateTrialBadge());
        
        console.log("✅ Enhanced event listeners setup complete");
    }
    
    dispatchEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }
    
    triggerFormPsychomatrixCalculation(formData) {
        const event = new CustomEvent('calculateNumerology', {
            detail: formData
        });
        window.dispatchEvent(event);
    }
    
    // ========== 13. RESET METHODS ==========
    resetState() {
        verifyFunctionApproval('resetState');
        
        this.state = {
            user: null,
            userCustom: null,
            numerology: null,
            psychomatrix: null,
            luckyNumber: null,
            music: {
                current: null,
                default: null,
                CustomSty: null
            },
            edgeFunctions: {
                psychomatrix: null,
                luckyNumber: null,
                musicGenerator: null
            },
            premium: {                // ✅ v8.0
                isActive: false,
                lastChecked: null
            },
            ui: {
                formVisible: false,
                loading: false,
                currentView: 'form',
                currentMode: 'personal-form'
            }
        };
        
        this.listeners.clear();
        
        console.log("🔄 State reset complete");
    }
    
    resetStateDataOnly() {
        verifyFunctionApproval('resetStateDataOnly');
        
        this.state.user = null;
        this.state.userCustom = null;
        this.state.numerology = null;
        this.state.psychomatrix = null;
        this.state.luckyNumber = null;
        this.state.music = { default: null, current: null, CustomSty: null };
        this.state.edgeFunctions = {
            psychomatrix: null,
            luckyNumber: null,
            musicGenerator: null
        };
        
        const keysToRemove = [
            'psychomatrixUserData',
            'psychomatrixUserDataCustom',
            'psychomatrixNumerologyData',
            'psychomatrixPsychomatrixData',
            'psychomatrixLuckyNumberData',
            'psychomatrixMusicDefault',
            'psychomatrixMusicCustomStyle',
            'psychomatrixMusicCurrent',
            'psychomatrixEdgeFunctions',
            'current_destiny_blueprint'
        ];
        
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn(`⚠️ Failed to remove ${key}:`, e);
            }
        });
        
        console.log("[AppMain] State data cleared, listeners preserved");
    }
    
    resetToDefaultMusic() {
        verifyFunctionApproval('resetToDefaultMusic');
        
        const defaultDNA = this.getState('music.default');
        if (defaultDNA) {
            this.setState('music.current', 'music.default');
            this.showToast('กลับไปใช้เพลงเริ่มต้น', 'success');
            return true;
        } else {
            this.showToast('ไม่มีเพลงเริ่มต้น', 'warning');
            return false;
        }
    }
    
    // ========== 14. NEW METHODS (ตามแผนเฟส 1) ==========
    
    /**
     * คืนค่า active DNA object ตาม pointer music.current
     */
    getActiveMusicDNA() {
        verifyFunctionApproval('getActiveMusicDNA');
        const pointer = this.state.music.current || 'music.default';
        if (pointer === 'music.CustomSty' && this.state.music.CustomSty) {
            return this.state.music.CustomSty;
        }
        return this.state.music.default;
    }
    
    /**
     * ตรวจสอบและอัปเกรด schema version ของ localStorage
     */
    migrateStorageSchema() {
        verifyFunctionApproval('migrateStorageSchema');
        const savedVer = localStorage.getItem('psychomatrixSchemaVersion');
        
        if (!savedVer || savedVer < '1.2') {
            console.log('[AppMain] 🔄 Running migration from <1.2');
            
            if (!this.state.music.current) {
                const pointer = this.state.userCustom?.useCustomDNA === true
                    ? 'music.CustomSty'
                    : 'music.default';
                this.setState('music.current', pointer);
                console.log(`[AppMain] 🔄 Migrated music.current → "${pointer}"`);
            }
        }
        
        localStorage.setItem(
            'psychomatrixSchemaVersion',
            window.DataContractConstants.SCHEMA_VERSION
        );
        console.log('[AppMain] ✅ Schema migration complete → v1.3');
    }
    
    // ========== 15. HELPER FUNCTIONS ==========
    formatFormDataForState(formData) {
        const option = formData.option || 'BD';
        
        const formattedData = {
            option: option,
            personalData: {
                fullName: '',
                birthDate: '',
                id_card: ''
            },
            musicPreference: {
                style: formData.musicStyle || 'lofi',
                instruments: formData.instruments || ['piano'],
                effects: [],
                natureEffects: []
            }
        };
        
        if (formData.fullName) {
            formattedData.personalData.fullName = formData.fullName;
        }
        
        if (formData.id_card) {
            formattedData.personalData.id_card = formData.id_card;
        }
        
        if (formData.birthDate) {
            try {
                const edgeFormat = window.DataContract.convertISODateToEdgeFormat(formData.birthDate);
                formattedData.personalData.birthDate = edgeFormat;
            } catch (error) {
                throw new Error(`Birth date conversion failed: ${error.message}`);
            }
        }
        
        return formattedData;
    }
    
    // ========== 16. DEBUG & MONITORING ==========
    getStatusReport() {
        return {
            timestamp: new Date().toISOString(),
            state: {
                user: !!this.state.user,
                userCustom: !!this.state.userCustom,
                numerology: !!this.state.numerology,
                psychomatrix: !!this.state.psychomatrix,
                luckyNumber: !!this.state.luckyNumber,
                musicCurrent: !!this.state.music?.current,
                musicDefault: !!this.state.music?.default,
                musicCustom: !!this.state.music?.CustomSty,
                premium: this.state.premium   // ✅ v8.0: แสดง premium state
            },
            edgeFunctions: this.state.edgeFunctions,
            ui: this.state.ui,
            localStorage: {
                userData: !!localStorage.getItem('psychomatrixUserData'),
                userCustom: !!localStorage.getItem('psychomatrixUserDataCustom'),
                numerologyData: !!localStorage.getItem('psychomatrixNumerologyData'),
                musicCurrent: !!localStorage.getItem('psychomatrixMusicCurrent'),
                musicDefault: !!localStorage.getItem('psychomatrixMusicDefault'),
                musicCustom: !!localStorage.getItem('psychomatrixMusicCustomStyle'),
                premiumStatus: localStorage.getItem('premium_status'),
                destinyBlueprint: !!localStorage.getItem('current_destiny_blueprint')   
            }
        };
    }
    
    validateAllData() {
        const errors = [];
        
        try {
            if (this.state.user) {
                window.DataContract.validateInput(this.state.user, 'app-main');
            }
        } catch (error) {
            errors.push(`User data: ${error.message}`);
        }
        
        try {
            if (this.state.numerology) {
                window.DataContract.validateNumerologyContext(this.state.numerology);
            }
        } catch (error) {
            errors.push(`Numerology data: ${error.message}`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// ========== 17. GLOBAL EXPORT ==========
window.AppMain = new AppMainController();

window.AppMainController = {
    initialize: () => window.AppMain.initialize(),
    getState: (path) => window.AppMain.getState(path),
    setState: (path, value) => window.AppMain.setState(path, value),
    resetState: () => window.AppMain.resetState(),
    resetStateDataOnly: () => window.AppMain.resetStateDataOnly(),
    getActiveMusicDNA: () => window.AppMain.getActiveMusicDNA(),
    subscribe: (path, callback) => window.AppMain.subscribe(path, callback),
    
    processFormSubmission: (formData) => window.AppMain.processFormSubmission(formData),
    generateMusicDNA: () => window.AppMain.generateMusicDNA(),
    
    handleNumerologyUpdated: (data) => window.AppMain.handleNumerologyUpdated(data),
    handlePsychomatrixDataReceived: (data) => window.AppMain.handlePsychomatrixDataReceived(data),
    handleLuckyNumberDataReceived: (data) => window.AppMain.handleLuckyNumberDataReceived(data),
    
    updateUIFromState: () => window.AppMain.updateUIFromState(),
    showForm: () => window.AppMain.showForm(),
    hideForm: () => window.AppMain.hideForm(),
    showToast: (message, type) => window.AppMain.showToast(message, type),
    
    resetToDefaultMusic: () => window.AppMain.resetToDefaultMusic(),
    
    formatFormDataForState: (formData) => window.AppMain.formatFormDataForState(formData),
    getStatusReport: () => window.AppMain.getStatusReport(),
    validateAllData: () => window.AppMain.validateAllData(),
    
    // ✅ v8.0: expose premium methods
    checkUserPremiumStatus: () => window.AppMain.checkUserPremiumStatus(),
    updatePremiumState: (isPremium) => window.AppMain.updatePremiumState(isPremium)
};

// ========== 18. AUTO-INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM Content Loaded - Starting AppMain v" + window.AppMain_VERSION + "...");
    
    setTimeout(() => {
        try {
            window.AppMainController.initialize();
            console.log("🎉 AppMain v" + window.AppMain_VERSION + " ready! (State Manager Central with Premium state)");
        } catch (error) {
            console.error("❌ AppMain initialization failed:", error);
            
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            
            const errorContainer = document.getElementById('errorContainer');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="error-message">
                        <h3>⚠️ Application Error</h3>
                        <p>Application failed to start: ${error.message}</p>
                        <button onclick="location.reload()">Reload Page</button>
                    </div>
                `;
                errorContainer.style.display = 'block';
            } else {
                alert("Application failed to start. Please refresh the page.");
            }
        }
    }, 100);
});

// ========== 19. DEBUG VERIFICATION ==========
console.log("✅ APP-MAIN.JS v" + window.AppMain_VERSION + " LOADED");
console.log("📋 Approved Functions APP-MAIN:", Object.keys(APPROVED_FUNCTIONS_AppMain));
console.log("🔗 DataContract available:", typeof window.DataContract !== 'undefined');
console.log("🔗 EdgeFunctionIntegration available:", typeof window.EdgeFunctionIntegration !== 'undefined');
console.log("🎯 State Manager Central ready with Premium isolation");
