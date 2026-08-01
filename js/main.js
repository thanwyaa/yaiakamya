// ============================================================
// MAIN MODULE - Home Page, Navigation, Dashboard UI
// ============================================================

function applyTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
}

if (localStorage.getItem('theme') === 'dark') applyTheme(true);

function showHome() { 
    loadHomePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToCourses() {
    const section = document.getElementById('coursesSection');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    } else {
        showHome();
        setTimeout(() => {
            const sec = document.getElementById('coursesSection');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
    closeUserMenu();
}

const APP_URL = 'https://yaiakamya.vercel.app/';
const SHARE_TEXT = 
    `🔥 لو عايز تبدأ الكيمياء صح وتفهم المنهج من الصفر لحد الاحتراف، فـ منصة يلا كيمياء مع مستر زياد مبروك هتساعدك توصل لهدفك خطوة بخطوة.\n\n📚 شرح مبسط وسهل\n📝 اختبارات وتقييمات مستمرة\n🏆 نظام ذرات ومتصدرين\n📈 متابعة مستمرة لمستواك\n🔔 إشعارات فورية بكل جديد\n📱 تعمل على جميع الأجهزة\n\nابدأ رحلتك دلوقتي 👇\n${APP_URL}`;

function shareOn(platform) {
    const text = encodeURIComponent(SHARE_TEXT);
    const url = encodeURIComponent(APP_URL);
    const links = {
        whatsapp: `https://wa.me/?text=${text}`,
        telegram: `https://t.me/share/url?url=${url}&text=${text}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
    };
    window.open(links[platform] || links.whatsapp, '_blank');
}

function showCompletedModal() {
    document.getElementById('completedModal').classList.add('open');
}

function closeCompletedModal() {
    document.getElementById('completedModal').classList.remove('open');
}

function openImageZoom(src) {
    const overlay = document.getElementById('imageOverlay');
    const img = document.getElementById('zoomedImage');
    if (overlay && img) {
        img.src = src;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageZoom() {
    const overlay = document.getElementById('imageOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

window.notifications = [];

function loadNotifications(uid) {
    window.database.ref('users/' + uid + '/notifications').on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            window.notifications = Object.values(data).sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        } else {
            window.notifications = [];
        }
        updateNotificationBadge();
        window.cache.notifications = window.notifications;
    });
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const unread = window.notifications.filter(n => !n.read).length;
    if (unread > 0) {
        badge.classList.add('show');
        badge.textContent = unread > 99 ? '99+' : unread;
    } else {
        badge.classList.remove('show');
    }
}

function showNotificationsPage() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    const unreadCount = window.notifications.filter(n => !n.read).length;

    main.innerHTML = `
        <div class="notifications-page">
            <div class="header">
                <h1>🔔 الإشعارات</h1>
                <div class="actions">
                    <button onclick="APP.markAllNotificationsRead()">
                        📖 تحديد الكل كمقروء
                    </button>
                    <button onclick="APP.deleteAllNotifications()" class="btn-danger">
                        🗑️ حذف الكل
                    </button>
                    <button onclick="APP.showDashboard()" class="btn-outline btn-sm">
                        <i class="fas fa-arrow-right"></i> العودة
                    </button>
                </div>
            </div>
            ${unreadCount > 0 ? `<p style="color:var(--text2);margin-bottom:12px;">📬 لديك ${unreadCount} إشعار غير مقروء</p>` : ''}
            <div id="notificationsList">
                ${window.notifications.length === 0 ? `
                    <div class="empty-state">
                        <div class="icon">📭</div>
                        <h3>لا توجد إشعارات</h3>
                        <p>ستظهر هنا جميع الإشعارات الخاصة بك</p>
                    </div>
                ` : window.notifications.map(n => `
                    <div class="notification-item" onclick="APP.markNotificationRead('${n.id}')" style="border-right-color: ${n.read ? 'transparent' : 'var(--primary)'};">
                        <div class="icon">${n.icon || '📢'}</div>
                        <div class="content">
                            <div class="title">${escapeHtml(n.title)}</div>
                            <div class="desc">${escapeHtml(n.description || '')}</div>
                            <div class="time">${getTimeAgo(n.createdAt)} • ${formatTime(n.createdAt)}</div>
                        </div>
                        <div class="status ${n.read ? 'read' : 'unread'}">
                            ${n.read ? '✓ مقروء' : '● جديد'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function markNotificationRead(id) {
    if (!window.currentUser) return;
    try {
        await window.database.ref(`users/${window.currentUser.uid}/notifications/${id}/read`).set(true);
        const notif = window.notifications.find(n => n.id === id);
        if (notif) notif.read = true;
        updateNotificationBadge();
        showNotificationsPage();
    } catch (err) {
        console.error('Error marking notification read:', err);
    }
}

async function markAllNotificationsRead() {
    if (!window.currentUser) return;
    try {
        const updates = {};
        window.notifications.forEach(n => {
            if (!n.read) {
                updates[`users/${window.currentUser.uid}/notifications/${n.id}/read`] = true;
                n.read = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            await window.database.ref().update(updates);
        }
        updateNotificationBadge();
        showNotificationsPage();
        showToast('✅ تم تحديد الكل كمقروء', 'success');
    } catch (err) {
        console.error('Error marking all read:', err);
        showToast('حدث خطأ', 'error');
    }
}

async function deleteAllNotifications() {
    if (!window.currentUser) return;
    if (!confirm('⚠️ هل أنت متأكد من حذف جميع الإشعارات؟')) return;
    try {
        await window.database.ref(`users/${window.currentUser.uid}/notifications`).remove();
        window.notifications = [];
        updateNotificationBadge();
        showNotificationsPage();
        showToast('🗑️ تم حذف جميع الإشعارات', 'success');
    } catch (err) {
        console.error('Error deleting notifications:', err);
        showToast('حدث خطأ', 'error');
    }
}

async function addNotification(uid, title, description, icon = '📢') {
    try {
        const ref = window.database.ref(`users/${uid}/notifications`).push();
        await ref.set({
            id: ref.key,
            title: title,
            description: description,
            icon: icon,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error adding notification:', err);
    }
}

function loadLeaderboard() {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;

    window.database.ref('users').orderByChild('atoms').limitToLast(10).once('value', (snapshot) => {
        const users = [];
        snapshot.forEach((child) => {
            const data = child.val();
            users.push({
                id: child.key,
                name: data.name || 'مستخدم',
                atoms: data.atoms || 0,
                photoURL: data.photoURL || '',
                coursesCount: data.coursesCount || 0
            });
        });
        users.sort((a, b) => (b.atoms || 0) - (a.atoms || 0));
        renderLeaderboard(users);
    });
}

function renderLeaderboard(users) {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🏆</div>
                <h3>لا يوجد متصدرين حالياً</h3>
            </div>
        `;
        return;
    }

    const top5 = users.slice(0, 5);
    const top3 = top5.slice(0, 3);
    const rest = top5.slice(3);

    let podiumHtml = `<div class="leaderboard-podium">`;
    const podiumData = [
        { index: 1, user: top3[1], class: 'silver', rank: '🥈' },
        { index: 0, user: top3[0], class: 'gold', rank: '👑' },
        { index: 2, user: top3[2], class: 'bronze', rank: '🥉' }
    ];

    podiumData.forEach(p => {
        if (!p.user) return;
        const avatarHtml = p.user.photoURL ? 
            `<img src="${p.user.photoURL}" alt="${escapeHtml(p.user.name)}" loading="lazy">` : 
            (p.user.name || 'U')[0].toUpperCase();
        podiumHtml += `
            <div class="podium-item ${p.class}">
                ${p.class === 'gold' ? '<div class="crown">👑</div>' : ''}
                <div class="podium-rank">${p.rank}</div>
                <div class="podium-avatar">${avatarHtml}</div>
                <div class="podium-name">${escapeHtml(p.user.name)}</div>
                <div class="podium-atoms">⚛️ ${p.user.atoms || 0}</div>
                <div class="podium-base"></div>
            </div>
        `;
    });
    podiumHtml += `</div>`;

    let listHtml = `<div style="background:var(--card);border-radius:var(--radius-lg);border:1px solid var(--border);overflow:hidden;margin-top:8px;">`;
    rest.forEach((user, idx) => {
        const rank = idx + 4;
        const avatarHtml = user.photoURL ? 
            `<img src="${user.photoURL}" alt="${escapeHtml(user.name)}" loading="lazy">` : 
            (user.name || 'U')[0].toUpperCase();
        listHtml += `
            <div class="leaderboard-item">
                <div class="rank">#${rank}</div>
                <div class="avatar">${avatarHtml}</div>
                <div class="info">
                    <div class="name">${escapeHtml(user.name)}</div>
                    <div class="stats">📚 ${user.coursesCount || 0} كورس</div>
                </div>
                <div class="points">⚛️ ${user.atoms || 0}</div>
            </div>
        `;
    });
    listHtml += `</div>`;

    container.innerHTML = podiumHtml + listHtml;
}

function showLeaderboard() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.innerHTML = `
        <div style="max-width:1280px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة</button>
            <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);margin:12px 0 4px;">🏆 المتصدرين</h1>
            <p style="color:var(--text2);margin-bottom:16px;">أفضل 5 طلاب على المنصة</p>
            <div id="leaderboardContainer"></div>
            ${window.currentUser && window.userData ? `
                <div style="text-align:center;margin-top:16px;font-size:1.1rem;font-weight:700;color:var(--primary);">
                    ترتيبك الحالي: ${window.userData.rank || '--'}
                </div>
            ` : ''}
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadLeaderboard();
}

function showDashboard() {
    if (typeof window.Dashboard !== 'undefined' && window.Dashboard.showDashboard) {
        window.Dashboard.showDashboard();
    } else {
        const main = document.getElementById('mainContent');
        if (main) {
            main.innerHTML = `
                <div style="max-width:1280px;margin:0 auto;padding:20px;text-align:center;">
                    <div class="spinner" style="margin:0 auto;"></div>
                    <p style="margin-top:12px;color:var(--text2);font-weight:600;">جارٍ تحميل لوحة الطالب...</p>
                </div>
            `;
        }
    }
}

function showPrivacy() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة</button>
            <div class="card" style="padding:24px;margin-top:12px;">
                <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--primary);margin-bottom:16px;">🔒 سياسة الخصوصية</h1>
                <div style="color:var(--text);line-height:1.8;">
                    <p>نحن في منصة <strong>يلا كيمياء</strong> نولي خصوصية بياناتك أهمية كبيرة.</p>
                    <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);margin-top:16px;">📌 البيانات التي نجمعها</h3>
                    <ul style="list-style:disc;padding-right:20px;"><li>الاسم الكامل</li><li>البريد الإلكتروني</li><li>رقم الهاتف</li><li>الصف الدراسي</li><li>بيانات التقدم التعليمي</li></ul>
                    <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);margin-top:16px;">🔐 كيفية استخدام بياناتك</h3>
                    <ul style="list-style:disc;padding-right:20px;"><li>تقديم الخدمات التعليمية</li><li>تحسين تجربة المستخدم</li><li>إرسال إشعارات متعلقة بالمنصة</li><li>متابعة تقدمك التعليمي</li></ul>
                    <p style="font-size:0.85rem;color:var(--text2);margin-top:16px;">آخر تحديث: 2026</p>
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTerms() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة</button>
            <div class="card" style="padding:24px;margin-top:12px;">
                <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--primary);margin-bottom:16px;">📋 الشروط والأحكام</h1>
                <div style="color:var(--text);line-height:1.8;">
                    <p>مرحباً بك في منصة <strong>يلا كيمياء</strong>. باستخدامك للمنصة، فإنك توافق على الالتزام بهذه الشروط.</p>
                    <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);margin-top:16px;">📌 استخدام المنصة</h3>
                    <ul style="list-style:disc;padding-right:20px;"><li>الحساب مخصص للاستخدام الشخصي فقط</li><li>يجب استخدام المنصة للأغراض التعليمية فقط</li><li>يمنع إعادة نشر أو توزيع المحتوى التعليمي</li></ul>
                    <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);margin-top:16px;">🔒 الحساب والأمان</h3>
                    <ul style="list-style:disc;padding-right:20px;"><li>أنت مسؤول عن الحفاظ على سرية كلمة المرور والكود</li><li>يجب إبلاغ الإدارة فوراً في حالة اختراق الحساب</li></ul>
                    <p style="font-size:0.85rem;color:var(--text2);margin-top:16px;">آخر تحديث: 2026</p>
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadHomePage() {
    const main = document.getElementById('mainContent');
    if (!main) return;

    const isUser = window.currentUser !== null;

    main.innerHTML = `
        <section class="hero-section">
            <img src="https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593596/idraaak/x0xgxrk0kkxxgn73npal.png" 
                 alt="يلا كيمياء - المنصة التعليمية المتكاملة" 
                 class="hero-image" 
                 loading="eager" 
                 fetchpriority="high"
                 onerror="this.style.display='none'">
            
            <div style="text-align:center;margin-top:20px;">
                <h1 class="hero-title">ابدأ صح… وخلّي الكيمياء تبقى لعبتك 🔥</h1>
                <p class="hero-subtitle">مهما كان مستواك، هنا هتبدأ من الأول خالص… وهتمشي خطوة خطوة لحد ما توصل للفهم الحقيقي 💪</p>
                <div class="hero-actions">
                    ${isUser ? `
                        <button class="btn-primary" onclick="APP.scrollToCourses()">📚 كورساتي</button>
                        <button class="btn-primary" onclick="APP.showDashboard()" style="background:var(--gold);color:#081B2C;">👨‍🎓 لوحة الطالب</button>
                    ` : `
                        <a href="login.html" class="btn-primary">🚀 ابدأ التعلم الآن</a>
                        <a href="login.html" class="btn-outline">⚪ سجل دخول</a>
                    `}
                </div>
            </div>
        </section>

        <section class="video-section">
            <h2 class="video-title">تفاصيل بداية المنهج وتفاصيل المنصة | خطة الكيمياء الكاملة لطلاب دفعة 2027 مع مستر زياد مبروك</h2>
            <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/0PFWAzIJTOQ?si=fFqTokTKwqo1ZHMz" 
                        title="تفاصيل المنصة" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen>
                </iframe>
            </div>
        </section>

        <section style="max-width:1280px;margin:0 auto;padding:0 20px 24px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;background:var(--card);border-radius:var(--radius-lg);padding:20px;border:1px solid var(--border);">
                <div style="text-align:center;">
                    <i class="fab fa-youtube" style="font-size:2rem;color:var(--accent);display:block;margin-bottom:4px;"></i>
                    <span style="font-family:'Lalezar',cursive;font-size:1.8rem;color:var(--gold);display:block;">+88,000</span>
                    <span style="font-size:0.8rem;color:var(--text2);">🎥 مشاهدة</span>
                </div>
                <div style="text-align:center;">
                    <i class="fab fa-telegram-plane" style="font-size:2rem;color:var(--accent);display:block;margin-bottom:4px;"></i>
                    <span style="font-family:'Lalezar',cursive;font-size:1.8rem;color:var(--gold);display:block;">2,300+</span>
                    <span style="font-size:0.8rem;color:var(--text2);">📢 عضو</span>
                </div>
                <div style="text-align:center;">
                    <i class="fab fa-whatsapp" style="font-size:2rem;color:var(--accent);display:block;margin-bottom:4px;"></i>
                    <span style="font-family:'Lalezar',cursive;font-size:1.8rem;color:var(--gold);display:block;">1,000+</span>
                    <span style="font-size:0.8rem;color:var(--text2);">🟢 عضو</span>
                </div>
            </div>
        </section>

        <section style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">
                <div style="order:2;">
                    <img src="https://res.cloudinary.com/dwiovjdrb/image/upload/v1781445273/%D8%A7%D9%87%D9%84%D8%A7_%D8%A8%D8%B1%D8%AC%D9%88%D8%B9%D9%83_%D9%8A_%D8%A8%D9%8A%D9%87_e7j5jv.jpg" alt="أهلاً برجوعك" style="width:100%;height:auto;border-radius:var(--radius-lg);object-fit:cover;aspect-ratio:4/3;" loading="lazy" onerror="this.style.display='none'">
                </div>
                <div style="order:1;">
                    <h2 style="font-size:clamp(1.5rem,3vw,2.5rem);font-weight:900;color:var(--text);margin-bottom:12px;">👋 أهلاً برجوعك يا بيه</h2>
                    <p style="font-size:1rem;color:var(--text2);margin-bottom:8px;font-weight:600;">أنت دلوقتي قدام فرصة تبدأ صح، سواء كنت في أولى ثانوي أو تانية ثانوي ولسه حاسس إن الكيمياء صعبة أو إن عليك أجزاء كتير.</p>
                    <p style="font-size:0.95rem;color:var(--primary2);margin-bottom:8px;">دوري هنا إني أخليك تدخل تالتة ثانوي وأنت فاهم الأساسيات كويس جدًا، ويمكن تبقى أقوى من ناس بدأت قبلك بوقت كبير.</p>
                    <p style="font-size:0.95rem;color:var(--text2);margin-bottom:16px;">كل اللي محتاجه منك هو الالتزام، وهتشوف بنفسك الفرق في مستواك خطوة بخطوة لحد ما الكيمياء تبقى من أسهل المواد بالنسبة لك.</p>
                    ${isUser ? `
                        <button class="btn-primary" onclick="APP.scrollToCourses()">📚 استكشف الكورسات</button>
                    ` : `
                        <a href="login.html" class="btn-primary">ابدأ رحلتك الآن 🚀</a>
                    `}
                </div>
            </div>
        </section>

        <section style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">
                <div>
                    <img src="https://res.cloudinary.com/dwiovjdrb/image/upload/v1781444602/%D9%84%D9%8A%D9%87_%D8%AA%D8%AA%D8%AA%D8%A7%D8%A8%D8%B9_%D8%B2%D9%8A%D8%A7%D8%AF_mexro9.png" alt="ليه تتابع" style="width:100%;height:auto;border-radius:var(--radius-lg);object-fit:cover;aspect-ratio:4/3;" loading="lazy" onerror="this.style.display='none'">
                </div>
                <div>
                    <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,3vw,2.5rem);color:var(--text);margin-bottom:12px;">ليه تتابع منصة يلا كيمياء؟</h2>
                    <p style="font-size:1rem;color:var(--text2);margin-bottom:8px;">المستر بيبدأ معاك من الصفر… واحدة واحدة… من غير تعقيد… لحد ما تبقى فاهم بجد 💡</p>
                    <p style="font-size:1.5rem;font-weight:900;color:var(--primary);margin-bottom:8px;">من Zero ➝ Hero 🔥</p>
                    <p style="font-style:italic;font-size:1rem;color:var(--primary2);margin-bottom:16px;">⚠️ تحذير: ممكن تدمن الكيمياء معانا 😏</p>
                    ${isUser ? `
                        <button class="btn-primary" onclick="APP.scrollToCourses()">📚 استكشف الكورسات</button>
                    ` : `
                        <a href="login.html" class="btn-primary">خليني أفهم 🧠</a>
                    `}
                </div>
            </div>
        </section>

        <section style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">
                <div style="order:2;">
                    <img src="https://res.cloudinary.com/dwiovjdrb/image/upload/v1781445017/Gemini_Generated_Image_51u16a51u16a51u1_jzaejt.png" alt="مستر زياد مبروك" style="width:100%;height:auto;border-radius:var(--radius-lg);object-fit:cover;aspect-ratio:4/3;" loading="lazy" onerror="this.style.display='none'">
                </div>
                <div style="order:1;">
                    <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,3vw,2.5rem);color:var(--text);margin-bottom:12px;">👨‍🏫 مستر زياد مبروك</h2>
                    <p style="font-size:1rem;color:var(--text2);margin-bottom:12px;">🧪 شرح مبسط وسهل | 📚 محتوى منظم | 🚀 متابعة مستمرة</p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <span style="padding:4px 14px;border-radius:50px;font-weight:600;font-size:0.8rem;background:var(--bg);color:var(--primary);">🧪 شرح مبسط</span>
                        <span style="padding:4px 14px;border-radius:50px;font-weight:600;font-size:0.8rem;background:var(--bg);color:var(--primary);">📚 محتوى منظم</span>
                        <span style="padding:4px 14px;border-radius:50px;font-weight:600;font-size:0.8rem;background:var(--bg);color:var(--primary);">🚀 متابعة مستمرة</span>
                    </div>
                </div>
            </div>
        </section>

        <section id="coursesSection" style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);text-align:center;color:var(--text);margin-bottom:4px;">📚 الكورسات المتاحة</h2>
            <p style="text-align:center;color:var(--text2);margin-bottom:12px;">اختر صفك الدراسي وابدأ التعلم</p>
            
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px;">
                <button class="btn-filter active" data-grade="all" onclick="APP.filterCoursesByGrade('all')">📚 جميع الصفوف</button>
                <button class="btn-filter" data-grade="أولى ثانوي" onclick="APP.filterCoursesByGrade('أولى ثانوي')">📖 أولى ثانوي</button>
                <button class="btn-filter" data-grade="تانية ثانوي" onclick="APP.filterCoursesByGrade('تانية ثانوي')">📖 تانية ثانوي</button>
                <button class="btn-filter" data-grade="تالتة ثانوي" onclick="APP.filterCoursesByGrade('تالتة ثانوي')">📖 تالتة ثانوي</button>
            </div>
            
            <div style="max-width:400px;margin:0 auto 16px;position:relative;">
                <input type="text" id="courseSearch" placeholder="🔍 ابحث عن كورس..." 
                       style="width:100%;padding:8px 16px;padding-right:40px;border-radius:50px;border:2px solid var(--border);background:var(--card);color:var(--text);font-family:'Cairo',sans-serif;font-size:0.9rem;outline:none;transition:var(--transition);" 
                       oninput="APP.filterCourses()">
                <i class="fas fa-search" style="position:absolute;top:50%;right:14px;transform:translateY(-50%);color:var(--text2);"></i>
            </div>
            
            <div class="grid-courses" id="coursesGrid">
                <div class="card skeleton" style="height:320px;"></div>
                <div class="card skeleton" style="height:320px;"></div>
                <div class="card skeleton" style="height:320px;"></div>
            </div>
        </section>

        <section style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);text-align:center;color:var(--text);margin-bottom:4px;">💬 آراء الطلاب</h2>
            <p style="text-align:center;color:var(--text2);margin-bottom:16px;">ماذا يقول طلابنا عن المنصة</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
                <div class="testimonial-card"><div class="stars">⭐⭐⭐⭐⭐</div><p>"شكراً يا مستر ❤️ امتحان الأزهر كله تقريباً جه من فيديو الـ150 سؤال"</p><div class="name">أحمد محمد</div></div>
                <div class="testimonial-card"><div class="stars">⭐⭐⭐⭐⭐</div><p>"المراجعة النهائية كانت جامدة جداً، لخصتلي المنهج كله"</p><div class="name">محمد خالد</div></div>
                <div class="testimonial-card"><div class="stars">⭐⭐⭐⭐⭐</div><p>"كنت بخاف من الكيمياء جداً، لكن طريقة الشرح خلت المادة أسهل"</p><div class="name">ملك أحمد</div></div>
                <div class="testimonial-card"><div class="stars">⭐⭐⭐⭐⭐</div><p>"الفضل بعد ربنا يرجع ليك يا مستر ❤️"</p><div class="name">فاطمة علي</div></div>
                <div class="testimonial-card"><div class="stars">⭐⭐⭐⭐⭐</div><p>"الشرح بسيط ومنظم، وكل حصة بحس إني فاهمة أكتر"</p><div class="name">إسراء محمود</div></div>
            </div>
        </section>

        <section id="leaderboardSection" style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);text-align:center;color:var(--text);margin-bottom:4px;">🏆 المتصدرين</h2>
            <p style="text-align:center;color:var(--text2);margin-bottom:12px;">أفضل الطلاب في منصة يلا كيمياء</p>
            <div id="leaderboardContainer">
                <div class="card skeleton" style="height:400px;"></div>
            </div>
            ${!isUser ? `
                <div style="text-align:center;margin-top:16px;">
                    <a href="login.html" class="btn-primary">🚀 انضم وكن من المتصدرين</a>
                </div>
            ` : ''}
        </section>

        <section style="max-width:800px;margin:0 auto;padding:0 20px 32px;">
            <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);text-align:center;color:var(--text);margin-bottom:4px;">❓ أسئلة شائعة</h2>
            <p style="text-align:center;color:var(--text2);margin-bottom:16px;">كل اللي محتاج تعرفه عن المنصة</p>
            <div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>📝 كيف أسجل في المنصة؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">يقوم الطالب بإدخال:<br>• الاسم بالكامل<br>• البريد الإلكتروني<br>• رقم الهاتف<br>• كلمة المرور<br><br>ثم يتم إنشاء الحساب مباشرة.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>🔐 إذا كان لدي حساب بالفعل كيف أسجل الدخول؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">قم بإدخال:<br>• البريد الإلكتروني<br>• كلمة المرور<br><br>ثم اضغط على تسجيل الدخول.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>🎯 هل المنصة مناسبة للمبتدئين؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">نعم، تم تصميم المنصة لتبدأ مع الطالب من الصفر حتى الاحتراف خطوة بخطوة.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>🔄 هل يتم إضافة محتوى جديد باستمرار؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">نعم، يتم إضافة حصص وكورسات وامتحانات جديدة بشكل دوري.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>🏆 ما هو ترتيب المتصدرين؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">يتم ترتيب المتصدرين تلقائيًا حسب عدد الذرات التي جمعها كل طالب، ويتم تحديث الترتيب باستمرار مع أي تغيير في رصيد الذرات.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>⚛️ ما هي الذرات؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">الذرات هي نظام المكافآت داخل منصة يلا كيمياء، يحصل عليها الطالب من خلال حل الامتحانات والكويزات وإكمال الحصص والكورسات، وتُستخدم في ترتيب المتصدرين وتحفيز الطلاب على الاستمرار.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>🎯 كيف يمكنني الحصول على الذرات؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">يمكنك جمع الذرات عن طريق:<br>• إكمال الكورسات بالكامل<br>• إنهاء جميع الحصص<br>• دخول الامتحانات<br>• حل الكويزات<br>• تسليم الواجبات<br>• الالتزام بالدراسة والمتابعة المستمرة مع المستر<br><br>كلما زاد نشاطك داخل المنصة، زاد عدد الذرات التي تحصل عليها.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>❌ هل يمكن أن أخسر الذرات؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">لا، الذرات يتم اكتسابها فقط كمكافآت على الإنجاز، ولا يتم خصمها إلا إذا قررت إدارة المنصة ذلك في حالات خاصة.</div></div>
                <div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')"><span>💎 هل الذرات لها فائدة؟</span><i class="fas fa-chevron-down"></i></div><div class="faq-answer">نعم، كلما جمعت ذرات أكثر:<br>• يرتفع ترتيبك في المتصدرين<br>• تحصل على شارات وإنجازات<br>• تزيد فرص ظهورك ضمن أفضل الطلاب</div></div>
            </div>
        </section>

        <section style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);text-align:center;color:var(--text);margin-bottom:4px;">📢 شارك المنصة مع أصحابك</h2>
            <p style="text-align:center;color:var(--text2);margin-bottom:16px;">انشر الرابط وساعد غيرك يتعلم الكيمياء بسهولة</p>
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                <button class="btn-primary" style="background:#25D366;" onclick="APP.share('whatsapp')"><i class="fab fa-whatsapp"></i> واتساب</button>
                <button class="btn-primary" style="background:#229ED9;" onclick="APP.share('telegram')"><i class="fab fa-telegram-plane"></i> تيليجرام</button>
                <button class="btn-primary" style="background:#1877F2;" onclick="APP.share('facebook')"><i class="fab fa-facebook"></i> فيسبوك</button>
            </div>
        </section>

        <section style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
            <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);text-align:center;color:var(--text);margin-bottom:16px;">انضم لمجتمعنا 🚀</h2>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
                <a href="https://t.me/yala_kamya_ziad_mabrok" target="_blank" rel="noopener" class="social-card">
                    <i class="fab fa-telegram-plane" style="color:#229ED9;"></i>
                    <span>تيليجرام</span>
                    <div style="font-size:0.7rem;color:var(--text2);">2,300+ عضو</div>
                </a>
                <a href="https://whatsapp.com/channel/0029VbCAgCt5K3zMurVaeF1w/621" target="_blank" rel="noopener" class="social-card">
                    <i class="fab fa-whatsapp" style="color:#25D366;"></i>
                    <span>واتساب</span>
                    <div style="font-size:0.7rem;color:var(--text2);">1,000+ عضو</div>
                </a>
                <a href="https://youtube.com/channel/UCi5O6yRE_0EThRbspiryP3w" target="_blank" rel="noopener" class="social-card">
                    <i class="fab fa-youtube" style="color:#FF0000;"></i>
                    <span>يوتيوب</span>
                    <div style="font-size:0.7rem;color:var(--text2);">88,000+ مشاهدة</div>
                </a>
                <a href="https://www.tiktok.com/@mr.ziad.mabrok?_r=1&_t=ZS-98AOGuwUPrU" target="_blank" rel="noopener" class="social-card">
                    <i class="fab fa-tiktok" style="color:#000000;"></i>
                    <span>تيك توك</span>
                    <div style="font-size:0.7rem;color:var(--text2);">تابعنا الآن</div>
                </a>
            </div>
        </section>

        ${!isUser ? `
            <section id="ctaSection" style="max-width:1280px;margin:0 auto;padding:0 20px 32px;">
                <div class="card" style="padding:32px 24px;text-align:center;">
                    <h2 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,3vw,2.5rem);color:var(--text);margin-bottom:8px;">🚀 ابدأ رحلتك الآن</h2>
                    <p style="color:var(--text2);margin-bottom:20px;max-width:500px;margin-left:auto;margin-right:auto;">انضم إلى آلاف الطلاب الذين بدأوا رحلتهم في الكيمياء مع مستر زياد مبروك</p>
                    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
                        <a href="login.html" class="btn-primary">✨ إنشاء حساب مجاناً</a>
                        <a href="login.html" class="btn-outline">🔑 تسجيل الدخول</a>
                    </div>
                </div>
            </section>
        ` : ''}
    `;

    if (typeof loadCourses === 'function') loadCourses();
    if (typeof loadLeaderboard === 'function') loadLeaderboard();
}

function formatTime(date) {
    if (!date) return '--';
    const d = new Date(date);
    return d.toLocaleDateString('ar') + ' ' + d.toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'});
}

function getTimeAgo(date) {
    if (!date) return '';
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 7) return formatTime(date);
    if (days > 0) return days + ' يوم مضت';
    if (hours > 0) return hours + ' ساعة مضت';
    if (minutes > 0) return minutes + ' دقيقة مضت';
    return 'الآن';
}

window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.showHome = showHome;
window.scrollToCourses = scrollToCourses;
window.shareOn = shareOn;
window.showCompletedModal = showCompletedModal;
window.closeCompletedModal = closeCompletedModal;
window.openImageZoom = openImageZoom;
window.closeImageZoom = closeImageZoom;
window.loadNotifications = loadNotifications;
window.updateNotificationBadge = updateNotificationBadge;
window.showNotificationsPage = showNotificationsPage;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.deleteAllNotifications = deleteAllNotifications;
window.addNotification = addNotification;
window.loadLeaderboard = loadLeaderboard;
window.showLeaderboard = showLeaderboard;
window.showDashboard = showDashboard;
window.showPrivacy = showPrivacy;
window.showTerms = showTerms;
window.loadHomePage = loadHomePage;
window.formatTime = formatTime;
window.getTimeAgo = getTimeAgo;
