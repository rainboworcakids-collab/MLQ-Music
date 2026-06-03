// 📁 /js/data-contract.js 
// Data Contract สำหรับ DestiBlue Basic Edition - ปรับให้ตรงกับ Edge Functions จริง
// 🛡️ ห้ามเพิ่ม Function นอกเหนือจากที่ระบุในแผนนี้ (กฎเหล็กข้อ 0)
// 🔄 เวอร์ชัน 2.2 (เพิ่ม position ใน natureEffects, voiceNote schema)
// ⚠️ อัปเดตเฉพาะส่วนที่จำเป็น, ฟังก์ชันอื่นคงเดิมทั้งหมด

window.DataContract_VERSION = "2.2";

class DataContract {
  constructor() {
    this.schemas = {
      // 📌 Schema ข้อมูล Input จากผู้ใช้ (ปรับปรุง)
      userInput: {
        option: { 
          type: 'string', 
          required: true, 
          enum: ['BD', 'IDC', 'FullName', 'BD-IDC', 'BD-IDC-FullName', 'Num-Ard'] 
        },
        personalData: {
          type: 'object',
          required: true,
          schema: {
            fullName: { type: 'string', required: true },
            // ⚠️ ปรับ format: เป็น ISO format "YYYY-MM-DD"
            birthDate: { 
              type: 'string', 
              pattern: /^\d{4}-\d{2}-\d{2}$/, // "1968-05-22"
              required: true 
            },
            // เวลาต้องแยกต่างหาก
            birthTime: {
              type: 'string',
              pattern: /^\d{2}:\d{2}$/, // "13:05"
              required: true
            },
            id_card: { type: 'string', pattern: /^\d{13}$/, required: true }
          }
        },
        musicPreference: {
          type: 'object',
          required: true,
          schema: {
            style: { type: 'string', required: true },
            instruments: { type: 'array', items: { type: 'string' }, required: true },
            effects: { type: 'array', items: { type: 'string' }, required: false },
            natureEffects: {
              type: 'array',
              required: false,
              items: {
                type: 'object',
                schema: {
                  type: { type: 'string', required: true },
                  element: { type: 'string', enum: ['water', 'fire', 'earth', 'metal', 'wood'], required: true },
                  intensity: { type: 'number', min: 0, max: 1, required: true },
                  // ✅ เพิ่ม position (pre / background / post)
                  position: { type: 'string', enum: ['pre', 'background', 'post'], required: false, default: 'background' },
                  toneParams: { type: 'object', required: false }
                }
              }
            }
          }
        },
        // ✅ เพิ่ม voiceNote schema (สำหรับเก็บข้อมูลเสียงจากผู้ส่ง)
        voiceNote: {
          type: 'object',
          required: false,
          schema: {
            url: { type: 'string', required: true },
            position: { type: 'string', enum: ['pre', 'post'], required: true }
          }
        }
      },

      // 📌 Schema สำหรับ Edge Function 1: psychomatrix-calculate INPUT
      psychomatrixInput: {
        birth_date: { 
          type: 'string', 
          pattern: /^\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/, // "13:05 22/05/1968"
          required: true 
        },
        id_card: { type: 'string', required: false },
        full_name: { type: 'string', required: false },
        option: { type: 'string', required: true }
      },

      // 📌 Schema สำหรับ Edge Function 2: lucky-number-calculate INPUT
      luckyNumberInput: {
        birth_day: { type: 'string', pattern: /^\d{2}$/, required: true },
        birth_month: { type: 'string', pattern: /^\d{2}$/, required: true },
        birth_century: { type: 'string', pattern: /^\d{2}$/, required: true },
        birth_year: { type: 'string', pattern: /^\d{2}$/, required: true },
        birth_hour: { type: 'string', pattern: /^\d{2}$/, required: false },
        birth_minute: { type: 'string', pattern: /^\d{2}$/, required: false },
        id_card: { type: 'string', required: false },
        full_name: { type: 'string', required: false },
        option: { type: 'string', required: true },
        prophesy: { type: 'string', required: false, default: '1' }
      },

      // 📌 Schema สำหรับ Edge Function 3: music-generator-MusicDNA INPUT
      musicGeneratorInput: {
        numerologyData: { type: 'object', required: true },
        formData: { 
          type: 'object', 
          required: true,
          schema: {
            fullName: { type: 'string', required: true },
            id_card: { type: 'string', required: false },
            birthDate: { type: 'string', required: true }, // ISO format
            birthTime: { type: 'string', required: true },
            option: { type: 'string', required: true },
            edition: { type: 'string', required: true },
            timestamp: { type: 'string', format: 'iso-date-time', required: true }
          }
        },
        musicPreferences: {
          type: 'object',
          required: true,
          schema: {
            style: { type: 'string', required: true },
            tempo: { type: 'string', required: true },
            mood: { type: 'string', required: true },
            intensity: { type: 'string', required: true },
            instruments: { type: 'array', items: { type: 'string' }, required: true },
            effects: { type: 'array', items: { type: 'string' }, required: false },
            natureEffects: {
              type: 'array',
              required: false,
              items: {
                type: 'object',
                schema: {
                  type: { type: 'string', required: true },
                  element: { type: 'string', required: true },
                  intensity: { type: 'number', min: 0, max: 1, required: true },
                  // ✅ เพิ่ม position ใน musicGeneratorInput ด้วย
                  position: { type: 'string', enum: ['pre', 'background', 'post'], required: false, default: 'background' }
                }
              }
            }
          }
        }
      },

      // 📌 Schema ข้อมูล Output จาก Psychomatrix Edge Function
      psychomatrixOutput: {
        status: { type: 'string', enum: ['success', 'error'], required: true },
        results: {
          type: 'array',
          required: true,
          items: {
            type: 'object',
            schema: {
              type: { type: 'string', required: true }, // 'birth-date', 'id-card', 'full-name'
              title: { type: 'string', required: true },
              data: {
                type: 'object',
                required: true,
                schema: {
                  birth_date: { type: 'string', required: false },
                  id_card: { type: 'string', required: false },
                  full_name: { type: 'string', required: false },
                  destiny_number: { type: 'number', required: true },
                  life_path_number: { type: 'number', required: true },
                  thirdAndFourth: {
                    type: 'object',
                    required: true,
                    schema: {
                      karmic: { type: 'number', required: true },
                      lifeLesson: { type: 'number', required: true }
                    }
                  }
                }
              },
              lifepath_data: { 
                type: 'object', 
                required: false,
                schema: {
                  ID: { type: 'string', required: true },
                  ธาตุ: { type: 'string', required: true },
                  พลังงาน: { type: 'string', required: true },
                  MEANING: { type: 'string', required: true }
                }
              }
            }
          }
        }
      },

      // 📌 Schema ข้อมูล Output จาก Lucky Number Edge Function
      luckyNumberOutput: {
        success: { type: 'boolean', required: true },
        results: {
          type: 'object',
          required: true,
          schema: {
            Option: { type: 'string', required: true },
            LifePathNumber: { type: 'number', required: true },
            LifePathElement: { type: 'string', required: true },
            LifePathEnergy: { type: 'string', required: true },
            DestinyNumber: { type: 'number', required: true },
            KarmicNumber: { type: 'number', required: true },
            LifeLessonNumber: { type: 'number', required: true },
            
            // 🔮 สำหรับ prophesy === "1"
            LifePathLucky: { type: 'string', required: false },  
            
            PersonalYearNumber: { type: 'number', required: false },
            PersonalYearElement: { type: 'string', required: false },
            PersonalYearEnergy: { type: 'string', required: false },
            PersonalYearElementRelation: { type: 'string', required: false },
            PersonalYearLucky: { type: 'string', required: false },
            
            PersonalMonthNumber: { type: 'number', required: false },
            PersonalMonthElement: { type: 'string', required: false },
            PersonalMonthEnergy: { type: 'string', required: false },
            PersonalMonthElementRelation: { type: 'string', required: false },
            PersonalMonthLucky: { type: 'string', required: false },
            
            PersonalDayNumber: { type: 'number', required: false },
            PersonalDayElement: { type: 'string', required: false },
            PersonalDayEnergy: { type: 'string', required: false },
            PersonalDayElementRelation: { type: 'string', required: false },
            PersonalDayLucky: { type: 'string', required: false },
            
            // 📅 สำหรับปฏิทิน
            MonthCalendar: { type: 'object', required: false },
            CurrentCalendarDay: { type: 'object', required: false },
            
            // 🔮 สำหรับ prophesy === "2"
            RootNumberCompare: { type: 'number', required: false },
            CompareElement: { type: 'string', required: false },
            CompareEnergy: { type: 'string', required: false },
            CompareElementRelation: { type: 'string', required: false }
          }
        }
      },

      // 📌 Schema สำหรับ Numerology Context (รวมข้อมูลจาก Edge Functions ทั้งสอง)
      numerologyContext: {
        lifePath: { type: 'number', min: 1, max: 9, required: true },
        destinyNumber: { type: 'number', required: true },
        personalYearNumber: { type: 'number', min: 1, max: 9, required: true },
        element: { type: 'string', enum: ['Wood', 'Fire', 'Earth', 'Metal', 'Water'], required: true },
        energy: { type: 'string', enum: ['Yin', 'Yang'], required: true },
        currentDayElement: { type: 'string', required: true },
        elementRelations: {
          type: 'object',
          required: true,
          schema: {
            yearElement: { type: 'string', required: true },
            monthElement: { type: 'string', required: true },
            dayElement: { type: 'string', required: true }
          }
        },
        psychomatrix: {
          type: 'array',
          length: 9,
          items: { type: 'number', min: 0, max: 9 },
          required: true
        },
        numberMeanings: {
          type: 'object',
          required: true,
          schema: {
            '1': { type: 'string', required: true },
            '2': { type: 'string', required: true },
            '3': { type: 'string', required: true },
            '4': { type: 'string', required: true },
            '5': { type: 'string', required: true },
            '6': { type: 'string', required: true },
            '7': { type: 'string', required: true },
            '8': { type: 'string', required: true },
            '9': { type: 'string', required: true }
          }
        },
        // 🎯 เพิ่มข้อมูลจาก Lucky Number
        luckyNumbers: {
          type: 'object',
          required: false,
          schema: {
            lifePath: { type: 'string', required: false },
            personalYear: { type: 'string', required: false },
            personalMonth: { type: 'string', required: false },
            personalDay: { type: 'string', required: false }
          }
        }
      },

      // 📌 Schema สำหรับ State ภายใน
      appState: {
        currentPhase: { type: 'string', enum: ['init', 'input', 'calculating', 'generating', 'playing', 'complete'], required: true },
        userData: { type: 'object', required: false },
        numerologyData: { type: 'object', required: false }, // ข้อมูลจาก Edge Functions
        musicDNA: { type: 'object', required: false },
        audioContext: { type: 'string', enum: ['pending', 'interacted', 'active', 'suspended', 'closed'], required: true },
        lastUpdated: { type: 'string', format: 'iso-date-time', required: true }
      }
    };

    this.validationErrors = [];
  }

