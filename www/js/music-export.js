// music-export.js v4.1 - แก้ _getRenderOptions: fallback อ่าน localStorage เมื่อ EffectGainState ไม่พร้อม
// [v4.1] _getRenderOptions() เพิ่ม localStorage fallback ('mlq_effectGain') ก่อน hardcoded defaults
//        เพิ่ม log ครบว่าค่า gain มาจากไหน (EffectGainState / localStorage / defaults)

window.MusicExport_VERSION = "4.1";
console.log('[MusicExport] v' + window.MusicExport_VERSION + ' loading...');

function MusicExportController() {
    this._lameLoaded = false;
    this._isDownloading = false;
    this._lastCombinedDNA = null;
    this._lastExportDNA = null;
}

MusicExportController.prototype.initialize = function() {
    var self = this;
    this._injectUI();

    // ---- ซ่อน progress bar ดั้งเดิม (เพื่อไม่ให้ซ้ำซ้อนกับ exportStatusMsg) ----
    var statusBox = document.getElementById('prerenderStatusBox');
    if (statusBox) {
        statusBox.style.display = 'none';
        console.log('[MusicExport] ซ่อน #prerenderStatusBox เรียบร้อย');
    }
    var bar = document.getElementById('prerenderBar');
    if (bar) {
        bar.style.display = 'none';
        console.log('[MusicExport] ซ่อน #prerenderBar เรียบร้อย');
    }

    window.addEventListener('musicPointerChanged', function(e) {
        var d = e.detail || {};
        if (d.combinedDNA && d.combinedDNA.defaultDNA && d.combinedDNA.customDNA) {
            var combined = Object.assign({}, d.combinedDNA.defaultDNA, {
                natureEffects: (d.combinedDNA.defaultDNA.natureEffects || []).concat(d.combinedDNA.customDNA.natureEffects || [])
            });
            self._lastCombinedDNA = combined;
            if (combined.natureEffects && combined.natureEffects.length > 0) {
                self._lastExportDNA = combined;
            }
            console.log('[MusicExport] Stored combinedDNA with natureEffects:', combined.natureEffects ? combined.natureEffects.length : 0);
        } else if (d.activeDNA) {
            self._lastCombinedDNA = d.activeDNA;
            if (d.activeDNA.natureEffects && d.activeDNA.natureEffects.length > 0) {
                self._lastExportDNA = d.activeDNA;
            }
        }
    });

    window.addEventListener('prerenderComplete', function() {
        self._setButtons(true);
        self._setStatus('');
    });
    window.addEventListener('prerenderReset', function() {
        self._setButtons(false);
        self._setStatus('');
    });

    if (window.MusicPrerenderController && window.MusicPrerenderController.hasBlob) {
        this._setButtons(true);
    }
    console.log('[MusicExport] v' + window.MusicExport_VERSION + ' initialized');
};

