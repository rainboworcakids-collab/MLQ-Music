// music-prerender.js v1.7
// MLQ-Music — Pre-render MusicDNA+NatureSounds → WAV blob → Audio element
// [v1.7] Fixed combinedDNA error, added options & custom duration (trim/loop)

window.MusicPrerender_VERSION = '1.7';
console.log('[MusicPrerender] v' + window.MusicPrerender_VERSION + ' loading...');

// ── SYNTH CONFIG (unchanged) ────────────────────────────────────────────────
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

// ── CLASS ───────────────────────────────────────────────────────────────────
function MusicPrerender(){
    this.isPlaying=false; this.isRendering=false; this.hasBlob=false;
    this._audioEl=null; this._blobUrl=null; this._blob=null;
    this._currentDNA=null; this._abortFlag=false; this._pendingDNA=null;
    this._mp3Cache=new Map(); this._volume=1.0; this._enabled=false;
    this._skipStopOnce = false;   
}

MusicPrerender.prototype.initialize=function(){
    var self=this;
    if(typeof OfflineAudioContext==='undefined'&&typeof webkitOfflineAudioContext==='undefined'){
        console.warn('[MusicPrerender] OfflineAudioContext ไม่รองรับ'); return;
    }
    this._enabled=true;
    this._audioEl=document.createElement('audio');
    this._audioEl.id='mlqPrerenderAudio'; this._audioEl.loop=true;
    this._audioEl.preload='auto'; this._audioEl.style.display='none';
    document.body.appendChild(this._audioEl);
    this._audioEl.addEventListener('play',function(){ self.isPlaying=true; self._syncIcon(true); self._emitState(true); });
    this._audioEl.addEventListener('pause',function(){ self.isPlaying=false; self._syncIcon(false); self._emitState(false); });
    this._audioEl.addEventListener('error',function(e){ console.error('[MusicPrerender] audio error',e); });

    window.addEventListener('musicPointerChanged',function(e){
        var d=e.detail||{};
        if(d.combinedDNA && d.combinedDNA.defaultDNA && d.combinedDNA.customDNA) {
            console.log('[MusicPrerender] musicPointerChanged with combinedDNA');
            self._skipStopOnce = true; 
            self._startCombined(d.combinedDNA.defaultDNA, d.combinedDNA.customDNA, { mode: 'auto' });
        }
        else {
            var dna = d.activeDNA || (window.AppMainController && window.AppMainController.getActiveMusicDNA && window.AppMainController.getActiveMusicDNA());
            if(dna && dna.sequence && dna.sequence.length) {
                self._skipStopOnce = true; 
                self._startRender(dna, { mode: 'auto' });
            }
        }
    });
    
    window.addEventListener('stateChanged',function(e){
        var p=e.detail&&e.detail.path;
        if(p==='music.default'||p==='music.CustomSty') self._reset();
    });

/*
    var btn=document.getElementById('playButton');
    if(btn){ btn.addEventListener('click',function(e){
        if(self._enabled&&self.hasBlob){
            if(window.AudioController&&window.AudioController.isPlaying){
                if(typeof window.AudioController.pause==='function') window.AudioController.pause();
                window.AudioController.isPlaying=false;
            }
            self.toggle(); e.stopImmediatePropagation();
        }
    },true); }
*/

    console.log('[MusicPrerender] v'+window.MusicPrerender_VERSION+' initialized');
};

