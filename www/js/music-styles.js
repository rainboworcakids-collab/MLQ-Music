// music-styles.js v6.1 – Integrated with MusicPresetCache (Edge/DB presets)
// แก้ไขจาก v5.8:
//   - ใช้ await window.MusicPresetCache.getPreset() แทน window.*Presets
//   - รองรับ Edition จาก AppMain state แบบ dynamic
//   - ลบ dependency window.earthPresets, firePresets, …
//   - ฟังก์ชันที่เคยเป็น sync เปลี่ยนเป็น async (getPresetByElementAndStyle, applyPresetWithStyle, handleStyleChange, …)
//   - buildAvailableStyles ใช้ static list (4 styles) โดยไม่ต้องอ่านจาก presets
//   - เก็บ Logic อื่น ๆ ทั้งหมดตามเดิม

window.MusicStyles_VERSION = "6.1";

console.log("[MusicStyles] 🔧🎵 v" + window.MusicStyles_VERSION + " - Edge‑driven presets, edition‑aware");

// ========== 1. DEPENDENCY CHECK ==========
if (typeof window.DataContract === 'undefined') {
    throw new Error("[MusicStyles] ❌ CRITICAL: data-contract.js must be loaded before music-styles.js");
}
if (typeof window.MusicPresetCache === 'undefined') {
    throw new Error("[MusicStyles] ❌ CRITICAL: music-preset-cache.js must be loaded before music-styles.js");
}

// ========== 2. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_MusicStyle = {
    constructor: true,
    initialize: true,
    loadElementPresets: true,
    buildAvailableStyles: true,
    getPresetByElementAndStyle: true,
    applyPresetWithStyle: true,
    getCurrentElement: true,
    normalizeElement: true,
    setupEventListeners: true,
    bindSaveButton: true,
    handleNumerologyCalculated: true,
    handleStyleChange: true,
    handleInstrumentChange: true,
    handleNatureChange: true,
    handleTempoChange: true,
    updateMusicSettingsDisplay: true,
    updateInstrumentSelects: true,
    updateNatureSelect: true,
    updateTempoSlider: true,
    updateStyleSelect: true,
    updateDNASourceToggle: true,
    updateStorageStatusDisplay: true,
    getStyleDisplayName: true,
    mapNatureEffectToString: true,
    mapNatureValueToObject: true,
    getPreferences: true,
    savePreferences: true,
    loadPreferencesFromStorage: true,
    syncToAppMain: true,
    emitPreferencesChanged: true,
    validateMusicPreferences: true,
    registerWithDataContract: true,
    openMusicSettingsModal: true,
    setUseCustomDNA: true,
    resetToDefaultDNA: true,
    ensureDNAToggleSection: true,
    getDefaultDNA: true,
    setSuppressNumerologyHandler: true,
    buildFullMusicDNAFromPreferences: true,
    mapNatureTypeToDropdownValue: true,
    _setFormEnabled: true,
    reloadFormFromDNA: true,
    _getCurrentEdition: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_MusicStyle[functionName]) {
        throw new Error(`[MusicStyles] 🚫 UNAPPROVED FUNCTION: "${functionName}"`);
    }
    return true;
}

// ========== 3. CLASS ==========
class MusicStyles {
    constructor() {
        verifyFunctionApproval('constructor');
        this.availableStyles = null;
        this._suppressNumerologyHandler = false;
        this.currentDisplayPrefs = null;
        console.log("[MusicStyles] v" + window.MusicStyles_VERSION + " constructed (Edge presets)");
    }

    // ─── Edition helper ───
    _getCurrentEdition() {
        verifyFunctionApproval('_getCurrentEdition');
        // อ่าน edition จาก state trial (ถูกตั้งโดย trial-check)
        const trial = window.AppMainController?.getState?.('trial');
        return trial?.edition || 'basic';
    }

    // ─── Init ───
    async initialize() {
        verifyFunctionApproval('initialize');
        if (this._initialized) {
            console.warn("[MusicStyles] initialize() called again — skipped");
            return;
        }
        this._initialized = true;
        try {
            await this.loadElementPresets();   // warm up cache
            this.buildAvailableStyles();
            this.setupEventListeners();
            await this.registerWithDataContract();
            this.loadPreferencesFromStorage();
            console.log("[MusicStyles] v" + window.MusicStyles_VERSION + " initialized OK");
            this._toast('โหลดการตั้งค่าเพลงสำเร็จ', 'success');
        } catch (error) {
            console.error("[MusicStyles] init failed:", error);
            this._toast('ไม่สามารถโหลดการตั้งค่าเพลง', 'error');
            this._setStatusText('ระบบเพลงไม่พร้อม', 'red');
            this._initialized = false;
            throw error;
        }
    }