MusicExportController.prototype._injectUI = function() {
    if (document.getElementById('musicExportPanel')) return;
    var panel = document.createElement('div');
    panel.id = 'musicExportPanel';
    panel.innerHTML = [
        '<div style="margin-top:1rem;padding:.9rem 1.1rem;',
        'background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:12px;">',
        '<div style="font-size:.82rem;font-weight:600;color:#d1fae5;margin-bottom:.65rem;">',
        '⬇ Download เพลงของคุณ (Music DNA + Nature Sounds)</div>',
        // --- Time options (แก้ไขสีตัวอักษร) ---
        '<div style="display:flex;gap:1rem;align-items:center;margin-bottom:0.8rem;flex-wrap:wrap;color:#e2e8f0;">',
          '<label style="display:flex;align-items:center;gap:0.3rem;cursor:pointer;">',
            '<input type="radio" name="renderMode" id="renderModeAuto" value="auto" checked> <span style="color:#e2e8f0;">ความยาวเดิม</span>',
          '</label>',
          '<label style="display:flex;align-items:center;gap:0.3rem;cursor:pointer;">',
            '<input type="radio" name="renderMode" id="renderModeCustom" value="custom"> <span style="color:#e2e8f0;">กำหนดเวลาเอง</span>',
          '</label>',
          '<div id="customTimeWrapper" style="display:none;align-items:center;gap:0.5rem;">',
            '<input type="number" id="customSec" value="60" min="5" max="600" step="5" style="width:80px;padding:4px;border-radius:4px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;"> <span style="color:#e2e8f0;">วินาที</span>',
            '<select id="customModeSelect" style="padding:4px;border-radius:4px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;">',
              '<option value="trim">ตัดให้สั้นลง</option>',
              '<option value="loop" selected>Loop ให้ครบตามเวลา</option>',
            '</select>',
          '</div>',
        '</div>',
        // --- แสดงความยาว (ไม่มี progress bar) ---
        '<div id="dnaDurationDisplay" style="font-size:0.7rem;color:#a7f3d0;margin-bottom:0.6rem;">⏱️ ความยาวเพลงจริง: -- วินาที</div>',
        // --- ปุ่มดาวน์โหลด ---
        '<div style="display:flex;gap:.5rem;flex-wrap:wrap;">',
        '<button id="exportWavBtn" disabled style="flex:1;min-width:90px;padding:.55rem .75rem;',
        'border-radius:8px;border:none;cursor:pointer;',
        'background:linear-gradient(135deg,#3b82f6,#2563eb);',
        'color:white;font-size:.82rem;font-weight:600;opacity:.4;transition:opacity .2s;">',
        '↓ WAV</button>',
        '<button id="exportMp3Btn" disabled style="flex:1;min-width:90px;padding:.55rem .75rem;',
        'border-radius:8px;border:none;cursor:pointer;',
        'background:linear-gradient(135deg,#8b5cf6,#7c3aed);',
        'color:white;font-size:.82rem;font-weight:600;opacity:.4;transition:opacity .2s;">',
        '↓ MP3</button>',
        '</div>',
        // --- สถานะ (ใช้สำหรับแสดง progress แทน bar) ---
        '<div id="exportStatusMsg" style="margin-top:.45rem;font-size:.78rem;',
        'color:#6ee7b7;min-height:1.5em;display:none;font-weight:500;"></div>',
        '</div>'
    ].join('');

    var anchor = document.getElementById('musicDNADetailedInfo') || document.getElementById('InfoPanel');
    if (anchor) anchor.insertAdjacentElement('afterend', panel);
    else document.body.appendChild(panel);

    // radio handlers
    var radioAuto = document.getElementById('renderModeAuto');
    var radioCustom = document.getElementById('renderModeCustom');
    var customWrapper = document.getElementById('customTimeWrapper');
    if (radioAuto && radioCustom) {
        radioAuto.addEventListener('change', function() {
            customWrapper.style.display = this.checked ? 'none' : 'flex';
        });
        radioCustom.addEventListener('change', function() {
            customWrapper.style.display = this.checked ? 'flex' : 'none';
        });
        customWrapper.style.display = 'none';
    }

    var self = this;
    document.getElementById('exportWavBtn').addEventListener('click', function() { self.downloadWAV(); });
    document.getElementById('exportMp3Btn').addEventListener('click', function() { self.downloadMP3(); });

    this._updateDurationDisplay();
    window.addEventListener('musicPointerChanged', function() {
        setTimeout(function() { self._updateDurationDisplay(); }, 100);
    });
};

MusicExportController.prototype._getCurrentDNA = function() {
    if (this._lastExportDNA && this._lastExportDNA.natureEffects && this._lastExportDNA.natureEffects.length > 0) {
        console.log('[MusicExport] Using _lastExportDNA, natureEffects:', this._lastExportDNA.natureEffects.length);
        return this._lastExportDNA;
    }
    if (this._lastCombinedDNA && this._lastCombinedDNA.natureEffects && this._lastCombinedDNA.natureEffects.length > 0) {
        console.log('[MusicExport] Using stored combinedDNA, natureEffects:', this._lastCombinedDNA.natureEffects.length);
        this._lastExportDNA = this._lastCombinedDNA;
        return this._lastCombinedDNA;
    }
    if (window.MusicPrerenderController && window.MusicPrerenderController._currentDNA) {
        var dna = window.MusicPrerenderController._currentDNA;
        console.log('[MusicExport] Using PrerenderController._currentDNA, natureEffects:', dna.natureEffects ? dna.natureEffects.length : 0);
        if (dna.natureEffects && dna.natureEffects.length > 0) {
            this._lastExportDNA = dna;
        }
        return dna;
    }
    var state = window.AppMainController && window.AppMainController.getState && window.AppMainController.getState();
    var dna = (state && state.music && (state.music.default || state.music.activeDNA));
    console.log('[MusicExport] Using AppMain DNA, natureEffects:', dna && dna.natureEffects ? dna.natureEffects.length : 0);
    if (dna && dna.natureEffects && dna.natureEffects.length > 0) {
        this._lastExportDNA = dna;
    }
    return dna;
};

