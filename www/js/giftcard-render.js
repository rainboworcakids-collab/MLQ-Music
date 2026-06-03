// giftcard-render.js v2.0 - รองรับ playUrl (สร้าง QR อัตโนมัติ)
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function loadEditionCSS(edition) {
    const oldLink = document.querySelector('link[data-edition-css]');
    if (oldLink) oldLink.remove();
    const cssFile = `css/gift-card-${edition}.css?v=6.0`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssFile;
    link.setAttribute('data-edition-css', '');
    document.head.appendChild(link);
    console.log(`🎨 โหลด CSS edition: ${edition} (${cssFile})`);
}

function renderMLQGiftCard(container, data) {
    const {
        bgGradient, bgImageUrl, icon, receiverName, message,
        imageUrl, senderName, themeClass, qrDataUrl, playUrl, showBadge, isPreview
    } = data;

    let bgStyle = "";
    if (bgImageUrl) {
        bgStyle = `background-image: url('${bgImageUrl}'); background-size: cover; background-position: center;`;
    } else if (bgGradient) {
        bgStyle = `background: ${bgGradient};`;
    } else {
        bgStyle = `background: linear-gradient(135deg, #e0e7ff, #f3e8ff);`;
    }

    const imageHtml = imageUrl ? `<img src="${imageUrl}" class="mlq-uploaded-img" alt="gift image">` : '';
    const titleHtml = (receiverName && receiverName.trim() !== '')
        ? `<h3 class="mlq-card-title">${escapeHtml(receiverName)}</h3>`
        : '';
    const senderHtml = (senderName && senderName.trim() !== '')
        ? `<div class="mlq-sender"><i class="fas fa-gift"></i><span>— ${escapeHtml(senderName)}</span></div>`
        : '';

    let qrHtml = '';
    // ถ้ามี playUrl (ไม่ใช่ preview) ให้สร้าง QR element แบบ real-time
    if (playUrl && !isPreview) {
        const qrId = 'qr_' + Math.random().toString(36).substring(2, 8);
        qrHtml = `<div class="qr-in-card" id="${qrId}"><p><i class="fas fa-qrcode"></i> สแกนเพื่อฟังเพลง</p><div id="${qrId}_inner"></div></div>`;
        // จะสร้าง QR หลังจากใส่ DOM แล้ว (ดู setTimeout ข้างล่าง)
        setTimeout(() => {
            const containerElem = document.getElementById(qrId + '_inner');
            if (containerElem) {
                try {
                    new QRCode(containerElem, {
                        text: playUrl,
                        width: 120,
                        height: 120,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                } catch(e) { console.warn("QR creation failed", e); }
            }
        }, 10);
    } else if (qrDataUrl) {
        qrHtml = `<div class="qr-in-card"><p><i class="fas fa-qrcode"></i> สแกนเพื่อฟังเพลง</p><img src="${qrDataUrl}" width="120" height="120" style="border-radius:16px; box-shadow:0 5px 15px rgba(0,0,0,0.1); display:inline-block;"></div>`;
    } else if (isPreview) {
        qrHtml = `<div class="qr-in-card"><p><i class="fas fa-qrcode"></i> QR จะแสดงเมื่อสร้างซอง</p><div style="width:120px;height:120px;background:#eef2ff;margin:0 auto;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#a5b4fc;">🔲</div></div>`;
    }

    const badgeHtml = showBadge ? `<div class="mlq-badge">🧬 Music DNA | Powered by MLQ</div>` : '';
    const themeClassName = themeClass && themeClass.startsWith('theme-') ? themeClass : 'theme-classic';

    container.innerHTML = `
        <div class="mlq-premium-card ${themeClassName}">
            <div class="mlq-card-bg-layer" style="${bgStyle}">
                <div class="mlq-glass-shield">
                    <div class="greeting-icon">${icon || '🎵'}</div>
                    ${imageHtml}
                    ${titleHtml}
                    <p class="mlq-card-msg">${escapeHtml(message || '').replace(/\n/g, '<br>')}</p>
                    ${senderHtml}
                    ${qrHtml}
                    ${badgeHtml}
                </div>
            </div>
        </div>
    `;
}