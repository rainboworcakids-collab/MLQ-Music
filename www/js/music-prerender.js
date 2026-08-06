// music-prerender.js v2.7 - Fix Bug: metal_wind_chimes + metal_bell ใช้ Tone.MetalSynth (cross-context DOMException)
// [v2.7] แทน Tone.MetalSynth ด้วย pure Web Audio API oscillator synthesis ทั้ง metal_wind_chimes และ metal_bell
//        เพิ่ม detailed error logging ใน _mixNature catch block (แสดง e.name + String(e))
//        ← ทำให้ metal_wind_chimes ทำงานถูกต้องใน OfflineAudioContext

window.MusicPrerender_VERSION = '2.7';
console.log('[MusicPrerender] v' + window.MusicPrerender_VERSION + ' loading...');

var PR_SYNTH = {
    piano:{type:'triangle',A:.02,D:.5,S:.3,R:1.2},electricpiano:{type:'sine',A:.02,D:.4,S:.2,R:.8},
    organ:{type:'sawtooth',A:.01,D:.1,S:.9,R:.3},strings:{type:'sawtooth',A:.4,D:.2,S:.8,R:1.5},
    violin:{type:'sawtooth',A:.3,D:.1,S:.9,R:.8},cello:{type:'sawtooth',A:.5,D:.2,S:.8,R:1.2},
    guitar:{type:'triangle',A:.01,D:.6,S:.1,R:.8},acousticguitar:{type:'triangle',A:.005,D:.7,S:.1,R:1},
    acoustic_guitar:{type:'triangle',A:.005,D:.7,S:.1,R:1},electricguitar:{type:'sawtooth',A:.01,D:.3,S:.6,R:.5},
    electric_guitar:{type:'sawtooth',A:.01,D:.3,S:.6,R:.5},bass:{type:'square',A:.02,D:.3,S:.5,R:.6},
    flute:{type:'sine',A:.08,D:.15,S:.7,R:.9},clarinet:{type:'square',A:.05,D:.1,S:.8,R:.5},
    saxophone:{type:'sawtooth',A:.06,D:.1,S:.8,R:.6},trumpet:{type:'sawtooth',A:.04,D:.1,S:.7,R:.4},
    kalimba:{type:'sine',A:.005,D:.8,S:.08,R:1.8},pad:{type:'sine',A:.2,D:.3,S:.9,R:2},
    synthpad:{type:'sawtooth',A:1,D:.2,S:.9,R:2.5},synth_pad:{type:'sawtooth',A:1,D:.2,S:.9,R:2.5},
    bellpad:{type:'sine',A:.01,D:1.5,S:.1,R:2},marimba:{type:'sine',A:.005,D:.4,S:0,R:.6},
    xylophone:{type:'triangle',A:.005,D:.3,S:0,R:.5},bells:{type:'sine',A:.005,D:2,S:0,R:2.5},
    bell:{type:'sine',A:.005,D:1.8,S:0,R:2},vibes:{type:'sawtooth',A:.01,D:.4,S:.25,R:.8},
    celesta:{type:'triangle',A:.005,D:.5,S:.15,R:.8},vibraphone:{type:'sine',A:.005,D:.6,S:0,R:1.2},
    chimes:{type:'sine',A:.005,D:.8,S:.1,R:.6},harp:{type:'triangle',A:.005,D:.6,S:.25,R:1.2},
    drums:{type:'square',A:.001,D:.1,S:0,R:.1},percussion:{type:'square',A:.001,D:.2,S:0,R:.2},
    synth:{type:'sawtooth',A:.05,D:.2,S:.6,R:.4},synth_lead:{type:'sawtooth',A:.01,D:.2,S:.7,R:.3},
    default:{type:'triangle',A:.02,D:.4,S:.3,R:1}
};

var PR_MP3 = {
    birds:'sounds/birds.mp3',cricket:'sounds/cricket.mp3',
    frogs:'sounds/frogs.mp3',chicken:'sounds/chicken.mp3',lamb:'sounds/lamb.mp3'
};

function MusicPrerender(){
    this.isPlaying=false; this.isRendering=false; this.hasBlob=false;
    this._audioEl=null; this._blobUrl=null; this._blob=null;
    this._currentDNA=null; this._abortFlag=false;
    this._pendingDNA=null;
    this._pendingOffline=null;
    this._mp3Cache=new Map(); this._volume=1.0; this._enabled=false;
    this._skipStopOnce = false;
    this._lastNatureDNA = null;
}

MusicPrerender.prototype.initialize=function(){
    var self=this;
    if(typeof OfflineAudioContext==='undefined'&&typeof webkitOfflineAudioContext==='undefined'){
        console.warn('[MusicPrerender] OfflineAudioContext not supported');
        return;
    }
    this._enabled=true;
    this._audioEl=document.createElement('audio');
    this._audioEl.id='mlqPrerenderAudio'; this._audioEl.loop=true;
    this._audioEl.preload='auto'; this._audioEl.style.display='none';
    document.body.appendChild(this._audioEl);
    this._audioEl.addEventListener('play',function(){ self.isPlaying=true; self._syncIcon(true); self._emitState(true); });
    this._audioEl.addEventListener('pause',function(){ self.isPlaying=false; self._syncIcon(false); self._emitState(false); });
    this._audioEl.addEventListener('error',function(e){ console.error('[MusicPrerender] audio error',e); });

    window.addEventListener('musicPointerChanged', function(e) {
        var d = e.detail || {};
        var renderOptions = d.renderOptions || { mode: 'auto' };
        var dna = d.activeDNA || (window.AppMainController && window.AppMainController.getActiveMusicDNA && window.AppMainController.getActiveMusicDNA());
        if (dna && dna.sequence && dna.sequence.length) {
            if (self._lastNatureDNA && self._lastNatureDNA.natureEffects && self._lastNatureDNA.natureEffects.length > 0) {
                if (!dna.natureEffects || dna.natureEffects.length === 0) {
                    console.warn('[MusicPrerender] New DNA has no natureEffects, using lastNatureDNA nature');
                    dna.natureEffects = self._lastNatureDNA.natureEffects.slice();
                }
            }
            if (dna.natureEffects && dna.natureEffects.length > 0) {
                self._lastNatureDNA = dna;
            }
            self._skipStopOnce = true;
            self._startRender(dna, renderOptions);
        }
    });

    window.addEventListener('stateChanged',function(e){
        var p=e.detail&&e.detail.path;
        if(p==='music.default'||p==='music.CustomSty') self._reset();
    });

    console.log('[MusicPrerender] v'+window.MusicPrerender_VERSION+' initialized');
};

