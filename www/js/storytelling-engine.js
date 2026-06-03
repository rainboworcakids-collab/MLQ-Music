// storytelling-engin.js v1.3 (Phase 1 — Storytelling Trigger)
// หน้าที่: สร้างเรื่องราวจาก numerologyContext และ musicPreferences สำหรับแสดงใน UI
// Phase 1 Changes:
//   - เปลี่ยน trigger จาก musicPointerChanged → storyContextReady (dispatch ครั้งเดียวต่อ session)
//   - เพิ่ม dispatch storyFetching ก่อน generate (รองรับ loading state ใน UI)
//   - เพิ่ม error handling + dispatch storyError พร้อม fallbackStory
//   - เพิ่ม _fetchStoryFromSupabase() stub สำหรับ Phase 2
//   - storyGenerated payload เพิ่ม sessionId และ source field

window.StorytellingEngine_VERSION = '1.3';

console.log("[StorytellingEngine] 🔧 Module version v' + window.StorytellingEngine_VERSION +' - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_Storytelling = {
    constructor: true,
    generateStory: true,
    setupEventListeners: true,
    _buildFoundation: true,
    _buildHeartbeat: true,
    _buildSpark: true,
    _buildAtmosphere: true,
    _buildNote: true,
    _fetchStoryFromSupabase: true,  // Phase 2 stub
    _buildMusicPrefsFromDNA: true,  // Phase 1 helper
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_Storytelling[functionName]) {
        console.warn(`[StorytellingEngine] ⚠️ Unapproved function: ${functionName}`);
    }
}

// ========== 2. MAIN CLASS ==========
class StorytellingEngine {
    constructor() {
        verifyFunctionApproval('constructor');
        console.log("[StorytellingEngine] ✅   v' + window.StorytellingEngine_VERSION +' initialized (Phase 1 Storytelling Trigger)");
        this.setupEventListeners();
    }

    /**
     * สร้างเรื่องราวหลักสำหรับแสดงใน UI (foundation, heartbeat, spark, atmosphere, note)
     * @param {Object} numerologyContext - numerologyContext (lifePath, element, energy, destinyNumber, etc.)
     * @param {Object} musicPreferences - musicPreferences ตาม schema userInput.musicPreference
     * @returns {Object} storytelling object ที่มี properties: foundation, heartbeat, spark, atmosphere, note (optional)
     */
    generateStory(numerologyContext, musicPreferences) {
        verifyFunctionApproval('generateStory');
        console.log("[StorytellingEngine] 🔄 Generating story from numerology and music preferences");

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!numerologyContext) throw new Error("numerologyContext is required");
        if (!musicPreferences) throw new Error("musicPreferences is required");

        const { lifePath, element, energy, destinyNumber, karmicNumber, lifeLessonNumber } = numerologyContext;
        if (!lifePath) throw new Error("lifePath is required");
        if (!element) throw new Error("element is required");
        if (!energy) throw new Error("energy is required");

        const { style, tempo, mood, intensity, instruments, effects, natureEffects } = musicPreferences;
        if (!style) throw new Error("musicPreferences.style is required");
        if (!tempo) throw new Error("musicPreferences.tempo is required");
        if (!mood) throw new Error("musicPreferences.mood is required");
        if (!intensity) throw new Error("musicPreferences.intensity is required");
        if (!instruments || !Array.isArray(instruments) || instruments.length === 0) throw new Error("instruments must be a non-empty array");

        // 1. foundation (พื้นฐานของเพลง)
        const foundation = this._buildFoundation(element, lifePath, style);

        // 2. heartbeat (จังหวะ)
        const heartbeat = this._buildHeartbeat(lifePath, tempo, mood, intensity);

        // 3. spark (ประกาย / ความพิเศษ)
        const spark = this._buildSpark(energy, destinyNumber, effects);

        // 4. atmosphere (บรรยากาศ)
        const atmosphere = this._buildAtmosphere(element, natureEffects);

        // 5. note (หมายเหตุเพิ่มเติม) — optional
        let note = null;
        if (karmicNumber || lifeLessonNumber) {
            note = this._buildNote(karmicNumber, lifeLessonNumber);
        }

