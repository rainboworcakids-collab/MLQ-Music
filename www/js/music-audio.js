// music-audio.js v6.9.4

window.MusicAudio_VERSION = "6.9.4";
 
console.log("[MusicAudio] 🎵 Music-Audio Module version v'+ window.MusicAudio_VERSION + '  - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_MusicAudio = {
    constructor: true,
    initialize: true,
    cleanup: true,
    waitForUserInteraction: true,
    setupTransport: true,
    handleTransportStart: true,
    handleTransportStop: true,
    handleTransportPause: true,
    handleTransportLoop: true,
    setupEventListeners: true,
    setupUIListeners: true,
    handleMusicDNAGenerated: true,
    handleCombinedDNA: true,
    scheduleMusicEvents: true,
    scheduleNatureEffects: true,
    playMelodyNote: true,
    playChord: true,
    triggerNatureEffect: true,
    stopNatureEffect: true,
    togglePlayback: true,
    play: true,
    pause: true,
    stop: true,
    changeTempo: true,
    setMasterVolume: true,
    setMute: true,
    clearScheduledEvents: true,
    parseTimecode: true,
    handleSynthCreated: true,
    handleSynthDisposed: true,
    getPlaybackState: true,
    createEffectChain: true,
    disposeEffects: true,
    connectEffects: true,
    disconnectEffects: true,
    playNatureEffectFromObject: true,
    playNatureLayer: true,
    setLoopEnabled: true,
    buildSynthFromInstrument: true,
    applyMoodToEffects: true,
    getOrCreateInstrumentSynth: true,
    disposeInstrumentSynths: true,
    _preloadNatureSounds: true,
    _computeInstrumentDelays: true,  
    _prewarmSynths: true,             
    _extendLastNotes: true             
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_MusicAudio[functionName]) {
        console.warn(`⚠️ [MusicAudio] Function "${functionName}" not in APPROVED_FUNCTIONS`);
    }
}

// ========== 2. INSTRUMENT → SYNTH CONFIG MAP ==========
const INSTRUMENT_SYNTH_CONFIG = {
    piano: { oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 1.2 } },
    electricPiano: { oscillator: { type: 'fmsine', modulationType: 'triangle', modulationIndex: 3 }, envelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.8 } },
    organ: { oscillator: { type: 'fatsawtooth', count: 2, spread: 20 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.3 } }, 
    harpsichord: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.0, release: 0.4 } },
    strings: { oscillator: { type: 'fatsawtooth', count: 1, spread: 30 }, envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 1.5 } }, 
    violin: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.3, decay: 0.1, sustain: 0.9, release: 0.8 } },
    cello: { oscillator: { type: 'fatsawtooth', count: 2, spread: 15 }, envelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 1.2 } },
    guitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.8 } },
    acousticGuitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    acoustic_guitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    acousticguitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    electricGuitar: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 } },
    electricguitar: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 } },
    bass: { oscillator: { type: 'square' }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.6 } },
    flute: { oscillator: { type: 'sine' }, envelope: { attack: 0.08, decay: 0.15, sustain: 0.7, release: 0.9 } }, 
    clarinet: { oscillator: { type: 'square' }, envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.5 } },
    saxophone: { oscillator: { type: 'fatsawtooth', count: 2, spread: 10 }, envelope: { attack: 0.06, decay: 0.1, sustain: 0.8, release: 0.6 } },
    trumpet: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.04, decay: 0.1, sustain: 0.7, release: 0.4 } },
    erhu: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 5 }, envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.9 } },
    sitar: { oscillator: { type: 'fmtriangle', modulationType: 'sawtooth', modulationIndex: 8 }, envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.0 } },
    koto: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.9, sustain: 0.0, release: 1.2 } },
    guzheng: { oscillator: { type: 'fmtriangle', modulationType: 'sine', modulationIndex: 4 }, envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 1.0 } },
    kalimba: { oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.8, sustain: 0.08, release: 1.8 } }, 
    pad: { oscillator: { type: 'fatsine', count: 2, spread: 20 }, envelope: { attack: 0.2, decay: 0.3, sustain: 0.9, release: 2.0 } }, 
    synthPad: { oscillator: { type: 'fatsawtooth', count: 2, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } }, 
    synthpad: { oscillator: { type: 'fatsawtooth', count: 2, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } }, 
    bellPad: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 6 }, envelope: { attack: 0.01, decay: 1.5, sustain: 0.1, release: 2.0 } },
    bellpad: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 6 }, envelope: { attack: 0.01, decay: 1.5, sustain: 0.1, release: 2.0 } },
    marimba: { oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.4, sustain: 0.0, release: 0.6 } },
    xylophone: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.0, release: 0.5 } },
    bells: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 10 }, envelope: { attack: 0.005, decay: 2.0, sustain: 0.0, release: 2.5 } },
    bass_synth: { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 } },
    vibes: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.25, release: 0.8 } }, 
    celesta: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.5, sustain: 0.15, release: 0.8 } }, 
    synth_pad: { oscillator: { type: 'fatsawtooth', count: 2, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } }, 
    vibraphone: { oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.6, sustain: 0.0, release: 1.2 } },
    chimes: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 3 }, envelope: { attack: 0.005, decay: 0.8, sustain: 0.10, release: 0.6 } }, 
    harp: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.6, sustain: 0.25, release: 1.2 } }, 
    drums: { oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.1 } },
    percussion: { oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.2 } },
    shamisen: { oscillator: { type: 'fmsawtooth', modulationType: 'sine', modulationIndex: 4 }, envelope: { attack: 0.005, decay: 0.5, sustain: 0.1, release: 0.7 } },
    synth: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 } },
    bell: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 8 }, envelope: { attack: 0.005, decay: 1.8, sustain: 0.0, release: 2.0 } },
    electric_guitar: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 } },
    synth_lead: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 } }
};

const INSTRUMENT_CHORD_CONFIG = {
    piano: { oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 1.2 } },
    electricPiano: { oscillator: { type: 'fmsine', modulationType: 'triangle', modulationIndex: 3 }, envelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.8 } },
    organ: { oscillator: { type: 'fatsawtooth', count: 2, spread: 20 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.3 } }, 
    strings: { oscillator: { type: 'fatsawtooth', count: 1, spread: 30 }, envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 1.5 } }, 
    guitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.8 } },
    acousticGuitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    pad: { oscillator: { type: 'fatsine', count: 2, spread: 20 }, envelope: { attack: 0.2, decay: 0.3, sustain: 0.9, release: 2.0 } }, 
    synthPad: { oscillator: { type: 'fatsawtooth', count: 2, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } }, 
    vibes: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.25, release: 0.8 } }, 
    celesta: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.5, sustain: 0.15, release: 0.8 } }, 
    harp: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.6, sustain: 0.25, release: 1.2 } } 
};

// ========== 3. MAIN CLASS ==========
class MusicAudio {
    constructor() {
        verifyFunctionApproval('constructor');

        this.moduleName = 'MusicAudio';
        this.initialized = false;
        this.isPlaying = false;
        this.currentTempo = 0;
        this.scheduledEvents = new Map();
        this.musicDNA = null;

        this.activeNatureSounds = new Map();
        this._natureGeneration = 0;

        this.audioContext = null;
        this.userInteracted = false;
        this.transportPosition = 0;
        this.unsubscribeMusicCurrent = null;

        this.effectNodes = [];
        this.effectInput = null;
        this.effectOutput = Tone.Destination;

        this.natureSounds = null;

        this._loopEnabled = false;
        this._activePart = null;
        this._activeInstruments = [];
        this.instrumentSynths = {};

        // FIX 4: ลบ fixed _instrumentDelay = [0, 0.5, 0.9]
        // ใช้ _computeInstrumentDelays(bpm) แทน (dynamic per BPM)

        this.log = (msg) => console.log(`[${this.moduleName}] 🐛 DEBUG: ${msg}`);
        this.logWarning = (msg) => console.warn(`[${this.moduleName}] ⚠️ ${msg}`);
        this.logError = (msg, err) => {
            console.error(`[${this.moduleName}] ❌ ${msg}`, err?.message || err, err?.stack || '');
        };
        this.handleError = (msg, err) => this.logError(msg, err);

        this.log('Constructor called');
    }