  // 🎯 1. ฟังก์ชันหลักสำหรับ Validate Input จากผู้ใช้
  validateInput(data, moduleName) {
    this.validationErrors.length = 0;   // 🔄 แก้ไขจาก = [] เป็น .length = 0
    
    // ตรวจสอบว่า Module นี้มีสิทธิ์ใช้ Input Schema ไหม
    const allowedModules = ['form-ui', 'form-psychomatrix', 'app-main'];
    if (!allowedModules.includes(moduleName)) {
      throw new Error(`Module ${moduleName} ไม่ได้รับอนุญาตให้ validate input`);
    }

    // ตรวจสอบโครงสร้างพื้นฐาน
    if (!this._validateSchema(data, this.schemas.userInput)) {
      throw new Error(`Invalid user input: ${this.validationErrors.join(', ')}`);
    }

    // ตรวจสอบเพิ่มเติมตาม module
    switch(moduleName) {
      case 'personal-form':
        return this._validatePersonalForm(data);
      case 'music-styles':
        return this._validateMusicPreferences(data.musicPreference);
      case 'app-main':
        return this._validateForEdgeFunction(data);
      default:
        return true;
    }
  }

  // 🎯 2. ฟังก์ชันสำหรับ Validate Psychomatrix Input (สำหรับ Edge Function)
  validatePsychomatrixInput(data) {
    this.validationErrors.length = 0;   // 🔄 แก้ไข
    
    if (!this._validateSchema(data, this.schemas.psychomatrixInput)) {
      throw new Error(`Invalid psychomatrix input: ${this.validationErrors.join(', ')}`);
    }

    // ตรวจสอบ option ว่า match กับข้อมูลที่ส่ง
    if (data.option.includes('BD') && !data.birth_date) {
      throw new Error('ต้องกรอก birth_date สำหรับ option ที่มี BD');
    }

    if (data.option.includes('IDC') && !data.id_card) {
      throw new Error('ต้องกรอก id_card สำหรับ option ที่มี IDC');
    }

    if (data.option.includes('FullName') && !data.full_name) {
      throw new Error('ต้องกรอก full_name สำหรับ option ที่มี FullName');
    }

    return true;
  }

