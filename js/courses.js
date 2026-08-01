// ============================================================
// COURSES MODULE - Courses, Lessons, Videos, Progress
// ============================================================

window.allCourses = [];
window.allLessons = [];
window.userSubscriptions = [];
window.userCourseProgress = {};
window.currentGradeFilter = 'all';
window.videoWatchTotal = {};
window.activeVideoLessonId = null;
window.videoWatchStartTime = null;
window.videoWatchInterval = null;

let dataLoading = false;
let dataLoaded = false;

function loadCourses() {
    if (dataLoaded && window.cache.courses && window.cache.courses.length > 0) {
        window.allCourses = window.cache.courses;
        renderCourses(window.allCourses);
        return;
    }
    
    if (dataLoading) return;
    dataLoading = true;

    window.database.ref('courses').orderByChild('order').once('value', (snapshot) => {
        try {
            window.allCourses = [];
            snapshot.forEach((child) => {
                const data = child.val();
                window.allCourses.push({
                    id: child.key,
                    ...data,
                    studentsCount: data.studentsCount || data.students || 0,
                    lessonsCount: data.lessonsCount || data.lessons || 0
                });
            });
            window.allCourses.sort((a, b) => (a.order || 0) - (b.order || 0));
            window.cache.courses = window.allCourses;
            updateCache();
            renderCourses(window.allCourses);
            dataLoaded = true;
            dataLoading = false;
        } catch (err) {
            console.error('Error loading courses:', err);
            dataLoading = false;
        }
    }).catch(err => {
        console.error('Firebase error loading courses:', err);
        dataLoading = false;
    });
}

function loadLessons() {
    if (dataLoaded && window.cache.lessons && window.cache.lessons.length > 0) {
        window.allLessons = window.cache.lessons;
        console.log('📚 تم تحميل الحصص من الكاش:', window.allLessons.length);
        return;
    }
    
    if (dataLoading) return;
    dataLoading = true;

    window.database.ref('lessons').orderByChild('order').once('value', (snapshot) => {
        try {
            window.allLessons = [];
            snapshot.forEach((child) => {
                const data = child.val();
                const lesson = { 
                    id: child.key, 
                    ...data,
                    courseId: data.courseId || data.course_id || data.parentCourse || data.parent_course || data.course || ''
                };
                window.allLessons.push(lesson);
            });
            
            console.log('📚 تم تحميل الحصص:', window.allLessons.length);
            console.log('📚 عينة من الحصص:', window.allLessons.slice(0, 3));
            
            window.cache.lessons = window.allLessons;
            updateCache();
            dataLoading = false;
            
            renderCourses(window.allCourses);
            
        } catch (err) {
            console.error('❌ Error loading lessons:', err);
            dataLoading = false;
        }
    }).catch((err) => {
        console.error('❌ Firebase error loading lessons:', err);
        dataLoading = false;
    });
}

function loadExams() {
    if (dataLoaded && window.cache.exams && window.cache.exams.length > 0) {
        window.allExams = window.cache.exams;
        return;
    }
    
    if (dataLoading) return;

    window.database.ref('exams').once('value', (snapshot) => {
        try {
            window.allExams = [];
            snapshot.forEach((child) => {
                const data = child.val();
                window.allExams.push({ id: child.key, ...data });
            });
            window.cache.exams = window.allExams;
            updateCache();
        } catch (err) {
            console.error('Error loading exams:', err);
        }
    }).catch(err => {
        console.error('Firebase error loading exams:', err);
    });
}

function loadQuizzes() {
    if (dataLoaded && window.cache.quizzes && window.cache.quizzes.length > 0) {
        window.allQuizzes = window.cache.quizzes;
        return;
    }
    
    if (dataLoading) return;

    window.database.ref('quizzes').once('value', (snapshot) => {
        try {
            window.allQuizzes = [];
            snapshot.forEach((child) => {
                const data = child.val();
                window.allQuizzes.push({ id: child.key, ...data });
            });
            window.cache.quizzes = window.allQuizzes;
            updateCache();
        } catch (err) {
            console.error('Error loading quizzes:', err);
        }
    }).catch(err => {
        console.error('Firebase error loading quizzes:', err);
    });
}