    _toast(message, type) {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type } }));
    }

    _setStatusText(text, color) {
        const el = document.getElementById('musicStatusText');
        if (el) { el.textContent = text; el.className = `text-sm font-medium text-${color}-300`; }
    }

    // ─── 4. PRESETS – ใช้ MusicPresetCache ───
    async loadElementPresets() {
        verifyFunctionApproval('loadElementPresets');
        // รอให้ cache พร้อม (fetch ครั้งแรก)
        if (window.MusicPresetCache.ensurePresetsLoaded) {
            await window.MusicPresetCache.ensurePresetsLoaded();
        }
        console.log("[MusicStyles] MusicPresetCache ready");
    }

    buildAvailableStyles() {
        verifyFunctionApproval('buildAvailableStyles');
        // ไม่ต้องอ่านจาก presets อีกต่อไป – ใช้รายชื่อคงที่
        this.availableStyles = {
            lofi:  { displayName: '🎵 Lo-fi Beats' },
            chill: { displayName: '🌊 Chill / Ambient' },
            study: { displayName: '📚 Study / Focus' },
            relax: { displayName: '🧘 Relax / Meditation' }
        };
        console.log("[MusicStyles] availableStyles:", Object.keys(this.availableStyles));
    }

    // ─── 5. ELEMENT HELPERS ───
    normalizeElement(el) {
        verifyFunctionApproval('normalizeElement');
        if (!el || typeof el !== 'string') return null;
        const lower = el.toLowerCase();
        const THAI_TO_EN = {
            'ดิน': 'earth', 'ไฟ': 'fire', 'น้ำ': 'water', 'โลหะ': 'metal', 'ไม้': 'wood',
            'earth': 'earth', 'fire': 'fire', 'water': 'water', 'metal': 'metal', 'wood': 'wood',
            'Earth': 'earth', 'Fire': 'fire', 'Water': 'water', 'Metal': 'metal', 'Wood': 'wood'
        };
        if (typeof window.DataContractConstants?.ELEMENT_MAP_TH_TO_EN !== 'undefined') {
            const mapped = window.DataContractConstants.ELEMENT_MAP_TH_TO_EN[el] 
                        || window.DataContractConstants.ELEMENT_MAP_TH_TO_EN[lower];
            if (mapped) return mapped.toLowerCase();
        }
        return THAI_TO_EN[el] || THAI_TO_EN[lower] || lower;
    }

    getCurrentElement() {
        verifyFunctionApproval('getCurrentElement');
        if (typeof window.AppMainController !== 'undefined') {
            const num = window.AppMainController.getState?.('numerology');
            if (num?.element) return this.normalizeElement(num.element);
        }
        const prefs = this.getPreferences();
        if (prefs?.element) return this.normalizeElement(prefs.element);
        return null;
    }

    async getPresetByElementAndStyle(element, style) {
        verifyFunctionApproval('getPresetByElementAndStyle');
        if (!element) throw new Error('[MusicStyles] element is required');
        const norm = this.normalizeElement(element);
        const edition = this._getCurrentEdition();
        return await window.MusicPresetCache.getPreset(norm, style, edition);
    }

    _deduplicate(arr) {
        return arr ? [...new Set(arr)] : arr;
    }

    // ─── 6. APPLY PRESET (async) ───
    async applyPresetWithStyle(element, style) {
        verifyFunctionApproval('applyPresetWithStyle');
        if (!element) throw new Error('[MusicStyles] element is required');
        const preset = await this.getPresetByElementAndStyle(element, style);
        let instruments = [...(preset.instruments || [])];
        while (instruments.length < 3) instruments.push('electricPiano');
        if (instruments.length > 3) instruments = instruments.slice(0, 3);
        instruments = this._deduplicate(instruments);

        const prefs = {
            style,
            tempo:         preset.tempo     || 85,
            mood:          preset.mood      || 'calm',
            intensity:     preset.intensity || 'medium',
            instruments,
            effects:       [...(preset.effects       || [])],
            natureEffects: [...(preset.natureEffects || [])],
            element:       this.normalizeElement(element),
            useCustomDNA:  true
        };

        this.savePreferences(prefs);
        this.syncToAppMain(prefs);
        this.updateMusicSettingsDisplay(prefs);
        
        if (!this._suppressNumerologyHandler && window.FormPsychomatrixController?.generateMusicDNA) {
            window.FormPsychomatrixController.generateMusicDNA();
        }
        console.log(`[MusicStyles] preset applied: element=${element} style=${style}`);
    }

    async getDefaultDNA(element, style = 'lofi') {
        verifyFunctionApproval('getDefaultDNA');
        const normElement = this.normalizeElement(element);
        const preset = await this.getPresetByElementAndStyle(normElement, style);
        let instruments = [...(preset.instruments || [])];
        while (instruments.length < 3) instruments.push('electricPiano');
        if (instruments.length > 3) instruments = instruments.slice(0, 3);
        instruments = this._deduplicate(instruments);

        return {
            style,
            tempo: preset.tempo,
            mood: preset.mood,
            intensity: preset.intensity,
            instruments,
            effects: [...(preset.effects || [])],
            natureEffects: (preset.natureEffects || []).map(ne => ({
                type: ne.type,
                element: ne.element,
                intensity: ne.intensity,
                toneParams: ne.toneParams || {}
            })),
            element: normElement,
            useCustomDNA: false
        };
    }

    // ── story ฯลฯ เหมือนเดิม ──
    setSuppressNumerologyHandler(value) {
        verifyFunctionApproval('setSuppressNumerologyHandler');
        this._suppressNumerologyHandler = (value === true);
    }

    buildFullMusicDNAFromPreferences(prefs, numerologyCtx = null) {
        // … เหมือนเดิมทุกประการ …
        verifyFunctionApproval('buildFullMusicDNAFromPreferences');
        if (typeof window.DataContractConstants?.validatePreferences === 'function') {
            window.DataContractConstants.validatePreferences(prefs);
        } else {
            if (!prefs?.element) throw new Error('prefs.element required');
        }
        const rootMap = { wood: 'C', fire: 'D', earth: 'E', metal: 'F', water: 'G' };
        const root = rootMap[prefs.element];
        if (!root) throw new Error(`unknown element "${prefs.element}"`);

        const noteIndex = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
        const getNoteFromRoot = (rootLetter, intervalSemitones) => {
            const chromatic = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
            const rootIdx = noteIndex[rootLetter];
            const targetIdx = (rootIdx + intervalSemitones) % 12;
            return chromatic[targetIdx];
        };
        const majorThird = getNoteFromRoot(root, 4);
        const perfectFifth = getNoteFromRoot(root, 7);

        const sequence = [
            { note: root + '4', duration: '4n', time: 0   },
            { note: majorThird + '4', duration: '4n', time: 0.5 },
            { note: perfectFifth + '4', duration: '4n', time: 1.0 },
            { note: root + '5', duration: '2n', time: 1.5 }
        ];

        let storytelling = null;
        if (numerologyCtx && window.StorytellingEngine) {
            try { storytelling = window.StorytellingEngine.generateStory(numerologyCtx, prefs); }
            catch (e) { console.warn("[MusicStyles] StorytellingEngine error:", e.message); storytelling = null; }
        }

        const instruments = prefs.instruments && prefs.instruments.length > 0
            ? this._deduplicate(prefs.instruments)
            : ['piano', 'strings', 'pad'];
        const effects = prefs.effects && Array.isArray(prefs.effects) ? [...prefs.effects] : [];
        const natureEffects = prefs.natureEffects && Array.isArray(prefs.natureEffects) ? [...prefs.natureEffects] : [];

        return {
            config: { root, scale: 'major', bpm: prefs.tempo, element: prefs.element, mode: prefs.mood, foundationNumber: 1 },
            sequence,
            storytelling,
            instruments,
            effects,
            natureEffects,
            audit: {
                totalNotes: sequence.length, firstNote: sequence[0].note,
                mode: prefs.mood, expectedLength: 4, isRootFirst: true,
                generatedAt: new Date().toISOString(), source: 'buildFullMusicDNAFromPreferences'
            }
        };
    }

    // ─── 7. EVENT LISTENERS ───
    setupEventListeners() {
        const styleSelect = document.getElementById('modalMusicStyle');
        if (styleSelect && !styleSelect._msBound) {
            styleSelect.addEventListener('change', (e) => this.handleStyleChange(e));
            styleSelect._msBound = true;
        }
        ['instrument1','instrument2','instrument3'].forEach((id, idx) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', (e) => this.handleInstrumentChange(idx, e.target.value));
        });
        const natureEl = document.getElementById('natureSound');
        if (natureEl) natureEl.addEventListener('change', (e) => this.handleNatureChange(e.target.value));
        const tempoEl = document.getElementById('tempoRange');
        if (tempoEl) tempoEl.addEventListener('input', (e) => this.handleTempoChange(parseInt(e.target.value, 10)));
        this._bindDNASourceButtons();
        window.addEventListener('numerologyCalculated', (e) => this.handleNumerologyCalculated(e.detail));
    }

    _bindDNASourceButtons() {
        const d = document.getElementById('dnaSourceDefault');
        const c = document.getElementById('dnaSourceCustom');
        if (d && !d._msBound) { d.addEventListener('click', () => this.resetToDefaultDNA()); d._msBound = true; }
        if (c && !c._msBound) { c.addEventListener('click', () => this.setUseCustomDNA(true)); c._msBound = true; }
    }

    // ─── 8. NUMEROLOGY HANDLER ───
    async handleNumerologyCalculated(detail) {
        if (this._suppressNumerologyHandler) return;
        let element = detail?.element || detail?.numerologyContext?.element;
        if (!element) return;
        element = this.normalizeElement(element);
        const currentPrefs = this.getPreferences();
        const sameEl = currentPrefs && this.normalizeElement(currentPrefs.element) === element;
        if (!sameEl) {
            await this.applyPresetWithStyle(element, this._getUserInitialStyle());
        } else {
            if (currentPrefs) this.updateMusicSettingsDisplay(currentPrefs);
        }
    }

    _getUserInitialStyle() {
        const el = document.getElementById('initialMusicStyle');
        if (el?.value && el.value !== 'pending') return el.value;
        const user = window.AppMainController?.getState?.('user');
        if (user?.musicPreference?.style && user.musicPreference.style !== 'pending') return user.musicPreference.style;
        return 'lofi';
    }

    // ─── 9. CHANGE HANDLERS ───
    async handleStyleChange(event) {
        const style = event.target.value;
        const element = this.getCurrentElement();
        if (!element) { this._toast('ไม่พบข้อมูลธาตุ', 'error'); return; }
        const preset = await this.getPresetByElementAndStyle(element, style);
        let instruments = [...(preset.instruments || [])];
        while (instruments.length < 3) instruments.push('electricPiano');
        if (instruments.length > 3) instruments = instruments.slice(0, 3);
        instruments = this._deduplicate(instruments);
        const prefs = {
            style, tempo: preset.tempo || 85, mood: preset.mood || 'calm',
            intensity: preset.intensity || 'medium', instruments,
            effects: [...(preset.effects || [])], natureEffects: [...(preset.natureEffects || [])],
            element, useCustomDNA: true
        };
        this.savePreferences(prefs);
        this.syncToAppMain(prefs);
        this.updateMusicSettingsDisplay(prefs);
    }

    handleInstrumentChange(index, value) {
        const p = this.currentDisplayPrefs || this.getPreferences();
        if (!p) return;
        if (!Array.isArray(p.instruments)) p.instruments = ['electricPiano','electricPiano','electricPiano'];
        p.instruments[index] = value;
        p.useCustomDNA = true;
        this.savePreferences(p);
        this.syncToAppMain(p);
        this.updateMusicSettingsDisplay(p);
    }

    handleNatureChange(value) {
        const p = this.currentDisplayPrefs || this.getPreferences();
        if (!p) return;
        const element = this.getCurrentElement();
        if (!element) { this._toast('ไม่พบข้อมูลธาตุ', 'error'); return; }
        p.natureEffects = value === 'none' ? [] : [this.mapNatureValueToObject(value, element)];
        p.useCustomDNA = true;
        this.savePreferences(p);
        this.syncToAppMain(p);
        this.updateMusicSettingsDisplay(p);
    }

    handleTempoChange(value) {
        const p = this.currentDisplayPrefs || this.getPreferences();
        if (!p) return;
        p.tempo = value;
        p.useCustomDNA = true;
        this.savePreferences(p);
        this.syncToAppMain(p);
        this.updateMusicSettingsDisplay(p);
    }

    // ─── 10. UI UPDATES ───
    updateMusicSettingsDisplay(prefs) {
        if (!prefs) return;
        this.currentDisplayPrefs = prefs;
        const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        set('currentGenre',      this.getStyleDisplayName(prefs.style));
        set('currentInstrument', prefs.instruments?.join(', ') || '—');
        set('currentTempo',      prefs.tempo ? `${prefs.tempo} BPM` : '—');
        set('currentNatureFX',   prefs.natureEffects?.length > 0 ? this.mapNatureEffectToString(prefs.natureEffects[0]) : 'ไม่มี');
        this.updateStyleSelect(prefs.style);
        this.updateInstrumentSelects(prefs.instruments);
        this.updateNatureSelect(prefs.natureEffects?.[0]?.type || 'none');
        this.updateTempoSlider(prefs.tempo);
        this.updateDNASourceToggle('custom');
        this._setFormEnabled(true);
        this._setStatusText('🎨 โหมดปรับแต่งเอง', 'purple');
    }

    // ── ฟังก์ชัน update ต่าง ๆ เหมือนเดิม ──
    updateStyleSelect(k) { /* เหมือนเดิม */ const el = document.getElementById('modalMusicStyle'); if (!el || !k) return; el.disabled = false; el.value = k; if (el.value !== k) console.warn(`[MusicStyles] updateStyleSelect: value "${k}" not found`); const d = document.getElementById('styleSelectDisplay'); if (d) d.textContent = this.getStyleDisplayName(k); }
    updateInstrumentSelects(instruments = []) { ['instrument1','instrument2','instrument3'].forEach((id, i) => { const el = document.getElementById(id); if (!el) return; el.disabled = false; el.value = (instruments && instruments[i]) ? instruments[i] : 'electricPiano'; }); }
    mapNatureTypeToDropdownValue(type) { /* เหมือนเดิม */ if (!type || type === 'none') return 'none'; const m = { rain:'rain', water_stream:'stream', water_drip:'stream', water_ocean:'stream', wind:'wind', wind_gentle:'wind', fire_crackle:'fire', fire_embers:'fire', fire_embers_low:'fire', thunder:'thunder', birds:'birds', leaves:'leaves', wood_creak:'leaves', wood_wind:'leaves', metal_wind_chimes:'metal_bells', metal_bell:'metal_bells', metal_vibrations:'metal_bells', cave:'cave' }; return m[type] || type; }
    updateNatureSelect(type) { const el = document.getElementById('natureSound'); if (!el) return; el.disabled = false; el.value = this.mapNatureTypeToDropdownValue(type); }
    updateTempoSlider(value) { const s = document.getElementById('tempoRange'); if (s) { s.disabled = false; if (value != null) s.value = value; } const l = document.getElementById('tempoLabel'); if (l) l.textContent = value || '85'; }
    updateDNASourceToggle(mode) { /* v5.8 code */ const d = document.getElementById('dnaSourceDefault'), c = document.getElementById('dnaSourceCustom'), i = document.getElementById('dnaSourceIndicator'); const btnBase = 'px-3 py-1 rounded-lg text-sm'; if (d) { d.textContent = 'Melody DNA 1'; d.className = `${btnBase} bg-green-600 text-white`; } if (c) { c.textContent = 'Melody DNA 2'; c.className = `${btnBase} bg-purple-600 text-white`; } if (i) { i.textContent = '🎵🎨 กำลังใช้ DNA ทั้งสองชุด (ผสมผสาน)'; i.className = 'text-xs mt-1 text-blue-300'; } const lockHint = document.getElementById('dnaLockHint'); if (lockHint) lockHint.style.display = 'none'; }
    updateStorageStatusDisplay() { /* เหมือนเดิม */ const el = document.getElementById('storageMusicPref'); const prefs = this.getPreferences(); if (el) { el.textContent = prefs ? '✅ มีตั้งค่าดนตรี' : '❌ ไม่มีตั้งค่าดนตรี'; } }
    getStyleDisplayName(k) { const n = { lofi:'🎵 Lo-fi Beats', chill:'🌊 Chill / Ambient', study:'📚 Study / Focus', relax:'🧘 Relax / Meditation' }; return n[k] || this.availableStyles?.[k]?.displayName || k || '—'; }
    mapNatureEffectToString(obj) { /* เหมือนเดิม */ if (!obj?.type) return 'ไม่มี'; const m = { rain:'🌧️ ฝน', wind:'💨 ลม', fire_crackle:'🔥 ไฟลุกโชน', fire_embers:'🔥 ถ่านไฟ', fire_embers_low:'🔥 ถ่านไฟอ่อน', water_stream:'💧 ลำธาร', water_drip:'💧 น้ำหยด', water_ocean:'🌊 คลื่นทะเล', birds:'🐦 นกร้อง', wind_gentle:'💨 ลมเบา', wood_creak:'🌳 ไม้ลั่น', wood_wind:'🌿 ลมผ่านไม้', metal_wind_chimes:'🔔 กระดิ่งลม', metal_bell:'🔔 ระฆัง', metal_vibrations:'⚡ โลหะสั่น', stream:'💧 สายน้ำ', leaves:'🍃 ใบไม้ไหว', fire:'🔥 ไฟป่า', thunder:'⚡ ฟ้าร้อง', metal_bells:'🔔 ระฆังโลหะ', cave:'🪨 ถ้ำ' }; return m[obj.type] || obj.type; }
    mapNatureValueToObject(value, element) { /* เหมือนเดิม */ if (value === 'none') return null; const toEl = { rain:'water', stream:'water', water_stream:'water', water_drip:'water', water_ocean:'water', wind:'earth', fire_crackle:'fire', fire_embers:'fire', fire_embers_low:'fire', thunder:'fire', birds:'wood', leaves:'wood', wind_gentle:'wood', wood_creak:'wood', wood_wind:'wood', metal_wind_chimes:'metal', metal_bell:'metal', metal_vibrations:'metal', cave:'metal', fire:'fire', metal_bells:'metal' }; const resolvedEl = toEl[value] || element || 'earth'; let intensity = 0.5; if (/gentle|low|drip/.test(value)) intensity = 0.3; if (/heavy|crackle|ocean/.test(value)) intensity = 0.7; return { type: value, element: resolvedEl, intensity, toneParams: {} }; }

    // ─── 11. STORAGE ───
    getPreferences() { /* เหมือนเดิม */ if (typeof window.AppMainController === 'undefined') return null; try { const userCustom = window.AppMainController.getState('userCustom'); if (!userCustom) return null; if (!userCustom.style || !userCustom.element) { console.warn("[MusicStyles] Invalid userCustom structure, ignoring"); return null; } return userCustom; } catch (e) { console.error("[MusicStyles] getPreferences error:", e); return null; } }
    savePreferences(prefs) { /* เหมือนเดิม */ if (!prefs || !prefs.style) { console.error("[MusicStyles] cannot save invalid prefs", prefs); return; } if (typeof window.AppMainController === 'undefined') { console.warn("[MusicStyles] AppMain not available, cannot save"); return; } if (prefs.instruments && Array.isArray(prefs.instruments)) { prefs.instruments = this._deduplicate(prefs.instruments); } try { window.AppMainController.setState('userCustom', prefs); console.log(`[MusicStyles] saved preferences to AppMain: style=${prefs.style}, custom=${prefs.useCustomDNA}`); this.updateStorageStatusDisplay(); } catch (e) { console.error("[MusicStyles] save preferences error:", e); } }
    loadPreferencesFromStorage() { /* เหมือนเดิม */ const prefs = this.getPreferences(); if (prefs) { this.updateMusicSettingsDisplay(prefs); console.log("[MusicStyles] loaded prefs from AppMain:", prefs.style); } else { console.log("[MusicStyles] no stored prefs, waiting numerologyCalculated"); } this.updateStorageStatusDisplay(); }
    syncToAppMain(prefs) { /* เหมือนเดิม */ if (typeof window.AppMainController === 'undefined') return; try { const user = window.AppMainController.getState?.('user') || {}; if (!user.personalData) { console.info("[MusicStyles] no personalData in AppMain - sync skipped"); return; } const schema = { style: prefs.style || 'lofi', instruments: prefs.instruments || [], effects: prefs.effects || [], natureEffects: (prefs.natureEffects || []).map(ne => ({ type: ne.type, element: ne.element, intensity: ne.intensity, toneParams: ne.toneParams || {} })) }; window.AppMainController.setState('user', { ...user, musicPreference: schema }); console.log("[MusicStyles] synced to AppMain.user.musicPreference"); } catch (e) { console.warn("[MusicStyles] syncToAppMain failed:", e.message); } }
    emitPreferencesChanged(prefs) { try { window.dispatchEvent(new CustomEvent('musicPreferencesChanged', { detail: prefs, bubbles: true })); } catch (e) { console.error("[MusicStyles] emit error:", e); } }

    // ─── 12. DNA SOURCE CONTROL ───
    setUseCustomDNA(value) { /* v5.8 */ console.log("[MusicStyles] 🔄 Toggle clicked → Melody DNA 2 (Custom)"); try { const userCustom = window.AppMainController?.getState?.('userCustom') || {}; userCustom.useCustomDNA = true; window.AppMainController.setState('userCustom', userCustom); this.updateDNASourceToggle('custom'); this._setFormEnabled(true); if (userCustom.style) { this.currentDisplayPrefs = { ...userCustom, useCustomDNA: true }; this.updateMusicSettingsDisplay(this.currentDisplayPrefs); console.log("[MusicStyles] 🎨 Form loaded from userCustom:", userCustom.style); } else { this.reloadFormFromDNA(true); console.log("[MusicStyles] 🎨 Form loaded from default DNA (editable)"); } } catch (error) { console.error('[MusicStyles] setUseCustomDNA error:', error.message); this._toast(error.message, 'error'); } }
    async resetToDefaultDNA() { /* async + await getPreset */ console.log("[MusicStyles] 🔄 Toggle clicked → Melody DNA 1 (Default)"); try { const userCustom = window.AppMainController?.getState?.('userCustom') || {}; userCustom.useCustomDNA = false; window.AppMainController.setState('userCustom', userCustom); this.updateDNASourceToggle('default'); this._setFormEnabled(true); const user = window.AppMainController?.getState?.('user'); const numerology = window.AppMainController?.getState?.('numerology'); if (!user) throw new Error('ไม่มีข้อมูลผู้ใช้ — กรุณากรอก Form 1 ก่อน'); if (!numerology) throw new Error('ไม่มีข้อมูลตัวเลข — กรุณาคำนวณตัวเลขก่อน'); const element = this.normalizeElement(numerology.element); const defaultStyle = user.musicPreference?.style || 'lofi'; const preset = await this.getPresetByElementAndStyle(element, defaultStyle); const defaultPrefs = { style: defaultStyle, tempo: preset.tempo || 85, mood: preset.mood || 'calm', intensity: preset.intensity || 'medium', instruments: this._deduplicate(preset.instruments || ['piano']), effects: [...(preset.effects || [])], natureEffects: [...(preset.natureEffects || [])], element: element, useCustomDNA: false }; this.currentDisplayPrefs = defaultPrefs; this.updateStyleSelect(defaultPrefs.style); this.updateInstrumentSelects(defaultPrefs.instruments); this.updateNatureSelect(defaultPrefs.natureEffects?.[0]?.type || 'none'); this.updateTempoSlider(defaultPrefs.tempo); const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; }; set('currentGenre', this.getStyleDisplayName(defaultPrefs.style)); set('currentInstrument', defaultPrefs.instruments?.join(', ') || '—'); set('currentTempo', defaultPrefs.tempo ? `${defaultPrefs.tempo} BPM` : '—'); set('currentNatureFX', defaultPrefs.natureEffects?.length > 0 ? this.mapNatureEffectToString(defaultPrefs.natureEffects[0]) : 'ไม่มี'); this._setStatusText('🎵 Melody DNA 1', 'green'); } catch (error) { console.error('[MusicStyles] resetToDefaultDNA error:', error.message); this._toast(error.message, 'error'); } }

    // ─── 13. MODAL ───
    async openMusicSettingsModal() {
        verifyFunctionApproval('openMusicSettingsModal');
        this.ensureDNAToggleSection();
        const userCustom = this.getPreferences();
        if (userCustom) {
            this.currentDisplayPrefs = userCustom;
            this.updateMusicSettingsDisplay(userCustom);
        } else {
            const user = window.AppMainController?.getState?.('user');
            const numerology = window.AppMainController?.getState?.('numerology');
            if (user && numerology) {
                const element = this.normalizeElement(numerology.element);
                const defaultStyle = user.musicPreference?.style || 'lofi';
                const defaultPrefs = await this.getDefaultDNA(element, defaultStyle);
                this.currentDisplayPrefs = defaultPrefs;
                this.updateMusicSettingsDisplay(defaultPrefs);
            }
        }
        const infoEl = document.getElementById('defaultDNAInfo');
        if (infoEl && this.currentDisplayPrefs) {
            const prefs = this.currentDisplayPrefs;
            infoEl.textContent = `Current: ${this.getStyleDisplayName(prefs.style)} | ${prefs.instruments?.join(', ')} | ${prefs.tempo} BPM | ธาตุ: ${prefs.element || '-'}`;
        }
        this.bindSaveButton();
        this._bindDNASourceButtons();
        const styleEl = document.getElementById('modalMusicStyle');
        if (styleEl && !styleEl._msBound) {
            styleEl.addEventListener('change', (e) => this.handleStyleChange(e));
            styleEl._msBound = true;
        }
        console.log("[MusicStyles] modal populated");
    }

    ensureDNAToggleSection() { /* เหมือนเดิม */ if (document.getElementById('dnaSourceToggleSection')) return; const target = document.getElementById('musicSettingsFormWrapper') || document.getElementById('musicSettingsContent') || document.getElementById('musicSettingsModal'); if (!target) { console.warn("[MusicStyles] cannot find container"); return; } const section = document.createElement('div'); section.id = 'dnaSourceToggleSection'; section.className = 'mb-4 p-3 rounded-xl border border-gray-200 bg-gray-50'; section.innerHTML = `<div class="text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-dna mr-1 text-indigo-500"></i> แหล่ง Music DNA</div><div class="flex gap-2 mb-1 flex-wrap"><button id="dnaSourceDefault" type="button" class="px-3 py-1 rounded-lg text-sm bg-green-600 text-white">Melody DNA 1</button><button id="dnaSourceCustom" type="button" class="px-3 py-1 rounded-lg text-sm bg-purple-600 text-white">Melody DNA 2</button></div><div id="dnaSourceIndicator" class="text-xs text-blue-600">🎵🎨 กำลังใช้ DNA ทั้งสองชุด (ผสมผสาน)</div><div id="defaultDNAInfo" class="text-xs text-gray-400 mt-1">—</div>`; target.insertBefore(section, target.firstChild); console.log("[MusicStyles] DNA toggle section injected v6.0"); }
    _setFormEnabled(enabled) { console.log("[MusicStyles] Form is always editable"); }
    reloadFormFromDNA(isCustom) { /* เหมือนเดิม */ if (typeof window.AppMainController === 'undefined') throw new Error('AppMainController not available'); const userCustom = window.AppMainController.getState('userCustom'); if (userCustom?.style) { const prefs = { ...userCustom, useCustomDNA: isCustom }; if (prefs.instruments) prefs.instruments = this._deduplicate(prefs.instruments); this.currentDisplayPrefs = prefs; this.updateMusicSettingsDisplay(prefs); console.log(`[MusicStyles] reloadFormFromDNA: loaded from userCustom (style=${prefs.style})`); return; } const dnaStateKey = isCustom ? 'music.CustomSty' : 'music.default'; const rawDNA = window.AppMainController.getState(dnaStateKey) || window.AppMainController.getState('music.default'); if (rawDNA) { const dnaCfg = rawDNA.config || {}; const element = this.normalizeElement(dnaCfg.element || this.getCurrentElement()); const style = dnaCfg.mode || dnaCfg.style || this._getUserInitialStyle(); if (!element || !style) throw new Error('Cannot convert DNA to preferences: missing element or style'); const instruments = rawDNA.instruments || dnaCfg.instruments; if (!instruments || !Array.isArray(instruments) || instruments.length === 0) throw new Error('DNA object does not contain instruments'); const prefs = { style, tempo: dnaCfg.bpm || dnaCfg.tempo || 85, mood: dnaCfg.mood || 'calm', intensity: dnaCfg.intensity || 'medium', instruments: this._deduplicate(instruments), effects: rawDNA.effects || dnaCfg.effects || [], natureEffects: rawDNA.natureEffects || [], element, useCustomDNA: isCustom }; this.currentDisplayPrefs = prefs; this.updateMusicSettingsDisplay(prefs); console.log(`[MusicStyles] reloadFormFromDNA: converted DNA→prefs from ${dnaStateKey} (fallback)`); return; } throw new Error(`No DNA data found for ${isCustom ? 'custom' : 'default'} mode`); }

    // ── Save button ──
    bindSaveButton() { /* v5.8 */ const old = document.getElementById('saveMusicSettingsBtn'); if (!old) { console.warn("[MusicStyles] #saveMusicSettingsBtn not found"); return; } const btn = old.cloneNode(true); old.parentNode.replaceChild(btn, old); btn.addEventListener('click', async () => { try { const prefs = this.currentDisplayPrefs; if (!prefs) throw new Error('ไม่มีข้อมูลเพลงที่จะบันทึก'); this._toast('กำลังบันทึก...', 'info'); this.savePreferences(prefs); this.syncToAppMain(prefs); const modal = document.getElementById('musicSettingsModal'); if (modal) modal.classList.add('hidden'); if (window.FormPsychomatrixController?.generateMusicDNA) { await window.FormPsychomatrixController.generateMusicDNA(prefs); const activeDNA = window.AppMainController?.getActiveMusicDNA?.(); if (activeDNA) { window.dispatchEvent(new CustomEvent('musicPointerChanged', { detail: { pointer: 'music.CustomSty', activeDNA }, bubbles: true })); } this._toast('บันทึกการตั้งค่าเพลงสำเร็จ ✅', 'success'); } else { throw new Error('FormPsychomatrixController.generateMusicDNA not available'); } if (window.AudioController?.setLoopEnabled) { window.AudioController.setLoopEnabled(true); } } catch (error) { console.error('[MusicStyles] Save error:', error.message); this._toast(error.message, 'error'); } }); console.log("[MusicStyles] save button bound v6.0"); }

    validateMusicPreferences(data) { /* เหมือนเดิม */ if (!data || typeof data !== 'object') return false; if (!data.style || typeof data.style !== 'string') return false; if (data.instruments && !Array.isArray(data.instruments)) return false; if (data.natureEffects && !Array.isArray(data.natureEffects)) return false; const valid = ['water','fire','earth','metal','wood']; if (data.natureEffects) { for (const ne of data.natureEffects) { if (ne.element && !valid.includes(this.normalizeElement(ne.element))) return false; } } return true; }
    async registerWithDataContract() { verifyFunctionApproval('registerWithDataContract'); return; }
}

