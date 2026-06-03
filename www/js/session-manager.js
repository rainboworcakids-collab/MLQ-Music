// ===================== session-manager.js =====================
// จัดการ Session + Signature + ตรวจสอบกับ Edge Function

window.SessionManager = (function() {
    const SESSION_KEY = 'mlq_session';
    const EDGE_URL = `${window.SUPABASE_URL}/functions/v1/payment-webhook`;

    // ตรวจสอบ session ปัจจุบัน
    async function getCurrentSession() {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;
        try {
            const session = JSON.parse(sessionStr);
            // ตรวจสอบ signature และ expiry ผ่าน Edge Function
            const isValid = await verifySession(session.userId, session.signature);
            if (!isValid) {
                logout();
                return null;
            }
            return session;
        } catch(e) {
            return null;
        }
    }

    // ตรวจสอบความถูกต้องของ signature
    async function verifySession(userId, signature) {
        try {
            const response = await fetch(`${EDGE_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, signature })
            });
            const data = await response.json();
            return data.valid === true;
        } catch(err) {
            console.error('Verify session error:', err);
            return false;
        }
    }

    // บันทึก session ลง localStorage
    function setSession(sessionObj) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj));
    }

    // ลบ session (logout)
    function logout() {
        localStorage.removeItem(SESSION_KEY);
        // ไม่ clear ข้อมูล profile อื่นเพื่อให้ user กลับมา login ได้
        window.location.href = '/register.html';
    }

    // ดึงข้อมูล plan ปัจจุบัน (basic/premium/neuro)
    async function getCurrentPlan() {
        const session = await getCurrentSession();
        return session ? session.plan : 'basic';
    }

    // เช็คว่า feature ใดที่ user สามารถใช้ได้ (ตาม Feature Matrix)
    async function hasFeature(featureName) {
        const plan = await getCurrentPlan();
        const features = {
            melody2: ['premium', 'neuro'],
            download: ['premium', 'neuro'],
            timer: ['premium', 'neuro'],
            aiCoach: ['neuro'],
            fullMusicDNA: ['premium', 'neuro']
        };
        return features[featureName]?.includes(plan) || false;
    }

    return {
        getCurrentSession,
        verifySession,
        setSession,
        logout,
        getCurrentPlan,
        hasFeature
    };
})();