MusicPrerender.prototype.renderOffline = function(dna, options) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (!self._enabled) return reject(new Error('Prerender not enabled'));
        if (!dna || !dna.sequence || !dna.sequence.length) {
            return reject(new Error('Invalid DNA: missing sequence'));
        }
        if (self.isRendering) {
            self._pendingOffline = { dna: dna, options: options, resolve: resolve, reject: reject };
            return;
        }
        self._currentDNA = dna;
        self._abortFlag = false;
        self.isRendering = true;
        self._dispatchProgress(0, 'Offline render start...');
        self._renderInternal(dna, options, function(err, blob, duration) {
            self.isRendering = false;
            if (err) {
                reject(err);
            } else {
                resolve({ blob: blob, duration: duration });
            }
            if (self._pendingOffline) {
                var p = self._pendingOffline;
                self._pendingOffline = null;
                self.renderOffline(p.dna, p.options).then(p.resolve).catch(p.reject);
            }
        });
    });
};

MusicPrerender.prototype._renderInternal = function(dna, options, callback) {
    if (typeof Tone === 'undefined') {
        return callback(new Error('Tone.js not loaded'));
    }
    try {
        var bpm = (dna.config && dna.config.bpm) || dna.tempo || 60;
        var originalSeq = dna.sequence || [];
        var effects = dna.effects || [];
        var nature = dna.natureEffects || [];
        var insts = dna.instruments || ['piano'];

        console.log('[MusicPrerender] _renderInternal natureEffects count:', nature.length);
        if (nature.length > 0) {
            console.log('[MusicPrerender] nature types:', nature.map(e => e.type).join(', '));
            this._lastNatureDNA = dna;
        }

        var originalDuration = this._computeOriginalDuration(originalSeq);
        var mode = (options && options.mode) || 'auto';
        var desiredSec = (options && options.duration) ? options.duration : originalDuration;
        var finalSeq = originalSeq.slice();
        var totalSec = desiredSec;
        var finalNature = nature.slice();

        if (mode === 'loop' && desiredSec > originalDuration + 0.1) {
            finalSeq = this._buildLoopedSequence(originalSeq, originalDuration, desiredSec);
            finalNature = this._buildLoopedNatureEffects(nature, originalDuration, desiredSec);
            totalSec = desiredSec;
            console.log('[MusicPrerender] Loop: originalDuration='+originalDuration.toFixed(2)+'s, desiredSec='+desiredSec.toFixed(2)+'s');
            console.log('[MusicPrerender] Looped natureEffects count:', finalNature.length);
            this._dispatchProgress(5, 'Loop sequence to '+totalSec.toFixed(1)+'s');
        } else if (mode === 'trim' && desiredSec < originalDuration - 0.1) {
            totalSec = desiredSec;
            finalNature = this._trimNatureEffects(nature, desiredSec);
            this._dispatchProgress(5, 'Trim to '+totalSec.toFixed(1)+'s');
        } else {
            totalSec = desiredSec;
            this._dispatchProgress(5, 'Duration '+totalSec.toFixed(1)+'s ('+mode+')');
        }

        var includeNature = (options && options.includeNature !== undefined) ? options.includeNature : true;
        var natureVolume = 1.0;
        var animalVolume = 1.0;

        if (options && options.natureVolume !== undefined) {
            natureVolume = options.natureVolume;
        } else if (window.EffectGainState) {
            natureVolume = window.EffectGainState.get('natureVolume') || 0.8;
        }

        if (options && options.animalVolume !== undefined) {
            animalVolume = options.animalVolume;
        } else if (window.EffectGainState) {
            animalVolume = window.EffectGainState.get('animalVolume') || 0.8;
        }

        natureVolume = Math.min(1, Math.max(0, natureVolume));
        animalVolume = Math.min(1, Math.max(0, animalVolume));

        var OffCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        var offCtx = new OffCtx(2, Math.ceil(44100 * totalSec), 44100);
        if (this._abortFlag) throw new Error('ABORT');
        this._dispatchProgress(8, 'Build graph...');
        var fx = this._buildFX(offCtx, effects, dna.mood);
        var ib = offCtx.createGain(); ib.gain.value = 0.82; ib.connect(fx);
        var nb = offCtx.createGain(); nb.gain.value = 0.72; nb.connect(fx);

        if (finalSeq.length) {
            this._dispatchProgress(12, 'Schedule notes...');
            if (mode === 'trim' && desiredSec < originalDuration - 0.1) {
                this._schedNotesTrim(offCtx, ib, finalSeq, insts, bpm, dna._sections, desiredSec);
            } else {
                this._schedNotes(offCtx, ib, finalSeq, insts, bpm, dna._sections);
            }
        }
        if (this._abortFlag) throw new Error('ABORT');

        var renderPromise;
        if (finalNature.length > 0 && includeNature && (natureVolume > 0.001 || animalVolume > 0.001)) {
            this._dispatchProgress(35, 'Loading nature sounds...');
            renderPromise = this._mixNature(offCtx, nb, finalNature, totalSec, natureVolume, animalVolume).then(function() {
                if (this._abortFlag) throw new Error('ABORT');
                this._dispatchProgress(50, 'Rendering... (5-20s)');
                return offCtx.startRendering();
            }.bind(this));
        } else {
            if (finalNature.length > 0 && !includeNature) {
                console.log('[MusicPrerender] Nature effects skipped (includeNature=false)');
            } else if (finalNature.length > 0 && natureVolume <= 0.001 && animalVolume <= 0.001) {
                console.log('[MusicPrerender] Nature effects skipped (both volumes zero)');
            } else {
                console.log('[MusicPrerender] No nature effects to mix');
            }
            this._dispatchProgress(50, 'Rendering... (5-20s)');
            renderPromise = offCtx.startRendering();
        }

        renderPromise.then(function(rendered) {
            if (this._abortFlag) throw new Error('ABORT');
            this._dispatchProgress(85, 'Encoding WAV...');
            var wav = this._encWAV(rendered);
            var blob = new Blob([wav], { type: 'audio/wav' });
            callback(null, blob, rendered.duration);
        }.bind(this)).catch(function(err) {
            callback(err);
        });
    } catch (err) {
        callback(err);
    }
};