        console.log("[StorytellingEngine] ✅ Story generated");
        return { foundation, heartbeat, spark, atmosphere, note };
    }

    // ---------- private helpers ----------
    _buildFoundation(element, lifePath, style) {
        verifyFunctionApproval('_buildFoundation');
        const elementMap = {
            wood: 'ไม้',
            fire: 'ไฟ',
            earth: 'ดิน',
            metal: 'ทอง',
            water: 'น้ำ'
        };
        const elementThai = elementMap[element.toLowerCase()] || element;
        return `ดนตรีของคุณเกิดจากธาตุ${elementThai} และพลังชีวิตหมายเลข ${lifePath} สะท้อนผ่านแนวดนตรี ${style} ที่เรียบง่ายแต่ลึกซึ้ง`;
    }

    _buildHeartbeat(lifePath, tempo, mood, intensity) {
        verifyFunctionApproval('_buildHeartbeat');
        const moodMap = {
            confident: 'มั่นใจ',
            cooperative: 'ร่วมมือ',
            creative: 'สร้างสรรค์',
            stable: 'มั่นคง',
            adventurous: 'ผจญภัย',
            nurturing: 'อบอุ่น',
            analytical: 'วิเคราะห์',
            powerful: 'ทรงพลัง',
            compassionate: 'เมตตา'
        };
        const moodThai = moodMap[mood] || mood;
        return `หัวใจของเพลงเต้นที่ ${tempo} BPM สื่อถึงอารมณ์ ${moodThai} และความเข้มข้นระดับ ${intensity} ตามจังหวะชีวิตหมายเลข ${lifePath}`;
    }

    _buildSpark(energy, destinyNumber, effects) {
        verifyFunctionApproval('_buildSpark');
        const energyMap = {
            yin: 'หยิน (เย็น, รับ)',
            yang: 'หยาง (ร้อน, ให้)'
        };
        const energyThai = energyMap[energy.toLowerCase()] || energy;
        const effectsStr = effects && effects.length > 0 ? effects.join(', ') : 'ไม่มีเอฟเฟกต์พิเศษ';
        return `ประกายจากพลังงาน${energyThai} และเลขชะตา ${destinyNumber} ทำให้เกิดเอฟเฟกต์: ${effectsStr} เพิ่มมิติให้เสียง`;
    }

    _buildAtmosphere(element, natureEffects) {
        verifyFunctionApproval('_buildAtmosphere');
        const elementMap = {
            wood: 'ไม้',
            fire: 'ไฟ',
            earth: 'ดิน',
            metal: 'ทอง',
            water: 'น้ำ'
        };
        const elementThai = elementMap[element.toLowerCase()] || element;
        const natureStr = natureEffects && natureEffects.length > 0
            ? natureEffects.map(ne => ne.type).join(', ')
            : 'ไม่มีเสียงธรรมชาติ';
        return `บรรยากาศของธาตุ${elementThai} ผสานกับเสียงธรรมชาติ (${natureStr}) สร้างพื้นที่ทางอารมณ์ที่เป็นเอกลักษณ์`;
    }

    _buildNote(karmicNumber, lifeLessonNumber) {
        verifyFunctionApproval('_buildNote');
        let noteParts = [];
        if (karmicNumber) noteParts.push(`เลขกรรม ${karmicNumber}`);
        if (lifeLessonNumber) noteParts.push(`บทเรียนชีวิต ${lifeLessonNumber}`);
        return `หมายเหตุ: อิทธิพลจาก ${noteParts.join(' และ ')} ทำให้เพลงมีความลึกซึ้งมากยิ่งขึ้น`;
    }

    // ========== EVENT LISTENERS — Phase 1 ==========
    // เปลี่ยนจาก musicPointerChanged → storyContextReady
    // musicPointerChanged dispatch หลายครั้งต่อ session (ทุกครั้งสลับ style)
    // storyContextReady dispatch ครั้งเดียวต่อ session จาก form-psychomatrix
    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        console.log("[StorytellingEngine] 🔌 Setting up event listeners (Phase 1)");

        // ✅ Phase 1: ฟัง storyContextReady แทน musicPointerChanged
        window.addEventListener('storyContextReady', async (e) => {
            const { sessionId, numerologyContext, musicPrefs,
                    combinedDNA, supabaseEnabled } = e.detail || {};

            if (!numerologyContext) {
                console.warn("[StorytellingEngine] storyContextReady missing numerologyContext — skip");
                return;
            }

            console.log("[StorytellingEngine] 📖 storyContextReady received, sessionId:", sessionId,
                        "supabaseEnabled:", supabaseEnabled);

            // ── dispatch storyFetching ให้ UI แสดง loading state ──
            window.dispatchEvent(new CustomEvent('storyFetching', {
                detail: { sessionId, source: supabaseEnabled ? 'supabase' : 'local' },
                bubbles: true
            }));

            try {
                let story;

                if (supabaseEnabled) {
                    // Phase 2+: fetch จาก Supabase
                    story = await this._fetchStoryFromSupabase(sessionId, numerologyContext);
                } else {
                    // Phase 1: generate จาก local template
                    // musicPrefs อาจมีครบจาก payload แล้ว ถ้าไม่มีให้ build จาก combinedDNA
                    const prefs = musicPrefs || this._buildMusicPrefsFromDNA(combinedDNA?.defaultDNA);
                    story = this.generateStory(numerologyContext, prefs);
                }

                window.dispatchEvent(new CustomEvent('storyGenerated', {
                    detail: {
                        story,
                        sessionId,
                        source:  supabaseEnabled ? 'supabase' : 'local',
                        storyId: story.id ?? null,
                    },
                    bubbles: true
                }));
                console.log("[StorytellingEngine] ✅ Story generated (source: local), sessionId:", sessionId);

            } catch (error) {
                console.error("[StorytellingEngine] ❌ Story generation failed:", error.message);

                // fallback: generate local แม้ Supabase fail
                let fallbackStory = null;
                try {
                    const prefs = musicPrefs || this._buildMusicPrefsFromDNA(combinedDNA?.defaultDNA);
                    fallbackStory = this.generateStory(numerologyContext, prefs);
                } catch (fbErr) {
                    console.error("[StorytellingEngine] ❌ Fallback story also failed:", fbErr.message);
                }

                window.dispatchEvent(new CustomEvent('storyError', {
                    detail: { sessionId, error: error.message, fallbackStory },
                    bubbles: true
                }));
            }
        });

        console.log("[StorytellingEngine] ✅ Event listeners setup complete (Phase 1)");
    }

    // ─── Phase 2 stub ─────────────────────────────────────────────
    // ใน Phase 2 implement จริง: fetch story จาก Supabase by sessionId
    // ถ้าไม่พบ → ค้นหา template ที่ match lifePath+element+style
    async _fetchStoryFromSupabase(sessionId, numerologyContext) {
        verifyFunctionApproval('_fetchStoryFromSupabase');
        // TODO Phase 2:
        // const { data } = await supabase
        //   .from('stories')
        //   .select('*')
        //   .eq('session_id', sessionId)
        //   .single();
        // if (data) return data;
        // return this._matchTemplate(numerologyContext);
        throw new Error('Supabase not enabled in this edition (Phase 1)');
    }

    // ─── Helper: build musicPrefs จาก DNA object ─────────────────
    _buildMusicPrefsFromDNA(dna) {
        verifyFunctionApproval('_buildMusicPrefsFromDNA');
        if (!dna) return { style: 'lofi', tempo: 85, mood: 'calm', intensity: 'medium', instruments: ['piano'], effects: [], natureEffects: [] };
        const cfg = dna.config || {};
        return {
            style:        cfg.style        || dna.style        || 'lofi',
            tempo:        cfg.bpm          || dna.tempo        || 85,
            mood:         cfg.mode         || dna.mood         || 'calm',
            intensity:    cfg.intensity    || dna.intensity    || 'medium',
            instruments:  dna.instruments  || cfg.instruments  || ['piano'],
            effects:      dna.effects      || cfg.effects      || [],
            natureEffects:dna.natureEffects|| cfg.natureEffects|| [],
        };
    }

    // ========== ฟังก์ชันเดิมที่ปรับปรุงให้รับ numerologyContext (ไม่ใช้ birthDate) ==========
    /**
     * (คงไว้เพื่อความเข้ากันได้) สร้างเรื่องราวแบบ chapters — อาจไม่ถูกเรียกใช้จริง
     */
    buildNumerologyToMusicStory(numerologyContext, musicPreferences) {
        console.log("[StorytellingEngine] 🔄 Building chapter story (legacy)");
        const story = this.generateStory(numerologyContext, musicPreferences);
        // สร้าง chapters อย่างง่ายจาก story components
        const chapters = [
            {
                title: "รากฐานของเพลง",
                content: story.foundation,
                duration: "0:00-0:30",
                visualElements: ["foundation_icon"],
                audioCues: ["gentle_intro"]
            },
            {
                title: "จังหวะชีวิต",
                content: story.heartbeat,
                duration: "0:31-1:00",
                visualElements: ["rhythm_icon"],
                audioCues: ["heartbeat_beat"]
            },
            {
                title: "ประกายและพลัง",
                content: story.spark,
                duration: "1:01-1:30",
                visualElements: ["spark_icon"],
                audioCues: ["spark_sound"]
            },
            {
                title: "บรรยากาศโดยรอบ",
                content: story.atmosphere,
                duration: "1:31-2:00",
                visualElements: ["atmosphere_icon"],
                audioCues: ["ambient"]
            }
        ];
        if (story.note) {
            chapters.push({
                title: "หมายเหตุพิเศษ",
                content: story.note,
                duration: "2:01-2:30",
                visualElements: ["note_icon"],
                audioCues: ["note_sound"]
            });
        }
        return {
            title: "การสร้างดนตรีจากศาสตร์ตัวเลข",
            subtitle: "ทำไมเพลงของคุณถึงฟังแบบนี้?",
            chapters: chapters,
            totalDuration: "2:30 นาที",
            type: "numerology_explanation"
        };
    }

    // ========== ฟังก์ชันสร้าง chapter เดี่ยว (สำหรับเรียกจากภายนอก) ==========
    createIntroductionChapter(numerologyContext) {
        const { element, lifePath } = numerologyContext;
        if (!element) throw new Error("element required");
        if (!lifePath) throw new Error("lifePath required");
        const elementMap = {
            wood: 'ไม้',
            fire: 'ไฟ',
            earth: 'ดิน',
            metal: 'ทอง',
            water: 'น้ำ'
        };
        const elementThai = elementMap[element.toLowerCase()] || element;
        return {
            title: "การเดินทางจากตัวเลขสู่เสียงดนตรี",
            content: `
                ศาสตร์ตัวเลขเผยให้เห็น DNA ดนตรีที่ซ่อนอยู่ภายในคุณ
                <br><br>
                <strong>ธาตุ${elementThai}</strong> และ <strong>เลขชีวิต ${lifePath}</strong>
                เป็นกุญแจสำคัญที่กำหนดลักษณะเพลงของคุณ
                <br><br>
                มาค้นหาว่าตัวเลขเหล่านี้แปลงเป็นดนตรีได้อย่างไร...
            `,
            visualElements: ["numerology_spiral", "music_notes_rising"],
            audioCues: ["mystery_intro", "gentle_bell"],
            duration: "0:00-0:25"
        };
    }

    createElementChapter(element, musicPreferences) {
        const elementMap = {
            wood: 'ไม้',
            fire: 'ไฟ',
            earth: 'ดิน',
            metal: 'ทอง',
            water: 'น้ำ'
        };
        const elementThai = elementMap[element.toLowerCase()] || element;
        const elementDescriptions = {
            wood: "พลังแห่งการเติบโตและความยืดหยุ่น",
            fire: "พลังแห่งความหลงใหลและการเปลี่ยนแปลง",
            earth: "พลังแห่งความมั่นคงและการดูแล",
            metal: "พลังแห่งความคมชัดและความละเอียด",
            water: "พลังแห่งการไหลเวียนและการปรับตัว"
        };
        const description = elementDescriptions[element.toLowerCase()] || "พลังแห่งธาตุ";
        return {
            title: `พลังของธาตุ${elementThai}`,
            content: `
                <strong>ธาตุ${elementThai}</strong> ในตัวคุณ ${description}
                <br><br>
                นี่คือเหตุผลที่เลือก:
                <ul>
                    <li><strong>แนวเพลง ${musicPreferences.style}</strong> - สะท้อนธรรมชาติของธาตุ${elementThai}</li>
                    <li><strong>เครื่องดนตรีหลัก</strong> - ${musicPreferences.instruments.slice(0, 2).join(', ')}</li>
                    <li><strong>เอฟเฟกต์ธรรมชาติ</strong> - ${musicPreferences.natureEffects?.map(e => e.type).join(', ') || 'เสียงธรรมชาติที่เสริมพลังธาตุ'}</li>
                </ul>
                ธาตุ${elementThai}กำหนดโทนเสียงและอารมณ์พื้นฐานของเพลงคุณ
            `,
            visualElements: [`element_${element}_glow`, "instrument_floating"],
            audioCues: ["element_transition", `${element}_ambience`],
            duration: "0:26-0:50"
        };
    }

    createLifePathChapter(lifePathNumber, musicPreferences) {
        const lifePathMeanings = {
            1: "ความเป็นผู้นำและการเริ่มต้น",
            2: "การร่วมมือและความสมดุล",
            3: "ความคิดสร้างสรรค์และการสื่อสาร",
            4: "ความมั่นคงและโครงสร้าง",
            5: "การเปลี่ยนแปลงและอิสรภาพ",
            6: "ความรับผิดชอบและการดูแล",
            7: "ปัญญาและการวิเคราะห์",
            8: "ความมั่งคั่งและอำนาจ",
            9: "จิตวิญญาณและการให้"
        };
        const meaning = lifePathMeanings[lifePathNumber];
        if (!meaning) throw new Error(`Invalid lifePathNumber: ${lifePathNumber}`);

        return {
            title: `จังหวะชีวิตจากเลข ${lifePathNumber}`,
            content: `
                <strong>เลขชีวิต ${lifePathNumber}</strong> แสดงถึง ${meaning}
                <br><br>
                เลขชีวิตนี้กำหนด:
                <ul>
                    <li><strong>จังหวะ ${musicPreferences.tempo} BPM</strong> - สะท้อนจังหวะการเดินทางชีวิตของคุณ</li>
                    <li><strong>อารมณ์ ${musicPreferences.mood}</strong> - ดนตรีจะพาคุณไปสู่ความรู้สึกนี้</li>
                    <li><strong>ความเข้มข้น ${musicPreferences.intensity}</strong> - ระดับพลังงานที่เหมาะกับตัวคุณ</li>
                </ul>
                จังหวะดนตรีนี้คือจังหวะชีวิตที่ซ่อนอยู่ใน DNA ของคุณ
            `,
            visualElements: ["life_path_glow", "rhythm_waves"],
            audioCues: ["heartbeat_rhythm", "melodic_motif"],
            duration: "0:51-1:15"
        };
    }

    createEnergyChapter(energy, musicPreferences) {
        const energyNames = {
            yin: 'หยิน (เย็น, รับ)',
            yang: 'หยาง (ร้อน, ให้)'
        };
        const energyThai = energyNames[energy.toLowerCase()] || energy;
        const energyEffects = {
            yin: "เสียงที่นุ่มนวล ลึกซึ้ง และไพเราะ",
            yang: "เสียงที่คมชัด มีพลัง และตัดขาด"
        };
        const effectDesc = energyEffects[energy.toLowerCase()] || "เสียงที่เหมาะสมกับพลังงาน";
        return {
            title: `พลังงาน${energyThai}`,
            content: `
                พลังงาน<strong>${energy}</strong> ในตัวคุณสร้าง:
                <br><br>
                ${effectDesc}
                <br><br>
                เอฟเฟกต์ที่เลือกเพื่อเสริมพลังนี้:
                <ul>
                    ${musicPreferences.effects?.map(effect => 
                        `<li><strong>${effect}</strong> - ทำให้เสียงมีมิติและความลึกตามพลังงาน${energy}</li>`
                    ).join('') || '<li>เอฟเฟกต์ที่ปรับให้เหมาะกับพลังงานของคุณ</li>'}
                </ul>
                พลังงาน${energy}กำหนดพื้นผิวและความรู้สึกของเสียงดนตรี
            `,
            visualElements: [`energy_${energy}_flow`, "sound_waves"],
            audioCues: ["energy_shift", "texture_layer"],
            duration: "1:16-1:40"
        };
    }

    createDestinyChapter(destinyNumber, musicPreferences) {
        const isMasterNumber = [11, 22, 33].includes(destinyNumber);
        const complexity = isMasterNumber ? 'สูงมาก' : (destinyNumber < 10 ? 'ปานกลาง' : 'ซับซ้อน');
        return {
            title: `ความซับซ้อนจากเลขชะตา ${destinyNumber}`,
            content: `
                <strong>เลขชะตา ${destinyNumber}</strong> บ่งบอกถึงความซับซ้อนในชีวิตคุณ
                <br><br>
                เลขชะตานี้กำหนดระดับความซับซ้อนของดนตรี:
                <ul>
                    <li><strong>ระดับความซับซ้อน: ${complexity}</strong></li>
                    <li><strong>ความกลมกลืน: ${musicPreferences.musicalParameters?.harmony || 'สมดุล'}</strong></li>
                    <li><strong>ชั้นเสียง: ${musicPreferences.musicalParameters?.layers || 3} ชั้น</strong></li>
                </ul>
                ${isMasterNumber ? 
                    'เลข Master Number ทำให้ดนตรีมีชั้นเชิงและความลึกพิเศษ' : 
                    'ความสมดุลระหว่างความเรียบง่ายและความซับซ้อน'}
            `,
            visualElements: ["destiny_web", "complex_layers"],
            audioCues: ["harmonic_progression", "layer_build"],
            duration: "1:41-2:05"
        };
    }

    createKarmaChapter(karmicNumber, lifeLessonNumber, musicPreferences) {
        const karmaElements = [];
        if (karmicNumber) {
            karmaElements.push(`
                <strong>เลขกรรม ${karmicNumber}</strong> 
                - สร้างลักษณะพิเศษในดนตรี: ${musicPreferences.specialCharacteristics?.join(', ') || 'ลีลาที่เป็นเอกลักษณ์'}
            `);
        }
        if (lifeLessonNumber) {
            karmaElements.push(`
                <strong>บทเรียนชีวิต ${lifeLessonNumber}</strong>
                - สะท้อนผ่านดนตรีในรูปแบบของ ${musicPreferences.karmaEffect || 'ความสมดุล'}
            `);
        }
        if (karmaElements.length === 0) throw new Error("No karma data provided");
        return {
            title: "บทเรียนและกรรมในเสียงดนตรี",
            content: `
                ประสบการณ์ชีวิตที่ผ่านมาสร้างรอยประทับในดนตรี:
                <br><br>
                ${karmaElements.join('<br><br>')}
                <br><br>
                นี่คือเสียงดนตรีที่บันทึกเรื่องราวและบทเรียนของคุณ
            `,
            visualElements: ["karma_spiral", "memory_fragments"],
            audioCues: ["karmic_theme", "lesson_melody"],
            duration: "2:06-2:30"
        };
    }

    createConclusionChapter(numerologyContext, musicPreferences) {
        const { element, lifePath, energy, destinyNumber } = numerologyContext;
        const elementMap = {
            wood: 'ไม้',
            fire: 'ไฟ',
            earth: 'ดิน',
            metal: 'ทอง',
            water: 'น้ำ'
        };
        const elementThai = elementMap[element.toLowerCase()] || element;
        const energyThai = energy ? (energy.toLowerCase() === 'yin' ? 'หยิน' : 'หยาง') : 'หยิน';
        return {
            title: "การผสมผสานที่สมบูรณ์",
            content: `
                <strong>การผสานพลังทั้ง 5:</strong>
                <br><br>
                1. <strong>ธาตุ${elementThai}</strong> - ให้แนวเพลงและเครื่องดนตรี
                <br>
                2. <strong>เลขชีวิต ${lifePath}</strong> - ให้จังหวะและอารมณ์
                <br>
                3. <strong>พลังงาน${energyThai}</strong> - ให้เอฟเฟกต์และพื้นผิว
                <br>
                4. <strong>เลขชะตา ${destinyNumber || 'ไม่ระบุ'}</strong> - ให้ความซับซ้อน
                <br>
                5. <strong>เลขกรรมและบทเรียน</strong> - ให้ความลึกและเอกลักษณ์
                <br><br>
                นี่คือเพลงที่สร้างขึ้นจาก DNA ตัวเลขของคุณโดยเฉพาะ
                ทุกโน้ต ทุกจังหวะ มีที่มาจากตัวเลขในชีวิตคุณ
            `,
            visualElements: ["full_synthesis", "dna_strand_music"],
            audioCues: ["full_orchestra", "resolution_chord"],
            duration: "2:31-3:00"
        };
    }

    displayNumerologyStory(numerologyStory) {
        const container = document.createElement('div');
        container.className = 'numerology-story-container';
        container.innerHTML = `
            <div class="numerology-story-header">
                <h2>${numerologyStory.title}</h2>
                <p class="subtitle">${numerologyStory.subtitle}</p>
            </div>
            <div class="story-chapters">
                ${numerologyStory.chapters.map((chapter, index) => `
                    <div class="story-chapter" data-chapter="${index}">
                        <div class="chapter-timeline">
                            <span class="chapter-duration">${chapter.duration}</span>
                            <div class="timeline-bar"></div>
                        </div>
                        <h3 class="chapter-title">${chapter.title}</h3>
                        <div class="chapter-content">${chapter.content}</div>
                        ${chapter.visualElements ? `
                            <div class="chapter-visuals">
                                ${chapter.visualElements.map(visual => `<span class="visual-badge">${visual}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="story-footer">
                <p class="story-meta">
                    เรื่องราวนี้สร้างขึ้นจากข้อมูลตัวเลขของคุณโดยเฉพาะ
                    <br>
                    ใช้เวลาประมาณ ${numerologyStory.totalDuration}
                </p>
            </div>
        `;
        return container;
    }

    createNumerologySummary(numerologyContext, musicPreferences) {
        const { element, lifePath, energy } = numerologyContext;
        const elementMap = {
            wood: 'ไม้',
            fire: 'ไฟ',
            earth: 'ดิน',
            metal: 'ทอง',
            water: 'น้ำ'
        };
        const elementThai = elementMap[element.toLowerCase()] || element;
        const energyThai = energy ? (energy.toLowerCase() === 'yin' ? 'หยิน' : 'หยาง') : 'หยิน';
        return {
            title: "สรุปการแปลง Numerology เป็นดนตรี",
            items: [
                {
                    label: "ธาตุหลัก",
                    value: elementThai,
                    explanation: "กำหนดแนวเพลงและเครื่องดนตรี"
                },
                {
                    label: "เลขชีวิต",
                    value: lifePath,
                    explanation: "กำหนดจังหวะและอารมณ์"
                },
                {
                    label: "พลังงาน",
                    value: energyThai,
                    explanation: "กำหนดเอฟเฟกต์และพื้นผิวเสียง"
                },
                {
                    label: "แนวเพลงที่ได้",
                    value: musicPreferences.style,
                    explanation: "จากพลังธาตุในตัวคุณ"
                },
                {
                    label: "เครื่องดนตรีหลัก",
                    value: musicPreferences.instruments?.slice(0, 3).join(', ') || 'ไม่ระบุ',
                    explanation: "เลือกตามลักษณะธาตุ"
                }
            ],
            conclusion: "เพลงนี้สร้างจาก DNA ตัวเลขของคุณโดยเฉพาะ"
        };
    }
}

// ========== 3. CREATE INSTANCE AND EXPORT ==========
const instance = new StorytellingEngine();

// ✅ Export ตามแผน (G8) — Phase 1 เพิ่ม generateStory + _buildMusicPrefsFromDNA
window.StorytellingEngine = {
    generateStory:          (numerologyContext, musicPreferences) => instance.generateStory(numerologyContext, musicPreferences),
    _buildMusicPrefsFromDNA:(dna)                                 => instance._buildMusicPrefsFromDNA(dna),
};

// ========== 4. PLACEHOLDER FOR STORY-TEMPLATES (F3) ==========
// TODO F3: import story-templates in phase 10
// const lifePathStories = window.LifePathStories;
// const elementStories  = window.ElementStories;
// const musicStyleStories = window.MusicStyleStories;
// const numberFrequencyStories = window.NumberFrequencyStories;

console.log("[StorytellingEngine] ✅  v' + window.StorytellingEngine_VERSION +' loaded and exported (Phase 1 Storytelling Trigger)");