function loadUserSubscriptions(uid) {
    if (window.cache.subscriptions && window.cache.subscriptions.length > 0 && isCacheValid()) {
        window.userSubscriptions = window.cache.subscriptions;
        renderCourses(window.allCourses);
        return;
    }

    window.database.ref('courseSubscriptions').orderByChild('userId').equalTo(uid).once('value', (snapshot) => {
        try {
            window.userSubscriptions = [];
            snapshot.forEach((child) => {
                const data = child.val();
                if (data.status === 'active') {
                    window.userSubscriptions.push({ id: child.key, ...data });
                }
            });
            window.cache.subscriptions = window.userSubscriptions;
            updateCache();
            renderCourses(window.allCourses);
        } catch (err) {
            console.error('Error loading subscriptions:', err);
        }
    }).catch(err => {
        console.error('Firebase error loading subscriptions:', err);
    });
}

function loadUserProgress(uid) {
    if (window.cache.progress && Object.keys(window.cache.progress).length > 0 && isCacheValid()) {
        window.userCourseProgress = window.cache.progress;
        return;
    }

    window.database.ref('users/' + uid + '/progress').once('value', (snapshot) => {
        try {
            if (snapshot.exists()) {
                window.userCourseProgress = snapshot.val();
            } else {
                window.userCourseProgress = {};
            }
            window.cache.progress = window.userCourseProgress;
            updateCache();
        } catch (err) {
            console.error('Error loading progress:', err);
        }
    }).catch(err => {
        console.error('Firebase error loading progress:', err);
    });
}

function renderCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="icon">📚</div>
                <h3>لا توجد كورسات متاحة حالياً</h3>
                <p>سيتم إضافة الكورسات قريباً</p>
                <button class="btn-primary btn-sm" style="margin-top:12px;" onclick="APP.validateLessonBinding()">
                    🔍 التحقق من الربط
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = courses.map(c => {
        const lessons = window.allLessons.filter(l => {
            const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
            return lCourseId === c.id;
        });
        
        const completed = lessons.filter(l => window.userCourseProgress[l.id]?.watched);
        const isCompleted = lessons.length > 0 && completed.length === lessons.length;
        
        console.log(`📚 كورس: ${c.title} (${c.id}) - عدد الحصص: ${lessons.length}`);

        const subscribed = window.currentUser ? isUserSubscribed(c.id) : false;
        const hasPremium = window.currentUser ? hasPremiumAccess(c.id) : false;
        const isLocked = !window.currentUser || (!subscribed && !hasPremium && c.isFree === false);
        const isFree = c.isFree !== false;
        const priceDisplay = isFree ? 'مجاني' : (c.price || 'مدفوع');

        return `
            <div class="card ${isCompleted ? 'card-completed' : ''}" style="cursor:pointer;position:relative;" 
                 onclick="${isCompleted ? `APP.showCompletedModal()` : `APP.openCoursePage('${c.id}')`}">
                <div style="position:relative;overflow:hidden;">
                    <img src="${c.image || 'https://placehold.co/600x400/1a1f2e/0B4F8C?text=كورس'}" 
                         alt="${escapeHtml(c.title) || 'كورس'}" 
                         class="card-img" 
                         loading="lazy"
                         onerror="this.src='https://placehold.co/600x400/1a1f2e/0B4F8C?text=كورس'">
                    <div style="position:absolute;top:12px;right:12px;display:flex;gap:6px;z-index:2;flex-wrap:wrap;">
                        <span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:${isFree ? 'var(--success)' : 'var(--gold)'};color:${isFree ? '#fff' : '#081B2C'};font-weight:700;">
                            ${isFree ? '🆓 مجاني' : '💰 مدفوع'}
                        </span>
                        ${!isFree ? `<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:var(--gold);color:#081B2C;font-weight:700;">${escapeHtml(priceDisplay)}</span>` : ''}
                        ${isLocked ? '<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:rgba(0,0,0,0.7);color:#fff;font-weight:700;">🔒</span>' : ''}
                        ${isCompleted ? '<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:var(--success);color:#fff;font-weight:700;">✅ مكتمل</span>' : ''}
                        ${lessons.length === 0 ? '<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:var(--warning);color:#081B2C;font-weight:700;">⚠️ لا توجد حصص</span>' : ''}
                    </div>
                    ${isLocked ? `<div class="lock-overlay"><span class="lock-text">🔒 هذا الكورس مدفوع</span></div>` : ''}
                    ${isCompleted ? `<div class="completed-overlay"><div class="check">✅</div><div class="label">مكتمل</div></div>` : ''}
                </div>
                <div class="card-body">
                    <h3 style="font-weight:800;font-size:1.2rem;color:var(--text);margin-bottom:4px;">${escapeHtml(c.title) || 'كورس'}</h3>
                    <p style="font-size:0.85rem;color:var(--text2);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(c.description) || ''}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:4px 10px;font-size:0.7rem;color:var(--text2);margin-bottom:8px;border-top:1px solid var(--border);padding-top:6px;">
                        <span>🎯 ${c.grade || 'كل الصفوف'}</span>
                        <span>📚 ${lessons.length} حصة</span>
                        ${!isFree ? `<span style="font-weight:700;color:var(--gold-dark);">💰 ${escapeHtml(priceDisplay)}</span>` : ''}
                    </div>
                    ${window.currentUser ? `
                        ${subscribed || hasPremium ? `
                            <button class="btn-primary" style="width:100%;justify-content:center;font-size:0.8rem;padding:6px 12px;background:${isCompleted ? 'var(--success)' : 'var(--primary2)'};" onclick="event.stopPropagation(); ${isCompleted ? `APP.showCompletedModal()` : `APP.openCoursePage('${c.id}')`}">
                                ${isCompleted ? '✅ مكتمل' : '📖 متابعة'}
                            </button>
                        ` : `
                            <button class="btn-primary" style="width:100%;justify-content:center;font-size:0.8rem;padding:6px 12px;" onclick="event.stopPropagation(); APP.openCoursePage('${c.id}')">
                                ${isFree ? '📝 اشترك الآن' : '💰 اشترِ الآن'}
                            </button>
                        `}
                    ` : `
                        <button class="btn-primary" style="width:100%;justify-content:center;font-size:0.8rem;padding:6px 12px;" onclick="event.stopPropagation(); APP.showLoginOverlay()">
                            🔒 اشترك الآن
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function isUserSubscribed(courseId) {
    return window.userSubscriptions && window.userSubscriptions.some(sub => sub.courseId === courseId && sub.status === 'active');
}

function filterCoursesByGrade(grade) {
    window.currentGradeFilter = grade;
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.grade === grade) {
            btn.classList.add('active');
        }
    });
    filterCourses();
}

function filterCourses() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;
    const q = document.getElementById('courseSearch')?.value?.toLowerCase() || '';
    let filtered = window.allCourses.filter(c => {
        const matchesSearch = (c.title || '').toLowerCase().includes(q) || 
                             (c.description || '').toLowerCase().includes(q);
        let matchesGrade = true;
        if (window.currentGradeFilter !== 'all') {
            matchesGrade = (c.grade || '').includes(window.currentGradeFilter);
        }
        return matchesSearch && matchesGrade;
    });
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="icon">📚</div>
                <h3>لا توجد كورسات</h3>
                <p>${window.currentGradeFilter !== 'all' ? `(الصف: ${window.currentGradeFilter})` : ''}</p>
            </div>
        `;
    } else {
        renderCourses(filtered);
    }
}

async function subscribeToCourse(courseId) {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }
    if (isUserSubscribed(courseId)) {
        showToast('✅ أنت مشترك بالفعل في هذا الكورس', 'info');
        return;
    }
    try {
        const courseSnap = await window.database.ref('courses/' + courseId).once('value');
        if (!courseSnap.exists()) {
            showToast('⚠️ الكورس غير موجود', 'error');
            return;
        }
        const course = courseSnap.val();
        if (course.isFree === false) {
            showPremiumPage(course);
            return;
        }
        const newRef = window.database.ref('courseSubscriptions').push();
        await newRef.set({
            userId: window.currentUser.uid,
            courseId: courseId,
            status: 'active',
            subscribedAt: new Date().toISOString()
        });
        const courseData = window.allCourses.find(c => c.id === courseId);
        if (courseData) {
            await window.database.ref('courses/' + courseId + '/studentsCount').transaction((current) => {
                return (current || 0) + 1;
            });
            courseData.studentsCount = (courseData.studentsCount || 0) + 1;
        }
        window.userSubscriptions.push({
            id: newRef.key,
            userId: window.currentUser.uid,
            courseId: courseId,
            status: 'active',
            subscribedAt: new Date().toISOString()
        });
        window.cache.subscriptions = window.userSubscriptions;
        updateCache();
        showToast('🎉 تم الاشتراك في الكورس بنجاح!', 'success');
        renderCourses(window.allCourses);
        if (typeof addNotification === 'function') {
            await addNotification(window.currentUser.uid, '📚 تم الاشتراك في كورس جديد!', `لقد اشتركت في كورس "${courseData?.title || courseId}" بنجاح.`, '📚');
        }
    } catch (err) {
        console.error('❌ Subscription error:', err);
        showToast('❌ حدث خطأ أثناء الاشتراك: ' + err.message, 'error');
    }
}