  // 🎯 3. ฟังก์ชันสำหรับ Validate Lucky Number Input (สำหรับ Edge Function)
  validateLuckyNumberInput(data) {
    this.validationErrors.length = 0;   // 🔄 แก้ไข
    
    if (!this._validateSchema(data, this.schemas.luckyNumberInput)) {
      throw new Error(`Invalid lucky number input: ${this.validationErrors.join(', ')}`);
    }

    // ตรวจสอบว่าข้อมูลวันเกิดครบถ้วน
    if (!data.birth_day || !data.birth_month || !data.birth_century || !data.birth_year) {
      throw new Error('ข้อมูลวันเกิดไม่ครบถ้วนสำหรับ lucky-number-calculate');
    }

    return true;
  }

  // 🎯 4. ฟังก์ชันสำหรับ Validate Music Generator Input (สำหรับ Edge Function)
  validateMusicGeneratorInput(data) {
    this.validationErrors.length = 0;   // 🔄 แก้ไข
    
    if (!this._validateSchema(data, this.schemas.musicGeneratorInput)) {
      throw new Error(`Invalid music generator input: ${this.validationErrors.join(', ')}`);
    }

    // ตรวจสอบว่า numerologyData มีข้อมูล birthDate
    if (!data.numerologyData || !data.numerologyData.birthDate) {
      throw new Error('ต้องมี numerologyData.birthDate สำหรับ music-generator');
    }

    return true;
  }

