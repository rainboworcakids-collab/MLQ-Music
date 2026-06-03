// ===============================================
// nav.js (V11 - Static Nav + Menu Injection)
// ===============================================

console.log("📁 nav.js loaded (Menu Injection Mode)");

// ฟังก์ชันสร้างเมนู HTML (copy มาจาก nav-สำเนา.js แต่ปรับลิงก์ให้เหมาะกับ Mission-MLQ)
function generateMenuHTML() {
    return `
        <div class="max-w-7xl mx-auto px-4 sm:px-5 py-2 flex flex-wrap justify-center md:justify-start gap-4 text-sm">
            <a href="index.html" class="text-gray-600 hover:text-indigo-600 transition">
                <i class="fas fa-home mr-1"></i>หน้าหลัก
            </a>
            <a href="psychomatrix_hub.html" class="text-gray-600 hover:text-indigo-600 transition">
                <i class="fas fa-star-of-life mr-1"></i>Psychomatrix
            </a>
            <a href="missions.html" class="text-gray-600 hover:text-indigo-600 transition">
                <i class="fas fa-list-alt mr-1"></i>ภารกิจ
            </a>
            <a href="gallery.html" class="text-gray-600 hover:text-indigo-600 transition">
                <i class="fas fa-images mr-1"></i>ผลงาน
            </a>
            <a href="profile.html" class="text-gray-600 hover:text-indigo-600 transition">
                <i class="fas fa-user mr-1"></i>โปรไฟล์
            </a>
            <a href="notifications.html" class="text-gray-600 hover:text-indigo-600 transition">
                <i class="fas fa-bell mr-1"></i>การแจ้งเตือน
            </a>
            <!-- Admin (ซ่อนไว้ก่อน) -->
            <a href="admin_dashboard.html" id="admin-dashboard-menu" class="text-yellow-600 hover:text-yellow-700 transition hidden">
                <i class="fas fa-shield-alt mr-1"></i>Admin Dashboard
            </a>
        </div>
    `;
}

// ฟังก์ชันอัปเดตเมนู admin (แสดงเมื่อ role = admin)
function updateAdminMenuVisibility(isAdmin) {
    const adminMenu = document.getElementById('admin-dashboard-menu');
    if (adminMenu) {
        if (isAdmin) adminMenu.classList.remove('hidden');
        else adminMenu.classList.add('hidden');
    }
}

// ฟังก์ชันอัปเดต login/logout + user-display
function updateStaticNavMenu(session, userProfile) {
    const loginLink = document.getElementById('login-link');
    const userDisplay = document.getElementById('user-display');

    if (!loginLink) {
        console.warn("⚠️ ไม่พบ element #login-link");
        return;
    }

    const isLoggedIn = session && session.user;
    const isAdmin = userProfile?.role === 'admin';

    if (isLoggedIn) {
        // แสดงชื่อผู้ใช้ (ตัวเล็ก, อยู่เหนือปุ่ม)
        if (userDisplay) {
            const displayName = userProfile?.display_name || 
                                userProfile?.name || 
                                session.user.email?.split('@')[0] || 
                                'ผู้ใช้';
            userDisplay.textContent = displayName;
            userDisplay.classList.remove('hidden');
        }

        // เปลี่ยนปุ่ม login เป็น logout
        loginLink.href = '#';
        loginLink.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i>ออกจากระบบ';
        loginLink.onclick = (e) => {
            e.preventDefault();
            if (window.authStatusManager && window.authStatusManager.handleLogout) {
                window.authStatusManager.handleLogout();
            } else {
                console.error("❌ authStatusManager.handleLogout not found");
            }
        };
        loginLink.className = 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition shadow-sm';
    } else {
        if (userDisplay) userDisplay.classList.add('hidden');

        loginLink.href = 'login_supabase.html';
        loginLink.innerHTML = 'เข้าสู่ระบบ';
        loginLink.onclick = null;
        loginLink.className = 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition shadow-sm';
    }

    // อัปเดตเมนู admin
    updateAdminMenuVisibility(isAdmin);
    console.log(`✅ Nav updated: ${isLoggedIn ? 'LOGGED_IN' : 'GUEST'} (Admin: ${isAdmin})`);
}

// ฟังก์ชันเริ่มต้น: แทรกเมนู + อัปเดตสถานะ
function initNav() {
    const menuContainer = document.getElementById('MenuNAV');
    if (menuContainer && !menuContainer.hasAttribute('data-menu-injected')) {
        menuContainer.innerHTML = generateMenuHTML();
        menuContainer.setAttribute('data-menu-injected', 'true');
        console.log("✅ เรียกเมนูเพิ่มเติมลงใน #MenuNAV");
    } else {
        console.warn("⚠️ ไม่พบ #MenuNAV หรือมีเมนูอยู่แล้ว");
    }

    // รอ auth_status_manager โหลดเสร็จแล้วอัปเดต login/logout
    if (window.authStatusManager && window.authStatusManager.getSupabaseClient) {
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const supabase = await window.authStatusManager.getSupabaseClient();
                if (!supabase) return;
                const { data: { session } } = await supabase.auth.getSession();
                let userProfile = null;
                if (session && session.user) {
                    userProfile = await window.authStatusManager.fetchUserProfile(session.user);
                }
                updateStaticNavMenu(session, userProfile);
            } catch (err) {
                console.error("Error updating nav:", err);
            }
        });
    } else {
        console.warn("⚠️ authStatusManager not yet loaded, retrying...");
        setTimeout(initNav, 200);
    }
}

initNav();

// Export ฟังก์ชัน global
window.updateStaticNavMenu = updateStaticNavMenu;