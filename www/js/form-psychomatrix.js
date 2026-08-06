// form-psychomatrix.js
// -- ย้าย NumerologyToMusicConverter.js  ไปไว้ที่  Edge 

window.FormPsychomatrix_VERSION = '3.8';

console.log("[FormPsychomatrix] FORM-PSYCHOMATRIX.JS v' + window.FormPsychomatrix_VERSION + '  - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS (คงเดิม) ==========
const APPROVED_FUNCTIONS_PsychoM = {
    constructor:                    true,
    initialize:                     true,
    checkDependencies:              true,
    setupEventListeners:            true,
    setupInitialUI:                 true,
    handleFormSubmission:           true,
    collectFormData:                true,
    validateFormData:               true,
    formatFormDataForEdgeFunction:  true,
    callPsychomatrixCalculate:      true,
    callLuckyNumberCalculate:       true,
    callMusicGenerator:             true,
    transformPsychomatrixData:      true,
    transformLuckyNumberData:       true,
    combineNumerologyData:          true,
    updateUIFromResults:            true,
    showLoading:                    true,
    hideLoading:                    true,
    showError:                      true,
    showSuccess:                    true,
    handleOptionChange:             true,
    handleModeChange:               true,
    generateMusicDNA:               true,
    handleMusicPreferencesChange:   true,
    buildMusicGeneratorPreferences: true,
    buildFormDataForEdge:           true,
    saveNumerologyToStorage:        true,
    normalizeElement:               true,
    cleanup:                        true,
    _buildPreferencesFromNumerology: true,
    _validateMusicDNA:              true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_PsychoM[functionName]) {
        throw new Error(`[FormPsychomatrix] UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
    }
    return true;
}

// ========== 2. MAIN CONTROLLER CLASS ==========
class FormPsychomatrixController {
    constructor() {
        verifyFunctionApproval('constructor');
        this.state = {
            currentFormData:    null,
            currentOption:      null,
            currentMode:        'personal-form',
            isLoading:          false,
            psychomatrixData:   null,
            luckyNumberData:    null,
            numerologyContext:  null,
            numerologyRaw:      null,
            musicDNA:           null   // เก็บเฉพาะ DNA ที่ generate ล่าสุด (optional)
        };
        this._suppressMusicRegen = false;
        this._isGenerating = false;          // ป้องกันการ submit ซ้อน
        this._lastGenerateTime = 0;           // ใช้สำหรับ throttle ใน generateMusicDNA
        this.GENERATE_THROTTLE = 500;         // milliseconds

        console.log("[FormPsychomatrix] v3.0.9 constructed");
    }

    // ========== 3. INITIALIZATION ==========
    initialize() {
        if (this._initialized) return;
        this._initialized = true;
        verifyFunctionApproval('initialize');
        console.log("[FormPsychomatrix] Initializing v' + window.FormPsychomatrix_VERSION + '...");
        try {
            this.checkDependencies();
            this.setupEventListeners();
            this.setupInitialUI();
            console.log("[FormPsychomatrix] initialized OK");
        } catch (error) {
            console.error("[FormPsychomatrix] init failed:", error);
            throw error;
        }
    }

    checkDependencies() {
        verifyFunctionApproval('checkDependencies');
        if (typeof window.DataContract === 'undefined') throw new Error("[FormPsychomatrix] DataContract not loaded");
        if (typeof window.AppMainController === 'undefined') throw new Error("[FormPsychomatrix] AppMain not loaded");
        if (typeof window.EdgeFunctionIntegration === 'undefined') throw new Error("[FormPsychomatrix] EdgeFunctionIntegration not loaded");
        if (typeof window.MusicStyles === 'undefined') throw new Error("[FormPsychomatrix] MusicStyles not loaded (required for default DNA)");
        if (typeof window.DataContractConstants === 'undefined') throw new Error("[FormPsychomatrix] DataContractConstants not loaded (required for element mapping)");

        // ตรวจสอบ presets (optional) - แค่เตือนถ้าไม่มี
        const presets = ['earthPresets', 'firePresets', 'metalPresets', 'waterPresets', 'woodPresets'];
        presets.forEach(p => {
            if (typeof window[p] === 'undefined') {
                console.warn(`[FormPsychomatrix] Warning: ${p} not loaded. Will fallback to NumerologyToMusicConverter.`);
            }
        });
    }

    // ========== 4. EVENT LISTENERS ==========
    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');

        window.addEventListener('personalFormSubmitted', (e) => this.handleFormSubmission(e.detail));
        window.addEventListener('calculationOptionChanged', (e) => this.handleOptionChange(e.detail.option));
        window.addEventListener('psychomatrixModeChanged', (e) => this.handleModeChange(e.detail.mode));
        window.addEventListener('musicPreferencesChanged', (e) => this.handleMusicPreferencesChange(e.detail));
        window.addEventListener('updateUIRequest', () => this.updateFromState());

        console.log("[FormPsychomatrix] event listeners set");
    }

    setupInitialUI() {
        verifyFunctionApproval('setupInitialUI');
        this.state.currentMode = 'personal-form';
        this.updateModeDisplay('personal-form');
    }

    // ========== 5. FORM SUBMISSION (CORE) ==========
    async handleFormSubmission(formData) {
        verifyFunctionApproval('handleFormSubmission');
        console.log("[FormPsychomatrix] handleFormSubmission v3.0.9 - started", { 
            hasData: !!formData, 
            option: formData?.option 
        });

        // ป้องกันการ submit ซ้อน
        if (this._isGenerating) {
            console.warn("[FormPsychomatrix] Already processing form submission, skipping...");
            return;
        }

        try {
            this.showLoading('กำลังประมวลผลข้อมูล...');
            this._isGenerating = true;

            // 1. ตรวจสอบและเตรียมข้อมูล
            const actualFormData = formData.data || formData;
            console.log("[FormPsychomatrix] Validating form data...");
            const validatedData = this.validateFormData(actualFormData);
            this.state.currentFormData = validatedData;
            this.state.currentOption = validatedData.option;
            console.log("[FormPsychomatrix] Form data validated, option:", validatedData.option);

            // 2. ขอ numerology จาก Edge Function
            console.log("[FormPsychomatrix] Calling EdgeFunctionIntegration.calculateNumerology...");
            const numerologyResult = await window.EdgeFunctionIntegration.calculateNumerology(validatedData);
            console.log("[FormPsychomatrix] Numerology result received", { 
                hasPsychomatrix: !!numerologyResult.psychomatrix,
                hasLuckyNumber: !!numerologyResult.luckyNumber,
                lifePath: numerologyResult.lifePath,
                element: numerologyResult.element
            });

            // 3. บันทึก raw data (optional)
            if (numerologyResult.psychomatrix) {
                this.state.psychomatrixData = numerologyResult.psychomatrix;
                window.dispatchEvent(new CustomEvent('psychomatrixDataReceived', { detail: numerologyResult.psychomatrix }));
            }
            if (numerologyResult.luckyNumber) {
                this.state.luckyNumberData = numerologyResult.luckyNumber;
                window.dispatchEvent(new CustomEvent('luckyNumberDataReceived', { detail: numerologyResult.luckyNumber }));
            }
            this.state.numerologyRaw = numerologyResult;

            // 4. สร้าง numerologyContext
            const lucky = numerologyResult.luckyNumbers;
            if (!lucky || !lucky.LifePathElement) {
                throw new Error("[FormPsychomatrix] Missing LifePathElement in luckyNumbers — cannot determine element");
            }
            const rawElement = lucky.LifePathElement;
            const elementEng = window.DataContractConstants.ELEMENT_MAP_TH_TO_EN[rawElement];
            if (!elementEng) {
                throw new Error(`[FormPsychomatrix] Unknown element value: "${rawElement}" — cannot map to English`);
            }
            const elementCap = window.DataContractConstants.ELEMENT_CAPITALIZE[elementEng];

            const personalYearNumber = lucky.PersonalYearNumber || numerologyResult.lifePath || 0;
            const energy = lucky.LifePathEnergy ;
           
            const currentDayElement = lucky.PersonalDayElement || elementCap;

            const elementRelations = {
                yearElement:  lucky.PersonalYearElement  || elementCap,
                monthElement: lucky.PersonalMonthElement || elementCap,
                dayElement:   lucky.PersonalDayElement   || elementCap
            };

            const numberMeanings = {};
            const psychomatrixArray = numerologyResult.psychomatrix?.results?.[0]?.data?.psychomatrix || [];

            const numerologyContext = {
                lifePath: numerologyResult.lifePath,
                destinyNumber: numerologyResult.destinyNumber,
                element: elementCap,
                energy: energy,
                currentDayElement: currentDayElement,
                elementRelations: elementRelations,
                numberMeanings: numberMeanings,
                personalYearNumber: personalYearNumber,
                psychomatrix: psychomatrixArray
            };

            this.state.numerologyContext = numerologyContext;
            console.log("[FormPsychomatrix] Numerology context built", { 
                lifePath: numerologyContext.lifePath,
                element: numerologyContext.element 
            });

            // 5. เตรียม preferences สำหรับสองแนวเพลง (อ่านจาก validatedData.musicPreference)
            const defaultStyle = validatedData.musicPreference?.defaultStyle || 'lofi';
            const customStyle = validatedData.musicPreference?.customStyle || 'relax';
            console.log("[FormPsychomatrix] Building preferences with styles:", { defaultStyle, customStyle });

            const defaultPrefs = await this._buildPreferencesFromNumerology(numerologyResult, defaultStyle);
            const customPrefs = await this._buildPreferencesFromNumerology(numerologyResult, customStyle);
            
            console.log("[FormPsychomatrix] Preferences built", {
                default: { style: defaultPrefs.style, instruments: defaultPrefs.instruments?.length },
                custom: { style: customPrefs.style, instruments: customPrefs.instruments?.length }
            });

            const edgeFormData = this.buildFormDataForEdge(validatedData);
            console.log("[FormPsychomatrix] Edge form data prepared", { option: edgeFormData.option });

            // 6. เรียก Edge Function แบบ parallel เพื่อสร้าง DNA ทั้งสองชุด
            console.log("[FormPsychomatrix] Calling EdgeFunctionIntegration.generateMusicDNA for default and custom in parallel");
            const [defaultResult, customResult] = await Promise.all([
                window.EdgeFunctionIntegration.generateMusicDNA(numerologyResult, edgeFormData, defaultPrefs),
                window.EdgeFunctionIntegration.generateMusicDNA(numerologyResult, edgeFormData, customPrefs)
            ]);

            console.log("[FormPsychomatrix] Both DNA results received", {
                default: { hasConfig: !!defaultResult?.config, element: defaultResult?.config?.element },
                custom: { hasConfig: !!customResult?.config, element: customResult?.config?.element }
            });

            // 7. ตรวจสอบ element ของผลลัพธ์ทั้งสอง
            if (!defaultResult || !defaultResult.config || !defaultResult.config.element) {
                throw new Error("Invalid default DNA result: missing element");
            }
            if (!customResult || !customResult.config || !customResult.config.element) {
                throw new Error("Invalid custom DNA result: missing element");
            }
            if (defaultResult.config.element.toLowerCase() !== elementEng.toLowerCase()) {
                throw new Error(`Element mismatch in default result: expected ${elementEng}, got ${defaultResult.config.element}`);
            }
            if (customResult.config.element.toLowerCase() !== elementEng.toLowerCase()) {
                throw new Error(`Element mismatch in custom result: expected ${elementEng}, got ${customResult.config.element}`);
            }

            // 8. บันทึกผลลัพธ์ลง AppMain state
            console.log("[FormPsychomatrix] Saving results to AppMain state...");
            window.AppMainController.setState('music.default', defaultResult);
            window.AppMainController.setState('music.CustomSty', customResult);
            window.AppMainController.setState('music.current', 'music.default');
            window.AppMainController.setState('numerology', numerologyContext);

            // 9. อัปเดต UI และ storage
            this.updateUIFromResults(numerologyContext);
            this.saveNumerologyToStorage(numerologyContext);

            // Dispatch event ให้โมดูลอื่นทราบ
            window.dispatchEvent(new CustomEvent('numerologyCalculated', { detail: numerologyContext, bubbles: true }));
            window.dispatchEvent(new CustomEvent('musicDNAStarted', { detail: defaultResult, bubbles: true }));

            // ✅ [  ส่ง event ให้ music-audio.js เล่น combined DNA
            window.dispatchEvent(new CustomEvent('musicPointerChanged', {
                detail: {
                    combinedDNA: {
                        defaultDNA: defaultResult,
                        customDNA: customResult
                    }
                },
                bubbles: true
            }));
            console.log("[FormPsychomatrix] Dispatched musicPointerChanged for combined DNA");

            // ✅ [Phase 1 Storytelling Trigger] dispatch storyContextReady
            // sessionId สร้างครั้งเดียวต่อ session → เป็น key เชื่อม Supabase ใน Phase 2
            const _sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            window.AppMainController.setState('storytelling.sessionId', _sessionId);

            window.dispatchEvent(new CustomEvent('storyContextReady', {
                detail: {
                    sessionId:        _sessionId,
                    numerologyContext: numerologyContext,
                    musicPrefs: {
                        defaultStyle: defaultResult.config?.style || defaultResult.style,
                        customStyle:  customResult.config?.style  || customResult.style,
                        instruments:  defaultResult.instruments   || [],
                        effects:      defaultResult.effects       || [],
                        tempo:        defaultResult.config?.bpm,
                        mood:         defaultResult.config?.mode,
                    },
                    combinedDNA:     { defaultDNA: defaultResult, customDNA: customResult },
                    timestamp:       new Date().toISOString(),
                    supabaseEnabled: false,  // Phase 1: local only — Phase 2+ เปลี่ยน true
                },
                bubbles: true
            }));
            console.log("[FormPsychomatrix] ✅ Dispatched storyContextReady (Phase 1), sessionId:", _sessionId);

            // ✅ เปิดใช้งาน Loop Mode เป็นค่าเริ่มต้น
            if (window.AudioController && typeof window.AudioController.setLoopEnabled === 'function') {
                window.AudioController.setLoopEnabled(true);
                console.log("[FormPsychomatrix] Loop mode enabled by default");
            } else {
                console.warn("[FormPsychomatrix] AudioController not available or setLoopEnabled not found");
            }

            this.showSuccess('คำนวณตัวเลขศาสตร์และสร้างดนตรีทั้งสองสไตล์สำเร็จ!');
            console.log("[FormPsychomatrix] handleFormSubmission completed successfully");

        } catch (error) {
            console.error("[FormPsychomatrix] handleFormSubmission error:", error);
            this.showError(`เกิดข้อผิดพลาด: ${error.message}`);
            // ปิด loading ใน AppMain เพื่อป้องกัน UI ค้าง
            if (window.AppMainController) {
                window.AppMainController.setState('ui.loading', false);
                window.AppMainController.setState('ui.currentView', 'form');
            }
        } finally {
            this._isGenerating = false;
            this.hideLoading(); // ปิด internal loading
        }
    }

    // ========== 6. VALIDATION ==========
    validateFormData(formData) {
        verifyFunctionApproval('validateFormData');
        try {
            window.DataContract.validateInput(formData, 'form-psychomatrix');
            const option      = formData.option || 'BD';
            const personalData = formData.personalData || {};
            const errors = [];

            if (!personalData.birthDate) errors.push('กรุณากรอกวันเกิด');
            if (option.includes('IDC') && !personalData.id_card) errors.push('กรุณากรอกเลขบัตรประชาชน');
            if (option.includes('FullName') && !personalData.fullName) errors.push('กรุณากรอกชื่อ-นามสกุล');
            if (errors.length > 0) throw new Error(errors.join(', '));
            return formData;
        } catch (error) {
            throw new Error(`ข้อมูลไม่ถูกต้อง: ${error.message}`);
        }
    }

    // ========== 7. MUSIC GENERATION (สำหรับ Custom Mode เท่านั้น) ==========
    async generateMusicDNA(customPrefs = null) {
        verifyFunctionApproval('generateMusicDNA');

        // Throttle guard
        const now = Date.now();
        if (now - this._lastGenerateTime < this.GENERATE_THROTTLE) {
            console.log("[FormPsychomatrix] ⏱️ Throttling generateMusicDNA (called too frequently)");
            return;
        }
        this._lastGenerateTime = now;

        console.log("[FormPsychomatrix] generateMusicDNA v3.0.9 (custom mode)");

        // ต้องมี numerologyData และ formData ใน state
        const numerologyData = this.state.numerologyRaw || this.state.numerologyContext;
        const formData = this.state.currentFormData;

        if (!numerologyData) {
            throw new Error("numerologyData is null — กรุณาคำนวณตัวเลขก่อน (ผ่าน form submit)");
        }
        if (!formData) {
            throw new Error("formData is null — กรุณากรอกข้อมูลก่อน");
        }

        try {
            this.showLoading('กำลังสร้างดนตรีจาก DNA...');

            // ถ้าไม่ส่ง customPrefs มา ให้สร้างจาก preferences ปัจจุบัน (จาก userCustom)
            let musicPreferences;
            if (customPrefs) {
                musicPreferences = { ...customPrefs }; // copy
                // ถ้า customPrefs ไม่มี element ให้เพิ่มจาก numerologyData
                if (!musicPreferences.element) {
                    const element = numerologyData.element || this.state.numerologyContext?.element;
                    if (!element) throw new Error("Cannot determine element for custom preferences");
                    musicPreferences.element = element.toLowerCase();
                }
            } else {
                const userCustom = window.AppMainController?.getState?.('userCustom');
                if (userCustom && userCustom.style && userCustom.style !== 'pending') {
                    // ตรวจสอบความครบถ้วนของ userCustom
                    if (!userCustom.style) throw new Error("userCustom.style is missing");
                    if (!userCustom.tempo) throw new Error("userCustom.tempo is missing");
                    if (!userCustom.mood) throw new Error("userCustom.mood is missing");
                    if (!userCustom.intensity) throw new Error("userCustom.intensity is missing");
                    if (!userCustom.instruments || !Array.isArray(userCustom.instruments) || userCustom.instruments.length === 0) {
                        throw new Error("userCustom.instruments is missing or empty");
                    }
                    
                    musicPreferences = {
                        style:        userCustom.style,
                        tempo:        String(userCustom.tempo),
                        mood:         userCustom.mood,
                        intensity:    userCustom.intensity,
                        instruments:  userCustom.instruments,
                        effects:      userCustom.effects || [], // optional
                        natureEffects:(userCustom.natureEffects || []).map(ne => ({
                            type:      ne.type,
                            element:   ne.element,
                            intensity: ne.intensity
                        }))
                    };
                    // เพิ่ม element จาก numerologyData
                    const element = numerologyData.element || this.state.numerologyContext?.element;
                    if (!element) throw new Error("Cannot determine element for preferences");
                    musicPreferences.element = element.toLowerCase();

                    if (musicPreferences.instruments) {
                        musicPreferences.instruments = [...new Set(musicPreferences.instruments)];
                    }
                } else {
                    throw new Error("No userCustom preferences found — กรุณาตั้งค่าเพลงก่อน");
                }
            }

            const edgeFormData = this.buildFormDataForEdge(formData);

            console.log("[FormPsychomatrix] musicPreferences to Edge:", JSON.stringify(musicPreferences));
            console.log("[FormPsychomatrix] edgeFormData to Edge:", JSON.stringify(edgeFormData));

            const musicDNA = await window.EdgeFunctionIntegration.generateMusicDNA(
                numerologyData,
                edgeFormData,
                musicPreferences
            );

            if (!musicDNA) throw new Error("MusicDNA response is empty");

            // ตรวจสอบ element
            const expectedElement = (numerologyData.element || this.state.numerologyContext?.element || '').toLowerCase();
            if (musicDNA.config.element.toLowerCase() !== expectedElement) {
                throw new Error(`Element mismatch: expected ${expectedElement}, got ${musicDNA.config.element}`);
            }

            // Deduplicate instruments (เผื่อ Edge ไม่ทำ)
            if (musicDNA.instruments && Array.isArray(musicDNA.instruments)) {
                musicDNA.instruments = [...new Set(musicDNA.instruments)];
            }

            this._validateMusicDNA(musicDNA, musicPreferences);

            this.state.musicDNA = musicDNA;

            // บันทึกลง music.CustomSty
            window.AppMainController.setState('music.CustomSty', musicDNA);

            window.dispatchEvent(new CustomEvent('musicDNAStarted', { detail: musicDNA }));

            this.updateMusicDNADisplay(musicDNA);
            this.showSuccess('สร้างดนตรีสำเร็จ! 🎵');
            return musicDNA;

        } catch (error) {
            const msg = error?.message || 'Unknown error';
            console.error("[FormPsychomatrix] generateMusicDNA failed:", msg, error);
            this.showError(`สร้างดนตรีล้มเหลว: ${msg}`);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // ========== 7.1 VALIDATE MUSIC DNA ==========
    _validateMusicDNA(musicDNA, originalPreferences) {
        verifyFunctionApproval('_validateMusicDNA');

        if (!musicDNA.config || typeof musicDNA.config !== 'object') {
            throw new Error('MusicDNA missing config object');
        }
        if (!musicDNA.sequence || !Array.isArray(musicDNA.sequence) || musicDNA.sequence.length === 0) {
            throw new Error('MusicDNA sequence is empty or invalid');
        }
        if (!musicDNA.instruments || !Array.isArray(musicDNA.instruments) || musicDNA.instruments.length === 0) {
            throw new Error('MusicDNA instruments are missing or empty');
        }
        if (!musicDNA.effects) {
            console.warn("[FormPsychomatrix] MusicDNA has no effects property");
            musicDNA.effects = [];
        }
        if (!musicDNA.natureEffects) {
            musicDNA.natureEffects = [];
        }
        return true;
    }

    // ========== 8. PRIVATE HELPERS ==========
    // ปรับให้รับ style parameter (lofi / study) และใช้ presets ตาม element และ style อย่างถูกต้อง
async _buildPreferencesFromNumerology(numerologyData, style = 'lofi') {
    // 1. หา element
    let element;
    if (numerologyData.element) {
        element = numerologyData.element;
    } else if (this.state.numerologyContext?.element) {
        element = this.state.numerologyContext.element;
    } else {
        throw new Error("Cannot determine element for preferences");
    }
    const elementLower = element.toLowerCase();
    const energy = numerologyData.luckyNumbers?.LifePathEnergy || numerologyData.energy;

    const edition = window.AppMainController?.getState?.('trial.edition') || 'trial';

    // 2. เรียก MusicPresetCache (Fail-Fast)
    const cached = await window.MusicPresetCache.getPreset(edition, elementLower, style);
    if (!cached || !cached.instruments) {
        throw new Error(`Preset not available for ${edition}.${elementLower}.${style}`);
    }
    const instruments = [...new Set(cached.instruments)];
    const prefs = {
        style,
        tempo: String(cached.tempo),
        mood: cached.mood,
        intensity: cached.intensity,
        instruments,
        effects: cached.effects || [],
        natureEffects: (cached.natureEffects || []).map(ne => ({
            type: ne.type,
            element: ne.element || elementLower,
            intensity: ne.intensity
        })),
        element: elementLower,
        energy
    };
    console.log(`[FormPsychomatrix] Built preferences via MusicPresetCache (${elementLower}/${style}, ed:${edition})`);
    return prefs;
}


    buildMusicGeneratorPreferences(formData) {
        verifyFunctionApproval('buildMusicGeneratorPreferences');
        const userCustom = window.AppMainController?.getState?.('userCustom');
        if (userCustom && userCustom.style && userCustom.style !== 'pending') {
            // ตรวจสอบความครบถ้วนของ userCustom
            if (!userCustom.style) throw new Error("userCustom.style is missing");
            if (!userCustom.tempo) throw new Error("userCustom.tempo is missing");
            if (!userCustom.mood) throw new Error("userCustom.mood is missing");
            if (!userCustom.intensity) throw new Error("userCustom.intensity is missing");
            if (!userCustom.instruments || !Array.isArray(userCustom.instruments) || userCustom.instruments.length === 0) {
                throw new Error("userCustom.instruments is missing or empty");
            }
            
            let instruments = userCustom.instruments;
            instruments = [...new Set(instruments)];
            // ดึง element จาก numerology state (ถ้ามี)
            const element = this.state.numerologyContext?.element || '';
            
            return {
                style:        userCustom.style,
                tempo:        String(userCustom.tempo),
                mood:         userCustom.mood,
                intensity:    userCustom.intensity,
                instruments:  instruments,
                effects:      userCustom.effects || [],
                natureEffects:(userCustom.natureEffects || []).map(ne => ({
                    type:      ne.type,
                    element:   ne.element,
                    intensity: ne.intensity
                })),
                element:      element.toLowerCase()
            };
        }
        
        // ถ้าไม่มี userCustom ให้ใช้จาก formData
        const pref = formData.musicPreference || {};
        if (!pref.style) throw new Error("musicPreference.style is missing");
        if (!pref.tempo) throw new Error("musicPreference.tempo is missing");
        if (!pref.mood) throw new Error("musicPreference.mood is missing");
        if (!pref.intensity) throw new Error("musicPreference.intensity is missing");
        if (!pref.instruments || !Array.isArray(pref.instruments) || pref.instruments.length === 0) {
            throw new Error("musicPreference.instruments is missing or empty");
        }
        
        let instruments = pref.instruments;
        instruments = [...new Set(instruments)];
        const element = this.state.numerologyContext?.element || '';
        
        return {
            style:        pref.style,
            tempo:        String(pref.tempo),
            mood:         pref.mood,
            intensity:    pref.intensity,
            instruments:  instruments,
            effects:      pref.effects || [],
            natureEffects:(pref.natureEffects || []).map(ne => ({
                type:      ne.type,
                element:   ne.element,
                intensity: ne.intensity
            })),
            element:      element.toLowerCase()
        };
    }

    buildFormDataForEdge(formData) {
        verifyFunctionApproval('buildFormDataForEdge');
        const pd = formData.personalData || {};
        return {
            fullName:  pd.fullName  || '',
            id_card:   pd.id_card   || '',
            birthDate: pd.birthDate || '',
            birthTime: pd.birthTime || '00:00',
            option:    formData.option || 'BD',
            edition:   'basic',
            timestamp: formData.timestamp || new Date().toISOString()
        };
    }

    // ========== 9. HANDLE MUSIC PREFERENCES CHANGE ==========
    handleMusicPreferencesChange(preferences) {
        verifyFunctionApproval('handleMusicPreferencesChange');

        if (this._suppressMusicRegen) {
            console.log("[FormPsychomatrix] musicPreferencesChanged ignored (suppress flag on)");
            return;
        }

        if (this._isGenerating) {
            console.log("[FormPsychomatrix] musicPreferencesChanged ignored (already generating)");
            return;
        }

        console.log("[FormPsychomatrix] musicPreferencesChanged:", preferences);

        if (!this.state.currentFormData) {
            console.warn("[FormPsychomatrix] no currentFormData — cannot regenerate");
            return;
        }

        if (preferences.useCustomDNA !== undefined && Object.keys(preferences).length === 1) {
            console.log("[FormPsychomatrix] skip regen: only useCustomDNA changed");
            return;
        }

        if (this.state.currentFormData) {
            this.state.currentFormData.musicPreference = preferences;
        }

        this.generateMusicDNA(preferences).catch(err => {
            console.error("[FormPsychomatrix] regenerate failed:", err);
            this.showError(`สร้างเพลงล้มเหลว: ${err.message}`);
        });
    }

    // ========== 10. STORAGE ==========
    saveNumerologyToStorage(numerologyContext) {
        verifyFunctionApproval('saveNumerologyToStorage');
        try {
            localStorage.setItem('psychomatrixNumerologyData', JSON.stringify(numerologyContext));
            console.log("[FormPsychomatrix] saved numerologyData to localStorage");
        } catch (e) {
            console.warn("[FormPsychomatrix] cannot save numerologyData:", e);
        }
    }

    // ========== 11. UI UPDATE METHODS ==========
    updateUIFromResults(numerologyContext) {
        verifyFunctionApproval('updateUIFromResults');
        try {
            this.updatePsychomatrixDisplay(numerologyContext);
        } catch (error) {
            console.error("[FormPsychomatrix] UI update error:", error);
        }
    }

    updatePsychomatrixDisplay(numerologyContext) {
        const displayContainer = document.getElementById('psychomatrix-display');
        if (!displayContainer) return;

        let html = `<div class="psychomatrix-card"><h3>🧮 Psychomatrix Results</h3><div class="matrix-grid">`;
        for (let row = 0; row < 3; row++) {
            html += '<div class="matrix-row">';
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                const count = (numerologyContext.psychomatrix?.[index]) || 0;
                const number = index + 1;
                html += `<div class="matrix-cell ${count > 0 ? 'active' : ''}">
                    <div class="matrix-number">${number}</div>
                    <div class="matrix-count">${count}</div>
                </div>`;
            }
            html += '</div>';
        }
        html += `</div>
            <div class="matrix-info">
                <p><strong>Life Path:</strong> ${numerologyContext.lifePath || 'N/A'} (${numerologyContext.element || 'N/A'})</p>
                <p><strong>Destiny Number:</strong> ${numerologyContext.destinyNumber || 'N/A'}</p>
                <p><strong>Personal Year:</strong> ${numerologyContext.personalYearNumber || 'N/A'}</p>
            </div></div>`;
        displayContainer.innerHTML = html;
    }

    updateMusicDNADisplay(musicDNA) {
        const container = document.getElementById('music-result');
        if (!container || !musicDNA) return;
        const { config, storytelling } = musicDNA;
        container.innerHTML = `
            <div class="music-result-card">
                <h3>🎵 Music DNA Generated</h3>
                <div class="config-info">
                    <p><strong>Root Note:</strong> ${config?.root     || 'N/A'}</p>
                    <p><strong>Scale:</strong>     ${config?.scale    || 'N/A'}</p>
                    <p><strong>BPM:</strong>       ${config?.bpm      || 'N/A'}</p>
                    <p><strong>Element:</strong>   ${config?.element  || 'N/A'}</p>
                    <p><strong>Mode:</strong>      ${config?.mode     || 'N/A'}</p>
                </div>
                ${storytelling ? `<div class="storytelling-display">
                    <h4>Your Music Story:</h4>
                    <p>${storytelling.foundation || ''}</p>
                    <p>${storytelling.heartbeat  || ''}</p>
                    <p>${storytelling.spark      || ''}</p>
                    <p>${storytelling.atmosphere || ''}</p>
                </div>` : ''}
            </div>`;
    }

    updateFromState() {
        try {
            const state = window.AppMainController.getState();
            if (state.numerology)    this.updateUIFromResults(state.numerology);
            if (state.music?.current) {
                const activeDNA = window.AppMainController.getActiveMusicDNA?.();
                if (activeDNA) this.updateMusicDNADisplay(activeDNA);
            }
        } catch (error) {
            console.error("[FormPsychomatrix] updateFromState error:", error);
        }
    }

    // ========== 12. UI UTILITIES ==========
    showLoading(message) {
        verifyFunctionApproval('showLoading');
        this.state.isLoading = true;
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type: 'info' } }));
    }

    hideLoading() {
        verifyFunctionApproval('hideLoading');
        this.state.isLoading = false;
    }

    showError(message) {
        verifyFunctionApproval('showError');
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type: 'error' } }));
        console.error(`[FormPsychomatrix] ❌ ${message}`);
    }

    showSuccess(message) {
        verifyFunctionApproval('showSuccess');
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type: 'success' } }));
    }

    handleOptionChange(option) {
        verifyFunctionApproval('handleOptionChange');
        this.state.currentOption = option;
    }

    handleModeChange(mode) {
        verifyFunctionApproval('handleModeChange');
        this.state.currentMode = mode;
        this.updateModeDisplay(mode);
    }

    updateModeDisplay(mode) {
        document.querySelectorAll('.mode-section').forEach(s => s.style.display = 'none');
        const sel = document.getElementById(`${mode}-section`);
        if (sel) sel.style.display = 'block';
    }

    normalizeElement(el) {
        verifyFunctionApproval('normalizeElement');
        if (!el || typeof el !== 'string') return null;
        return el.toLowerCase();
    }

    // ========== 13. CLEANUP ==========
    cleanup() {
        verifyFunctionApproval('cleanup');
        this.state = {
            currentFormData: null, currentOption: null, currentMode: 'personal-form',
            isLoading: false, psychomatrixData: null, luckyNumberData: null,
            numerologyContext: null, numerologyRaw: null, musicDNA: null
        };
        this._suppressMusicRegen = false;
        this._isGenerating = false;
        this._lastGenerateTime = 0;
        console.log("[FormPsychomatrix] cleaned up");
    }

    // ========== 14. PUBLIC METHODS ==========
    getCurrentData() {
        return { formData: this.state.currentFormData, numerology: this.state.numerologyContext, musicDNA: this.state.musicDNA };
    }

    resetForm() {
        this.state.currentFormData = null;
        this.state.currentOption   = null;
        this.state.psychomatrixData   = null;
        this.state.luckyNumberData    = null;
        this.state.numerologyContext  = null;
        this.state.musicDNA           = null;
        document.querySelectorAll('form').forEach(f => f.reset());
        document.querySelectorAll('.result-container').forEach(c => c.innerHTML = '');
        console.log("[FormPsychomatrix] form reset");
    }
}

// ========== 15. GLOBAL EXPORT ==========
window.FormPsychomatrix = new FormPsychomatrixController();

window.FormPsychomatrixController = {
    initialize:          () => window.FormPsychomatrix.initialize(),
    handleFormSubmission:(formData) => window.FormPsychomatrix.handleFormSubmission(formData),
    generateMusicDNA:    (prefs) => window.FormPsychomatrix.generateMusicDNA(prefs),
    getCurrentData:      () => window.FormPsychomatrix.getCurrentData(),
    resetForm:           () => window.FormPsychomatrix.resetForm(),
    cleanup:             () => window.FormPsychomatrix.cleanup(),
    handleCalculateNumerologyRequest: (formData) => window.FormPsychomatrix.handleFormSubmission(formData),
    setSuppressMusicRegen: (v) => { window.FormPsychomatrix._suppressMusicRegen = v; }
};

// ========== 16. AUTO-INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log("[FormPsychomatrix] DOM loaded - Starting v" + window.FormPsychomatrix_VERSION + "...");
    
    function tryInit() {
        if (typeof window.DataContract       === 'undefined' ||
            typeof window.AppMainController  === 'undefined' ||
            typeof window.EdgeFunctionIntegration === 'undefined' ||
            typeof window.MusicStyles        === 'undefined' ||
            typeof window.DataContractConstants === 'undefined') {
            console.warn("[FormPsychomatrix] dependencies not ready, retry 500ms");
            setTimeout(tryInit, 500);
            return;
        }
        
        try {
            window.FormPsychomatrixController.initialize();
            console.log("[FormPsychomatrix] v" + window.FormPsychomatrix_VERSION + " ready!");
        } catch (error) {
            console.error("[FormPsychomatrix] init failed:", error);
            const el = document.getElementById('error-message');
            if (el) { el.textContent = 'ระบบฟอร์มไม่พร้อม โปรดรีเฟรชหน้า'; el.style.display = 'block'; }
        }
    }
    
    setTimeout(tryInit, 300);
});

console.log("[FormPsychomatrix] FORM-PSYCHOMATRIX.JS v" , window.FormPsychomatrix_VERSION , " LOADED");
console.log("[FormPsychomatrix] Approved functions:", Object.keys(APPROVED_FUNCTIONS_PsychoM));