// [FIXED] _startCombined with error logging
MusicPrerender.prototype._startCombined=function(def,cust,options){
    var self=this;
    if(!this._enabled) { console.warn('[MusicPrerender] _startCombined: not enabled'); return; }
    if(!def||!def.sequence||!def.sequence.length) { console.warn('[MusicPrerender] _startCombined: invalid def'); return; }
    if(!cust||!cust.sequence||!cust.sequence.length) { console.warn('[MusicPrerender] _startCombined: invalid cust'); return; }
    if(typeof Tone==='undefined') { console.warn('[MusicPrerender] _startCombined: Tone.js not loaded'); return; }
    try{
        var bpm=(def.config&&def.config.bpm)||def.tempo||60;
        Tone.Transport.bpm.value=bpm;
        var last=def.sequence[def.sequence.length-1];
        var defEnd=Tone.Time(last.time).toSeconds()+Tone.Time(last.duration||'4n').toSeconds();
        var GAP=0.3;
        var seq=def.sequence.map(function(n){ return Object.assign({},n,{_sectionIndex:0}); })
                .concat(cust.sequence.map(function(n){
                    return Object.assign({},n,{
                        time:Tone.Time(Tone.Time(n.time).toSeconds()+defEnd+GAP).toBarsBeatsSixteenths(),
                        _sectionIndex:1
                    });
                }));
        var combined=Object.assign({},def,{
            config:Object.assign({},def.config,{bpm:bpm}), sequence:seq,
            instruments:def.instruments, effects:def.effects||[],
            natureEffects:(def.natureEffects||[]).concat(cust.natureEffects||[]),
            _sections:[
                {startTime:0,instruments:def.instruments,effects:def.effects||[]},
                {startTime:defEnd+GAP,instruments:cust.instruments,effects:cust.effects||[]}
            ]
        });
        console.log('[MusicPrerender] combined sequence length:', seq.length);
        this._startRender(combined, options || { mode: 'auto' });
    }catch(e){
        console.error('[MusicPrerender] _startCombined error', e);
    }
};

MusicPrerender.prototype._startRender=function(dna, options){
    if(!this._enabled||!dna||!dna.sequence||!dna.sequence.length) return;
    if(this.isRendering){ this._pendingDNA={ dna: dna, options: options }; return; }
    this._currentDNA=dna;
    this._reset();
    this._abortFlag = false;
    this._doRender(dna, options);
};

// helper: compute original duration
MusicPrerender.prototype._computeOriginalDuration = function(seq){
    if(!seq || !seq.length) return 4;
    var last = seq[seq.length-1];
    var endSec = Tone.Time(last.time).toSeconds() + Tone.Time(last.duration || '4n').toSeconds();
    return endSec + 4;
};

// build looped sequence
MusicPrerender.prototype._buildLoopedSequence = function(seq, originalDuration, desiredSec){
    if(desiredSec <= originalDuration) return seq.slice();
    var loopCount = Math.ceil(desiredSec / originalDuration);
    var newSeq = [];
    for(var i=0; i<loopCount; i++){
        var offset = i * originalDuration;
        for(var j=0; j<seq.length; j++){
            var note = seq[j];
            var newNote = Object.assign({}, note);
            try{
                var origTimeSec = Tone.Time(note.time).toSeconds();
                newNote.time = Tone.Time(origTimeSec + offset).toBarsBeatsSixteenths();
            }catch(e){ newNote.time = note.time; }
            newSeq.push(newNote);
        }
    }
    return newSeq;
};

// schedule notes with trim
MusicPrerender.prototype._schedNotesTrim = function(offCtx, dest, seq, insts, bpm, sections, maxSec){
    var beat = 60/Math.max(bpm,10);
    var delays = [0, Math.min(.38, beat*.52), Math.min(.58, beat*.80)];
    for(var ni=0; ni<seq.length; ni++){
        var note = seq[ni];
        if(!note || note.duration==='0n') continue;
        var insts2 = insts;
        if(sections && sections.length && note._sectionIndex!=null){
            var s = sections[note._sectionIndex];
            if(s && s.instruments && s.instruments.length) insts2 = s.instruments;
        }
        var t0=0, dur=.5;
        try{ t0 = Tone.Time(note.time||'0:0').toSeconds(); }catch(e){}
        if(t0 >= maxSec) continue;
        try{ dur = Tone.Time(note.duration||'4n').toSeconds(); }catch(e){}
        if(t0 + dur > maxSec) dur = maxSec - t0;
        if(dur <= 0) continue;
        for(var li=0; li<insts2.length; li++){
            try{
                var freq = this._n2f(note.note);
                if(li===1) freq*=2; else if(li===2) freq*=.5;
                var vel = (note.velocity||.7)*(li===0?.70:li===1?.54:.44);
                this._osc(offCtx, dest, insts2[li], freq, t0+(delays[li]||0), dur, vel);
            }catch(e){}
        }
    }
};