    // ========== FIX 4: Dynamic instrument stagger ==========
    // Stagger capped ที่ 25% ของ beat → ไม่ overlap ที่ BPM ใดก็ได้
    // BPM=42 → beat=1.43s → [0, 0.357s, 0.643s]
    // BPM=99 → beat=0.61s → [0, 0.152s, 0.273s]
    // v6.9: stagger optimised for lofi/relax (55–90 BPM)
    // Target [0, 0.40, 0.60]s → stereo spread ชัด, เครื่องดนตรีแยกกันได้ยิน
    // ทุก BPM 55-90: stagger < beat → ไม่ overlap
    // BPM >90: scale down proportionally เพื่อไม่เกิน beat interval
    _computeInstrumentDelays(bpm) {
        verifyFunctionApproval('_computeInstrumentDelays');
        const safeBpm = Math.max(bpm || 60, 10);
        const beatSec = 60 / safeBpm;
        // s1=0.40s, s2=0.60s สำหรับ BPM ≤90 (beat ≥ 0.667s)
        // scale ลงเมื่อ BPM สูงมาก เพื่อให้ s2 < beat เสมอ
        const s1 = parseFloat(Math.min(0.40, beatSec * 0.55).toFixed(3));
        const s2 = parseFloat(Math.min(0.60, beatSec * 0.82).toFixed(3));
        return [0, s1, s2];
    }

    // ========== v6.9.3/4: Extend last notes of a section ==========
    // ยืด notes ใน "last beat group" ของ section ให้ duration='2n'
    // ใช้ได้ทั้ง Melody1 (boundary=defaultEndSec) และ Melody2 (boundary=loopEndSec)
    // sectionEndSec = เวลาสิ้นสุดของ section นั้น (วินาที)
    _extendLastNotes(sequence, sectionEndSec, bpm) {
        verifyFunctionApproval('_extendLastNotes');
        if (!sequence || sequence.length === 0) return sequence;

        const beatSec = 60 / (bpm || 42);
        // ขยาย notes ที่อยู่ใน beat สุดท้ายของ section
        const threshold = sectionEndSec - beatSec; // 1 beat ก่อน end

        let extended = 0;
        const result = sequence.map(note => {
            let noteTimeSec;
            try {
                noteTimeSec = Tone.Time(note.time).toSeconds();
            } catch(e) {
                return note;
            }
            // ถ้า note อยู่ใน last beat group → extend duration
            if (noteTimeSec >= threshold && noteTimeSec < sectionEndSec) {
                const currentDur = note.duration || '4n';
                // ข้าม disturbance notes (duration='0n')
                if (currentDur === '0n') return note;
                // extend เป็น '2n' (2 beats) เพื่อ ring into next section
                extended++;
                return { ...note, duration: '2n' };
            }
            return note;
        });

        this.log(`v'+ window.MusicAudio_VERSION + ': Extended ${extended} last notes to '2n' (sectionEnd=${sectionEndSec.toFixed(3)}s)`);
        return result;
    }

    // ========== v6.9.2: Pre-warm synths — prevents CPU spike at note trigger ==========
    // สร้าง PolySynth สำหรับทุก instrument ใน DNA ล่วงหน้า ก่อน Transport start
    // ป้องกัน: 3 synths create พร้อม note trigger → CPU spike → AudioContext glitch
    _prewarmSynths() {
        verifyFunctionApproval('_prewarmSynths');
        if (!this.musicDNA) return;

        const allInstruments = new Set();

        // รวม instruments จากทุก section
        if (this.musicDNA._sections?.length > 0) {
            this.musicDNA._sections.forEach((section, sectionIndex) => {
                (section.instruments || []).forEach(inst => {
                    allInstruments.add({ inst, sectionIndex });
                });
            });
        } else {
            // fallback: instruments จาก musicDNA โดยตรง
            (this.musicDNA.instruments || []).forEach(inst => {
                allInstruments.add({ inst, sectionIndex: 0 });
            });
        }

        let warmed = 0;
        allInstruments.forEach(({ inst, sectionIndex }) => {
            try {
                this.getOrCreateInstrumentSynth(inst, false, sectionIndex);
                warmed++;
            } catch (e) {
                this.logWarning(`Pre-warm failed for ${inst}[s${sectionIndex}]: ${e.message}`);
            }
        });

        this.log(`v`+ window.MusicAudio_VERSION + `: Pre-warmed ${warmed} synths (no more lazy-create during playback)`);
    }

    // ========== Preload nature sounds ==========
    async _preloadNatureSounds() {
        verifyFunctionApproval('_preloadNatureSounds');
        if (!window.NatureSounds) return;
        const urls = [
            'sounds/birds.mp3',
            'sounds/frogs.mp3',
            'sounds/cricket.mp3',
            'sounds/chicken.mp3',
            'sounds/lamb.mp3'
        ];
        try {
            await Promise.all(urls.map(url => window.NatureSounds.loadBuffer?.(url) || Promise.resolve()));
            this.log('✅ Nature sounds preloaded');
        } catch (e) {
            this.logWarning('Nature sounds preload failed (non-critical): ' + e.message);
        }
    }