MusicPrerender.prototype._buildLoopedNatureEffects = function(nature, originalDuration, desiredSec) {
    if (!nature || nature.length === 0) return [];
    if (desiredSec <= originalDuration + 0.1) return nature.slice();

    var loopCount = Math.ceil(desiredSec / originalDuration);
    var result = [];
    for (var i = 0; i < loopCount; i++) {
        var offset = i * originalDuration;
        for (var j = 0; j < nature.length; j++) {
            var fx = nature[j];
            var newFx = Object.assign({}, fx);
            if (fx.timecode) {
                try {
                    var timeStr = fx.timecode;
                    var startSec, endSec = null;
                    if (typeof timeStr === 'string' && timeStr.includes('-')) {
                        var parts = timeStr.split('-');
                        startSec = Tone.Time(parts[0]).toSeconds();
                        endSec = Tone.Time(parts[1]).toSeconds();
                    } else {
                        startSec = Tone.Time(timeStr).toSeconds();
                    }
                    var newStart = startSec + offset;
                    var newEnd = endSec ? endSec + offset : null;
                    if (newStart >= desiredSec) continue;
                    if (newEnd && newEnd > desiredSec) newEnd = desiredSec;
                    var newTimecode = newEnd
                        ? Tone.Time(newStart).toBarsBeatsSixteenths() + '-' + Tone.Time(newEnd).toBarsBeatsSixteenths()
                        : Tone.Time(newStart).toBarsBeatsSixteenths();
                    newFx.timecode = newTimecode;
                } catch(e) {
                    newFx.timecode = Tone.Time(offset).toBarsBeatsSixteenths();
                }
            } else if (fx.time !== undefined) {
                try {
                    var t = Tone.Time(fx.time).toSeconds() + offset;
                    if (t >= desiredSec) continue;
                    newFx.time = Tone.Time(t).toBarsBeatsSixteenths();
                } catch(e) {
                    newFx.time = Tone.Time(offset).toBarsBeatsSixteenths();
                }
            } else {
                newFx.time = Tone.Time(offset).toBarsBeatsSixteenths();
            }
            result.push(newFx);
        }
    }
    console.log('[MusicPrerender] Built looped natureEffects: original='+nature.length+', looped='+result.length);
    return result;
};

MusicPrerender.prototype._trimNatureEffects = function(nature, maxSec) {
    if (!nature || nature.length === 0) return [];
    var result = [];
    for (var i = 0; i < nature.length; i++) {
        var fx = nature[i];
        var startSec = 0, endSec = null;
        if (fx.timecode) {
            try {
                var timeStr = fx.timecode;
                if (typeof timeStr === 'string' && timeStr.includes('-')) {
                    var parts = timeStr.split('-');
                    startSec = Tone.Time(parts[0]).toSeconds();
                    endSec = Tone.Time(parts[1]).toSeconds();
                } else {
                    startSec = Tone.Time(timeStr).toSeconds();
                }
            } catch(e) {
                startSec = 0;
            }
        } else if (fx.time !== undefined) {
            try { startSec = Tone.Time(fx.time).toSeconds(); } catch(e) { startSec = 0; }
        }
        if (startSec >= maxSec) continue;
        if (endSec !== null && endSec > maxSec) {
            var newFx = Object.assign({}, fx);
            var newEnd = maxSec;
            newFx.timecode = Tone.Time(startSec).toBarsBeatsSixteenths() + '-' + Tone.Time(newEnd).toBarsBeatsSixteenths();
            result.push(newFx);
        } else {
            result.push(fx);
        }
    }
    return result;
};

MusicPrerender.prototype._doRender = function(dna, options) {
    var self = this;
    if (this.isRendering) {
        this._pendingDNA = { dna: dna, options: options };
        return;
    }
    this._currentDNA = dna;
    this._reset();
    this._abortFlag = false;
    this.isRendering = true;
    this._dispatchProgress(0, 'Preparing render...');

    this._renderInternal(dna, options, function(err, blob, duration) {
        self.isRendering = false;
        if (err) {
            self._dispatchProgress(-1, '❌ ' + (err.message || err));
            console.error('[MusicPrerender] render error', err);
            return;
        }
        self._blob = blob;
        self._blobUrl = URL.createObjectURL(blob);
        self._audioEl.src = self._blobUrl;
        self._audioEl.volume = self._volume;
        self._audioEl.loop = true;
        self._audioEl.load();
        self.hasBlob = true;
        var kb = (blob.size / 1024).toFixed(0);
        var sec = duration.toFixed(1);
        self._dispatchProgress(100, 'Ready ✅ (' + kb + ' KB / ' + sec + 's)');
        console.log('[MusicPrerender] render complete ' + kb + ' KB');

        window.dispatchEvent(new CustomEvent('prerenderComplete', {
            detail: { blob: blob, blobUrl: self._blobUrl, duration: duration, size: blob.size },
            bubbles: true
        }));

        if (self._pendingDNA) {
            var nx = self._pendingDNA;
            self._pendingDNA = null;
            self._startRender(nx.dna, nx.options);
        }
    });
};