MusicPrerender.prototype._doRender=function(dna, options){
    var self=this;
    this.isRendering=true;
    this._dispatchProgress(0,'เตรียม render...');
    if(typeof Tone==='undefined'){ this.isRendering=false; this._dispatchProgress(-1,'❌ Tone.js ไม่พร้อม'); return; }
    try{
        var bpm=(dna.config&&dna.config.bpm)||dna.tempo||60;
        var originalSeq=dna.sequence||[];
        var effects=dna.effects||[], nature=dna.natureEffects||[];
        var insts=dna.instruments||['piano'];

        var originalDuration = this._computeOriginalDuration(originalSeq);
        var mode = (options && options.mode) || 'auto';
        var desiredSec = (options && options.duration) ? options.duration : originalDuration;
        var finalSeq = originalSeq.slice();
        var totalSec = desiredSec;

        if(mode === 'loop' && desiredSec > originalDuration + 0.1){
            finalSeq = this._buildLoopedSequence(originalSeq, originalDuration, desiredSec);
            totalSec = desiredSec;
            this._dispatchProgress(5, `Loop sequence ให้ยาว ${totalSec.toFixed(1)} วิ`);
        }
        else if(mode === 'trim' && desiredSec < originalDuration - 0.1){
            totalSec = desiredSec;
            this._dispatchProgress(5, `Trim เหลือ ${totalSec.toFixed(1)} วิ`);
        }
        else {
            totalSec = desiredSec;
            this._dispatchProgress(5, `ความยาว ${totalSec.toFixed(1)} วิ (${mode})`);
        }

        var OffCtx=window.OfflineAudioContext||window.webkitOfflineAudioContext;
        var offCtx=new OffCtx(2,Math.ceil(44100*totalSec),44100);
        if(this._abortFlag) throw new Error('ABORT');
        this._dispatchProgress(8,'build graph...');
        var fx=this._buildFX(offCtx,effects,dna.mood);
        var ib=offCtx.createGain(); ib.gain.value=0.82; ib.connect(fx);
        var nb=offCtx.createGain(); nb.gain.value=0.72; nb.connect(fx);
        if(finalSeq.length){
            this._dispatchProgress(12,'schedule notes...');
            if(mode === 'trim' && desiredSec < originalDuration - 0.1){
                this._schedNotesTrim(offCtx, ib, finalSeq, insts, bpm, dna._sections, desiredSec);
            } else {
                this._schedNotes(offCtx, ib, finalSeq, insts, bpm, dna._sections);
            }
        }
        if(this._abortFlag) throw new Error('ABORT');
        var rp;
        if(nature.length){
            this._dispatchProgress(35,'โหลดเสียงธรรมชาติ...');
            rp=this._mixNature(offCtx,nb,nature,totalSec).then(function(){
                if(self._abortFlag) throw new Error('ABORT');
                self._dispatchProgress(50,'render... (5-20 วินาที)');
                return offCtx.startRendering();
            });
        } else {
            this._dispatchProgress(50,'render... (5-20 วินาที)');
            rp=offCtx.startRendering();
        }
        Promise.resolve(rp).then(function(rendered){
            if(self._abortFlag) throw new Error('ABORT');
            self._dispatchProgress(85,'encode WAV...');
            var wav=self._encWAV(rendered);
            var blob=new Blob([wav],{type:'audio/wav'});
            self._blob=blob; self._blobUrl=URL.createObjectURL(blob);
            self._audioEl.src=self._blobUrl; self._audioEl.volume=self._volume;
            self._audioEl.loop=true; self._audioEl.load();
            self.hasBlob=true; self.isRendering=false;
            var kb=(blob.size/1024).toFixed(0), sec=rendered.duration.toFixed(1);
            self._dispatchProgress(100,'พร้อมเล่น ✅ ('+kb+' KB / '+sec+'วิ)');
            console.log('[MusicPrerender] render สำเร็จ '+kb+' KB');
            window.dispatchEvent(new CustomEvent('prerenderComplete',{
                detail:{blob:blob,blobUrl:self._blobUrl,duration:rendered.duration,size:blob.size},bubbles:true
            }));
 
            if(window.AudioController&&window.AudioController.isPlaying){
                if(self._skipStopOnce) {
                    console.log('[MusicPrerender] Skip stop AudioController (first render)');
                    self._skipStopOnce = false;
                } else {
                    if(typeof window.AudioController.pause==='function') window.AudioController.pause();
                    window.AudioController.isPlaying=false;
                }
            }
            
            if(self._pendingDNA){ var nx=self._pendingDNA; self._pendingDNA=null; self._startRender(nx.dna, nx.options); }
        }).catch(function(e){
            self.isRendering=false;
            if(e.message==='ABORT') console.log('[MusicPrerender] render ถูกยกเลิก');
            else { console.error('[MusicPrerender] render failed',e); self._dispatchProgress(-1,'❌ '+(e.message||e)); }
        });
    }catch(e){
        this.isRendering=false;
        console.error('[MusicPrerender] _doRender error',e);
        this._dispatchProgress(-1,'❌ '+(e.message||e));
    }
};