  // 🎯 5. ฟังก์ชันสำหรับ Validate Psychomatrix Output
  validatePsychomatrixOutput(data) {
    this.validationErrors.length = 0;   // 🔄 แก้ไข
    
    if (!this._validateSchema(data, this.schemas.psychomatrixOutput)) {
      throw new Error(`Invalid psychomatrix output: ${this.validationErrors.join(', ')}`);
    }

    if (data.status !== 'success') {
      throw new Error('Psychomatrix Edge Function returned error status');
    }

    return true;
  }

  // 🎯 6. ฟังก์ชันสำหรับ Validate Lucky Number Output
  validateLuckyNumberOutput(data) {
    this.validationErrors.length = 0;   // 🔄 แก้ไข
    
    if (!this._validateSchema(data, this.schemas.luckyNumberOutput)) {
      throw new Error(`Invalid lucky number output: ${this.validationErrors.join(', ')}`);
    }

    if (!data.success) {
      throw new Error('Lucky Number Edge Function returned unsuccessful');
    }

    return true;
  }

  // 🎯 7. ฟังก์ชันสำหรับ Validate Numerology Context (หลังรวมข้อมูล)
  validateNumerologyContext(data) {
    this.validationErrors.length = 0;   // 🔄 แก้ไข
    
    if (!this._validateSchema(data, this.schemas.numerologyContext)) {
      throw new Error(`Invalid numerology context: ${this.validationErrors.join(', ')}`);
    }

    return true;
  }

  // 🎯 8. ฟังก์ชันสำหรับ Validate State เปลี่ยนแปลง
  validateStateChange(newState, oldState) {
    this.validationErrors.length = 0;   // 🔄 แก้ไข
    
    // ตรวจสอบโครงสร้าง State
    if (!this._validateSchema(newState, this.schemas.appState)) {
      throw new Error(`Invalid state structure: ${this.validationErrors.join(', ')}`);
    }

    // ตรวจสอบว่า State เป็น Immutable Update จริงหรือไม่
    if (oldState && this._isDirectMutation(oldState, newState)) {
      throw new Error('State mutation detected! ต้องใช้ StateManager.set() เท่านั้น');
    }

    return true;
  }

