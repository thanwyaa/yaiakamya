// ============================================================
// DASHBOARD MODULE - Student Dashboard
// ============================================================

window.Dashboard = {
    showDashboard: function() {
        if (!window.currentUser) {
            showLoginOverlay();
            return;
        }

        const main = document.getElementById('mainContent');
        if (!main) return;

        const safeUserData = window.userData || {};
        const safeProgress = window.userCourseProgress || {};

        const name = safeUserData.name || 'طالب';
        const email = safeUserData.email || window.auth.currentUser?.email || '';
        const code = safeUserData.code || '---';
        const grade = safeUserData.grade || 'لم يحدد';
        const studyType = safeUserData.studyType || 'عام';
        const atoms = safeUserData.atoms || 0;
        const photoURL = safeUserData.photoURL || '';
        const streak = safeUserData.streak || 0;
        const studyTime = safeUserData.studyTime || 0;
        const phone = safeUserData.phone || 'لم يحدد';
        const parentPhone = safeUserData.parentPhone || 'لم يحدد';

        let watchedCount = 0, quizCount = 0, examCount = 0;
        Object.values(safeProgress).forEach(p => {
            if (p.watched) watchedCount++;
            if (p.completed) {
                if (p.type === 'quiz') quizCount++;
                if (p.type === 'exam') examCount++;
            }
        });

        const subscribedCourses = window.allCourses.filter(c => isUserSubscribed(c.id));
        
        let totalLessonsAll = 0;
        window.allCourses.forEach(c => {
            const lessons = window.allLessons.filter(l => l.courseId === c.id);
            totalLessonsAll += lessons.length;
        });
        
        const lessonProgress = totalLessonsAll > 0 ? Math.round((watchedCount / totalLessonsAll) * 100) : 0;
        
        let certificateCount = 0;
        for (const c of window.allCourses) {
            const lessons = window.allLessons.filter(l => l.courseId === c.id);
            const completed = lessons.filter(l => safeProgress[l.id]?.watched);
            if (lessons.length > 0 && completed.length === lessons.length) {
                certificateCount++;
            }
        }
        
        // Error bank count
        let errorCount = 0;
        window.database.ref('users/' + window.currentUser.uid + '/errorBank').once('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (Array.isArray(data)) {
                    errorCount = data.filter(e => !e.solved).length;
                }
            }
            renderDashboardWithErrors(errorCount);
        });

        let rank = '--';
        window.database.ref('users').orderByChild('atoms').startAt((window.userData?.atoms || 0) + 1).once('value', (snapshot) => {
            const rankNum = snapshot.numChildren() + 1;
            rank = '#' + rankNum;
        }).catch(() => {
            rank = '--';
        });

        function renderDashboardWithErrors(errorCount) {
            const avatarHtml = photoURL ? 
                `<img src="${photoURL}" alt="صورة" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" loading="lazy">` : 
                (name || 'U')[0].toUpperCase();

            main.innerHTML = `
                <div style="max-width:1280px;margin:0 auto;padding:16px;">
                    <button class="btn-outline btn-sm no-print" onclick="APP.showHome()">
                        <i class="fas fa-arrow-right"></i> العودة
                    </button>

                    <div class="card" style="padding:28px;margin:12px 0 20px;background:linear-gradient(135deg, var(--primary), var(--primary2));color:#fff;border:none;border-radius:var(--radius-lg);">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
                            <div style="width:110px;height:110px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3.5rem;font-weight:700;background:rgba(255,255,255,0.2);color:#fff;overflow:hidden;border:4px solid rgba(255,255,255,0.4);cursor:pointer;transition:var(--transition);" 
                                 onclick="APP.uploadProfilePhoto()" title="اضغط لتغيير الصورة">
                                ${avatarHtml}
                            </div>
                            <h2 style="font-family:'Lalezar',cursive;font-size:2.2rem;margin:0;">${escapeHtml(name)}</h2>
                            <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;font-size:0.95rem;opacity:0.95;">
                                <span style="background:rgba(255,255,255,0.15);padding:4px 16px;border-radius:20px;">🔑 ${escapeHtml(code)}</span>
                                <span style="background:rgba(255,255,255,0.15);padding:4px 16px;border-radius:20px;">🎓 ${escapeHtml(grade)}</span>
                                <span style="background:rgba(255,255,255,0.15);padding:4px 16px;border-radius:20px;">📚 ${escapeHtml(studyType)}</span>
                                <span style="background:rgba(255,255,255,0.15);padding:4px 16px;border-radius:20px;">📱 ${formatPhoneNumber(phone)}</span>
                            </div>
                            <div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:6px;">
                                <span style="background:rgba(255,255,255,0.2);padding:6px 20px;border-radius:20px;font-weight:700;">⚛️ ${atoms} ذرة</span>
                                <span style="background:rgba(255,255,255,0.2);padding:6px 20px;border-radius:20px;font-weight:700;">🏆 ${rank}</span>
                                <span style="background:rgba(255,255,255,0.2);padding:6px 20px;border-radius:20px;font-weight:700;">🔥 ${streak} يوم</span>
                                <span style="background:rgba(255,255,255,0.2);padding:6px 20px;border-radius:20px;font-weight:700;">⏱ ${studyTime} س</span>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:20px;">
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#0B4F8C;"><span class="number">${lessonProgress}%</span></div>
                            <div class="label">نسبة الإنجاز</div>
                        </div>
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#22C55E;"><span class="number">${subscribedCourses.length}</span></div>
                            <div class="label">الكورسات</div>
                        </div>
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#F59E0B;"><span class="number">${watchedCount}</span></div>
                            <div class="label">الحصص</div>
                        </div>
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#8B5CF6;"><span class="number">${studyTime}</span></div>
                            <div class="label">ساعات الدراسة</div>
                        </div>
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#22C55E;"><span class="number">${quizCount}</span></div>
                            <div class="label">الكويزات</div>
                        </div>
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#F59E0B;"><span class="number">${examCount}</span></div>
                            <div class="label">الامتحانات</div>
                        </div>
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#FFD60A;color:#081B2C;"><span class="number">${certificateCount}</span></div>
                            <div class="label">الشهادات</div>
                        </div>
                        <div class="stat-circle-card">
                            <div class="circle" style="background:#EF4444;"><span class="number">${errorCount}</span></div>
                            <div class="label">الأخطاء</div>
                        </div>
                    </div>

                    ${subscribedCourses.length > 0 ? `
                        <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);margin-bottom:8px;">📚 كورساتي</h3>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:16px;">
                            ${subscribedCourses.map(c => `
                                <div class="card" style="padding:14px;cursor:pointer;border-radius:var(--radius);" onclick="APP.openCoursePage('${c.id}')">
                                    <h4 style="font-weight:700;color:var(--text);font-size:0.9rem;">${escapeHtml(c.title)}</h4>
                                    <span style="font-size:0.7rem;color:var(--success);">✔ مشترك</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="card" style="padding:20px;text-align:center;margin-bottom:16px;">
                            <p style="color:var(--text2);">📚 ليس لديك كورسات مشترك فيها حالياً</p>
                            <button class="btn-primary btn-sm no-print" style="margin-top:8px;" onclick="APP.scrollToCourses()">استكشف الكورسات</button>
                        </div>
                    `}

                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
                        <button class="btn-primary btn-sm no-print" onclick="APP.showErrorBank()"><i class="fas fa-exclamation-triangle"></i> أخطائي</button>
                        <button class="btn-primary btn-sm no-print" style="background:var(--gold);color:#081B2C;" onclick="APP.showAchievements()"><i class="fas fa-medal"></i> إنجازاتي</button>
                        <button class="btn-outline btn-sm no-print" onclick="APP.showCertificate()"><i class="fas fa-certificate"></i> شهادتي</button>
                        <button class="btn-outline btn-sm no-print" onclick="APP.showStudentCard()"><i class="fas fa-id-card"></i> بطاقتي</button>
                        <button class="btn-outline btn-sm no-print" onclick="APP.showAIInsights()"><i class="fas fa-robot"></i> تحليل المستوى</button>
                        <button class="btn-outline btn-sm no-print" onclick="APP.showResults()"><i class="fas fa-chart-bar"></i> نتائجي</button>
                    </div>
                </div>
            `;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    uploadProfilePhoto: function() {
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

            showToast('⏳ جاري رفع الصورة...', 'info');

            try {
                const compressedFile = await compressImage(file, 300, 300);
                const storageRef = window.storage.ref();
                const imageRef = storageRef.child(`profile_photos/${window.currentUser.uid}/profile.jpg`);
                const snapshot = await imageRef.put(compressedFile);
                const downloadURL = await snapshot.ref.getDownloadURL();

                await window.database.ref('users/' + window.currentUser.uid + '/photoURL').set(downloadURL);
                if (window.userData) window.userData.photoURL = downloadURL;
                if (window.cache) window.cache.userData = window.userData;
                updateCache();
                showToast('✅ تم تحديث الصورة الشخصية بنجاح', 'success');

                const avatar = document.getElementById('userAvatar');
                if (avatar) avatar.innerHTML = `<img src="${downloadURL}" alt="صورة" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                this.showDashboard();

            } catch (err) {
                console.error('Error uploading photo:', err);
                showToast('❌ حدث خطأ في رفع الصورة: ' + err.message, 'error');
            }
        };
        input.click();
    }
};
