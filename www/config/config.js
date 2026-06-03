// config/config.js MVP Edition V1.00
const MLQ_LINKS = {
    music_url: "https://rainboworcakids-collab.github.io/MLQ-Music/www/index.html",
    path_url: "https://rainboworcakids-collab.github.io/MLQ-Path/",
    studio_url: "https://rainboworcakids-collab.github.io/MLQ-Studio/",
    mission_url: "https://rainboworcakids-collab.github.io/Mission-MLQ/",
    upgrade_url: "https://rainboworcakids-collab.github.io/Mission-MLQ/upgrade.html"
};

// เปลี่ยนทุกปุ่มที่มี data-mlq-link เมื่อ DOM พร้อม
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-mlq-link]').forEach(el => {
        const key = el.dataset.mlqLink;
        if (MLQ_LINKS[key]) el.href = MLQ_LINKS[key];
    });
});
