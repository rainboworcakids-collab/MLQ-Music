// music-export.js v3.0 - Post‑process trimming/looping (stable)

window.MusicExport_VERSION = "3.0";
console.log('[MusicExport] v' + window.MusicExport_VERSION + ' loading...');

function MusicExportController() {
    this._lameLoaded = false;
    this._isDownloading = false;
}

MusicExportController.prototype.initialize = function() {
    var self = this;
    this._injectUI();

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
        '<div style="display:flex;gap:1rem;align-items:center;margin-bottom:0.8rem;flex-wrap:wrap;">',
          '<label style="display:flex;align-items:center;gap:0.3rem;">',
            '<input type="radio" name="renderMode" id="renderModeAuto" value="auto" checked> ความยาวเดิม',
          '</label>',
          '<label style="display:flex;align-items:center;gap:0.3rem;">',
            '<input type="radio" name="renderMode" id="renderModeCustom" value="custom"> กำหนดเวลาเอง',
          '</label>',
          '<div id="customTimeWrapper" style="display:none;align-items:center;gap:0.5rem;">',
            '<input type="number" id="customSec" value="60" min="5" max="600" step="5" style="width:80px;padding:4px;"> วินาที',
            '<select id="customModeSelect" style="padding:4px;">',
              '<option value="trim">ตัดให้สั้นลง</option>',
              '<option value="loop">Loop ให้ครบตามเวลา</option>',
            '</select>',
          '</div>',
        '</div>',
        '<div id="dnaDurationDisplay" style="font-size:0.7rem;color:#a7f3d0;margin-bottom:0.6rem;">⏱️ ความยาวเพลงจริง: -- วินาที</div>',
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
        '<div id="exportStatusMsg" style="margin-top:.45rem;font-size:.73rem;',
        'color:#6ee7b7;min-height:1em;display:none;"></div>',
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

    // แสดงความยาวจริงของ DNA ปัจจุบัน
    this._updateDurationDisplay();
    window.addEventListener('musicPointerChanged', function() {
        setTimeout(function() { self._updateDurationDisplay(); }, 100);
    });
};