// ── effect chain (unchanged) ──
MusicPrerender.prototype._buildFX=function(offCtx,effects,mood){
    var comp=offCtx.createDynamicsCompressor();
    comp.threshold.value=-18; comp.ratio.value=4; comp.attack.value=.003; comp.release.value=.4;
    var lim=offCtx.createDynamicsCompressor(); lim.threshold.value=-3; lim.ratio.value=20;
    var master=offCtx.createGain(); master.gain.value=.85;
    var chain=[comp];
    var hasRev=effects.some(function(e){ return e.toLowerCase().indexOf('reverb')>=0; });
    var rvD=2.5,rvW=.38;
    var mm={peaceful:{decay:3.5,wet:.42},melancholic:{decay:4,wet:.65},mysterious:{decay:5,wet:.75},joyful:{decay:2,wet:.38}};
    if(mood&&mm[mood.toLowerCase()]){ rvD=mm[mood.toLowerCase()].decay; rvW=mm[mood.toLowerCase()].wet; }
    if(hasRev){
        var irL=Math.ceil(offCtx.sampleRate*rvD), ir=offCtx.createBuffer(2,irL,offCtx.sampleRate);
        for(var ch=0;ch<2;ch++){ var d=ir.getChannelData(ch); for(var i=0;i<irL;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/irL,2.5); }
        var conv=offCtx.createConvolver(); conv.buffer=ir;
        var dry=offCtx.createGain(); dry.gain.value=1-rvW;
        var wet=offCtx.createGain(); wet.gain.value=rvW;
        var inp=offCtx.createGain(); chain[chain.length-1].connect(inp);
        inp.connect(dry); inp.connect(conv); conv.connect(wet);
        var mix=offCtx.createGain(); dry.connect(mix); wet.connect(mix); chain.push(mix);
    }
    if(effects.some(function(e){ return e.toLowerCase()==='delay'; })){
        var del=offCtx.createDelay(2); del.delayTime.value=.3;
        var fb=offCtx.createGain(); fb.gain.value=.28;
        var dw=offCtx.createGain(); dw.gain.value=.22;
        var dd=offCtx.createGain(); dd.gain.value=.78;
        var di=offCtx.createGain(); chain[chain.length-1].connect(di);
        di.connect(dd); di.connect(del); del.connect(fb); fb.connect(del); del.connect(dw);
        var dm=offCtx.createGain(); dd.connect(dm); dw.connect(dm); chain.push(dm);
    }
    if(effects.some(function(e){ return e.toLowerCase()==='filter'; })||mood==='peaceful'){
        var flt=offCtx.createBiquadFilter(); flt.type='lowpass';
        flt.frequency.value=mood==='peaceful'?880:1000; flt.Q.value=.5;
        chain[chain.length-1].connect(flt); chain.push(flt);
    }
    chain[chain.length-1].connect(lim); lim.connect(master); master.connect(offCtx.destination);
    return comp;
};