MusicPrerender.prototype._startRender = function(dna, options) {
    if (!this._enabled || !dna || !dna.sequence || !dna.sequence.length) return;
    if (this.isRendering) {
        this._pendingDNA = { dna: dna, options: options };
        return;
    }
    this._currentDNA = dna;
    this._reset();
    this._abortFlag = false;
    this._doRender(dna, options);
};

MusicPrerender.prototype._startCombined = function(def, cust, options) {
    var self = this;
    if (!this._enabled) { console.warn('[MusicPrerender] _startCombined: not enabled'); return; }
    if (!def || !def.sequence || !def.sequence.length) { console.warn('[MusicPrerender] _startCombined: invalid def'); return; }
    if (!cust || !cust.sequence || !cust.sequence.length) { console.warn('[MusicPrerender] _startCombined: invalid cust'); return; }
    if (typeof Tone === 'undefined') { console.warn('[MusicPrerender] _startCombined: Tone.js not loaded'); return; }
    try {
        var bpm = (def.config && def.config.bpm) || def.tempo || 60;
        Tone.Transport.bpm.value = bpm;
        var last = def.sequence[def.sequence.length - 1];
        var defEnd = Tone.Time(last.time).toSeconds() + Tone.Time(last.duration || '4n').toSeconds();
        var GAP = 0.3;
        var seq = def.sequence.map(function(n){ return Object.assign({}, n, {_sectionIndex:0}); })
                .concat(cust.sequence.map(function(n){
                    return Object.assign({}, n, {
                        time: Tone.Time(Tone.Time(n.time).toSeconds() + defEnd + GAP).toBarsBeatsSixteenths(),
                        _sectionIndex:1
                    });
                }));
        var combined = Object.assign({}, def, {
            config: Object.assign({}, def.config, {bpm: bpm}),
            sequence: seq,
            instruments: def.instruments,
            effects: def.effects || [],
            natureEffects: (def.natureEffects || []).concat(cust.natureEffects || []),
            _sections: [
                {startTime:0, instruments:def.instruments, effects:def.effects||[]},
                {startTime:defEnd+GAP, instruments:cust.instruments, effects:cust.effects||[]}
            ]
        });
        console.log('[MusicPrerender] combined sequence length:', seq.length);
        if (combined.natureEffects && combined.natureEffects.length > 0) {
            console.log('[MusicPrerender] combined natureEffects:', combined.natureEffects.map(e=>e.type).join(', '));
            this._lastNatureDNA = combined;
        }
        this._startRender(combined, options || { mode: 'auto' });
    } catch(e) {
        console.error('[MusicPrerender] _startCombined error', e);
    }
};

MusicPrerender.prototype._computeOriginalDuration = function(seq) {
    if (!seq || !seq.length) return 4;
    var last = seq[seq.length - 1];
    var endSec = Tone.Time(last.time).toSeconds() + Tone.Time(last.duration || '4n').toSeconds();
    return endSec + 4;
};

MusicPrerender.prototype._buildLoopedSequence = function(seq, originalDuration, desiredSec) {
    if (desiredSec <= originalDuration) return seq.slice();
    var loopCount = Math.ceil(desiredSec / originalDuration);
    var newSeq = [];
    for (var i = 0; i < loopCount; i++) {
        var offset = i * originalDuration;
        for (var j = 0; j < seq.length; j++) {
            var note = seq[j];
            var newNote = Object.assign({}, note);
            try {
                var origTimeSec = Tone.Time(note.time).toSeconds();
                newNote.time = Tone.Time(origTimeSec + offset).toBarsBeatsSixteenths();
            } catch(e) {
                newNote.time = note.time;
            }
            newSeq.push(newNote);
        }
    }
    return newSeq;
};

MusicPrerender.prototype._schedNotesTrim = function(offCtx, dest, seq, insts, bpm, sections, maxSec) {
    var beat = 60 / Math.max(bpm, 10);
    var delays = [0, Math.min(.38, beat*.52), Math.min(.58, beat*.80)];
    for (var ni = 0; ni < seq.length; ni++) {
        var note = seq[ni];
        if (!note || note.duration === '0n') continue;
        var insts2 = insts;
        if (sections && sections.length && note._sectionIndex != null) {
            var s = sections[note._sectionIndex];
            if (s && s.instruments && s.instruments.length) insts2 = s.instruments;
        }
        var t0 = 0, dur = .5;
        try { t0 = Tone.Time(note.time || '0:0').toSeconds(); } catch(e) {}
        if (t0 >= maxSec) continue;
        try { dur = Tone.Time(note.duration || '4n').toSeconds(); } catch(e) {}
        if (t0 + dur > maxSec) dur = maxSec - t0;
        if (dur <= 0) continue;
        for (var li = 0; li < insts2.length; li++) {
            try {
                var freq = this._n2f(note.note);
                if (li === 1) freq *= 2; else if (li === 2) freq *= .5;
                var vel = (note.velocity || .7) * (li === 0 ? .70 : li === 1 ? .54 : .44);
                this._osc(offCtx, dest, insts2[li], freq, t0 + (delays[li] || 0), dur, vel);
            } catch(e) {}
        }
    }
};

