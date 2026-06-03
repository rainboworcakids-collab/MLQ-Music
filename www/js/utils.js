// ===================== utils.js =====================
// ฟังก์ชันช่วยเหลือทั่วไปสำหรับ MLQ Music Ecosystem

window.MLQUtils = (function() {
    'use strict';

    // ตรวจสอบรูปแบบวันที่ DD/MM/YYYY
    function isValidDateDDMMYYYY(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return false;
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateStr.match(regex);
        if (!match) return false;
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        if (month < 1 || month > 12) return false;
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > daysInMonth) return false;
        if (year < 1900 || year > new Date().getFullYear()) return false;
        return true;
    }

    // แปลงจาก YYYY-MM-DD เป็น DD/MM/YYYY
    function isoToDDMMYYYY(isoDate) {
        if (!isoDate) return '';
        const parts = isoDate.split('-');
        if (parts.length !== 3) return isoDate;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // แปลงจาก DD/MM/YYYY เป็น YYYY-MM-DD
    function ddmmYYYYtoISO(dateStr) {
        if (!isValidDateDDMMYYYY(dateStr)) return null;
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }

    // แสดงข้อความ Toast ชั่วคราว
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 bg-${type === 'error' ? 'red' : 'green'}-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity`;
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // เพิ่มฟังก์ชันอื่น ๆ ตามต้องการ (capitalize, debounce, ฯลฯ)

    return {
        isValidDate: isValidDateDDMMYYYY,
        isoToDDMMYYYY,
        ddmmYYYYtoISO,
        showToast
    };
})();

// ปล่อยให้ window สามารถเรียกใช้ได้โดยตรง
window.utils = window.MLQUtils;