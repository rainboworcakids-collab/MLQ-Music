// form-ui.js v2.9.8 - Melody1/Melody2 with Base Style + Effect Mix
// แก้ไขจาก v2.9.6:
//   - populateFormWithData() แยก base/effect mix สำหรับ dropdown ใหม่
//   - mapElements: silent fallback สำหรับ musicStyle/musicStyleCustom เดิม
//   - minor cleanup

window.FormUI_VERSION = "2.9.8";
console.log("[FormUI] FORM-UI.JS v" + window.FormUI_VERSION + " - Base+Effect Mix support");

// ========== 0. HELPERS ==========
function toYYYYMMDD(dateStr) {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        let [day, month, year] = parts;
        if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
            return `${year}-${month}-${day}`;
        }
    }
    return '';
}

function toDDMMYYYY(dateStr) {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    return '';
}

// ========== 1. DEPENDENCY CHECK ==========
if (typeof window.DataContract === 'undefined') {
    throw new Error("[FormUI] ❌ CRITICAL: data-contract.js must be loaded before form-ui.js");
}
if (typeof window.AppMainController === 'undefined') {
    console.warn("[FormUI] ⚠️ AppMainController not loaded, UI may have limited functionality");
}

// ========== 2. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_FrmUI = {
    constructor: true,
    initialize: true,
    setupEventListeners: true,
    setupOptionListeners: true,
    setupFormListeners: true,
    setupMusicControlListeners: true,
    handleFormSubmit: true,
    handleOptionChange: true,
    handleInputChange: true,
    collectFormData: true,
    validateFormWithDataContract: true,
    formatDataForEdgeFunction: true,
    updateFieldVisibility: true,
    updateUserInfoDisplay: true,
    handleGenerateMusic: true,
    handleResetToDefault: true,
    saveToLocalStorage: true,
    loadFromLocalStorage: true,
    clearLocalStorage: true,
    showLoading: true,
    hideLoading: true,
    showToast: true,
    showError: true,
    cleanup: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_FrmUI[functionName]) {
        throw new Error(`[FormUI] 🚫 UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
    }
    return true;
}

// ========== 3. MAIN CONTROLLER CLASS ==========
class FormUIController {
    constructor() {
        verifyFunctionApproval('constructor');
        this.state = {
            formVisible: false,
            loading: false,
            currentView: 'main',
            formData: null,
            validationErrors: {}
        };
        this.elements = {};

        this.localStorageKeys = {
            userData:      'psychomatrixUserData',
            musicCurrent:  'psychomatrixMusicCurrent',
            musicDefault:  'psychomatrixMusicDefault',
            numerologyData:'psychomatrixNumerologyData'
        };

        this.allPersistMapKeys = [
            'psychomatrixUserData',
            'psychomatrixUserDataCustom',
            'psychomatrixNumerologyData',
            'psychomatrixPsychomatrixData',
            'psychomatrixLuckyNumberData',
            'psychomatrixMusicDefault',
            'psychomatrixMusicCustomStyle',
            'psychomatrixMusicCurrent',
            'psychomatrixEdgeFunctions',
            'psychomatrixSchemaVersion'
        ];

        this.unsubscribeMusicCurrent = null;
        console.log("[FormUI] ✅ FormUIController v" + window.FormUI_VERSION + " initialized");
    }

    initialize() {
        verifyFunctionApproval('initialize');
        console.log("[FormUI] 🚀 Initializing Form UI v" + window.FormUI_VERSION + "...");
        try {
            this.mapElements();
            this.loadSavedData();
            this.setupEventListeners();
            this.setupAppMainIntegration();
            
            if (window.AppMainController?.subscribe) {
                window.AppMainController.subscribe('trial', () => this._applyEditionRestrictions());
            }
            this._applyEditionRestrictions(); // call ทันทีหลัง init
            
            console.log("[FormUI] ✅ Form UI v" + window.FormUI_VERSION + " initialized successfully");
        } catch (error) {
            console.error("[FormUI] ❌ initialization failed:", error);
            throw error;
        }
    }

    mapElements() {
        console.log("[FormUI] 📍 Mapping DOM elements v" + window.FormUI_VERSION + "...");
        
        this.elements = {
            formModal: document.getElementById('formModal'),
            musicSettingsModal: document.getElementById('musicSettingsModal'),

            form: document.getElementById('musicForm'),
            fullName: document.getElementById('fullName'),
            id_card: document.getElementById('id_card'),
            birthDate: document.getElementById('birthDate'),
            birthTime: document.getElementById('birthTime'),
            
            // New dropdowns (Base + Effect Mix)
            musicStyleBase1: document.getElementById('musicStyleBase1'),
            musicStyleBase2: document.getElementById('musicStyleBase2'),
            effectMix1: document.getElementById('effectMix1'),
            effectMix2: document.getElementById('effectMix2'),
            
            // Legacy dropdowns (may not exist)
            musicStyle: document.getElementById('musicStyle'),
            musicStyleCustom: document.getElementById('musicStyleCustom'),

            optionInputs: document.querySelectorAll('input[name="calculationOption"]'),
            optionContainer: document.getElementById('optionSelectionContainer'),

            openFormBtn: document.getElementById('openFormBtn'),
            closeFormBtn: document.getElementById('closeFormBtn'),
            generateBtn: document.getElementById('generateBtn'),
            resetToDefaultBtn: document.getElementById('resetToDefaultBtn'),
            editMusicSettingsBtn: document.getElementById('editMusicSettingsBtn'),
            closeMusicSettingsBtn: document.getElementById('closeMusicSettingsBtn'),

            currentUserName: document.getElementById('currentUserName'),
            currentUserBirth: document.getElementById('currentUserBirth'),

            storageUserData: document.getElementById('storageUserData'),
            storageMusicPref: document.getElementById('storageMusicPref'),

            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingMessage: document.getElementById('loadingMessage'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage'),
            toastIcon: document.getElementById('toastIcon'),

            errorContainer: document.getElementById('formErrorContainer'),
            errorList: document.getElementById('errorList')
        };

        // Soft check for legacy elements
        if (!this.elements.musicStyle) {
            console.log("[FormUI] ℹ️ #musicStyle not found (using new Base+Effect dropdowns)");
        }
        if (!this.elements.musicStyleCustom) {
            console.log("[FormUI] ℹ️ #musicStyleCustom not found (using new Base+Effect dropdowns)");
        }

        if (!this.elements.errorContainer && this.elements.form) {
            this.createErrorContainer();
        }

        console.log(`[FormUI] ✅ Mapped ${Object.keys(this.elements).length} elements`);
    }

    createErrorContainer() {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'formErrorContainer';
        errorContainer.className = 'mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg hidden';
        errorContainer.innerHTML = `
            <div class="flex items-center text-red-300 mb-2">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span class="font-medium">กรุณาตรวจสอบข้อมูลต่อไปนี้:</span>
            </div>
            <ul id="errorList" class="text-sm text-red-300 space-y-1"></ul>
        `;
        if (this.elements.generateBtn && this.elements.generateBtn.parentNode) {
            this.elements.generateBtn.parentNode.insertBefore(errorContainer, this.elements.generateBtn);
        } else if (this.elements.form) {
            this.elements.form.appendChild(errorContainer);
        } else {
            document.body.appendChild(errorContainer);
        }
        this.elements.errorContainer = errorContainer;
        this.elements.errorList = document.getElementById('errorList');
    }

    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        console.log("[FormUI] 🔌 Setting up event listeners v" + window.FormUI_VERSION + "...");

        this.elements.form?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.elements.openFormBtn?.addEventListener('click', () => this.showForm());
        this.elements.closeFormBtn?.addEventListener('click', () => this.hideForm());
        this.elements.editMusicSettingsBtn?.addEventListener('click', () => this.showMusicSettings());
        this.elements.closeMusicSettingsBtn?.addEventListener('click', () => this.hideMusicSettings());

        this.setupMusicControlListeners();
        this.setupOptionListeners();
        this.setupInputValidationListeners();

        window.addEventListener('showToast', (event) => this.showToast(event.detail.message, event.detail.type));

        window.addEventListener('stateChanged', (e) => {
            const { path, value } = e.detail || {};
            if (path === 'music.current' && value) this.hideLoading();
            if (path === 'ui.loading') {
                value ? this.showLoading('กำลังประมวลผล...') : this.hideLoading();
            }
        });

        console.log("[FormUI] ✅ Event listeners setup complete");
    }

    setupOptionListeners() {
        verifyFunctionApproval('setupOptionListeners');
        if (!this.elements.optionInputs || this.elements.optionInputs.length === 0) {
            console.warn("[FormUI] ⚠️ Option inputs not found");
            return;
        }
        this.elements.optionInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleOptionChange(e.target.value));
        });
        const defaultOption = document.querySelector('input[name="calculationOption"]:checked');
        if (defaultOption) this.handleOptionChange(defaultOption.value);
    }

    setupInputValidationListeners() {
        ['fullName', 'id_card', 'birthDate', 'birthTime'].forEach(fieldId => {
            const input = this.elements[fieldId];
            if (input) {
                input.addEventListener('blur', () => this.validateSingleField(fieldId, input.value));
                input.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });
    }

    setupMusicControlListeners() {
        verifyFunctionApproval('setupMusicControlListeners');
        if (this.elements.generateBtn) {
            const newBtn = this.elements.generateBtn.cloneNode(true);
            this.elements.generateBtn.parentNode.replaceChild(newBtn, this.elements.generateBtn);
            this.elements.generateBtn = newBtn;
            this.elements.generateBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleGenerateMusic(); });
        } else {
            console.warn("[FormUI] ⚠️ generateBtn not found");
        }
        if (this.elements.resetToDefaultBtn) {
            const newBtn = this.elements.resetToDefaultBtn.cloneNode(true);
            this.elements.resetToDefaultBtn.parentNode.replaceChild(newBtn, this.elements.resetToDefaultBtn);
            this.elements.resetToDefaultBtn = newBtn;
            this.elements.resetToDefaultBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleResetToDefault(); });
        } else {
            console.warn("[FormUI] ⚠️ resetToDefaultBtn not found");
        }
    }

    setupAppMainIntegration() {
        console.log("[FormUI] 🔗 Setting up AppMain integration...");
        if (typeof window.AppMainController !== 'undefined') {
            window.AppMainController.getState(); // ensure loaded
        }
    }

    // ========== 6. FORM HANDLING ==========
    handleFormSubmit(event) {
        verifyFunctionApproval('handleFormSubmit');
        event.preventDefault();
        console.log("[FormUI] 📝 Handling form submission v" + window.FormUI_VERSION + "...");
        try {
            const formData = this.collectFormData();
            const validation = this.validateFormWithDataContract(formData);
            if (!validation.valid) {
                this.showErrors(validation.errors);
                return;
            }
            
            if (window.AppMainController) {
                window.AppMainController.setState('user', formData);
                console.log("[FormUI] ✅ User data saved via AppMainController");
            } else {
                this.saveToLocalStorage('userData', formData);
            }
            
            this.updateUserInfoDisplay(formData);
            this.dispatchFormSubmitted(formData);
            this.hideForm();
            this.showToast('บันทึกข้อมูลสำเร็จ!', 'success');
        } catch (error) {
            console.error("[FormUI] ❌ Form submission error:", error);
            this.showError(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    }

    collectFormData() {
        verifyFunctionApproval('collectFormData');
        console.log("[FormUI] 📋 Collecting form data v" + window.FormUI_VERSION + "...");
        const optionInput = document.querySelector('input[name="calculationOption"]:checked');
        if (!optionInput) throw new Error('กรุณาเลือกวิธีการคำนวณตัวเลข');
        const option = optionInput.value;

        const fullName  = this.elements.fullName?.value?.trim() || '';
        let rawBirthDate = this.elements.birthDate?.value || '';
        const birthTime = this.elements.birthTime?.value || '12:00';
        const id_card   = this.elements.id_card?.value?.replace(/\D/g, '') || '';

        let birthDate = toYYYYMMDD(rawBirthDate);
        if (!birthDate && rawBirthDate) birthDate = rawBirthDate;

        console.log("[FormUI] fullName:", fullName);
        console.log("[FormUI] birthDate (raw):", rawBirthDate, "→ converted:", birthDate);
        console.log("[FormUI] birthTime:", birthTime);
        console.log("[FormUI] id_card:", id_card);

        const melody1Base = this.elements.musicStyleBase1?.value || 'lofi';
        const melody2Base = this.elements.musicStyleBase2?.value || 'relax';
        const effect1 = this.elements.effectMix1?.value || 'full';
        const effect2 = this.elements.effectMix2?.value || 'full';

        const defaultStyle = effect1 === 'full' ? melody1Base : `${melody1Base}_${effect1}`;
        const customStyle  = effect2 === 'full' ? melody2Base : `${melody2Base}_${effect2}`;

        console.log("[FormUI] selected default style:", defaultStyle);
        console.log("[FormUI] selected custom style:", customStyle);

        const musicPreference = {
            defaultStyle: defaultStyle,
            customStyle: customStyle,
            instruments: ['piano'],
            effects: [],
            natureEffects: []
        };

        return {
            option,
            personalData: { fullName, birthDate, birthTime, id_card },
            musicPreference,
            timestamp: new Date().toISOString()
        };
    }

    validateFormWithDataContract(formData) {
        verifyFunctionApproval('validateFormWithDataContract');
        console.log("[FormUI] 🔍 Validating with DataContract v" + window.FormUI_VERSION + "...");
        const errors = [];
        try {
            window.DataContract.validateInput(formData, 'form-ui');
        } catch (error) {
            console.warn("[FormUI] DataContract validation error:", error.message);
            errors.push(error.message);
        }
        const option = formData.option;
        const personalData = formData.personalData || {};

        if (option.includes('FullName') && !personalData.fullName) errors.push('กรุณากรอกชื่อ-นามสกุล');
        if (option.includes('IDC') && !personalData.id_card) errors.push('กรุณากรอกเลขบัตรประชาชน');
        if (personalData.birthDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(personalData.birthDate) && !/^\d{2}\/\d{2}\/\d{4}$/.test(personalData.birthDate))
                errors.push('รูปแบบวันเกิดต้องเป็น "YYYY-MM-DD" หรือ "DD/MM/YYYY"');
        } else {
            errors.push('กรุณากรอกวันเกิด');
        }
        if (personalData.birthTime && !/^\d{2}:\d{2}$/.test(personalData.birthTime)) errors.push('รูปแบบเวลาต้องเป็น "HH:MM"');
        if (personalData.id_card && personalData.id_card.length !== 13) errors.push('เลขบัตรประชาชนต้องมี 13 หลัก');
        if (!formData.musicPreference?.defaultStyle) errors.push('กรุณาเลือกแนวเพลงสำหรับ Melody1 (Music.Default)');
        if (!formData.musicPreference?.customStyle) errors.push('กรุณาเลือกแนวเพลงสำหรับ Melody2 (Music.CustomSty)');

        console.log("[FormUI] Validation errors:", errors);
        return { valid: errors.length === 0, errors };
    }

    validateSingleField(fieldId, value) {
        const checks = {
            fullName: () => {
                if (!value.trim()) return 'กรุณากรอกชื่อ-สกุล';
                if (value.trim().length < 2) return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
                if (!/^[a-zA-Z\u0E00-\u0E7F\s]+$/.test(value)) return 'ชื่อสามารถประกอบด้วยตัวอักษรไทย/อังกฤษและช่องว่างเท่านั้น';
                return null;
            },
            id_card: () => {
                if (!value) return null;
                return value.replace(/\D/g, '').length !== 13 ? 'เลขบัตรประชาชนต้องมี 13 หลัก' : null;
            },
            birthDate: () => {
                if (!value) return 'กรุณาเลือกวันเกิด';
                let iso = value;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) iso = toYYYYMMDD(value);
                const d = new Date(iso);
                if (isNaN(d.getTime())) return 'รูปแบบวันเกิดไม่ถูกต้อง';
                if (d > new Date()) return 'วันเกิดต้องไม่เป็นวันที่ในอนาคต';
                return null;
            },
            birthTime: () => {
                if (!value) return null;
                return !/^\d{2}:\d{2}$/.test(value) ? 'รูปแบบเวลาต้องเป็น HH:MM' : null;
            }
        };
        const error = checks[fieldId] ? checks[fieldId]() : null;
        if (error) this.showFieldError(fieldId, error);
        else this.clearFieldError(fieldId);
        return error;
    }

    formatDataForEdgeFunction(formData) {
        verifyFunctionApproval('formatDataForEdgeFunction');
        try {
            return {
                psychomatrixInput: window.DataContract.createPsychomatrixInput(formData),
                luckyNumberInput: window.DataContract.createLuckyNumberInput(formData),
                originalData: formData
            };
        } catch (error) {
            throw new Error(`ไม่สามารถแปลงข้อมูล: ${error.message}`);
        }
    }

    // ========== 7. OPTION HANDLING ==========
    handleOptionChange(option) {
        verifyFunctionApproval('handleOptionChange');
        console.log(`[FormUI] 🔄 Option changed to: ${option}`);
        this.state.currentOption = option;
        this.updateFieldVisibility(option);
        this.clearErrors();
        window.dispatchEvent(new CustomEvent('calculationOptionChanged', { detail: { option } }));
    }

    updateFieldVisibility(option) {
        verifyFunctionApproval('updateFieldVisibility');
        const fields = {
            fullName: true,
            id_card: option === 'IDC' || option === 'BD-IDC-FullName'
        };
        Object.keys(fields).forEach(fieldId => {
            const input = this.elements[fieldId];
            if (input) {
                const container = input.closest('.option-dependent-field') || input.parentElement;
                if (container) {
                    container.style.display = fields[fieldId] ? 'block' : 'none';
                    input.required = fields[fieldId];
                }
            }
        });
        ['birthDate', 'birthTime'].forEach(fieldId => {
            const input = this.elements[fieldId];
            if (input) {
                const container = input.closest('.option-dependent-field') || input.parentElement;
                if (container) {
                    container.style.display = 'block';
                    input.required = true;
                }
            }
        });
    }

    // ========== 8. UI UPDATES ==========
    updateUserInfoDisplay(userData) {
        verifyFunctionApproval('updateUserInfoDisplay');
        if (!userData?.personalData) return;
        const { fullName, birthDate } = userData.personalData;
        if (this.elements.currentUserName && fullName) this.elements.currentUserName.textContent = fullName || '-';
        if (this.elements.currentUserBirth && birthDate) {
            this.elements.currentUserBirth.textContent = toDDMMYYYY(birthDate) || birthDate || '-';
        }
    }

    updateStorageStatus() {
        const userData    = localStorage.getItem(this.localStorageKeys.userData);
        const musicCurrent = localStorage.getItem(this.localStorageKeys.musicCurrent);
        if (this.elements.storageUserData) this.elements.storageUserData.textContent = userData ? '✅ มีข้อมูลผู้ใช้' : '❌ ไม่มีข้อมูลผู้ใช้';
        if (this.elements.storageMusicPref) this.elements.storageMusicPref.textContent = musicCurrent ? '✅ มีตั้งค่าดนตรี' : '❌ ไม่มีตั้งค่าดนตรี';
    }

    // ========== 9. MUSIC CONTROL HANDLERS ==========
    async handleGenerateMusic() {
        verifyFunctionApproval('handleGenerateMusic');
        console.log("[FormUI] 🎵 Handle generate music clicked");
        try {
            const state = window.AppMainController?.getState();
            if (!state?.numerology) {
                this.showToast('กรุณาคำนวณตัวเลขศาสตร์ก่อนสร้างเพลง', 'warning');
                return;
            }
            this.showLoading('กำลังสร้างดนตรีจาก DNA...');
            if (typeof window.FormPsychomatrixController?.generateMusicDNA === 'function') {
                await window.FormPsychomatrixController.generateMusicDNA();
                this.showToast('สร้างเพลงสำเร็จ!', 'success');
            } else {
                throw new Error('ไม่สามารถเรียกฟังก์ชันสร้างเพลงได้');
            }
        } catch (error) {
            console.error("[FormUI] ❌ Generate music failed:", error);
            this.showError(`สร้างเพลงล้มเหลว: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    handleResetToDefault() {
        verifyFunctionApproval('handleResetToDefault');
        console.log("[FormUI] 🔄 Handle reset to default clicked");
        if (typeof window.MusicStylesController?.resetToDefaultDNA === 'function') {
            window.MusicStylesController.resetToDefaultDNA();
            this.showToast('กลับไปใช้เพลงเริ่มต้น (DNA ธาตุ)', 'success');
        } else if (typeof window.AppMainController?.resetToDefaultMusic === 'function') {
            const success = window.AppMainController.resetToDefaultMusic();
            this.showToast(success ? 'กลับไปใช้เพลงเริ่มต้น' : 'ไม่มีเพลงเริ่มต้น', success ? 'success' : 'warning');
        } else {
            this.showToast('ไม่พบฟังก์ชัน resetToDefault', 'warning');
        }
    }

    // ========== 10. STORAGE MANAGEMENT ==========
    saveToLocalStorage(key, data) {
        verifyFunctionApproval('saveToLocalStorage');
        const storageKey = this.localStorageKeys[key];
        if (!storageKey) throw new Error(`[FormUI] Unknown storage key: ${key}`);
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log(`[FormUI] 💾 Saved to localStorage: ${storageKey}`);
            this.updateStorageStatus();
        } catch (error) {
            console.error(`[FormUI] ❌ Failed to save to localStorage: ${error.message}`);
            throw error;
        }
    }

    loadFromLocalStorage(key) {
        verifyFunctionApproval('loadFromLocalStorage');
        const storageKey = this.localStorageKeys[key];
        if (!storageKey) return null;
        try {
            const dataStr = localStorage.getItem(storageKey);
            return dataStr ? JSON.parse(dataStr) : null;
        } catch (error) {
            console.error(`[FormUI] ❌ Failed to load from localStorage: ${error.message}`);
            return null;
        }
    }

    loadSavedData() {
        verifyFunctionApproval('loadSavedData');
        console.log("[FormUI] 📂 Loading saved data from AppMain state first...");
        try {
            let userData = window.AppMainController ? window.AppMainController.getState('user') : null;
            if (!userData) {
                console.log("[FormUI] No user data in AppMain, trying localStorage...");
                const userDataStr = localStorage.getItem(this.localStorageKeys.userData);
                if (userDataStr) userData = JSON.parse(userDataStr);
            }
            if (userData) {
                this.populateFormWithData(userData);
                console.log("[FormUI] ✅ User data loaded");
            } else {
                console.log("[FormUI] ℹ️ No saved user data found");
            }
            this.updateStorageStatus();
        } catch (error) {
            console.error("[FormUI] ❌ Error loading saved data:", error);
        }
    }

    populateFormWithData(formData) {
        if (!formData) return;
        // personal data
        if (formData.personalData) {
            const { fullName, birthDate, birthTime, id_card } = formData.personalData;
            if (this.elements.fullName  && fullName)  this.elements.fullName.value  = fullName;
            if (this.elements.birthDate && birthDate) this.elements.birthDate.value = toDDMMYYYY(birthDate) || birthDate;
            if (this.elements.birthTime && birthTime) this.elements.birthTime.value = birthTime;
            if (this.elements.id_card   && id_card)   this.elements.id_card.value   = id_card;
        }
        // music preferences (base + effect)
        if (formData.musicPreference) {
            const def = formData.musicPreference.defaultStyle || '';
            const cus = formData.musicPreference.customStyle || '';

            const splitStyle = (fullStyle) => {
                if (!fullStyle) return { base: 'lofi', effect: 'full' };
                const parts = fullStyle.split('_');
                // ถ้าไม่มี '_' แสดงว่าเป็น full effect แนวเดี่ยว
                if (parts.length === 1) return { base: parts[0], effect: 'full' };
                // ถ้ามี '_' เช่น lofi_no_animal → base=lofi, effect=no_animal
                return { base: parts[0], effect: parts.slice(1).join('_') };
            };

            const defSplit = splitStyle(def);
            const cusSplit = splitStyle(cus);

            if (this.elements.musicStyleBase1) this.elements.musicStyleBase1.value = defSplit.base;
            if (this.elements.effectMix1) this.elements.effectMix1.value = defSplit.effect;

            if (this.elements.musicStyleBase2) this.elements.musicStyleBase2.value = cusSplit.base;
            if (this.elements.effectMix2) this.elements.effectMix2.value = cusSplit.effect;
        }
        // option
        if (formData.option) {
            const optInput = document.querySelector(`input[name="calculationOption"][value="${formData.option}"]`);
            if (optInput) {
                optInput.checked = true;
                this.handleOptionChange(formData.option);
            }
        }
    }

    clearLocalStorage() {
        verifyFunctionApproval('clearLocalStorage');
        console.log("[FormUI] 🧹 Clearing all localStorage (persistMap keys)...");
        this.allPersistMapKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`[FormUI] 🗑️ Removed: ${key}`);
        });
        this.showToast('ล้างข้อมูลทั้งหมดสำเร็จ', 'success');
        this.updateStorageStatus();
    }

    // ========== 11. UI UTILITIES ==========
    /*
    showForm() {
        if (this.elements.formModal) {
    
            this.elements.formModal.classList.remove('hidden');
            this.state.formVisible = true;
            this._applyEditionRestrictions(); // 🔁 refresh เมื่อเปิดฟอร์ม
        }
    }
    
    hideForm() {
        if (this.elements.formModal) {
            this.elements.formModal.classList.add('hidden');
            this.elements.formModal.style.display = 'none';
            this.state.formVisible = false;
        }
    }
    */
    
    showForm() {
        if (this.elements.formModal) {
            this.elements.formModal.style.display = '';   
            this.elements.formModal.classList.remove('hidden');
            this.state.formVisible = true;
            this._applyEditionRestrictions();
        }
    }

    hideForm() {
        if (this.elements.formModal) {
            this.elements.formModal.classList.add('hidden');
            this.state.formVisible = false;
        }
    }

    async showMusicSettings() {
        if (typeof window.MusicStyles?.openMusicSettingsModal === 'function') {
            await window.MusicStyles.openMusicSettingsModal();
        }
        if (this.elements.musicSettingsModal) {
            this.elements.musicSettingsModal.classList.remove('hidden');
            this.elements.musicSettingsModal.style.display = 'flex';
        }
    }

    hideMusicSettings() {
        if (this.elements.musicSettingsModal) {
            this.elements.musicSettingsModal.classList.add('hidden');
            this.elements.musicSettingsModal.style.display = 'none';
        }
    }

    showLoading(message = 'กำลังประมวลผล...') {
        verifyFunctionApproval('showLoading');
        this.state.loading = true;
        if (this.elements.loadingOverlay && this.elements.loadingMessage) {
            this.elements.loadingMessage.textContent = message;
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        verifyFunctionApproval('hideLoading');
        this.state.loading = false;
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.classList.add('hidden');
    }

    showToast(message, type = 'success') {
        verifyFunctionApproval('showToast');
        console.log(`[FormUI] 📢 Toast (${type}): ${message}`);
        if (!this.elements.toast || !this.elements.toastMessage || !this.elements.toastIcon) return;
        this.elements.toastMessage.textContent = message;
        const icons = {
            success: 'fas fa-check-circle',
            error:   'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info:    'fas fa-info-circle'
        };
        this.elements.toastIcon.className = icons[type] || icons.info;
        this.elements.toast.className = `toast ${type === 'error' ? 'error' : ''}`;
        this.elements.toast.classList.remove('hidden');
        setTimeout(() => this.elements.toast.classList.add('hidden'), 3000);
    }

    showFieldError(fieldId, message) {
        const input = this.elements[fieldId];
        if (!input) return;
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-300');
        let errEl = input.nextElementSibling;
        if (!errEl || !errEl.classList.contains('field-error')) {
            errEl = document.createElement('p');
            errEl.className = 'field-error text-red-500 text-xs mt-1';
            input.parentNode.insertBefore(errEl, input.nextSibling);
        }
        errEl.textContent = message;
    }

    clearFieldError(fieldId) {
        const input = this.elements[fieldId];
        if (!input) return;
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
        const errEl = input.nextElementSibling;
        if (errEl && errEl.classList.contains('field-error')) errEl.remove();
    }

    showErrors(errors) {
        if (!this.elements.errorContainer || !this.elements.errorList) return;
        if (errors.length === 0) { this.elements.errorContainer.classList.add('hidden'); return; }
        this.elements.errorList.innerHTML = '';
        errors.forEach(error => {
            const li = document.createElement('li');
            li.className = 'flex items-center';
            li.innerHTML = `<i class="fas fa-times mr-2 text-xs"></i>${error}`;
            this.elements.errorList.appendChild(li);
        });
        this.elements.errorContainer.classList.remove('hidden');
    }

    clearErrors() {
        if (this.elements.errorContainer) this.elements.errorContainer.classList.add('hidden');
        if (this.elements.errorList) this.elements.errorList.innerHTML = '';
        ['fullName', 'id_card', 'birthDate', 'birthTime'].forEach(f => this.clearFieldError(f));
    }

    showError(message) {
        verifyFunctionApproval('showError');
        this.showErrors([message]);
        this.showToast(message, 'error');
    }

    dispatchFormSubmitted(formData) {
        const event = new CustomEvent('personalFormSubmitted', {
            detail: { data: formData, option: formData.option, timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
        console.log("[FormUI] 📤 Dispatched personalFormSubmitted event");
    }

    handleInputChange(fieldId, value) {
        verifyFunctionApproval('handleInputChange');
        console.log(`[FormUI] 📝 Input changed: ${fieldId} = ${value}`);
        this.state.isDirty = true;
        window.dispatchEvent(new CustomEvent('formInputChanged', { detail: { field: fieldId, value } }));
    }

    cleanup() {
        verifyFunctionApproval('cleanup');
        console.log("[FormUI] 🧹 Cleaning up Form UI v" + window.FormUI_VERSION + "...");
        if (this.unsubscribeMusicCurrent) { this.unsubscribeMusicCurrent(); this.unsubscribeMusicCurrent = null; }
        this.state = { formVisible: false, loading: false, currentView: 'main', formData: null, validationErrors: {} };
        this.elements = {};
        console.log("[FormUI] ✅ Form UI cleaned up");
    }

    getStatus() {
        return {
            version: window.FormUI_VERSION,
            state: this.state,
            localStorage: {
                userData:      !!localStorage.getItem(this.localStorageKeys.userData),
                musicCurrent:  !!localStorage.getItem(this.localStorageKeys.musicCurrent),
                musicDefault:  !!localStorage.getItem(this.localStorageKeys.musicDefault),
                numerologyData:!!localStorage.getItem(this.localStorageKeys.numerologyData)
            },
            elements: Object.keys(this.elements).length
        };
    }
    
    
    // ✅ v2.9.8: ปรับ UI ตาม Edition Features
    _applyEditionRestrictions() {
        const trial = window.AppMainController?.getState?.('trial');
        if (!trial || !trial.features) return;

        const features = trial.features;
        
        
        //const melody1Allowed = features.melody1_styles?.allowed !== false;
        const melody1Styles   = features.melody1_styles?.options || features.melody1_styles || [];
        
        //const melody2Allowed  = features.melody2_styles?.allowed !== false;
        const melody2Styles   = features.melody2_styles?.options || features.melody2_styles || [];
        
        
        const effectAllowed   = features.effect_mix_allowed?.allowed !== false;

        // === Melody1 ===
        const base1 = document.getElementById('musicStyleBase1');
        const effect1 = document.getElementById('effectMix1');
        if (base1) {
            base1.disabled = false;
            if (melody1Styles.length > 0 && Array.isArray(melody1Styles)) {
                // จำกัด options ให้ตรงตามที่อนุญาต
                const currentValue = base1.value;
                base1.querySelectorAll('option').forEach(opt => {
                    opt.style.display = melody1Styles.includes(opt.value) ? '' : 'none';
                });
                // ถ้า current value ไม่อยู่ใน allowed → เปลี่ยนไปใช้ตัวแรกที่อนุญาต
                if (!melody1Styles.includes(currentValue) && melody1Styles.length > 0) {
                    base1.value = melody1Styles[0];
                }
            }
        }
        if (effect1) {
            effect1.disabled = !effectAllowed;
            if (!effectAllowed) {
                effect1.value = 'full'; // force full เมื่อปิด
            }
        }

        // === Melody2 ===
        const base2 = document.getElementById('musicStyleBase2');
        const effect2 = document.getElementById('effectMix2');
        if (base2) {
             base2.disabled = false;
            // option filtering เหมือน Melody1
            if (melody2Styles.length > 0 && Array.isArray(melody2Styles)) {
                const currentValue = base2.value;
                base2.querySelectorAll('option').forEach(opt => {
                    opt.style.display = melody2Styles.includes(opt.value) ? '' : 'none';
                });
                if (!melody2Styles.includes(currentValue) && melody2Styles.length > 0) {
                    base2.value = melody2Styles[0];
                }
            } 
        }
        if (effect2) {
            effect2.disabled = !effectAllowed;
            if (!effectAllowed) {
                effect2.value = 'full';
            }
        }

        // ✅ แสดง locked_reason ถ้ามี
        const lockedReason = features.melody2_styles?.locked_reason || '';
        const reasonEl = document.getElementById('melody2LockedReason');
        if (reasonEl) {
            reasonEl.textContent = lockedReason ? `🔒 ${lockedReason}` : '';
        }
    }
    
}

// ========== 16. GLOBAL EXPORT ==========
window.FormUI = new FormUIController();

window.FormUIController = {
    initialize:       () => window.FormUI.initialize(),
    cleanup:          () => window.FormUI.cleanup(),
    showForm:         () => window.FormUI.showForm(),
    hideForm:         () => window.FormUI.hideForm(),
    saveFormData:     (formData) => window.FormUI.saveToLocalStorage('userData', formData),
    loadFormData:     () => window.FormUI.loadFromLocalStorage('userData'),
    clearAllData:     () => window.FormUI.clearLocalStorage(),
    generateMusic:    () => window.FormUI.handleGenerateMusic(),
    resetToDefault:   () => window.FormUI.handleResetToDefault(),
    showLoading:      (message) => window.FormUI.showLoading(message),
    hideLoading:      () => window.FormUI.hideLoading(),
    showToast:        (message, type) => window.FormUI.showToast(message, type),
    getStatus:        () => window.FormUI.getStatus()
};

// ========== 17. AUTO-INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("[FormUI] 📄 DOM Content Loaded - Starting Form UI v" + window.FormUI_VERSION + "..");
    setTimeout(() => {
        try {
            if (typeof window.DataContract === 'undefined') {
                console.error("[FormUI] ❌ DataContract not available");
                return;
            }
            window.FormUIController.initialize();
            console.log("[FormUI] 🎉 Form UI v" + window.FormUI_VERSION + " ready!");
        } catch (error) {
            console.error("[FormUI] ❌ initialization failed:", error);
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div class="text-center">
                        <h2 class="text-xl text-white mb-4">⚠️ UI Error</h2>
                        <p class="text-slate-300 mb-4">${error.message}</p>
                        <button onclick="location.reload()" class="px-4 py-2 bg-red-600 rounded-lg">Reload Page</button>
                    </div>
                `;
            }
        }
    }, 300);
});

console.log("[FormUI] ✅ FORM-UI.JS v" + window.FormUI_VERSION + " LOADED");
console.log("[FormUI] 📋 FORM-UI Approved Functions:", Object.keys(APPROVED_FUNCTIONS_FrmUI));
console.log("[FormUI] 🔗 DataContract available:", typeof window.DataContract !== 'undefined');
console.log("[FormUI] 🔗 AppMain available:", typeof window.AppMainController !== 'undefined');
console.log("[FormUI] 🔗 FormPsychomatrix available:", typeof window.FormPsychomatrixController !== 'undefined');