// ============================================================
// DASHBOARD MODULE - Student Dashboard
// ============================================================

window.Dashboard = {};

function showDashboard() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    const safeData = window.userData || {};
    const safeProgress = window.userCourseProgress || {};
    
    const atoms = safeData.atoms || 0;
    const progress = safeData.progress || 0;
    const name = safeData.name || 'طالب';
    const code = safeData.code || '---';
    const grade = safeData.grade || 'لم يحدد';
    const studyType = safeData.studyType || 'عام';
    const phone = safeData.phone || 'لم يحدد';
    const parentPhone = safeData.parentPhone || 'لم يحدد';
    const streak = safeData.streak || 0;
    const studyTime = safeData.studyTime || 0;
    const videosWatched = safeData.videosWatched || 0;
    const lessonsCompleted = safeData.lessonsCompleted || 0;
    const examsPassed = safeData.examsPassed || 0;
    const quizzesPassed = safeData.quizzesPassed || 0;
    const perfectExams = safeData.perfectExams || 0;
    const rank = safeData.rank || '--';
    
    let coursesCompleted = 0;
    let totalLessons = 0;
    window.allCourses.forEach(c => {
        const lessons = window.allLessons.filter(l => {
            const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
            return lCourseId === c.id;
        });
        const completed = lessons.filter(l => safeProgress[l.id]?.watched);
        if (lessons.length > 0 && completed.length === lessons.length) {
            coursesCompleted++;
        }
        totalLessons += lessons.length;
    });
    
    const completedLessons = Object.values(safeProgress).filter(p => p.watched).length;
    const lessonProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const achievements = getAchievements();
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalAchievements = achievements.length;

    main.innerHTML = `
        <div style="max-width:1280px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showHome()">
                <i class="fas fa-arrow-right"></i> العودة
            </button>
            
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin:12px 0 16px;">
                <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);">
                    👨‍🎓 لوحة الطالب
                </h1>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn-primary btn-sm no-print" onclick="APP.scrollToCourses()">
                        📚 كورساتي
                    </button>
                    <button class="btn-primary btn-sm no-print" onclick="APP.showAIInsights()" style="background:var(--gold);color:#081B2C;">
                        🤖 تحليل المستوى
                    </button>
                    <button class="btn-primary btn-sm no-print" onclick="APP.showLessonDebug()" style="background:var(--warning);color:#081B2C;">
                        🔍 التحقق من الربط
                    </button>
                </div>
            </div>

            <div class="card" style="padding:20px;margin-bottom:16px;">
                <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
                    <div style="display:flex;align-items:center;gap:16px;">
                        <div style="width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;background:var(--primary);color:#fff;overflow:hidden;">
                            ${safeData.photoURL ? `<img src="${safeData.photoURL}" style="width:100%;height:100%;object-fit:cover;">` : (name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight:700;font-size:1.2rem;color:var(--text);">${escapeHtml(name)}</div>
                            <div style="font-size:0.85rem;color:var(--text2);">🔑 ${escapeHtml(code)}</div>
                            <div style="font-size:0.85rem;color:var(--text2);">🎓 ${escapeHtml(grade)} • ${escapeHtml(studyType)}</div>
                        </div>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-right:auto;">
                        <div style="text-align:center;padding:4px 12px;background:var(--bg);border-radius:var(--radius);">
                            <div style="font-size:0.7rem;color:var(--text2);">الذرات</div>
                            <div style="font-weight:700;font-size:1.5rem;color:var(--gold-dark);">${atoms}</div>
                        </div>
                        <div style="text-align:center;padding:4px 12px;background:var(--bg);border-radius:var(--radius);">
                            <div style="font-size:0.7rem;color:var(--text2);">الترتيب</div>
                            <div style="font-weight:700;font-size:1.5rem;color:var(--primary);">${rank}</div>
                        </div>
                        <div style="text-align:center;padding:4px 12px;background:var(--bg);border-radius:var(--radius);">
                            <div style="font-size:0.7rem;color:var(--text2);">الإنجازات</div>
                            <div style="font-weight:700;font-size:1.5rem;color:var(--success);">${unlockedCount}/${totalAchievements}</div>
                        </div>
                    </div>
                </div>
                <div style="margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
                        <span style="color:var(--text2);">نسبة الإنجاز</span>
                        <span style="font-weight:700;color:var(--primary);">${lessonProgress}%</span>
                    </div>
                    <div class="progress-bar"><div class="fill" style="width:${lessonProgress}%;"></div></div>
                </div>
            </div>

            <div class="grid-dashboard" style="margin-bottom:16px;">
                <div class="stat-circle-card">
                    <div class="circle" style="background:var(--primary);"><span class="number">${streak}</span></div>
                    <div class="label">🔥 أيام متتالية</div>
                </div>
                <div class="stat-circle-card">
                    <div class="circle" style="background:var(--gold-dark);"><span class="number">${studyTime}</span></div>
                    <div class="label">⏱️ ساعات الدراسة</div>
                </div>
                <div class="stat-circle-card">
                    <div class="circle" style="background:var(--success);"><span class="number">${coursesCompleted}</span></div>
                    <div class="label">🎓 كورسات مكتملة</div>
                </div>
                <div class="stat-circle-card">
                    <div class="circle" style="background:var(--warning);"><span class="number">${examsPassed}</span></div>
                    <div class="label">📝 امتحانات</div>
                </div>
                <div class="stat-circle-card">
                    <div class="circle" style="background:#8B5CF6;"><span class="number">${quizzesPassed}</span></div>
                    <div class="label">🧪 كويزات</div>
                </div>
                <div class="stat-circle-card">
                    <div class="circle" style="background:var(--danger);"><span class="number">${perfectExams}</span></div>
                    <div class="label">💯 امتحانات ممتازة</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px;">
                <button class="btn-primary btn-sm" onclick="APP.showErrorBank()" style="background:var(--danger);">❌ أخطائي</button>
                <button class="btn-primary btn-sm" onclick="APP.showResults()" style="background:var(--warning);color:#081B2C;">📊 نتائجي</button>
                <button class="btn-primary btn-sm" onclick="APP.showStudentCard()" style="background:var(--primary2);">🪪 بطاقتي</button>
                <button class="btn-primary btn-sm" onclick="APP.showAchievements()" style="background:var(--gold);color:#081B2C;">🏅 إنجازاتي</button>
                <button class="btn-primary btn-sm" onclick="APP.showCertificate()" style="background:var(--success);">📜 شهاداتي</button>
                <button class="btn-primary btn-sm" onclick="APP.showLeaderboard()" style="background:var(--primary);">🏆 المتصدرين</button>
                <button class="btn-primary btn-sm" onclick="APP.showLessonDebug()" style="background:var(--warning);color:#081B2C;">🔍 التحقق من الربط</button>
            </div>

            <h3 style="font-weight:700;font-size:1.1rem;color:var(--text);margin-bottom:8px;">🏅 آخر الإنجازات</h3>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                ${achievements.filter(a => a.unlocked).slice(0, 5).map(a => `
                    <span style="padding:4px 12px;border-radius:20px;background:var(--gold);color:#081B2C;font-size:0.75rem;font-weight:600;">${a.icon} ${a.name}</span>
                `).join('')}
                ${unlockedCount === 0 ? '<span style="color:var(--text2);font-size:0.85rem;">لم تحصل على أي إنجاز بعد، استمر في التعلم!</span>' : ''}
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function uploadProfilePhoto() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            showToast('⚠️ حجم الصورة يجب أن يكون أقل من 2 ميجابايت', 'error');
            return;
        }
        
        try {
            showToast('⏳ جاري رفع الصورة...', 'info');
            const storageRef = window.storage.ref('profile_photos/' + window.currentUser.uid);
            const snapshot = await storageRef.put(file);
            const url = await snapshot.ref.getDownloadURL();
            
            await window.database.ref('users/' + window.currentUser.uid + '/photoURL').set(url);
            if (window.userData) {
                window.userData.photoURL = url;
                window.cache.userData = window.userData;
                updateCache();
            }
            updateUserUI(window.userData);
            showToast('✅ تم تحديث الصورة بنجاح', 'success');
            showDashboard();
        } catch (err) {
            console.error('Upload error:', err);
            showToast('❌ حدث خطأ في رفع الصورة', 'error');
        }
    };
    input.click();
}

window.Dashboard.showDashboard = showDashboard;
window.Dashboard.uploadProfilePhoto = uploadProfilePhoto;
window.showDashboard = showDashboard;
window.uploadProfilePhoto = uploadProfilePhoto;