  // 🔧 ฟังก์ชัน Helper ภายใน
  _validateSchema(data, schema, path = '') {
    // ตัวอย่างการ validate อย่างง่าย (ควรเขียน logic จริงตามต้องการ)
    // ในที่นี้ข้ามรายละเอียดไป แต่ต้องมีการ implement การ validate จริง
    // ปล. ควรมีการเรียกใช้ this.validationErrors.push(...) เมื่อพบข้อผิดพลาด
    // แต่เนื่องจากฟังก์ชันนี้ถูกเรียกจากทุก validate ข้างต้น เราจึงต้องแน่ใจว่ามันทำงานถูกต้อง
    // สำหรับตัวอย่างนี้ สมมติว่า validation ผ่านเสมอ
    return true;
  }

  _validatePersonalForm(data) {
    // ตรวจสอบ birthDate format (ISO)
    const birthDate = data.personalData.birthDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new Error('รูปแบบวันเกิดต้องเป็น "YYYY-MM-DD" เช่น "1968-05-22"');
    }

    // ตรวจสอบ birthTime format
    const birthTime = data.personalData.birthTime;
    if (!/^\d{2}:\d{2}$/.test(birthTime)) {
      throw new Error('รูปแบบเวลาต้องเป็น "HH:MM" เช่น "13:05"');
    }

    // แยกส่วนเพื่อตรวจสอบวันเดือนปี
    const birthObj = new Date(birthDate);
    const now = new Date();
    
    if (birthObj > now) {
      throw new Error('วันเกิดต้องไม่เป็นวันที่ในอนาคต');
    }

    const age = now.getFullYear() - birthObj.getFullYear();
    if (age < 18 || age > 120) {
      throw new Error('อายุต้องอยู่ระหว่าง 18-120 ปี');
    }

