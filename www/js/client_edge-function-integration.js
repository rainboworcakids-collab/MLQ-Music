// 📁 /js/client_edge-function-integration.js 
// Edge Functions Integration สำหรับ Psychomatrix Music Basic Edition
// 🛡️ ควบคุมการเรียก Edge Functions ทั้ง 3 ตัว ผ่าน Proxy บน Supabase
// กฎ: ห้ามสร้าง Mock Data, ต้อง validate ทุก Input/Output ผ่าน DataContract,
//      ใช้เฉพาะฟังก์ชันที่ได้รับอนุมัติ, ไม่มี Cross-Module Fallback
//
// v5.0 – Refactor: centralized EDGE_FUNCTIONS configuration
//       - รวม endpoint, validation, timeout ไว้ใน config object เดียว
//       - เปลี่ยน callEdgeFunction ให้รับ (functionName, data) แทน (url, data, functionName)
//       - ลบ hardcoded URL getters ทั้งหมด
//       - เพิ่ม _buildURL() helper

window.EdgeIntegration_VERSION = 5.2;

console.log("[EdgeIntegration] 🔧 client_edge-function-integration v" + window.EdgeIntegration_VERSION + " - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS (กฎข้อ 0) ==========
const APPROVED_FUNCTIONS_EDGE = {
  constructor: true,
  getBaseURL: true,
  _buildURL: true,
  callEdgeFunction: true,
  prepareDataForEdgeFunctions: true,
  convertISODateToEdgeFormat: true,
  parseBirthDateForLuckyNumber: true,
  validateResponse: true,
  mergeEdgeFunctionResults: true,
  calculateNumerology: true,
  generateMusicDNA: true,
  processDefaultMode: true,
  processCustomMode: true,
  healthCheck: true,
  clearCache: true,
  callMusicPreferenceGenerator: true,
  callTrialCheck: true
};

function verifyFunctionApproval(functionName) {
  if (!APPROVED_FUNCTIONS_EDGE[functionName]) {
    throw new Error(`[EdgeIntegration] 🚫 UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
  }
}

/* -- Edge Functions List --
  edge-function-integration
  get-music-preset
 'psychomatrix-calculate' :
 'lucky-number-calculate':
 'music-generator-MusicDNA':
 'music-preference-generator':
 
 // --QR Code Function   
  trial-check
  generate-music-qr
  
    // --table ที่เกี่ยวข้อง QR Code
    select * from card_templates
    select * from user_songs;
    SELECT * FROM trial_users;
    select * from music_presets
    select * from edition_features;
    SELECT * FROM storytelling_steps;

*/
 
// ========== 2. EDGE FUNCTION CENTRAL CONFIGURATION ==========
const EDGE_FUNCTIONS = {
  'psychomatrix-calculate': {
    path: '/psychomatrix-calculate',
    proxyBase: true,                 // ใช้ edge-function-integration proxy
    validator: (input) => {
      if (window.DataContract?.validatePsychomatrixInput) {
        window.DataContract.validatePsychomatrixInput(input);
      }
    },
    outputValidator: (output) => {
      if (window.DataContract?.validatePsychomatrixOutput) {
        window.DataContract.validatePsychomatrixOutput(output);
      }
    }
  },
  'lucky-number-calculate': {
    path: '/lucky-number-calculate',
    proxyBase: true,
    validator: (input) => {
      if (window.DataContract?.validateLuckyNumberInput) {
        window.DataContract.validateLuckyNumberInput(input);
      }
    },
    outputValidator: (output) => {
      if (window.DataContract?.validateLuckyNumberOutput) {
        window.DataContract.validateLuckyNumberOutput(output);
      }
    }
  },
  'music-generator-MusicDNA': {
    path: '/music-generator-MusicDNA',
    proxyBase: true,
    validator: (input) => {
      if (window.DataContract?.validateMusicGeneratorInput) {
        window.DataContract.validateMusicGeneratorInput(input);
      }
    },
    outputValidator: null            // validated inside generateMusicDNA()
  },
  'trial-check': {
    path: '/trial-check',
    proxyBase: false,                // เรียกตรง /functions/v1/trial-check
    timeout: 10000,
    validator: null,
    outputValidator: null
  },
  'music-preference-generator': {
    path: '/music-preference-generator',
    proxyBase: false,
    validator: null,
    outputValidator: null
  }
};

// ========== 3. EDGE FUNCTION INTEGRATION CLASS ==========
class EdgeFunctionIntegration {
  constructor() {
    verifyFunctionApproval('constructor');

    this._baseURL = null;

    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      retryableStatuses: [408, 429, 500, 502, 503, 504]
    };

    this.cache = new Map();
    this.timeout = 30000;            // default timeout

    console.log("[EdgeIntegration] ✅ v" + window.EdgeIntegration_VERSION + " initialized (centralized config)");
  }

   // ---- SUPABASE_URL WAITER ----
   _waitForSupabaseURL(maxWaitMs = 5000, intervalMs = 100) {
        // Set fallback ทันทีเลย ไม่ต้องรอ
        if (!window.SUPABASE_URL) {
            window.SUPABASE_URL = 'https://oibubvhuiuurkxhnefsw.supabase.co';
            window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY 
            || 'sb_publishable_tDw0VvUdJsLrETh25IKCRA_VG-telwP';
            console.warn('[EdgeIntegration] ⚠️ SUPABASE_URL not found – using hardcoded fallback');
        }
        return Promise.resolve(window.SUPABASE_URL);
    }
  

  // ---- BASE URL ----
  getBaseURL() {
    verifyFunctionApproval('getBaseURL');
    if (this._baseURL) return this._baseURL;
    if (window.SUPABASE_URL) {
      this._baseURL = `${window.SUPABASE_URL}/functions/v1/edge-function-integration`;
      console.log('[EdgeIntegration] baseURL:', this._baseURL);
      return this._baseURL;
    }
    throw new Error(
      '[EdgeIntegration] SUPABASE_URL is not defined yet. Use callEdgeFunction() which waits automatically.'
    );
  }

  // ---- BUILD URL FROM CONFIG ----
  _buildURL(functionName) {
    verifyFunctionApproval('_buildURL');
    const config = EDGE_FUNCTIONS[functionName];
    if (!config) throw new Error(`[EdgeIntegration] Unknown function: ${functionName}`);

    if (config.proxyBase) {
      return `${this.getBaseURL()}${config.path}`;
    } else {
      if (!window.SUPABASE_URL) {
        throw new Error('[EdgeIntegration] SUPABASE_URL required for direct call');
      }
      return `${window.SUPABASE_URL}/functions/v1${config.path}`;
    }
  }

  // ---- MAIN CALL (simplified signature) ----
  async callEdgeFunction(functionName, data) {
    verifyFunctionApproval('callEdgeFunction');

    const config = EDGE_FUNCTIONS[functionName];
    if (!config) throw new Error(`[EdgeIntegration] Unknown function: ${functionName}`);

    // Resolve URL (with waiting if needed)
    let url;
    try {
      url = this._buildURL(functionName);
    } catch (e) {
      // Direct call but SUPABASE_URL not ready → wait and rebuild
      await this._waitForSupabaseURL();
      url = this._buildURL(functionName);
    }

    console.log(
      `[EdgeIntegration] 📡 Calling ${functionName} via ${config.proxyBase ? 'proxy' : 'direct'}`
    );

    // Input validation
    if (config.validator) {
      try {
        config.validator(data);
      } catch (validationError) {
        throw new Error(
          `[EdgeIntegration] Input validation failed for ${functionName}: ${validationError.message}`
        );
      }
    }

    let lastError = null;
    const effectiveTimeout = config.timeout || this.timeout;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': window.SUPABASE_ANON_KEY || ''
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data),
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (
            this.retryConfig.retryableStatuses.includes(response.status) &&
            attempt < this.retryConfig.maxRetries
          ) {
            throw new Error(`${functionName} returned ${response.status} (retryable)`);
          }
          const errorText = await response.text();
          throw new Error(`${functionName} returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        // Output validation
        if (config.outputValidator) {
          try {
            config.outputValidator(result);
          } catch (validationError) {
            throw new Error(
              `[EdgeIntegration] Output validation failed for ${functionName}: ${validationError.message}`
            );
          }
        }

        console.log(`[EdgeIntegration] ✅ ${functionName} successful on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`[EdgeIntegration] 🚫 ${functionName} attempt ${attempt} failed:`, error.message);
        if (attempt === this.retryConfig.maxRetries) break;

        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(2, attempt - 1),
          this.retryConfig.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(
      `[EdgeIntegration] ${functionName} failed after ${this.retryConfig.maxRetries} attempts: ${lastError?.message}`
    );
  }

  // ---- VALIDATE RESPONSE (wrapper for external use) ----
  validateResponse(response, functionName) {
    verifyFunctionApproval('validateResponse');
    const config = EDGE_FUNCTIONS[functionName];
    if (config?.outputValidator) {
      config.outputValidator(response);
    } else {
      console.warn(`[EdgeIntegration] No output validator for ${functionName}`);
    }
  }

  // ---- DATA PREPARATION ----
  prepareDataForEdgeFunctions(formData) {
    verifyFunctionApproval('prepareDataForEdgeFunctions');

    const { personalData, option } = formData;
    const edgeBirthDate = this.convertISODateToEdgeFormat(
      personalData.birthDate,
      personalData.birthTime
    );
    const birthParts = this.parseBirthDateForLuckyNumber(
      personalData.birthDate,
      personalData.birthTime
    );

    return {
      psychomatrixData: {
        birth_date: edgeBirthDate,
        id_card: personalData.id_card || null,
        full_name: personalData.fullName || null,
        option: option
      },
      luckyNumberData: {
        ...birthParts,
        id_card: personalData.id_card || null,
        full_name: personalData.fullName || null,
        option: option,
        prophesy: '1'
      }
    };
  }

  convertISODateToEdgeFormat(isoDate, time) {
    verifyFunctionApproval('convertISODateToEdgeFormat');
    return window.DataContract.convertToPsychomatrixFormat(isoDate, time);
  }

  parseBirthDateForLuckyNumber(isoDate, time) {
    verifyFunctionApproval('parseBirthDateForLuckyNumber');
    return window.DataContract.parseBirthDateForLuckyNumber(isoDate, time);
  }

  // ---- RESULT MERGING (unchanged logic) ----
  mergeEdgeFunctionResults(psychomatrixResult, luckyNumberResult, option) {
    verifyFunctionApproval('mergeEdgeFunctionResults');

    const numerologyData = {
      sources: {},
      luckyNumbers: luckyNumberResult.results,
      allResults: psychomatrixResult.results,
      processedAt: new Date().toISOString()
    };

    const birthDateResult = psychomatrixResult.results.find(r => r.type === 'birth-date');
    const idCardResult = psychomatrixResult.results.find(r => r.type === 'id-card');
    const fullNameResult = psychomatrixResult.results.find(r => r.type === 'full-name');

    const requiredTypes = [];
    if (option.includes('BD')) requiredTypes.push('birth-date');
    if (option.includes('IDC')) requiredTypes.push('id-card');
    if (option.includes('FullName')) requiredTypes.push('full-name');

    const missingTypes = requiredTypes.filter(type => {
      if (type === 'birth-date' && !birthDateResult) return true;
      if (type === 'id-card' && !idCardResult) return true;
      if (type === 'full-name' && !fullNameResult) return true;
      return false;
    });

    if (missingTypes.length > 0) {
      throw new Error(
        `Missing required data from psychomatrix-calculate: ${missingTypes.join(', ')}`
      );
    }

    if (birthDateResult) {
      const birthData = birthDateResult.data;
      if (
        !birthData ||
        !birthData.destiny_number ||
        !birthData.life_path_number ||
        !birthData.thirdAndFourth
      ) {
        throw new Error('Incomplete birth-date data from psychomatrix-calculate');
      }
      numerologyData.sources.birthDate = {
        data: birthData,
        lifepath_data: birthDateResult.lifepath_data || null
      };
      numerologyData.lifePath = birthData.life_path_number;
      numerologyData.destinyNumber = birthData.destiny_number;
      numerologyData.karmicNumber = birthData.thirdAndFourth?.karmic;
      numerologyData.lifeLessonNumber = birthData.thirdAndFourth?.lifeLesson;
    }

    if (idCardResult) {
      const idData = idCardResult.data;
      if (!idData || !idData.destiny_number || !idData.life_path_number) {
        throw new Error('Incomplete id-card data from psychomatrix-calculate');
      }
      numerologyData.sources.id_card = {
        data: idData,
        lifepath_data: idCardResult.lifepath_data || null
      };
      if (!numerologyData.lifePath) numerologyData.lifePath = idData.life_path_number;
      if (!numerologyData.destinyNumber) numerologyData.destinyNumber = idData.destiny_number;
    }

    if (fullNameResult) {
      const nameData = fullNameResult.data;
      if (!nameData || !nameData.destiny_number || !nameData.life_path_number) {
        throw new Error('Incomplete full-name data from psychomatrix-calculate');
      }
      numerologyData.sources.fullName = {
        data: nameData,
        lifepath_data: fullNameResult.lifepath_data || null
      };
      if (!numerologyData.lifePath) numerologyData.lifePath = nameData.life_path_number;
      if (!numerologyData.destinyNumber) numerologyData.destinyNumber = nameData.destiny_number;
    }

    if (numerologyData.lifePath === undefined || numerologyData.lifePath === null) {
      throw new Error('Could not determine lifePath number from available data');
    }
    if (numerologyData.destinyNumber === undefined || numerologyData.destinyNumber === null) {
      throw new Error('Could not determine destinyNumber from available data');
    }

    return numerologyData;
  }

  // ---- NUMEROLOGY CALCULATION ----
  async calculateNumerology(formData) {
    verifyFunctionApproval('calculateNumerology');
    console.log('[EdgeIntegration] 🔮 Starting Numerology calculation');

    try {
      await this._waitForSupabaseURL();
      if (!this._baseURL) {
        this._baseURL = `${window.SUPABASE_URL}/functions/v1/edge-function-integration`;
        console.log('[EdgeIntegration] 📌 baseURL set:', this._baseURL);
      }

      const preparedData = this.prepareDataForEdgeFunctions(formData);

      const [psychomatrixResult, luckyNumberResult] = await Promise.all([
        this.callEdgeFunction('psychomatrix-calculate', preparedData.psychomatrixData),
        this.callEdgeFunction('lucky-number-calculate', preparedData.luckyNumberData)
      ]);

      const numerologyData = this.mergeEdgeFunctionResults(
        psychomatrixResult,
        luckyNumberResult,
        formData.option
      );

      console.log('[EdgeIntegration] ✅ Numerology calculation complete');
      return numerologyData;
    } catch (error) {
      console.error('[EdgeIntegration] ❌ Numerology calculation failed:', error);
      throw error;
    }
  }

  // ---- MUSIC DNA GENERATION ----
  async generateMusicDNA(numerologyData, formData, musicPreferences) {
    verifyFunctionApproval('generateMusicDNA');
    console.log('[EdgeIntegration] 🎵 Generating MusicDNA');

    try {
      if (!numerologyData?.lifePath) throw new Error('Invalid numerologyData: missing lifePath');
      if (!formData?.option) throw new Error('Invalid formData: missing option');
      if (!musicPreferences?.style) throw new Error('Invalid musicPreferences: missing style');
      if (!musicPreferences.element) throw new Error('musicPreferences missing element');

      // Ensure birthDate source
      if (!numerologyData.sources?.birthDate) {
        if (!formData.birthDate) throw new Error('birthDate missing from formData — กรุณากรอกวันเกิด');
        console.log("[EdgeIntegration] Creating birthDate source from formData.birthDate (option without BD)");
        const birthDateRaw = {
          birth_date: formData.birthDate,
          life_path_number: numerologyData.lifePath,
          destiny_number: numerologyData.destinyNumber
        };
        numerologyData.sources = numerologyData.sources || {};
        numerologyData.sources.birthDate = { data: birthDateRaw, lifepath_data: null };
      }

      const musicNumerologyData = {
        birthDate: {
          numberString: this._extractNumberString(numerologyData.sources.birthDate.data),
          rawData: numerologyData.sources.birthDate.data,
          lifePathNumber: numerologyData.sources.birthDate.data.life_path_number,
          destinyNumber: numerologyData.sources.birthDate.data.destiny_number
        },
        lifePath: numerologyData.lifePath,
        destinyNumber: numerologyData.destinyNumber,
        karmicNumber: numerologyData.karmicNumber,
        lifeLessonNumber: numerologyData.lifeLessonNumber
      };

      if (numerologyData.sources?.id_card) {
        musicNumerologyData.idCard = {
          numberString: numerologyData.sources.id_card.data?.id_card || '',
          rawData: numerologyData.sources.id_card.data,
          lifePathNumber: numerologyData.sources.id_card.data?.life_path_number,
          destinyNumber: numerologyData.sources.id_card.data?.destiny_number
        };
      }
      if (numerologyData.sources?.fullName) {
        musicNumerologyData.fullName = {
          numberString: numerologyData.sources.fullName.data?.number_string || '',
          rawData: numerologyData.sources.fullName.data,
          lifePathNumber: numerologyData.sources.fullName.data?.life_path_number,
          destinyNumber: numerologyData.sources.fullName.data?.destiny_number
        };
      }

      const musicGeneratorData = window.DataContract.createMusicGeneratorInput(
        musicNumerologyData,
        formData,
        musicPreferences
      );

      console.log('[EdgeIntegration] 📦 musicGeneratorData prepared');

      const musicResult = await this.callEdgeFunction(
        'music-generator-MusicDNA',
        musicGeneratorData
      );

      if (!musicResult?.musicDNA) throw new Error('Invalid response: missing musicDNA');
      if (!musicResult.musicDNA.config?.element) {
        throw new Error('musicDNA missing element in config');
      }

      const expectedElement = musicPreferences.element.toLowerCase().trim();
      const actualElement = musicResult.musicDNA.config.element.toLowerCase().trim();
      if (actualElement !== expectedElement) {
        throw new Error(
          `Element mismatch in musicDNA: expected "${expectedElement}", got "${actualElement}"`
        );
      }

      console.log('[EdgeIntegration] ✅ MusicDNA generation complete (element validation passed)');
      return musicResult.musicDNA;
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error (no message)';
      console.error('[EdgeIntegration] ❌ MusicDNA generation failed:', errorMessage, error);
      throw new Error(`Music generation failed: ${errorMessage}`);
    }
  }

  _extractNumberString(data) {
    if (!data) return '';
    if (data.birth_date) return data.birth_date.replace(/[^0-9]/g, '');
    if (data.number_string) return data.number_string;
    return '';
  }

  // ---- PROCESS MODES ----
  async processDefaultMode(formData, musicPreferences) {
    verifyFunctionApproval('processDefaultMode');
    console.log('[EdgeIntegration] 🚀 Starting Default Mode processing');
    try {
      const numerologyData = await this.calculateNumerology(formData);
      const musicDNA = await this.generateMusicDNA(numerologyData, formData, musicPreferences);
      return {
        success: true,
        numerologyData,
        musicDNA,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[EdgeIntegration] ❌ Default Mode processing failed:', error);
      throw error;
    }
  }

  async processCustomMode(formData, userMusicPreferences) {
    verifyFunctionApproval('processCustomMode');
    console.log('[EdgeIntegration] 🎨 Starting Custom Mode processing');
    try {
      const numerologyData = await this.calculateNumerology(formData);
      const musicPreferences = {
        ...userMusicPreferences,
        numerologyContext: {
          lifePath: numerologyData.lifePath,
          element: numerologyData.sources.birthDate?.lifepath_data?.ธาตุ,
          energy: numerologyData.sources.birthDate?.lifepath_data?.พลังงาน
        }
      };
      const musicDNA = await this.generateMusicDNA(numerologyData, formData, musicPreferences);
      return {
        success: true,
        numerologyData,
        musicDNA,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[EdgeIntegration] ❌ Custom Mode processing failed:', error);
      throw error;
    }
  }

  clearCache() {
    verifyFunctionApproval('clearCache');
    this.cache.clear();
    console.log('[EdgeIntegration] 🗑️ Cache cleared');
  }

  async healthCheck() {
    verifyFunctionApproval('healthCheck');
    console.log('[EdgeIntegration] 🏥 Health check requested (disabled)');
    return {
      timestamp: new Date().toISOString(),
      message: 'Health check is disabled to prevent test data creation',
      status: 'disabled',
      baseURL: this._baseURL || 'not set'
    };
  }

  // ---- SPECIAL CALLS (direct, using config but own fetch logic) ----
  async callTrialCheck(forceCreate = false) {
    verifyFunctionApproval('callTrialCheck');

    let userId =
      window.__ANON_USER_ID || localStorage.getItem('mlq_anonymous_user_id');
    if (!userId && typeof window.initUserSession === 'function') {
      const user = await window.initUserSession();
      userId = user?.id;
    }

    if (!userId) {
      console.warn('[EdgeIntegration] No user id, returning basic fallback');
      return {
        trial: false,
        edition: 'basic',
        days_left: null,
        features: { melody1_styles: ['lofi'] }
      };
    }

    let url;
    try {
      await this._waitForSupabaseURL(2000, 100);
      url = this._buildURL('trial-check');
    } catch (e) {
      console.error('[EdgeIntegration] SUPABASE_URL not ready for trial-check, using fallback');
      return {
        trial: false,
        edition: 'basic',
        days_left: null,
        features: { melody1_styles: ['lofi'] }
      };
    }

    const config = EDGE_FUNCTIONS['trial-check'];
    const controller = new AbortController();
    const timeoutMs = config.timeout || 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: window.SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({
          user_id: userId,
          client_timestamp: new Date().toISOString(),
          force_create: forceCreate
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
      }

      const result = await response.json();
      console.log('[EdgeIntegration] ✅ trial-check result:', result);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[EdgeIntegration] trial-check error:', err);
      return {
        trial: false,
        edition: 'basic',
        days_left: null,
        features: { melody1_styles: ['lofi'] }
      };
    }
  }

  async callMusicPreferenceGenerator(numerologyContext) {
    verifyFunctionApproval('callMusicPreferenceGenerator');

    let url;
    try {
      await this._waitForSupabaseURL();
      url = this._buildURL('music-preference-generator');
    } catch (e) {
      throw new Error('SUPABASE_URL not ready for music-preference-generator');
    }

    let lastError = null;
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: window.SUPABASE_ANON_KEY || ''
          },
          body: JSON.stringify(numerologyContext),
          signal: AbortSignal.timeout(this.timeout),
          mode: 'cors',
          cache: 'no-cache'
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Status ${response.status}: ${errText}`);
        }

        const result = await response.json();
        if (result.error) throw new Error(result.error);
        if (!result.style || !result.instruments) {
          throw new Error('Invalid musicPreferences response');
        }
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.initialDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw new Error(`MusicPreferenceGenerator failed: ${lastError?.message}`);
  }
}

// ===== SINGLETON =====
let edgeFunctionIntegrationInstance = null;

function createEdgeFunctionIntegration() {
  if (!edgeFunctionIntegrationInstance) {
    edgeFunctionIntegrationInstance = new EdgeFunctionIntegration();
  }
  return edgeFunctionIntegrationInstance;
}

if (typeof window !== 'undefined') {
  window.EdgeFunctionIntegration = createEdgeFunctionIntegration();
  console.log('[EdgeIntegration] ✅ v' + window.EdgeIntegration_VERSION + ' loaded (centralized config)');
}