MusicPrerender.prototype._schedNotes = function(offCtx, dest, seq, insts, bpm, sections) {
    var beat = 60 / Math.max(bpm, 10);
    var delays = [0, Math.min(.38, beat*.52), Math.min(.58, beat*.80)];
    for (var ni = 0; ni < seq.length; ni++) {
        var note = seq[ni];
        if (!note || note.duration === '0n') continue;
        var insts2 = insts;
        if (sections && sections.length && note._sectionIndex != null) {
            var s = sections[note._sectionIndex];
            if (s && s.instruments && s.instruments.length) insts2 = s.instruments;
        }
        var t0 = 0, dur = .5;
        try { t0 = Tone.Time(note.time || '0:0').toSeconds(); } catch(e) {}
        try { dur = Tone.Time(note.duration || '4n').toSeconds(); } catch(e) {}
        for (var li = 0; li < insts2.length; li++) {
            try {
                var freq = this._n2f(note.note);
                if (li === 1) freq *= 2; else if (li === 2) freq *= .5;
                var vel = (note.velocity || .7) * (li === 0 ? .70 : li === 1 ? .54 : .44);
                this._osc(offCtx, dest, insts2[li], freq, t0 + (delays[li] || 0), dur, vel);
            } catch(e) {}
        }
    }
};

MusicPrerender.prototype._osc = function(offCtx, dest, name, freq, t, dur, gain) {
    var k = (name || '').toLowerCase().replace(/_([a-z])/g, function(_, l){ return l.toUpperCase(); });
    var c = PR_SYNTH[k] || PR_SYNTH[name.toLowerCase()] || PR_SYNTH.default;
    var maxT = offCtx.length / offCtx.sampleRate;
    var osc = offCtx.createOscillator();
    osc.type = c.type;
    osc.frequency.value = freq;
    var env = offCtx.createGain();
    var aE = t + c.A, dE = aE + c.D, nE = t + dur, rE = nE + c.R;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, aE);
    env.gain.linearRampToValueAtTime(gain * c.S, dE);
    env.gain.setValueAtTime(gain * c.S, nE);
    env.gain.linearRampToValueAtTime(0, Math.min(rE, maxT - .01));
    osc.connect(env);
    env.connect(dest);
    osc.start(t);
    osc.stop(Math.min(rE + .05, maxT));
};

MusicPrerender.prototype._buildFX = function(offCtx, effects, mood) {
    var comp = offCtx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    comp.attack.value = .003;
    comp.release.value = .4;
    var lim = offCtx.createDynamicsCompressor();
    lim.threshold.value = -3;
    lim.ratio.value = 20;
    var master = offCtx.createGain();
    master.gain.value = .85;
    var chain = [comp];
    var hasRev = effects.some(function(e){ return e.toLowerCase().indexOf('reverb') >= 0; });
    var rvD = 2.5, rvW = .38;
    var mm = {peaceful:{decay:3.5,wet:.42}, melancholic:{decay:4,wet:.65}, mysterious:{decay:5,wet:.75}, joyful:{decay:2,wet:.38}};
    if (mood && mm[mood.toLowerCase()]) {
        rvD = mm[mood.toLowerCase()].decay;
        rvW = mm[mood.toLowerCase()].wet;
    }
    if (hasRev) {
        var irL = Math.ceil(offCtx.sampleRate * rvD);
        var ir = offCtx.createBuffer(2, irL, offCtx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
            var d = ir.getChannelData(ch);
            for (var i = 0; i < irL; i++) {
                d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/irL, 2.5);
            }
        }
        var conv = offCtx.createConvolver();
        conv.buffer = ir;
        var dry = offCtx.createGain();
        dry.gain.value = 1 - rvW;
        var wet = offCtx.createGain();
        wet.gain.value = rvW;
        var inp = offCtx.createGain();
        chain[chain.length - 1].connect(inp);
        inp.connect(dry);
        inp.connect(conv);
        conv.connect(wet);
        var mix = offCtx.createGain();
        dry.connect(mix);
        wet.connect(mix);
        chain.push(mix);
    }
    if (effects.some(function(e){ return e.toLowerCase() === 'delay'; })) {
        var del = offCtx.createDelay(2);
        del.delayTime.value = .3;
        var fb = offCtx.createGain();
        fb.gain.value = .28;
        var dw = offCtx.createGain();
        dw.gain.value = .22;
        var dd = offCtx.createGain();
        dd.gain.value = .78;
        var di = offCtx.createGain();
        chain[chain.length - 1].connect(di);
        di.connect(dd);
        di.connect(del);
        del.connect(fb);
        fb.connect(del);
        del.connect(dw);
        var dm = offCtx.createGain();
        dd.connect(dm);
        dw.connect(dm);
        chain.push(dm);
    }
    if (effects.some(function(e){ return e.toLowerCase() === 'filter'; }) || mood === 'peaceful') {
        var flt = offCtx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.value = mood === 'peaceful' ? 880 : 1000;
        flt.Q.value = .5;
        chain[chain.length - 1].connect(flt);
        chain.push(flt);
    }
    chain[chain.length - 1].connect(lim);
    lim.connect(master);
    master.connect(offCtx.destination);
    return comp;
};

// ── MIX NATURE (ปรับปรุง error handling) ──
MusicPrerender.prototype._mixNature = function(offCtx, dest, fxArr, totalSec, natureVolume, animalVolume) {
    var self = this;
    var mp3Set = new Set(Object.keys(PR_MP3));
    var synSet = new Set(['rain','wind','stream','water_stream','water_drip','water_ocean',
        'fire_crackle','fire_embers','fire_embers_low','metal_wind_chimes','metal_bell',
        'metal_vibrations','wind_gentle','wood_creak','wood_wind']);

    var filtered = fxArr.filter(function(fx) {
        if (!fx || !fx.type) return false;
        var vol = mp3Set.has(fx.type) ? animalVolume : natureVolume;
        return vol > 0.001;
    });

    if (filtered.length === 0) {
        console.log('[MusicPrerender] No nature effects with volume > 0');
        return Promise.resolve();
    }

    var effectTypes = filtered.map(function(f){ return f.type; }).join(', ');
    console.log('[MusicPrerender] Mixing nature effects ('+filtered.length+' items):', effectTypes,
        'natureVol='+natureVolume.toFixed(2), 'animalVol='+animalVolume.toFixed(2));

    return Promise.all(filtered.map(function(fx) {
        var volScale = mp3Set.has(fx.type) ? animalVolume : natureVolume;
        if (mp3Set.has(fx.type)) {
            return self._mp3(offCtx, dest, fx, totalSec, volScale).catch(function(e){ console.warn('[MusicPrerender] MP3 '+fx.type+':', e.message); });
        }
        if (synSet.has(fx.type)) {
            try {
                self._synNature(offCtx, dest, fx, totalSec, volScale);
            } catch (e) {
                // v2.7: แสดง error detail ครบ (e.name, e.message, String(e))
                var errName = (e && e.name)    || 'Unknown';
                var errMsg  = (e && e.message) || '(empty)';
                var errStr  = (e instanceof Error) ? (e.stack || '').split('\n')[0] : String(e);
                console.warn('[MusicPrerender] synNature failed for '+fx.type+': ['+errName+'] '+errMsg, errStr);
            }
        }
        return Promise.resolve();
    }));
};