MusicExportController.prototype._computeDNADuration = function(dna) {
    if (!dna || !dna.sequence || !dna.sequence.length) return 0;
    try {
        var last = dna.sequence[dna.sequence.length-1];
        var endSec = Tone.Time(last.time).toSeconds() + Tone.Time(last.duration || '4n').toSeconds();
        return endSec + 4;
    } catch(e) {
        return 0;
    }
};

MusicExportController.prototype._updateDurationDisplay = function() {
    var dna = this._getCurrentDNA();
    var duration = this._computeDNADuration(dna);
    var el = document.getElementById('dnaDurationDisplay');
    if (el) {
        el.innerHTML = duration > 0 ? `⏱️ ความยาวเพลงจริง: ${duration.toFixed(1)} วินาที` : '⏱️ ความยาวเพลงจริง: -- วินาที';
    }
};

MusicExportController.prototype._getRenderOptions = function() {
    var checkedRadio = document.querySelector('input[name="renderMode"]:checked');
    var mode = 'auto', duration = 60;
    if (checkedRadio && checkedRadio.value === 'custom') {
        var secInput = document.getElementById('customSec');
        var sec = secInput ? parseInt(secInput.value) : 60;
        if (isNaN(sec)) sec = 60;
        duration = Math.min(600, Math.max(5, sec));
        var modeSelect = document.getElementById('customModeSelect');
        mode = (modeSelect && modeSelect.value) || 'loop';
    }

    // v4.1: อ่านค่า gain 3 ระดับ: EffectGainState → localStorage → hardcoded defaults
    var includeNature = true;
    var natureVolume  = 0.70;
    var animalVolume  = 0.70;
    var gainSource    = 'defaults';

    if (window.EffectGainState) {
        // Level 1: EffectGainState พร้อม (music-audio.js โหลดแล้ว)
        includeNature = window.EffectGainState.get('includeNature') !== false;
        natureVolume  = window.EffectGainState.get('natureVolume') || natureVolume;
        animalVolume  = window.EffectGainState.get('animalVolume') || animalVolume;
        gainSource    = 'EffectGainState';
    } else {
        // Level 2: อ่านจาก localStorage โดยตรง
        try {
            var stored = JSON.parse(localStorage.getItem('mlq_effectGain') || 'null');
            if (stored && typeof stored === 'object') {
                if (stored.includeNature !== undefined) includeNature = stored.includeNature;
                if (stored.natureVolume  !== undefined) natureVolume  = stored.natureVolume;
                if (stored.animalVolume  !== undefined) animalVolume  = stored.animalVolume;
                gainSource = 'localStorage';
            }
        } catch (e) { /* silent */ }
        if (gainSource === 'defaults') {
            console.warn('[MusicExport] EffectGainState not available, using defaults (0.70)');
        }
    }

    console.log('[MusicExport] gain source=' + gainSource
        + ' includeNature=' + includeNature
        + ' natureVol=' + natureVolume.toFixed(2)
        + ' animalVol=' + animalVolume.toFixed(2));

    natureVolume = Math.min(1, Math.max(0, natureVolume));
    animalVolume = Math.min(1, Math.max(0, animalVolume));

    return { mode: mode, duration: duration, includeNature: includeNature, natureVolume: natureVolume, animalVolume: animalVolume };
};

MusicExportController.prototype._getOriginalBlob = function() {
    var pre = window.MusicPrerenderController;
    if (!pre) return Promise.reject(new Error('Prerender not available'));

    var options = this._getRenderOptions();
    if (options.mode !== 'auto') {
        var dna = this._getCurrentDNA();
        if (!dna) return Promise.reject(new Error('No DNA available'));
        console.log('[MusicExport] Export DNA natureEffects:', dna.natureEffects ? dna.natureEffects.map(e => e.type).join(', ') : '[]');
        console.log('[MusicExport] Calling renderOffline with options:', options);
        return pre.renderOffline(dna, options).then(function(result) {
            console.log('[MusicExport] renderOffline complete, size=' + (result.blob.size/1024).toFixed(0) + 'KB');
            return result.blob;
        });
    }

    if (!pre.hasBlob || !pre._blob) {
        return Promise.reject(new Error('ยังไม่มีไฟล์เพลง กรุณารอ render ก่อน หรือเลือก custom duration'));
    }
    return Promise.resolve(pre._blob);
};