    async initialize() {
        verifyFunctionApproval('initialize');
        this.log('initialize() started');
        if (this.initialized) {
            this.log('already initialized, returning');
            return;
        }

        try {
            this.log('Step 1: checking Tone');
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not loaded');
            }
            this.log(`Tone available, context.state = ${Tone.context.state}`);
            this.audioContext = Tone.context;

            this.log('Step 2: setupTransport');
            this.setupTransport();
            this.log('setupTransport done');

            this.log('Step 3: setupEventListeners');
            this.setupEventListeners();

            this.log('Step 4: setupUIListeners');
            this.setupUIListeners();

            this.log('Step 5: MemoryManager track');
            if (typeof MemoryManager !== 'undefined') {
                MemoryManager.track(this, 'MusicAudio');
            }

            this.log('Step 6: subscribe to AppMain');
            if (window.AppMainController?.subscribe) {
                this.unsubscribeMusicCurrent = window.AppMainController.subscribe('music.current', (pointerValue) => {
                    this.log(`Received music.current change: "${pointerValue}" (type=${typeof pointerValue})`);
                    if (typeof pointerValue === 'string') {
                        const activeDNA = window.AppMainController.getActiveMusicDNA?.();
                        if (activeDNA) {
                            this.log(`Resolved pointer "${pointerValue}" → activeDNA (notes=${activeDNA.sequence?.length || 0})`);
                            this.handleMusicDNAGenerated(activeDNA);
                        } else {
                            const err = new Error(`Pointer "${pointerValue}" resolved to null — DNA not found in AppMain`);
                            this.logError(err.message, err);
                            this._dispatchError(err);
                        }
                    } else if (pointerValue && typeof pointerValue === 'object') {
                        this.log('Received direct DNA object via subscription');
                        this.handleMusicDNAGenerated(pointerValue);
                    }
                });
                this.log('Subscribed to AppMain music.current (pointer-aware)');

                const activeDNA = window.AppMainController.getActiveMusicDNA?.();
                if (activeDNA) {
                    this.log('Found existing activeDNA, handling now');
                    this.handleMusicDNAGenerated(activeDNA);
                }
            } else {
                this.logWarning('AppMainController not available');
            }

            window.addEventListener('musicPointerChanged', (e) => {
                const detail = e.detail || {};
                const { combinedDNA } = detail;

                if (combinedDNA?.defaultDNA && combinedDNA?.customDNA) {
                    this.log('Received musicPointerChanged → combined mode (Default + Custom)');
                    this.handleCombinedDNA(combinedDNA.defaultDNA, combinedDNA.customDNA);
                    return;
                }

                let activeDNA = detail.activeDNA;
                if (!activeDNA) {
                    if (window.AppMainController?.getActiveMusicDNA) {
                        activeDNA = window.AppMainController.getActiveMusicDNA();
                        if (activeDNA) {
                            this.log('Received musicPointerChanged event (DNA from AppMain)');
                        } else {
                            this.logWarning('musicPointerChanged without activeDNA — skipped');
                            return;
                        }
                    } else {
                        this.logWarning('musicPointerChanged: no activeDNA and AppMain unavailable');
                        return;
                    }
                } else {
                    this.log('Received musicPointerChanged event (DNA from event.detail)');
                }
                this.handleMusicDNAGenerated(activeDNA);
            });

            if (window.NatureSounds) {
                this.natureSounds = window.NatureSounds;
                this.log('NatureSounds available');
                this._preloadNatureSounds().catch(e => this.logWarning('Preload error: ' + e));
            } else {
                this.log('NatureSounds not available');
                this.natureSounds = null;
            }

            this.initialized = true;
            this.log('MusicAudio initialized successfully');
            window.dispatchEvent(new CustomEvent('playbackStateChanged', {
                detail: { isPlaying: false },
                bubbles: true
            }));

            if (window.StateManager) {
                StateManager.set('audio.initialized', true);
            }
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('audioInitialized');
            }

        } catch (error) {
            this.logError('Error in initialize:', error);
            this.handleError('Failed to initialize MusicAudio', error);
        }
    }

    waitForUserInteraction() {
        verifyFunctionApproval('waitForUserInteraction');
        return new Promise((resolve) => {
            if (this.userInteracted) {
                resolve();
                return;
            }
            const handler = () => {
                this.userInteracted = true;
                document.removeEventListener('click', handler);
                document.removeEventListener('touchstart', handler);
                this.log('User interaction detected, audio ready');
                resolve();
            };
            document.addEventListener('click', handler);
            document.addEventListener('touchstart', handler);
            setTimeout(() => {
                if (!this.userInteracted) {
                    this.logWarning('User interaction timeout, enabling audio anyway');
                    this.userInteracted = true;
                    resolve();
                }
            }, 15000);
        });
    }

    setupTransport() {
        verifyFunctionApproval('setupTransport');
        Tone.Transport.timeSignature = [4, 4];
        Tone.Transport.on('start', (t) => this.handleTransportStart(t));
        Tone.Transport.on('stop', (t) => this.handleTransportStop(t));
        Tone.Transport.on('pause', (t) => this.handleTransportPause(t));
        Tone.Transport.on('loop', (t) => this.handleTransportLoop(t));
        this.log('Tone.Transport setup complete');
    }

    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        if (typeof EventBus === 'undefined') {
            this.logWarning('EventBus not available');
            return;
        }
        EventBus.on('musicDNAGenerated', (musicDNA) => {
            if (!window.AppMainController) this.handleMusicDNAGenerated(musicDNA);
        });
        EventBus.on('playbackRequest', () => this.togglePlayback());
        EventBus.on('tempoChangeRequest', (t) => this.changeTempo(t));
        EventBus.on('stopPlayback', () => this.stop());
        EventBus.on('synthCreated', (d) => this.handleSynthCreated(d));
        EventBus.on('synthDisposed', (d) => this.handleSynthDisposed(d));
        EventBus.on('volumeChange', (v) => this.setMasterVolume(v));
        EventBus.on('muteToggle', (m) => this.setMute(m));
    }

    setupUIListeners() {
        verifyFunctionApproval('setupUIListeners');
        this.log('setupUIListeners called');

        const playBtn = document.getElementById('playButton');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.log('▶ playButton clicked directly');
                this.togglePlayback();
            });
            this.log('playButton direct listener attached');
        } else {
            this.logWarning('playButton not found!');
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.on('playbackStateChanged', (state) => {
                const icon = document.getElementById('playIcon');
                const text = document.getElementById('playButtonText');
                if (icon) icon.className = state.isPlaying ? 'fas fa-pause' : 'fas fa-play';
                if (text) text.textContent = state.isPlaying ? 'หยุดเพลง' : 'เล่นเพลง';
            });
        }
    }

    // ========== MUSIC DNA HANDLING ==========
    handleMusicDNAGenerated(musicDNA) {
        verifyFunctionApproval('handleMusicDNAGenerated');
        this.log(`handleMusicDNAGenerated called, musicDNA exists=${!!musicDNA}`);
        if (musicDNA) {
            this.log('musicDNA received:', {
                config: musicDNA.config ? 'present' : 'missing',
                sequenceLength: musicDNA.sequence?.length || 0,
                instruments: musicDNA.instruments,
                natureEffects: musicDNA.natureEffects ? musicDNA.natureEffects.length : 0
            });
        } else {
            this.log('musicDNA is null/undefined');
        }

        if (!musicDNA) {
            const err = new Error('MusicDNA is null or undefined');
            this.logError(err.message, err);
            this._dispatchError(err);
            throw err;
        }

        if (!musicDNA.config && !musicDNA.sequence && !musicDNA.melody) {
            const err = new Error('MusicDNA missing required fields (config/sequence/melody)');
            this.logError(err.message, err);
            this._dispatchError(err);
            throw err;
        }

        if (!musicDNA.instruments || !Array.isArray(musicDNA.instruments) || musicDNA.instruments.length === 0) {
            const err = new Error('MusicDNA has no instruments property — cannot play');
            this.logError(err.message, err);
            this._dispatchError(err);
            throw err;
        }

        if (!musicDNA.tempo && !musicDNA.config?.bpm) {
            const err = new Error('MusicDNA missing tempo and config.bpm — cannot determine BPM');
            this.logError(err.message, err);
            this._dispatchError(err);
            throw err;
        }
        this.currentTempo = musicDNA.tempo || musicDNA.config.bpm;
        this.log(`Using tempo: ${this.currentTempo} BPM`);

        this.log('Setting this.musicDNA to new value');
        this.musicDNA = musicDNA;
        this.log('✅ this.musicDNA set successfully');

        this._activeInstruments = musicDNA.instruments;
        this.log(`✅ Instruments from musicDNA: [${this._activeInstruments.join(', ')}]`);

        Tone.Transport.bpm.value = this.currentTempo;

        const effects = musicDNA.effects || [];
        this.log(`Effects from musicDNA:`, effects);
        this.disposeEffects();

        const mood = musicDNA.mood;
        if (mood) {
            this.applyMoodToEffects(mood, effects);
        }

        try {
            this.createEffectChain(effects);
        } catch (err) {
            this.logError('Failed to create effect chain:', err);
            this._dispatchError(err);
            throw err;
        }

        // FIX 1: Transport reset ที่ถูกต้อง
        // cancel() ก่อน stop() เพื่อล้าง scheduled events ก่อน Transport หยุด
        // position=0 แทน seconds=0 (seconds=0 ไม่ทำงานใน Tone.js v14+)
        Tone.Transport.cancel();
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        this.log('v6.7.2: Transport reset → position=0');
        this.isPlaying = false;

        this.clearScheduledEvents();
        this.disposeInstrumentSynths();
        this._stopAllNatureSounds();

        this.log('Starting scheduleMusicEvents...');
        this.scheduleMusicEvents();
        this.log('scheduleMusicEvents completed');

        this.log('Starting scheduleNatureEffects...');
        this.scheduleNatureEffects();
        this.log('scheduleNatureEffects completed');

        this.setLoopEnabled(true);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('musicDNAUpdated', musicDNA);
        }

        this._dispatchPlaybackState();
    }

    applyMoodToEffects(mood, effects) {
        verifyFunctionApproval('applyMoodToEffects');
        this.log(`Applying mood: ${mood}`);
        const moodMap = {
            'peaceful': { reverb: { decay: 3.5, wet: 0.45 }, filter: { frequency: 900, type: 'lowpass' } }, // v6.9.1: wet 0.65→0.45 prevents reverb sum clip
            'energetic': { distortion: 0.3, compressor: { threshold: -15, ratio: 5 } },
            'melancholic': { reverb: { decay: 4, wet: 0.7 }, chorus: { frequency: 0.5, depth: 0.8 } },
            'joyful': { delay: { delayTime: 0.25, feedback: 0.3 }, reverb: { decay: 2, wet: 0.4 } },
            'mysterious': { phaser: { frequency: 0.2, octaves: 2 }, reverb: { decay: 5, wet: 0.8 } }
        };
        const moodConfig = moodMap[mood.toLowerCase()];
        if (!moodConfig) {
            this.logWarning(`No configuration for mood: ${mood}`);
            return;
        }
        if (moodConfig.reverb) {
            const reverbIndex = effects.findIndex(e => e.toLowerCase().includes('reverb'));
            if (reverbIndex !== -1) {
                this._moodReverbParams = moodConfig.reverb;
            } else {
                effects.push('reverb');
                this._moodReverbParams = moodConfig.reverb;
            }
        }
        if (moodConfig.filter) {
            const filterIndex = effects.findIndex(e => e.toLowerCase().includes('filter'));
            if (filterIndex !== -1) {
                this._moodFilterParams = moodConfig.filter;
            } else {
                effects.push('filter');
                this._moodFilterParams = moodConfig.filter;
            }
        }
    }

    // ========== FIX 2: handleCombinedDNA — tag notes ด้วย _sectionIndex ==========
    // แทนที่จะ match section ด้วย time (ซึ่งผิดเพราะ Melody2 ก็ใช้ relative time เหมือนกัน)
    // tag แต่ละ note ด้วย _sectionIndex: 0 (Melody1) หรือ 1 (Melody2) ตั้งแต่ตอน merge
    handleCombinedDNA(defaultDNA, customDNA) {
        verifyFunctionApproval('handleCombinedDNA');
        this.log('handleCombinedDNA: merging Default + Custom sequences');

        this._defaultDNA = defaultDNA;
        this._customDNA = customDNA;

        this.log('defaultDNA:', {
            hasSequence: !!defaultDNA?.sequence,
            seqLength: defaultDNA?.sequence?.length,
            instruments: defaultDNA?.instruments
        });
        this.log('customDNA:', {
            hasSequence: !!customDNA?.sequence,
            seqLength: customDNA?.sequence?.length,
            instruments: customDNA?.instruments
        });

        if (!defaultDNA?.sequence || !customDNA?.sequence) {
            const err = new Error('handleCombinedDNA: missing sequence in defaultDNA or customDNA');
            this.logError(err.message, err);
            this._dispatchError(err);
            throw err;
        }

        try {
            const dnaBPM = defaultDNA.config?.bpm || defaultDNA.tempo;
            if (dnaBPM) {
                Tone.Transport.bpm.value = dnaBPM;
                this.log(`[handleCombinedDNA] Set BPM to ${dnaBPM} before time calculation`);
            }

            const lastDefault = defaultDNA.sequence[defaultDNA.sequence.length - 1];
            if (!lastDefault.time) throw new Error(`lastDefault.time missing: ${JSON.stringify(lastDefault)}`);

            let lastTimeSec, lastDurSec;
            try {
                lastTimeSec = Tone.Time(lastDefault.time).toSeconds();
                lastDurSec = lastDefault.duration ? Tone.Time(lastDefault.duration).toSeconds() : 0;
            } catch (e) {
                throw new Error(`Tone.Time conversion failed: ${e.message}`);
            }

            const defaultEndSec = lastTimeSec + lastDurSec;
            let defaultEndTime;
            try {
                defaultEndTime = Tone.Time(defaultEndSec).toBarsBeatsSixteenths();
            } catch (e) {
                throw new Error(`Failed to convert defaultEndSec to musical time: ${e.message}`);
            }

            this.log(`defaultEndTime calculated: ${defaultEndTime} (from ${lastTimeSec}s + ${lastDurSec}s)`);

            // Combine natureEffects (shifted by defaultEndSec)
            let combinedNature = [...(defaultDNA.natureEffects || [])];
            if (customDNA.natureEffects && customDNA.natureEffects.length > 0) {
                const shiftedCustom = customDNA.natureEffects.map(effect => {
                    let timecode = effect.timecode || '0:0';
                    let startSec, endSec = null;
                    if (typeof timecode === 'string' && timecode.includes('-')) {
                        const [s, e] = timecode.split('-');
                        startSec = Tone.Time(s).toSeconds();
                        endSec = Tone.Time(e).toSeconds();
                    } else {
                        startSec = Tone.Time(timecode).toSeconds();
                    }
                    const newStartSec = startSec + defaultEndSec;
                    const newEndSec = endSec ? endSec + defaultEndSec : null;
                    const newTimecode = newEndSec
                        ? `${Tone.Time(newStartSec).toBarsBeatsSixteenths()}-${Tone.Time(newEndSec).toBarsBeatsSixteenths()}`
                        : Tone.Time(newStartSec).toBarsBeatsSixteenths();
                    return { ...effect, timecode: newTimecode };
                });
                combinedNature = [...combinedNature, ...shiftedCustom];
            }

            // FIX 2: tag ด้วย _sectionIndex แทน time-based matching
            const defaultNotes = defaultDNA.sequence.map(note => ({
                ...note,
                _sectionIndex: 0  // Melody1
            }));

            // v6.9.2 FIX 4: เพิ่ม inter-section gap 0.3s
            // ให้ Melody1 instruments (โดยเฉพาะ chimes) fade ออกก่อน Melody2 attack
            // chimes release=0.6s, last note overlap ~0.1s → gap 0.3s = fully clear
            const INTER_SECTION_GAP_SEC = 0.3;

            const customSeq = customDNA.sequence.map(note => {
                if (!note.time) throw new Error(`customDNA note missing time: ${JSON.stringify(note)}`);
                let noteTimeSec, newTimeSec;
                try {
                    noteTimeSec = Tone.Time(note.time).toSeconds();
                    newTimeSec = noteTimeSec + defaultEndSec + INTER_SECTION_GAP_SEC;
                } catch (e) {
                    throw new Error(`Tone.Time conversion failed for custom note: ${e.message}`);
                }
                return {
                    ...note,
                    time: Tone.Time(newTimeSec).toBarsBeatsSixteenths(),
                    _sectionIndex: 1  // Melody2
                };
            });

                        // v6.9.3: extend last notes of Melody1 for smooth M1→M2 transition
            const extendedDefaultNotes = this._extendLastNotes(defaultNotes, defaultEndSec, dnaBPM);

            // v6.9.4: extend last notes of Melody2 for smooth M2→M1 (loop back) transition
            // loopEndSec = last customSeq note time (already shifted by defaultEndSec + GAP)
            const lastCustomNote = customSeq[customSeq.length - 1];
            const loopEndSec = lastCustomNote
                ? Tone.Time(lastCustomNote.time).toSeconds() + Tone.Time(lastCustomNote.duration || '4n').toSeconds()
                : defaultEndSec * 2;
            const extendedCustomSeq = this._extendLastNotes(customSeq, loopEndSec, dnaBPM);

            this.log(`v`+ window.MusicAudio_VERSION + `: Combined ${extendedDefaultNotes.length} Melody1 notes (section 0) + ${extendedCustomSeq.length} Melody2 notes (section 1)`);
            this.log(`v`+ window.MusicAudio_VERSION + `: Section[0] instruments: [${defaultDNA.instruments.join(', ')}]`);
            this.log(`v`+ window.MusicAudio_VERSION + `: Section[1] instruments: [${customDNA.instruments.join(', ')}]`);

            const combinedSequence = [...(typeof extendedDefaultNotes !== 'undefined' ? extendedDefaultNotes : defaultNotes), ...(typeof extendedCustomSeq !== 'undefined' ? extendedCustomSeq : customSeq)];
            const combinedDNA = {
                ...defaultDNA,
                sequence: combinedSequence,
                natureEffects: combinedNature,
                instruments: defaultDNA.instruments,
                effects: defaultDNA.effects || [],
                mood: defaultDNA.mood,
                _customDNA: customDNA,
                _sections: [
                    { startTime: 0, endTime: defaultEndSec, instruments: defaultDNA.instruments, effects: defaultDNA.effects || [] },
                    { startTime: defaultEndSec, endTime: null, instruments: customDNA.instruments, effects: customDNA.effects || [] }
                ]
            };

            window.dispatchEvent(new CustomEvent('musicDNACombined', {
                detail: { defaultDNA, customDNA, combinedDNA },
                bubbles: true
            }));

            this.log('Calling handleMusicDNAGenerated with combinedDNA');
            this.handleMusicDNAGenerated(combinedDNA);
        } catch (err) {
            this.logError('Error in handleCombinedDNA:', err);
            this._dispatchError(err);
            throw err;
        }
    }

    _dispatchError(error) {
        window.dispatchEvent(new CustomEvent('musicAudioError', {
            detail: { message: error.message, error },
            bubbles: true
        }));
    }

    _dispatchPlaybackState() {
        const state = {
            isPlaying: this.isPlaying,
            tempo: this.currentTempo,
            musicDNA: !!this.musicDNA,
            instruments: this._activeInstruments,
            scheduledEvents: this.scheduledEvents.size
        };
        window.dispatchEvent(new CustomEvent('playbackStateDetailed', {
            detail: state,
            bubbles: true
        }));
    }

    buildSynthFromInstrument(instrumentName, forChord = false) {
        verifyFunctionApproval('buildSynthFromInstrument');

        const name = (instrumentName || '').toLowerCase().trim();
        if (!name) {
            throw new Error('[MusicAudio] Instrument name is empty');
        }

        const camelName = name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        let config;

        if (forChord) {
            config = INSTRUMENT_CHORD_CONFIG[camelName] || INSTRUMENT_CHORD_CONFIG[name];
            if (!config) {
                config = INSTRUMENT_SYNTH_CONFIG[camelName] || INSTRUMENT_SYNTH_CONFIG[name];
            }
        } else {
            config = INSTRUMENT_SYNTH_CONFIG[camelName] || INSTRUMENT_SYNTH_CONFIG[name];
        }

        if (!config) {
            throw new Error(`[MusicAudio] Unknown instrument "${instrumentName}" - no mapping available (No Fallback)`);
        }

        this.log(`Building Synth for instrument: ${instrumentName} → oscillator.type=${config.oscillator.type}`);
        return config;
    }

    // ========== FIX 3: Synth cache key ใส่ sectionIndex ==========
    // เพื่อป้องกัน instrument ที่ซ้ำกันข้าม section (เช่น strings ทั้ง Melody1 + Melody2)
    // share synth เดียวกัน → voice collision → เสียงขาด/หาย
    getOrCreateInstrumentSynth(instrumentName, forChord = false, sectionIndex = 0) {
        verifyFunctionApproval('getOrCreateInstrumentSynth');
        // FIX 3: เพิ่ม sectionIndex ใน key
        const key = `${instrumentName}_${forChord ? 'chord' : 'melody'}_s${sectionIndex}`;

        if (this.instrumentSynths[key]) {
            return this.instrumentSynths[key];
        }

        const config = this.buildSynthFromInstrument(instrumentName, forChord);

        // v6.7.1: maxPolyphony ตาม CPU weight ของ instrument
        // fatsawtooth count=2 → heavy → จำกัดที่ 8 voices เพื่อป้องกัน AudioContext throttle
        // instruments อื่น → 16 voices ตามปกติ
        const HEAVY_INSTRUMENTS = new Set(['strings', 'cello', 'organ', 'pad', 'synthPad', 'synthpad', 'synth_pad', 'saxophone']);
        const maxPolyphony = HEAVY_INSTRUMENTS.has(instrumentName.toLowerCase()) ? 8 : 16;

        const synth = new Tone.PolySynth(Tone.Synth, {
            ...config,
            maxPolyphony
        });
        synth.connect(this.effectInput || Tone.Destination);
        this.instrumentSynths[key] = synth;
        this.log(`Created and cached Synth for instrument: ${instrumentName} (maxPolyphony=${maxPolyphony}, section=${sectionIndex})`);
        return synth;
    }

    disposeInstrumentSynths() {
        verifyFunctionApproval('disposeInstrumentSynths');
        this.log('Disposing all instrument synths');
        Object.values(this.instrumentSynths).forEach(synth => {
            try {
                synth.disconnect();
                synth.dispose();
            } catch (e) {
                this.logWarning('Error disposing synth: ' + e.message);
            }
        });
        this.instrumentSynths = {};
    }

    // ========== Effect Chain ==========
    createEffectChain(effects) {
        verifyFunctionApproval('createEffectChain');
        this.log(`Creating effect chain with: ${effects.join(', ')}`);

        if (!effects || effects.length === 0) {
            this.log('No effects, connecting synths directly to destination');
            this.effectInput = Tone.Destination;
            return;
        }

        // v6.9.1: เพิ่ม compressor ต้น chain เสมอ เพื่อควบคุม peak ก่อนส่งต่อ
        // threshold=-18dB, ratio=4 → ลด peak burst จาก 3 instruments overlap
        const compressor = new Tone.Compressor({
            threshold: -18,
            ratio: 4,
            attack: 0.003,
            release: 0.40, // v6.9.2: longer release holds gain reduction across M1→M2 transition
            knee: 6
        });
        const nodes = [compressor];

        for (const effectType of effects) {
            try {
                let node;
                const lowerType = effectType.toLowerCase();
                switch (lowerType) {
                    case 'reverb':
                        // v6.9.1 BUG FIX: ลบ .toDestination() ออก
                        // เดิม .toDestination() ทำให้ reverb bypass Limiter!
                        node = new Tone.Reverb({
                            decay: this._moodReverbParams?.decay || 2.5,
                            wet: this._moodReverbParams?.wet || 0.4
                        });
                        break;
                    case 'delay':
                        // v6.9.1 BUG FIX: ลบ .toDestination() ออก
                        node = new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.3, wet: 0.25 });
                        break;
                    case 'chorus':
                        node = new Tone.Chorus({ frequency: 1.5, delayTime: 2.5, depth: 0.5, wet: 0.4 }).start();
                        break;
                    case 'eq':
                        // v6.9.1: low boost 6→0 (ลด mud ที่ทำให้เสียงหนาและแตก)
                        node = new Tone.EQ3({ low: 0, mid: -2, high: 1 });
                        break;
                    case 'filter':
                        node = new Tone.Filter(
                            this._moodFilterParams?.frequency || 1000,
                            this._moodFilterParams?.type || 'lowpass'
                        );
                        break;
                    case 'compressor':
                        // ถ้า DNA ส่ง compressor มาเพิ่มเติม ให้ skip เพราะเรามีแล้ว
                        this.log('Compressor already in chain (v'+ window.MusicAudio_VERSION + '), skipping duplicate');
                        continue;
                    case 'distortion':
                        node = new Tone.Distortion({ distortion: 0.4 });
                        break;
                    case 'phaser':
                        node = new Tone.Phaser({ frequency: 1, octaves: 3, baseFrequency: 500 });
                        break;
                    case 'tremolo':
                        node = new Tone.Tremolo({ frequency: 4, depth: 0.5, wet: 0.7 }).start();
                        break;
                    default:
                        throw new Error(`Unknown effect type: ${effectType}`);
                }
                if (node) nodes.push(node);
            } catch (e) {
                throw new Error(`Failed to create effect node for ${effectType}: ${e.message}`);
            }
        }

        if (nodes.length === 0) {
            this.effectInput = Tone.Destination;
            return;
        }

        // v6.9.1: chain ทุก node ต่อกัน (ไม่มีใครใช้ .toDestination() แล้ว)
        for (let i = 0; i < nodes.length; i++) {
            if (i === 0) {
                this.effectInput = nodes[i];
            } else {
                nodes[i-1].connect(nodes[i]);
            }
            this.effectNodes.push(nodes[i]);
        }

        // Limiter อยู่ท้ายสุด → ควบคุมทุก signal รวมถึง reverb tail
        const limiter = new Tone.Limiter(-3).toDestination();
        nodes[nodes.length-1].connect(limiter);
        this.effectNodes.push(limiter);
        this.log('v'+ window.MusicAudio_VERSION + ': Effect chain: Compressor → [effects] → Limiter(-3dB) → Destination');
        this.log(`Effect chain created with ${nodes.length} nodes`);
    }

    disposeEffects() {
        verifyFunctionApproval('disposeEffects');
        this.log('Disposing effect nodes');
        this.effectNodes.forEach(node => {
            try {
                node.disconnect();
                node.dispose();
            } catch (e) {
                this.logWarning('Error disposing effect node: ' + e.message);
            }
        });
        this.effectNodes = [];
        this.effectInput = Tone.Destination;
        this._moodReverbParams = null;
        this._moodFilterParams = null;
    }

    // ========== Music Event Scheduling ==========
    scheduleMusicEvents() {
        verifyFunctionApproval('scheduleMusicEvents');
        this.log('scheduleMusicEvents started');
        if (!this.musicDNA) {
            throw new Error('scheduleMusicEvents: musicDNA is null');
        }

        let notes = this.musicDNA.sequence || this.musicDNA.melody || [];
        let chords = this.musicDNA.chords || [];

        this.log(`Notes array length: ${notes.length}, Chords array length: ${chords.length}`);

        if (notes.length === 0 && chords.length === 0) {
            const err = new Error('MusicDNA has no notes or chords to schedule');
            this.logError(err.message, err);
            this._dispatchError(err);
            throw err;
        }

        if (notes.length > 0) {
            const partEvents = notes.map((noteEvent) => {
                if (typeof noteEvent === 'string') {
                    noteEvent = { note: noteEvent, duration: '8n', time: 0 };
                }
                if (noteEvent.time === undefined || noteEvent.time === null) {
                    throw new Error(`Note missing time: ${JSON.stringify(noteEvent)}`);
                }
                return [noteEvent.time, noteEvent];
            });

            // FIX 6: stop ก่อน dispose
            if (this._activePart) {
                try {
                    this._activePart.stop();
                    this._activePart.dispose();
                } catch(e) {
                    this.logWarning('Error disposing Part: ' + e.message);
                }
                this._activePart = null;
            }

            let lastTime = 0;
            const lastNote = notes[notes.length - 1];
            if (!lastNote.duration) {
                throw new Error(`Last note missing duration: ${JSON.stringify(lastNote)}`);
            }
            lastTime = Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds();
            this._sequenceDuration = lastTime + 2; // 2s buffer

            try {
                const part = new Tone.Part((time, noteEvent) => {
                    this.playMelodyNote(noteEvent, time);
                }, partEvents);

                part.loop = this._loopEnabled;
                if (this._loopEnabled) {
                    part.loopEnd = this._sequenceDuration;
                    this.log(`Part loop ON, loopEnd=${this._sequenceDuration}s`);
                }

                part.start(0);
                this._activePart = part;
                this.scheduledEvents.set('melody_part', part);
                this.log(`Scheduled melody Part with ${partEvents.length} events (loop=${this._loopEnabled})`);

                // v6.9.2 FIX 1: Pre-warm ALL synths ก่อนเริ่มเล่น
                // เดิม synths สร้าง lazy (ตอน note trigger) → CPU spike → glitch
                // ใหม่: สร้างทั้งหมดตอนนี้เลย → note trigger ไม่ต้อง create ใหม่
                this._prewarmSynths();
            } catch (err) {
                this.logError('Error creating Tone.Part:', err);
                throw new Error(`Failed to schedule melody part: ${err.message}`);
            }
        }

        if (chords.length > 0) {
            chords.forEach((chordEvent, idx) => {
                if (!chordEvent.time) {
                    throw new Error(`Chord missing time: ${JSON.stringify(chordEvent)}`);
                }
                const eventId = `chord_${idx}`;
                const ev = Tone.Transport.schedule((time) => {
                    this.playChord(chordEvent, time);
                }, chordEvent.time);
                this.scheduledEvents.set(eventId, ev);
            });
        }

        this.log(`Scheduled ${this.scheduledEvents.size} music events`);
        this._dispatchPlaybackState();
    }

    setLoopEnabled(enabled) {
        verifyFunctionApproval('setLoopEnabled');
        this._loopEnabled = enabled;

        if (this._activePart) {
            this._activePart.loop = enabled;
            if (enabled && this._sequenceDuration) {
                this._activePart.loopEnd = this._sequenceDuration;
            }
        }

        if (typeof Tone !== 'undefined' && Tone.Transport) {
            Tone.Transport.loop = enabled;
            if (enabled && this._sequenceDuration) {
                Tone.Transport.loopStart = 0;
                Tone.Transport.loopEnd = this._sequenceDuration;
            }
        }

        this.log(`Loop mode ${enabled ? 'ON' : 'OFF'} (sequenceDuration=${this._sequenceDuration}s)`);
    }

    // ========== Nature Effects ==========
    scheduleNatureEffects() {
        verifyFunctionApproval('scheduleNatureEffects');
        this.log('scheduleNatureEffects started');
        const natureEffects = this.musicDNA?.natureEffects || [];
        if (natureEffects.length === 0) {
            this.log('No natureEffects to schedule');
            return;
        }

        this.log(`Found ${natureEffects.length} nature effects to schedule`);
        natureEffects.forEach((effect, idx) => {
            const effectKey = `nature_effect_${idx}`;
            let timecode = effect.timecode || `${idx}:0`;

            if (typeof timecode === 'string' && timecode.includes('-')) {
                timecode = timecode.split('-')[0];
            }

            let time;
            try {
                time = Tone.Time(timecode).toSeconds();
            } catch (err) {
                this.logError(`Invalid timecode "${timecode}" for nature effect ${idx}, using default`, err);
                time = Tone.Time(`${idx}:0`).toSeconds();
            }

            const ev = Tone.Transport.schedule((time) => {
                try {
                    this.playNatureEffectFromObject(effect, time, effectKey);
                } catch (err) {
                    this.logError(`Failed to play nature effect at ${time}:`, err);
                }
            }, time);
            this.scheduledEvents.set(effectKey, ev);

            if (effect.duration) {
                const stopEv = Tone.Transport.schedule((time) => {
                    try {
                        this.stopNatureEffect(effectKey, time);
                    } catch (err) {
                        this.logError(`Failed to stop nature effect at ${time}:`, err);
                    }
                }, time + effect.duration);
                this.scheduledEvents.set(`${effectKey}_stop`, stopEv);
            }
        });
        this.log('scheduleNatureEffects completed');
    }

    _stopAllNatureSounds() {
        this.log('Stopping all nature sounds');
        this._natureGeneration++;
        this.activeNatureSounds.forEach((sound, key) => {
            this.log(`Stopping nature sound: ${key}`);
            try { sound.stop(); } catch(e) {}
        });
        this.activeNatureSounds.clear();
    }

    async playNatureEffectFromObject(effect, time, effectKey) {
        verifyFunctionApproval('playNatureEffectFromObject');
        if (!effect || !effect.type) {
            throw new Error('Invalid nature effect object');
        }

        const { type, element, intensity, duration } = effect;

        if (intensity === undefined || intensity === null) {
            throw new Error('natureEffect missing intensity');
        }

        if (!window.NatureSounds) {
            throw new Error('NatureSounds module not loaded');
        }

        const myGeneration = this._natureGeneration;

        const existingSound = this.activeNatureSounds.get(effectKey);
        if (existingSound) {
            this.log(`Stopping existing sound for key ${effectKey} before re-trigger (loop)`);
            try { existingSound.stop(); } catch(e) {}
        }

        const placeholder = { stop: () => {} };
        this.activeNatureSounds.set(effectKey, placeholder);

        try {
            const soundControl = await window.NatureSounds.create(
                type,
                intensity,
                time,
                duration,
                this.effectInput || Tone.Destination
            );

            if (!soundControl) {
                this.activeNatureSounds.delete(effectKey);
                this.logWarning(`Unknown nature effect type "${type}" — skipped`);
                return;
            }

            if (this._natureGeneration !== myGeneration || !this.isPlaying) {
                this.log(`Playback stopped during load for ${effectKey} (gen ${myGeneration} vs ${this._natureGeneration}), stopping sound now`);
                try { soundControl.stop(); } catch(e) {}
                this.activeNatureSounds.delete(effectKey);
                return;
            }

            const currentHolder = this.activeNatureSounds.get(effectKey);
            if (currentHolder && currentHolder !== placeholder) {
                this.log(`Key ${effectKey} was replaced during await — discarding this soundControl`);
                try { soundControl.stop(); } catch(e) {}
                return;
            }

            this.activeNatureSounds.set(effectKey, soundControl);
            this.log(`✅ Nature effect triggered: ${type} (element: ${element}) at ${time}, intensity=${intensity}, key=${effectKey}`);
        } catch (err) {
            this.activeNatureSounds.delete(effectKey);
            this.logError(`Failed to create nature effect ${type}:`, err);
        }
    }

    stopNatureEffect(effectKey, time) {
        verifyFunctionApproval('stopNatureEffect');
        this.log(`stopNatureEffect called for ${effectKey} at ${time}`);
        const sound = this.activeNatureSounds.get(effectKey);
        if (sound) {
            sound.stop();
            this.activeNatureSounds.delete(effectKey);
            this.log(`✅ Nature effect stopped: ${effectKey}`);
        }
    }

    playNatureLayer(preset) {
        verifyFunctionApproval('playNatureLayer');
        this.logWarning('playNatureLayer is deprecated - use individual natureEffects instead');
    }

    // ========== Melody and Chord ==========
    playMelodyNote(noteEvent, time) {
        verifyFunctionApproval('playMelodyNote');
        if (!noteEvent?.note) return;

        // FIX 5: skip เฉพาะ duration="0n" เท่านั้น (ป้องกัน limiter spike)
        // ไม่ skip isDisturbance===true ทั้งหมด เพราะ disturbance notes อาจมี duration ถูกต้อง
        if (noteEvent.duration === '0n') {
            this.log(`Skipping zero-duration note ${noteEvent.note} (spike prevention)`);
            return;
        }

        try {
            // FIX 2: ใช้ _sectionIndex แทน time-based section lookup
            let instrumentsToPlay = this._activeInstruments;
            if (this.musicDNA?._sections?.length > 0 && noteEvent._sectionIndex !== undefined) {
                const section = this.musicDNA._sections[noteEvent._sectionIndex];
                if (section?.instruments) {
                    instrumentsToPlay = section.instruments;
                }
            } else if (this.musicDNA?._sections?.length > 0) {
                // fallback: time-based (สำหรับ note ที่ไม่มี _sectionIndex)
                const noteTimeSec = Tone.Time(noteEvent.time).toSeconds();
                const section = this.musicDNA._sections.find(s => {
                    const startSec = s.startTime;
                    const endSec = s.endTime ?? Infinity;
                    return noteTimeSec >= startSec && noteTimeSec < endSec;
                });
                if (section?.instruments) {
                    instrumentsToPlay = section.instruments;
                }
            }

            let baseNote = noteEvent.note;
            if (!baseNote.match(/\d/)) {
                throw new Error(`Note "${baseNote}" missing octave`);
            }

            if (!noteEvent.duration) {
                throw new Error(`Note missing duration: ${JSON.stringify(noteEvent)}`);
            }

            // FIX 4: dynamic stagger per BPM
            const delays = this._computeInstrumentDelays(this.musicDNA?.config?.bpm || this.currentTempo);

            instrumentsToPlay.forEach((instName, idx) => {
                try {
                    let note = baseNote;
                    if (idx === 1) {
                        note = Tone.Frequency(baseNote).transpose(12).toNote();
                    } else if (idx === 2) {
                        note = Tone.Frequency(baseNote).transpose(-12).toNote();
                    }

                    const playTime = idx > 0 ? time + (delays[idx] || 0) : time;

                    // FIX 3: ส่ง sectionIndex ไปด้วยเพื่อ isolate synth per section
                    const synth = this.getOrCreateInstrumentSynth(instName, false, noteEvent._sectionIndex || 0);

                    // v6.9.1: volume map ใหม่ — ทุกตัวต่ำกว่า 0dBFS
                    // เดิม idx=2 = gainToDb(1.2) = +1.58dB → clip!
                    // ใหม่: [0.70, 0.75, 0.65] → [-3.1, -2.5, -3.7 dBFS]
                    // แต่ละ instrument มี headroom พอก่อนถึง Compressor/Limiter
                    if (idx === 0) {
                        synth.volume.value = Tone.gainToDb(0.70); // -3.1 dBFS
                    } else if (idx === 1) {
                        synth.volume.value = Tone.gainToDb(0.75); // -2.5 dBFS
                    } else if (idx === 2) {
                        synth.volume.value = Tone.gainToDb(0.65); // -3.7 dBFS (chimes: fmsine → ลดพิเศษ)
                    }

                    synth.triggerAttackRelease(note, noteEvent.duration, playTime);
                    this.log(`Playing note ${note} on ${instName} at ${playTime} (original ${time})`);
                } catch (innerErr) {
                    this.logError(`Instrument error for ${instName}:`, innerErr);
                }
            });

            const playNoteEl = document.getElementById('playNote');
            if (playNoteEl) {
                playNoteEl.textContent = `🎵 ${baseNote}`;
            }

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('musicNotePlayed', {
                    note: baseNote,
                    time,
                    duration: noteEvent.duration,
                    frequency: Tone.Frequency(baseNote).toFrequency(),
                    instruments: instrumentsToPlay
                });
            }
        } catch (err) {
            this.logError('Error playing melody note', err);
            this._dispatchError(err);
            throw err;
        }
    }

    playChord(chordEvent, time) {
        verifyFunctionApproval('playChord');
        if (!chordEvent?.notes) return;

        try {
            const instrumentsToPlay = this._activeInstruments;

            if (!chordEvent.duration) {
                throw new Error(`Chord missing duration: ${JSON.stringify(chordEvent)}`);
            }

            if (chordEvent.volume === undefined || chordEvent.volume === null) {
                throw new Error(`Chord missing volume: ${JSON.stringify(chordEvent)}`);
            }

            // FIX 4: dynamic stagger for chords too
            const delays = this._computeInstrumentDelays(this.musicDNA?.config?.bpm || this.currentTempo);

            instrumentsToPlay.forEach((instName, idx) => {
                try {
                    const instrumentName = chordEvent.instrument || instName;
                    let notes = chordEvent.notes;
                    if (Array.isArray(notes)) {
                        if (idx === 1) {
                            notes = notes.map(n => Tone.Frequency(n).transpose(12).toNote());
                        } else if (idx === 2) {
                            notes = notes.map(n => Tone.Frequency(n).transpose(-12).toNote());
                        }
                    }

                    const playTime = idx > 0 ? time + (delays[idx] || 0) : time;

                    const synth = this.getOrCreateInstrumentSynth(instrumentName, true, 0);
                    synth.volume.value = Tone.gainToDb(chordEvent.volume);
                    synth.triggerAttackRelease(notes, chordEvent.duration, playTime);
                    this.log(`Playing chord on ${instrumentName} at ${playTime} (original ${time})`);
                } catch (innerErr) {
                    this.logError(`Instrument error for ${instName}:`, innerErr);
                }
            });

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('chordPlayed', {
                    notes: chordEvent.notes,
                    time,
                    duration: chordEvent.duration,
                    instruments: instrumentsToPlay
                });
            }
        } catch (err) {
            this.logError('Error playing chord', err);
            this._dispatchError(err);
            throw err;
        }
    }

    // ========== PLAYBACK CONTROL ==========
    togglePlayback() {
        verifyFunctionApproval('togglePlayback');
        this.log(`togglePlayback called, initialized=${this.initialized}, isPlaying=${this.isPlaying}`);
        if (!this.initialized) {
            this.logWarning('Audio not initialized yet');
            return;
        }
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        verifyFunctionApproval('play');
        this.log(`play() called, isPlaying=${this.isPlaying}, musicDNA=`, this.musicDNA);
        if (this.isPlaying) return;
        if (!this.musicDNA) {
            const err = new Error('No MusicDNA loaded. Generate music first.');
            this.logError(err.message, err);
            this._dispatchError(err);
            return;
        }

        if (Tone.Destination.volume.value === -Infinity) {
            this.log('Destination volume was -Infinity, resetting to 0');
            Tone.Destination.volume.value = 0;
        }

        const startPlayback = () => {
            try {
                Tone.Transport.start();
                this.isPlaying = true;
                this.log('Playback started');

                const icon = document.getElementById('playIcon');
                if (icon) icon.className = 'fas fa-pause';

                window.dispatchEvent(new CustomEvent('musicStarted', {
                    detail: {
                        dna: this.musicDNA,
                        defaultDNA: this._defaultDNA || null,
                        customDNA: this._customDNA || null,
                        isPlaying: true
                    },
                    bubbles: true
                }));
                window.dispatchEvent(new CustomEvent('playbackStateChanged', {
                    detail: { isPlaying: true },
                    bubbles: true
                }));
                this._dispatchPlaybackState();

                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('playbackStarted');
                    EventBus.emit('playbackStateChanged', { isPlaying: true });
                }
            } catch (err) {
                this.handleError('Failed to start playback', err);
                this._dispatchError(err);
            }
        };

        if (Tone.context.state !== 'running') {
            Tone.start().then(() => {
                this.log('Tone context started by play()');
                startPlayback();
            }).catch(err => {
                this.logError('Failed to start Tone context', err);
                this._dispatchError(err);
            });
        } else {
            startPlayback();
        }
    }

    pause() {
        verifyFunctionApproval('pause');
        this.log(`pause() called, isPlaying=${this.isPlaying}`);
        if (!this.isPlaying) return;
        try {
            Tone.Transport.pause();
            this._stopAllNatureSounds();

            this.scheduledEvents.forEach((ev, key) => {
                if (key.startsWith('nature_') && typeof ev === 'number') {
                    Tone.Transport.clear(ev);
                    this.scheduledEvents.delete(key);
                }
            });

            this.isPlaying = false;
            this.transportPosition = Tone.Transport.seconds;

            const icon = document.getElementById('playIcon');
            if (icon) icon.className = 'fas fa-play';

            if (window.StateManager) {
                StateManager.set('playback.isPlaying', false);
                StateManager.set('playback.position', this.transportPosition);
            }
            this._dispatchPlaybackState();
            window.dispatchEvent(new CustomEvent('playbackStateChanged', {
                detail: { isPlaying: false },
                bubbles: true
            }));
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('playbackPaused', { position: this.transportPosition });
                EventBus.emit('playbackStateChanged', { isPlaying: false });
            }
            
            // กระจาย Event ออกไป (ส่งสัญญาณ)
            window.dispatchEvent(new CustomEvent('music-stopped-event')); 

            this.log('Playback paused');
        } catch (err) {
            this.handleError('Failed to pause playback', err);
        }
    }

    stop() {
        verifyFunctionApproval('stop');
        this.log(`stop() called, isPlaying=${this.isPlaying}`);
        try {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            this.isPlaying = false;
            this.transportPosition = 0;
            this.clearScheduledEvents();

            const icon = document.getElementById('playIcon');
            if (icon) icon.className = 'fas fa-play';

            this._stopAllNatureSounds();
            this.disposeInstrumentSynths();

            window.dispatchEvent(new CustomEvent('musicStopped', {
                detail: {},
                bubbles: true
            }));
            this._dispatchPlaybackState();

            if (window.StateManager) {
                StateManager.set('playback.isPlaying', false);
                StateManager.set('playback.position', 0);
            }
            window.dispatchEvent(new CustomEvent('playbackStateChanged', {
                detail: { isPlaying: false },
                bubbles: true
            }));
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('playbackStopped');
                EventBus.emit('playbackStateChanged', { isPlaying: false });
            }
            
            // กระจาย Event ออกไป (ส่งสัญญาณ)
            window.dispatchEvent(new CustomEvent('music-stopped-event')); 

            this.log('Playback stopped');
            
        } catch (err) {
            this.handleError('Failed to stop playback', err);
        }
    }

    changeTempo(newTempo) {
        verifyFunctionApproval('changeTempo');
        if (newTempo < 40 || newTempo > 200) {
            this.logWarning(`Invalid tempo: ${newTempo}. Must be 40-200 BPM`);
            return;
        }
        this.currentTempo = newTempo;
        Tone.Transport.bpm.value = newTempo;
        if (window.StateManager) StateManager.set('playback.tempo', newTempo);
        if (typeof EventBus !== 'undefined') EventBus.emit('tempoChanged', newTempo);
        this.log(`Tempo changed to ${newTempo} BPM`);
    }

    setMasterVolume(volume) {
        verifyFunctionApproval('setMasterVolume');
        const clamped = Math.max(0, Math.min(1, volume));
        Tone.Destination.volume.rampTo(Tone.gainToDb(clamped), 0.1);
        if (window.StateManager) StateManager.set('audio.volume', clamped);
        this.log(`Master volume set to ${clamped}`);
    }

    setMute(muted) {
        verifyFunctionApproval('setMute');
        Tone.Destination.mute = muted;
        if (window.StateManager) StateManager.set('audio.muted', muted);
        if (typeof EventBus !== 'undefined') EventBus.emit('audioMuted', muted);
        this.log(`Audio ${muted ? 'muted' : 'unmuted'}`);
    }

    // FIX 6: clearScheduledEvents — stop ก่อน dispose ทุกครั้ง
    clearScheduledEvents() {
        verifyFunctionApproval('clearScheduledEvents');
        if (this._activePart) {
            try {
                this._activePart.stop();
                this._activePart.dispose();
            } catch (e) {
                this.logWarning('Error disposing Part: ' + e.message);
            }
            this._activePart = null;
        }
        Tone.Transport.cancel();
        this.scheduledEvents.clear();
        this.log('Cleared all scheduled events');
    }

    parseTimecode(tc) {
        verifyFunctionApproval('parseTimecode');
        if (!tc) throw new Error('Timecode is empty');
        try {
            const parts = tc.split('-');
            if (parts.length !== 2) throw new Error(`Invalid timecode format: ${tc}`);
            const parse = (t) => {
                const [m, s] = t.split(':').map(Number);
                if (isNaN(m) || isNaN(s)) throw new Error(`Invalid time part: ${t}`);
                return (m * 60) + (s || 0);
            };
            const start = parse(parts[0]);
            const end = parse(parts[1]);
            return { start, duration: end - start, startFormatted: parts[0], endFormatted: parts[1] };
        } catch (err) {
            this.logError('Error parsing timecode', err);
            throw new Error(`Failed to parse timecode: ${err.message}`);
        }
    }

    handleTransportStart(time) {
        verifyFunctionApproval('handleTransportStart');
        this.log(`Transport started at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportStarted', { time });
    }
    handleTransportStop(time) {
        verifyFunctionApproval('handleTransportStop');
        this.log(`Transport stopped at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportStopped', { time });
    }
    handleTransportPause(time) {
        verifyFunctionApproval('handleTransportPause');
        this.log(`Transport paused at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportPaused', { time });
    }
    handleTransportLoop(time) {
        verifyFunctionApproval('handleTransportLoop');
        this.log(`Transport looped at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportLooped', { time });
    }

    handleSynthCreated(data) {
        verifyFunctionApproval('handleSynthCreated');
        this.log(`Nature synth created: ${data.preset}`);
    }
    handleSynthDisposed(data) {
        verifyFunctionApproval('handleSynthDisposed');
        this.log(`Nature synth disposed: ${data.preset}`);
    }

    cleanup() {
        verifyFunctionApproval('cleanup');
        this.log('Cleaning up MusicAudio...');
        this.musicDNA = null;
        this.stop();
        this.clearScheduledEvents();
        this.disposeEffects();
        this.disposeInstrumentSynths();

        Tone.Transport.off('start');
        Tone.Transport.off('stop');
        Tone.Transport.off('pause');
        Tone.Transport.off('loop');

        if (this.unsubscribeMusicCurrent) {
            this.unsubscribeMusicCurrent();
            this.unsubscribeMusicCurrent = null;
        }

        this.isPlaying = false;
        this.initialized = false;

        if (typeof MemoryManager !== 'undefined') {
            MemoryManager.untrack(this);
        }

        this.log('MusicAudio cleanup complete');
    }

    getPlaybackState() {
        verifyFunctionApproval('getPlaybackState');
        return {
            isPlaying: this.isPlaying,
            tempo: this.currentTempo,
            position: Tone.Transport.seconds,
            progress: this.musicDNA ? (Tone.Transport.seconds / (3 * 60)) * 100 : 0,
            musicDNA: !!this.musicDNA,
            activeInstruments: this._activeInstruments,
            scheduledEvents: this.scheduledEvents.size
        };
    }
}

window.AudioController = new MusicAudio();
console.log("[MusicAudio] ✅ MUSIC-AUDIO.JS v'+  window.MusicAudio_VERSION + 'LOADED");
console.log("[MusicAudio] 📋 Approved Functions:", Object.keys(APPROVED_FUNCTIONS_MusicAudio));