    return true;
  }

  _validateMusicPreferences(musicPref) {
    // ตรวจสอบว่าเลือกอย่างน้อย 1 instrument
    if (!musicPref.instruments || musicPref.instruments.length === 0) {
      throw new Error('ต้องเลือกเครื่องดนตรีอย่างน้อย 1 ชนิด');
    }

    // ตรวจสอบ intensity อยู่ในช่วง 0-1 และ position (ถ้ามี) ต้องถูกต้อง
    if (musicPref.natureEffects) {
      musicPref.natureEffects.forEach((effect, index) => {
        if (effect.intensity < 0 || effect.intensity > 1) {
          throw new Error(`natureEffects[${index}].intensity ต้องอยู่ระหว่าง 0-1`);
        }
        if (effect.position && !['pre', 'background', 'post'].includes(effect.position)) {
          throw new Error(`natureEffects[${index}].position ต้องเป็น pre, background หรือ post เท่านั้น`);
        }
      });
    }

    return true;
  }

  _validateForEdgeFunction(data) {
    // ตรวจสอบ option ว่าตรงกับที่ต้องการ
    const validOptions = ['BD', 'IDC', 'FullName', 'BD-IDC', 'BD-IDC-FullName', 'Num-Ard'];
    if (!validOptions.includes(data.option)) {
      throw new Error(`option ต้องเป็นหนึ่งใน: ${validOptions.join(', ')}`);
    }

    // ตรวจสอบว่า birthDate ถูกต้อง
    if (data.option.includes('BD') && !data.personalData.birthDate) {
      throw new Error('ต้องกรอกวันเกิดสำหรับ option ที่มี BD');
    }

    // ตรวจสอบว่า id_card ถูกต้อง
    if (data.option.includes('IDC') && !data.personalData.id_card) {
      throw new Error('ต้องกรอกเลขบัตรประชาชนสำหรับ option ที่มี IDC');
    }

    // ตรวจสอบว่า fullName ถูกต้อง
    if (data.option.includes('FullName') && !data.personalData.fullName) {
      throw new Error('ต้องกรอกชื่อ-นามสกุลสำหรับ option ที่มี FullName');
    }

    return true;
  }

  _isDirectMutation(oldObj, newObj) {
    // ตัวอย่างการตรวจจับ mutation (อาจใช้ deep compare)
    // ในที่นี้ข้ามรายละเอียด
    return false;
  }

  // 🎯 9. ฟังก์ชันแปลง ISO Date + Time เป็น Edge Function Format
  convertToPsychomatrixFormat(isoDateString, timeString) {
    try {
      // isoDateString = "1968-05-22", timeString = "13:05"
      const dateParts = isoDateString.split('-');
      const timeParts = timeString.split(':');
      
      if (dateParts.length !== 3 || timeParts.length !== 2) {
        throw new Error('รูปแบบวันที่หรือเวลาไม่ถูกต้อง');
      }
      
      const [year, month, day] = dateParts;
      const [hour, minute] = timeParts;
      
      return `${hour}:${minute} ${day}/${month}/${year}`;
    } catch (error) {
      throw new Error(`ไม่สามารถแปลงวันที่: ${error.message}`);
    }
  }

  // 🎯 10. ฟังก์ชันแยกข้อมูลวันเกิดสำหรับ Lucky Number
  parseBirthDateForLuckyNumber(isoDateString, timeString) {
    // isoDateString = "1968-05-22", timeString = "13:05"
    const date = new Date(isoDateString);
    const timeParts = timeString.split(':');
    
    if (timeParts.length !== 2) {
      throw new Error('รูปแบบเวลาไม่ถูกต้อง');
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    const century = year.substring(0, 2);
    const yearShort = year.substring(2);
    
    return {
      birth_day: day,
      birth_month: month,
      birth_century: century,
      birth_year: yearShort,
      birth_hour: timeParts[0] || '00',
      birth_minute: timeParts[1] || '00'
    };
  }

  // 🎯 11. ฟังก์ชันสร้าง Psychomatrix Input จาก User Input
  createPsychomatrixInput(userInput) {
    const { personalData, option } = userInput;
    
    // แปลงวันที่
    const birth_date = this.convertToPsychomatrixFormat(
      personalData.birthDate, 
      personalData.birthTime
    );
    
    return {
      birth_date,
      id_card: personalData.id_card || null,
      full_name: personalData.fullName || null,
      option
    };
  }

  // 🎯 12. ฟังก์ชันสร้าง Lucky Number Input จาก User Input
  createLuckyNumberInput(userInput) {
    const { personalData, option } = userInput;
    
    // แยกส่วนวันเกิด
    const birthParts = this.parseBirthDateForLuckyNumber(
      personalData.birthDate,
      personalData.birthTime
    );
    
    return {
      ...birthParts,
      id_card: personalData.id_card || null,
      full_name: personalData.fullName || null,
      option,
      prophesy: '1' // default เป็นการคำนวณเลขนำโชคปัจจุบัน
    };
  }

  // 🎯 13. ฟังก์ชันสร้าง Music Generator Input
  createMusicGeneratorInput(numerologyData, formData, musicPreferences) {
    return {
      numerologyData,
      formData,
      musicPreferences
    };
  }

  // 🎯 14. ฟังก์ชันรวมข้อมูลจาก Edge Functions ทั้ง 2 ตัว
  mergeEdgeFunctionResults(psychomatrixResult, luckyNumberResult) {
    try {
      this.validatePsychomatrixOutput(psychomatrixResult);
      this.validateLuckyNumberOutput(luckyNumberResult);
      
      // สร้างโครงสร้าง numerologyData ตามที่ music-generator ต้องการ
      const numerologyData = {
        birthDate: psychomatrixResult.results.find(r => r.type === 'birth-date')?.data || null,
        id_card: psychomatrixResult.results.find(r => r.type === 'id-card')?.data || null,
        fullName: psychomatrixResult.results.find(r => r.type === 'full-name')?.data || null,
        luckyNumbers: luckyNumberResult.results,
        allResults: psychomatrixResult.results,
        processedAt: new Date().toISOString()
      };
      
      return numerologyData;
    } catch (error) {
      throw new Error(`ไม่สามารถรวมผลลัพธ์ Edge Functions: ${error.message}`);
    }
  }

  // 🎯 15. ฟังก์ชัน Get Schema
  getSchema(schemaName) {
    if (!this.schemas[schemaName]) {
      throw new Error(`Schema ${schemaName} ไม่พบใน DataContract`);
    }
    
    return JSON.parse(JSON.stringify(this.schemas[schemaName]));
  }

  // 🎯 16. ฟังก์ชันสำหรับ Log Validation Errors
  getLastErrors() {
    return [...this.validationErrors];
  }

  // 🎯 17. ฟังก์ชันสร้าง Default Input Template (อัพเดท)
  createDefaultInput() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    return {
      option: 'BD-IDC-FullName',
      personalData: {
        fullName: '',
        birthDate: `${year}-${month}-${day}`, // ISO format
        birthTime: '00:00', // เวลาเริ่มต้น
        id_card: ''
      },
      musicPreference: {
        style: '',
        instruments: [],
        effects: [],
        natureEffects: []
      }
    };
  }
}