// ── schedule notes (unchanged) ──
MusicPrerender.prototype._schedNotes=function(offCtx,dest,seq,insts,bpm,sections){
    var beat=60/Math.max(bpm,10);
    var delays=[0,Math.min(.38,beat*.52),Math.min(.58,beat*.80)];
    for(var ni=0;ni<seq.length;ni++){
        var note=seq[ni]; if(!note||note.duration==='0n') continue;
        var insts2=insts;
        if(sections&&sections.length&&note._sectionIndex!=null){
            var s=sections[note._sectionIndex];
            if(s&&s.instruments&&s.instruments.length) insts2=s.instruments;
        }
        var t0=0,dur=.5;
        try{ t0=Tone.Time(note.time||'0:0').toSeconds(); }catch(e){}
        try{ dur=Tone.Time(note.duration||'4n').toSeconds(); }catch(e){}
        for(var li=0;li<insts2.length;li++){
            try{
                var freq=this._n2f(note.note);
                if(li===1) freq*=2; else if(li===2) freq*=.5;
                var vel=(note.velocity||.7)*(li===0?.70:li===1?.54:.44);
                this._osc(offCtx,dest,insts2[li],freq,t0+(delays[li]||0),dur,vel);
            }catch(e){}
        }
    }
};

MusicPrerender.prototype._osc=function(offCtx,dest,name,freq,t,dur,gain){
    var k=(name||'').toLowerCase().replace(/_([a-z])/g,function(_,l){ return l.toUpperCase(); });
    var c=PR_SYNTH[k]||PR_SYNTH[name.toLowerCase()]||PR_SYNTH.default;
    var maxT=offCtx.length/offCtx.sampleRate;
    var osc=offCtx.createOscillator(); osc.type=c.type; osc.frequency.value=freq;
    var env=offCtx.createGain();
    var aE=t+c.A, dE=aE+c.D, nE=t+dur, rE=nE+c.R;
    env.gain.setValueAtTime(0,t);
    env.gain.linearRampToValueAtTime(gain,aE);
    env.gain.linearRampToValueAtTime(gain*c.S,dE);
    env.gain.setValueAtTime(gain*c.S,nE);
    env.gain.linearRampToValueAtTime(0,Math.min(rE,maxT-.01));
    osc.connect(env); env.connect(dest); osc.start(t); osc.stop(Math.min(rE+.05,maxT));
};

// ── nature sounds (unchanged) ──
MusicPrerender.prototype._mixNature=function(offCtx,dest,fxArr,totalSec){
    var self=this;
    var mp3Set=new Set(Object.keys(PR_MP3));
    var synSet=new Set(['rain','wind','stream','water_stream','water_drip','water_ocean',
        'fire_crackle','fire_embers','fire_embers_low','metal_wind_chimes','metal_bell',
        'metal_vibrations','wind_gentle','wood_creak','wood_wind']);
    return Promise.all(fxArr.map(function(fx){
        if(!fx||!fx.type) return Promise.resolve();
        if(mp3Set.has(fx.type)) return self._mp3(offCtx,dest,fx,totalSec).catch(function(e){ console.warn('[MusicPrerender] MP3 '+fx.type+':',e.message); });
        if(synSet.has(fx.type)) try{ self._synNature(offCtx,dest,fx,totalSec); }catch(e){}
        return Promise.resolve();
    }));
};