// ========== 17. EXPORT (ปรับให้ async functions ทำงานได้) ==========
window.MusicStyles = new MusicStyles();

window.MusicStylesController = {
    initialize:                        () => window.MusicStyles.initialize(),
    getPreferences:                    () => window.MusicStyles.getPreferences(),
    getDefaultDNAWithParams:           (element, style) => window.MusicStyles.getDefaultDNA(element, style),
    handleStyleChange:                 (e) => window.MusicStyles.handleStyleChange(e),
    handleInstrumentChange:            (i, v) => window.MusicStyles.handleInstrumentChange(i, v),
    handleNatureChange:                (v) => window.MusicStyles.handleNatureChange(v),
    handleTempoChange:                 (v) => window.MusicStyles.handleTempoChange(v),
    updateDisplay:                     (p) => window.MusicStyles.updateMusicSettingsDisplay(p),
    setUseCustomDNA:                   (v) => window.MusicStyles.setUseCustomDNA(v),
    resetToDefaultDNA:                 () => window.MusicStyles.resetToDefaultDNA(),
    applyPresetByElementAndStyle:      (el, style) => window.MusicStyles.applyPresetWithStyle(el, style),
    openModal:                         () => window.MusicStyles.openMusicSettingsModal(),
    setSuppressNumerologyHandler:      (v) => window.MusicStyles.setSuppressNumerologyHandler(v),
    buildFullMusicDNAFromPreferences:  (prefs, numerologyCtx) => window.MusicStyles.buildFullMusicDNAFromPreferences(prefs, numerologyCtx),
    reloadFormFromDNA:                 (isCustom) => window.MusicStyles.reloadFormFromDNA(isCustom)
};

// ========== 18. AUTO-INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log("[MusicStyles] DOM loaded - Starting v" + window.MusicStyles_VERSION + "...");
    setTimeout(() => {
        const tryInit = () => {
            if (typeof window.DataContract === 'undefined' ||
                typeof window.MusicPresetCache === 'undefined') {
                console.warn("[MusicStyles] Dependencies not ready, retry");
                setTimeout(tryInit, 500);
                return;
            }
            window.MusicStyles.initialize().catch(err => {
                console.error("[MusicStyles] init failed:", err);
                const el = document.getElementById('musicStatusText');
                if (el) { el.textContent = 'โหลดระบบเพลงไม่สำเร็จ'; el.className = 'text-sm font-medium text-red-300'; }
            });
        };
        tryInit();
    }, 300);
});

console.log("[MusicStyles] MUSIC-STYLES.JS v" + window.MusicStyles_VERSION + " LOADED — Edge‑driven presets");