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

// ============================================================
// LOAD FUNCTIONS
// ============================================================
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
        return;
    }
    
    if (dataLoading) return;

    window.database.ref('lessons').orderByChild('order').once('value', (snapshot) => {
        try {
            window.allLessons = [];
            snapshot.forEach((child) => {
                const data = child.val();
                window.allLessons.push({ id: child.key, ...data });
            });
            window.cache.lessons = window.allLessons;
            updateCache();
        } catch (err) {
            console.error('Error loading lessons:', err);
        }
    }).catch(err => {
        console.error('Firebase error loading lessons:', err);
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

// ============================================================
// RENDER COURSES
// ============================================================
function renderCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="icon">📚</div>
                <h3>لا توجد كورسات متاحة حالياً</h3>
                <p>سيتم إضافة الكورسات قريباً</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = courses.map(c => {
        const subscribed = window.currentUser ? isUserSubscribed(c.id) : false;
        const hasPremium = window.currentUser ? hasPremiumAccess(c.id) : false;
        const isLocked = !window.currentUser || (!subscribed && !hasPremium && c.isFree === false);
        const isFree = c.isFree !== false;
        const priceDisplay = isFree ? 'مجاني' : (c.price || 'مدفوع');
        
        const lessons = window.allLessons.filter(l => l.courseId === c.id);
        const completed = lessons.filter(l => window.userCourseProgress[l.id]?.watched);
        const isCompleted = lessons.length > 0 && completed.length === lessons.length;

        return `
            <div class="card ${isCompleted ? 'card-completed' : ''}" style="cursor:pointer;position:relative;" onclick="${isCompleted ? `APP.showCompletedModal()` : `APP.openCoursePage('${c.id}')`}">
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
                    </div>
                    ${isLocked ? `<div class="lock-overlay"><span class="lock-text">🔒 هذا الكورس مدفوع</span></div>` : ''}
                    ${isCompleted ? `<div class="completed-overlay"><div class="check">✅</div><div class="label">مكتمل</div></div>` : ''}
                </div>
                <div class="card-body">
                    <h3 style="font-weight:800;font-size:1.2rem;color:var(--text);margin-bottom:4px;">${escapeHtml(c.title) || 'كورس'}</h3>
                    <p style="font-size:0.85rem;color:var(--text2);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(c.description) || ''}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:4px 10px;font-size:0.7rem;color:var(--text2);margin-bottom:8px;border-top:1px solid var(--border);padding-top:6px;">
                        <span>🎯 ${c.grade || 'كل الصفوف'}</span>
                        <span>📚 ${c.lessonsCount || 0} حصة</span>
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

// ============================================================
// OPEN COURSE PAGE (مختصر للحفاظ على المساحة)
// ============================================================
async function openCoursePage(courseId) {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }
    const hasAccess = await checkCourseAccess(courseId);
    if (!hasAccess) return;

    // ... باقي الكود كما هو ...
}

// ============================================================
// EXPOSE COURSES FUNCTIONS
// ============================================================
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