MusicExportController.prototype._bufferToWav = function(buffer) {
    var numChannels = buffer.numberOfChannels;
    var sampleRate = buffer.sampleRate;
    var bitDepth = 16;
    var samples = buffer.getChannelData(0);
    var dataLength = samples.length * (bitDepth / 8) * numChannels;
    var bufferLength = 44 + dataLength;
    var arrayBuffer = new ArrayBuffer(bufferLength);
    var view = new DataView(arrayBuffer);
    
    function writeString(offset, str) {
        for (var i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth/8), true);
    view.setUint16(32, numChannels * (bitDepth/8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    var offset = 44;
    for (var i = 0; i < samples.length; i++) {
        for (var ch = 0; ch < numChannels; ch++) {
            var sample = buffer.getChannelData(ch)[i];
            var intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
            view.setInt16(offset, intSample, true);
            offset += 2;
        }
    }
    return new Blob([view], { type: 'audio/wav' });
};

MusicExportController.prototype.downloadWAV = function() {
    if (this._isDownloading) {
        this._setStatus('⏳ กำลังดาวน์โหลดอยู่ กรุณารอสักครู่', '#fbbf24');
        return;
    }
    this._isDownloading = true;
    this._setStatus('⏳ กำลังเตรียมไฟล์ WAV...');
    this._setButtons(false);
    var self = this;

    this._getOriginalBlob().then(function(blob) {
        if (!blob || blob.size === 0) throw new Error('Blob ว่างเปล่า');
        self._trigger(blob, self._filename('wav'));
        self._setStatus('✅ Download WAV สำเร็จ');
        self._setButtons(true);
    }).catch(function(e) {
        console.error('[MusicExport] WAV failed', e);
        self._setStatus('❌ WAV ล้มเหลว: ' + (e.message || e), '#ef4444');
        self._setButtons(true);
    }).finally(function() {
        self._isDownloading = false;
    });
};

MusicExportController.prototype.downloadMP3 = function() {
    if (this._isDownloading) {
        this._setStatus('⏳ กำลังดาวน์โหลดอยู่ กรุณารอสักครู่', '#fbbf24');
        return;
    }
    this._isDownloading = true;
    this._setStatus('⏳ กำลังเตรียม MP3...');
    this._setButtons(false);
    var self = this;

    this._getOriginalBlob().then(function(blob) {
        if (!blob || blob.size === 0) throw new Error('Blob ว่างเปล่า');
        self._setStatus('⏳ โหลด MP3 encoder...');
        return self._loadLame().then(function() {
            self._setStatus('⏳ decode WAV...');
            return blob.arrayBuffer();
        }).then(function(ab) {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            return ctx.decodeAudioData(ab).then(function(buffer) {
                ctx.close();
                self._setStatus('⏳ encode MP3 (0%)...');
                return self._encMP3Async(buffer, function(progress) {
                    var pct = Math.round(progress * 100);
                    self._setStatus('⏳ encode MP3 (' + pct + '%)...');
                });
            }).catch(function(err) {
                console.warn('[MusicExport] AudioContext decode failed, using OfflineAudioContext', err);
                var OffCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
                if (!OffCtx) throw new Error('OfflineAudioContext not supported');
                var ctx2 = new OffCtx(2, 44100 * 60, 44100);
                return ctx2.decodeAudioData(ab).then(function(buffer) {
                    return self._encMP3Async(buffer, function(progress) {
                        var pct = Math.round(progress * 100);
                        self._setStatus('⏳ encode MP3 (' + pct + '%)...');
                    });
                });
            });
        }).then(function(mp3Blob) {
            self._trigger(mp3Blob, self._filename('mp3'));
            self._setStatus('✅ Download MP3 สำเร็จ');
            self._setButtons(true);
        });
    }).catch(function(e) {
        console.error('[MusicExport] MP3 failed', e);
        var errMsg = e.message || e.toString();
        if (!window.lamejs) errMsg += ' (lamejs not loaded)';
        self._setStatus('❌ MP3 ล้มเหลว: ' + errMsg, '#ef4444');
        self._setButtons(true);
    }).finally(function() {
        self._isDownloading = false;
    });
};

MusicExportController.prototype._encMP3Async = function(audioBuf, onProgress) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (!window.lamejs) return reject(new Error('lamejs not loaded'));
        try {
            var nc = Math.min(audioBuf.numberOfChannels, 2);
            var sr = audioBuf.sampleRate;
            var enc = new lamejs.Mp3Encoder(nc, sr, 128);
            var blk = 1152;
            var mp3 = [];
            var L = self._f2i(audioBuf.getChannelData(0));
            var R = nc > 1 ? self._f2i(audioBuf.getChannelData(1)) : L;
            var total = L.length;
            var processed = 0;

            function processChunk() {
                var chunkSize = blk * 10;
                var end = Math.min(processed + chunkSize, total);
                for (var i = processed; i < end; i += blk) {
                    var lc = L.subarray(i, i + blk);
                    var rc = R.subarray(i, i + blk);
                    var enc2 = nc > 1 ? enc.encodeBuffer(lc, rc) : enc.encodeBuffer(lc);
                    if (enc2.length) mp3.push(new Int8Array(enc2));
                }
                processed = end;
                if (onProgress) {
                    onProgress(processed / total);
                }
                if (processed < total) {
                    setTimeout(processChunk, 0);
                } else {
                    var fl = enc.flush();
                    if (fl.length) mp3.push(new Int8Array(fl));
                    var blob = new Blob(mp3, { type: 'audio/mp3' });
                    resolve(blob);
                }
            }
            processChunk();
        } catch (e) {
            reject(e);
        }
    });
};