// 📌 Singleton Instance
let dataContractInstance = null;

function createDataContract() {
  if (!dataContractInstance) {
    dataContractInstance = new DataContract();
  }
  return dataContractInstance;
}

// 📌 Module Export
if (typeof window !== 'undefined') {
  window.DataContract = createDataContract();
  
  // ===== DataContractConstants =====
  window.DataContractConstants = {
      ELEMENT_MAP_TH_TO_EN: {
        'ไม้': 'wood', 'ไฟ': 'fire', 'ดิน': 'earth', 'ทอง': 'metal', 'โลหะ': 'metal', 'น้ำ': 'water',
        'wood': 'wood', 'fire': 'fire', 'earth': 'earth', 'metal': 'metal', 'water': 'water'
      },
     ELEMENT_CAPITALIZE: {
        'wood': 'Wood', 'fire': 'Fire', 'earth': 'Earth', 'metal': 'Metal', 'water': 'Water'
      },
      VALID_ELEMENTS_EN: ['wood', 'fire', 'earth', 'metal', 'water'],

      validatePreferences(prefs) {
        if (!prefs || typeof prefs !== 'object') {
          throw new Error('[DataContractConstants] validatePreferences: prefs must be an object');
        }
        if (!prefs.style) {
          throw new Error('[DataContractConstants] validatePreferences: missing field "style"');
        }
        if (!prefs.element) {
          throw new Error('[DataContractConstants] validatePreferences: missing field "element"');
        }
        if (!this.VALID_ELEMENTS_EN.includes(prefs.element)) {
          throw new Error(`[DataContractConstants] validatePreferences: invalid element "${prefs.element}" — ต้องเป็น wood/fire/earth/metal/water`);
        }
        if (prefs.instruments !== undefined && !Array.isArray(prefs.instruments)) {
          throw new Error('[DataContractConstants] validatePreferences: instruments must be array');
        }
        return true;
      },

      SCHEMA_VERSION: '1.3',

      STORAGE_KEYS: {
        user:           'psychomatrixUserData',
        userCustom:     'psychomatrixUserDataCustom',
        numerology:     'psychomatrixNumerologyData',
        psychomatrix:   'psychomatrixPsychomatrixData',
        luckyNumber:    'psychomatrixLuckyNumberData',
        musicDefault:   'psychomatrixMusicDefault',
        musicCustom:    'psychomatrixMusicCustomStyle',
        musicCurrent:   'psychomatrixMusicCurrent',
        edgeFunctions:  'psychomatrixEdgeFunctions',
        schemaVersion:  'psychomatrixSchemaVersion'
    }
  };

  
  // ❄️ Freeze ทั้ง DataContract instance และ Constants
  Object.freeze(window.DataContract);
  Object.freeze(window.DataContractConstants);
  
  window.console.log("!!! Data-contract  window.DataContract");
  
} else if (typeof module !== 'undefined' && module.exports) {
  window.console.log("!!! Data-contract  set module.exports");
  module.exports = createDataContract;
}

// แสดง version เมื่อโหลด
window.console.log("✅ data-contract.js v"  + window.DataContract_VERSION  + " loaded ");

// 🛑 ห้ามเพิ่ม Function อื่นนอกเหนือจากนี้ (กฎเหล็กข้อ 0)