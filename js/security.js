// ============================================================
// SECURITY MODULE - Firebase, Auth, Permissions, Premium
// ============================================================

// ============================================================
// FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBOBu3wp3GcA-VjwtqIt1PAYYpo_HXFhtU",
    authDomain: "yalla-kimya.firebaseapp.com",
    databaseURL: "https://yalla-kimya-default-rtdb.firebaseio.com",
    projectId: "yalla-kimya",
    storageBucket: "yalla-kimya.firebasestorage.app",
    messagingSenderId: "1052374689829",
    appId: "1:1052374689829:web:fbb815ab42d753e63377cc",
    measurementId: "G-B3SJFF8R1R"
};

firebase.initializeApp(firebaseConfig);
window.database = firebase.database();
window.storage = firebase.storage();
window.auth = firebase.auth();
window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// ============================================================
// AUTH STATE
// ============================================================
window.currentUser = null;
window.userData = null;
window.isAuthChecked = false;

// ============================================================
// CACHE SYSTEM - تحسين الأداء
// ============================================================
window.cache = {
    userData: null,
    progress: {},
    subscriptions: [],
    notifications: [],
    courses: [],
    lessons: [],
    exams: [],
    quizzes: [],
    timestamp: 0,
    ttl: 60000 // 1 دقيقة
};

function isCacheValid() {
    return window.cache.timestamp > 0 && (Date.now() - window.cache.timestamp) < window.cache.ttl;
}

function updateCache() {
    window.cache.userData = window.userData;
    window.cache.progress = window.userCourseProgress || {};
    window.cache.subscriptions = window.userSubscriptions || [];
    window.cache.notifications = window.notifications || [];
    window.cache.courses = window.allCourses || [];
    window.cache.lessons = window.allLessons || [];
    window.cache.exams = window.allExams || [];
    window.cache.quizzes = window.allQuizzes || [];
    window.cache.timestamp = Date.now();
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================
function initAuth() {
    window.auth.onAuthStateChanged((user) => {
        window.currentUser = user;
        window.isAuthChecked = true;
        
        updateUIForAuth(user);

        if (user) {
            loadUserData(user.uid);
            setTimeout(() => {
                if (typeof loadUserSubscriptions === 'function') loadUserSubscriptions(user.uid);
                if (typeof loadUserProgress === 'function') loadUserProgress(user.uid);
                if (typeof loadNotifications === 'function') loadNotifications(user.uid);
                // تحميل البيانات الأساسية فقط
                if (typeof loadCourses === 'function') loadCourses();
                if (typeof loadLessons === 'function') loadLessons();
                if (typeof loadExams === 'function') loadExams();
                if (typeof loadQuizzes === 'function') loadQuizzes();
                if (typeof loadLeaderboard === 'function') loadLeaderboard();
            }, 300); // تأخير بسيط لتجنب التحميل المتزامن
        } else {
            // تحميل البيانات للزوار
            if (typeof loadCourses === 'function') loadCourses();
            if (typeof loadLessons === 'function') loadLessons();
            if (typeof loadExams === 'function') loadExams();
            if (typeof loadQuizzes === 'function') loadQuizzes();
            if (typeof loadLeaderboard === 'function') loadLeaderboard();
        }
    });
}

function updateUIForAuth(user) {
    const guestElements = document.querySelectorAll('.guest-only');
    const userElements = document.querySelectorAll('.user-only');

    if (user) {
        guestElements.forEach(el => {
            el.style.display = 'none';
            el.style.setProperty('display', 'none', 'important');
        });
        userElements.forEach(el => {
            el.style.display = 'block';
            el.style.setProperty('display', 'block', 'important');
        });
        
        const atomsBadge = document.getElementById('atomsBadge');
        if (atomsBadge) atomsBadge.style.display = 'inline-flex';
        
        const notificationWrapper = document.getElementById('notificationWrapper');
        if (notificationWrapper) notificationWrapper.style.display = 'flex';
        
        if (window.userData) {
            updateUserUI(window.userData);
        } else {
            showUserSkeleton();
        }
    } else {
        guestElements.forEach(el => {
            el.style.display = 'block';
            el.style.setProperty('display', 'block', 'important');
        });
        userElements.forEach(el => {
            el.style.display = 'none';
            el.style.setProperty('display', 'none', 'important');
        });
        
        const atomsBadge = document.getElementById('atomsBadge');
        if (atomsBadge) atomsBadge.style.display = 'none';
        
        const notificationWrapper = document.getElementById('notificationWrapper');
        if (notificationWrapper) notificationWrapper.style.display = 'none';
        
        window.userData = null;
        closeUserMenu();
    }
}

function showUserSkeleton() {
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) avatarEl.textContent = '👤';
    const nameEl = document.getElementById('userNameDisplay');
    if (nameEl) nameEl.textContent = 'جاري التحميل...';
    const labelEl = document.getElementById('userMenuLabel');
    if (labelEl) labelEl.textContent = '...';
    const atomsEl = document.getElementById('atomsCount');
    if (atomsEl) atomsEl.textContent = '...';
    const userAtomsEl = document.getElementById('userAtomsCount');
    if (userAtomsEl) userAtomsEl.textContent = '...';
}