MusicExportController.prototype._loadLame = function() {
    var self = this;
    if (this._lameLoaded && window.lamejs) return Promise.resolve();
    return new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
        s.onload  = function() { self._lameLoaded = true; resolve(); };
        s.onerror = function() { reject(new Error('lamejs โหลดไม่ได้')); };
        document.head.appendChild(s);
    });
};

MusicExportController.prototype._f2i = function(fa) {
    var out = new Int16Array(fa.length);
    for (var i = 0; i < fa.length; i++) {
        var s = Math.max(-1, Math.min(1, fa[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return out;
};

MusicExportController.prototype._filename = function(ext) {
    var state    = window.AppMainController && window.AppMainController.getState && window.AppMainController.getState();
    var name     = (state && state.user && state.user.personalData && state.user.personalData.fullName) || 'MLQ-Music';
    var element  = (state && state.numerology && state.numerology.element) || 'destiny';
    var lifePath = (state && state.numerology && state.numerology.lifePath) || '';
    var date     = new Date().toISOString().slice(0, 10);
    var safe     = function(s) { return s.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '_'); };
    return safe(name) + '_' + safe(element) + '_lp' + lifePath + '_' + date + '.' + ext;
};

MusicExportController.prototype._trigger = function(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 15000);
    console.log('[MusicExport] download: ' + filename + ' (' + Math.round(blob.size/1024) + ' KB)');
};

MusicExportController.prototype._setButtons = function(enabled) {
    var w = document.getElementById('exportWavBtn');
    var m = document.getElementById('exportMp3Btn');
    if (w) { w.disabled = !enabled; w.style.opacity = enabled ? '1' : '0.4'; }
    if (m) { m.disabled = !enabled; m.style.opacity = enabled ? '1' : '0.4'; }
};

MusicExportController.prototype._setStatus = function(msg, color) {
    var el = document.getElementById('exportStatusMsg');
    if (!el) return;
    el.style.display = msg ? 'block' : 'none';
    el.style.color   = color || '#6ee7b7';
    el.textContent   = msg;
    if (msg && (msg.indexOf('✅') === 0 || msg.indexOf('❌') === 0)) {
        setTimeout(function() { if (el.textContent === msg) el.style.display = 'none'; }, 8000);
    }
};

window.MusicExport = new MusicExportController();
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        window.MusicExport.initialize();
        console.log('[MusicExport] v' + window.MusicExport_VERSION + ' ready');
    }, 600);
});
console.log('[MusicExport] v' + window.MusicExport_VERSION + ' LOADED');