async function openCoursePage(courseId) {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }
    const hasAccess = await checkCourseAccess(courseId);
    if (!hasAccess) return;

    const main = document.getElementById('mainContent');
    if (!main) return;

    const course = window.allCourses.find(c => c.id === courseId);
    if (!course) {
        showToast('الكورس غير موجود', 'error');
        return;
    }

    main.innerHTML = `
        <div style="max-width:1280px;margin:0 auto;padding:20px;text-align:center;">
            <div class="spinner" style="margin:0 auto;"></div>
            <p style="margin-top:12px;color:var(--text2);font-weight:600;">جارٍ تجهيز المحتوى...</p>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        const lessons = window.allLessons.filter(l => {
            const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
            return lCourseId === courseId;
        });
        lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

        console.log(`📚 كورس: ${course.title} - تم العثور على ${lessons.length} حصة`);

        let completedCount = 0;
        let totalAtoms = 0;
        lessons.forEach(l => {
            if (window.userCourseProgress[l.id]?.watched) completedCount++;
            totalAtoms += (l.atomsReward || 5);
        });
        const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

        const isFree = course.isFree !== false;
        const priceDisplay = isFree ? 'مجاني' : (course.price || 'مدفوع');

        let motivationalMessage = '';
        if (progressPercent === 100) motivationalMessage = '🎉 مبروك! أكملت الكورس بالكامل! أنت رائع!';
        else if (progressPercent >= 75) motivationalMessage = '🔥 اقتربت من إنهاء الكورس! بقيت لك ' + (lessons.length - completedCount) + ' حصص فقط!';
        else if (progressPercent >= 50) motivationalMessage = '💪 أحسنت! أكملت نصف الكورس، استمر!';
        else if (progressPercent >= 25) motivationalMessage = '🌟 أحسنت! أكملت 25% من الكورس!';
        else if (completedCount > 0) motivationalMessage = '📚 بداية ممتازة! أكملت ' + completedCount + ' حصص!';
        else motivationalMessage = '🚀 ابدأ رحلتك في هذا الكورس اليوم!';

        let lessonsHtml = lessons.map((lesson, idx) => {
            const isCompleted = window.userCourseProgress[lesson.id]?.watched || false;
            const statusText = isCompleted ? '✅ مكتملة' : '⏳ قيد التقدم';
            
            let contentItems = [];
            
            if (lesson.videoUrl) {
                contentItems.push({
                    type: 'video',
                    icon: 'video',
                    iconClass: 'video',
                    title: '▶ مشاهدة الشرح',
                    action: `APP.openLessonVideo('${lesson.id}')`,
                    completed: isCompleted
                });
            }
            
            if (lesson.pdfUrl) {
                contentItems.push({
                    type: 'pdf',
                    icon: 'pdf',
                    iconClass: 'pdf',
                    title: '📄 تحميل الملزمة',
                    action: `window.open('${lesson.pdfUrl}','_blank')`,
                    completed: false
                });
            }
            
            if (lesson.hasAssignment) {
                const isAssignmentCompleted = window.userCourseProgress['assignment_' + lesson.id]?.completed || false;
                contentItems.push({
                    type: 'assignment',
                    icon: 'assignment',
                    iconClass: 'assignment',
                    title: '📝 واجب الحصة',
                    action: `APP.openLessonAssignment('${lesson.id}')`,
                    completed: isAssignmentCompleted
                });
            }
            
            if (lesson.hasQuiz) {
                const isQuizCompleted = window.userCourseProgress['quiz_' + lesson.id]?.completed || false;
                contentItems.push({
                    type: 'quiz',
                    icon: 'quiz',
                    iconClass: 'quiz',
                    title: '🧪 حل كويز الحصة',
                    action: `APP.openLessonQuiz('${lesson.id}')`,
                    completed: isQuizCompleted
                });
            }
            
            if (lesson.hasExam) {
                const isExamCompleted = window.userCourseProgress['exam_' + lesson.id]?.completed || false;
                contentItems.push({
                    type: 'exam',
                    icon: 'exam',
                    iconClass: 'exam',
                    title: '🎓 الامتحان الشامل',
                    action: `APP.openLessonExam('${lesson.id}')`,
                    completed: isExamCompleted
                });
            }

            const contentHtml = contentItems.length > 0 ? `
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
                    ${contentItems.map(item => `
                        <div class="lesson-content-item ${item.completed ? 'completed-item' : ''}" onclick="${item.action}">
                            <div class="item-icon ${item.iconClass}"><i class="fas fa-${item.icon === 'video' ? 'play' : item.icon === 'pdf' ? 'file-pdf' : item.icon === 'assignment' ? 'tasks' : item.icon === 'quiz' ? 'puzzle-piece' : 'file-alt'}"></i></div>
                            <div class="item-text"><div class="title">${item.title}</div></div>
                            ${item.completed ? '<span class="completed-badge">✅ مكتمل</span>' : ''}
                            <i class="fas fa-chevron-left" style="color:var(--text2);font-size:0.7rem;"></i>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            return `
                <div class="lesson-container">
                    <div class="lesson-header" onclick="this.parentElement.classList.toggle('open')">
                        <div style="display:flex;align-items:center;">
                            <span class="lesson-num">${idx + 1}</span>
                            <span>${escapeHtml(lesson.title)}</span>
                            <span style="font-size:0.7rem;color:var(--text2);margin-right:8px;">${statusText}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:0.7rem;color:var(--text2);">⭐ ${lesson.atomsReward || 5}</span>
                            <span class="toggle-icon"><i class="fas fa-chevron-down"></i></span>
                        </div>
                    </div>
                    <div class="lesson-body">
                        ${contentHtml || '<div style="margin-top:12px;color:var(--text2);font-size:0.85rem;text-align:center;">لا يوجد محتوى لهذه الحصة</div>'}
                    </div>
                </div>
            `;
        }).join('');

        main.innerHTML = `
            <div style="max-width:1280px;margin:0 auto;padding:20px;">
                <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة</button>

                <div class="course-page-hero" style="margin-top:12px;">
                    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
                        ${course.image ? `<img src="${course.image}" alt="${escapeHtml(course.title)}" style="width:160px;height:160px;border-radius:var(--radius);object-fit:cover;border:3px solid rgba(255,255,255,0.3);" loading="lazy">` : ''}
                        <div style="flex:1;">
                            <h1 style="font-size:2rem;">${escapeHtml(course.title)}</h1>
                            <p style="font-size:1rem;">${escapeHtml(course.description) || ''}</p>
                            <div class="stats">
                                <span><i class="fas fa-video"></i> ${lessons.length} حصة</span>
                                <span><i class="fas fa-atom"></i> ${totalAtoms} ذرة ممكنة</span>
                                <span><i class="fas fa-clock"></i> ${Math.round(lessons.reduce((s, l) => s + parseInt(l.duration || '0'), 0) / 60)} ساعة</span>
                                <span class="price-tag ${isFree ? 'free' : 'paid'}">${isFree ? '🆓 مجاني' : '💰 ' + priceDisplay}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="motivational-message">
                    <span class="emoji">${motivationalMessage.split(' ')[0]}</span>
                    ${motivationalMessage}
                </div>

                <div style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:4px;">
                        <span style="color:var(--text2);">نسبة الإكمال</span>
                        <span style="color:var(--primary);font-weight:700;">${progressPercent}%</span>
                    </div>
                    <div class="progress-bar"><div class="fill" style="width:${progressPercent}%;"></div></div>
                </div>

                <h3 style="font-weight:700;font-size:1.2rem;color:var(--primary);margin-bottom:12px;">📚 قائمة الحصص</h3>
                ${lessonsHtml || '<div class="empty-state"><div class="icon">📚</div><h3>لا توجد حصص</h3><button class="btn-primary btn-sm" style="margin-top:12px;" onclick="APP.showLessonDebug()">🔍 التحقق من الربط</button></div>'}
            </div>
        `;
    } catch (error) {
        console.error('openCoursePage error:', error);
        main.innerHTML = `
            <div style="max-width:1280px;margin:0 auto;padding:20px;text-align:center;">
                <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
                <h3 style="font-weight:700;color:var(--text);">حدث خطأ في تحميل الكورس</h3>
                <p style="color:var(--text2);">${error.message}</p>
                <button class="btn-primary no-print" style="margin-top:12px;" onclick="APP.showHome()">🏠 العودة</button>
                <button class="btn-outline btn-sm" style="margin-top:8px;" onclick="APP.showLessonDebug()">🔍 التحقق من الربط</button>
            </div>
        `;
    }
}

function clearVideoTracking() {
    if (window.videoWatchInterval) {
        clearInterval(window.videoWatchInterval);
        window.videoWatchInterval = null;
    }
    
    if (window.activeVideoLessonId && window.videoWatchStartTime) {
        const elapsed = (Date.now() - window.videoWatchStartTime) / 1000;
        if (elapsed > 5) {
            window.videoWatchTotal[window.activeVideoLessonId] = (window.videoWatchTotal[window.activeVideoLessonId] || 0) + elapsed;
            
            const studyHours = elapsed / 3600;
            if (window.currentUser) {
                window.database.ref('users/' + window.currentUser.uid + '/studyTime').transaction((current) => {
                    return (current || 0) + studyHours;
                });
                if (window.userData) {
                    window.userData.studyTime = (window.userData.studyTime || 0) + studyHours;
                    window.cache.userData = window.userData;
                    updateCache();
                }
            }
        }
    }
    window.activeVideoLessonId = null;
    window.videoWatchStartTime = null;
}

function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function completeLessonWatch(lessonId, lesson) {
    try {
        if (window.userCourseProgress[lessonId]?.watched) return;

        const atomsReward = lesson.atomsReward || 5;
        const userRef = window.database.ref('users/' + window.currentUser.uid);
        const userSnap = await userRef.once('value');
        
        if (userSnap.exists()) {
            const currentAtoms = userSnap.val().atoms || 0;
            const duration = lesson.duration || 15;
            
            let actualWatchTime = window.videoWatchTotal[lessonId] || 0;
            if (actualWatchTime < duration * 60) {
                actualWatchTime = duration * 60;
            }
            const studyHours = actualWatchTime / 3600;
            
            let currentStudyTime = userSnap.val().studyTime || 0;
            
            await window.database.ref('users/' + window.currentUser.uid + '/progress/' + lessonId).set({
                watched: true,
                watchPercent: 100,
                completedAt: new Date().toISOString(),
                lastPosition: 0,
                type: 'lesson',
                watchDuration: actualWatchTime
            });
            
            const lastStudyDate = userSnap.val().lastStudyDate;
            const today = new Date().toDateString();
            let streak = userSnap.val().streak || 0;
            
            if (lastStudyDate === today) {
                // already today
            } else if (lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
                streak++;
            } else {
                streak = 1;
            }
            
            await userRef.update({ 
                atoms: currentAtoms + atomsReward,
                videosWatched: (userSnap.val().videosWatched || 0) + 1,
                lessonsCompleted: (userSnap.val().lessonsCompleted || 0) + 1,
                streak: streak,
                lastStudyDate: today,
                studyTime: currentStudyTime + studyHours
            });
            
            if (window.userData) {
                window.userData.atoms = currentAtoms + atomsReward;
                window.userData.videosWatched = (window.userData.videosWatched || 0) + 1;
                window.userData.lessonsCompleted = (window.userData.lessonsCompleted || 0) + 1;
                window.userData.streak = streak;
                window.userData.lastStudyDate = today;
                window.userData.studyTime = currentStudyTime + studyHours;
                window.cache.userData = window.userData;
                updateCache();
            }
            
            delete window.videoWatchTotal[lessonId];
            
            animateAtoms('atomsCount', currentAtoms + atomsReward);
            animateAtoms('userAtomsCount', currentAtoms + atomsReward);
            showToast(`🎉 +${atomsReward} ذرة! (أكملت مشاهدة ${lesson.title})`, 'success');
            
            if (typeof addNotification === 'function') {
                await addNotification(window.currentUser.uid, '🎥 تم إكمال مشاهدة حصة!', `أكملت مشاهدة "${lesson.title}" وحصلت على ${atomsReward} ذرة.`, '🎥');
            }
            
            loadUserProgress(window.currentUser.uid);
            checkCourseCompletion(lesson.courseId);
        }
    } catch (err) {
        console.error('Error completing lesson watch:', err);
    }
}

async function checkCourseCompletion(courseId) {
    const lessons = window.allLessons.filter(l => {
        const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
        return lCourseId === courseId;
    });
    const completed = lessons.filter(l => window.userCourseProgress[l.id]?.watched);
    if (lessons.length > 0 && completed.length === lessons.length) {
        const course = window.allCourses.find(c => c.id === courseId);
        if (course && typeof addNotification === 'function') {
            await addNotification(window.currentUser.uid, '🎓 تم إكمال كورس كامل!', `مبروك! لقد أكملت كورس "${course.title}" بالكامل!`, '🎓');
        }
    }
}

async function openLessonVideo(lessonId) {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    try {
        const snapshot = await window.database.ref('lessons/' + lessonId).once('value');
        if (!snapshot.exists()) {
            showToast('الحصة غير موجودة', 'error');
            return;
        }
        const lesson = snapshot.val();

        const videoIdYt = extractYouTubeId(lesson.videoUrl || '');
        const course = window.allCourses.find(c => c.id === lesson.courseId);
        const courseName = course ? course.title : 'الكورس';

        clearVideoTracking();
        window.activeVideoLessonId = lessonId;
        window.videoWatchStartTime = Date.now();
        if (!window.videoWatchTotal[lessonId]) window.videoWatchTotal[lessonId] = 0;

        window.videoWatchInterval = setInterval(() => {
            if (window.activeVideoLessonId && window.videoWatchStartTime) {
                const elapsed = (Date.now() - window.videoWatchStartTime) / 1000;
                if (elapsed > 5) {
                    window.videoWatchTotal[lessonId] = (window.videoWatchTotal[lessonId] || 0) + elapsed;
                    window.videoWatchStartTime = Date.now();
                    
                    const studyHours = elapsed / 3600;
                    window.database.ref('users/' + window.currentUser.uid + '/studyTime').transaction((current) => {
                        return (current || 0) + studyHours;
                    });
                    if (window.userData) {
                        window.userData.studyTime = (window.userData.studyTime || 0) + studyHours;
                        window.cache.userData = window.userData;
                        updateCache();
                    }
                }
            }
        }, 5000);

        main.innerHTML = `
            <div style="max-width:900px;margin:0 auto;padding:16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:0.85rem;color:var(--text2);flex-wrap:wrap;">
                    <button class="btn-outline btn-sm no-print" onclick="APP.openCoursePage('${lesson.courseId}')" style="padding:4px 12px;">
                        <i class="fas fa-arrow-right"></i> ${escapeHtml(courseName)}
                    </button>
                    <span style="color:var(--border);">/</span>
                    <span style="font-weight:600;color:var(--text);">${escapeHtml(lesson.title)}</span>
                </div>

                <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.3rem,2.5vw,2rem);color:var(--text);margin-bottom:12px;">🎥 ${escapeHtml(lesson.title)}</h1>

                <div style="margin-bottom:12px;">
                    ${videoIdYt ? `
                        <div class="card" style="padding:0;overflow:hidden;">
                            <div style="position:relative;padding-bottom:56.25%;height:0;background:#000;">
                                <iframe id="videoFrame" src="https://www.youtube.com/embed/${videoIdYt}?enablejsapi=1" 
                                        style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
                                        allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <div class="icon">🎥</div>
                            <h3>لا يوجد فيديو لهذه الحصة</h3>
                        </div>
                    `}
                </div>

                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="btn-outline btn-sm no-print" onclick="${videoIdYt ? `APP.handleVideoExit('${lessonId}', ${JSON.stringify(lesson).replace(/"/g, '&quot;')})` : `APP.openCoursePage('${lesson.courseId}')`}">📚 العودة للكورس</button>
                    <button class="btn-outline btn-sm no-print" onclick="APP.showHome()">🏠 الرئيسية</button>
                </div>
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('openLessonVideo error:', error);
        showToast('حدث خطأ في تحميل الفيديو', 'error');
        showHome();
    }
}

function handleVideoExit(lessonId, lesson) {
    clearVideoTracking();
    if (window.videoWatchTotal[lessonId] >= 900 && !window.userCourseProgress[lessonId]?.watched) {
        completeLessonWatch(lessonId, lesson);
    }
    openCoursePage(lesson.courseId);
}

async function openLessonAssignment(lessonId) {
    if (!window.currentUser) { showLoginOverlay(); return; }
    
    const progressKey = 'assignment_' + lessonId;
    
    if (window.userCourseProgress[progressKey]?.completed) {
        showCompletedModal();
        return;
    }
    
    try {
        const snapshot = await window.database.ref('assignments/' + lessonId).once('value');
        if (!snapshot.exists()) {
            showToast('الواجب غير موجود', 'error');
            return;
        }
        const assign = { id: lessonId, ...snapshot.val() };
        const main = document.getElementById('mainContent');
        if (!main) return;
        main.innerHTML = `
            <div style="max-width:800px;margin:0 auto;padding:20px;">
                <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="font-family:'Lalezar',cursive;font-size:1.5rem;color:var(--text);margin:12px 0 4px;">📚 ${escapeHtml(assign.title)}</h2>
                <p style="color:var(--text2);margin-bottom:12px;">${escapeHtml(assign.description) || ''}</p>
                <div class="card" style="padding:16px;margin-bottom:12px;">
                    <p style="color:var(--text);"><strong>الدرجة:</strong> ${assign.grade || 10}</p>
                    <p style="color:var(--text);"><strong>الحالة:</strong> <span style="color:var(--warning);">⏳ في انتظار التقييم</span></p>
                    ${assign.content ? `<div style="margin-top:8px;padding:12px;background:var(--bg);border-radius:var(--radius);color:var(--text);">${escapeHtml(assign.content)}</div>` : ''}
                    <button class="btn-primary" style="margin-top:12px;width:100%;" onclick="APP.completeAssignment('${lessonId}')">
                        <i class="fas fa-check"></i> تسليم الواجب
                    </button>
                </div>
                <div style="text-align:center;"><button class="btn-primary no-print" onclick="APP.showHome()">🏠 العودة للرئيسية</button></div>
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error('openLessonAssignment error:', err);
        showToast('حدث خطأ في تحميل الواجب', 'error');
    }
}