function updateUserUI(data) {
    const atoms = data.atoms || 0;
    const atomsEl = document.getElementById('atomsCount');
    if (atomsEl) atomsEl.textContent = atoms;
    const userAtomsEl = document.getElementById('userAtomsCount');
    if (userAtomsEl) userAtomsEl.textContent = atoms;
    const nameEl = document.getElementById('userNameDisplay');
    if (nameEl) nameEl.textContent = data.name || 'مستخدم';
    const labelEl = document.getElementById('userMenuLabel');
    if (labelEl) labelEl.textContent = data.name || 'حسابي';
    
    const avatar = data.photoURL || '';
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        if (avatar) {
            avatarEl.innerHTML = `<img src="${avatar}" alt="صورة">`;
        } else {
            avatarEl.textContent = (data.name || 'U')[0].toUpperCase();
        }
    }
}

function loadUserData(uid) {
    if (window.cache.userData && isCacheValid()) {
        window.userData = window.cache.userData;
        updateUserUI(window.userData);
        if (window.currentUser) updateUIForAuth(window.currentUser);
        return;
    }

    window.database.ref('users/' + uid).once('value', (snapshot) => {
        if (snapshot.exists()) {
            window.userData = snapshot.val();
            window.cache.userData = window.userData;
            updateCache();
            updateUserUI(window.userData);
            if (window.currentUser) updateUIForAuth(window.currentUser);
        } else {
            createNewUser(uid);
        }
    });
}

async function createNewUser(uid) {
    const email = window.auth.currentUser?.email || '';
    const code = await generateStudentCode();
    
    const newUser = {
        name: 'مستخدم',
        email: email,
        grade: '',
        studyType: 'عام',
        phone: '',
        parentPhone: '',
        code: code,
        atoms: 0,
        progress: 0,
        photoURL: '',
        createdAt: new Date().toISOString(),
        active: true,
        coursesCount: 0,
        lastActive: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 1,
        streak: 0,
        examsPassed: 0,
        quizzesPassed: 0,
        studyTime: 0,
        videosWatched: 0,
        lessonsCompleted: 0,
        rank: '--',
        perfectExams: 0,
        lastStudyDate: new Date().toDateString(),
        premiumCourses: {}
    };
    
    await window.database.ref('users/' + uid).set(newUser);
    window.userData = newUser;
    window.cache.userData = newUser;
    updateCache();
    updateUserUI(newUser);
    if (window.currentUser) updateUIForAuth(window.currentUser);
    if (typeof addNotification === 'function') {
        await addNotification(uid, '👋 مرحباً بك في يلا كيمياء!', 'نتمنى لك رحلة تعليمية ممتعة ومفيدة.', '🎉');
    }
}

async function logout() {
    try {
        if (typeof clearVideoTracking === 'function') clearVideoTracking();
        await window.auth.signOut();
        showToast('تم تسجيل الخروج', 'success');
        updateUIForAuth(null);
        window.cache = {
            userData: null,
            progress: {},
            subscriptions: [],
            notifications: [],
            courses: [],
            lessons: [],
            exams: [],
            quizzes: [],
            timestamp: 0,
            ttl: 60000
        };
        closeUserMenu();
        if (typeof showHome === 'function') showHome();
    } catch (error) {
        console.error('Logout error:', error);
        showToast('حدث خطأ في تسجيل الخروج', 'error');
    }
}

function closeUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const arrow = document.getElementById('userMenuArrow');
    if (dropdown) dropdown.classList.remove('open');
    if (arrow) arrow.classList.remove('open');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const arrow = document.getElementById('userMenuArrow');
    if (!dropdown) return;
    dropdown.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
}

function closeLoginOverlay() {
    document.getElementById('loginOverlay').classList.remove('open');
}

function showLoginOverlay() {
    document.getElementById('loginOverlay').classList.add('open');
}