MusicPrerender.prototype._mp3=function(offCtx,dest,fx,totalSec){
    var self=this, url=PR_MP3[fx.type];
    if(!url) return Promise.resolve();
    var fp=this._mp3Cache.has(url)
        ? Promise.resolve(this._mp3Cache.get(url))
        : fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
                    .then(function(b){ self._mp3Cache.set(url,b); return b; });
    return fp.then(function(ab){ return offCtx.decodeAudioData(ab.slice(0)); })
             .then(function(decoded){
                 var g=offCtx.createGain(); g.gain.value=Math.min(1,Math.max(0,fx.intensity||.6)); g.connect(dest);
                 [[3,5],[6,8],[9,11]].forEach(function(sl){
                     if(sl[0]>=totalSec) return;
                     var src=offCtx.createBufferSource(); src.buffer=decoded;
                     src.connect(g); src.start(sl[0]); src.stop(Math.min(sl[1],totalSec));
                 });
                 console.log('[MusicPrerender] placed '+fx.type+' (MP3)');
             });
};

MusicPrerender.prototype._synNature=function(offCtx,dest,fx,totalSec){
    var vol=offCtx.createGain(); vol.gain.value=Math.min(1,fx.intensity||.5)*.55; vol.connect(dest);
    var t=fx.type;
    if(t==='rain'||t==='stream'||t==='water_stream'||t==='water_ocean')
        this._noise(offCtx,vol,'pink',0,totalSec,800,'lowpass');
    else if(t==='wind'||t==='wind_gentle'||t==='wood_wind')
        this._noise(offCtx,vol,'pink',0,totalSec,500,'lowpass');
    else if(t==='water_drip'){
        for(var i=2;i<totalSec;i+=2.5){
            var o=offCtx.createOscillator(); o.type='sine'; o.frequency.value=1200;
            var g=offCtx.createGain(); g.gain.setValueAtTime(.3,i); g.gain.exponentialRampToValueAtTime(.001,i+.3);
            o.connect(g); g.connect(vol); o.start(i); o.stop(Math.min(i+.35,totalSec));
        }
    } else if(t.indexOf('fire_')===0)
        this._noise(offCtx,vol,'brown',0,totalSec,1200,'bandpass');
    else if(t.indexOf('metal_')===0){
        for(var j=1;j<totalSec;j+=4+Math.random()*2){
            var mo=offCtx.createOscillator(); mo.type='sine'; mo.frequency.value=800+Math.random()*400;
            var mg=offCtx.createGain(); mg.gain.setValueAtTime(.2,j); mg.gain.exponentialRampToValueAtTime(.001,Math.min(j+1.5,totalSec));
            mo.connect(mg); mg.connect(vol); mo.start(j); mo.stop(Math.min(j+1.6,totalSec));
        }
    } else if(t==='wood_creak'){
        var wo=offCtx.createOscillator(); wo.type='sawtooth'; wo.frequency.value=80;
        var wg=offCtx.createGain(); wg.gain.setValueAtTime(0,1); wg.gain.linearRampToValueAtTime(.4,1.5); wg.gain.linearRampToValueAtTime(0,2.3);
        wo.connect(wg); wg.connect(vol); wo.start(1); wo.stop(Math.min(2.4,totalSec));
    }
};

MusicPrerender.prototype._noise=function(offCtx,dest,color,s,dur,fq,ft){
    var len=Math.ceil(offCtx.sampleRate*dur), buf=offCtx.createBuffer(1,len,offCtx.sampleRate), d=buf.getChannelData(0);
    if(color==='pink'){
        var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for(var i=0;i<len;i++){var w=Math.random()*2-1;b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)/10;b6=w*.115926;}
    } else if(color==='brown'){
        var last=0; for(var j=0;j<len;j++){var ww=Math.random()*2-1;d[j]=(last+.02*ww)/1.02;last=d[j];d[j]*=3.5;}
    } else { for(var k=0;k<len;k++) d[k]=Math.random()*2-1; }
    var src=offCtx.createBufferSource(); src.buffer=buf;
    var flt=offCtx.createBiquadFilter(); flt.type=ft; flt.frequency.value=fq;
    src.connect(flt); flt.connect(dest); src.start(s); src.stop(s+dur);
};