MusicExportController.prototype._getCurrentDNA = function() {
    var state = window.AppMainController && window.AppMainController.getState && window.AppMainController.getState();
    var dna = (state && state.music && (state.music.default || state.music.activeDNA));
    if (!dna && window.MusicPrerenderController && window.MusicPrerenderController._currentDNA) {
        dna = window.MusicPrerenderController._currentDNA;
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
    var autoRadio = document.getElementById('renderModeAuto');
    if (autoRadio && autoRadio.checked) {
        return { mode: 'auto' };
    } else {
        var secInput = document.getElementById('customSec');
        var sec = secInput ? parseInt(secInput.value) : 60;
        if (isNaN(sec)) sec = 60;
        sec = Math.min(600, Math.max(5, sec));
        var modeSelect = document.getElementById('customModeSelect');
        var subMode = (modeSelect && modeSelect.value) || 'trim';
        return { mode: subMode, duration: sec };
    }
};

MusicExportController.prototype._getOriginalBlob = function() {
    var pre = window.MusicPrerenderController;
    if (!pre || !pre._blob) {
        return Promise.reject('ยังไม่มีไฟล์เพลง กรุณารอ render ก่อน');
    }
    return Promise.resolve(pre._blob);
};

// post-process: trim หรือ loop โดยใช้ OfflineAudioContext
MusicExportController.prototype._processBuffer = function(originalBuffer, desiredSec, mode) {
    var sampleRate = originalBuffer.sampleRate;
    var channels = originalBuffer.numberOfChannels;
    var originalLen = originalBuffer.length;
    var originalDur = originalLen / sampleRate;
    var targetLen = Math.floor(sampleRate * desiredSec);
    
    if (mode === 'trim') {
        if (desiredSec >= originalDur) return Promise.resolve(originalBuffer);
        targetLen = Math.min(originalLen, targetLen);
        var offlineCtx = new OfflineAudioContext(channels, targetLen, sampleRate);
        var source = offlineCtx.createBufferSource();
        source.buffer = originalBuffer;
        source.connect(offlineCtx.destination);
        source.start();
        source.stop(desiredSec);
        return offlineCtx.startRendering();
    } 
    else if (mode === 'loop') {
        if (desiredSec <= originalDur) return Promise.resolve(originalBuffer);
        var loopCtx = new OfflineAudioContext(channels, targetLen, sampleRate);
        var loopSource = loopCtx.createBufferSource();
        loopSource.buffer = originalBuffer;
        loopSource.loop = true;
        loopSource.loopEnd = originalDur;
        loopSource.connect(loopCtx.destination);
        loopSource.start();
        loopSource.stop(desiredSec);
        return loopCtx.startRendering();
    }
    return Promise.resolve(originalBuffer);
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
    var options = this._getRenderOptions();
    this._getOriginalBlob().then(function(blob) {
        if (options.mode === 'auto') {
            return blob;
        } else {
            self._setStatus('⏳ กำลังตัด/loop เพลง...');
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            return blob.arrayBuffer().then(function(ab) {
                return ctx.decodeAudioData(ab);
            }).then(function(buffer) {
                return self._processBuffer(buffer, options.duration, options.mode);
            }).then(function(newBuffer) {
                return self._bufferToWav(newBuffer);
            }).finally(function() {
                ctx.close();
            });
        }
    }).then(function(finalBlob) {
        if (!finalBlob || finalBlob.size === 0) throw new Error('Blob ว่างเปล่า');
        self._trigger(finalBlob, self._filename('wav'));
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
    var options = this._getRenderOptions();
    this._getOriginalBlob().then(function(blob) {
        self._setStatus('⏳ โหลด MP3 encoder...');
        return self._loadLame().then(function() {
            self._setStatus('⏳ decode WAV...');
            return blob.arrayBuffer();
        });
    }).then(function(ab) {
        var ctx = null;
        if (typeof Tone !== 'undefined') {
            ctx = Tone.context && (Tone.context.rawContext || Tone.context._context || Tone.context);
        }
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        self._setStatus('⏳ decode & process...');
        return ctx.decodeAudioData(ab).then(function(originalBuffer) {
            if (options.mode === 'auto') {
                return originalBuffer;
            } else {
                self._setStatus('⏳ กำลังตัด/loop...');
                return self._processBuffer(originalBuffer, options.duration, options.mode);
            }
        }).then(function(processedBuffer) {
            self._setStatus('⏳ encode MP3...');
            return self._encMP3(processedBuffer);
        }).finally(function() {
            ctx.close();
        });
    }).then(function(mp3Blob) {
        self._trigger(mp3Blob, self._filename('mp3'));
        self._setStatus('✅ Download MP3 สำเร็จ');
        self._setButtons(true);
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

// ── method ที่เหลือ (เหมือนเดิมจาก v2.2) ──────────────────────────────
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

MusicExportController.prototype._encMP3 = function(audioBuf) {
    if (!window.lamejs) throw new Error('lamejs ไม่พร้อม');
    var nc  = Math.min(audioBuf.numberOfChannels, 2);
    var sr  = audioBuf.sampleRate;
    var enc = new lamejs.Mp3Encoder(nc, sr, 128);
    var blk = 1152, mp3 = [];
    var L = this._f2i(audioBuf.getChannelData(0));
    var R = nc > 1 ? this._f2i(audioBuf.getChannelData(1)) : L;
    for (var i = 0; i < L.length; i += blk) {
        var lc = L.subarray(i, i+blk), rc = R.subarray(i, i+blk);
        var enc2 = nc > 1 ? enc.encodeBuffer(lc, rc) : enc.encodeBuffer(lc);
        if (enc2.length) mp3.push(new Int8Array(enc2));
    }
    var fl = enc.flush(); if (fl.length) mp3.push(new Int8Array(fl));
    return new Blob(mp3, { type: 'audio/mp3' });
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
        setTimeout(function() { if (el.textContent === msg) el.style.display = 'none'; }, 6000);
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