MusicPrerender.prototype._mp3 = function(offCtx, dest, fx, totalSec, volScale) {
    var self = this, url = PR_MP3[fx.type];
    if (!url) return Promise.resolve();
    var fp = this._mp3Cache.has(url)
        ? Promise.resolve(this._mp3Cache.get(url))
        : fetch(url).then(function(r){ if (!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
                    .then(function(b){ self._mp3Cache.set(url, b); return b; });
    return fp.then(function(ab){ return offCtx.decodeAudioData(ab.slice(0)); })
             .then(function(decoded){
                 var g = offCtx.createGain();
                 var baseGain = Math.min(1, Math.max(0, fx.intensity || .6));
                 g.gain.value = baseGain * volScale;
                 g.connect(dest);

                 var times = [];
                 if (fx.timecode) {
                     var tc = fx.timecode;
                     if (typeof tc === 'string' && tc.includes('-')) {
                         var parts = tc.split('-');
                         try {
                             var s = Tone.Time(parts[0]).toSeconds();
                             var e = Tone.Time(parts[1]).toSeconds();
                             if (s < totalSec) times.push({ start: s, end: Math.min(e, totalSec) });
                         } catch(e) {}
                     } else {
                         try {
                             var s = Tone.Time(tc).toSeconds();
                             if (s < totalSec) times.push({ start: s, end: Math.min(s + 2, totalSec) });
                         } catch(e) {}
                     }
                 } else if (fx.time !== undefined) {
                     try {
                         var s = Tone.Time(fx.time).toSeconds();
                         if (s < totalSec) times.push({ start: s, end: Math.min(s + 2, totalSec) });
                     } catch(e) {}
                 } else {
                     times.push({ start: 0, end: Math.min(2, totalSec) });
                 }

                 times.forEach(function(t) {
                     var src = offCtx.createBufferSource();
                     src.buffer = decoded;
                     src.connect(g);
                     src.start(t.start);
                     src.stop(t.end);
                 });
                 console.log('[MusicPrerender] placed '+fx.type+' (MP3) vol='+(baseGain*volScale).toFixed(2)+' times='+times.length);
             });
};

// ── SYNTHETIC NATURE (v2.6: รองรับ timecode และแยก metal types) ──
MusicPrerender.prototype._synNature = function(offCtx, dest, fx, totalSec, volScale) {
    var baseGain = Math.min(1, Math.max(0, fx.intensity || 0.5));
    var vol = offCtx.createGain();
    vol.gain.value = baseGain * volScale * 0.55;
    vol.connect(dest);
    var t = fx.type;

    // ฟังก์ชันช่วยในการแปลง timecode เป็น start/end
    function getTimeRange(fx, totalSec) {
        var start = 0, end = totalSec;
        if (fx.timecode) {
            var tc = fx.timecode;
            if (typeof tc === 'string' && tc.includes('-')) {
                var parts = tc.split('-');
                try {
                    start = Tone.Time(parts[0]).toSeconds();
                    end = Tone.Time(parts[1]).toSeconds();
                } catch(e) {}
            } else {
                try {
                    start = Tone.Time(tc).toSeconds();
                    end = Math.min(start + 2, totalSec);
                } catch(e) {}
            }
        } else if (fx.time !== undefined) {
            try {
                start = Tone.Time(fx.time).toSeconds();
                end = Math.min(start + 2, totalSec);
            } catch(e) {}
        }
        start = Math.max(0, Math.min(start, totalSec));
        end = Math.max(start, Math.min(end, totalSec));
        if (end - start < 0.1) end = Math.min(start + 0.5, totalSec);
        return { start: start, end: end };
    }

    var range = getTimeRange(fx, totalSec);
    var s = range.start, e = range.end;
    if (s >= totalSec || e - s < 0.01) return; // ข้ามถ้าไม่มีช่วง

    // --- ประเภทเสียงต่างๆ ---
    if (t === 'rain' || t === 'stream' || t === 'water_stream' || t === 'water_ocean') {
        this._noise(offCtx, vol, 'pink', s, e - s, 800, 'lowpass');
    }
    else if (t === 'wind' || t === 'wind_gentle' || t === 'wood_wind') {
        this._noise(offCtx, vol, 'pink', s, e - s, 500, 'lowpass');
    }
    else if (t === 'water_drip') {
        for (var i = s + 0.2; i < e; i += 2.5) {
            var o = offCtx.createOscillator();
            o.type = 'sine';
            o.frequency.value = 1200;
            var g = offCtx.createGain();
            var dripGain = baseGain * volScale * 0.6;
            g.gain.setValueAtTime(dripGain, i);
            g.gain.exponentialRampToValueAtTime(0.001 * volScale, i + 0.3);
            o.connect(g);
            g.connect(vol);
            o.start(i);
            o.stop(Math.min(i + 0.35, e));
        }
    }
    else if (t.indexOf('fire_') === 0) {
        this._noise(offCtx, vol, 'brown', s, e - s, 1200, 'bandpass');
    }
    else if (t === 'metal_wind_chimes') {
        // v2.7 FIX: แทน Tone.MetalSynth (ที่ใช้ live AudioContext → cross-context DOMException)
        //           ด้วย pure Web Audio API oscillators ที่ทำงานได้ใน OfflineAudioContext
        var metalGain = baseGain * volScale * 0.9;
        console.log('[MusicPrerender] synNature: metal_wind_chimes intensity='+fx.intensity+' metalGain='+metalGain.toFixed(2)+' range='+s.toFixed(2)+'-'+e.toFixed(2));

        // อัตราส่วน harmonic แบบ inharmonic (เสียงโลหะจริง — ไม่ใช่ integer multiples)
        var chimeRatios = [1.0, 2.756, 5.404, 8.933, 13.344];

        var count = Math.max(2, Math.floor((e - s) / 1.5));
        for (var k = 0; k < count; k++) {
            var t0 = s + (k / count) * (e - s) + Math.random() * 0.3;
            if (t0 >= totalSec) break;
            t0 = Math.min(t0, totalSec - 0.05);

            // pitch แตกต่างกันแต่ละครั้ง (เสียงกระดิ่งแต่ละอัน)
            var baseFreq = 600 + Math.random() * 400;
            var decayTime = 0.35 + Math.random() * 0.45;   // 0.35-0.80 วินาที
            var stopTime = Math.min(t0 + decayTime + 0.06, totalSec);

            // สร้าง 3 harmonic partials ต่อ 1 chime hit
            var numPartials = 3;
            for (var p = 0; p < numPartials; p++) {
                var freq = baseFreq * chimeRatios[p];
                var ampScale = 1.0 - p * 0.30;   // fundamental ดังที่สุด, overtone เบาลง
                if (ampScale < 0.05) continue;

                var osc = offCtx.createOscillator();   // ✅ offCtx เท่านั้น
                osc.type = 'sine';
                osc.frequency.value = freq;

                var gNode = offCtx.createGain();        // ✅ offCtx เท่านั้น
                gNode.gain.setValueAtTime(0, t0);
                gNode.gain.linearRampToValueAtTime(metalGain * ampScale, t0 + 0.002);   // attack เร็วมาก
                // exponentialRamp ต้องการค่า > 0
                var endGain = Math.max(0.0001, metalGain * ampScale * 0.0001);
                gNode.gain.exponentialRampToValueAtTime(endGain, Math.min(t0 + decayTime, totalSec - 0.01));

                osc.connect(gNode);
                gNode.connect(vol);
                osc.start(t0);
                osc.stop(stopTime);
            }
        }
    }
    else if (t === 'metal_vibrations') {
        // Drone effect: ใช้ oscillator + LFO ต่อเนื่อง
        var metalGain = baseGain * volScale * 0.8;
        console.log('[MusicPrerender] synNature: metal_vibrations intensity='+fx.intensity+' metalGain='+metalGain.toFixed(2)+' range='+s.toFixed(2)+'-'+e.toFixed(2));
        var osc = offCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 180 + Math.random() * 40;
        var lfo = offCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 4 + Math.random() * 2;
        var lfoGain = offCtx.createGain();
        lfoGain.gain.value = 20 + Math.random() * 20;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        var gainNode = offCtx.createGain();
        gainNode.gain.setValueAtTime(0, s);
        gainNode.gain.linearRampToValueAtTime(metalGain, s + 0.3);
        gainNode.gain.setValueAtTime(metalGain, e - 0.3);
        gainNode.gain.linearRampToValueAtTime(0, e);
        osc.connect(gainNode);
        gainNode.connect(vol);
        osc.start(s);
        osc.stop(e);
        lfo.start(s);
        lfo.stop(e);
        // ปล่อยให้ GC จัดการ
    }
    else if (t === 'metal_bell') {
        // v2.7 FIX: แทน Tone.MetalSynth ด้วย pure Web Audio API (เหมือน metal_wind_chimes fix)
        var bellGain = baseGain * volScale * 0.8;
        var bellRatios = [1.0, 2.756, 5.404, 8.933];  // inharmonic bell partials

        var t0 = s + Math.random() * Math.max(0, e - s - 0.1);
        t0 = Math.min(t0, totalSec - 0.05);
        var decayTime = 1.0 + Math.random() * 0.8;  // bell decay ยาวกว่า chime
        var stopTime = Math.min(t0 + decayTime + 0.1, totalSec);

        var baseFreq = 500 + Math.random() * 300;
        var numPartials = 4;
        for (var p = 0; p < numPartials; p++) {
            var freq = baseFreq * bellRatios[p];
            var ampScale = 1.0 - p * 0.20;
            if (ampScale < 0.05) continue;

            var osc = offCtx.createOscillator();   // ✅ offCtx เท่านั้น
            osc.type = 'sine';
            osc.frequency.value = freq;

            var gNode = offCtx.createGain();        // ✅ offCtx เท่านั้น
            gNode.gain.setValueAtTime(0, t0);
            gNode.gain.linearRampToValueAtTime(bellGain * ampScale, t0 + 0.002);
            var endGain = Math.max(0.0001, bellGain * ampScale * 0.0001);
            gNode.gain.exponentialRampToValueAtTime(endGain, Math.min(t0 + decayTime, totalSec - 0.01));

            osc.connect(gNode);
            gNode.connect(vol);
            osc.start(t0);
            osc.stop(stopTime);
        }
    }
    else if (t === 'wood_creak') {
        var wo = offCtx.createOscillator();
        wo.type = 'sawtooth';
        wo.frequency.value = 80;
        var wg = offCtx.createGain();
        wg.gain.setValueAtTime(0, s);
        wg.gain.linearRampToValueAtTime(baseGain * volScale * 0.6, s + 0.5);
        wg.gain.linearRampToValueAtTime(0, e);
        wo.connect(wg);
        wg.connect(vol);
        wo.start(s);
        wo.stop(e);
    }
    else {
        // fallback สำหรับประเภทที่ไม่รู้จัก: ใช้ noise
        this._noise(offCtx, vol, 'pink', s, e - s, 1000, 'lowpass');
    }
};

MusicPrerender.prototype._noise = function(offCtx, dest, color, s, dur, fq, ft) {
    var len = Math.ceil(offCtx.sampleRate * dur);
    var buf = offCtx.createBuffer(1, len, offCtx.sampleRate);
    var d = buf.getChannelData(0);
    if (color === 'pink') {
        var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (var i = 0; i < len; i++) {
            var w = Math.random()*2 - 1;
            b0 = .99886*b0 + w*.0555179;
            b1 = .99332*b1 + w*.0750759;
            b2 = .969*b2 + w*.153852;
            b3 = .8665*b3 + w*.3104856;
            b4 = .55*b4 + w*.5329522;
            b5 = -.7616*b5 - w*.016898;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w*.5362) / 10;
            b6 = w*.115926;
        }
    } else if (color === 'brown') {
        var last = 0;
        for (var j = 0; j < len; j++) {
            var ww = Math.random()*2 - 1;
            d[j] = (last + .02*ww) / 1.02;
            last = d[j];
            d[j] *= 3.5;
        }
    } else {
        for (var k = 0; k < len; k++) {
            d[k] = Math.random()*2 - 1;
        }
    }
    var src = offCtx.createBufferSource();
    src.buffer = buf;
    var flt = offCtx.createBiquadFilter();
    flt.type = ft;
    flt.frequency.value = fq;
    src.connect(flt);
    flt.connect(dest);
    src.start(s);
    src.stop(s + dur);
};

MusicPrerender.prototype._encWAV = function(buf) {
    var nc = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length, al = nc * 2, ds = n * al;
    var ab = new ArrayBuffer(44 + ds), v = new DataView(ab);
    function ws(o, s){ for (var i=0; i<s.length; i++) v.setUint8(o+i, s.charCodeAt(i)); }
    ws(0, 'RIFF');
    v.setUint32(4, 36 + ds, true);
    ws(8, 'WAVE');
    ws(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, nc, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * al, true);
    v.setUint16(32, al, true);
    v.setUint16(34, 16, true);
    ws(36, 'data');
    v.setUint32(40, ds, true);
    var off = 44;
    for (var i = 0; i < n; i++) {
        for (var ch = 0; ch < nc; ch++) {
            var x = Math.max(-1, Math.min(1, buf.getChannelData(ch)[i]));
            v.setInt16(off, x < 0 ? x * 0x8000 : x * 0x7FFF, true);
            off += 2;
        }
    }
    return ab;
};

MusicPrerender.prototype.play = function() {
    if (!this.hasBlob || !this._audioEl) { console.warn('[MusicPrerender] blob not ready'); return; }
    this._audioEl.volume = this._volume;
    this._audioEl.play().catch(function(e) {
        console.error('[MusicPrerender] play failed', e);
        window.dispatchEvent(new CustomEvent('prerenderNeedsGesture', {bubbles:true}));
    });
};
MusicPrerender.prototype.pause = function(){ if(this._audioEl) this._audioEl.pause(); };
MusicPrerender.prototype.stop = function(){ if(this._audioEl){ this._audioEl.pause(); this._audioEl.currentTime=0; } this.isPlaying=false; this._syncIcon(false); };
MusicPrerender.prototype.toggle = function(){ this.isPlaying ? this.pause() : this.play(); };
MusicPrerender.prototype.setVolume = function(v){ this._volume = Math.max(0, Math.min(1, v)); if(this._audioEl) this._audioEl.volume = this._volume; };

MusicPrerender.prototype._reset = function(){
    this._abortFlag = true;
    this.stop();
    this.hasBlob = false;
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
    this._blob = null;
    if (this._audioEl) { this._audioEl.src = ''; this._audioEl.load(); }
    window.dispatchEvent(new CustomEvent('prerenderReset', {bubbles:true}));
};

MusicPrerender.prototype._n2f = function(n){
    if (typeof Tone !== 'undefined' && Tone.Frequency) try { return Tone.Frequency(n).toFrequency(); } catch(e) {}
    var NM = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
    var m = (n||'').match(/^([A-G])(#|b?)(-?\d)$/);
    if (!m) return 440;
    var semi = NM[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, ((parseInt(m[3]) + 1) * 12 + semi - 69) / 12);
};
MusicPrerender.prototype._syncIcon = function(p){ var ic = document.getElementById('playIcon'); if(ic) ic.className = p ? 'fas fa-pause' : 'fas fa-play'; };
MusicPrerender.prototype._emitState = function(p){
    window.dispatchEvent(new CustomEvent('playbackStateChanged', {detail:{isPlaying:p, source:'prerender'}, bubbles:true}));
    window.dispatchEvent(new CustomEvent(p ? 'musicStarted' : 'musicStopped', {detail:{isPlaying:p}, bubbles:true}));
};
MusicPrerender.prototype._dispatchProgress = function(pct, msg){
    window.dispatchEvent(new CustomEvent('prerenderProgress', {detail:{percent:pct, message:msg}, bubbles:true}));
};

MusicPrerender.prototype.cleanup = function(){
    this._reset();
    if (this._audioEl && this._audioEl.parentNode) this._audioEl.parentNode.removeChild(this._audioEl);
    this._audioEl = null;
    this._mp3Cache.clear();
};

window.MusicPrerenderController = new MusicPrerender();
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        window.MusicPrerenderController.initialize();
        console.log('[MusicPrerender] v' + window.MusicPrerender_VERSION + ' ready');
    }, 450);
});
console.log('[MusicPrerender] v' + window.MusicPrerender_VERSION + ' LOADED');