async function completeAssignment(lessonId) {
    if (!window.currentUser) return;
    
    const progressKey = 'assignment_' + lessonId;
    
    if (window.userCourseProgress[progressKey]?.completed) {
        showCompletedModal();
        return;
    }
    
    try {
        const atomsReward = 10;
        const userRef = window.database.ref('users/' + window.currentUser.uid);
        const userSnap = await userRef.once('value');
        
        if (userSnap.exists()) {
            const currentAtoms = userSnap.val().atoms || 0;
            
            await window.database.ref('users/' + window.currentUser.uid + '/progress/' + progressKey).set({
                completed: true,
                completedAt: new Date().toISOString(),
                type: 'assignment',
                atomsAwarded: atomsReward
            });
            
            const resultRef = window.database.ref('users/' + window.currentUser.uid + '/results').push();
            await resultRef.set({
                title: 'واجب الحصة',
                type: 'assignment',
                score: 100,
                totalQuestions: 1,
                correctAnswers: 1,
                wrongAnswers: 0,
                timeSpent: 0,
                atomsEarned: atomsReward,
                completedAt: new Date().toISOString(),
                lessonId: lessonId
            });
            
            await userRef.update({ atoms: currentAtoms + atomsReward });
            if (window.userData) window.userData.atoms = currentAtoms + atomsReward;
            window.cache.userData = window.userData;
            updateCache();
            
            animateAtoms('atomsCount', currentAtoms + atomsReward);
            animateAtoms('userAtomsCount', currentAtoms + atomsReward);
            
            if (typeof addNotification === 'function') {
                await addNotification(window.currentUser.uid, '📝 تم تسليم الواجب!', `حصلت على ${atomsReward} ذرة لتسليم الواجب.`, '📝');
            }
            showToast(`🎉 +${atomsReward} ذرة! تم تسليم الواجب بنجاح.`, 'success');
            
            const main = document.getElementById('mainContent');
            if (main) {
                main.innerHTML = `<div style="max-width:800px;margin:0 auto;padding:20px;text-align:center;">
                    <div style="font-size:4rem;">✅</div>
                    <h2 style="font-family:'Lalezar',cursive;font-size:1.8rem;color:var(--success);">تم تسليم الواجب بنجاح!</h2>
                    <p style="color:var(--text2);margin-top:8px;">حصلت على ${atomsReward} ذرة.</p>
                    <button class="btn-primary" style="margin-top:16px;" onclick="APP.showHome()">🏠 العودة للرئيسية</button>
                </div>`;
            }
        }
    } catch (err) {
        console.error('Error completing assignment:', err);
        showToast('حدث خطأ في تسليم الواجب', 'error');
    }
}

function animateAtoms(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 600;
    const startTime = Date.now();

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (target - start) * progress);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
    }
    update();
}

window.loadCourses = loadCourses;
window.loadLessons = loadLessons;
window.loadExams = loadExams;
window.loadQuizzes = loadQuizzes;
window.loadUserSubscriptions = loadUserSubscriptions;
window.loadUserProgress = loadUserProgress;
window.renderCourses = renderCourses;
window.isUserSubscribed = isUserSubscribed;
window.filterCoursesByGrade = filterCoursesByGrade;
window.filterCourses = filterCourses;
window.subscribeToCourse = subscribeToCourse;
window.openCoursePage = openCoursePage;
window.clearVideoTracking = clearVideoTracking;
window.extractYouTubeId = extractYouTubeId;
window.completeLessonWatch = completeLessonWatch;
window.checkCourseCompletion = checkCourseCompletion;
window.openLessonVideo = openLessonVideo;
window.handleVideoExit = handleVideoExit;
window.openLessonAssignment = openLessonAssignment;
window.completeAssignment = completeAssignment;
window.animateAtoms = animateAtoms;
