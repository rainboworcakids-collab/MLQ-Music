// nature-sounds.js v2.0
// แก้ไข: Race condition ของ Tone.Player — สร้าง Player แยกต่อ interval สำหรับเสียงสัตว์ทุกตัว
console.log("[NatureSounds] 🎵 Nature Sounds Module v2.0 - LOADING...");

const NatureSounds = {

    // ─────────────────────────────────────────
    // BUFFER CACHE
    // ─────────────────────────────────────────
    buffers: {},

    async loadBuffer(url) {
        if (this.buffers[url]) return this.buffers[url];
        try {
            const buffer = await Tone.ToneAudioBuffer.fromUrl(url);
            this.buffers[url] = buffer;
            console.log(`[NatureSounds] ✅ Loaded: ${url}`);
            return buffer;
        } catch (err) {
            console.error(`[NatureSounds] ❌ Failed to load ${url}:`, err);
            throw err;
        }
    },

    // ─────────────────────────────────────────
    // CREATORS
    // ─────────────────────────────────────────
    creators: {

        // ══════════════════════════════════════
        // เสียงธรรมชาติ (สังเคราะห์)
        // ══════════════════════════════════════

        rain: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity * 0.4).connect(destination);
            const source = new Tone.Noise('pink');
            const filter = new Tone.Filter(2000, 'lowpass').connect(vol);
            source.connect(filter);
            source.start(time);
            if (duration) source.stop(time + duration);
            return {
                id: `rain_${Date.now()}`,
                stop: () => { source.stop(); source.dispose(); filter.dispose(); vol.dispose(); }
            };
        },

        wind: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity * 0.7).connect(destination);
            const source = new Tone.Noise('pink');
            const filter = new Tone.Filter(400, 'lowpass');
            const lfo    = new Tone.LFO(0.2, 300, 800).connect(filter.frequency);
            lfo.start();
            source.connect(filter).connect(vol);
            source.start(time);
            if (duration) source.stop(time + duration);
            return {
                id: `wind_${Date.now()}`,
                stop: () => { source.stop(); source.dispose(); filter.dispose(); lfo.stop().dispose(); vol.dispose(); }
            };
        },

        stream: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity * 0.4).connect(destination);
            const source = new Tone.Noise('brown');
            const filter = new Tone.Filter(600, 'bandpass').connect(vol);
            source.connect(filter);
            source.start(time);
            if (duration) source.stop(time + duration);
            return {
                id: `stream_${Date.now()}`,
                stop: () => { source.stop(); source.dispose(); filter.dispose(); vol.dispose(); }
            };
        },

        water_stream: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity * 0.4).connect(destination);
            const source = new Tone.Noise('brown');
            const filter = new Tone.Filter(800, 'bandpass').connect(vol);
            source.connect(filter);
            source.start(time);
            if (duration) source.stop(time + duration);
            return {
                id: `water_stream_${Date.now()}`,
                stop: () => { source.stop(); source.dispose(); filter.dispose(); vol.dispose(); }
            };
        },

        water_drip: (intensity, time, duration, destination) => {
            const vol      = new Tone.Gain(intensity * 0.3).connect(destination);
            const synth    = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
            }).connect(vol);
            const noise     = new Tone.Noise('brown').connect(vol);
            const noiseGain = new Tone.Gain(0.3).connect(vol);
            noise.connect(noiseGain);
            synth.triggerAttackRelease('C6', '16n', time);
            noise.start(time);
            if (duration) noise.stop(time + duration);
            return {
                id: `drip_${Date.now()}`,
                stop: () => { synth.dispose(); noise.dispose(); noiseGain.dispose(); vol.dispose(); }
            };
        },

        water_ocean: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity*0.4).connect(destination);
            const source = new Tone.Noise('brown');
            const filter = new Tone.Filter(400, 'lowpass');
            const lfo    = new Tone.LFO(0.1, 200, 800).connect(filter.frequency);
            lfo.start();
            source.connect(filter).connect(vol);
            source.start(time);
            if (duration) source.stop(time + duration);
            return {
                id: `ocean_${Date.now()}`,
                stop: () => { source.stop(); source.dispose(); filter.dispose(); lfo.stop().dispose(); vol.dispose(); }
            };
        },

        fire_crackle: (intensity, time, duration, destination) => {
            const vol       = new Tone.Gain(intensity * 0.6).connect(destination);
            const noise     = new Tone.Noise('brown');
            const filter    = new Tone.Filter(1200, 'bandpass').connect(vol);
            const popNoise  = new Tone.Noise('white');
            const popFilter = new Tone.Filter(3000, 'bandpass').connect(vol);
            const popGain   = new Tone.Gain(0).connect(popFilter);
            noise.connect(filter);
            popNoise.connect(popGain);
            noise.start(time);
            popNoise.start(time);
            const popCount = Math.floor(duration * 3) || 6;
            for (let i = 0; i < popCount; i++) {
                const t = time + i * (duration / popCount) + Math.random() * 0.2;
                popGain.gain.setValueAtTime(0.8, t);
                popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            }
            if (duration) { noise.stop(time + duration); popNoise.stop(time + duration); }
            return {
                id: `fire_${Date.now()}`,
                stop: () => {
                    noise.stop(); noise.dispose();
                    popNoise.stop(); popNoise.dispose();
                    filter.dispose(); popFilter.dispose(); popGain.dispose(); vol.dispose();
                }
            };
        },

        fire_embers: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity * 0.4).connect(destination);
            const noise  = new Tone.Noise('brown');
            const filter = new Tone.Filter(1000, 'lowpass').connect(vol);
            noise.connect(filter);
            noise.start(time);
            if (duration) noise.stop(time + duration);
            return {
                id: `embers_${Date.now()}`,
                stop: () => { noise.stop(); noise.dispose(); filter.dispose(); vol.dispose(); }
            };
        },

        fire_embers_low: (intensity, time, duration, destination) => {
            return NatureSounds.creators.fire_embers(intensity * 0.6, time, duration, destination);
        },

        metal_wind_chimes: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity).connect(destination);
            const noise  = new Tone.Noise('pink');
            const filter = new Tone.Filter(3000, 'bandpass').connect(vol);
            noise.connect(filter);
            noise.start(time);
            if (duration) noise.stop(time + duration);
            const chime = new Tone.MetalSynth({
                frequency: 800,
                envelope: { attack: 0.001, decay: 0.4, release: 0.8 },
                harmonicity: 5.1,
                modulationIndex: 20
            }).connect(vol);
            chime.triggerAttackRelease('16n', time);
            return {
                id: `chimes_${Date.now()}`,
                stop: () => { noise.stop(); noise.dispose(); chime.dispose(); filter.dispose(); vol.dispose(); }
            };
        },

        metal_bell: (intensity, time, duration, destination) => {
            const vol  = new Tone.Gain(intensity).connect(destination);
            const bell = new Tone.MetalSynth({
                frequency: 600,
                envelope: { attack: 0.001, decay: 1.5, release: 2 },
                harmonicity: 8,
                modulationIndex: 30
            }).connect(vol);
            bell.triggerAttackRelease('8n', time);
            return {
                id: `bell_${Date.now()}`,
                stop: () => { bell.dispose(); vol.dispose(); }
            };
        },

        metal_vibrations: (intensity, time, duration, destination) => {
            const vol = new Tone.Gain(intensity * 0.3).connect(destination);
            const osc = new Tone.Oscillator({ frequency: 200, type: 'sine' }).connect(vol);
            const lfo = new Tone.LFO(5, 180, 220).connect(osc.frequency);
            lfo.start();
            osc.start(time);
            if (duration) osc.stop(time + duration);
            return {
                id: `vibration_${Date.now()}`,
                stop: () => { osc.stop(); osc.dispose(); lfo.stop().dispose(); vol.dispose(); }
            };
        },

        wind_gentle: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity * 0.7).connect(destination);
            const source = new Tone.Noise('pink');
            const filter = new Tone.Filter(600, 'lowpass');
            const lfo    = new Tone.LFO(0.15, 400, 700).connect(filter.frequency);
            lfo.start();
            source.connect(filter).connect(vol);
            source.start(time);
            if (duration) source.stop(time + duration);
            return {
                id: `wind_gentle_${Date.now()}`,
                stop: () => { source.stop(); source.dispose(); filter.dispose(); lfo.stop().dispose(); vol.dispose(); }
            };
        },

        wood_creak: (intensity, time, duration, destination) => {
            const vol = new Tone.Gain(intensity * 0.7).connect(destination);
            const osc = new Tone.Oscillator({ frequency: 80, type: 'sawtooth' }).connect(vol);
            const env = new Tone.Gain(0).connect(vol);
            osc.connect(env);
            env.gain.setValueAtTime(0, time);
            env.gain.rampTo(intensity, 0.5, time);
            env.gain.rampTo(0, 0.8, time + 0.5);
            osc.start(time);
            if (duration) osc.stop(time + duration);
            return {
                id: `creak_${Date.now()}`,
                stop: () => { osc.stop(); osc.dispose(); env.dispose(); vol.dispose(); }
            };
        },

        wood_wind: (intensity, time, duration, destination) => {
            const vol    = new Tone.Gain(intensity * 0.7).connect(destination);
            const source = new Tone.Noise('pink');
            const filter = new Tone.Filter(500, 'bandpass');
            const lfo    = new Tone.LFO(0.1, 400, 900).connect(filter.frequency);
            lfo.start();
            source.connect(filter).connect(vol);
            source.start(time);
            if (duration) source.stop(time + duration);
            return {
                id: `wood_wind_${Date.now()}`,
                stop: () => { source.stop(); source.dispose(); filter.dispose(); lfo.stop().dispose(); vol.dispose(); }
            };
        },

        // ══════════════════════════════════════
        // เสียงสัตว์ (ใช้ไฟล์ MP3)
        //
        // FIX v2.0: สร้าง Tone.Player แยกต่อแต่ละ interval
        // เพราะ Tone.Player ไม่รองรับการเรียก .start()/.stop()
        // หลายรอบบน instance เดียวกัน → Race condition
        //
        // Pattern: [[startOffset, stopOffset], ...]  (วินาที)
        // ══════════════════════════════════════

        // Helper ภายใน — ใช้ร่วมกันทุก animal
        _createAnimalPlayers(buffer, intensity, time, destination, intervals) {
            return intervals.map(([startOffset, stopOffset]) => {
                const p = new Tone.Player(buffer).connect(destination);
                p.volume.value = Tone.gainToDb(intensity);
                p.start(time + startOffset);
                p.stop(time + stopOffset);
                return p;
            });
        },

        birds: async (intensity, time, duration, destination) => {
            const buffer  = await NatureSounds.loadBuffer("sounds/birds.mp3");
            const players = NatureSounds.creators._createAnimalPlayers(
                buffer, intensity, time, destination,
/*                [[3, 5], [6, 8], [9, 11]]  */
                [[0, 2], [2, 4], [3.5, 4]]
            );
            return {
                id: `birds_${Date.now()}_${Math.random()}`,
                stop: () => { players.forEach(p => { try { p.stop(); p.dispose(); } catch(e) {} }); }
            };
        },

        cricket: async (intensity, time, duration, destination) => {
            const buffer  = await NatureSounds.loadBuffer("sounds/cricket.mp3");
            const players = NatureSounds.creators._createAnimalPlayers(
                buffer, intensity, time, destination,
/*                [[3, 5], [6, 8], [9, 11]]  */
                [[0, 2], [2, 4], [3.5, 4]]
            );
            return {
                id: `cricket_${Date.now()}_${Math.random()}`,
                stop: () => { players.forEach(p => { try { p.stop(); p.dispose(); } catch(e) {} }); }
            };
        },

        frogs: async (intensity, time, duration, destination) => {
            const buffer  = await NatureSounds.loadBuffer("sounds/frogs.mp3");
            const players = NatureSounds.creators._createAnimalPlayers(
                buffer, intensity, time, destination,
/*                [[3, 5], [6, 8], [9, 11]]  */
                [[0, 2], [2, 4], [3.5, 4]]

            );
            return {
                id: `frogs_${Date.now()}_${Math.random()}`,
                stop: () => { players.forEach(p => { try { p.stop(); p.dispose(); } catch(e) {} }); }
            };
        },

        chicken: async (intensity, time, duration, destination) => {
            const buffer  = await NatureSounds.loadBuffer("sounds/chicken.mp3");
            const players = NatureSounds.creators._createAnimalPlayers(
                buffer, intensity, time, destination,
/*                [[3, 5], [6, 8], [9, 11]]  */
                [[0, 2], [2, 4], [3.5, 4]]
            );
            return {
                id: `chicken_${Date.now()}_${Math.random()}`,
                stop: () => { players.forEach(p => { try { p.stop(); p.dispose(); } catch(e) {} }); }
            };
        },

        lamb: async (intensity, time, duration, destination) => {
            const buffer  = await NatureSounds.loadBuffer("sounds/lamb.mp3");
            const players = NatureSounds.creators._createAnimalPlayers(
                buffer, intensity, time, destination,
/*                [[3, 5], [6, 8], [9, 11]]  */
                [[0, 2], [2, 4], [3.5, 4]]
            );
            return {
                id: `lamb_${Date.now()}_${Math.random()}`,
                stop: () => { players.forEach(p => { try { p.stop(); p.dispose(); } catch(e) {} }); }
            };
        },

    }, // end creators

    // ─────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────
    async create(type, intensity, time, duration, destination = Tone.Destination) {
        // ข้าม helper ภายใน ไม่ให้เรียกจากภายนอก
        if (type.startsWith('_')) {
            console.warn(`[NatureSounds] "${type}" is an internal helper, not a sound type`);
            return null;
        }
        const creator = this.creators[type];
        if (!creator) {
            console.warn(`[NatureSounds] ⚠️ Unknown sound type: "${type}"`);
            return null;
        }
        try {
            return await creator(intensity, time, duration, destination);
        } catch (err) {
            console.error(`[NatureSounds] ❌ Error creating sound "${type}":`, err);
            return null;
        }
    }
};

window.NatureSounds = NatureSounds;

// แสดงเฉพาะ type จริง (กรอง helper ออก)
const publicTypes = Object.keys(NatureSounds.creators).filter(k => !k.startsWith('_'));
console.log("[NatureSounds] ✅ v2.0 loaded. Available types:", publicTypes);