// ============================================================
// PREMIUM SYSTEM - Course Permissions
// ============================================================
function hasPremiumAccess(courseId) {
    if (!window.currentUser) return false;
    if (!window.userData) return false;
    
    const course = window.allCourses?.find(c => c.id === courseId);
    if (course && course.isFree !== false) return true;
    
    const premiumCourses = window.userData.premiumCourses || {};
    return premiumCourses[courseId] === true;
}

async function checkCourseAccess(courseId) {
    if (!window.currentUser) {
        showLoginOverlay();
        return false;
    }
    const course = window.allCourses?.find(c => c.id === courseId);
    if (!course) {
        showToast('الكورس غير موجود', 'error');
        return false;
    }
    if (course.isFree !== false) return true;
    if (hasPremiumAccess(courseId)) return true;
    
    showPremiumPage(course);
    return false;
}

function showPremiumPage(course) {
    const main = document.getElementById('mainContent');
    if (!main) return;
    
    const contactInfo = {
        phone: '01012345678',
        telegram: 'https://t.me/yala_kamya_ziad_mabrok',
        whatsapp: 'https://whatsapp.com/channel/0029VbCAgCt5K3zMurVaeF1w/621'
    };
    
    main.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showHome()">
                <i class="fas fa-arrow-right"></i> العودة
            </button>
            
            <div class="card" style="padding:32px;margin-top:16px;text-align:center;border:2px solid var(--gold);">
                <div style="font-size:4rem;margin-bottom:12px;">💰</div>
                <h1 style="font-family:'Lalezar',cursive;font-size:2.5rem;color:var(--text);">
                    ${escapeHtml(course.title)}
                </h1>
                <div style="font-size:2rem;font-weight:700;color:var(--gold);margin:12px 0;">
                    ${course.price || 'جاري التحديد'} جنيه
                </div>
                <p style="color:var(--text2);margin-bottom:16px;line-height:1.8;">
                    ${escapeHtml(course.description) || 'هذا الكورس مدفوع، يمكنك الاشتراك للوصول إلى جميع محتوياته.'}
                </p>
                
                <div style="background:var(--bg);border-radius:var(--radius);padding:16px;margin:16px 0;text-align:right;">
                    <h4 style="color:var(--primary);margin-bottom:8px;">📞 للاشتراك والتواصل</h4>
                    <p style="font-size:0.9rem;color:var(--text2);">
                        <i class="fas fa-phone"></i> ${contactInfo.phone}
                    </p>
                    <p style="font-size:0.9rem;color:var(--text2);">
                        <i class="fab fa-telegram"></i> 
                        <a href="${contactInfo.telegram}" target="_blank" style="color:var(--primary);">${contactInfo.telegram}</a>
                    </p>
                    <p style="font-size:0.9rem;color:var(--text2);">
                        <i class="fab fa-whatsapp"></i> 
                        <a href="${contactInfo.whatsapp}" target="_blank" style="color:var(--primary);">قناة واتساب</a>
                    </p>
                </div>
                
                <button class="btn-primary" style="width:100%;justify-content:center;font-size:1.1rem;padding:16px;" 
                        onclick="window.open('${contactInfo.whatsapp}','_blank')">
                    <i class="fab fa-whatsapp"></i> تواصل للاشتراك
                </button>
                
                <div style="margin-top:12px;font-size:0.8rem;color:var(--text2);">
                    <i class="fas fa-info-circle"></i> بعد الاشتراك، سيتم تفعيل الكورس تلقائياً في حسابك
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// STUDENT CODE GENERATOR
// ============================================================
async function generateStudentCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const formatted = `YK-${code.substring(0,2)}-${code.substring(2,4)}-${code.substring(4)}`;
    const snapshot = await window.database.ref('users').orderByChild('code').equalTo(formatted).once('value');
    if (snapshot.exists()) {
        return generateStudentCode();
    }
    return formatted;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function formatPhoneNumber(phone) {
    if (!phone || phone === 'لم يحدد' || phone === '') return 'لم يحدد';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return 'لم يحدد';
    let formatted = '';
    for (let i = cleaned.length; i > 0; i -= 3) {
        const start = Math.max(0, i - 3);
        const chunk = cleaned.substring(start, i);
        formatted = (formatted ? ' ' : '') + chunk + (formatted ? ' ' : '');
    }
    return formatted.trim();
}

// ============================================================
// EXPOSE SECURITY API
// ============================================================
window.Security = {
    initAuth,
    logout,
    toggleUserMenu,
    closeLoginOverlay,
    showLoginOverlay,
    hasPremiumAccess,
    checkCourseAccess,
    showPremiumPage,
    generateStudentCode,
    updateUIForAuth,
    loadUserData,
    createNewUser,
    isCacheValid,
    updateCache
};