// ── WAV encoder (unchanged) ──
MusicPrerender.prototype._encWAV=function(buf){
    var nc=buf.numberOfChannels,sr=buf.sampleRate,n=buf.length,al=nc*2,ds=n*al;
    var ab=new ArrayBuffer(44+ds),v=new DataView(ab);
    function ws(o,s){ for(var i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); }
    ws(0,'RIFF'); v.setUint32(4,36+ds,true); ws(8,'WAVE'); ws(12,'fmt ');
    v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,nc,true);
    v.setUint32(24,sr,true); v.setUint32(28,sr*al,true); v.setUint16(32,al,true);
    v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,ds,true);
    var off=44;
    for(var i=0;i<n;i++) for(var ch=0;ch<nc;ch++){
        var x=Math.max(-1,Math.min(1,buf.getChannelData(ch)[i]));
        v.setInt16(off,x<0?x*0x8000:x*0x7FFF,true); off+=2;
    }
    return ab;
};

// ── playback (unchanged) ──
MusicPrerender.prototype.play=function(){
    if(!this.hasBlob||!this._audioEl){ console.warn('[MusicPrerender] blob ยังไม่พร้อม'); return; }
    var self=this; this._audioEl.volume=this._volume;
    this._audioEl.play().catch(function(e){
        console.error('[MusicPrerender] play failed',e);
        window.dispatchEvent(new CustomEvent('prerenderNeedsGesture',{bubbles:true}));
    });
};
MusicPrerender.prototype.pause=function(){ if(this._audioEl) this._audioEl.pause(); };
MusicPrerender.prototype.stop=function(){ if(this._audioEl){ this._audioEl.pause(); this._audioEl.currentTime=0; } this.isPlaying=false; this._syncIcon(false); };
MusicPrerender.prototype.toggle=function(){ this.isPlaying?this.pause():this.play(); };
MusicPrerender.prototype.setVolume=function(v){ this._volume=Math.max(0,Math.min(1,v)); if(this._audioEl) this._audioEl.volume=this._volume; };

MusicPrerender.prototype._reset=function(){
    this._abortFlag=true; this.stop(); this.hasBlob=false;
    if(this._blobUrl){ URL.revokeObjectURL(this._blobUrl); this._blobUrl=null; }
    this._blob=null;
    if(this._audioEl){ this._audioEl.src=''; this._audioEl.load(); }
    window.dispatchEvent(new CustomEvent('prerenderReset',{bubbles:true}));
};

MusicPrerender.prototype._n2f=function(n){
    if(typeof Tone!=='undefined'&&Tone.Frequency) try{ return Tone.Frequency(n).toFrequency(); }catch(e){}
    var NM={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    var m=(n||'').match(/^([A-G])(#|b?)(-?\d)$/); if(!m) return 440;
    var semi=NM[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);
    return 440*Math.pow(2,((parseInt(m[3])+1)*12+semi-69)/12);
};
MusicPrerender.prototype._syncIcon=function(p){ var ic=document.getElementById('playIcon'); if(ic) ic.className=p?'fas fa-pause':'fas fa-play'; };
MusicPrerender.prototype._emitState=function(p){
    window.dispatchEvent(new CustomEvent('playbackStateChanged',{detail:{isPlaying:p,source:'prerender'},bubbles:true}));
    window.dispatchEvent(new CustomEvent(p?'musicStarted':'musicStopped',{detail:{isPlaying:p},bubbles:true}));
};
MusicPrerender.prototype._dispatchProgress=function(pct,msg){
    window.dispatchEvent(new CustomEvent('prerenderProgress',{detail:{percent:pct,message:msg},bubbles:true}));
};

MusicPrerender.prototype.cleanup=function(){
    this._reset();
    if(this._audioEl&&this._audioEl.parentNode) this._audioEl.parentNode.removeChild(this._audioEl);
    this._audioEl=null; this._mp3Cache.clear();
};

// ── SINGLETON ──
window.MusicPrerenderController = new MusicPrerender();
document.addEventListener('DOMContentLoaded',function(){
    setTimeout(function(){
        window.MusicPrerenderController.initialize();
        console.log('[MusicPrerender] v'+window.MusicPrerender_VERSION+' ready');
    }, 450);
});
console.log('[MusicPrerender] v'+window.MusicPrerender_VERSION+' LOADED');